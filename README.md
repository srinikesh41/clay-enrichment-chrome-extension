# 🔥 Cooked - Clay Enrichment

A Chrome extension that enriches LinkedIn URLs using Clay and stores your data privately.

## What It Does

1. **Browse LinkedIn** - Navigate to any LinkedIn profile
2. **Click Extension** - Open Cooked from your Chrome toolbar
3. **Get Contact Info** - One click to enrich the profile
4. **See Results** - Name, title, company, email instantly

Your enriched data is saved and only you can see it.

## Features

- 🔐 **Private** - Your data is yours. Other users can't see it.
- ⚡ **Fast** - Results in seconds via Clay enrichment
- 📝 **History** - All your past searches saved
- 🔑 **Secure** - Email or Google sign-in

## Setup

### 1. Install Extension
```bash
1. Open Chrome
2. Go to chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select this folder
```

### 2. Sign In
- Click the extension icon
- Sign up with email or Google
- Start enriching!

## Tech Stack

- **Frontend:** Chrome Extension (Vanilla JS)
- **Backend:** Supabase (Auth + Database + Realtime)
- **Enrichment:** Clay (LinkedIn data extraction)

## How It Works

```
You → Extension → Clay → Enriches → Supabase → Extension → You
                  ↓
            (Gets contact info)
```

1. Extension sends LinkedIn URL to Clay with your user ID
2. Clay extracts contact information
3. Clay saves to your private Supabase database
4. Extension shows you the results instantly
5. Data is filtered by your user ID (privacy!)

## Privacy

- Each user gets a unique ID when they sign up
- All enriched data is tagged with your user ID
- Database queries only return YOUR data
- Nobody else can see your enrichments

## Documentation

- **STATUS.md** - Complete system documentation
- **SUMMARY.md** - Quick overview of the project
- **DIAGNOSTIC_QUERIES.sql** - Debug queries

## Requirements

- Chrome browser
- Clay account (for enrichment workflow)
- Supabase account (provided in codebase)

## Configuration

Already configured! Just load the extension and sign in.

If you need to modify:
- Supabase: Settings in `popup.js` and `auth.js`
- Clay: Webhook URL in `popup.js`

## Support

Check `STATUS.md` for:
- Full architecture details
- Debugging guide
- Common issues and solutions

---

**Built for private, fast LinkedIn enrichment** 🚀

> **Note:** This is a simplified, public-facing version of the Chrome extension. The full production version with additional features is private.


