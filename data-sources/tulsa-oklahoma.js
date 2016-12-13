
module.exports.getCaseParties = function(casenumber) {
  return new Promise(function(resolve, reject) {
    resolve([{name: "Test"}, {name: "Test2"}]);
  });
}

module.exports.getCasePartyEvents = function(casenumber, partyName) {
  return new Promise(function(resolve, reject) {
    resolve([{date:"2016-12-14", description:"YOU GOTS A THING"}]);
  });
}

module.exports.refreshData = function() {
  //no-op
}
