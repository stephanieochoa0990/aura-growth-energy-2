# ADMIN ↔ STUDENT MIRROR AUDIT

**Scope:** aura-growth-energy-2  
**Rules:** Read-only; no refactors; code locations cited; RLS/env called out where relevant.

---

## A) Student Portal: Full Visibility Map

### Routes a student can access (from `App.tsx`)

| Route | Entry | Auth / visibility |
|-------|--------|-------------------|
| `/` | `Index` → `AppLayout` | Public. "Sign In to Student Portal" sets `showPortal` → renders `StudentPortal`. |
| `/verify` | `Verify` | Public. Certificate verification by ID. |
| `/day-1` … `/day-7` | `Day1` … `Day7` | No route-level auth. Any user can open. |
| `/integration` | `IntegrationToolkit` | No route-level auth. |
| `/student-welcome` | `StudentWelcome` | Uses `supabase.auth.getUser()`; if no user → `navigate('/')`. If `profile?.is_admin` → `navigate('/admin')`. |
| `/student-portal` | `StudentPortal` | If no user → `<AuthForm />`. Otherwise tabbed portal. |

**Auth for StudentPortal:** `StudentPortal.tsx` uses `getAuthenticatedSession()`; if no user it renders `AuthForm`. No route guard; unauthenticated users hit portal URL and see login/signup.

---

### Student Portal tabs and components (from `StudentPortal.tsx`)

| Tab value | Component | Data displayed | Data source (table / query) | Visibility conditions |
|-----------|-----------|----------------|----------------------------|------------------------|
| **daily** | `DailyContent` | Day title, description, sections (text + video) | `course_content` by `day_number` = `profile?.current_day \|\| 1`, order `updated_at` desc, limit 1; `normalizeContent(row.content)`. | Same query for all; no publish flag. |
| **dashboard** | `ProgressDashboard` | Stats, charts, achievements, time, forum count | `user_progress`, `class_materials`, `user_achievements`, `learning_sessions`, `forum_posts` (all by `userId` or global for materials). | User-scoped or full table read. |
| **sessions** | `LiveSessionsView` | Live sessions list, register, attendance | `live_sessions` where `status` in `['scheduled','live','completed']`; `session_attendance` by user. | Filter by status only. |
| **resources** | `ResourceLibrary` | Materials list, filter by type | `class_materials` select all, order `day_number`. | No visibility/publish filter. |
| **progress** | `ProgressTracker` | Progress %, materials completed, achievements | `user_progress` (completed), `class_materials` (all). | User-scoped + full materials. |
| **community** | `CommunityHub` | Forum posts, categories, create post, thread | `forum_posts` (with profiles, comment count, reactions), `forum_comments`, `forum_reactions`. | Order by pinned, created_at. No status filter. |
| **messages** | `MessagingHub` | Conversations, messages, sessions, sharing | `conversations`, `conversation_participants`, `messages`, `notifications`, `practice_sessions`, `user_presence`. | User-scoped. |
| **offline** | Inline `Card` | "Feature coming soon" | None. | Static. |
| **certificate** | `CertificateGenerator` | Completion status, generate cert, existing cert | `completion_status`, `certificates`, `profiles` (for name). Generate via Edge Function `generate-certificate`. | Reads `completion_status.is_complete`; certificate creation is backend. |
| **notifications** | `EmailPreferences` | Email toggles | `email_preferences` by user. | User-scoped. |

**Profile data in portal:** From `StudentPortal` → `fetchProfile(userId)`: `supabase.from('profiles').select('*').eq('id', userId).single()`. Used for `profile?.full_name`, `profile?.current_day` (header progress, Daily tab day, Progress tab). **Note:** Admin updates `user_progress.current_day` in StudentManagement; if `current_day` is only on `user_progress` and not on `profiles`, the portal header may not reflect admin changes (no sync found in code).

---

### Other student-facing pages (not inside portal)

| Page | File | Data | Source | Visibility |
|------|------|------|--------|------------|
| **Landing** | `AppLayout` | Hero, benefits, testimonials, instructors, reviews, newsletter | Static copy; `instructorsData` from `@/data/instructorsData`; `ReviewsSection` → `reviews` (status = 'approved'), `profiles`; `NewsletterSignup` → Edge Function `subscribe-newsletter`. | Public. |
| **Verify** | `Verify.tsx` | Certificate by ID | `certificates` by `certificate_id`. | Public. |
| **Day 1–7** | `day-1.tsx` … `day-7.tsx` | Lesson for that day | `course_content` by `day_number`, order `updated_at` desc, limit 1; `VideoPlayer` writes to `video_progress`. | No auth on route. |
| **StudentWelcome** | `StudentWelcome.tsx` | Welcome, first name, last video progress | `profiles` (first_name, is_admin); `video_progress` last row by user. Redirect if admin. | Auth: must be logged in; admins redirected to `/admin`. |
| **IntegrationToolkit** | `IntegrationToolkit.tsx` | Practices, progress | Static `dailyPractices`; `user_progress` for completed days. | No route auth. |

---

### Data source summary (student-facing)

| Table / source | Used by (student) | Filter / note |
|----------------|-------------------|----------------|
| `course_content` | DailyContent, day-1…day-7 | By `day_number`; latest by `updated_at`. No `published` in query. |
| `profiles` | Portal header, CertificateGenerator, StudentWelcome, CommunityHub, ReviewsSection | By `id` or join. |
| `user_progress` | ProgressTracker, ProgressDashboard, StudentWelcome (via profile?), IntegrationToolkit, Analytics (admin) | By `user_id`. |
| `class_materials` | ResourceLibrary, ProgressTracker, ProgressDashboard, LearningJourney, ProgressCharts | Select all; order `day_number`. No visibility column in query. |
| `live_sessions` | LiveSessionsView | `status` in ('scheduled','live','completed'). |
| `session_attendance` | LiveSessionsView | By user. |
| `forum_posts`, `forum_comments`, `forum_reactions` | CommunityHub, CreatePost, DiscussionThread | No approval/publish filter. |
| `reviews` | ReviewsSection (landing) | `status = 'approved'`. |
| `notifications` | StudentPortal (unread count), MessagingHub | By user, `is_read = false`. |
| `completion_status`, `certificates` | CertificateGenerator | By user. |
| `email_preferences` | EmailPreferences | By user. |
| `video_progress` | VideoPlayer (day pages), StudentWelcome | By user. |
| `conversations`, `messages`, etc. | MessagingHub | User-scoped. |

---

## B) Admin Portal: Full Control Map

### Admin routes (from `App.tsx`)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/login` | AdminLogin | Login; checks `profiles.is_admin` after sign-in. |
| `/admin-setup` | AdminSetup | One-time setup via `setup_tokens`; updates profile (e.g. is_admin). |
| `/reset-password`, `/mfa-setup` | ResetPassword, MFASetup | Auth flows. |
| `/admin` | AdminDashboard | Main dashboard; permission-based tabs. |
| `/admin/lessons` | AdminDailyLessons | Edit daily lessons (course_content CRUD). |
| `/class/daily` | DailyLessons | Admin preview: links to `/day-N` (Preview) and `/admin/lessons?day=N` (Edit). |

**Admin access check:** `AdminDashboard.tsx` `checkAdminAccess()`: requires `profile.is_admin === true` or `profile.role` in `['admin','super_admin','content_manager','moderator','support_staff']`; else sign out and redirect to `/admin/login`.

---

### Admin “Student View (Preview & Edit)” buttons (AdminDashboard.tsx lines 218–230)

| Button | Navigates to | Route exists? |
|--------|----------------|---------------|
| Daily Lessons | `/class/daily` | ✅ Yes → `DailyLessons` |
| Student Dashboard | `/class/dashboard` | ❌ No → NotFound |
| Resources Library | `/class/resources` | ❌ No → NotFound |
| Progress | `/class/progress` | ❌ No → NotFound |
| Forum | `/class/forum` | ❌ No → NotFound |
| Messages | `/class/messages` | ❌ No → NotFound |
| Offline Mode | `/class/offline` | ❌ No → NotFound |
| Live Sessions | `/class/live` | ❌ No → NotFound |
| Certificate Page | `/class/certificate` | ❌ No → NotFound |
| Email Tool | `/class/email` | ❌ No → NotFound |

Only `/class/daily` is defined in `App.tsx`. All other “preview” links 404.

---

### Admin tabs and control over student-facing features

| Admin tab | Component | Permission | Can Admin control this student feature? | How (file + mechanism) |
|-----------|-----------|------------|----------------------------------------|-------------------------|
| **Comprehensive** | ComprehensiveAnalytics | can_view_analytics | N/A (read-only analytics) | — |
| **Students** | StudentManagement | can_manage_users | Partially | **YES** – Reset progress, mark complete: `user_progress` update (`current_day`, `days_completed`) in `StudentManagement.tsx` (handleResetProgress, handleMarkComplete). **Unclear** – Portal shows `profile?.current_day`; if that is `profiles.current_day`, no code in repo updates it from admin. |
| **Analytics** | Analytics | can_view_analytics | N/A | — |
| **Live Sessions** | LiveSessionManager | can_manage_sessions | Yes | **YES** – CRUD `live_sessions` (create, update status, delete). Student `LiveSessionsView` reads same table with status filter. |
| **Announcements** | AnnouncementManager | can_send_notifications | No student surface | **NO** – Admin creates/edits `announcements` (target_audience, is_active). No student component in repo reads `announcements`. Orphan admin data. |
| **Reviews** | ReviewModeration | can_moderate_reviews | Yes (if Edge Function exists) | **PARTIAL** – Calls `invokeWithAuth('moderate-review', { reviewId, action, ... })`. Student sees `reviews` with `status = 'approved'`. `moderate-review` Edge Function not present in `supabase/functions/` (only check-password, submit-review, subscribe-newsletter). If not deployed, moderation does not work. |
| **Review Stats** | ReviewAnalytics | can_view_analytics | N/A | — |
| **Roles** | RoleManager | can_manage_roles | Yes (roles/permissions) | **YES** – Manages `roles` table. `usePermissions` loads permissions by profile.role. |
| **User Roles** | UserRoleAssignment | can_manage_users | Yes | **YES** – Assigns roles to users (profiles/roles). |

---

### Content and resource control

| Student-facing content | Admin control? | File / mechanism |
|------------------------|----------------|-------------------|
| **Daily lessons (course_content)** | **YES** | `AdminDailyLessons.tsx`: load by day or id, update/insert `course_content` (title, description, content sections, video_url). Same table/query as student DailyContent and day-1…day-7. No publish flag; save = live. |
| **Resource library (class_materials)** | **NO** | `ResourceUploader.tsx` exists and writes to `class_materials`, but **ResourceUploader is never imported** anywhere. No admin UI to add/edit/order or hide class_materials. Students read all rows. |
| **Live sessions** | **YES** | LiveSessionManager: create/update/delete `live_sessions`; student filters by status. |
| **Announcements** | **YES** (data only) | AnnouncementManager: CRUD `announcements`. No student reader. |
| **Reviews visibility** | **PARTIAL** | ReviewModeration invokes `moderate-review` (not in repo). Student reads `status = 'approved'`. |
| **Forum** | **NO** | No admin component to pin/hide/delete forum posts or set visibility. CommunityHub orders by `pinned`, `created_at`; RLS allows users to manage own posts. |
| **Certificates** | **Indirect** | CertificateGenerator calls Edge Function `generate-certificate`; writes to `certificates`. No admin UI in repo to issue or revoke; completion comes from `completion_status` (writer not found in repo). |
| **Notifications** | **Indirect** | Student sees `notifications` by user. ComprehensiveAnalytics invokes `send-notification-email` (Edge Function not in repo). |

---

## C) Control Surface Audit

### Levers that exist and affect student output

| Lever | Where | Enforced in code? | Directly affects student? |
|-------|--------|--------------------|---------------------------|
| **course_content** (title, description, sections, video) | AdminDailyLessons → `course_content` update/insert | Yes (Supabase client). RLS not verified in repo. | Yes – DailyContent and day-1…day-7 read same table. |
| **live_sessions** (create, update status) | LiveSessionManager → `live_sessions` | Yes. | Yes – LiveSessionsView filters by status. |
| **user_progress** (current_day, days_completed) | StudentManagement → `user_progress` update | Yes. | **Unclear** – Portal uses `profile?.current_day` (profiles); if that’s not synced from user_progress, student header/tab day may not change. |
| **reviews.status** (approved/etc.) | ReviewModeration → Edge Function `moderate-review` | Only if function exists and updates `reviews`. | Yes – ReviewsSection filters `status = 'approved'`. |
| **profiles.role / is_admin** | AdminSetup, RoleManager, UserRoleAssignment | Yes (client). RLS in migrations for profiles/setup_tokens. | Yes – access and permissions. |

### Levers that do NOT exist or are not wired

| Lever | Expected | Actual |
|-------|----------|--------|
| **Publish / unpublish daily content** | can_publish_content in usePermissions; RBAC guide mentions publish | No column or filter in `course_content` queries; AdminDailyLessons has no publish control. Save = immediately visible. |
| **Visibility / order for class_materials** | Admin controls what appears in Resource Library | No admin UI; ResourceUploader not mounted. No visibility or ordering in student query. |
| **Announcements visible to students** | Students see announcements | No component reads `announcements`; admin writes only. |
| **Forum moderation (pin/hide/delete)** | Admin pins or hides posts | No admin UI for forum_posts; RLS allows any user to view all. |
| **Certificate issuance / completion_status** | Admin can grant certificate or set completion | No admin UI; completion_status writer not in repo; generate-certificate is student-triggered. |
| **Feature toggles (e.g. hide Resources tab)** | Config or flags | None in code; all portal tabs always visible (except permission-based admin tabs). |

---

## D) Mirror / Preview Audit

### Can Admin preview the student experience?

| Student view | Preview method | Works? |
|--------------|----------------|--------|
| **Daily lessons (standalone)** | From `/class/daily` (DailyLessons) → “Preview” → `/day-N` | **YES** – Same day-1…day-7 pages; same `course_content` query. |
| **Daily tab inside portal** | No route to render StudentPortal with a chosen “current day” as student. Admin can open `/student-portal` as admin but may be redirected (e.g. StudentWelcome sends admins to `/admin`). | **NO** – No “view as student” or role override for portal. |
| **Resources, Progress, Forum, Messages, Offline, Certificate, Email** | AdminDashboard buttons point to `/class/resources`, etc. | **NO** – Those routes do not exist → 404. |
| **Live sessions** | No `/class/live` route. Admin could open `/student-portal` and use Live tab (if not redirected). | **Partial** – Same LiveSessionsView component, but no dedicated preview route. |

### Shared components (true mirror)

- **Daily lesson content:** Admin edits in AdminDailyLessons; student reads in DailyContent and in day-1…day-7. Same `course_content` and `normalizeContent`. **Drift:** Portal “Daily” tab uses `DayContent` which uses **VideoBlock** (no progress save); standalone day-1…day-7 use **VideoPlayer** (writes `video_progress`). So portal daily and standalone daily differ for video behavior.
- **Live sessions:** LiveSessionManager (admin) and LiveSessionsView (student) use same `live_sessions` table; student filters by status. Logic aligned.

### Minimal architectural pattern for full preview (design only)

- **Option A – Preview routes:** Add routes under `/class/*` that render the same student portal components (ResourceLibrary, ProgressTracker, CommunityHub, etc.) in a layout that does not redirect admins, optionally with a “preview as student” context (e.g. mock or selected user id) so data reflects what a student sees.
- **Option B – Role override:** In StudentWelcome / StudentPortal, allow admin to “View as student” (e.g. query param or toggle) so that when authenticated as admin, portal still renders and shows student view of data (with clear “Preview” banner). Ensures single code path.
- **Option C – Shared layout + route map:** One “Student view” layout that renders tab content by route (e.g. `/class/dashboard` → ProgressDashboard). Admin dashboard “Preview” buttons navigate to these routes; student portal uses same components but from tab state instead of route. Requires adding the missing `/class/*` routes and wiring them to the same components.

---

## E) Uncontrolled or Unmirrored Elements (⚠)

### Student-facing elements Admin cannot modify (or not wired)

1. **Resource Library content** – Students read `class_materials`; no admin UI to create/edit (ResourceUploader exists but is never used). Order/visibility not controlled.
2. **Announcements** – Admin can create/edit; no student component displays them.
3. **Portal “current day”** – Display uses `profile?.current_day`; Admin updates `user_progress.current_day` only. If profiles.current_day is not synced, admin change may not show in portal.
4. **Forum visibility/pinning** – Students see all posts (by pinned, created_at). No admin moderation UI for forum_posts.
5. **Certificate eligibility** – Driven by `completion_status`; no admin control in repo to set completion or issue certificate manually.
6. **Offline tab** – Placeholder only; no admin control or content.

### Admin controls that do NOT affect student views

1. **AnnouncementManager** – Writes to `announcements`; no student reader.
2. **“Student View” links** (except Daily Lessons) – Navigate to non-existent routes → 404; no effect on student experience.

### Duplicated / drifting logic

1. **Daily lesson rendering** – Standalone pages (day-1…day-7) use `VideoPlayer` and persist `video_progress`. Portal “Daily” tab uses `DailyContent` → `VideoBlock` (no progress). Same content, different video behavior.
2. **Day selector** – Standalone: one page per day (route). Portal: `currentDay` from profile. Admin can change `user_progress.current_day` but not necessarily `profiles.current_day`; possible desync.

### Trust vs enforcement

1. **Admin routes** – Guarded only in `AdminDashboard` and `AdminLogin` (client-side). No middleware; direct URL access to `/admin` or `/admin/lessons` is only blocked after component mount and profile check. RLS on `profiles` and `setup_tokens` is defined in migrations; not all tables verified.
2. **Student routes** – `/day-1`…`/day-7`, `/integration`, `/student-portal` have no route-level auth; anyone can open. StudentPortal and StudentWelcome enforce auth inside the component.
3. **Review visibility** – Student only sees `status = 'approved'`. Moderation is via Edge Function `moderate-review`; if that function or its updates are missing, admin actions do not change what students see.
4. **can_publish_content** – Exists in usePermissions type and docs; no corresponding publish lever or column in course_content. Relies on “only admins can edit” rather than explicit publish state.

---

## F) Recommended Fixes (design-level only; no code)

1. **Wire Admin “Student View” to real previews**  
   Either add routes for `/class/dashboard`, `/class/resources`, `/class/progress`, `/class/forum`, `/class/messages`, `/class/offline`, `/class/live`, `/class/certificate`, `/class/email` that render the same components as the portal tabs, or change buttons to open the student portal with a query/hash that selects the tab (e.g. `/student-portal?tab=resources`) and ensure admins are not redirected away when opening the portal.

2. **Clarify and sync current_day**  
   Define single source of truth (e.g. `user_progress.current_day` or `profiles.current_day`). If portal should show progress from user_progress, either have portal read from user_progress for “current day” or add a sync (e.g. trigger or API) from user_progress to profiles when admin updates.

3. **Surface announcements to students**  
   Add a student-facing component (e.g. banner or “Announcements” in portal) that reads `announcements` with appropriate filter (e.g. is_active, target_audience) so admin-created announcements are visible.

4. **Wire ResourceUploader (or equivalent) into Admin**  
   Mount ResourceUploader (or a class_materials CRUD screen) in an admin tab so Admin can add/edit/order/hide resources. Optionally add a visibility or “published” field and have ResourceLibrary filter on it.

5. **Implement or verify moderate-review**  
   Add `moderate-review` Edge Function (or verify it in deployment) so that ReviewModeration actions update `reviews.status` and student view stays in sync.

6. **Align daily video behavior**  
   Use the same video component in portal Daily tab as on standalone day pages (e.g. VideoPlayer in DayContent when block type is video) so progress is saved consistently and “Continue” works from both entry points.

7. **Optional: publish workflow for course_content**  
   If “can_publish_content” should control visibility, add a published flag (or equivalent) to course_content, have student queries filter on it, and add publish/unpublish control in AdminDailyLessons so changes are not live until published.

8. **Admin certificate / completion control (optional)**  
   If admins should be able to mark a student complete or issue a certificate manually, add an admin-only action that updates completion_status or inserts into certificates (with appropriate RLS or backend check).

---

*End of audit. No code changes were made.*
