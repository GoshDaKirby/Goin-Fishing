# Supabase Setup

This game uses Supabase for two independent things:

1. **Multiplayer + chat** - works with just a Supabase project, no SQL needed.
2. **Optional cloud save** (sign in to sync your save across devices) - needs one small table.

Neither requires a traditional backend server; this is still a fully static site.

## 1. Create a project

Go to https://supabase.com, create a free project, and wait for it to finish provisioning.

## 2. Get your API keys

In the project dashboard: **Settings -> API**. You need:
- **Project URL** (e.g. `https://abcdefgh.supabase.co`)
- **anon public** key (a long JWT-looking string)

It is safe for both of these to be public / baked into the site's JS bundle - that's how every
Supabase client app works. Do **not** use the `service_role` key anywhere in this project; that one
must never be exposed publicly.

## 3. Add them to GitHub (for the live deploy)

In your repo: **Settings -> Secrets and variables -> Actions -> New repository secret**. Add two secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The deploy workflow already reads these into the build. Push any commit (or re-run the workflow) and
they'll be baked into the next build.

## 4. (Optional) Local dev

Copy `.env.example` to `.env.local` and fill in the same two values, then `npm run dev` picks them up.

## 5. Multiplayer + chat: nothing else needed

Player positions/nametags use Supabase Realtime **Presence**, and chat uses Realtime **Broadcast**.
Both are ephemeral (no database rows are created or need cleanup) and are enabled by default on every
Supabase project. As soon as the two keys above are set, hosting/joining a world and chatting will work.

## 6. Optional cloud save: one table + one policy

This part is only used if a player chooses to sign in (never required to play). Go to the **SQL Editor**
in Supabase and run:

```sql
create table saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table saves enable row level security;

create policy "Users manage their own save"
  on saves
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

That policy is what actually protects the data - it means the anon key can only ever read or write the
row belonging to the currently signed-in user, nobody else's.

### About usernames/passwords

Signing up/in in this game goes through **Supabase Auth**, not any code in this repo. When someone signs
up, Supabase's own managed backend hashes and stores their password in its internal `auth.users` table,
which is never reachable through the public anon key. The only things this repo's public JS ever sees or
sends are the project URL, the anon key, and whatever the person types into the login form on their way to
Supabase's servers over HTTPS. That's why it's fine for this to be a fully static, public GitHub repo -
nothing password-related is ever stored in the code or the bundle.

By default, Supabase requires email confirmation on sign-up (**Authentication -> Providers -> Email**).
You can leave that on (players confirm via a link Supabase emails them) or turn it off for a
frictionless "make up any email" experience - up to you.

## Troubleshooting cloud save

If "Push"/"Pull" in the Account panel don't seem to work, the panel now shows the actual error message
Supabase returns (it used to only log to the browser console, which made failures invisible). Common ones:

- `relation "saves" does not exist` - the SQL above was never run against this project. Run it in the SQL Editor.
- `new row violates row-level security policy` - the RLS policy above wasn't created, or was created against the wrong table/column names.
- `Failed to fetch` / network error - check `VITE_SUPABASE_URL` doesn't have a trailing path like `/rest/v1` on it; it should be just `https://xxxx.supabase.co`.
