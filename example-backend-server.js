/**
 * Example Backend Server for Clay Enrichment Tool
 *
 * This simple Node.js/Express server acts as a bridge between Zapier and your Chrome extension.
 *
 * SETUP:
 * 1. Install Node.js from https://nodejs.org/
 * 2. Create a new folder for this server
 * 3. Run: npm init -y
 * 4. Run: npm install express cors
 * 5. Save this file as server.js
 * 6. Run: node server.js
 *
 * USAGE:
 * - Extension sends request to Zapier
 * - Zapier processes with Clay
 * - Zapier POSTs enriched data to http://localhost:3000/webhook
 * - Extension polls http://localhost:3000/results?requestId=xxx
 * - Extension receives and displays the data
 */

const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for Chrome extension
app.use(cors());
app.use(express.json());

// In-memory storage for results (use Redis/database for production)
const results = new Map();

// Zapier POSTs enriched data here
app.post('/webhook', (req, res) => {
  console.log('Received webhook from Zapier:', req.body);

  const { requestId, data, url, workflow } = req.body;

  if (!requestId) {
    return res.status(400).json({
      error: 'Missing requestId'
    });
  }

  // Store the enriched data
  results.set(requestId, {
    data: data,
    url: url,
    workflow: workflow,
    timestamp: Date.now()
  });

  console.log(`Stored result for requestId: ${requestId}`);

  // Auto-cleanup after 5 minutes
  setTimeout(() => {
    if (results.has(requestId)) {
      console.log(`Cleaning up expired result: ${requestId}`);
      results.delete(requestId);
    }
  }, 300000); // 5 minutes

  res.json({
    success: true,
    message: 'Data received and stored',
    requestId: requestId
  });
});

// Extension polls this endpoint for results
app.get('/results', (req, res) => {
  const { requestId } = req.query;

  if (!requestId) {
    return res.status(400).json({
      error: 'Missing requestId parameter'
    });
  }

  const result = results.get(requestId);

  if (result) {
    console.log(`Returning result for requestId: ${requestId}`);
    // Remove from storage after retrieval
    results.delete(requestId);

    res.json({
      status: 'complete',
      result: result.data,
      url: result.url,
      workflow: result.workflow
    });
  } else {
    // No result yet
    res.json({
      status: 'pending',
      message: 'No data available yet'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    pendingResults: results.size,
    timestamp: new Date().toISOString()
  });
});

// Clean up old results every minute
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [requestId, result] of results.entries()) {
    // Remove results older than 5 minutes
    if (now - result.timestamp > 300000) {
      results.delete(requestId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired results`);
  }
}, 60000); // Run every minute

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Clay Enrichment Backend Server                              ║
║  Running on http://localhost:${PORT}                            ║
╚══════════════════════════════════════════════════════════════╝

Endpoints:
  POST /webhook          - Receives data from Zapier
  GET  /results?requestId=xxx - Extension polls for results
  GET  /health           - Health check

Configure your extension:
  1. Open background.js
  2. Set POLLING_ENABLED = true
  3. Set POLLING_ENDPOINT = 'http://localhost:${PORT}/results'
  4. Reload the extension

Configure Zapier:
  - Send enriched data to: http://localhost:${PORT}/webhook
  - Include these fields: requestId, data, url, workflow

Server is ready! Waiting for requests...
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
