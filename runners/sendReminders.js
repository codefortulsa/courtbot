require("../config");

var registrations = require("../data/registrations");

registrations.sendRegistrations()
  .catch(err => console.log("err", err))
  .then(() => process.exit(0))
