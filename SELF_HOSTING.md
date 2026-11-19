# Hosting the Go API on your PC

Recommended setup:

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
