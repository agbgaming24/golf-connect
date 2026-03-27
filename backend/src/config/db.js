const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL is not configured');
}

const isProduction = process.env.NODE_ENV === 'production';

const sql = postgres(connectionString, {
	ssl: isProduction ? 'require' : undefined,
	// Disable prepared statements for PgBouncer-based poolers (common on Supabase pooler endpoints).
	prepare: false,
	max: 5,
	idle_timeout: 20,
	connect_timeout: 10,
});

module.exports = sql;