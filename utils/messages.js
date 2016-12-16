var twilio = require('twilio');
var client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
var Localize = require("localize");

var localize = new Localize("./strings");
var strings = localize.strings;

module.exports = {

	partyQuestionMessage: function(parties) {
		var message = strings.partyQuestionMessage + "\n"

		for(var i in parties) {
			var n = parseInt(i) + 1;
			message += localize.translate(strings.partyQuestionPartyLineMessage, n, parties[i].name) + "\n"
		}

		return message.trim();
	},

	unsubscribed: function() {
		return localize.translate(strings.unsubscribed);
	},

	confirmRegistrationMessage: function(data) {
		return localize.translate(strings.confirmRegistrationMessage, data.name);
	},

	registrationSuccessful: function(data) {
		return localize.translate(strings.registrationSuccessful);
	},

	unableToFindCitationForTooLong: function() {
		return localize.translate(strings.unableToFindCitationForTooLong, process.env.COURT_PUBLIC_URL, process.env.COURT_BOT_TITLE);
	},

	reminder: function(reminder, event) {
		return localize.translate(strings.reminder, event.date, event.description, process.env.COURT_PUBLIC_URL, process.env.COURT_BOT_TITLE);
	},

	/**
	 * Send a twilio message
	 *
	 * @param  {string} to   phone number message will be sent to
	 * @param  {string} from who the message is being sent from
	 * @param  {string} body message to be sent
	 * @param  {function} function for resolving callback
	 * @return {Promise} Promise to send message.
	 */
	send: function(to, from, body, resolver) {
		return new Promise(function(resolve, reject) {
			client.sendMessage({to: to, from: from, body: body}, resolver || genericResolver(resolve, "client.message"));
		});
	}
}
