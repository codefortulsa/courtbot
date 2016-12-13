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

module.exports.beginRegistration = function(casenumber, phone, twiml) {
  return knex("registrations")
    .insert({
      casenumber,
      state: module.exports.registrationState.UNBOUND,
      phone,
      name: null
    })
    .then(data => data.rows[0])
    .then(row => {
      console.dir(row);
      return row;
    })
    .then(row => caseData.getCaseParties(casenumber).then(parties => ({
      row,
      parties
    })))
    .then(data => {
      if(data.parties.length > 1) {
        var msg = messages.partyQuestionMessage(data.parties);
        console.log("Message:", msg);
        twiml.sms(msg);
        return knex("registrations")
          .where('registration_id', '=', data.row.registration_id)
          .update({
            state: module.exports.registrationState.ASKED_PARTY
          });
      }
    });
}

module.exports.selectParty = function(phone, partyNum, twiml) {
  return knex("registrations")
    .where('state', module.exports.registrationState.ASKED_PARTY)
    .andWhere('phone', phone)
    .andWhere('name', null)
    .then(data => {
      if(data.length == 1) {
        return { row: data[0] , parties: caseData.getCaseParties(data[0].casenumber) };
      }
      else {
        reject("No question, or multiple registrations found.");
      }
    })
    .then(data => {
      if(partyNum >= data.parties.length || partyNum < 0) {
        reject("Invalid party number");
        return;
      }

      twiml.sms(messages.confirmRegistrationMessage(data.row))
      return knex("registrations")
        .where('registration_id', '=', data.row.registration_id)
        .update({
          name: data.parties[partyNum].name,
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
        return { row: data[0] , parties: caseData.getCaseParties(data[0].casenumber) };
      }
      else {
        reject("No question, or multiple registrations found.");
      }
    })
    .then(data => {
      if(accept) {
        twiml.sms(messages.registrationSuccessful(data[0]));
        knex("registrations")
          .where('registration_id', '=', data[0].registration_id)
          .update({
            state: module.exports.registrationState.REMINDING
          });
      }
      else {
        twiml.sms(messages.unsubscribed(data[0]));
        knex("registrations")
          .where('registration_id', '=', data[0].registration_id)
          .update({
            state: module.exports.registrationState.UNSUBSCRIBED
          });
      }
    });
}
