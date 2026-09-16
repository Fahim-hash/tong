# TongerKhobor v2

A production-ready Bengali-first digital newsroom foundation built with Next.js App Router.

## Routes
- `/` — newsroom home
- `/articles/[slug]` — article reader
- `/category/[category]` — category feed
- `/search` — article search
- `/trending` — trending stories
- `/team` — newsroom team
- `/about` — about
- `/login` — internal login shell
- `/dashboard` — editorial dashboard
- `/editor` — article editor
- `/newscard` — social news-card studio

## Run
```bash
npm install
npm run dev
```

The v2 app is intentionally resilient without external services: it ships with local editorial seed data and can be connected to Firebase/Gemini later through server-side adapters.

## Environment
See `.env.example`. Never commit real secrets.
