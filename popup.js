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
let historyContainer;
let historyContent;
let clearHistoryBtn;

// State
let currentUrl = '';
let currentWorkflow = '';
let requestId = null;
let searchHistory = [];

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  currentUrlElement = document.getElementById('current-url');
  workflowSelect = document.getElementById('workflow-select');
  sendBtn = document.getElementById('send-btn');
  statusMessage = document.getElementById('status-message');
  resultsContainer = document.getElementById('results-container');
  resultsContent = document.getElementById('results-content');
  historyContainer = document.getElementById('history-container');
  historyContent = document.getElementById('history-content');
  clearHistoryBtn = document.getElementById('clear-history-btn');

  // Get current tab URL
  await getCurrentTabUrl();

  // Load search history
  await loadSearchHistory();

  // Set up event listeners
  workflowSelect.addEventListener('change', handleWorkflowChange);
  sendBtn.addEventListener('click', handleSendClick);
  clearHistoryBtn.addEventListener('click', handleClearHistory);
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

  // Refresh history display to show only matching workflow
  displaySearchHistory();
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

  // Save to search history
  saveToHistory(currentUrl, currentWorkflow, data);
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

// Load search history from Supabase
async function loadSearchHistory() {
  try {
    showStatus('loading', 'Loading search history...');

    // Fetch all enriched data from Supabase, ordered by most recent first
    const { data, error } = await supabase
      .from('enriched_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Limit to most recent 50 searches

    if (error) {
      console.error('Error loading search history:', error);
      searchHistory = [];
      hideStatus();
      return;
    }

    // Transform Supabase data to our history format
    searchHistory = (data || []).map(item => ({
      url: item.url || 'N/A',
      workflow: item.workflow || 'unknown',
      data: item,
      timestamp: item.created_at || item.timestamp || new Date().toISOString(),
      requestId: item.request_id
    }));

    displaySearchHistory();
    hideStatus();
  } catch (error) {
    console.error('Failed to load search history:', error);
    searchHistory = [];
    hideStatus();
  }
}

// Save search to history (Supabase handles this automatically via INSERT)
async function saveToHistory(url, workflow, data) {
  // Data is already saved to Supabase via the webhook/Clay flow
  // Just reload the history to show the new entry
  await loadSearchHistory();
}

// Display search history
function displaySearchHistory() {
  historyContent.innerHTML = '';

  if (searchHistory.length === 0) {
    historyContent.innerHTML = '<div class="no-history">No previous searches yet</div>';
    return;
  }

  // Filter history by selected workflow (if one is selected)
  const filteredHistory = currentWorkflow
    ? searchHistory.filter(item => item.workflow === currentWorkflow)
    : searchHistory;

  if (filteredHistory.length === 0) {
    const workflowName = currentWorkflow ? formatWorkflowName(currentWorkflow) : 'this workflow';
    historyContent.innerHTML = `<div class="no-history">No previous searches for ${workflowName}</div>`;
    return;
  }

  filteredHistory.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.dataset.index = index;

    // Header with workflow and timestamp
    const header = document.createElement('div');
    header.className = 'history-item-header';

    const workflow = document.createElement('div');
    workflow.className = 'history-workflow';
    workflow.textContent = formatWorkflowName(item.workflow);

    const timestamp = document.createElement('div');
    timestamp.className = 'history-timestamp';
    timestamp.textContent = formatTimestamp(item.timestamp);

    header.appendChild(workflow);
    header.appendChild(timestamp);

    // URL
    const url = document.createElement('div');
    url.className = 'history-url';
    url.textContent = item.url;

    // Results container
    const results = document.createElement('div');
    results.className = 'history-results';

    // Display results data
    if (item.data && typeof item.data === 'object') {
      for (const [key, value] of Object.entries(item.data)) {
        if (key === 'request_id' || key === 'created_at' || key === 'id') continue;

        const resultItem = document.createElement('div');
        resultItem.className = 'history-result-item';

        const keyElement = document.createElement('div');
        keyElement.className = 'history-result-key';
        keyElement.textContent = formatKey(key);

        const valueElement = document.createElement('div');
        valueElement.className = 'history-result-value';
        valueElement.textContent = formatValue(value);

        resultItem.appendChild(keyElement);
        resultItem.appendChild(valueElement);
        results.appendChild(resultItem);
      }
    }

    historyItem.appendChild(header);
    historyItem.appendChild(url);
    historyItem.appendChild(results);

    // Click to expand/collapse results
    historyItem.addEventListener('click', (e) => {
      e.stopPropagation();
      results.classList.toggle('collapsed');
    });

    historyContent.appendChild(historyItem);
  });
}

// Clear all search history from Supabase
async function handleClearHistory() {
  if (!confirm('Are you sure you want to clear all search history? This will delete all records from the database.')) {
    return;
  }

  try {
    showStatus('loading', 'Clearing history...');

    // Delete all records from enriched_data table
    const { error } = await supabase
      .from('enriched_data')
      .delete()
      .neq('id', 0); // Delete all records (neq 0 means not equal to 0, which matches all records)

    if (error) {
      console.error('Error clearing history:', error);
      showStatus('error', `Failed to clear history: ${error.message}`);
      return;
    }

    searchHistory = [];
    displaySearchHistory();
    showStatus('success', 'Search history cleared');
    setTimeout(hideStatus, 2000);
  } catch (error) {
    console.error('Error clearing history:', error);
    showStatus('error', 'Failed to clear history');
  }
}

// Format workflow name for display
function formatWorkflowName(workflow) {
  const names = {
    'get_contact_info': 'Get Contact Info',
    'do_account_research': 'Do Account Research',
    'do_lead_research': 'Do Lead Research'
  };
  return names[workflow] || workflow;
}

// Format timestamp for display
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Show date
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
