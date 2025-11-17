// Configuration
const CLAY_WEBHOOK_URLS = {
  'get_contact_info': 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-44b82f58-53da-4941-85fd-630f785f594d',
  'do_account_research': 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-32f6a132-d7fd-46d8-8eae-083406dcd7fc',
  'do_lead_research': 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-42e85c66-36ca-4df0-8ff2-d3e8b7b38d09'
};

// Fields to display in enriched data (in this specific order)
const DISPLAY_FIELDS = ['name', 'title', 'org', 'country', 'work_email'];

// Separate Supabase table for each workflow
const SUPABASE_TABLES = {
  'get_contact_info': 'enriched_data',
  'do_account_research': 'account_research_data',
  'do_lead_research': 'lead_research_data'
};

const SUPABASE_URL = 'https://zknyztmngccsxdtiddvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprbnl6dG1uZ2Njc3hkdGlkZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYyMDUsImV4cCI6MjA3ODcwMjIwNX0.sV11EDMAVx0hLRNYAwvYvtkjNbMAuijPmoP8QAa2tTo';
const REQUEST_TIMEOUT = 120000; // 2 minutes

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
let currentUrlElement;
let workflowSelect;
let selectTrigger;
let selectValue;
let selectDropdown;
let selectOptions;
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
  selectTrigger = workflowSelect.querySelector('.select-trigger');
  selectValue = workflowSelect.querySelector('.select-value');
  selectDropdown = workflowSelect.querySelector('.select-dropdown');
  selectOptions = workflowSelect.querySelectorAll('.select-option');
  sendBtn = document.getElementById('send-btn');
  statusMessage = document.getElementById('status-message');
  resultsContainer = document.getElementById('results-container');
  resultsContent = document.getElementById('results-content');
  historyContainer = document.getElementById('history-container');
  historyContent = document.getElementById('history-content');
  clearHistoryBtn = document.getElementById('clear-history-btn');

  // Get current tab URL
  await getCurrentTabUrl();

  // Display empty history message (will load when workflow is selected)
  displaySearchHistory();

  // Set up event listeners
  setupCustomSelect();
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

// Setup custom select dropdown
function setupCustomSelect() {
  // Toggle dropdown on trigger click
  selectTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    selectTrigger.classList.toggle('active');
    selectDropdown.classList.toggle('hidden');
  });

  // Handle option selection
  selectOptions.forEach(option => {
    option.addEventListener('click', async (e) => {
      e.stopPropagation();

      // Get selected value
      const value = option.getAttribute('data-value');
      const text = option.textContent;

      // Update selected value display
      selectValue.textContent = text;

      // Update selected class
      selectOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');

      // Close dropdown
      selectTrigger.classList.remove('active');
      selectDropdown.classList.add('hidden');

      // Update current workflow
      currentWorkflow = value;

      // Enable send button only if workflow is selected
      if (currentWorkflow) {
        sendBtn.disabled = false;
      } else {
        sendBtn.disabled = true;
      }

      // Hide previous results/errors when workflow changes
      hideStatus();
      hideResults();

      // Load history for the selected workflow
      await loadSearchHistory();
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!workflowSelect.contains(e.target)) {
      selectTrigger.classList.remove('active');
      selectDropdown.classList.add('hidden');
    }
  });
}

// Handle send button click
async function handleSendClick() {
  if (!currentWorkflow || !currentUrl) {
    showStatus('error', 'Please select a workflow');
    return;
  }

  // Get the webhook URL for the selected workflow
  const webhookUrl = CLAY_WEBHOOK_URLS[currentWorkflow];

  if (!webhookUrl) {
    showStatus('error', `Webhook URL not configured for ${formatWorkflowName(currentWorkflow)}`);
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
    const response = await fetch(webhookUrl, {
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

  // Get the correct table for the current workflow
  const tableName = SUPABASE_TABLES[currentWorkflow];

  const channel = supabase
    .channel(`enriched-data-${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: tableName
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

  // Display only specified fields in order
  if (typeof data === 'object' && data !== null) {
    DISPLAY_FIELDS.forEach(key => {
      if (key in data) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const keyElement = document.createElement('div');
        keyElement.className = 'result-key';
        keyElement.textContent = formatKey(key);

        const valueElement = document.createElement('div');
        valueElement.className = 'result-value';
        valueElement.textContent = formatValue(data[key]);

        resultItem.appendChild(keyElement);
        resultItem.appendChild(valueElement);
        resultsContent.appendChild(resultItem);
      }
    });
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
    selectTrigger.style.pointerEvents = 'none';
    selectTrigger.style.opacity = '0.6';
  } else {
    sendBtn.disabled = currentWorkflow ? false : true;
    sendBtn.classList.remove('loading');
    selectTrigger.style.pointerEvents = 'auto';
    selectTrigger.style.opacity = '1';
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

// Load search history from Supabase for the current workflow
async function loadSearchHistory() {
  try {
    // Clear existing history first
    searchHistory = [];

    // Only load history if a workflow is selected
    if (!currentWorkflow) {
      displaySearchHistory();
      return;
    }

    // Get the table name for the current workflow
    const tableName = SUPABASE_TABLES[currentWorkflow];

    // Fetch data from the workflow-specific table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Limit to most recent 50 searches

    if (error) {
      // Table doesn't exist or other error - just show empty history
      searchHistory = [];
      displaySearchHistory();
      return;
    }

    // Transform Supabase data to our history format
    searchHistory = (data || []).map(item => ({
      url: item.url || 'N/A',
      workflow: currentWorkflow,
      data: item,
      timestamp: item.created_at || item.timestamp || new Date().toISOString(),
      requestId: item.request_id
    }));

    displaySearchHistory();
  } catch (error) {
    // Silently handle any errors and show empty history
    searchHistory = [];
    displaySearchHistory();
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
    if (currentWorkflow) {
      const workflowName = formatWorkflowName(currentWorkflow);
      historyContent.innerHTML = `<div class="no-history">No previous searches for ${workflowName}</div>`;
    } else {
      historyContent.innerHTML = '<div class="no-history">Select a workflow to view history</div>';
    }
    return;
  }

  searchHistory.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.dataset.index = index;

    // Header with timestamp only (workflow name removed as it's redundant)
    const header = document.createElement('div');
    header.className = 'history-item-header';

    const timestamp = document.createElement('div');
    timestamp.className = 'history-timestamp';
    timestamp.textContent = formatTimestamp(item.timestamp);

    header.appendChild(timestamp);
    historyItem.appendChild(header);

    // URL (only show if it exists and isn't N/A)
    if (item.url && item.url !== 'N/A') {
      const url = document.createElement('div');
      url.className = 'history-url';
      url.textContent = item.url;
      historyItem.appendChild(url);
    }

    // Results container
    const results = document.createElement('div');
    results.className = 'history-results';

    // Display only specified fields in order
    if (item.data && typeof item.data === 'object') {
      DISPLAY_FIELDS.forEach(key => {
        if (key in item.data) {
          const resultItem = document.createElement('div');
          resultItem.className = 'history-result-item';

          const keyElement = document.createElement('div');
          keyElement.className = 'history-result-key';
          keyElement.textContent = formatKey(key);

          const valueElement = document.createElement('div');
          valueElement.className = 'history-result-value';
          valueElement.textContent = formatValue(item.data[key]);

          resultItem.appendChild(keyElement);
          resultItem.appendChild(valueElement);
          results.appendChild(resultItem);
        }
      });
    }

    historyItem.appendChild(results);

    // Click to expand/collapse results
    historyItem.addEventListener('click', (e) => {
      e.stopPropagation();
      results.classList.toggle('collapsed');
    });

    historyContent.appendChild(historyItem);
  });
}

// Clear search history for the current workflow from Supabase
async function handleClearHistory() {
  if (!currentWorkflow) {
    showStatus('error', 'Please select a workflow first');
    return;
  }

  const workflowName = formatWorkflowName(currentWorkflow);
  if (!confirm(`Are you sure you want to clear all ${workflowName} history? This will delete all records for this workflow.`)) {
    return;
  }

  try {
    showStatus('loading', 'Clearing history...');

    // Get the table name for the current workflow
    const tableName = SUPABASE_TABLES[currentWorkflow];

    // Delete all records from the workflow's table
    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', 0); // Delete all records (neq 0 means not equal to 0, which matches all records)

    if (error) {
      console.error('Error clearing history:', error);
      showStatus('error', `Failed to clear history: ${error.message}`);
      return;
    }

    searchHistory = [];
    displaySearchHistory();
    showStatus('success', `${workflowName} history cleared`);
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
