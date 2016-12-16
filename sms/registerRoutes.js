var twilio = require('twilio');
var registration = require("../data/registrations");

function isResponseYes(text) {
  text = text.toUpperCase();
  return (text === 'YES' || text === 'YEA' || text === 'YUP' || text === 'Y');
}
function isResponseNo(text) {
  text = text.toUpperCase();
  return (text === 'NO' || text ==='N');
}

function isResponseUnsub(text) {
  text = text.toUpperCase();
  return (text === "CANCEL" || text === "UNSUBSCRIBE");
}

module.exports = function(req, res, next) {
  var twiml = new twilio.TwimlResponse();
  var text = req.body.Body.toUpperCase().trim();
  var phone = req.body.From;

  registration.getRegistrationsForUser(phone)
    .then(registrations => {
      console.log("Got registrations...");
      var pendingRegistrations = registrations.filter(r => r.state != registration.registrationState.REMINDING && r.state != registration.registrationState.UNBOUND && r.state != registration.registrationState.UNSUBSCRIBED);

      if(isResponseUnsub(text)) {
        if(pendingRegistrations.length == 0) {
          console.log("Unsubscribing from all", phone);
          return registration.unsubscribeAll(phone);
        } else {
          console.log("Unsubscribing from ", pendingRegistrations[0].registration_id, phone);
          return registration.unsubscribeRegistration(pendingRegistrations[0].registration_id);
        }
      }

      if(pendingRegistrations.length > 0) {
        var pending = pendingRegistrations[0];

        if(pending.state == registration.registrationState.ASKED_PARTY) {
          console.log("Asking party", phone);
          return registration.selectParty(phone, text, pending.registration_id, twiml);
        }
        else if(pending.state == registration.registrationState.ASKED_REMINDER && isResponseYes(text)) {
          console.log("confirming", phone);
          return registration.confirmReminders(phone, true, twiml);
        }
        else if(pending.state == registration.registrationState.ASKED_REMINDER && isResponseNo(text)) {
          console.log("rejecting", phone);
          return registration.confirmReminders(phone, false, twiml);
        }
      }

      console.log("beginning registration", phone);
      return registration.beginRegistration(text, phone, twiml);
    })
    .catch(err => {
      twiml = new twilio.TwimlResponse();
      twiml.sms("Error:", err);
    })
    .then(() => {
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end(twiml.toString());
    })
}
