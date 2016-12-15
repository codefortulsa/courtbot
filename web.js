var twilio = require('twilio');
var express = require('express');
var logfmt = require('logfmt');
var db = require('./db');
var dates = require("./utils/dates");
var registerRoutes = require("./sms/registerRoutes");
var registrations = require("./data/registrations");
require('./config');

var app = express();

// Express Middleware
app.use(logfmt.requestLogger());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.cookieParser(process.env.COOKIE_SECRET));
app.use(express.cookieSession());


// Serve testing page on which you can impersonate Twilio
// (but not in production)
if (app.settings.env === 'development') {
  //app.use(express.static('public'))
}

// Allows CORS
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// Enable CORS support for IE8.
app.get('/proxy.html', function(req, res) {
  res.send('<!DOCTYPE HTML>\n' + '<script src="http://jpillora.com/xdomain/dist/0.6/xdomain.min.js" master="http://www.courtrecords.alaska.gov"></script>');
});

app.get('/', function(req, res) {
  res.status(200).send('Hello, I am Courtbot. I have a heart of justice and a knowledge of court cases.');
});

app.get("/send", function(req, res){
  registrations.sendRegistrations()
    .then(() => res.status(200).send("registrations processed!"))
    .catch(err => res.status(200).send("error processing registrations: " + err.toString()));
});

// Fuzzy search that returns cases with a partial name match or
// an exact citation match
app.get('/cases', function(req, res) {
  if (!req.query || !req.query.q) return res.send(400);

  db.fuzzySearch(req.query.q, function(err, data) {
    // Add readable dates, to avoid browser side date issues
    if (data) {
      data.forEach(function (d) {
        d.readableDate = dates.fromUtc(d.date).format('dddd, MMM Do');
      });
    }

    res.send(data);
  });
});

function askedReminderMiddleware(req, res, next) {
  if (isResponseYes(req.body.Body) || isResponseNo(req.body.Body)) {
    if (req.session.askedReminder) {
      req.askedReminder = true;
      req.match = req.session.match;
      return next();
    }
    db.findAskedQueued(req.body.From, function (err, data) {  // Is this a response to a queue-triggered SMS? If so, "session" is stored in queue record
      if (err) return next(err);
      if (data.length == 1) { //Only respond if we found one queue response "session"
        req.askedReminder = true;
        req.match = data[0];
      }
      next();
    });
  }
  else {
    next();
  }
}

// Respond to text messages that come in from Twilio
app.use('/sms', registerRoutes);

var cleanupName = function(name) {
  name = name.trim();

  // Change FIRST LAST to First Last
  name = name.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });

  return name;
};

function isResponseYes(text) {
  text = text.toUpperCase();
  return (text === 'YES' || text === 'YEA' || text === 'YUP' || text === 'Y');
}
function isResponseNo(text) {
  text = text.toUpperCase();
  return (text === 'NO' || text ==='N');
}

// Error handling Middleware
app.use(function (err, req, res, next) {
  if (!res.headersSent) {
    // during development, return the trace to the client for
    // helpfulness
    console.log("Error: " + err.message);
    if (app.settings.env !== 'production') {
      return res.status(500).send(err.stack)
    }

    return res.status(500).send('Sorry, internal server error')
  }
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

module.exports = app;
