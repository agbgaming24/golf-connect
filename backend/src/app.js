const express = require('express');
const cors = require('cors');
const app = express();

const defaultAllowedOrigins = [
	'http://localhost:8080',
	'http://127.0.0.1:8080',
	'http://localhost:5173',
	'http://127.0.0.1:5173',
];

const envAllowedOrigins = (process.env.CORS_ORIGIN || '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

const allowedOrigins = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

const corsOptions = {
	origin(origin, callback) {
		if (!origin || allowedOrigins.has(origin)) {
			return callback(null, true);
		}
		return callback(null, false);
	},
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use('/api/users', require('./routes/user.routes'));
app.use('/api/draws', require('./routes/draw.routes'));
app.use('/api/charities', require('./routes/charity.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/scores', require('./routes/score.routes'));
app.use('/api/payments', require('./routes/payment.routes'));

module.exports = app;