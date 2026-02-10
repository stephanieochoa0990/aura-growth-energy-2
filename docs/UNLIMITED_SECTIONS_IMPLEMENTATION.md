# Unlimited Sections per Day — Implementation Summary

## Path chosen: (B) Keep existing content, add day_sections

Existing `course_content` and the current lesson UI are unchanged. When a day has **no** rows in `day_sections`, the app still loads and shows `course_content` (legacy). When a day has **at least one** `day_sections` row, the app shows the new sections view (and RLS ensures students only see published sections). No data migration required.

---

## Files changed

| Path | Change |
|------|--------|
| `supabase/migrations/20260210_day_sections.sql` | **New** — table, index, trigger, RLS |
| `src/components/portal/DaySectionsView.tsx` | **New** — fetch/render sections, admin add/edit/delete/reorder/publish |
| `src/components/portal/DayPage.tsx` | **New** — shared day page: day_sections vs legacy course_content |
| `src/components/portal/DailyContent.tsx` | Use day_sections when present, else course_content + DayContent |
| `src/pages/day-1.tsx` … `day-7.tsx` | Use `<DayPage dayNumber={n} />` |

---

## SQL / migration

- **File:** `supabase/migrations/20260210_day_sections.sql`
- **Contents:** Creates `day_sections` (columns as specified), index `(day_number, order_index)`, `set_updated_at` trigger, RLS with “Students read published” and “Admins full access” using `is_admin_user(auth.uid())`.
- **Ordering:** New section without `order_index` gets `max(order_index)` for that day + 1. On delete, `order_index` is left as-is (gaps allowed); no re-normalization.

---

## How to fix "Could not find the table 'public.day_sections'"

The app will fall back to the existing lesson content if the table is missing, but to use **Unlimited Sections** you must create the table:

1. **Option A – Supabase Dashboard**  
   - Open your project at [supabase.com/dashboard](https://supabase.com/dashboard) → **SQL Editor**.  
   - Copy the contents of `supabase/migrations/20260210_day_sections.sql` and run it.

2. **Option B – Supabase CLI**  
   - From the project root: `supabase db push`  
   - Or link and push: `supabase link` then `supabase db push`.

After the migration runs, refresh the app; Daily Lessons will use the new sections when you add them.

---

## How to test

1. **Apply migration** (see above).

2. **Admin: add and manage sections (Day 1)**  
   - Log in as admin.  
   - Open the Day 1 view (standalone `/day-1` or portal Daily tab, Day 1).  
   - Click “+ Add Section” and add 3 sections (e.g. “Intro”, “Lesson”, “Practice”) with different types/content.  
   - Reorder with Move Up / Move Down.  
   - Unpublish one section (toggle “Publish” off); it should show a “Draft” badge.  
   - Edit one section (pencil), change title/content, save.  
   - Confirm list and order look correct.

3. **Student: only published, correct order**  
   - Log in as a non-admin student (or use an incognito window with a student account).  
   - Open Day 1.  
   - You should see only the **published** sections, in **order_index** order.  
   - The unpublished section must not appear.

4. **Persistence**  
   - Refresh the page (both as admin and as student).  
   - Admin: still sees all sections (including draft) in the same order.  
   - Student: still sees only published sections in the same order.

5. **Fallback (optional)**  
   - For a day that has **no** `day_sections` rows (e.g. Day 2 if you never added sections), the app should still show the existing `course_content` lesson for that day.  
   - Add sections for that day as admin; after that, the day should switch to the new sections view.

---

## Admin detection

Uses the existing app role check: `usePermissions().isAdmin` (from `profiles.role` and `profiles.is_admin`). RLS uses `is_admin_user(auth.uid())` (from `ensure_profiles_admin_columns.sql`), so behavior is consistent with the rest of the app.
