var caseData = require("../caseData");

caseData.refreshData().then(function(success) {
  console.log(success);
  process.exit(0);
}, function(err) {
  console.log(err);
  process.exit(1);
});
