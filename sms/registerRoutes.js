var registration = require("../data/registration");

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
    registration.confirmReminders(phone, true, twiml)
      .catch(err => twiml.sms(err));
  }
  else if(isResponseNo(text)) {
    registration.confirmReminders(phone, false, twiml)
      .catch(err => twiml.sms(err));
  }
  else if(!isNaN(parseFloat(text)) && isFinite(text)) {
    registration.selectParty(phone, parseInt(text), twiml)
      .catch(err => registration.beginRegistration(text, phone, twiml))
      .catch(err => twiml.sms(err));
  }
  else {
    registration.beginRegistration(text, phone, twiml)
      .catch(err => twiml.sms(err));
  }
}
