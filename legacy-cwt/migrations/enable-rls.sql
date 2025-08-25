-- enable-rls.sql
-- Purpose: Resolve database linter errors:
--   1. policy_exists_rls_disabled (policies defined but RLS not enabled)
--   2. rls_disabled_in_public (public schema tables exposed without RLS)
-- Strategy:
--   * Enable RLS on all listed tables so existing policies begin to take effect.
--   * (Optional) FORCE RLS on sensitive PII / auth related tables.
--   * (Optional) Move purely internal backup table to a non-exposed schema.
--   * Provide verification queries & rollback guidance.
-- NOTE: Enabling RLS can immediately restrict access for roles lacking policies.
-- Test application flows after applying. Apply in a maintenance window if unsure.

-- =============================================================
-- 0. (Optional) Create an internal schema for backup/maintenance tables
-- =============================================================
-- Uncomment to isolate backup table(s) from PostgREST exposure without needing RLS.
-- CREATE SCHEMA IF NOT EXISTS internal;
-- ALTER TABLE public.events_recurrence_exceptions_backup SET SCHEMA internal;

-- If you move the table, remove it from later ALTER TABLE statements targeting public schema.

-- =============================================================
-- 1. Enable Row Level Security (RLS) on all affected tables
-- =============================================================
-- NOTE: This does NOT FORCE RLS; superuser / owner still bypasses. PostgREST sessions will enforce policies.
-- Run as a role with sufficient privilege (e.g. postgres / supabase_admin).

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apparatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_skill_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_email_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_apparatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_side_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_payout_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_payout_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
-- Backup table (only if it stays in public schema):
ALTER TABLE public.events_recurrence_exceptions_backup ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 2. (Optional) FORCE RLS on sensitive tables (prevents owner bypass)
-- =============================================================
-- Only enable FORCE if you have policies that cover all necessary operations for service / anon roles.
-- Comment out any you do not wish to enforce strictly.
-- ALTER TABLE public.admins FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.parents FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.athletes FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.parent_password_reset_tokens FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.parent_verification_tokens FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.session FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.payment_logs FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.privacy_requests FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.waivers FORCE ROW LEVEL SECURITY;

-- =============================================================
-- 3. Verification: All targeted tables should now have row_security = true
-- =============================================================
-- information_schema.tables does NOT expose row level security flags; use pg_class / pg_namespace.
SELECT
  c.relname                                  AS table_name,
  c.relrowsecurity                           AS row_security_enabled,
  c.relforcerowsecurity                      AS force_row_security_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'activity_logs','admins','apparatus','archived_waivers','athlete_skill_videos','athlete_skills','athletes',
    'availability','blog_email_signups','blog_posts','booking_apparatus','booking_athletes','booking_focus_areas',
    'booking_side_quests','bookings','cookie_consent','focus_areas','genders','gym_payout_rates','gym_payout_runs',
    'lesson_types','parent_password_reset_tokens','parents','privacy_requests','progress_share_links','session',
    'side_quests','site_content','site_faqs','site_inquiries','skill_components','skills','skills_prerequisites',
    'testimonials','tips','waivers','archived_bookings','events','parent_verification_tokens','slot_reservations',
    'payment_logs','events_recurrence_exceptions_backup'
  )
ORDER BY c.relname;

-- =============================================================
-- 4. (Optional) Quick policy coverage audit: list tables with zero policies
-- =============================================================
-- Any table returning 0 here after enabling RLS will deny all access to non-superusers.
SELECT t.schemaname, t.tablename, COUNT(p.policyname) AS policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'activity_logs','admins','apparatus','archived_waivers','athlete_skill_videos','athlete_skills','athletes',
    'availability','blog_email_signups','blog_posts','booking_apparatus','booking_athletes','booking_focus_areas',
    'booking_side_quests','bookings','cookie_consent','focus_areas','genders','gym_payout_rates','gym_payout_runs',
    'lesson_types','parent_password_reset_tokens','parents','privacy_requests','progress_share_links','session',
    'side_quests','site_content','site_faqs','site_inquiries','skill_components','skills','skills_prerequisites',
    'testimonials','tips','waivers','archived_bookings','events','parent_verification_tokens','slot_reservations',
    'payment_logs','events_recurrence_exceptions_backup'
  )
GROUP BY t.schemaname, t.tablename
ORDER BY t.tablename;

-- =============================================================
-- 5. Rollback section
-- =============================================================
-- To revert (disabling RLS again). NOT recommended for production security posture.
-- ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
-- ... repeat for any specific tables you need to rollback.

-- End of script
