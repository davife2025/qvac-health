# Session 3 — Changes

## What's new / changed

### apps/web/src/lib/supabase/  (NEW directory — 3 files)
- client.ts    — browser client using @supabase/ssr createBrowserClient
- server.ts    — server client (RSC, Server Actions) using cookie store
- middleware.ts — session refresh + route protection logic

### apps/web/src/middleware.ts  (NEW)
- Runs on every request
- Refreshes Supabase session (keeps JWTs fresh)
- Redirects unauthenticated users away from /journal and /clinician
- Redirects authenticated users away from /auth/* pages

### apps/web/src/lib/auth-actions.ts  (NEW)
- login()         — signInWithPassword server action
- signup()        — signUp + creates public.users row + preferences
- logout()        — signOut server action
- getUser()       — raw Supabase user object
- getUserProfile() — full profile from public.users

### apps/web/src/app/auth/login/page.tsx  (NEW)
- Login form with error display and ?next= redirect support

### apps/web/src/app/auth/signup/page.tsx  (NEW)
- Signup form with role radio buttons (patient / clinician)
- Privacy note explaining what goes to cloud vs stays local

### apps/web/src/app/auth/callback/route.ts  (NEW)
- Handles Supabase email confirmation link redirects
- Ensures public.users row exists on confirm

### apps/web/src/components/Nav.tsx  (NEW)
- Top nav with conditional links based on user.role
- Sign in / Sign up for anonymous users
- Journal/SOAP Notes + Sign out for authenticated users

### apps/web/src/app/layout.tsx  (REPLACED)
- Now fetches user profile server-side
- Wraps children with Nav component

### apps/web/src/app/journal/page.tsx  (REPLACED)
- Auth guard: redirects to login if no user
- Role guard: redirects clinicians to /clinician

### apps/web/src/app/clinician/page.tsx  (REPLACED)
- Auth guard: redirects to login if no user
- Role guard: redirects patients to /journal

### apps/api/src/middleware/auth.ts  (NEW)
- requireAuth() — Fastify preHandler that verifies Supabase JWT
- requireRole() — role-based access control preHandler
- Augments FastifyRequest with request.user

### apps/api/src/routes/ai.ts  (REPLACED)
- Companion route: requires patient role
- SOAP route: requires clinician role
- userId sourced from verified JWT, not request body

### apps/api/src/server.ts  (REPLACED)
- Passes env to aiRoutes plugin for auth middleware

### supabase/migrations/002_auth_triggers.sql  (NEW)
- Auto-creates public.users + user_preferences on auth.users insert
- Safety net if the signup server action partially fails

## Apply instructions
Copy all files over S1+S2 codebase. Run:
  supabase db push   (to apply 002 migration)
  pnpm install       (no new deps needed — @supabase/ssr already in package.json)
