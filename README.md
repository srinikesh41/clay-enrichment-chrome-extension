# Clay Enrichment Tool - Chrome Extension

A Chrome extension that captures URLs and enriches them with Clay data via Zapier.

## Features

- Auto-captures current tab URL
- Select from 3 workflow types:
  - Get contact info
  - Do account research
  - Do lead research
- Sends data to Zapier for Clay enrichment
- Displays enriched results in clean UI
- Error handling and retry functionality

## Installation

### 1. Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the folder containing these extension files
5. The extension should now appear in your extensions list

### 2. Pin the Extension

1. Click the puzzle icon in Chrome's toolbar
2. Find "Clay Enrichment Tool"
3. Click the pin icon to keep it visible in your toolbar

## Configuration

### Step 1: Configure the Zapier Webhook URL

1. Open `popup.js` in a text editor
2. Find this line near the top:
   ```javascript
   const ZAPIER_WEBHOOK_URL = 'YOUR_ZAPIER_WEBHOOK_URL_HERE';
   ```
3. Replace `'YOUR_ZAPIER_WEBHOOK_URL_HERE'` with your actual Zapier webhook URL
4. Save the file
5. Reload the extension in `chrome://extensions/` (click the refresh icon)

### Step 2: Set Up Zapier Workflow

Create a Zapier workflow with these steps:

**Trigger: Webhook (Catch Hook)**
- This generates the webhook URL you'll use in Step 1
- Zapier will receive: `{ "url": "...", "workflow": "...", "requestId": "...", "timestamp": "..." }`

**Action: Call Clay API**
- Use the `url` and `workflow` fields from the webhook data
- Configure Clay to enrich the data based on the workflow type

**Action: Send Results Back**
- See "Architecture & Data Flow" section below for options

## Architecture & Data Flow

### Current Flow (Outbound Only)

Currently, the extension can successfully:
1. Capture the current tab URL
2. Send it to Zapier with the selected workflow type
3. Zapier can process it with Clay

### Receiving Data Back (Two Options)

Chrome extensions cannot directly receive HTTP POST requests from external services. You need to choose one of these approaches:

#### Option A: Simple Backend Server (Recommended)

1. **Set up a simple backend server** (Node.js, Python, etc.) with two endpoints:
   - `POST /webhook` - Receives data from Zapier
   - `GET /results?requestId=xxx` - Extension polls for results

2. **Example Node.js Server** (minimal):
   ```javascript
   const express = require('express');
   const app = express();
   const results = new Map();

   app.use(express.json());

   // Zapier sends enriched data here
   app.post('/webhook', (req, res) => {
     const { requestId, data } = req.body;
     results.set(requestId, { data, timestamp: Date.now() });
     // Clean up after 5 minutes
     setTimeout(() => results.delete(requestId), 300000);
     res.json({ success: true });
   });

   // Extension polls this endpoint
   app.get('/results', (req, res) => {
     const { requestId } = req.query;
     const result = results.get(requestId);
     if (result) {
       results.delete(requestId);
       res.json({ status: 'complete', result: result.data });
     } else {
       res.json({ status: 'pending' });
     }
   });

   app.listen(3000);
   ```

3. **Configure the extension for polling**:
   - Open `background.js`
   - Set `POLLING_ENABLED = true`
   - Set `POLLING_ENDPOINT` to your backend URL (e.g., `http://localhost:3000/results`)
   - Reload the extension

4. **Update Zapier**:
   - Have Zapier POST enriched data to your backend's `/webhook` endpoint
   - Include the `requestId` from the original request

#### Option B: Firebase/Cloud Storage

1. Use Firebase Realtime Database or Firestore
2. Extension writes request with unique ID
3. Zapier writes enriched data to same location
4. Extension listens for real-time updates
5. Requires adding Firebase SDK to the extension

## Usage

1. Navigate to any webpage (e.g., a LinkedIn profile)
2. Click the Clay Enrichment Tool extension icon
3. The current URL will be automatically captured
4. Select a workflow type from the dropdown
5. Click "Send to Clay"
6. Wait for the enriched data to appear (if backend is configured)

## File Structure

```
/Chrome Extension/
├── manifest.json          # Extension configuration
├── popup.html            # Popup UI structure
├── popup.css             # Popup styling
├── popup.js              # Popup logic (UPDATE WEBHOOK URL HERE)
├── background.js         # Background service worker
├── README.md             # This file
└── icons/                # Extension icons (add your own)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Adding Custom Icons

The extension currently references icons that need to be created:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can:
1. Create icons with these dimensions
2. Use a tool like [favicon.io](https://favicon.io/) to generate them
3. Or temporarily remove icon references from `manifest.json`

## Troubleshooting

### Extension won't load
- Check that all files are in the same folder
- Make sure Developer mode is enabled in `chrome://extensions/`
- Check the Chrome console for errors

### "Please configure ZAPIER_WEBHOOK_URL" error
- You need to update the `ZAPIER_WEBHOOK_URL` in `popup.js`
- Don't forget to reload the extension after making changes

### Can't get current URL
- Extension needs permission to access the current tab
- Make sure you're on a normal webpage (not chrome:// pages)

### Data not coming back
- You need to set up a backend server (see Option A above)
- Or implement Firebase storage (see Option B above)
- Without this, the extension can only send data, not receive it

### Request timeout
- Default timeout is 30 seconds
- Check your Zapier workflow is running
- Check your backend server is accessible
- Verify network connectivity

## Next Steps

1. **Set up icons** - Add proper icon files for a professional look
2. **Backend server** - Implement one of the data return options above
3. **Testing** - Test the complete flow end-to-end
4. **Error logging** - Add more detailed error logging for debugging
5. **Data validation** - Add validation for Clay response data
6. **Security** - Add authentication if handling sensitive data

## Development Tips

- Check the extension console: Right-click the extension icon → "Inspect popup"
- Check the background worker console: `chrome://extensions/` → "Inspect views: background page"
- Reload extension after code changes: `chrome://extensions/` → Click refresh icon
- Monitor network requests in the popup inspector's Network tab

## Support

For Chrome extension development help:
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

For Zapier help:
- [Zapier Webhooks Documentation](https://zapier.com/apps/webhook/integrations)
- [Zapier API Documentation](https://zapier.com/help/create/code-webhooks)
