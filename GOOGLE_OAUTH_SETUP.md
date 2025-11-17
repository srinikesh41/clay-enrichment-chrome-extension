# Google OAuth Setup Guide

## Enable Google Sign-In in Supabase

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: Clay Enrichment
   - Support email: your@email.com
   - Developer contact: your@email.com
6. Application type: **Web application**
7. Name: Clay Enrichment Extension
8. Add Authorized redirect URIs:
   - Get from Supabase: Dashboard → Authentication → Providers → Google
   - Copy the "Callback URL (for OAuth)"
   - Should look like: `https://zknyztmngccsxdtiddvz.supabase.co/auth/v1/callback`
9. Click **Create**
10. Copy **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** provider
5. Toggle **Enable** ON
6. Paste your **Client ID**
7. Paste your **Client Secret**
8. Click **Save**

### Step 3: Test Google Sign-In

1. Reload your Chrome extension
2. Open the extension
3. Click **"Continue with Google"**
4. Should redirect to Google sign-in
5. Select your Google account
6. Grant permissions
7. Should redirect back to extension and be signed in ✅

---

## How It Works

1. User clicks "Continue with Google"
2. Extension calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Opens Google OAuth flow in new tab
4. User signs in with Google
5. Google redirects back to Supabase callback URL
6. Supabase creates/signs in user
7. Redirects to `popup.html` with session
8. Extension saves session and shows main UI

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"

**Problem:** Redirect URI not authorized in Google Console

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Click your OAuth client ID
3. Add the Supabase callback URL to "Authorized redirect URIs"
4. Format: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### "Failed to sign in with Google"

**Problem:** Google provider not enabled or misconfigured

**Solution:**
1. Check Google provider is enabled in Supabase
2. Verify Client ID and Secret are correct
3. Check browser console for detailed error

### Sign-in works but doesn't redirect

**Problem:** Redirect URL misconfigured

**Solution:**
1. Check `redirectTo` in auth.js is correct
2. Should be: `chrome.runtime.getURL('popup.html')`
3. Reload extension and try again

### User created but data has no user_id

**Problem:** RLS policies preventing insert

**Solution:**
- Google OAuth users are automatically created in `auth.users`
- RLS policies will work the same as email/password users
- No special configuration needed

---

## Security Notes

- **Client Secret** should be kept secure (only used server-side by Supabase)
- Google OAuth uses industry-standard protocols
- User data (email, name) is provided by Google
- Supabase handles all token management

---

## What Users See

1. Click "Continue with Google"
2. New tab opens with Google sign-in
3. "Clay Enrichment wants to access your Google Account"
4. User clicks "Continue"
5. Redirects back to extension
6. Signed in automatically ✅

---

## Removing Google Sign-In

If you want to disable Google OAuth later:

1. Go to Supabase → Authentication → Providers
2. Find Google provider
3. Toggle OFF
4. Users can still sign in with email/password
5. Existing Google users can still access their accounts (they're regular users in the database)

---

**That's it!** Google Sign-In is now configured. Users can choose between:
- Email/Password
- Google OAuth

Both methods work with the same RLS policies and user data.
