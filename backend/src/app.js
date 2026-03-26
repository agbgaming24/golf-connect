const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/users', require('./routes/user.routes'));
app.use('/api/draws', require('./routes/draw.routes'));
app.use('/api/charities', require('./routes/charity.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/scores', require('./routes/score.routes'));
app.use('/api/payments', require('./routes/payment.routes'));

module.exports = app;