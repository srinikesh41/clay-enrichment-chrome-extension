# Tasks

**Last Updated:** November 18, 2025

---

## Current Sprint: Clay Integration + Database Setup

### In Progress
- [ ] Configure Clay integration with service_role key

### High Priority
- [ ] Create `account_research_data` table in Supabase
- [ ] Create `lead_research_data` table in Supabase
- [ ] Enable Realtime for new tables
- [ ] Test full data flow: Extension → Clay → Supabase → Extension

### Medium Priority
- [ ] Test session persistence (close/reopen extension)
- [ ] Test data isolation between users
- [ ] Test all 3 workflows end-to-end

### Low Priority
- [ ] Invalid credentials error handling test
- [ ] Edge case testing (network errors, timeouts)
- [ ] Performance review

---

## Completed

### Authentication (November 18, 2025)
- [x] Email/password sign up with confirmation
- [x] Email/password sign in
- [x] Google OAuth sign in
- [x] Password reset flow
- [x] Session persistence implementation
- [x] Auth guard (redirect if not logged in)
- [x] User profile dropdown (name/email/sign out)
- [x] Vercel email verification page deployed
- [x] Security headers configured

### Database Setup (Partial)
- [x] `enriched_data` table with RLS
- [x] user_id column and policies on `enriched_data`
- [x] Realtime enabled for `enriched_data`
- [x] SQL scripts prepared for remaining tables

### UI/UX
- [x] Custom dropdown for workflow selection
- [x] Brown theme styling
- [x] History display per workflow
- [x] Loading states and error messages

---

## Blocked

| Task | Blocker | Resolution |
|------|---------|------------|
| Clay writes to Supabase | RLS blocks anon key | Use service_role key |
| Account/Lead workflows | Tables don't exist | Run SQL in Supabase |

---

## Task Details

### Clay Integration Setup

**What needs to happen:**

1. **Get service_role key**
   - Supabase Dashboard → Settings → API → service_role (secret)

2. **Update Clay workflows** (all 3):
   - Change API key from anon to service_role
   - Ensure `user_id` from webhook is written to table
   - Ensure `request_id` from webhook is written to table

3. **Webhook payload sent by extension:**
   ```json
   {
     "url": "https://linkedin.com/in/...",
     "workflow": "get_contact_info",
     "requestId": "uuid-v4",
     "timestamp": "ISO-8601",
     "user_id": "supabase-user-uuid",
     "user_email": "user@email.com"
   }
   ```

4. **Clay must write back:**
   ```json
   {
     "user_id": "{{user_id from webhook}}",
     "request_id": "{{requestId from webhook}}",
     "url": "{{url}}",
     "workflow": "{{workflow}}",
     // ... enriched fields
   }
   ```

### Database Tables to Create

Run `SUPABASE_AUTH_SETUP.sql` lines 57-147 in Supabase SQL Editor.

**Tables:**
- `account_research_data` (lines 57-99)
- `lead_research_data` (lines 104-147)

**After creating tables:**
- Enable Realtime in Supabase Dashboard → Database → Replication

---

## Future Enhancements

- Export data to CSV/JSON
- Search/filter history
- Bulk URL processing
- Workflow preferences/defaults
- Error logging/monitoring
- Pagination for large history

---

## Notes

- Password reset flow tested and working (Nov 18)
- Extension sends user_id in all Clay requests (`popup.js:393`)
- RLS policies require service_role key for Clay to bypass
