# Supabase Setup Guide

Complete guide for setting up Supabase tables for the Clay Enrichment Tool.

## 📋 Overview

The extension uses **3 separate Supabase tables** - one for each workflow:

| Workflow | Table Name | Status |
|----------|------------|--------|
| Get Contact Info | `enriched_data` | ✅ Already exists |
| Do Account Research | `account_research_data` | ⚠️ Need to create |
| Do Lead Research | `lead_research_data` | ⚠️ Need to create |

---

## 🏗️ Table Structure

Each table should have the **same base structure**:

### Required Columns (All Tables)

| Column | Type | Settings |
|--------|------|----------|
| `id` | int8 | Primary key, Auto-increment |
| `created_at` | timestamptz | Default: `now()` |
| `request_id` | text | Unique, Not null |
| `url` | text | Nullable |
| `workflow` | text | Nullable |

### Workflow-Specific Columns

Add additional columns based on what Clay returns for each workflow.

**Example for Contact Info:**
- `name` (text)
- `email` (text)
- `phone` (text)
- `company` (text)
- `title` (text)

**Example for Account Research:**
- `company_name` (text)
- `industry` (text)
- `employee_count` (text)
- `revenue` (text)
- `location` (text)

**Example for Lead Research:**
- `lead_name` (text)
- `lead_email` (text)
- `lead_company` (text)
- `lead_title` (text)
- `linkedin_url` (text)

---

## 🚀 Step-by-Step: Create Tables

### Step 1: Access Table Editor

1. Go to https://supabase.com
2. Open your project: `zknyztmngccsxdtiddvz`
3. Click **"Table Editor"** in left sidebar

---

### Step 2: Create `account_research_data` Table

1. Click **"New Table"**
2. **Table name:** `account_research_data`
3. **Description:** "Stores account research enrichment data"
4. **Enable Row Level Security (RLS):** ❌ Uncheck (for development)

#### Add Base Columns:

**Column 1: id**
- Name: `id`
- Type: `int8`
- Primary: ✅ Check
- Auto-increment: ✅ Check
- Nullable: ❌ Uncheck

**Column 2: created_at**
- Name: `created_at`
- Type: `timestamptz`
- Default value: `now()`
- Nullable: ❌ Uncheck

**Column 3: request_id**
- Name: `request_id`
- Type: `text`
- Unique: ✅ Check
- Nullable: ❌ Uncheck

**Column 4: url**
- Name: `url`
- Type: `text`
- Nullable: ✅ Check

**Column 5: workflow**
- Name: `workflow`
- Type: `text`
- Nullable: ✅ Check

#### Add Workflow-Specific Columns:

Add any additional fields Clay returns for account research.

**Example:**
- `company_name` (text, nullable)
- `industry` (text, nullable)
- `employee_count` (text, nullable)
- `revenue` (text, nullable)
- `location` (text, nullable)
- `website` (text, nullable)
- `description` (text, nullable)

5. Click **"Save"**

---

### Step 3: Create `lead_research_data` Table

Repeat the same process as Step 2:

1. Click **"New Table"**
2. **Table name:** `lead_research_data`
3. **Description:** "Stores lead research enrichment data"
4. **Enable RLS:** ❌ Uncheck
5. Add the same **base columns** (id, created_at, request_id, url, workflow)
6. Add **lead-specific columns** based on Clay output

**Example lead columns:**
- `lead_name` (text, nullable)
- `lead_email` (text, nullable)
- `lead_company` (text, nullable)
- `lead_title` (text, nullable)
- `linkedin_url` (text, nullable)
- `phone` (text, nullable)

7. Click **"Save"**

---

### Step 4: Enable Realtime

**For BOTH new tables:**

1. Go to **Database** → **Replication** (left sidebar)
2. Find `account_research_data` in the list
3. Toggle **Realtime** to ON ✅
4. Repeat for `lead_research_data`

This allows the extension to receive instant updates when Clay adds data.

---

## ✅ Verification

### Check Tables Exist

1. Go to **Table Editor**
2. You should see:
   - ✅ `enriched_data` (already exists)
   - ✅ `account_research_data` (newly created)
   - ✅ `lead_research_data` (newly created)

### Check Realtime is Enabled

1. Go to **Database** → **Replication**
2. All 3 tables should have Realtime **ON** ✅

### Test Insert (Optional)

Run this in the SQL Editor to test:

```sql
-- Test account_research_data
INSERT INTO account_research_data (request_id, url, workflow, company_name)
VALUES ('test-123', 'https://example.com', 'do_account_research', 'Test Company');

-- Test lead_research_data
INSERT INTO lead_research_data (request_id, url, workflow, lead_name)
VALUES ('test-456', 'https://example.com', 'do_lead_research', 'John Doe');

-- Check inserts worked
SELECT * FROM account_research_data WHERE request_id = 'test-123';
SELECT * FROM lead_research_data WHERE request_id = 'test-456';

-- Clean up test data
DELETE FROM account_research_data WHERE request_id = 'test-123';
DELETE FROM lead_research_data WHERE request_id = 'test-456';
```

---

## 🔧 Configuring Clay

Once tables are created, configure Clay to send enriched data to Supabase:

### Get Your Supabase Details

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL:** `https://zknyztmngccsxdtiddvz.supabase.co`
   - **anon/public key:** `eyJhbGciOiJI...` (already in extension)

### Clay Webhook Configuration

**For Account Research workflow:**
Clay should POST to Supabase after enrichment with this payload:

```json
{
  "request_id": "{{requestId from extension}}",
  "url": "{{original URL}}",
  "workflow": "do_account_research",
  "company_name": "{{enriched_company_name}}",
  "industry": "{{enriched_industry}}",
  "employee_count": "{{enriched_employee_count}}",
  "revenue": "{{enriched_revenue}}",
  "location": "{{enriched_location}}"
}
```

**For Lead Research workflow:**
Clay should POST with:

```json
{
  "request_id": "{{requestId from extension}}",
  "url": "{{original URL}}",
  "workflow": "do_lead_research",
  "lead_name": "{{enriched_name}}",
  "lead_email": "{{enriched_email}}",
  "lead_company": "{{enriched_company}}",
  "lead_title": "{{enriched_title}}",
  "linkedin_url": "{{enriched_linkedin}}"
}
```

### Supabase Insert Endpoint

Clay should POST to:
```
https://zknyztmngccsxdtiddvz.supabase.co/rest/v1/[TABLE_NAME]
```

**Headers:**
```
apikey: [your-anon-key]
Authorization: Bearer [your-anon-key]
Content-Type: application/json
Prefer: return=representation
```

Replace `[TABLE_NAME]` with:
- `account_research_data` for account research
- `lead_research_data` for lead research

---

## 🐛 Troubleshooting

### Table doesn't appear in extension history

**Check:**
1. Table name matches exactly in `popup.js` SUPABASE_TABLES
2. Realtime is enabled for the table
3. Reload the extension after creating table

### Clay can't insert data

**Check:**
1. RLS (Row Level Security) is disabled on the table
2. API key is correct
3. Column names match Clay's payload
4. `request_id` is unique (not already in table)

### Realtime updates not working

**Check:**
1. Database → Replication → Table has Realtime ON
2. Extension is subscribing to correct table
3. No errors in browser console (right-click extension → Inspect)

### Extension shows errors when selecting workflow

This is normal if the table doesn't exist yet. Create the table and errors will disappear.

---

## 📝 Column Customization

### Adding New Columns

If Clay starts returning additional fields:

1. Go to Table Editor
2. Click on the table name
3. Click **"New Column"**
4. Add column name and type
5. Set to nullable
6. Save

**No extension code changes needed** - new fields will automatically appear in results.

### Removing Columns

1. Click on column header
2. Click **"Delete column"**
3. Confirm

---

## 🔐 Security (Production)

For production deployment:

1. **Enable RLS** on all tables
2. **Add policies:**
   ```sql
   -- Allow extension to read
   CREATE POLICY "Allow public read access"
   ON account_research_data
   FOR SELECT
   USING (true);

   -- Allow Clay to insert
   CREATE POLICY "Allow service role insert"
   ON account_research_data
   FOR INSERT
   WITH CHECK (true);
   ```

3. **Use service role key** for Clay inserts (not anon key)

---

## ✅ Checklist

- [ ] `account_research_data` table created
- [ ] `lead_research_data` table created
- [ ] Base columns added to both tables (id, created_at, request_id, url, workflow)
- [ ] Workflow-specific columns added
- [ ] Realtime enabled on both tables
- [ ] Clay configured to POST to Supabase
- [ ] Tested end-to-end flow for each workflow
- [ ] Extension shows history for each workflow

---

**Done! Your Supabase is ready for all 3 workflows!** 🎉
