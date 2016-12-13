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

module.exports = function(req, res, next) {
  var twiml = new twilio.TwimlResponse();
  var text = req.body.Body.toUpperCase().trim();
  var phone = req.body.From;

  if(isResponseYes(text)) {
    console.log("YES - Route");
    registration.confirmReminders(phone, true, twiml)
      .catch(err => twiml.sms(err));
  }
  else if(isResponseNo(text)) {
    console.log("NO - Route");
    registration.confirmReminders(phone, false, twiml)
      .catch(err => twiml.sms(err));
  }
  else if(!isNaN(parseFloat(text)) && isFinite(text)) {
    console.log("NUMBER - Route");
    registration.selectParty(phone, parseInt(text), twiml)
      .catch(err => registration.beginRegistration(text, phone, twiml))
      .catch(err => twiml.sms(err));
  }
  else {
    console.log("CASE NUMBER - Route");
    registration.beginRegistration(text, phone, twiml)
      .catch(err => twiml.sms(err));
  }
}
