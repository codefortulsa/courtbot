var twilio = require('twilio');
var express = require('express');
var logfmt = require('logfmt');
var courtbot = require('courtbot-engine');
var Localize = require('localize');
require("courtbot-engine-pg");
require('./config');
require("./messageSource");

var localize = Localize("./strings");

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

courtbot.addRoutes(app, {
  path: "/sms",
  dbUrl: process.env.DATABASE_URL,
  caseData: require("./data-sources/tulsa-oklahoma")
});

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
