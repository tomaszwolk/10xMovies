-- migration: 20251015120000_disable_rls_for_django_auth.sql
-- description: Disables RLS policies that rely on Supabase Auth (auth.uid())
--              because the application uses Django Auth + JWT for authentication.
--
-- ARCHITECTURE DECISION:
-- This application uses Django REST Framework with JWT authentication (stateless).
-- Django connects to the database as a single application user (postgres.[project-ref]),
-- NOT as individual end-users. Therefore:
--   - auth.uid() always returns NULL (no Supabase Auth session)
--   - Authorization is handled in Django views/serializers via ORM filters
--   - RLS is disabled for user-owned tables (user_platform, user_movie, etc.)
--   - RLS remains enabled for read-only global tables (platform, movie, movie_availability)

-- Drop RLS policies that use auth.uid() (incompatible with Django Auth)

-- user_platform: remove owner-only policy
drop policy if exists "allow owner access to user_platform" on "public"."user_platform";

-- user_movie: remove owner-only policy  
drop policy if exists "allow owner access to user_movie" on "public"."user_movie";

-- ai_suggestion_batch: remove owner-only policy
drop policy if exists "allow owner access to ai_suggestion_batch" on "public"."ai_suggestion_batch";

-- event: remove owner-only policy (keep service_role policy for admin access)
drop policy if exists "allow owner access to their events" on "public"."event";

-- Disable RLS for tables where Django handles authorization
alter table "public"."user_platform" disable row level security;
alter table "public"."user_movie" disable row level security;
alter table "public"."ai_suggestion_batch" disable row level security;
alter table "public"."event" disable row level security;

-- KEEP RLS enabled for read-only global tables (prevents accidental writes from Django)
-- These policies remain unchanged:
--   - platform: "allow authenticated read access to platforms"
--   - movie: "allow authenticated read access to movies"  
--   - movie_availability: "allow authenticated read access to movie_availability"
--   - integration_error_log: "allow service_role full access" (admin only)

-- NOTE: Django views ensure users can only access their own data via ORM filters:
--   Example: UserMovie.objects.filter(user_id=request.user.id)
--   This is enforced at the application layer, not the database layer.

