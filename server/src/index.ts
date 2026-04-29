import express from 'express';
import cors from 'cors';
import path from 'path';
import executeRouter from './routes/execute.js';
import labRouter from './routes/lab.js';

const app = express();
const PORT = 3000;
const PLAYGROUND_PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Execute API
app.use('/api', executeRouter);

// Performance lab targets — endpoints that load tests hammer
app.use(labRouter);

// Serve website static files
const websiteDir = path.join(process.cwd(), '..', 'website', 'out');
app.use(express.static(websiteDir));

// SPA fallback for client-side routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(path.join(websiteDir, 'index.html'));
});

// Start main server
app.listen(PORT, () => {
  console.log(`QA Labs server running at http://localhost:${PORT}`);
});

// Internal playground server for test runners
const playground = express();
const katasDir = path.join(process.cwd(), '..', 'katas');
playground.use(express.static(katasDir));

playground.listen(PLAYGROUND_PORT, () => {
  console.log(`Playground server running at http://localhost:${PLAYGROUND_PORT}`);
});
