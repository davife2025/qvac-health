-- ============================================================
-- Migration: 003_policy_and_index_fixes
--
-- Fix #3: public.users was missing an INSERT policy — the anon
--   client upsert in signup() would 403 silently under RLS.
--   The 002 trigger covers creation, but the server action upsert
--   needs an explicit INSERT policy too.
--
-- Fix #7: user_preferences "for all" policy used only `using`
--   clause, which covers reads. Writes need `with check` to prevent
--   a user from inserting/updating another user's preferences row.
--
-- Fix #12: journal_entries queries filter on user_id then sort by
--   created_at — composite index eliminates the sort step entirely.
-- ============================================================

-- Fix #3: allow authenticated users to insert their own profile row
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Fix #7: tighten user_preferences write policy
-- Drop the permissive "for all" and replace with explicit policies
drop policy if exists "Users can manage own preferences" on public.user_preferences;

create policy "Users can read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own preferences"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- Fix #12: composite index for the paginated journal query
-- WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50
-- Postgres can use this for a single index scan with no sort step.
drop index if exists idx_journal_entries_user_id;
drop index if exists idx_journal_entries_created_at;

create index idx_journal_entries_user_created
  on public.journal_entries(user_id, created_at desc);

-- Also add a composite index for SOAP notes (clinician_id + created_at)
create index if not exists idx_soap_notes_clinician_created
  on public.soap_notes(clinician_id, created_at desc);
