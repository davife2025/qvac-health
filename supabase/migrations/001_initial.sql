-- ============================================================
-- QVAC Health — Supabase Schema
-- Migration: 001_initial
--
-- PRIVACY DESIGN:
--   All actual health content (journal text, session notes) lives
--   in local SQLite on the user's device via QVAC RAG.
--   Supabase stores ONLY metadata: IDs, timestamps, hashes, user prefs.
--   This schema is intentionally minimal.
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Users ───────────────────────────────────────────────────────────────────

create table public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  role        text not null check (role in ('patient', 'clinician')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ─── Journal Entry Metadata ───────────────────────────────────────────────────
-- Content lives locally. We only store a hash + mood + tags for sync/backup.

create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  content_hash  text not null,       -- SHA-256 of local content (integrity)
  mood          smallint not null check (mood between 1 and 5),
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

create policy "Patients can manage own entries"
  on public.journal_entries for all
  using (auth.uid() = user_id);

create index idx_journal_entries_user_id on public.journal_entries(user_id);
create index idx_journal_entries_created_at on public.journal_entries(created_at desc);

-- ─── SOAP Note Metadata ───────────────────────────────────────────────────────
-- Raw transcripts and generated notes stay local. We store references + audit.

create table public.soap_notes (
  id            uuid primary key default gen_random_uuid(),
  clinician_id  uuid not null references public.users(id) on delete cascade,
  patient_ref   text not null,        -- anonymous reference, never real patient ID
  content_hash  text not null,        -- hash of local SOAP JSON
  created_at    timestamptz not null default now()
);

alter table public.soap_notes enable row level security;

create policy "Clinicians can manage own SOAP notes"
  on public.soap_notes for all
  using (auth.uid() = clinician_id);

create index idx_soap_notes_clinician_id on public.soap_notes(clinician_id);

-- ─── User Preferences ────────────────────────────────────────────────────────

create table public.user_preferences (
  user_id           uuid primary key references public.users(id) on delete cascade,
  preferred_model   text default 'COMPANION_LLM',
  theme             text default 'light' check (theme in ('light', 'dark', 'system')),
  notifications     boolean default false,
  updated_at        timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can manage own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id);

-- ─── Triggers ─────────────────────────────────────────────────────────────────

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.update_updated_at();
