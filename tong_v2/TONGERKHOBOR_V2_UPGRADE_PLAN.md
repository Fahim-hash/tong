# TongerKhobor v2 — Concrete Upgrade Plan

> Repository: `Fahim-hash/tong`  
> Current app root: `anamika-web/`  
> Target planning workspace: `tong_v2/`  
> Status: Architecture + implementation plan only; current production code is not changed by this document.

## 1. Deep audit snapshot

The current repository is a Next.js App Router application under `anamika-web/`. It is currently closer to an internal contributor/news-card portal than a complete public newsroom.

### Current stack observed

- Next.js `16.2.3`
- React `19.2.4`
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Firebase client SDK `10.8.0`
- Firestore + Firebase Storage
- Google Gemini via `@google/genai`
- Vercel Analytics
- `html-to-image`
- Vercel project: `tong`
- Vercel Node.js version: `24.x`
- Production domains currently attached to the Vercel project include `tong-one.vercel.app`, `tong-relaxteam.vercel.app`, and `tong-git-main-relaxteam.vercel.app`.

### Important problems found

1. **Authentication is not production-safe.** Passwords are stored in Firestore and compared directly in the browser. Sessions are only a `localStorage` object containing `{id,name}`.
2. **Admin authorization is partly hard-coded.** `AUTHORIZED_ADMIN_IDS` lives in `app/admin/page.tsx`, while the browser also checks Firestore data.
3. **Firebase configuration is hard-coded.** The Firebase web config is committed directly in `app/lib/firebase.ts`. Public Firebase web config values are not equivalent to server secrets, but v2 should still move configuration to environment variables and enforce access with Firebase rules/server authorization.
4. **The root dashboard is a client component.** `app/page.tsx` establishes a Firestore realtime listener for the whole `members` collection and also exposes password-shaped data to the client.
5. **The team page is also a live Firestore client.** `app/team/page.tsx` listens to the full `members` collection.
6. **Registration is directly writable from the client.** `app/register/page.tsx` creates member documents and stores plaintext passwords.
7. **Profile editing is directly writable from the client.** `app/profile/page.tsx` writes profile data from the browser.
8. **News-card image handling uses `FileReader` data URLs.** This makes browser memory/network payloads unnecessarily large.
9. **News-card generation mixes UI, canvas rendering, Firestore writes and business logic in one large client component.** `app/newscard/page.tsx` is ~24 KB and should be split into reusable modules.
10. **The AI route accepts a base64 image inside JSON.** This is expensive and makes request payloads unnecessarily large.
11. **The AI prompt asks for Google Search/current verification.** The implementation should make the distinction between AI-generated copy and verified reporting explicit; v2 should not present generated text as fact-checking.
12. **Middleware logs visitor IPs.** `middleware.ts` reads `x-forwarded-for` and logs it. This should be removed unless there is a documented operational/security reason and appropriate privacy handling.
13. **The visual texture is loaded from an external URL.** `globals.css` references Transparent Textures instead of using a local asset/CSS effect.
14. **Brand/project naming is inconsistent.** `package.json` is named `shahela-web`, while the project is TongerKhobor and the Vercel project is `tong`.
15. **README is still the default create-next-app README.** It does not document TongerKhobor, Firebase, AI, deployment, data model, environment variables, or operations.
16. **No explicit public newsroom information architecture exists yet.** The current routes are mainly `/`, `/newscard`, `/profile`, `/register`, `/team`, and `/admin`.
17. **No dedicated article/content model is present in the inspected tree.** v2 should make articles first-class records rather than treating generated social cards as the primary content object.
18. **No clear test architecture is present.** v2 should add unit, API and browser smoke tests before major feature expansion.

---

# 2. TongerKhobor v2 product architecture

## Goal

Turn the current internal portal into a **Bengali-first digital newsroom platform** with two connected surfaces:

### Public newsroom

- `/` — latest/editor-picked feed
- `/articles/[slug]` — article page
- `/category/[category]` — category feed
- `/search` — search results
- `/trending` — trending stories
- `/team` — public contributor/team directory
- `/about` — newsroom/about/contact

### Internal newsroom

- `/login` — secure authentication
- `/dashboard` — contributor dashboard
- `/editor` — article editor
- `/editor/[id]` — edit/draft article
- `/newscard` — social-card studio
- `/media` — media library
- `/analytics` — newsroom analytics
- `/team/manage` — team management
- `/admin` — protected administration

## Recommended data flow

```text
Public browser
   ↓
Next.js Server Components / Route Handlers
   ↓
Content service + authorization layer
   ↓
Firestore (articles, users, media metadata, analytics)
   ↓
Firebase Storage / image CDN

Internal editor
   ↓
Secure session
   ↓
Server actions / Route Handlers
   ↓
Validation + authorization
   ↓
Firestore / Storage

AI assistant
   ↓
/api/ai/*
   ↓
Vercel AI Gateway or server-side Gemini integration
   ↓
Structured newsroom output
```

---

# 3. File-by-file migration plan

## A. Root/project files

### `anamika-web/package.json`
**Action:** Replace/clean.

- Rename package from `shahela-web` to `tongerkhobor-web`.
- Keep Next.js/React compatible versions, but update dependencies deliberately rather than blindly using `latest`.
- Remove direct dependencies that are no longer needed after refactoring.
- Add scripts:
  - `typecheck`
  - `lint`
  - `test`
  - `test:e2e`
  - `build`
- Add a single source of truth for supported Node version.
- Add schema/validation dependency such as Zod.
- Add testing dependencies (Vitest/Playwright or equivalent selected during implementation).

### `anamika-web/package-lock.json`
**Action:** Regenerate after package.json changes.

Never hand-edit this file.

### `anamika-web/README.md`
**Action:** Full rewrite.

Document:
- TongerKhobor purpose
- public/internal architecture
- local setup
- Firebase setup
- Vercel setup
- environment variables
- Firestore collections
- Storage paths
- authentication model
- AI features
- deployment workflow
- security rules
- testing commands
- content publishing workflow

### `anamika-web/AGENTS.md`
**Action:** Rewrite for v2 engineering rules.

Include:
- Bengali-first UI rules
- server/client component rules
- security rules
- no plaintext passwords
- no secrets in client components
- accessibility requirements
- SEO requirements
- image-performance rules
- Firestore access rules
- commit conventions

### `anamika-web/CLAUDE.md`
**Action:** Replace the current minimal file with a useful project guide or remove it if the team does not use it.

### `anamika-web/tsconfig.json`
**Action:** Harden.

- strict TypeScript
- clean aliases such as `@/components`, `@/lib`, `@/features`
- keep generated Next.js settings intact
- avoid unnecessary path complexity

### `anamika-web/eslint.config.mjs`
**Action:** Expand.

- Next.js rules
- React hooks rules
- TypeScript rules
- no accidental console logging in production paths except approved logger
- no secret/client misuse patterns where practical

### `anamika-web/postcss.config.mjs`
**Action:** Keep unless v2 styling architecture changes.

### `anamika-web/tailwind.config.ts`
**Action:** Rebuild around the TongerKhobor design tokens.

Define:
- ink
- paper
- burgundy
- signal red
- muted gray
- border
- typography scale
- newsroom spacing
- card radius/shadows

### `anamika-web/next.config.ts`
**Action:** Major upgrade.

Add:
- `images.remotePatterns` only for approved image hosts
- security headers where appropriate
- cache headers for immutable static assets
- strict image formats/sizes
- safe redirects if old routes are migrated
- remove unnecessary `allowedDevOrigins` once local development is standardized

Prefer `vercel.ts` for new Vercel-specific project configuration where appropriate.

### `anamika-web/vercel.ts` **NEW**
**Action:** Add.

Use for:
- framework/build configuration where useful
- safe cache-control rules
- redirects
- cron definitions if v2 introduces scheduled jobs

Do not put secret values in source control.

---

# 4. App shell and design system

### `anamika-web/app/layout.tsx`
**Action:** Rebuild.

- Set `lang="bn"` by default.
- Add robust metadata base URL.
- Add Open Graph/Twitter metadata.
- Add favicon/app icons.
- Use local/optimized Bengali-compatible fonts.
- Add theme color.
- Add `WebSite`/organization metadata where appropriate.
- Keep analytics integration but isolate it from the critical render path where possible.

### `anamika-web/app/globals.css`
**Action:** Full visual-system rewrite.

- Remove external paper texture URL.
- Implement subtle local/CSS paper grain if the editorial aesthetic remains.
- Add design tokens.
- Add Bengali typography defaults.
- Add selection/focus styles.
- Add reduced-motion support.
- Add print styles for news cards/articles.

---

# 5. Public newsroom routes — NEW

### `anamika-web/app/(public)/page.tsx`
**Action:** New public homepage.

Sections:
- masthead
- breaking-news strip
- lead story
- latest grid
- category rails
- trending
- editor picks
- newsletter/contact CTA

Use Server Components for initial content.

### `anamika-web/app/(public)/articles/[slug]/page.tsx`
**Action:** New.

- article body
- author
- publish/update timestamps
- category
- cover image
- related stories
- share actions
- source/credit information
- Article JSON-LD
- canonical URL

### `anamika-web/app/(public)/category/[category]/page.tsx`
**Action:** New.

- category metadata
- paginated/latest feed
- category-specific SEO

### `anamika-web/app/(public)/search/page.tsx`
**Action:** New.

- query input
- filters
- category/date filters
- result cards
- empty/loading/error states

### `anamika-web/app/(public)/trending/page.tsx`
**Action:** New.

Use measured engagement data rather than arbitrary client-side sorting.

### `anamika-web/app/(public)/team/page.tsx`
**Action:** Replace current team page after migration.

Public-only fields should be returned. Never send password/auth fields to the browser.

### `anamika-web/app/(public)/about/page.tsx`
**Action:** New.

Brand story, editorial identity, contact and social links.

---

# 6. Authentication and internal routes

### `anamika-web/app/page.tsx`
**Action:** Deprecate as current login/dashboard hybrid.

Split into:
- `/login`
- `/dashboard`

The current root page fetches the entire `members` collection and maps the Firestore `password` field into browser state. That must be eliminated.

### `anamika-web/app/login/page.tsx` **NEW**
**Action:** New secure login UI.

Use Firebase Auth or another supported secure auth mechanism. Do not manually compare passwords in the browser.

### `anamika-web/app/dashboard/page.tsx` **NEW**
**Action:** New internal dashboard.

Show:
- drafts
- assigned stories
- recent generated cards
- personal activity
- quick create
- publishing status

Only query data required for the current user.

### `anamika-web/components/AuthGuard.tsx`
**Action:** Replace.

Move authorization decisions server-side where possible. Client guard should only improve UX, never be the security boundary.

### `anamika-web/middleware.ts`
**Action:** Replace.

Remove visitor-IP logging. Use middleware/proxy only for lightweight route handling. Authorization must be backed by a trusted server-side session/token check.

---

# 7. Registration/profile/team migration

### `anamika-web/app/register/page.tsx`
**Action:** Replace.

Registration should use a secure auth flow and create a profile document without storing plaintext passwords.

Recommended profile fields:

```text
uid
memberId
name
role
category
avatarUrl
email
socialLinks
bio
status
createdAt
updatedAt
```

### `anamika-web/app/profile/page.tsx`
**Action:** Replace.

- read current authenticated user
- edit only allowed profile fields
- upload avatar to controlled Storage path
- validate URLs
- server-side authorization for updates

### `anamika-web/app/team/page.tsx`
**Action:** Replace with public team route.

Use a server query or controlled API. Return no password or private fields.

### `anamika-web/app/admin/page.tsx`
**Action:** Major rewrite.

Split into modules:
- member management
- role management
- content moderation
- audit log
- settings

Remove hard-coded `AUTHORIZED_ADMIN_IDS` as the primary authorization mechanism.

Authorization should use claims/roles and server-side checks.

---

# 8. Firebase/data layer

### `anamika-web/app/lib/firebase.ts`
**Action:** Replace.

Split into:

```text
lib/firebase/client.ts
lib/firebase/admin.ts
lib/firebase/storage.ts
```

Client config should use `NEXT_PUBLIC_FIREBASE_*` variables.

Server/admin credentials must never enter client bundles.

### `anamika-web/app/lib/env.ts` **NEW**
**Action:** Add typed environment validation.

Validate required variables at startup/server execution and provide safe errors.

### `anamika-web/app/lib/auth.ts` **NEW**
**Action:** Add.

Centralize:
- current user
- role checks
- admin checks
- contributor checks
- session validation

### `anamika-web/app/lib/db.ts` **NEW**
**Action:** Add data-access functions.

Examples:
- `getArticleBySlug`
- `getLatestArticles`
- `getCategoryArticles`
- `getMemberProfile`
- `createDraft`
- `updateArticle`
- `publishArticle`

Do not call Firestore directly from every UI component.

### `anamika-web/app/lib/validation.ts` **NEW**
**Action:** Add shared Zod schemas.

Schemas:
- article
- member
- media
- AI request
- search filters
- news-card payload

---

# 9. Firestore v2 data model

Create these collections deliberately:

```text
members/{uid}
articles/{articleId}
articles/{articleId}/revisions/{revisionId}
media/{mediaId}
newsCards/{cardId}
activity/{activityId}
analytics_daily/{date}
settings/global
```

### Article document

```text
id
slug
title
subtitle
excerpt
body
language
category
tags
coverMediaId
authorId
authorName
status: draft | review | scheduled | published | archived
featured
breaking
publishedAt
updatedAt
createdAt
seoTitle
seoDescription
canonicalUrl
sourceCredits
```

### News card document

```text
id
articleId
creatorId
template
variant
language
imageMediaId
headline
subHeadline
caption
photoCredit
createdAt
```

### Activity document

Track meaningful actions:
- article created
- draft edited
- submitted for review
- published
- card generated
- member updated

Do not log sensitive credentials or raw passwords.

---

# 10. Article editor

### `anamika-web/app/editor/page.tsx` **NEW**
**Action:** New newsroom writing workspace.

Features:
- Bengali/English toggle
- title/subtitle
- rich text/structured body
- cover image
- category/tags
- source credits
- autosave draft
- preview
- submit for review
- publish/schedule

### `anamika-web/app/editor/[id]/page.tsx` **NEW**
**Action:** Edit existing article.

### `anamika-web/components/editor/*` **NEW**
**Action:** Split editor into reusable components.

Suggested files:
- `EditorShell.tsx`
- `HeadlineEditor.tsx`
- `BodyEditor.tsx`
- `MediaPicker.tsx`
- `ArticleSettings.tsx`
- `PublishPanel.tsx`
- `AutosaveIndicator.tsx`

---

# 11. AI newsroom system

### `anamika-web/app/api/generate-caption/route.ts`
**Action:** Replace.

Current route sends an entire base64 image in JSON and uses a prompt that requests internet verification. v2 should instead expose a structured AI service.

New endpoint family:

```text
/api/ai/headline
/api/ai/subheadline
/api/ai/caption
/api/ai/summary
/api/ai/translate
/api/ai/rewrite
/api/ai/tags
/api/ai/seo
```

Each endpoint should:
- validate input
- authorize user
- rate-limit expensive requests
- use structured output
- return explicit `generated` metadata
- never claim AI output is independently verified unless an actual verification pipeline was executed

### `anamika-web/app/lib/ai/*` **NEW**

Suggested modules:
- `client.ts`
- `prompts.ts`
- `schemas.ts`
- `caption.ts`
- `headline.ts`
- `translation.ts`
- `seo.ts`

Prefer a server-side provider abstraction so the UI is not coupled to one provider.

---

# 12. News Card Studio v2

### `anamika-web/app/newscard/page.tsx`
**Action:** Keep route, completely refactor implementation.

Split into:

```text
components/news-card/NewsCardStudio.tsx
components/news-card/NewsCardForm.tsx
components/news-card/NewsCardCanvas.tsx
components/news-card/TemplatePicker.tsx
components/news-card/ImagePicker.tsx
components/news-card/CaptionPanel.tsx
components/news-card/ExportControls.tsx
lib/news-card/render.ts
lib/news-card/templates.ts
```

Add templates:
- Standard
- Breaking
- Sports
- Quote
- Photo-led
- Minimal
- Dark

Export sizes:
- 1080×1350 Instagram portrait
- 1080×1080 square
- 1080×1920 story
- 1200×675 landscape

Performance changes:
- upload images instead of embedding huge base64 payloads
- resize/compress before upload
- lazy-load rendering/export code
- use WebP/AVIF where appropriate
- avoid unnecessary Firestore writes during editing

---

# 13. Media library

### `anamika-web/app/media/page.tsx` **NEW**

Features:
- upload
- preview
- search
- filter by type
- attribution/credit
- article attachment
- delete/archive

### `anamika-web/app/api/media/*` **NEW**

Use controlled server-side upload/signing logic as appropriate. Keep private/admin media separate from public assets.

Recommended Storage paths:

```text
public/articles/{articleId}/...
public/team/{uid}/...
public/cards/{cardId}/...
private/admin/...
```

---

# 14. SEO and discovery

### `anamika-web/app/sitemap.ts` **NEW**
Generate sitemap for public article/category routes.

### `anamika-web/app/robots.ts` **NEW**
Allow public newsroom pages and block private/admin routes.

### `anamika-web/app/opengraph-image.tsx` **NEW**
Dynamic newsroom OG image.

### `anamika-web/app/(public)/articles/[slug]/opengraph-image.tsx` **NEW**
Article-specific OG image.

### `anamika-web/app/lib/seo.ts` **NEW**
Centralize:
- metadata
- canonical URL
- article schema
- breadcrumbs
- social metadata

---

# 15. Search and analytics

### `anamika-web/app/analytics/page.tsx` **NEW**
Internal dashboard for:
- article views
- top stories
- category performance
- cards generated
- contributor activity

### `anamika-web/app/api/analytics/*` **NEW**
Use aggregated events rather than reading the entire content database in the browser.

### Search

Start with Firestore-friendly category/date/tag queries. If full-text search requirements outgrow Firestore, add a dedicated Vercel Marketplace search integration after discovery/provisioning.

---

# 16. Static assets

### `anamika-web/public/logo.png`
**Action:** Keep as primary logo only if it is the approved current brand asset. Optimize/compress.

### `anamika-web/public/logo2.png`
**Action:** Audit actual usage. Keep only if it serves a distinct approved purpose.

### `anamika-web/public/file.svg`
### `anamika-web/public/globe.svg`
### `anamika-web/public/next.svg`
### `anamika-web/public/vercel.svg`
### `anamika-web/public/window.svg`
**Action:** Remove unused create-next-app assets.

### `anamika-web/public/data/info.json`
**Action:** Move to typed config/content or delete if unused.

### `anamika-web/app/favicon.ico`
**Action:** Replace/confirm final TongerKhobor favicon.

---

# 17. New component architecture

Create:

```text
components/
  ui/
  newsroom/
    Masthead.tsx
    BreakingTicker.tsx
    StoryCard.tsx
    LeadStory.tsx
    CategoryRail.tsx
    TrendingList.tsx
    ArticleHeader.tsx
    ArticleBody.tsx
    AuthorByline.tsx
  editor/
  news-card/
  admin/
  auth/
```

Rule: components should receive typed data; they should not independently know Firestore collection names.

---

# 18. API architecture

Target API structure:

```text
app/api/
  ai/
    caption/route.ts
    headline/route.ts
    rewrite/route.ts
    translate/route.ts
    summary/route.ts
    seo/route.ts
    tags/route.ts
  articles/
    route.ts
    [id]/route.ts
    [id]/publish/route.ts
  media/
    route.ts
  analytics/
    event/route.ts
```

All mutating routes must include:
- authentication
- authorization
- schema validation
- consistent errors
- audit logging where appropriate

---

# 19. Environment variables

## Verified from current repository code

The current code explicitly reads:

```env
GEMINI_API_KEY=<secret>
```

The current Firebase client configuration is hard-coded in `app/lib/firebase.ts`; it is **not currently read from environment variables**.

## V2 recommended environment-variable contract

### Public Firebase client configuration

These are configuration values intended for the browser Firebase SDK; still keep them configurable per environment:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Server-only secrets/config

```env
GEMINI_API_KEY=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

If Firebase Admin uses another supported credential mechanism, use that mechanism instead of committing credentials.

### Site configuration

```env
NEXT_PUBLIC_SITE_URL=https://<production-domain>
NEXT_PUBLIC_SITE_NAME=TongerKhobor
NEXT_PUBLIC_CONTACT_EMAIL=teamtongerkhobor@gmail.com
```

### Optional v2 integrations — only add after the integration is actually provisioned

```env
# Example placeholders; do not create fake values.
# SEARCH_PROVIDER_*=
# EMAIL_PROVIDER_*=
# ANALYTICS_PROVIDER_*=
# STORAGE_PROVIDER_*=
# AI_GATEWAY_*=
```

### Vercel system variables

Vercel also supplies system environment variables automatically (for example deployment/environment/region metadata). Do **not** duplicate or hard-code those in `.env` unless the application has a specific reason to expose them.

## Important Vercel env audit note

The available Vercel project connector can inspect the project/deployments but does not expose the project's secret environment-variable values or provide a direct env-list action in this session. Therefore this plan **does not invent a list of currently configured Vercel secrets**. The only application secret verified directly from the source is `GEMINI_API_KEY`.

Before implementation, run from the linked project:

```bash
vercel env ls
vercel env pull .env.local
```

Never commit `.env.local` or any decrypted secret file.

---

# 20. Vercel deployment plan

Current Vercel project:

```text
Project: tong
Project ID: prj_gHJEIj6yplXpIdWMr8JIbi7P0BWX
Team: relax's projects
Team ID: team_s2Y9RKJp5HQBjQ1P2Mu58xTP
Node: 24.x
Framework: Next.js
```

### Deployment setup

1. Keep GitHub → Vercel Git integration.
2. Set project root to `anamika-web` while the old structure remains.
3. During final migration, decide whether `anamika-web` should become repository root.
4. Add Production/Preview/Development environment variables separately.
5. Use Node 24.x consistently locally and on Vercel.
6. Enable preview deployments for v2 branches.
7. Test build before production promotion.
8. Use Vercel runtime logs for API errors and performance investigation.
9. Add cache strategy for public article pages.
10. Use ISR/revalidation for published content rather than client-side realtime listeners.

---

# 21. Caching strategy

### Public content

- published article pages: ISR/revalidation
- category pages: short revalidation
- homepage: short revalidation + on-demand invalidation after publish
- images: long-lived immutable caching when filenames are content-addressed

### Private content

- dashboard/editor/admin: dynamic/private
- no public caching of authenticated responses

### Publishing flow

```text
Draft → Review → Publish
             ↓
      revalidate article
             ↓
      revalidate category
             ↓
      revalidate homepage
```

---

# 22. Security checklist

Before v2 production launch:

- [ ] No plaintext passwords in Firestore
- [ ] No passwords returned to browser
- [ ] No admin ID whitelist as sole authorization
- [ ] Server-side role checks
- [ ] Firebase Security Rules reviewed
- [ ] Storage Rules reviewed
- [ ] AI routes authenticated/rate-limited where appropriate
- [ ] Input validation on every mutation
- [ ] Upload MIME/size validation
- [ ] No raw secrets in GitHub
- [ ] Remove visitor IP logging unless justified and documented
- [ ] Security headers configured
- [ ] Admin routes excluded from indexing
- [ ] Audit trail for sensitive admin actions

---

# 23. Performance checklist

Target v2:

- Server-render public content by default.
- Keep client components small and interactive only where necessary.
- Remove full-collection Firestore listeners from public pages.
- Use `next/image` for content images.
- Use responsive `sizes`.
- Prefer AVIF/WebP.
- Lazy-load news-card export code.
- Upload compressed media rather than sending base64 JSON to AI APIs.
- Avoid loading Framer Motion on pages that do not need animation.
- Remove unused default SVG assets.
- Measure Core Web Vitals after each major release.

---

# 24. Testing plan

Add:

```text
__tests__/
  validation.test.ts
  article-service.test.ts
  news-card.test.ts

playwright/
  public-home.spec.ts
  article.spec.ts
  login.spec.ts
  editor.spec.ts
  newscard.spec.ts
```

Minimum release gates:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

---

# 25. Migration sequence

## Phase 0 — Safety backup

- Freeze current `main` behavior.
- Create a v2 branch.
- Export/verify Firestore data before schema changes.
- Record current production deployment.

## Phase 1 — Foundation

Files first:

1. `package.json`
2. `tsconfig.json`
3. `eslint.config.mjs`
4. `next.config.ts`
5. `vercel.ts`
6. `app/lib/env.ts`
7. `app/lib/firebase/client.ts`
8. `app/lib/firebase/admin.ts`
9. `app/lib/auth.ts`
10. `app/lib/validation.ts`
11. `app/layout.tsx`
12. `app/globals.css`

## Phase 2 — Secure auth

1. `app/login/page.tsx`
2. `app/dashboard/page.tsx`
3. `components/AuthGuard.tsx`
4. `middleware.ts`
5. `app/register/page.tsx`
6. `app/profile/page.tsx`
7. Firebase Auth + Firestore Rules

## Phase 3 — Content model + public newsroom

1. `lib/db.ts`
2. article schemas
3. `/articles/[slug]`
4. `/category/[category]`
5. `/search`
6. `/trending`
7. public `/team`
8. `/about`
9. `sitemap.ts`
10. `robots.ts`
11. OG image routes

## Phase 4 — Internal editor

1. `/editor`
2. `/editor/[id]`
3. editor components
4. draft/review/publish workflow
5. activity/audit records

## Phase 5 — News Card Studio v2

Refactor the current `/newscard` into reusable components and add multiple export templates/sizes.

## Phase 6 — AI newsroom

Replace the single caption endpoint with structured AI services and validation.

## Phase 7 — Analytics/search/media

Add only after core content and auth are stable.

## Phase 8 — Production hardening

- performance audit
- security audit
- accessibility audit
- SEO audit
- mobile QA
- Vercel deployment verification

---

# 26. Definition of done for TongerKhobor v2

A v2 release is ready when:

- Public visitors can browse fast Bengali-first news pages.
- Articles have stable slugs and SEO metadata.
- Contributors can securely log in.
- Contributors can create/edit drafts.
- Editors can review/publish.
- Admin authorization is server-controlled.
- Passwords are never stored as plaintext.
- Media uploads are optimized.
- News cards can be generated from articles.
- AI assistance is clearly labeled as generated assistance.
- Published content revalidates public pages.
- Search/category/trending work without exposing private data.
- Vercel Production and Preview builds pass.
- No secret is committed to GitHub.
- Tests and build pass before release.

---

# 27. Recommended final repository structure

```text
Fahim-hash/tong/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── articles/[slug]/page.tsx
│   │   ├── category/[category]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── trending/page.tsx
│   │   ├── team/page.tsx
│   │   └── about/page.tsx
│   ├── (internal)/
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── editor/page.tsx
│   │   ├── editor/[id]/page.tsx
│   │   ├── newscard/page.tsx
│   │   ├── media/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── team/manage/page.tsx
│   ├── admin/page.tsx
│   ├── api/
│   ├── lib/
│   ├── layout.tsx
│   ├── globals.css
│   ├── sitemap.ts
│   ├── robots.ts
│   └── opengraph-image.tsx
├── components/
│   ├── ui/
│   ├── newsroom/
│   ├── editor/
│   ├── news-card/
│   ├── admin/
│   └── auth/
├── public/
├── tests/
├── playwright/
├── .env.example
├── next.config.ts
├── vercel.ts
├── package.json
└── README.md
```

## Migration note

Do **not** delete the existing `anamika-web/` implementation until the v2 path is tested and the production data migration is verified. The safest implementation strategy is to build v2 in a controlled branch/workspace, migrate data and routes incrementally, then switch the Vercel project root after validation.
