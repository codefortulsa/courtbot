require("../config");
var manager = require("../utils/db/manager");
var knex = manager.knex();
var caseData = require("../caseData");
var messages = require("../utils/messages");

module.exports.registrationState = {
  UNBOUND: 0,
  ASKED_PARTY: 1,
  ASKED_REMINDER: 2,
  REMINDING: 3,
  UNSUBSCRIBED: 4
}

module.exports.getRegistrations = function(state) {
  var query = knex("registrations")
    .where("state", state);

  return query;
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
        console.log("processing:", r)
        return caseData.getCasePartyEvents(r.casenumber, r.name)
          .then(events => events.filter(x => moment.now().diff(moment(x.date), 'days') < 5))
          .then(events => events.map(e => messages.send(r.phone, process.env.TWILIO_PHONE_NUMBER, messages.reminder(r, e))))
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

module.exports.selectParty = function(phone, partyNum, twiml) {
  return knex("registrations")
    .where('state', '=', module.exports.registrationState.ASKED_PARTY)
    .andWhere('phone', '=', phone)
    .then(data => {
      console.dir(data);
      return data;
    })
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
      if(partyNum > data.parties.length || partyNum < 1) {
        reject("Invalid party number");
        return;
      }

      twiml.sms(messages.confirmRegistrationMessage(data.parties[partyNum - 1]));
      return knex("registrations")
        .where('registration_id', '=', data.row.registration_id)
        .update({
          name: data.parties[partyNum - 1].name,
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
