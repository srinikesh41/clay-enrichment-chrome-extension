# Authentication Implementation Guide

This guide will walk you through implementing Supabase Auth in your Chrome Extension.

---

## Phase 1: Supabase Setup (15-20 minutes)

### Step 1: Enable Email Authentication

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Providers**
4. Enable **Email** provider
5. Configure email templates (optional):
   - Confirmation email
   - Password reset email
   - Magic link email

### Step 2: Run SQL Setup Script

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `SUPABASE_AUTH_SETUP.sql`
4. Paste and click **Run**
5. Verify no errors (should see "Success" messages)

### Step 3: Enable Realtime

1. Go to **Database** → **Replication**
2. Enable Realtime for these tables:
   - ✅ `enriched_data`
   - ✅ `account_research_data`
   - ✅ `lead_research_data`

### Step 4: Verify RLS is Working

Run this test query in SQL Editor:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

You should see `rowsecurity = true` for all three tables.

### Step 5: Optional - Enable Google OAuth

1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials
4. Configure redirect URLs

---

## Phase 2: Extension UI Updates (Completed by AI)

The following files will be created/updated:

### New Files:
- `auth.html` - Login/Signup screen
- `auth.css` - Auth screen styling
- `auth.js` - Auth logic

### Updated Files:
- `popup.html` - Add auth check
- `popup.js` - Integrate auth state
- `manifest.json` - Add Chrome storage permission

---

## Phase 3: Testing Checklist

### Basic Auth Flow
- [ ] Extension opens to login screen when not authenticated
- [ ] Can sign up with email/password
- [ ] Receive confirmation email
- [ ] Can sign in with email/password
- [ ] Session persists after closing extension
- [ ] Can sign out

### Data Isolation
- [ ] Create test user 1, send Contact Info request
- [ ] Create test user 2, send Contact Info request
- [ ] Verify user 1 can only see their own data
- [ ] Verify user 2 can only see their own data
- [ ] Check Supabase dashboard - data has correct user_id

### All Workflows
- [ ] Contact Info workflow works with auth
- [ ] Account Research workflow works with auth
- [ ] Lead Research workflow works with auth
- [ ] History loads correctly per user
- [ ] Clear history only clears current user's data

### Edge Cases
- [ ] Session expires - redirects to login
- [ ] Invalid credentials - shows error
- [ ] Network error during signup - handles gracefully
- [ ] Refresh token works automatically
- [ ] Multiple tabs - auth state syncs

---

## Phase 4: Clay Configuration

After auth is working, you'll need to update your Clay workflows to include user context:

### Option A: Include user_id in webhook payload
```javascript
// In popup.js, when sending to Clay
const payload = {
  url: currentUrl,
  workflow: currentWorkflow,
  requestId: requestId,
  user_id: currentUser.id,  // Add this
  timestamp: new Date().toISOString()
};
```

Then configure Clay to pass `user_id` back to Supabase.

### Option B: Extension writes to Supabase directly
Instead of Clay writing to Supabase, the extension could:
1. Send to Clay webhook
2. Clay responds with enriched data
3. Extension writes to Supabase (with user_id)

This gives you more control over user association.

---

## Troubleshooting

### "Row Level Security policy violation"
- Make sure you're signed in
- Check that policies are created correctly
- Verify user_id is being set on inserts

### "Session expired" errors
- Implement session refresh in the extension
- Check Chrome storage is working
- Verify Supabase URL and key are correct

### Users can see each other's data
- Check RLS policies are enabled
- Verify user_id is being included in queries
- Check policies use `auth.uid()` correctly

### Can't sign up/sign in
- Check email provider is enabled in Supabase
- Verify network requests aren't blocked
- Check console for detailed error messages

---

## Security Best Practices

1. **Never commit** Supabase anon key to public repos (it's client-safe but should be rotated)
2. **Use RLS** - Always rely on RLS, not client-side checks
3. **Validate tokens** - Supabase client does this automatically
4. **Rotate keys** - Rotate anon key periodically
5. **Monitor auth logs** - Check Supabase logs for suspicious activity

---

## Next Steps After Auth

Once auth is working:

1. **Create remaining tables** (done in Phase 1)
2. **Test all workflows** with multiple users
3. **Add user profile** (optional: avatar, name, etc.)
4. **Add team features** (optional: share data within org)
5. **Analytics** - Track usage per user
6. **Onboarding** - Add welcome flow for new users

---

## Quick Reference

### Supabase Auth Methods
```javascript
// Sign up
const { user, error } = await supabase.auth.signUp({
  email: email,
  password: password
});

// Sign in
const { user, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state changes
});
```

### Chrome Storage
```javascript
// Save session
chrome.storage.local.set({ session: session });

// Get session
chrome.storage.local.get(['session'], (result) => {
  const session = result.session;
});
```

---

## Need Help?

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Chrome Extension Storage: https://developer.chrome.com/docs/extensions/reference/storage/
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

---

**Ready?** Let's build the auth UI! 🚀
