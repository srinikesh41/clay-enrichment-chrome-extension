// Configuration
const CLAY_WEBHOOK_URL = 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-44b82f58-53da-4941-85fd-630f785f594d';
const SUPABASE_URL = 'https://zknyztmngccsxdtiddvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprbnl6dG1uZ2Njc3hkdGlkZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYyMDUsImV4cCI6MjA3ODcwMjIwNX0.sV11EDMAVx0hLRNYAwvYvtkjNbMAuijPmoP8QAa2tTo';
const REQUEST_TIMEOUT = 120000; // 2 minutes

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  requestId = Date.now().toString();
  setLoadingState(true);
  showStatus('loading', 'Sending to Clay...');
  hideResults();

  const payload = {
    url: currentUrl,
    workflow: currentWorkflow,
    requestId: requestId,
    timestamp: new Date().toISOString()
  };

  try {
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

    showStatus('loading', 'Sent to Clay! Waiting for enriched data...');
    subscribeToEnrichedData(requestId);

  } catch (error) {
    setLoadingState(false);
    showStatus('error', `Failed to send request: ${error.message}`);
    addRetryButton();
  }
}

// Subscribe to Realtime updates from Supabase
function subscribeToEnrichedData(requestId) {
  let dataReceived = false;

  const channel = supabase
    .channel(`enriched-data-${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'enriched_data'
      },
      (payload) => {
        if (payload.new && payload.new.request_id === requestId) {
          if (dataReceived) return;
          dataReceived = true;

          displayResults(payload.new);
          setLoadingState(false);
          showStatus('success', 'Enriched data received!');
          channel.unsubscribe();
        }
      }
    )
    .subscribe((status, err) => {
      if (err) {
        showStatus('error', `Subscription error: ${err.message || err}`);
      }
      if (status === 'CHANNEL_ERROR') {
        showStatus('error', 'Failed to subscribe to Realtime updates.');
      }
    });

  setTimeout(() => {
    channel.unsubscribe();
    if (!dataReceived && sendBtn.classList.contains('loading')) {
      setLoadingState(false);
      showStatus('error', 'Request timed out. No enriched data received within 2 minutes.');
      addRetryButton();
    }
  }, REQUEST_TIMEOUT);
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
