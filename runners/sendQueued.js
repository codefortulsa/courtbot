var twilio = require('twilio');
var courtbot = require('courtbot-engine');
var Localize = require('localize');
require("courtbot-engine-pg");
require('./config');
require("../messageSource");

courtbot.sendReminders({
  dbUrl: process.env.DATABASE_URL,
  caseData: require("./data-sources/tulsa-oklahoma"),
  twilioAccount: process.env.TWILIO_ACCOUNT_SID,
  twilioToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhone: process.env.TWILIO_PHONE_NUMBER
});
