# CinemaForge — Product Requirements Document

## Original problem statement
> "Netflix that you actually create you own movies for pick from pre complied trending prompts and actress and actor attributes.. there is series options you can choose after making yourself a trailer or full length. Movie upgrades .. you can watch other people shows they have created and options to like and share rate ... coming soon. .. there is leaderjoard lists of the best rated most clicked most watch 25 45 1.5hr watches ... all in a net flix styled hub with the creation tabs view.  Archived .. search .. whats new .. for you ... gernes .. strange ai ... setting  profile .. connection .. upload download with strict rules .. terms conditons..  and a multi file type veiwrrr and decoder that will complie decode any type of file that is media .  Creations tab and evo lotions... where u can edit other people startups to a certain point. Forks - original- free to play -- all options from creator ..  dark sleek red crimson and violet black with ultra high quality def ... ad agents to assist the whole process in a main chat in centerr .. they will help the main engine create and fix broken files chains in the back ground to ensure a deploy happens"

## Architecture
- **Frontend**: React 19 + Tailwind + shadcn UI, Playfair Display / Outfit fonts, dark crimson/violet jewel theme.
- **Backend**: FastAPI + Motor (MongoDB) + JWT auth (bcrypt) + emergentintegrations LlmChat (Claude Sonnet 4.5).
- **Routing**: All API endpoints prefixed `/api`. Frontend uses `REACT_APP_BACKEND_URL`.
- **AI**: FORGE in-app director assistant runs on Anthropic `claude-sonnet-4-5-20250929` via Emergent Universal Key.

## User personas
1. **Forger** — creates new movies/series from prompts + actor cast.
2. **Evolver** — forks others' creations and remixes them.
3. **Viewer** — browses, watches, rates, climbs the leaderboards.

## Core requirements (static)
- Netflix-style discovery hub: For You / Browse (genres) / What's New / Coming Soon / Search / Archive / Leaderboard.
- Creator Studio: trending prompts, actor pool with attributes, length (trailer / 25m / 45m / 1.5h), format (movie / series).
- Watch other creators' works → like, rate (1–5), share, fork ("Evolutions").
- Multi-file viewer/decoder: image / video / audio / text / hex preview of first 512 bytes.
- Profile, Connections, Settings (Provider keys, Upload rules, Terms).
- Central AI chat dock (FORGE) — always reachable from sidebar.
- Color theme: deep violet-black (#0a050f) + crimson (#dc143c) + violet (#5a0b8a).

## What's been implemented (2026-02-22)
- ✅ Full backend (`/app/backend/server.py`): auth, prompts, actors, movie CRUD, like/rate/watch/fork/archive, leaderboard, AI chat, idempotent seed of 12 prompts + 8 actors + ~24 movies.
- ✅ Frontend pages: Home, Browse, Leaderboard, What's New, Coming Soon, Search, Archive, Create Studio, Creations & Forks, Movie Detail, Profile, Settings, File Decoder, Auth.
- ✅ Sidebar shell with AI chat dock (FORGE) powered by Claude Sonnet 4.5.
- ✅ Provider-keys UI (Sora 2 / Veo / Runway / ElevenLabs) ready for the user to drop in keys.
- ✅ 100% backend + frontend test coverage by testing subagent.

## What's been implemented (2026-02-22 — v1.1: Tip the Forger)
- ✅ Stripe checkout integration via emergentintegrations + sk_test_emergent.
- ✅ 4 server-defined tip packages: Spark $2, Ember $5, Blaze $10, Inferno $25.
- ✅ POST /api/tips/checkout (auth-gated, blocks self-tips, creates payment_transactions row).
- ✅ GET /api/tips/status/{session_id} with graceful Stripe-proxy fallback to DB (no 500s).
- ✅ POST /api/webhook/stripe handles webhook events; _credit_tip is idempotent.
- ✅ GET /api/movies/{id}/tips returns count + total.
- ✅ TipDialog component + Tip button on Movie Detail (visible only to non-owners).
- ✅ Frontend polls /tips/status after Stripe redirect; shows graceful "processing" toast on timeout.
- ✅ All 39/39 backend tests + 100% frontend tests pass.

## Backlog (prioritized)
### P0
- Hydrate `liked` and `rating` state on MovieDetail from server (currently starts fresh per visit).
- Gate Bootstrap `/api/seed` call behind a one-time localStorage flag.

### P1
- Real video rendering: wire Sora 2 / Veo / Runway when user provides keys.
- AI poster generation via Gemini Nano Banana for forged movies.
- Following / Connections (follow other forgers, feed of their new evolutions).
- Comments on movies.

### P2
- Server-side persistence of provider keys (encrypted) instead of client-side only.
- Watch-count dedupe per user.
- Mature-content gating wired to `adult` settings switch.
- "Edit other people's creations to a certain point" — collaborative editing window before lock-in.

## Next tasks
1. Plug in real video generation provider when user supplies key.
2. Ship liked/rating hydration on MovieDetail.
3. Wire `adult` toggle to filter Strange AI 18+.
