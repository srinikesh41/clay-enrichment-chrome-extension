# Quick Start Guide - Clay Enrichment Tool

## 🚀 Get Started in 5 Minutes

### Step 1: Create Placeholder Icons (1 minute)

The extension needs icons to load. Here are the fastest ways to create them:

**Option A: Use Online Tool (Easiest)**
1. Go to https://favicon.io/favicon-generator/
2. Generate icons with text "CE" or "Clay"
3. Download and extract the zip
4. Copy `favicon-16x16.png` → rename to `icon16.png`
5. Copy `favicon-32x32.png` → rename to `icon48.png` (or create 48x48)
6. Create a 128x128 version → save as `icon128.png`
7. Place all three in the extension folder

**Option B: Skip Icons (Quick Test)**
1. Comment out the icon lines in `manifest.json`:
   ```json
   "action": {
     "default_popup": "popup.html"
     // Remove icon references for now
   }
   // Remove icons section
   ```

### Step 2: Install Extension (1 minute)

1. Open Chrome and go to `chrome://extensions/`
2. Toggle "Developer mode" ON (top-right)
3. Click "Load unpacked"
4. Select this folder: `/Chrome Extension/`
5. Extension should load successfully!

### Step 3: Configure Zapier Webhook (2 minutes)

1. Open `popup.js` in any text editor
2. Find line 2:
   ```javascript
   const ZAPIER_WEBHOOK_URL = 'YOUR_ZAPIER_WEBHOOK_URL_HERE';
   ```
3. Replace with your actual Zapier webhook URL:
   ```javascript
   const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/';
   ```
4. Save the file
5. Go back to `chrome://extensions/` and click the refresh icon on your extension

### Step 4: Test the Extension (1 minute)

1. Navigate to any webpage (e.g., https://www.linkedin.com/in/someone)
2. Click the extension icon in Chrome toolbar
3. Select a workflow from dropdown
4. Click "Send to Clay"
5. You should see "Request sent! Waiting for enriched data..."

**At this point, your extension is sending data to Zapier!** ✅

### Step 5: Complete the Loop (Optional - requires backend)

To receive data back from Zapier, you need a backend server. See two options below:

#### Option A: Run Local Server (Development)

1. Install Node.js: https://nodejs.org/
2. Open terminal/command prompt in the extension folder
3. Run:
   ```bash
   npm init -y
   npm install express cors
   node example-backend-server.js
   ```
4. Server starts on http://localhost:3000
5. Configure Zapier to POST to: `http://localhost:3000/webhook`
6. Update `background.js`:
   - Set `POLLING_ENABLED = true`
   - Set `POLLING_ENDPOINT = 'http://localhost:3000/results'`
7. Reload extension

**Note:** For local testing, you'll need to expose localhost to the internet using:
- ngrok: https://ngrok.com/
- localtunnel: https://localtunnel.github.io/www/
- Zapier only works with public URLs

#### Option B: Deploy to Cloud (Production)

Deploy `example-backend-server.js` to:
- **Heroku** (Free tier available)
- **Railway** (Easy deployment)
- **Vercel** (Serverless functions)
- **AWS Lambda** (Serverless)

Then use your deployed URL in Zapier and the extension.

## 📋 Zapier Workflow Setup

### Trigger: Webhook
1. Choose "Catch Hook"
2. Copy the webhook URL
3. Use it in `popup.js`

### Action: HTTP Request (to Clay)
1. Method: POST
2. URL: Your Clay webhook URL
3. Body:
   ```json
   {
     "url": "{{url}}",
     "workflow": "{{workflow}}"
   }
   ```

### Action: Webhook POST (Response back)
1. URL: Your backend server URL (e.g., `http://your-server.com/webhook`)
2. Body:
   ```json
   {
     "requestId": "{{requestId}}",
     "data": "{{clay_response}}",
     "url": "{{url}}",
     "workflow": "{{workflow}}"
   }
   ```

## ✅ Verification Checklist

- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] Icons are present (or icon references removed)
- [ ] `ZAPIER_WEBHOOK_URL` is configured in `popup.js`
- [ ] Extension captures current URL correctly
- [ ] Dropdown shows 3 workflow options
- [ ] Send button works and shows "Sending..." state
- [ ] Data is received by Zapier (check Zapier task history)
- [ ] (Optional) Backend server is running and accessible
- [ ] (Optional) Data returns to extension and displays

## 🐛 Common Issues

### "Please configure ZAPIER_WEBHOOK_URL"
- You forgot to update the URL in `popup.js`
- Make sure to save and reload the extension

### Extension won't load
- Check all files are in the same folder
- Make sure Developer mode is ON
- If icon errors, remove icon references from manifest

### Can't see extension icon
- Click the puzzle piece icon in Chrome toolbar
- Pin the "Clay Enrichment Tool"

### Zapier not receiving data
- Check webhook URL is correct
- Check Zapier task history for incoming requests
- Open extension popup console (right-click icon → Inspect)

### Data not coming back
- You need a backend server running
- Zapier needs to POST to your backend
- Backend must be publicly accessible (use ngrok for local testing)

## 📖 Next Steps

1. **Test end-to-end** - Make sure the full flow works
2. **Add proper icons** - Use your brand colors
3. **Deploy backend** - Move from localhost to production
4. **Customize UI** - Edit `popup.css` for your brand
5. **Add more workflows** - Extend the dropdown options
6. **Error handling** - Test error scenarios
7. **Security** - Add authentication for production use

## 🆘 Need Help?

- Extension console: Right-click extension icon → "Inspect popup"
- Background worker console: `chrome://extensions/` → "Inspect views: service worker"
- Check README.md for detailed documentation
- Chrome extension docs: https://developer.chrome.com/docs/extensions/

---

**You're all set! Happy enriching! 🎉**
