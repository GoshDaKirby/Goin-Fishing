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

## 5. Multiplayer + chat: one required policy

Player positions/nametags use Supabase Realtime **Presence**, and chat uses Realtime **Broadcast**.
Both are ephemeral (no database rows are created or need cleanup).

**Important:** Supabase now requires explicit Realtime Authorization (Row Level Security policies on
`realtime.messages`) for Broadcast and Presence to work reliably on newer projects. Without this, you'll
see exactly the symptoms of a half-working connection - chat working sometimes, movement not syncing,
things degrading the longer a session runs. Run this in the SQL Editor:

```sql
-- Since this game never requires signing in to play multiplayer, these
-- policies authorize the anon role (not just authenticated users) to read
-- and send both Broadcast and Presence messages on any topic.
create policy "anyone can listen to broadcast and presence"
  on "realtime"."messages"
  for select
  to anon, authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
  );

create policy "anyone can send broadcast and presence"
  on "realtime"."messages"
  for insert
  to anon, authenticated
  with check (
    realtime.messages.extension in ('broadcast', 'presence')
  );
```

The game's code already requests `private: true` channels (required for these policies to actually be
checked - "public" channels skip RLS entirely). If you'd rather not manage this SQL, the other option is
**Realtime Settings → "Allow public access"** in the dashboard - turning that on makes public (non-private)
channels work without any RLS, but the policies above are the more future-proof route and the one this
game is wired for.

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

## 7. Public world listings (optional)

If you want players to be able to browse and join public worlds without typing a code, run this too:

```sql
create table worlds (
  code text primary key,
  is_public boolean not null default true,
  host_name text,
  updated_at timestamptz not null default now()
);

alter table worlds enable row level security;

-- No sign-in is used for multiplayer, so this intentionally allows anyone
-- to read the list and to upsert entries (hosting a public world doesn't
-- require an account). This is fine for a casual game; if you ever want to
-- lock it down further, that's the policy to revisit.
create policy "Anyone can read public worlds"
  on worlds for select
  using (true);

create policy "Anyone can list a public world"
  on worlds for insert
  with check (true);

create policy "Anyone can refresh a public world listing"
  on worlds for update
  using (true);
```

Private worlds (joined by code) never touch this table at all - only worlds explicitly hosted as "Public" get listed, and listings quietly drop off the list after a few minutes of inactivity (no cleanup needed).

## Troubleshooting cloud save

If "Push"/"Pull" in the Account panel don't seem to work, the panel now shows the actual error message
Supabase returns (it used to only log to the browser console, which made failures invisible). Common ones:

- `relation "saves" does not exist` - the SQL above was never run against this project. Run it in the SQL Editor.
- `new row violates row-level security policy` - the RLS policy above wasn't created, or was created against the wrong table/column names.
- `Failed to fetch` / network error - check `VITE_SUPABASE_URL` doesn't have a trailing path like `/rest/v1` on it; it should be just `https://xxxx.supabase.co`.
