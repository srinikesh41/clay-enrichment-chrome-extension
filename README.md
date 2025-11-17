# Clay Enrichment Tool - Chrome Extension

A Chrome extension that sends URLs to Clay for data enrichment across three workflows, with real-time results via Supabase.

## 🎯 Features

- **3 Workflows:**
  - Get Contact Info
  - Do Account Research
  - Do Lead Research

- **Separate Data Tables:** Each workflow has its own Supabase table
- **Real-time Updates:** Results appear instantly via Supabase Realtime
- **Search History:** Independent history for each workflow
- **Direct Clay Integration:** No middleware needed

## 🏗️ Architecture

```
Chrome Extension
    ↓ Send URL + workflow
Clay Webhook (workflow-specific)
    ↓ Enriches data
Supabase Table (workflow-specific)
    ↓ Realtime update
Chrome Extension displays results
```

## 📋 Current Setup

### Workflows & Webhooks

| Workflow | Clay Webhook | Supabase Table |
|----------|--------------|----------------|
| Get Contact Info | `...44b82f58-53da-4941-85fd-630f785f594d` | `enriched_data` |
| Do Account Research | `...32f6a132-d7fd-46d8-8eae-083406dcd7fc` | `account_research_data` |
| Do Lead Research | `...42e85c66-36ca-4df0-8ff2-d3e8b7b38d09` | `lead_research_data` |

### Supabase Configuration

**Project:** `https://zknyztmngccsxdtiddvz.supabase.co`

**Tables needed:**
- `enriched_data` (for Get Contact Info) ✅
- `account_research_data` (for Account Research)
- `lead_research_data` (for Lead Research)

Each table should have:
- `id` (bigint, primary key, auto-increment)
- `created_at` (timestamp with time zone, default: now())
- `request_id` (text, unique)
- `url` (text)
- `workflow` (text)
- Additional fields based on enrichment type

**Important:** Enable Realtime replication for all tables.

## 🚀 Installation

1. **Install the Extension**
   ```bash
   1. Open Chrome → chrome://extensions/
   2. Enable "Developer mode"
   3. Click "Load unpacked"
   4. Select the extension folder
   ```

2. **Verify Setup**
   - Extension icon shows The Kiln logo
   - Click icon → popup opens
   - Shows current URL
   - Dropdown has 3 workflows

## 💻 Usage

1. Navigate to any webpage (LinkedIn profile, company page, etc.)
2. Click the extension icon
3. Select a workflow from dropdown
4. Click "Send to Clay"
5. Wait for enriched data to appear (via Realtime)
6. View results in the popup
7. Check workflow-specific history below

## 📁 File Structure

```
/Chrome Extension/
├── manifest.json          # Extension config
├── popup.html            # UI structure
├── popup.css             # Styling
├── popup.js              # Main logic
├── supabase.js           # Supabase client SDK
├── icon16.png            # The Kiln logo (16x16)
├── icon48.png            # The Kiln logo (48x48)
├── icon128.png           # The Kiln logo (128x128)
├── TheKilnLogo.png       # Source logo
├── README.md             # This file
└── SUPABASE_GUIDE.md     # Supabase setup instructions
```

## 🔧 Configuration

### popup.js Configuration

```javascript
// Clay webhooks (already configured)
const CLAY_WEBHOOK_URLS = {
  'get_contact_info': 'https://api.clay.com/...',
  'do_account_research': 'https://api.clay.com/...',
  'do_lead_research': 'https://api.clay.com/...'
};

// Supabase tables (already configured)
const SUPABASE_TABLES = {
  'get_contact_info': 'enriched_data',
  'do_account_research': 'account_research_data',
  'do_lead_research': 'lead_research_data'
};

// Supabase connection (already configured)
const SUPABASE_URL = 'https://zknyztmngccsxdtiddvz.supabase.co';
const SUPABASE_ANON_KEY = '...';
```

## 🗄️ Supabase Tables

### Creating New Tables

For each new workflow table (`account_research_data`, `lead_research_data`):

1. Go to Supabase → Table Editor → New Table
2. Name: `account_research_data` (or `lead_research_data`)
3. Disable RLS (for development)
4. Add columns:
   - `id` (int8, primary key, auto-increment)
   - `created_at` (timestamptz, default: now())
   - `request_id` (text, unique, not null)
   - `url` (text)
   - `workflow` (text)
   - Additional enrichment fields (specific to workflow)
5. Go to Database → Replication → Enable for this table

## 🔍 How It Works

### 1. User Sends Request
```javascript
Extension → Clay Webhook
Payload: { url, workflow, requestId, timestamp }
```

### 2. Clay Enriches Data
```
Clay processes the URL
Extracts/enriches data based on workflow
```

### 3. Clay Sends to Supabase
```javascript
Clay → Supabase Table (workflow-specific)
Payload: { request_id, url, workflow, ...enriched_fields }
```

### 4. Extension Receives via Realtime
```javascript
Supabase Realtime → Extension
Extension displays results instantly
Saves to workflow-specific history
```

## 🎨 UI Features

### Search History
- **Workflow-Specific:** Each workflow shows only its own history
- **Auto-Load:** History loads when selecting a workflow
- **Expandable Results:** Click items to view enrichment details
- **Clear History:** Clears only current workflow's history

### Display
- **Timestamp:** Shows relative time (e.g., "5 mins ago")
- **URL:** Only shown if valid (hides "N/A")
- **Results:** Key-value pairs of enriched data
- **No Redundancy:** Workflow name not shown (already selected)

## 🐛 Troubleshooting

### Extension won't load
- Check all files are in folder
- Enable Developer mode in Chrome
- Check for errors in `chrome://extensions/`

### No history showing
- Select a workflow first
- Check if Supabase table exists
- Verify Realtime is enabled on table

### Data not returning
- Check Clay webhook is configured correctly
- Verify Supabase table exists for that workflow
- Check Supabase Realtime is enabled
- Open popup console (right-click icon → Inspect) for errors

### Wrong history showing
- Make sure you selected the correct workflow
- Clear browser cache and reload extension
- Check popup.js has correct table mappings

## 🔐 Security Notes

- Supabase anon key is safe to expose (read-only operations)
- RLS (Row Level Security) should be enabled for production
- Never commit service role keys to code

## 📝 Development

### Reload Extension After Changes
```bash
1. Go to chrome://extensions/
2. Click reload icon on "Clay Enrichment Tool"
```

### View Console Logs
```bash
Right-click extension icon → "Inspect popup"
Check Console tab for logs
```

### Test Supabase Connection
```javascript
// In popup console
supabase.from('enriched_data').select('*').limit(1)
```

## 🔗 Links

- **Supabase Project:** https://zknyztmngccsxdtiddvz.supabase.co
- **Clay API Docs:** https://clay.com/docs
- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions/

## 📄 License

Internal tool for The Kiln

---

**Last Updated:** November 17, 2025
