-- ============================================================
-- Migration: 002_auth_triggers
--
-- Auto-creates a user profile row when Supabase Auth confirms
-- a new user. This fires even if the signup server action fails
-- or if the user signs up via a social provider in future.
-- ============================================================

-- Function: on new auth user, insert into public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger: fires after each new user is confirmed in auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
