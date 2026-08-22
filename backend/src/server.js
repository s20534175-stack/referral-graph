const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { verifyConnection } = require('./db');
const graphRoutes = require('./routes/graph');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ReferralGraph API is running' });
});

app.get('/health', async (req, res) => {
  res.json({ ok: true });
});

app.use('/api', graphRoutes);

// Graceful handling when CognoDB is unreachable, rather than an unhandled crash.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong talking to the database.' });
});

const PORT = process.env.PORT || 4000;

verifyConnection().then(() => {
  app.listen(PORT, () => console.log(`ReferralGraph API listening on port ${PORT}`));
});
