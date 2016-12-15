require("../config");
var moment = require("moment-timezone");

var registrations = require("../data/registrations");
var caseData = require("../caseData");
var messages = require("../utils/messages");

registrations.getRegistrations(registrations.registrationState.REMINDING)
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
    }))
  })
  .catch(err => console.log("err", err))
  .then(() => process.exit(0))


//TODO: mark completed reminders so we don't double send.
