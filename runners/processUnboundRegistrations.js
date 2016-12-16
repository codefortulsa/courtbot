var registrations = require("../data/registrations");
var config = require("../config.js");
var caseData = config.caseData;

function lookupUnboundRegistration(registration) {
  return caseData.getCaseParties(registration.caseIdentifier)
    .then(parties => {
      return {
        registration,
        found: true,
        parties,
      };
    })
    .catch(() => {
      return {
        registration,
        found: false
      };
    });
}

function processFailedResults(result) {
  //TODO: old results processing
  return Promise.resolve();
}

function processFoundResults(result) {
  return registrations.continueRegistration(result.registration.registration_id, result.registration.casenumber, result.registration.phone);
}

registrations.getRegistrations(registrations.registrationState.UNBOUND)
  .then(results => Promise.all(results.map(r => lookupUnboundRegistration(r))))
  .then(results => Promise.all(results.filter(r => !r.found).map(r => forEachResultWhere(processFailedResults))))
  .then(results => Promise.all(results.filter(r => r.found).map(r => forEachResultWhere(processFoundResults))))
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
