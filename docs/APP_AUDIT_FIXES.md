# App audit – errors found and fixed

Quick pass over the app for routing, Supabase usage, and role consistency. TypeScript and linter were clean; these are runtime/logic fixes.

---

## Fixes applied

### 1. **Wrong admin login route (AdminSetup.tsx)**
- **Issue:** `navigate('/admin-login')` – route does not exist (404).
- **Fix:** Use `navigate('/admin/login')` to match `App.tsx` route.

### 2. **Wrong day route (IntegrationToolkit.tsx)**
- **Issue:** `navigate(\`/day${completedDays + 1}\`)` produced `/day1`, `/day2`, … but routes are `/day-1`, `/day-2`, …
- **Fix:** Use `navigate(\`/day-${completedDays + 1}\`)`.

### 3. **Admin role missing in AppLayout (AppLayout.tsx)**
- **Issue:** `adminRoles` was `['super_admin', 'content_manager', 'moderator', 'support_staff']` and did not include `'admin'`. Users with role `admin` (and no other flag) were not treated as admin in the layout (e.g. admin nav/link).
- **Fix:** Added `'admin'` so it matches `AdminDashboard` and `usePermissions`.

### 4. **Supabase `.single()` where 0 rows is valid**
- **Issue:** `.single()` returns an error when there are 0 rows. Using it for “at most one row” cases (e.g. first-time user, no progress yet) leaves an error in the response and can cause confusion or unnecessary error handling.
- **Fix:** Switched to `.maybeSingle()` where “no row” is valid:
  - **StudentWelcome.tsx:** `video_progress` (user may have no progress yet).
  - **CertificateGenerator.tsx:** `completion_status`, `certificates`, and `profiles` (user may not have completion/certificate yet).
  - **StudentPortal.tsx:** `fetchProfile` (preview user or new user may have no profile row yet); also set `setProfile(null)` when no data.
  - **usePermissions.ts:** profile fetch (new user may have no profile yet).
  - **VideoPlayer.tsx:** `video_progress` (first time watching, no row yet).
  - **AppLayout.tsx:** profile fetch for admin check (new user may have no profile yet).

### 5. **AdminDashboard profile fetch (AdminDashboard.tsx)**
- **Issue:** Profile was fetched with `.single()`. Errors (including “no profile” or DB errors) were not distinguished; everyone without a profile was sent to login.
- **Fix:** Use `.maybeSingle()`, destructure `error` as `profileError`, and on `profileError` show a toast with the message and then navigate to `/admin/login`. “No profile” now yields `data: null` (no error), and real DB errors are surfaced to the user.

---

## Not changed (verified OK)

- **Routes in App.tsx** match the pages and nav (e.g. `/admin/login`, `/day-1` … `/day-7`, `/student-portal`).
- **List keys:** DaySectionsView, DayPage, DayContent, ResourceLibrary, etc. use stable keys (`section.id`, `material.id`, etc.).
- **Supabase env:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used in `src/lib/supabase.ts` with a clear error if missing.
- **Other `.single()` usages:** Left as-is where exactly one row is expected (e.g. after insert, or when the flow guarantees a row). Only “at most one row” / optional fetches were switched to `.maybeSingle()`.

---

## Recommendation

- Run the app and test: Admin Setup → redirect to `/admin/login` when not logged in; Integration Toolkit “Continue to Day N” → `/day-N`; admin user with role `admin` sees admin layout/links; new users or users with no progress/certificate/profile don’t trigger spurious errors.
