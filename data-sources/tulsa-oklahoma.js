var Client = require('node-rest-client').Client;
require('../config');

var client = new Client();

module.exports.getCaseParties = function(casenumber) {
  return new Promise(function(resolve, reject) {
    client.get("http://data.thekinfamily.com/oscn/case/tulsa/" + casenumber, function(data, res) {
      if(!data.parties) {
        reject("no parties");
      }
      resolve(data.parties);
    });
  });
}

module.exports.getCasePartyEvents = function(casenumber, partyName) {
  return new Promise(function(resolve, reject) {
    client.get("http://data.thekinfamily.com/oscn/case/tulsa/" + casenumber + "/" + partyName, function(data, res) {
      if(!data.events) {
        reject("no events");
      }
      resolve(data.events);
    });
  });
}

module.exports.refreshData = function() {
  //no-op
}
