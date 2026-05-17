# ProdTrack Journal

ProdTrack Journal is a professional personal article writing website built with React. It has a public reader experience and an admin publishing area where articles can be added with uploaded cover images.

## Run the project

```bash
npm run start
```

Open http://localhost:3000 in your browser.

## Features

- Medium-style article reading layout
- Admin publisher for adding posts (prototype PIN: `prodtrack2026`)
- Cover image upload for each article
- Cloud article sync with Supabase when configured
- Local browser storage fallback when cloud settings are missing
- Responsive desktop and mobile design

## Cloud articles on Vercel

Articles added in one browser only appear on another device after you connect a shared database. The app supports Supabase through Vercel environment variables.

Vercel hosts the React website. Supabase stores the articles so laptop and phone visitors see the same posts.

Create a Supabase table named `articles` with these columns:

```sql
create table articles (
  id text primary key,
  title text not null,
  category text,
  author text,
  excerpt text,
  body text not null,
  image text,
  created_at timestamptz not null,
  read_time text,
  featured boolean default false
);
```

For this prototype, enable Row Level Security policies that allow public `select`, `insert`, and `delete` for the `articles` table. Then add these Vercel environment variables:

```text
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Redeploy on Vercel after adding the variables.

Note: the admin PIN is a frontend prototype guard, not production-grade security. For a real public writing platform, replace it with backend authentication and private image storage.
