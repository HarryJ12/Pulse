# Pulse

Pulse is an async communications platform built for the Summer Cursor Cohort made to **turn conversations into execution.**

It helps a technical cohort build whatever members are working on by keeping project context, help requests, feedback, decisions, links, and next steps in one structured workspace instead of scattering them across chat tabs.

The product starts with the essentials: threads, project rooms, lightweight chat, durable references, and manual AI artifacts. The plan is to evolve it from real cohort usage: improve the workflows that help builders ship, keep AI generation intentional and low-cost, and avoid turning Pulse into a noisy realtime chat clone.

## Features

- GitHub sign-in through Supabase Auth.
- Structured threads for help requests, project updates, feedback requests, collaborator searches, and resource shares.
- Replies, tags, statuses, project association, search, and filters.
- Lightweight project rooms with members, repo/live/Loom links, related threads, and recent activity.
- Lightweight async chat for quick cohort messages.
- Mention/reference picker for people, projects, and threads in chat, thread bodies, replies, and project descriptions.
- Manual AI prompt generation on thread pages.
- Manual AI thread summaries.
- Manual Weekly Pulse digest generation.
- Saved generated prompts, summaries, and digests in Supabase Postgres.
- Copy-to-clipboard controls for generated artifacts.
- Dark, calm engineering workspace UI with loading states and empty states.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui-style primitives
- Supabase Auth and Postgres
- OpenAI SDK
- Vercel-ready deployment

## Security Warning

Do not commit real secrets.

All API keys, OAuth credentials, database URLs, and service keys must live in environment variables only. Keep `.env.local` out of Git. This repository includes `.env.example` with placeholder names only.

If real credentials were pasted into a chat, issue tracker, or commit history, rotate them before deployment.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your own Supabase and OpenAI values.

Supabase has multiple values that look similar:

- `NEXT_PUBLIC_SUPABASE_URL` must be the project URL, such as `https://your-project-ref.supabase.co`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be the public anon JWT or `sb_publishable_...` key.
- `SUPABASE_SERVICE_ROLE_KEY` is private and server-only. Do not expose it to the browser.

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If GitHub sign-in mentions `placeholder.supabase.co`, the app is still running
with placeholder Supabase values. Add real values to `.env.local` and restart
`npm run dev`.

## Environment Variables

These variables are for the person deploying and operating Pulse, not for every cohort member. In the intended Cursor Cohort deployment, the moderator/admin owns the Supabase, OpenAI, GitHub OAuth, and Vercel configuration; members simply sign in with GitHub and use the app.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PULSE_ACCESS_PASSWORD=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` is listed for operational setup if needed, but the app does not expose it to the browser.

Do not put a value that starts with `sb_publishable_` in `NEXT_PUBLIC_SUPABASE_URL`; that value is a key, not a URL.

Set `PULSE_ACCESS_PASSWORD` to require a shared cohort password before GitHub sign-in. Share that password with cohort members in Discord, not in source code.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run every SQL file in `supabase/migrations` in filename order.
4. Confirm Row Level Security is enabled on:
   - `profiles`
   - `projects`
   - `project_members`
   - `threads`
   - `replies`
   - `chat_messages`
   - `generated_prompts`
   - `thread_summaries`
   - `weekly_digests`
5. Copy the project URL and anon key into `.env.local`.

If Pulse shows `Could not find the table 'public.profiles' in the schema cache`,
the migration has not been run in the Supabase project connected by
`NEXT_PUBLIC_SUPABASE_URL`.

The migration creates:

- Profile sync from Supabase Auth users.
- Thread, reply, project, member, chat message, prompt, summary, and digest tables.
- Indexes for filtering and activity views.
- RLS policies for authenticated cohort-wide reads and owner-limited updates/deletes where appropriate.

## GitHub OAuth Setup

1. In GitHub, create an OAuth App.
2. Set the GitHub OAuth callback URL to your Supabase Auth callback URL:

```text
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

3. In Supabase, go to **Authentication > Providers > GitHub**.
4. Enable GitHub and paste the GitHub client ID and client secret.
5. In Supabase, go to **Authentication > URL Configuration** and add these app redirect URLs:

```text
http://localhost:3000/auth/callback
https://your-vercel-domain.vercel.app/auth/callback
```

Supabase handles the GitHub provider callback. The Next.js app receives the app redirect at `/auth/callback` and exchanges the session server-side.

## OpenAI Setup

1. Create an OpenAI API key.
2. Set `OPENAI_API_KEY` in `.env.local`.
3. Optionally set `OPENAI_MODEL`; the default is `gpt-4o-mini`.

AI calls are manual only:

- No generation on page load.
- No background jobs.
- No polling loops.
- Generated outputs are saved in Supabase.

## Vercel Deployment

1. Push this repository to GitHub.
2. Create a Vercel project from the repository.
3. Add the same environment variables in Vercel Project Settings.
4. Add the production domain callback URL in Supabase Auth redirect URLs.
5. Deploy.

Vercel build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

## Useful Commands

```bash
npm run lint
npm run build
npm run dev
```

## Database Schema

The canonical schema lives at:

```text
supabase/migrations/
```

Run the migrations in filename order in Supabase before using the app.
