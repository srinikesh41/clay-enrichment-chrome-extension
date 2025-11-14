// Configuration - Clay webhook URL
const CLAY_WEBHOOK_URL = 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-44b82f58-53da-4941-85fd-630f785f594d';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// DOM elements
let currentUrlElement;
let workflowSelect;
let sendBtn;
let statusMessage;
let resultsContainer;
let resultsContent;

// State
let currentUrl = '';
let currentWorkflow = '';
let requestId = null;

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  currentUrlElement = document.getElementById('current-url');
  workflowSelect = document.getElementById('workflow-select');
  sendBtn = document.getElementById('send-btn');
  statusMessage = document.getElementById('status-message');
  resultsContainer = document.getElementById('results-container');
  resultsContent = document.getElementById('results-content');

  // Get current tab URL
  await getCurrentTabUrl();

  // Set up event listeners
  workflowSelect.addEventListener('change', handleWorkflowChange);
  sendBtn.addEventListener('click', handleSendClick);

  // Listen for messages from background worker
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
});

// Get the current tab's URL
async function getCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      currentUrl = tab.url;
      currentUrlElement.textContent = currentUrl;
    } else {
      currentUrlElement.textContent = 'Unable to get current URL';
      showStatus('error', 'Could not access current tab URL');
    }
  } catch (error) {
    console.error('Error getting tab URL:', error);
    currentUrlElement.textContent = 'Error loading URL';
    showStatus('error', 'Failed to get current URL');
  }
}

// Handle workflow dropdown change
function handleWorkflowChange(event) {
  currentWorkflow = event.target.value;

  // Enable send button only if workflow is selected
  if (currentWorkflow) {
    sendBtn.disabled = false;
  } else {
    sendBtn.disabled = true;
  }

  // Hide previous results/errors when workflow changes
  hideStatus();
  hideResults();
}

// Handle send button click
async function handleSendClick() {
  if (!currentWorkflow || !currentUrl) {
    showStatus('error', 'Please select a workflow');
    return;
  }

  // No validation needed - Clay URL is hardcoded

  // Generate unique request ID for this request
  requestId = Date.now().toString();

  // Update UI to loading state
  setLoadingState(true);
  showStatus('loading', 'Sending to Zapier...');
  hideResults();

  // Prepare payload
  const payload = {
    url: currentUrl,
    workflow: currentWorkflow,
    requestId: requestId,
    timestamp: new Date().toISOString()
  };

  try {
    // Send to Clay webhook
    const response = await fetch(CLAY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Clay webhook returned status ${response.status}`);
    }

    // Successfully sent to Clay
    showStatus('success', 'Data sent to Clay successfully!');

    // Done sending - no timeout needed for now
    setLoadingState(false);

  } catch (error) {
    console.error('Error sending to Clay:', error);
    setLoadingState(false);
    showStatus('error', `Failed to send request: ${error.message}`);
    addRetryButton();
  }
}

// Handle messages from background service worker
function handleBackgroundMessage(message, sender, sendResponse) {
  console.log('Popup received message:', message);

  if (message.type === 'ENRICHED_DATA') {
    // Verify this is for our current request (basic validation)
    setLoadingState(false);
    requestId = null;

    if (message.data && typeof message.data === 'object') {
      showStatus('success', 'Data received successfully!');
      displayResults(message.data);
    } else {
      showStatus('error', 'Received invalid data format');
    }
  } else if (message.type === 'ERROR') {
    setLoadingState(false);
    requestId = null;
    showStatus('error', `Error: ${message.message || 'Unknown error occurred'}`);
    addRetryButton();
  }
}

// Display enriched results
function displayResults(data) {
  resultsContent.innerHTML = '';

  // Handle if data is a string (convert to object)
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      resultsContent.textContent = data;
      resultsContainer.classList.remove('hidden');
      return;
    }
  }

  // Display each key-value pair
  if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';

      const keyElement = document.createElement('div');
      keyElement.className = 'result-key';
      keyElement.textContent = formatKey(key);

      const valueElement = document.createElement('div');
      valueElement.className = 'result-value';
      valueElement.textContent = formatValue(value);

      resultItem.appendChild(keyElement);
      resultItem.appendChild(valueElement);
      resultsContent.appendChild(resultItem);
    }
  } else {
    resultsContent.textContent = String(data);
  }

  resultsContainer.classList.remove('hidden');
}

// Format key for display (convert snake_case to Title Case)
function formatKey(key) {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format value for display
function formatValue(value) {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

// Show status message
function showStatus(type, message) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

// Hide status message
function hideStatus() {
  statusMessage.className = 'status-message hidden';
}

// Hide results
function hideResults() {
  resultsContainer.classList.add('hidden');
}

// Set loading state
function setLoadingState(isLoading) {
  if (isLoading) {
    sendBtn.disabled = true;
    sendBtn.classList.add('loading');
    workflowSelect.disabled = true;
  } else {
    sendBtn.disabled = false;
    sendBtn.classList.remove('loading');
    workflowSelect.disabled = false;
  }
}

// Add retry button to status message
function addRetryButton() {
  const retryBtn = document.createElement('button');
  retryBtn.textContent = 'Retry';
  retryBtn.style.marginTop = '8px';
  retryBtn.style.width = 'auto';
  retryBtn.style.padding = '6px 16px';
  retryBtn.onclick = handleSendClick;

  statusMessage.appendChild(document.createElement('br'));
  statusMessage.appendChild(retryBtn);
}
