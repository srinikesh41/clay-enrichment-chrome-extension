// Background Service Worker for Clay Enrichment Tool
// Minimal version - just logging for now

console.log('Background service worker started');

// Listen for messages from popup (for future use)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  sendResponse({ success: true });
  return true;
});

console.log('Extension loaded successfully!');
