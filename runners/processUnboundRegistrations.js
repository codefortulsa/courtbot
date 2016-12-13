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

registrations.getRegistrations(registrations.registrationState.UNBOUND)
  .then(forEachResult(lookupUnboundRegistration))
  .then(forEachResultWhere(processFailedResults, r => !r.found))
  .then(forEachResultWhere(processFoundResults, r => r.found))
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
