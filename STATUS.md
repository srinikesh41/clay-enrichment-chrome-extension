# Project Status

**Last Updated:** January 18, 2026
**Version:** 2.0
**Status:** ✅ FULLY WORKING

---

## 🎉 CURRENT STATE - EVERYTHING WORKING

**The Kiln** Chrome Extension is now fully operational:
- ✅ Authentication (email + Google OAuth)
- ✅ URL enrichment via Clay
- ✅ Private data per user (RLS enforced)
- ✅ Real-time data display
- ✅ Search history

---

## 📊 System Overview

| Component | Status | Notes |
|-----------|--------|-------|
| Chrome Extension | ✅ Working | Sends requests, displays results |
| Supabase Auth | ✅ Working | Email + Google OAuth |
| Supabase Database | ✅ Working | enriched_data table with RLS |
| Clay Enrichment | ✅ Working | Enriches LinkedIn URLs |
| Clay → Supabase | ✅ Working | Writes with user_id correctly |
| Realtime Updates | ✅ Working | Extension receives enriched data |
| Search History | ✅ Working | Shows user's past searches |

---

## 🏗️ Architecture

### Complete Data Flow

```
1. User Authentication
   User signs up/in → Supabase Auth → Extension gets user.id
   └─ user.id = "291f2fb3-3cdd-446d-889b-b93e79fc6686"

2. Enrichment Request
   User selects URL → Extension sends to Clay webhook:
   {
     "url": "https://linkedin.com/in/example",
     "user_id": "291f2fb3-...",
     "request_id": "1768779790181",
     "workflow": "get_contact_info"
   }

3. Clay Processing
   Clay receives webhook
   → Enriches URL (extracts name, title, org, country, work_email)
   → Writes to Supabase via REST API:
     POST https://zknyztmngccsxdtiddvz.supabase.co/rest/v1/enriched_data
     Headers:
       - apikey: <service_role_key>
       - Authorization: Bearer <service_role_key>
     Body:
       {
         "user_id": "291f2fb3-...",
         "request_id": "1768779790181",
         "url": "https://linkedin.com/in/example",
         "workflow": "get_contact_info",
         "name": "John Doe",
         "title": "Engineer",
         "org": "Company",
         "country": "USA",
         "work_email": "john@company.com"
       }

4. Real-time Notification
   Supabase Realtime → Extension receives new row
   → Extension displays enriched data
   → Extension updates search history

5. Privacy (RLS)
   User A queries: SELECT * FROM enriched_data WHERE auth.uid() = user_id
   → Only sees rows with user_id = User A's ID
   User B cannot see User A's data
```

---

## 🐛 Issue Resolution Timeline (Jan 18, 2026)

### The Problem
After Supabase paused due to inactivity and was reopened:
- Extension could send requests ✅
- Clay could enrich URLs ✅
- Data was being written to Supabase ✅
- **BUT:** `user_id` field was always NULL ❌
- **Result:** Users couldn't see their enriched data (RLS blocked NULL user_id)

### The Investigation

**Step 1: Verified Extension**
- Extension WAS sending user_id correctly: `"user_id": "291f2fb3-3cdd-446d-889b-b93e79fc6686"` ✅
- Extension auth working ✅

**Step 2: Verified Clay Webhook**
- Clay WAS receiving user_id correctly ✅
- Webhook input showed user_id field ✅

**Step 3: Verified Clay Enrichment**
- Clay WAS enriching data correctly ✅
- Name, title, org, country, work_email all populated ✅

**Step 4: Checked Supabase Write**
- Enrichment fields (name, org, title) were being saved ✅
- BUT user_id, url, workflow were NULL ❌

**Step 5: Diagnosed Clay HTTP API Configuration**
- Body field mappings were correct ✅
- Endpoint was correct ✅
- Using service_role key ✅
- **BUT:** Authorization header was missing "Bearer " prefix ❌

**Step 6: Fixed RLS Policies**
- Initial RLS policies were blocking service_role ❌
- Changed INSERT policy to `TO authenticated` (excludes service_role) ✅
- Removed FORCE RLS to allow service_role bypass ✅

### The Root Cause

**TWO issues:**

1. **Clay Authorization Header Missing "Bearer " Prefix**
   - Had: `Authorization: eyJhbG...`
   - Needed: `Authorization: Bearer eyJhbG...`
   - This caused 401 errors from Supabase

2. **RLS Policies Blocking Service Role**
   - Policies were set to block ALL roles including service_role
   - Fixed by setting policies to `TO authenticated` only
   - service_role now bypasses RLS and can insert with any user_id

### The Solution

**In Clay HTTP API Step:**

Headers:
```
apikey: <service_role_key>
Authorization: Bearer <service_role_key>  ← Added "Bearer " prefix
Content-Type: application/json
Prefer: return=representation
```

**In Supabase:**

```sql
-- Allow service_role to bypass RLS
ALTER TABLE enriched_data NO FORCE ROW LEVEL SECURITY;
ALTER TABLE enriched_data ENABLE ROW LEVEL SECURITY;

-- Policies apply to authenticated users only (service_role bypasses)
CREATE POLICY "Authenticated users can insert own data"
  ON enriched_data FOR INSERT
  TO authenticated  ← Key: excludes service_role
  WITH CHECK (auth.uid() = user_id);
```

---

## 🗄️ Database Schema

### enriched_data Table

```sql
CREATE TABLE enriched_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id TEXT,
  url TEXT,
  workflow TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  title TEXT,
  org TEXT,
  country TEXT,
  work_email TEXT
);

CREATE INDEX idx_enriched_data_user_id ON enriched_data(user_id);
CREATE INDEX idx_enriched_data_created_at ON enriched_data(created_at DESC);
CREATE INDEX idx_enriched_data_request_id ON enriched_data(request_id);
```

### RLS Policies

```sql
-- INSERT: Authenticated users can only insert their own data
-- service_role bypasses this policy
CREATE POLICY "Authenticated users can insert own data"
  ON enriched_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SELECT: Users can only view their own data
CREATE POLICY "Users can view own enriched data"
  ON enriched_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- UPDATE: Users can only update their own data
CREATE POLICY "Users can update own enriched data"
  ON enriched_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own data
CREATE POLICY "Users can delete own enriched data"
  ON enriched_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Realtime

Enabled for `enriched_data` table via Supabase Dashboard:
- Database → Replication → enriched_data → Enable

---

## 🔑 Authentication Flow

### Email Sign Up
1. User enters email/password → Creates account
2. Supabase sends confirmation email
3. User clicks link → Vercel page verifies (`https://thekilnchromeext.vercel.app`)
4. User opens extension → Signs in
5. Extension stores session + user object with `user.id`

### Email Sign In
1. User enters email/password
2. Supabase validates → Returns session with `user.id`
3. Extension saves to Chrome storage
4. Redirects to popup.html

### Google OAuth
1. User clicks "Continue with Google"
2. Chrome Identity API opens OAuth flow
3. Google authenticates → Returns token
4. Supabase creates session with `user.id`
5. Extension saves and redirects

### Session Persistence
- Stored in `chrome.storage.local` as `supabase_session` and `supabase_user`
- On popup open, extension checks storage and restores session
- Global variable `currentUser` holds user object with `currentUser.id`

---

## 🔧 Clay Configuration

### Webhook Endpoint
Receives POST requests from extension at:
```
https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-44b82f58-53da-4941-85fd-630f785f594d
```

### Workflow Steps
1. **Webhook** - Receives URL and user_id from extension
2. **Enrichment** - Extracts contact info from LinkedIn URL
3. **HTTP API** - Writes enriched data to Supabase

### HTTP API Configuration

**Method:** POST

**Endpoint:**
```
https://zknyztmngccsxdtiddvz.supabase.co/rest/v1/enriched_data
```

**Headers:**
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprbnl6dG1uZ2Njc3hkdGlkZHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyNjIwNSwiZXhwIjoyMDc4NzAyMjA1fQ...
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprbnl6dG1uZ2Njc3hkdGlkZHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyNjIwNSwiZXhwIjoyMDc4NzAyMjA1fQ...
Content-Type: application/json
Prefer: return=representation
```

**Body:**
```json
{
  "user_id": "{{Webhook.user_id}}",
  "request_id": "{{Webhook.requestId}}",
  "url": "{{Webhook.url}}",
  "workflow": "{{Webhook.workflow}}",
  "name": "{{Enrichment.name}}",
  "title": "{{Enrichment.title}}",
  "org": "{{Enrichment.org}}",
  "country": "{{Enrichment.country}}",
  "work_email": "{{Enrichment.work_email}}"
}
```

**Critical:**
- Must use `service_role` key (not anon key)
- Authorization header MUST have "Bearer " prefix
- Field mappings: user_id/request_id/url/workflow from Webhook, enrichment fields from Enrichment step

---

## 📁 File Structure

```
/clay-enrichment-chrome-extension/
├── popup.html              # Main popup UI
├── popup.js                # Main logic (sends to Clay, receives from Realtime)
├── popup.css               # Styling
├── auth.html               # Login/signup UI
├── auth.js                 # Authentication logic
├── auth.css                # Auth styling
├── supabase.js             # Supabase SDK
├── manifest.json           # Chrome extension manifest
├── ThekilnLogoRounded.png  # Extension icon
├── STATUS.md               # This file
├── SUPABASE_AUTH_SETUP.sql # Database setup script
├── DIAGNOSTIC_QUERIES.sql  # Debugging queries
├── FIX_RLS_FOR_CLAY.sql    # RLS configuration for service_role
└── verify-page/            # Email verification page (Vercel)
    ├── index.html
    └── vercel.json
```

---

## 🔍 Debugging Guide

### If user_id is NULL in Database

1. **Check Extension Sends user_id:**
   - Open browser console: right-click popup → Inspect → Console
   - Look for: `Sending to Clay: { user_id: "..." }`
   - If NULL: User not authenticated, check `currentUser` variable

2. **Check Clay Receives user_id:**
   - In Clay, check webhook step recent runs
   - Verify "User Id" column has UUID value
   - If NULL: Extension not sending, check popup.js line 393

3. **Check Clay Sends user_id to Supabase:**
   - In Clay HTTP API step, preview request body
   - Should show: `"user_id": "291f2fb3-..."`
   - If shows `"user_id": null`: Variable not mapped to webhook input

4. **Check Supabase Receives user_id:**
   - Run: `SELECT id, user_id, name FROM enriched_data ORDER BY id DESC LIMIT 1;`
   - If user_id is NULL but name is populated: Clay not sending user_id
   - If entire row missing: RLS blocking or endpoint wrong

5. **Check RLS Policies:**
   - Run queries in `DIAGNOSTIC_QUERIES.sql`
   - Verify INSERT policy is `TO authenticated` (not `TO public`)
   - Verify FORCE RLS is disabled: `ALTER TABLE enriched_data NO FORCE ROW LEVEL SECURITY;`

6. **Check Authorization Header:**
   - Must be: `Authorization: Bearer <service_role_key>`
   - NOT: `Authorization: <service_role_key>` (missing "Bearer ")

### If Enrichment Fields are NULL

- Clay enrichment step failing
- Check Clay workflow logs for errors
- Verify enrichment provider is configured
- Check field mappings in HTTP API body

### If Extension Doesn't Receive Data

1. **Check Realtime is Enabled:**
   - Supabase Dashboard → Database → Replication
   - enriched_data table should show "Enabled"

2. **Check Extension Subscription:**
   - Browser console should show Realtime connection
   - Look for errors in console

3. **Check request_id Matches:**
   - Extension generates `requestId` when sending
   - Clay should write same value as `request_id`
   - Extension listens for rows where `request_id` matches

---

## 🚀 Testing Checklist

### Auth Flow
- [x] Email sign up
- [x] Email confirmation (via Vercel)
- [x] Email sign in
- [x] Google OAuth sign in
- [x] Profile dropdown shows name/email
- [x] Sign out works
- [ ] Password reset flow
- [x] Session persistence (close/reopen)

### Enrichment Flow
- [x] Select workflow
- [x] Send URL to Clay
- [x] Clay enriches data
- [x] Clay writes to Supabase with user_id
- [x] Extension receives via Realtime
- [x] Data displays in extension
- [x] History shows past searches

### Privacy (RLS)
- [x] User A can only see User A's data
- [x] User B cannot see User A's data
- [x] service_role (Clay) can write with any user_id

---

## 📝 Important Notes

### Scope
- **IN SCOPE:** `get_contact_info` workflow only
- **OUT OF SCOPE:** `do_account_research` and `do_lead_research` workflows

### Keys
- **Anon Key:** Used by extension for auth and queries (in popup.js, auth.js)
- **Service Role Key:** Used by Clay for writes (bypasses RLS)

### Supabase Project
- **Project URL:** https://zknyztmngccsxdtiddvz.supabase.co
- **Project ID:** zknyztmngccsxdtiddvz

### Vercel Deployment
- **URL:** https://thekilnchromeext.vercel.app
- **Purpose:** Email verification callback page

---

## 📚 Related Documentation

- `SUPABASE_AUTH_SETUP.sql` - Initial database setup
- `DIAGNOSTIC_QUERIES.sql` - Debugging queries for Supabase
- `FIX_RLS_FOR_CLAY.sql` - RLS configuration that allows service_role

---

**Last verified working:** January 18, 2026, 7:00 PM EST
**Verified by:** Complete end-to-end test (sign in → send URL → receive enriched data)
