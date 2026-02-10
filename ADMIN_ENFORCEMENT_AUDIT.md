# Admin Controls: Data/Server-Level Enforcement Audit

**Scope:** aura-growth-energy-2  
**Goal:** Confirm which admin controls are enforced at data/server level vs UI-only, and flag where students could bypass restrictions.

---

## 1) What Is Enforced at Data/Server Level

### 1.1 Row Level Security (RLS) in migrations

Only the following are defined in `supabase/migrations/`:

| Table | RLS enabled in repo? | Policies in repo |
|------|----------------------|------------------|
| **profiles** | **No** – no `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY` in migrations | SELECT: own profile; SELECT: all profiles if admin (`is_admin_user`). UPDATE: own row only (`id = auth.uid()`). No DELETE policy. |
| **setup_tokens** | Yes | SELECT: unused tokens (authenticated). UPDATE: mark used (authenticated). |
| **forum_posts** | Yes | SELECT all; INSERT/UPDATE/DELETE own (`auth.uid() = user_id`). |
| **forum_comments** | Yes | Same pattern as forum_posts. |
| **forum_reactions** | Yes | Same pattern. |

**Important:** For `profiles`, migrations only *create* policies. They do **not** run `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`. So either RLS was enabled elsewhere (e.g. dashboard) or **profiles is not under RLS** and access is governed only by Postgres GRANTs (e.g. `GRANT SELECT ON profiles TO authenticated`, `GRANT UPDATE (is_admin, role) ON profiles TO authenticated`). If RLS is off, any authenticated user can update their own row including `is_admin`/`role` if the app sends it.

### 1.2 Edge Functions (server-side)

| Function | Auth / server check | Enforced? |
|----------|---------------------|-----------|
| **subscribe-newsletter** | No auth; uses service role only | N/A – public signup by design; no admin restriction. |
| **submit-review** | Accepts Bearer token but uses **service role** for DB insert. Does **not** verify `userId` in body matches JWT `sub`. | **No** – request body can set any `userId`; review can be attributed to another user. |
| **generate-certificate** | Not in repo; cannot confirm. | Unknown. |
| **moderate-review** | Not in repo. | Unknown. |

---

## 2) What Is UI-Only (No Server/RLS Enforcement in Repo)

All of the following are **only** gated in the app (e.g. `checkAdminAccess()`, `hasPermission()`, redirects). There are **no** RLS policies or backend checks in the repo for these tables, so if RLS is not enabled on them in the project, **anyone with the anon key (or authenticated)** could call the same Supabase client methods.

| Admin control | Table(s) / API | Where UI check lives | Server/RLS in repo? |
|---------------|----------------|----------------------|----------------------|
| Edit daily lessons | `course_content` (SELECT, INSERT, UPDATE) | AdminDailyLessons only in `/admin/lessons` | **No** – no RLS for course_content. |
| Create/edit live sessions | `live_sessions` (SELECT, INSERT, UPDATE, DELETE) | LiveSessionManager in AdminDashboard | **No** – no RLS for live_sessions. |
| Upload resources | `class_materials` (via ResourceUploader) | Admin Resources tab | **No** – no RLS for class_materials. |
| Create/edit announcements | `announcements` | AnnouncementManager | **No** – no RLS for announcements. |
| Mark student complete / reset progress | `user_progress` (UPDATE) | StudentManagement | **No** – no RLS for user_progress. |
| Delete student | `profiles` (DELETE) | StudentManagement | **No** – no DELETE policy on profiles; RLS may not be enabled. |
| Moderate reviews | Invokes `moderate-review`; updates `reviews` | ReviewModeration | **No** – function not in repo; no RLS for reviews. |
| Assign roles | `profiles` (UPDATE role), `roles` | UserRoleAssignment, RoleManager | **No** – only profiles SELECT/UPDATE policies; no role-based restriction on who can UPDATE. |
| View analytics / all students | `profiles`, `user_progress`, `certificates`, etc. | AdminDashboard tabs | **No** – admins can view all only because of profiles “Admins can view all profiles”; other tables have no RLS. |

So: **admin “control” over content and over other users’ data is enforced only in the UI.** A student (or any authenticated user) can bypass by using the same Supabase client (e.g. from browser console or a modified client) to call the same `.from(...).insert/update/delete()`.

---

## 3) Bypass Risks (Student Could Bypass Admin Restrictions)

### 3.1 Critical: Self-promotion to admin

- **Risk:** A student (or any authenticated user) updates their own `profiles` row and sets `is_admin = true` or `role = 'super_admin'`.
- **Why:**  
  - `ensure_profiles_admin_columns.sql` does **not** enable RLS on `profiles`; it only creates policies.  
  - It runs `GRANT UPDATE (is_admin, role) ON profiles TO authenticated`.  
  - Policy “Users can update own profile to admin with token” has `USING (id = auth.uid())` and `WITH CHECK (id = auth.uid())` – it does **not** check that a setup token was used; that check exists only in the app (AdminSetup).
- **Bypass:** From browser:  
  `supabase.from('profiles').update({ is_admin: true }).eq('id', currentUser.id)`  
  If RLS is not enabled on `profiles`, this succeeds. If RLS is enabled, the policy still allows updating own row without verifying the token.

**Recommendation:** Enforce “admin only with valid token” at DB level: e.g. trigger or RLS that allows UPDATE of `is_admin`/`role` only when a valid unused `setup_tokens` row exists for a token passed in (e.g. via app_metadata or a separate table), or remove UPDATE on `is_admin`/`role` from the anon/authenticated role and do admin promotion only via Edge Function or service role.

---

### 3.2 Critical: Content and progress tables (no RLS in repo)

If these tables have **no RLS** in the deployed project (only the repo was audited), then any client with the anon/authenticated key can:

| Action | Table | Bypass |
|--------|--------|--------|
| Change or delete lessons | `course_content` | `supabase.from('course_content').update({...}).eq('id', id)` or `.delete()`. |
| Mark any user complete | `user_progress` | `supabase.from('user_progress').update({ days_completed: [1,2,3,4,5,6,7], current_day: 7 }).eq('user_id', anyUserId)`. |
| Reset any user’s progress | `user_progress` | Same as above with empty days_completed, current_day 1. |
| Create/update/delete live sessions | `live_sessions` | Same pattern. |
| Add/delete class materials | `class_materials` | Same pattern. |
| Create/update/delete announcements | `announcements` | Same pattern. |
| Approve own review | `reviews` | `supabase.from('reviews').update({ status: 'approved' }).eq('id', ownReviewId)`. |
| Delete another user’s profile | `profiles` | If no RLS or no DELETE policy, `supabase.from('profiles').delete().eq('id', userId)`. |

So **students can bypass admin restrictions** on all of the above if the database relies only on the app’s admin checks and does not enforce RLS (or equivalent) on these tables.

---

### 3.3 High: Submit review as another user

- **Risk:** A user submits a review that is stored with another user’s `user_id`.
- **Why:** `submit-review` Edge Function uses the **service role** for the insert and takes `userId` from the request body. It does **not** verify that the Bearer token’s subject equals `userId`.
- **Bypass:** Call the Edge Function with `body: { userId: "<victim-id>", classId: "...", reviewData: { ... } }` and any valid Bearer token; the review is inserted with `user_id = victim-id`.

**Recommendation:** In `submit-review`, resolve the user from the JWT (e.g. `supabase.auth.getUser(token)`) and set `user_id` from that identity only; ignore or reject `userId` from the body for the insert.

---

### 3.4 Medium: Setup token abuse

- **Risk:** Any authenticated user can read unused `setup_tokens` (policy: “Authenticated users can read unused tokens” where `used = FALSE`) and can mark tokens as used (policy: “Authenticated users can mark tokens as used”).
- **Bypass:**  
  - Enumerate or guess token values and consume them so legitimate admin setup fails.  
  - Read tokens if they are predictable or leaked (token value itself is not in the SELECT in the app; only “token exists and unused” is used).
- **Mitigation:** Token value is checked in the app; the DB does not enforce “only the person who knows the token can use it.” Consider restricting “mark as used” to the service role or to a function that verifies the token string server-side.

---

### 3.5 Forum: No admin-only moderation in RLS

- Forum tables have RLS: users can only update/delete their own posts/comments. There is **no** policy allowing admins to update/delete others’ posts (e.g. pin, hide, delete). So either admin moderation is not implemented at DB level or it is done with a different role (e.g. service role). Not a “student bypass” of admin, but admin cannot enforce moderation via RLS as currently defined.

---

## 4) Summary Table

| Control | UI-only? | Enforced at data/server? | Student bypass possible? |
|---------|----------|---------------------------|---------------------------|
| Who can open /admin | Yes (redirect if not admin) | No route guard; no RLS on “admin only” data | Yes – can call Supabase directly for tables with no RLS. |
| Admin setup (token → is_admin) | Token checked in app | RLS allows UPDATE own profile; no “with token” check in DB | Yes – can set own is_admin/role. |
| Edit course_content | Yes | No RLS in repo | Yes – if no RLS, any client can change/delete. |
| Edit user_progress (any user) | Yes | No RLS in repo | Yes – if no RLS, any client can update any user’s progress. |
| Edit live_sessions, class_materials, announcements | Yes | No RLS in repo | Yes – same as above. |
| Delete profile (StudentManagement) | Yes | No DELETE policy / RLS unclear on profiles | Yes – if DELETE is allowed for authenticated. |
| Submit review | N/A | Edge Function does not bind body userId to JWT | Yes – can attribute review to another user. |
| Forum create/edit/delete own | Yes (who can post) | Yes – RLS on forum_* | No – RLS enforces own row only. |
| View all profiles (admin) | Yes | Yes – “Admins can view all profiles” (SELECT) | Only if RLS is enabled on profiles; otherwise depends on GRANTs. |

---

## 5) Recommended Next Steps (design only)

1. **Enable RLS on all tables** that hold admin-controlled or user-specific data (e.g. `profiles`, `course_content`, `user_progress`, `live_sessions`, `class_materials`, `announcements`, `reviews`, `certificates`, `completion_status`, `video_progress`, etc.) and add policies so that:
   - Students (and anon) can only read/write what they’re allowed (e.g. own profile, own progress, own reviews in “pending”).
   - Admin-only writes (e.g. course_content, user_progress for others, reviews.status) are restricted to a role or to the service role (e.g. via `is_admin_user(auth.uid())` or Edge Functions using service role).
2. **Restrict `profiles` updates** so that `is_admin` and `role` can only be set when a valid setup token is consumed (e.g. trigger + helper table or Edge Function with service role), not by arbitrary authenticated UPDATE.
3. **In submit-review**, set `user_id` from the authenticated user (JWT) only; do not trust `userId` from the request body.
4. **Optionally** protect admin-only routes with a middleware or route guard that checks auth and profile/role and returns 403 before rendering, and ensure all admin-only mutations go through Edge Functions or RLS that verify admin status server-side.

---

*Audit based only on the repository (migrations and app code). Actual enforcement depends on whether RLS is enabled on each table in the deployed Supabase project and on Postgres GRANTs not shown in the repo.*
