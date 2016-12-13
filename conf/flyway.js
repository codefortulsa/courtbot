require("../config");
var env = process.env;

module.exports = {
	url: env.MIGRATION_URL,
	schemas: 'public',
	locations: 'filesystem:sql/migrations',
	user: 'postgres',
	password: 'postgres',
	sqlMigrationSuffix: '.sql'
};
