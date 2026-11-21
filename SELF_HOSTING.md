# Hosting the Go API on your PC

Current deployment target: native Windows service through Tailscale Funnel. See the implementation notes below.

Alternative setup:

```
Browser → Vercel frontend → HTTPS api.your-domain.com
                              ↓ Cloudflare Tunnel
                         Go on 127.0.0.1:8080
```

Use a named Cloudflare Tunnel for the public API. Use Tailscale for private administration of the PC. Ordinary Tailscale access and Tailscale Serve are private; visitors need Funnel to reach a Tailscale service publicly. Funnel is useful for demos, but currently has a ts.net hostname restriction and non-configurable bandwidth limits. An image-heavy public reader benefits from a stable domain and edge controls.

Neither Cloudflare Tunnel nor Funnel requires router port forwarding. Keep your router's inbound ports closed. The tunnel connector makes outbound connections and forwards only the configured API service. A tunnel does not protect application endpoints against expensive or abusive requests by itself.

## Set up the PC

1. Install Go 1.25.3+ and build the backend repository with `go build -o anymanga-api .` (Windows: `go build -o anymanga-api.exe .`).
2. Run it with `BIND_ADDR=127.0.0.1:8080`. That is already the default when `PORT` is unset. `BIND_ADDR` overrides `PORT`, so it also works if the PC has a global `PORT` variable. On PowerShell: `$env:BIND_ADDR='127.0.0.1:8080'; .\anymanga-api.exe`.
3. In Cloudflare, create a named tunnel, install its `cloudflared` connector as a background service using the dashboard's OS-specific instructions, and publish `api.your-domain.com` to `http://127.0.0.1:8080`. Use a domain you control. Do not enable public router access to 8080.
4. Run the Go binary as a separate low-privilege account/service with automatic restart. Give that account access only to the app directory. Keep Windows/Linux, Go and cloudflared updated. Keep the PC awake; power, network and upload speed affect availability.
5. Use Tailscale to administer the PC privately. Do not publish SSH, Remote Desktop, admin dashboards, or the tunnel credential file through the public hostname.
6. Add Cloudflare rate rules for the API, with stricter limits for `/api/manga/chapters` and `/chapters` (PDF generation). Apply rules to both root and `/api/manga` endpoint forms. Exempt normal image loading from overly aggressive bot challenges. CORS is not authentication. Enable HTTPS at the public hostname; HTTP between cloudflared and the Go process stays on loopback.

The backend bounds request bodies, concurrent requests, image downloads and upstream caches, and permits only recognized image hosts/paths with public IP destinations. These controls limit resource use; edge rate limits are still needed for public hosting. PDF generation is expensive and may warrant disabling public downloads or requiring a user account as traffic grows.

## Connect Vercel after the PC tunnel works

The current production configuration deploys Go alongside Next.js on Vercel. The existing `/api/manga/*` Vercel service rewrite takes precedence over `MANGA_API_ORIGIN`. Changing that variable alone will not move production traffic to your PC.

1. Verify `https://api.your-domain.com/health` returns HTTP 204 and a chapter request works.
2. Replace the frontend `vercel.json` with `deploy/vercel.self-hosted.json` from this repository. This removes the hosted Go service route and lets Next.js proxy the allowlisted API endpoints.
3. Set the frontend's Vercel environment variable `MANGA_API_ORIGIN=https://api.your-domain.com` and redeploy. Next.js rewrites use this value at build time. Include no trailing `/api/manga` path.
4. Verify `/api/manga/chapterimages` and `/api/manga/image` through the frontend domain, including Next and Previous navigation and PDF downloads. The browser continues using same-origin `/api/manga/*`, so cross-origin CORS access is unnecessary.

Keep the current `vercel.json` until you complete the tunnel setup. To roll back, restore it, remove `MANGA_API_ORIGIN`, and redeploy. No router ports or tunnel configuration were changed as part of this code update.

References: [Cloudflare Tunnel concepts](https://developers.cloudflare.com/tunnel/concepts/), [publish an application](https://developers.cloudflare.com/tunnel/get-started/), [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel), [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve).


## Native Windows deployment (no PC restart)

The PC runtime is a Windows amd64 Go executable registered as `AnyMangaBackend` under LocalService. No Docker, WSL or compiler is needed on Windows. The backend repository's `DEPLOYMENT.md` describes versioned release installation, restricted files, application-only recovery and rollback. Windows, WSL, Tailscale, networking, SSH, Codex, and the Windows login session must remain running throughout setup.

Production requests remain same-origin at `/api/manga/*`. A narrow server-only Next.js handler forwards allowlisted requests to `MANGA_API_ORIGIN` and injects `MANGA_API_KEY`. Both variables are server-only Vercel settings. Never use a NEXT_PUBLIC variable for the key. The current host target is `https://animeshh-pc.tailda0b8a.ts.net`, forwarding to Windows loopback port 8080 through an authorized persistent Funnel.

Replace the Vercel Go-service route only when the Windows backend is healthy and reachable. Health returns 204 with `X-AnyManga-Backend-ID`. Match a production request's `X-AnyManga-Request-ID` against the PC log to prove cutover. Keep the previous Vercel deployment as a rollback target and do not silently fail over when the PC is offline.

MangaRead images passed real browser embedding tests and load directly with no-referrer, reducing home upload traffic. Direct images have a same-origin restricted proxy fallback. MangaPill and WeebCentral CDNs were blocked by browser opaque-response protection, so those sources and MangaDex remain proxied. Failed fallback images trigger one metadata refresh before the existing source-switch action. The first three next-chapter images still preload only near the end.

`/admin/status` is available only with backend authentication and is not forwarded to browsers. It exposes request/cache/proxy counters for operational checks. GitHub Actions run frontend checks and a 15-minute production-origin health check. Native Windows artifacts are built by backend CI; deployment remains controlled. Future Windows boot recovery is configured but not tested during remote setup.
