/**
 * Backend Server for Clay Enrichment Extension
 *
 * This server:
 * 1. Receives enriched data from Clay (POST /webhook)
 * 2. Stores it temporarily in memory
 * 3. Lets the extension poll for results (GET /results)
 */

const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS so Chrome extension can access this
app.use(cors());
app.use(express.json());

// In-memory storage for enriched results
// Key: requestId, Value: enriched data
const results = new Map();

console.log('\n🚀 Clay Enrichment Backend Server Starting...\n');

/**
 * POST /webhook
 * Clay sends enriched data here
 *
 * Expected data from Clay:
 * {
 *   "requestId": "1234567890",
 *   "name": "John Doe",
 *   "title": "Software Engineer",
 *   "org": "Acme Corp",
 *   "country": "United States",
 *   "work_email": "john@acme.com"
 * }
 */
app.post('/webhook', (req, res) => {
  console.log('📥 Received data from Clay:', req.body);

  const { requestId, name, title, org, country, work_email } = req.body;

  if (!requestId) {
    console.error('❌ Error: No requestId provided');
    return res.status(400).json({
      error: 'Missing requestId'
    });
  }

  // Store the enriched data
  results.set(requestId, {
    name: name || 'N/A',
    title: title || 'N/A',
    org: org || 'N/A',
    country: country || 'N/A',
    work_email: work_email || 'N/A',
    timestamp: Date.now()
  });

  console.log(`✅ Stored enriched data for requestId: ${requestId}`);
  console.log(`📊 Currently storing ${results.size} results\n`);

  // Auto-cleanup after 5 minutes
  setTimeout(() => {
    if (results.has(requestId)) {
      console.log(`🧹 Cleaning up expired result: ${requestId}`);
      results.delete(requestId);
    }
  }, 300000); // 5 minutes

  res.json({
    success: true,
    message: 'Data received and stored',
    requestId: requestId
  });
});

/**
 * GET /results?requestId=xxx
 * Extension polls this endpoint to get enriched data
 *
 * Returns:
 * {
 *   "status": "complete",
 *   "data": { name, title, org, country, work_email }
 * }
 *
 * Or if not ready:
 * {
 *   "status": "pending"
 * }
 */
app.get('/results', (req, res) => {
  const { requestId } = req.query;

  if (!requestId) {
    return res.status(400).json({
      error: 'Missing requestId parameter'
    });
  }

  const result = results.get(requestId);

  if (result) {
    console.log(`📤 Sending result to extension for requestId: ${requestId}`);

    // Remove from storage after sending
    results.delete(requestId);

    res.json({
      status: 'complete',
      data: result
    });
  } else {
    // No data yet
    res.json({
      status: 'pending',
      message: 'Data not ready yet'
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    pendingResults: results.size,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /
 * Root endpoint - shows server info
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Clay Enrichment Backend Server',
    status: 'running',
    endpoints: {
      'POST /webhook': 'Receives enriched data from Clay',
      'GET /results?requestId=xxx': 'Extension polls for results',
      'GET /health': 'Health check'
    },
    pendingResults: results.size
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🎯 Clay Enrichment Backend Server                          ║
║  ✅ Server running on http://localhost:${PORT}                  ║
╚══════════════════════════════════════════════════════════════╝

📍 Endpoints:
   POST http://localhost:${PORT}/webhook          - Clay sends data here
   GET  http://localhost:${PORT}/results?requestId=xxx - Extension polls here
   GET  http://localhost:${PORT}/health           - Health check

📋 Next Steps:
   1. Keep this server running
   2. Expose with ngrok (next step)
   3. Configure Clay to POST to your ngrok URL
   4. Update extension to poll for results

🔍 Watching for incoming data from Clay...
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, closing server...');
  process.exit(0);
});
