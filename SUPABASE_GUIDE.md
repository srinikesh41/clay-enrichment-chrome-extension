# Complete Supabase Integration Guide

**Goal:** Get enriched data from Clay back to your Chrome Extension using Supabase

---

## 🎯 Architecture Overview

```
┌─────────────────┐
│ Chrome Extension│ (User clicks, sends URL)
└────────┬────────┘
         │ POST: { url, workflow, requestId }
         ↓
┌─────────────────┐
│  Clay Webhook   │ (Enriches the data)
└────────┬────────┘
         │ POST: { requestId, name, title, org, country, work_email }
         ↓
┌─────────────────────────┐
│ Supabase Edge Function  │ (receive-enriched-data)
└────────┬────────────────┘
         │ INSERT INTO enriched_data
         ↓
┌─────────────────────────┐
│ Supabase Database Table │ (enriched_data)
└────────┬────────────────┘
         │ Realtime subscription
         ↓
┌─────────────────┐
│ Chrome Extension│ (Displays results instantly!)
└─────────────────┘
```

---

## 📋 Complete Step-by-Step Guide

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up/log in (GitHub recommended)
4. Click "New Project"
5. Fill in:
   - Name: `clay-enrichment`
   - Password: (create and save it!)
   - Region: Closest to you
   - Plan: Free
6. Click "Create new project"
7. Wait 2-3 minutes

**Save these values:**
- Project URL: `https://xxxxx.supabase.co`
- anon public key: `eyJhbG...`

---

### Step 2: Create Database Table

1. In Supabase dashboard, click **"Table Editor"** (left sidebar)
2. Click **"Create a new table"**
3. Fill in:
   - **Name:** `enriched_data`
   - **Description:** "Stores enriched data from Clay"
   - **Enable Row Level Security (RLS):** UNCHECK this for now
4. Click **"Add column"** for each field:

**Column 1:**
- Name: `id`
- Type: `int8`
- Default value: (leave empty)
- Primary: ✅ CHECK
- Auto-increment: ✅ CHECK
- Nullable: UNCHECK

**Column 2:**
- Name: `request_id`
- Type: `text`
- Unique: ✅ CHECK
- Nullable: UNCHECK

**Column 3:**
- Name: `name`
- Type: `text`
- Nullable: ✅ CHECK

**Column 4:**
- Name: `title`
- Type: `text`
- Nullable: ✅ CHECK

**Column 5:**
- Name: `org`
- Type: `text`
- Nullable: ✅ CHECK

**Column 6:**
- Name: `country`
- Type: `text`
- Nullable: ✅ CHECK

**Column 7:**
- Name: `work_email`
- Type: `text`
- Nullable: ✅ CHECK

**Column 8:**
- Name: `created_at`
- Type: `timestamptz`
- Default value: `now()`
- Nullable: UNCHECK

5. Click **"Save"**

---

### Step 3: Install Supabase CLI

Open your terminal and run:

```bash
npm install -g supabase
```

Then login:

```bash
supabase login
```

This will open a browser - authorize the CLI.

---

### Step 4: Initialize Supabase in Your Project

Navigate to your extension folder:

```bash
cd "C:\Users\srinikesh.singarapu\Downloads\Chrome Extension"
```

Initialize Supabase:

```bash
supabase init
```

This creates a `supabase` folder.

---

### Step 5: Link to Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**How to get YOUR_PROJECT_REF:**
- Go to Supabase dashboard
- Click "Project Settings" → "General"
- Copy the "Reference ID" (looks like: `abcdefghijklmnop`)

Enter your database password when prompted.

---

### Step 6: Create Edge Function

```bash
supabase functions new receive-enriched-data
```

This creates: `supabase/functions/receive-enriched-data/index.ts`

---

### Step 7: Write the Edge Function Code

Open `supabase/functions/receive-enriched-data/index.ts` and replace with:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // Get the enriched data from Clay
    const { request_id, name, title, org, country, work_email } = await req.json()

    console.log('Received from Clay:', { request_id, name, title, org, country, work_email })

    // Validate required field
    if (!request_id) {
      return new Response(
        JSON.stringify({ error: 'Missing request_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Insert into database
    const { data, error } = await supabase
      .from('enriched_data')
      .insert({
        request_id,
        name: name || null,
        title: title || null,
        org: org || null,
        country: country || null,
        work_email: work_email || null
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Saved to database:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

### Step 8: Deploy the Edge Function

```bash
supabase functions deploy receive-enriched-data
```

After deployment, you'll see:
```
Edge Function URL: https://xxxxx.supabase.co/functions/v1/receive-enriched-data
```

**Save this URL! Clay will POST to it.**

---

### Step 9: Update Chrome Extension

Install Supabase client in your extension by adding this to your `popup.html` before `popup.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Update your `popup.js` - add at the top after the config:

```javascript
// Supabase configuration
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

---

### Step 10: Add Realtime Subscription

Add this function to `popup.js`:

```javascript
// Subscribe to enriched data updates
function subscribeToEnrichedData(requestId) {
  const channel = supabase
    .channel('enriched-data-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'enriched_data',
        filter: `request_id=eq.${requestId}`
      },
      (payload) => {
        console.log('Received enriched data!', payload)
        displayResults(payload.new)
        setLoadingState(false)
      }
    )
    .subscribe()

  return channel
}
```

Update `handleSendClick` function to subscribe after sending:

```javascript
// After successfully sending to Clay
showStatus('loading', 'Sent to Clay! Waiting for enriched data...')

// Subscribe to updates for this request
const channel = subscribeToEnrichedData(requestId)

// Timeout after 30 seconds
setTimeout(() => {
  channel.unsubscribe()
  setLoadingState(false)
  showStatus('error', 'Request timed out')
}, 30000)
```

---

### Step 11: Configure Clay

In Clay, configure your enrichment to POST the results to:

```
https://YOUR_PROJECT.supabase.co/functions/v1/receive-enriched-data
```

With this JSON body:
```json
{
  "request_id": "{{request_id}}",
  "name": "{{enriched_name}}",
  "title": "{{enriched_title}}",
  "org": "{{enriched_org}}",
  "country": "{{enriched_country}}",
  "work_email": "{{enriched_work_email}}"
}
```

---

### Step 12: Test End-to-End

1. Open Chrome extension
2. Go to a test URL
3. Click extension
4. Select workflow
5. Click "Send to Clay"
6. Extension should show "Waiting for enriched data..."
7. Clay enriches the data
8. Clay POSTs to Supabase Edge Function
9. Data saved to database
10. Extension receives it via Realtime
11. Extension displays the enriched data!

---

## 🐛 Troubleshooting

**Edge Function not deploying?**
- Check you're logged in: `supabase login`
- Check you're linked: `supabase link`

**Realtime not working?**
- Check Supabase dashboard → Database → Replication
- Make sure `enriched_data` table has replication enabled

**Clay webhook failing?**
- Check Edge Function logs: Supabase dashboard → Edge Functions → Logs
- Verify the URL is correct

---

**This is your complete guide. Work through each step carefully!**
