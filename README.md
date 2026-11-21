# AnyManga

AnyManga is a Next.js manga browser and reader backed by the separate [AnyManga Go API](https://github.com/Anime-Shhh/AnyManga-Backend).

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
