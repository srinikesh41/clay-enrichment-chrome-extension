// Background Service Worker for Clay Enrichment Tool
// Handles message passing and data reception from external sources

console.log('Background service worker started');

// Store for pending requests
const pendingRequests = new Map();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'SEND_REQUEST') {
    // Store the request info
    pendingRequests.set(message.requestId, {
      timestamp: Date.now(),
      url: message.url,
      workflow: message.workflow
    });

    // Clean up old requests after 5 minutes
    setTimeout(() => {
      pendingRequests.delete(message.requestId);
    }, 300000);

    sendResponse({ success: true });
  }

  return true; // Keep channel open for async response
});

// Function to receive enriched data (called by external mechanism)
// This would be triggered by your backend server/polling mechanism
function receiveEnrichedData(data, requestId) {
  console.log('Received enriched data:', data);

  // Verify request exists
  if (requestId && pendingRequests.has(requestId)) {
    pendingRequests.delete(requestId);
  }

  // Send data to popup (if open)
  chrome.runtime.sendMessage({
    type: 'ENRICHED_DATA',
    data: data,
    requestId: requestId
  }).catch(error => {
    // Popup might not be open, store in chrome.storage
    console.log('Popup not available, storing data:', error);
    chrome.storage.local.set({
      lastEnrichedData: {
        data: data,
        requestId: requestId,
        timestamp: Date.now()
      }
    });
  });
}

// Check storage on startup for any pending data
chrome.storage.local.get(['lastEnrichedData'], (result) => {
  if (result.lastEnrichedData) {
    // Data is available, will be picked up when popup opens
    console.log('Pending enriched data available:', result.lastEnrichedData);
  }
});

// Simple polling mechanism - polls a backend endpoint for results
// OPTIONAL: Enable this if you set up a backend polling endpoint
const POLLING_ENABLED = false;
const POLLING_ENDPOINT = 'YOUR_BACKEND_POLLING_URL_HERE'; // e.g., https://your-server.com/api/poll-results
const POLLING_INTERVAL = 5000; // 5 seconds

if (POLLING_ENABLED) {
  setInterval(async () => {
    if (pendingRequests.size === 0) return;

    // Poll for each pending request
    for (const [requestId, request] of pendingRequests.entries()) {
      try {
        const response = await fetch(`${POLLING_ENDPOINT}?requestId=${requestId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.status === 'complete') {
            receiveEnrichedData(data.result, requestId);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }
  }, POLLING_INTERVAL);
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { receiveEnrichedData };
}
