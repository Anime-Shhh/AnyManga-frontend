# AnyManga

AnyManga is a Next.js manga browser and reader backed by the separate [AnyManga Go API](https://github.com/Anime-Shhh/AnyManga-Backend).

See [Analytics and monitoring](ANALYTICS.md) for visitor traffic, page performance, Vercel usage, and private PC-backend counters.

## Run locally

Initialize the pinned Go backend and run it in one terminal.

```sh
git submodule update --init
cd backend
go run .
```

In a second terminal, from the frontend repository root:

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a separately hosted Go backend, set `MANGA_API_ORIGIN` before running or building Next.js.

## Deploy

The connected Vercel project builds the frontend and the pinned backend as services. It routes `/api/manga/*` to Go and the remaining routes to Next.js. Advance the `backend` submodule whenever deploying a newer backend revision.

To validate a deployment, call `/api/manga/health`, run a title search, open a named chapter, and navigate to the adjacent chapter. The local checks are `npm run lint`, `npm run build`, and `go test -race ./...` from the backend directory.

### Reader prefetch regression check

Build/start the app locally, then run `ANYMANGA_TEST_URL=http://localhost:3000 CHROME_EXECUTABLE=/path/to/chrome npm run test:reader`. On macOS the script defaults to installed Brave. The test mocks manga/image responses, verifies metadata warms in the background, confirms next-chapter images stay unloaded until near the end, and checks that Next/Previous reuse cached metadata. It requires a running frontend; it does not contact manga providers.

The [PC hosting guide](SELF_HOSTING.md) explains Cloudflare Tunnel, private Tailscale administration, and how to switch Vercel's API routing after your PC is ready.

`npm run test:images` checks direct-image failure, restricted proxy fallback, and one bounded metadata refresh before source switching. Both browser regressions also run in GitHub CI against a local production build.

`npm run test:controls` checks the shared navbar/reader visibility, desktop rail, phone tap-to-reveal disclosure menu, swipe handling, chapter links, and simulated server-down/recovery states on Home, Browse and chapter pages. It never stops the PC backend. Server health is checked every 30 seconds while those pages are visible, with a short timeout and a link to the backend self-hosting guide when unavailable.

## Progressive PDF downloads

Downloads now receive PDF bytes while the Go backend processes individual pages. The download panel shows received bytes, live transfer speed, elapsed time, and Cancel. The final PDF is saved only after its completion trailer arrives; interrupted streams show an error instead of silently saving a partial file. The final size is unknown during generation, so the progress indicator is indeterminate rather than a fabricated percentage/ETA. Browsers retain received chunks until the final Blob save; this change streams over the network, not directly into a user-selected disk file.

The existing ten-chapter/200-page/64 MiB source-image limits and two-job backend gate remain. Both tiers enforce a 128 MiB output bound. Download forwarding permits up to 295 seconds within Vercel's 300-second Fluid Compute function limit; normal metadata timeouts stay at 58 seconds.

`npm run test:download` exercises an actual paused HTTP origin through Next.js, checking progress before completion, successful save, cancellation propagation, truncated PDFs, HTTP failures, and mobile width. For a local production frontend, start it with `MANGA_API_ORIGIN=http://127.0.0.1:18080 npm run start -- -p 3002`, then run that test; it owns the temporary fixture origin and does not need a local Go server.

## Series pages

Manga pages use a static blurred-cover backdrop, formatted Markdown synopsis, expandable publisher notes and facts, and author/genre metadata. Chapter selection uses fixed numeric ranges (1–50, 51–100, etc.), including decimal entries with their parent chapter; ranges can contain more than 50 entries. Prologues and unnumbered extras have separate groups. Order can reverse without changing range boundaries; language changes reset selection.

Fine-pointer hover or keyboard focus for two seconds requests one first-page preview using `prefetch=0`. Only the first image loads, with existing delivery fallback and cache reuse. Leaving/scrolling/Escape cancels previews; Save-Data/2G and touch do not trigger them. `npm run test:manga` covers ranges, decimals, specials, volumes, descriptions, delayed/cancelled/cached previews, mobile layout and language reset.
