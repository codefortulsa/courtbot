var crypto = require('crypto'),
    twilio = require('twilio'),
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
    db = require('./db.js'),
    Promise = require('bluebird'),
    dates = require("./utils/dates"),
    strings = require("./utils/strings"),
    messages = require("./utils/messages"),
    promises = require("./utils/promises"),
    forEachResult = promises.forEachResult,
    chainable = promises.chainablePromise,
    genericResolver = promises.genericCallbackResolver,
    manager = require("./utils/db/manager"),
    knex = manager.knex();

/**
 * Retrieve array of queued messages that have not been sent, if any exist.
 *
 * @return {Promise} Promise to return an array of queued messages that have not been sent
 */
var findQueued = function() {
  return knex('queued')
    .where('sent', false)
    .select();
};

/**
 * Find a citation that is related to a queued message.
 *
 * @param  {Object} queuedMessage for which we want to lookup citation data.
 * @return {Promise}  promise to retrieve citation data.
 */
function retrieveCitation(queuedMessage) {
  caseData.getCaseParties(queuedMessage.citation_id)
    .then(parties => {
      if(parties.length == 1) {
        return caseData.getCasePartyEvents(queuedMessage.citation_id, parties[0].name)
          .then(events => {
            if(events.length == 0)
              return promise.reject("No upcomming events.");
          })
          .then(events => [
            {
              name: parties[0].name,
              events
            }
          ]);
      } else {
        return parties;
      }
    })
    .then(parties => ({
      queuedMessage,
      citationFound: true,
      parties
    }))
    .catch(err => {
      //didn't find case, log?

      return {
        queuedMessage,
        citationFound: false
      };
    });
};

/**
 * Process citation:
 *   1.)  Citation data found:  send message to defendant asking if they want a reminder
 *   2.)  Citation data not found and message has been queued too long:  send a "not found" message to defendant.
 *   3.)  N/A do nothing and leave queued.
 *
 * @param  {Object} queued queued message and citation data(if found)
 * @return {Promise} promise to process queued message (if applicable)
 */
function processCitationMessage(queued) {
  return new Promise(function(resolve, reject) {
    var decipher = crypto.createDecipher('aes256', process.env.PHONE_ENCRYPTION_KEY),
        phone = decipher.update(queued.queuedMessage.phone, 'hex', 'utf8') + decipher.final('utf8');

    if (queued.citationFound && queued.parties.length == 1) {
      var name = strings.scrubName(queued.parties[0].name),
          datetime = dates.fromUtc(queued.parties[0].events[0].date)
          description = queued.parties[0].events[0].description;

      messages.send(phone, process.env.TWILIO_PHONE_NUMBER, messages.greetingMessage(name, datetime, description))
        .then(updateSentWithReminder(queued.queuedMessage.queued_id))
        .then(resolve);
    } else if (dates.hasSatTooLong(queued.queuedMessage.created_at)) {
      messages.send(phone, process.env.TWILIO_PHONE_NUMBER, messages.unableToFindCitationForTooLong())
        .then(updateSentWithoutReminder(queued.queuedMessage.queued_id))
        .then(resolve);
    } else {
      resolve();
    }
  });
};

/**
 * Update queued message in db to indicate it has been sent, and that a reminder will be sent.
 *
 * @param  {string} queuedId index by which to lookup queued message for update.
 * @return {Promise} function to recieve results and Promise to perform update.
 */
function updateSentWithReminder(queuedId) {
    return chainable(function(resolve, reject) {
        knex('queued')
          .where('queued_id', '=', queuedId)
          .update({'sent': true,
                    'asked_reminder': true,
                    'asked_reminder_at' : dates.now().format()})
          .asCallback(genericResolver(resolve, "updateSentWithReminder()"));
    });
};

/**
 * Update data for queued message to indicate it has been sent but no reminder is required.
 *
 * @param  {string} queuedId index to be used for lookup of queued message when updating.
 * @return {function} function to recieve results and Promise to perform update.
 */
function updateSentWithoutReminder(queuedId) {
    return chainable(function(resolve, reject) {
        knex('queued')
          .where('queued_id', '=', queuedId)
          .update({'sent': true})
          .asCallback(genericResolver(resolve, "updateSentWithoutReminder()"));
    });
};

/**
 * Hook for processing all applicable queued messages.
 *
 * @return {Promise} Promise to process all queued messages.
 */
module.exports = function() {
  return new Promise(function(resolve, reject) {
    findQueued()
      .then(forEachResult(retrieveCitation))
      .then(forEachResult(processCitationMessage))
      .then(resolve, reject)
      .catch(reject);
  });
};
