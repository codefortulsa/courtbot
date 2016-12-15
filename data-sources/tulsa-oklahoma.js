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
      console.dir(data);
      if(data.length != 1 || !data[0].events) {
        reject("no events");
        return;
      }
      resolve(data[0].events);
    });
  });
}

module.exports.refreshData = function() {
  //no-op
}
