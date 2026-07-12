const path = require('path');
const express = require('express');
const cors = require('cors');
const { port } = require('./config');
const detectRoute = require('./routes/detect');

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Used by Render/Railway (and similar platforms) to verify the app booted.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/detect', detectRoute);

// Fallback error handler for anything unexpected (e.g. malformed requests).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(port, () => {
  console.log(`Smart Object Identifier running at http://localhost:${port}`);
});
