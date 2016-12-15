require("../config");
var moment = require("moment-timezone");

var registrations = require("../data/registrations");

registrations.sendRegistrations()
  .catch(err => console.log("err", err))
  .then(() => process.exit(0))


//TODO: mark completed reminders so we don't double send.
