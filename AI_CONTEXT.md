# AI Context - Chrome Extension Project

**Purpose:** Quick reference for AI assistants to understand this project.

---

## Project Summary

**Name:** Clay Enrichment Chrome Extension (The Kiln)

**What it does:** Chrome extension that captures the current page URL, sends it to Clay workflows for data enrichment, and displays results in real-time. Supports multi-user authentication with per-user data isolation.

**Tech Stack:**
- Chrome Extension (Manifest V3)
- Supabase (Auth, Database, Realtime)
- Clay (Data enrichment webhooks)
- Vercel (Email verification page)

---

## Architecture

```
User clicks extension
       ↓
popup.js checks auth → Not logged in → auth.html
       ↓
Auth check passes
       ↓
User selects workflow + clicks "Send to Clay"
       ↓
Webhook sent to Clay with: url, workflow, requestId, user_id, user_email
       ↓
Clay enriches data
       ↓
Clay writes to Supabase (needs service_role key to bypass RLS)
       ↓
Supabase Realtime pushes update to extension
       ↓
popup.js displays enriched data
```

---

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `popup.js` | Main logic, auth check, Clay webhooks, Realtime subscriptions | 780 |
| `popup.html` | Main UI with workflow dropdown, results, history | 150 |
| `auth.js` | Sign up, sign in, OAuth, password reset handlers | 507 |
| `auth.html` | Auth forms (sign in, sign up, forgot password) | 140 |
| `verify-page/index.html` | Vercel-hosted email verification + password reset | 400 |
| `SUPABASE_AUTH_SETUP.sql` | Database schema, RLS policies, table creation | 182 |

---

## Configuration

**Supabase:**
- Project ID: `zknyztmngccsxdtiddvz`
- URL: `https://zknyztmngccsxdtiddvz.supabase.co`
- Anon key in: `popup.js:19`, `auth.js`

**Clay Webhooks (popup.js:2-6):**
- `get_contact_info` → writes to `enriched_data`
- `do_account_research` → writes to `account_research_data`
- `do_lead_research` → writes to `lead_research_data`

**Vercel:**
- URL: `https://thekilnchromeext.vercel.app`
- Handles: Email confirmation, password reset callbacks

---

## Database Schema

### enriched_data (EXISTS)
```sql
- id, user_id, request_id, url, workflow, created_at
- name, title, org, country, work_email
- RLS enabled, Realtime enabled
```

### account_research_data (NEEDS CREATION)
```sql
- id, user_id, request_id, url, workflow, created_at
- company_name, industry, employee_count, revenue, location, website, description
- RLS policies ready in SUPABASE_AUTH_SETUP.sql:57-99
```

### lead_research_data (NEEDS CREATION)
```sql
- id, user_id, request_id, url, workflow, created_at
- name, title, org, country, work_email, linkedin_url, phone, seniority_level
- RLS policies ready in SUPABASE_AUTH_SETUP.sql:104-147
```

---

## Current Blocker

**Problem:** Clay cannot write to Supabase because RLS is enabled and Clay uses the anon key.

**Solution:**
1. Get service_role key from Supabase Settings → API
2. Configure Clay to use service_role key instead of anon key
3. Ensure Clay writes `user_id` (received in webhook) to the table

---

## Auth Flow Details

**Session Storage:**
- Chrome: `chrome.storage.local` → `supabase_session`, `supabase_user`
- Restored on popup open: `popup.js:89-126`

**Auth Guard:**
- `popup.js:50-88` checks auth on DOMContentLoaded
- Redirects to `auth.html` if no session

**OAuth:**
- Uses `chrome.identity.launchWebAuthFlow()` in `auth.js:334-414`

**Password Reset:**
- Request: `auth.js:416-451`
- Callback handling: `verify-page/index.html:329-400`

---

## Data Flow

**Extension → Clay:**
```javascript
// popup.js:388-395
const webhookData = {
  url: currentUrl,
  workflow: currentWorkflow,
  requestId: requestId,
  timestamp: new Date().toISOString(),
  user_id: currentUser?.id || null,
  user_email: currentUser?.email || null
};
```

**Realtime Subscription:**
```javascript
// popup.js:420-465
supabase
  .channel('enriched-data-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: tableName,
    filter: `request_id=eq.${requestId}`
  }, callback)
  .subscribe()
```

---

## Git Repositories

**Main Extension:**
- Repo: `https://github.com/srinikesh41/clay-enrichment-chrome-extension.git`
- Branch: `main`

**Verify Page (separate repo for Vercel):**
- Repo: `https://github.com/srinikesh41/thekilnchromeext.git`
- Path: `/verify-page/`
- Deployed to: Vercel

---

## What's Working

- Email sign up/in with confirmation
- Google OAuth
- Password reset (tested Nov 18)
- Profile dropdown with sign out
- Session persistence (code complete, needs testing)
- Auth guard redirects
- RLS on enriched_data
- Realtime for enriched_data
- UI/styling complete

---

## What Needs Work

1. **Clay Integration** - Configure service_role key and user_id mapping
2. **Database** - Create account_research_data and lead_research_data tables
3. **Realtime** - Enable for new tables
4. **Testing** - Full end-to-end data flow with auth

---

## Common Tasks

### Adding a new workflow
1. Add webhook URL to `CLAY_WEBHOOK_URLS` in `popup.js:2-6`
2. Add table mapping to `SUPABASE_TABLES` in `popup.js:12-16`
3. Create table in Supabase with RLS policies
4. Add option to dropdown in `popup.html`
5. Enable Realtime for new table

### Debugging auth issues
- Check `chrome.storage.local` for `supabase_session`
- Look at Network tab for Supabase auth responses
- Check Supabase Dashboard → Authentication → Users

### Debugging Clay issues
- Check Clay webhook logs for incoming data
- Verify service_role key is configured
- Check Supabase table for RLS policy violations

---

## Important Code Locations

| Feature | File | Lines |
|---------|------|-------|
| Auth check | popup.js | 50-88 |
| Session restore | popup.js | 89-126 |
| Profile dropdown | popup.js | 128-292 |
| Send to Clay | popup.js | 368-418 |
| Realtime subscribe | popup.js | 420-465 |
| History load | popup.js | 570-640 |
| Sign in handler | auth.js | 208-261 |
| Sign up handler | auth.js | 263-332 |
| OAuth handler | auth.js | 334-414 |
| Password reset | auth.js | 416-451 |

---

## Security Notes

- Service_role key should NEVER be in client-side code
- It's only for server-side/Clay to bypass RLS
- Extension uses anon key (safe for client)
- RLS ensures users only see their own data
- XSS protection on Vercel page via sanitize function
