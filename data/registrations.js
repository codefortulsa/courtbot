require("../config");
var manager = require("../utils/db/manager");
var knex = manager.knex();
var caseData = require("../caseData");
var messages = require("../utils/messages");
var moment = require("moment-timezone");

module.exports.registrationState = {
  UNBOUND: 0,
  ASKED_PARTY: 1,
  ASKED_REMINDER: 2,
  REMINDING: 3,
  UNSUBSCRIBED: 4
}

module.exports.getRegistrations = function(state) {
  var query = knex("registrations")
    .where("state", "=", state);

  return query;
}


module.exports.getRegistrationsForUser = function(phone) {
  var query = knex("registrations")
    .where("phone", "=", phone);

  return query;
}

module.exports.unsubscribeAll = function(phone) {
  knex("registrations")
    .where('phone', '=', phone)
    .update({
      state: module.exports.registrationState.UNSUBSCRIBED
    })
}

module.exports.unsubscribeRegistration = function(id) {
  knex("registrations")
    .where('registration_id', '=', id)
    .update({
      state: module.exports.registrationState.UNSUBSCRIBED
    })
}

module.exports.sendRegistrations = function() {
  return module.exports.getRegistrations(module.exports.registrationState.REMINDING)
    .then(data => {
      console.dir(data);
      return data;
    })
    .then(registrations => {
      if(registrations.length == 0) {
        console.log("No records to process.");
        return;
      }
      return Promise.all(registrations.map(r => {
        return caseData.getCasePartyEvents(r.casenumber, r.name)
          .then(events => events.filter(x => {
            var theDate = moment(x.date.replace(" at ", " "), "dddd, MMMM D, YYYY h:mm A");
            var theDiff = theDate.diff(moment(), 'days');
            return theDiff < process.env.REMINDER_DAYS_OUT && theDiff > 0;
          }))
          .then(events => {
            return Promise.all(events.map(e => {
              return knex("sent_messages")
                .where("phone", "=", phone)
                .andWhere("date", "=", e.date)
                .andWhere("description", "=", e.description)
                .then(d => {
                  if(d.rows.length == 0) {
                    var message = messages.reminder(r, e);
                    messages.send(r.phone, process.env.TWILIO_PHONE_NUMBER, message);
                    return knex
                      .insert({
                        phone,
                        date: e.date,
                        description: e.description
                      })
                      .into("sent_messages")
                  }
                })
            }));
          })
          .catch(err => console.log("Error sending reminders for " + r.casenumber + ": " + err.toString()))
      }))
    });
}

module.exports.beginRegistration = function(casenumber, phone, twiml) {
  return knex
    .insert({
      casenumber,
      state: module.exports.registrationState.UNBOUND,
      phone,
      name: null
    })
    .returning("registration_id")
    .into("registrations")
    .then(id => id[0])
    .then(id => caseData.getCaseParties(casenumber).then(parties => ({
      id,
      parties
    })))
    .then(data => {
      if(data.parties.length > 1) {
        var msg = messages.partyQuestionMessage(data.parties);
        console.log("Message:", msg);
        twiml.sms(msg);
        return knex("registrations")
          .where('registration_id', '=', data.id)
          .update({
            state: module.exports.registrationState.ASKED_PARTY
          });
      }
    });
}

module.exports.selectParty = function(phone, selection, id, twiml) {
  return knex("registrations")
    .where('registration_id', '=', id)
    .then(data => {
      if(data.length == 1) {
        return caseData.getCaseParties(data[0].casenumber)
          .then(x => ({ row: data[0], parties: x }));
      }
      else {
        reject("No question, or multiple registrations found.");
      }
    })
    .then(data => {
      var selectedParty = data.parties.filter((p, i) => (p.name.includes(selection) && selection != "") || (i + 1).toString() == selection)
      if(selectedParty.length == 0) {
        reject("Invalid party");
        return;
      }

      twiml.sms(messages.confirmRegistrationMessage(selectedParty[0]));
      return knex("registrations")
        .where('registration_id', '=', data.row.registration_id)
        .update({
          name: selectedParty[0].name,
          state: module.exports.registrationState.ASKED_REMINDER
        });
    });
}

module.exports.confirmReminders = function(phone, accept, twiml) {
  return knex("registrations")
    .where('state', module.exports.registrationState.ASKED_REMINDER)
    .andWhere('phone', phone)
    .then(data => {
      if(data.length == 1) {
        return caseData.getCaseParties(data[0].casenumber)
          .then(parties => ({row: data[0], parties}));
      }
      else {
        reject("No question, or multiple registrations found.");
      }
    })
    .then(data => {
      if(accept) {
        twiml.sms(messages.registrationSuccessful(data.row));
        return knex("registrations")
          .where('registration_id', '=', data.row.registration_id)
          .update({
            state: module.exports.registrationState.REMINDING
          });
      }
      else {
        twiml.sms(messages.unsubscribed(data.row));
        return knex("registrations")
          .where('registration_id', '=', data.row.registration_id)
          .update({
            state: module.exports.registrationState.UNSUBSCRIBED
          });
      }
    });
}
