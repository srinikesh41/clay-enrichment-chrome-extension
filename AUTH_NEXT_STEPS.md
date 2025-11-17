# Authentication - Next Steps

## ✅ What's Been Built

### Files Created:
1. **auth.html** - Login/signup interface
2. **auth.css** - Auth styling (matches your brown theme)
3. **auth.js** - Authentication logic (sign in/up/reset)
4. **SUPABASE_AUTH_SETUP.sql** - Database setup script
5. **AUTH_IMPLEMENTATION_GUIDE.md** - Complete setup guide

### Files Updated:
1. **manifest.json** - Added storage permission
2. **popup.js** - Added auth check and sign out button

---

## 🚀 Your Action Items

### Step 1: Run SQL Setup (15 minutes)

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to **SQL Editor**
3. Open `SUPABASE_AUTH_SETUP.sql`
4. Copy all content and run in SQL Editor
5. Verify success (no errors)

This will:
- ✅ Add `user_id` column to `enriched_data`
- ✅ Enable Row Level Security (RLS)
- ✅ Create RLS policies
- ✅ Create `account_research_data` table (with user_id)
- ✅ Create `lead_research_data` table (with user_id)

### Step 2: Enable Email Auth (5 minutes)

1. In Supabase Dashboard
2. Go to **Authentication** → **Providers**
3. Enable **Email** provider
4. Save

### Step 3: Enable Realtime (5 minutes)

1. Go to **Database** → **Replication**
2. Enable Realtime for:
   - ✅ enriched_data
   - ✅ account_research_data
   - ✅ lead_research_data

### Step 4: Test the Extension (10 minutes)

1. Reload extension in Chrome
2. Open extension - should see login screen
3. Click "Create account"
4. Sign up with test email
5. Check email for confirmation link
6. Sign in after confirming
7. Should see main popup with "Sign Out" button

---

## ⚠️ Important: Clay Integration Issue

**The current setup has one issue that needs to be addressed:**

### The Problem:
Currently, Clay sends enriched data directly to Supabase. But now we need `user_id` to be included. Clay doesn't know which user made the request.

### Solutions (Choose One):

#### **Option A: Send user_id to Clay** (Recommended)

**Update popup.js line ~180:**
```javascript
const payload = {
  url: currentUrl,
  workflow: currentWorkflow,
  requestId: requestId,
  user_id: currentUser.id,  // ADD THIS LINE
  timestamp: new Date().toISOString()
};
```

**Then in Clay:**
1. Configure Clay to receive `user_id` from webhook payload
2. Include `user_id` when POSTing to Supabase
3. Clay needs to use Supabase Service Role key (not anon key)
   - Service Role key bypasses RLS
   - Allows Clay to insert with any user_id

**Pros:** Simple, minimal changes
**Cons:** Clay needs service_role key (more powerful, handle carefully)

---

#### **Option B: Extension handles Supabase writes**

**Change the flow:**
1. Extension → Clay (enrich data)
2. Clay → Returns data to extension (via webhook or response)
3. Extension → Supabase (write enriched data with user_id)

**Implementation:**
- Clay returns enriched data instead of writing to Supabase
- Extension receives the data
- Extension writes to Supabase (automatically includes user via auth token)
- RLS works perfectly (no need for service_role key)

**Pros:** More secure, proper RLS, user context automatic
**Cons:** Requires changing Clay workflow, more complex

---

### Recommended Approach: **Option A**

1. Update `popup.js` to send `user_id`
2. Update Clay to receive and use `user_id`
3. Give Clay the Supabase Service Role key
4. Test with multiple users

**Get Service Role Key:**
1. Supabase Dashboard → Settings → API
2. Copy "service_role" key (keep secret!)
3. Use in Clay instead of anon key

---

## 🧪 Testing Checklist

After completing setup:

### Auth Flow
- [ ] Can sign up with new email
- [ ] Receive confirmation email
- [ ] Can confirm email
- [ ] Can sign in
- [ ] See "Sign Out" button in popup
- [ ] Can sign out
- [ ] Redirected to login after sign out

### Data Isolation
- [ ] Sign up as User A
- [ ] Send Contact Info request
- [ ] See result in history
- [ ] Sign out
- [ ] Sign up as User B
- [ ] Send Contact Info request
- [ ] Should NOT see User A's data
- [ ] Check Supabase: both records have different user_id

### Session Persistence
- [ ] Sign in
- [ ] Close extension
- [ ] Reopen extension
- [ ] Still signed in (no need to sign in again)

---

## 🔧 Troubleshooting

### "Row Level Security policy violation"

**Problem:** Can't insert/read data

**Solution:**
1. Check RLS policies are created (run SQL setup again)
2. Make sure you're signed in
3. Verify `user_id` is being set on inserts
4. Check Supabase logs for details

### "User already exists"

**Problem:** Can't sign up

**Solution:**
1. Use a different email
2. Or sign in with existing account
3. Or delete user in Supabase Dashboard → Authentication

### Session expires immediately

**Problem:** Get logged out constantly

**Solution:**
1. Check Chrome storage permissions
2. Verify Supabase URL and key are correct
3. Check browser console for errors

### Can see other users' data

**Problem:** RLS not working

**Solution:**
1. Verify RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'enriched_data'` - should show `rowsecurity = true`
2. Check policies exist
3. Verify `user_id` column exists
4. Test policies manually in SQL Editor

---

## 📝 Current Status

### ✅ Complete:
- Auth UI built
- Auth logic implemented
- SQL setup script created
- Manifest updated
- Popup checks auth

### ⏳ Needs Action (YOU):
1. Run SQL setup in Supabase
2. Enable email auth
3. Enable Realtime
4. Decide on Clay integration approach (Option A or B)
5. Update Clay workflow
6. Test everything

### ⚠️ Known Limitations:
- Clay integration needs user_id (choose Option A or B above)
- Existing data in `enriched_data` has no user_id (will need to delete or assign)

---

## 🎯 Once Auth is Working

You can then:
1. Create the other 2 tables (done in SQL script)
2. Test all 3 workflows with auth
3. Verify each user has private data
4. Add more features:
   - User profile
   - Team sharing
   - Usage analytics
   - Billing/limits

---

## 🆘 Need Help?

Check these files:
- `AUTH_IMPLEMENTATION_GUIDE.md` - Detailed guide
- `SUPABASE_AUTH_SETUP.sql` - Database setup
- `auth.js` - Auth logic (see how sign in/up works)
- `popup.js` - See `checkAuthStatus()` function

Supabase Docs:
- Auth: https://supabase.com/docs/guides/auth
- RLS: https://supabase.com/docs/guides/auth/row-level-security

---

**Ready to go!** 🚀

Start with Step 1: Run the SQL setup script in Supabase.
