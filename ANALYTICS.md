# Traffic, performance, and backend monitoring

The root layout includes the official `@vercel/analytics/next` and `@vercel/speed-insights/next` components through `SiteAnalytics`. Web Analytics is enabled for the existing Vercel project. Speed Insights uses its free tier; no Plus upgrade is required for collection.

## Where to view it

Sign in to the Vercel account that owns AnyManga, then open the project:

- [Web Analytics](https://vercel.com/animeshjadhav05-gmailcoms-projects/anymanga/analytics): visitors, page views, top pages, referrers, and available country/device/browser breakdowns.
- [Speed Insights](https://vercel.com/animeshjadhav05-gmailcoms-projects/anymanga/speed-insights): real-user page performance. The free tier currently provides a Real Experience Score and limited route/path views; detailed individual Core Web Vitals/breakdowns require Plus. This setup does not purchase Plus.
- [Project dashboard](https://vercel.com/animeshjadhav05-gmailcoms-projects/anymanga): use Observability and Logs for the frontend/API-forwarder request volume, durations, and errors available on the current plan. Team Usage shows hosting resource/bandwidth usage.

Select Production and the desired date range. Collection starts after deployment; it does not reconstruct earlier traffic. Data can take a few minutes to appear. Browser blockers may prevent collection, so analytics is not a complete request ledger. Development uses the SDK's development mode. No custom behavioral events, session replay, or application user identities are added.

The `beforeSend` hooks remove query strings and fragments from reported page URLs, including `/search?q=...`. Page paths remain visible in reports. The scripts send telemetry to Vercel rather than the home Go service.

Official references: [Web Analytics setup](https://vercel.com/docs/analytics/quickstart), [Speed Insights setup](https://vercel.com/docs/speed-insights/quickstart), [Web Analytics limits](https://vercel.com/docs/analytics/limits-and-pricing), [Speed Insights tiers](https://vercel.com/docs/speed-insights/limits-and-pricing).

## PC load is separate

Vercel's CPU/function usage describes Vercel, not the Windows PC. View the PC's Task Manager (Performance, or the Details entry for `anymanga-api-windows-amd64.exe`) for CPU and memory. This analytics change does not require restarting the PC or its backend.

The Go backend already records per-request status, bytes, and duration in `C:\ProgramData\AnyManga\logs\backend.log` and exposes authenticated `/admin/status` counters: requests, errors, response bytes, cumulative request duration, cache hits/misses/shared loads, and image proxy bytes/errors. Counters reset when that process restarts. They do not provide historical CPU/RAM charts or latency percentiles.

`/admin/status` intentionally remains absent from the browser forwarding allowlist. An administrator with access to the protected key can inspect it locally on the PC using PowerShell:

```powershell
$backendKey = (Get-Content -LiteralPath 'C:\ProgramData\AnyManga\secrets\api-key.txt' -Raw).Trim()
try {
    Invoke-RestMethod 'http://127.0.0.1:8080/admin/status' -Headers @{ Authorization = "Bearer $backendKey" } | ConvertTo-Json -Depth 5
} finally {
    Remove-Variable backendKey -ErrorAction SilentlyContinue
}
```

Do not paste the key into the browser or publish it. A separate authenticated monitoring dashboard would be needed for remote historical PC CPU/RAM charts; that is not part of these frontend traffic analytics.
