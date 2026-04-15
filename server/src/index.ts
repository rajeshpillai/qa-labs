import express from 'express';
import cors from 'cors';
import path from 'path';
import executeRouter from './routes/execute.js';

const app = express();
const PORT = 3000;
const PLAYGROUND_PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', executeRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve website static files
const websiteDir = path.join(process.cwd(), '..', 'website', 'out');
app.use(express.static(websiteDir));

// SPA fallback: serve index.html for any non-API, non-file route
app.get('*', (_req, res) => {
  res.sendFile(path.join(websiteDir, 'index.html'));
});

// Start main server
app.listen(PORT, () => {
  console.log(`QA Labs server running at http://localhost:${PORT}`);
});

// Start internal playground server serving katas on port 8080
const playground = express();
const katasDir = path.join(process.cwd(), '..', 'katas');
playground.use(express.static(katasDir));

playground.listen(PLAYGROUND_PORT, () => {
  console.log(`Playground server running at http://localhost:${PLAYGROUND_PORT} (serving ${katasDir})`);
});
