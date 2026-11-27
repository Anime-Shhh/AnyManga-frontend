# Discovery on /read

The Go backend's authenticated `/discovery` endpoint supplies one shared response
for the spotlight and Popular across sources, Latest chapter releases and Newly
added series carousels. Manhwa and Manhua keep their existing category feeds.

See the [backend discovery audit](https://github.com/Anime-Shhh/AnyManga-Backend/blob/main/DISCOVERY.md)
for tested endpoints, available metrics, ranking rules, caching and source limitations.

`useDiscovery` refreshes every five minutes while visible and checks again when a
stale tab becomes visible. Requests are bounded, non-overlapping and cancelled on
unmount. A failed refresh retains existing cards and offers retry. The source panel
reports unavailable feeds and recent saved picks. New catalog entries are labeled
separately from chapter releases. Per-visit spotlight variation selects within the
backend's actual ranked/recent candidate pool; it does not track personal activity.

The existing hero design, ten-second rotation, hover/focus pause, explicit controls,
reduced-motion behavior and cover fallbacks are retained. Spotlight summaries come
from discovery metadata, eliminating full manga-page/chapter-index requests per
slide. All images still use MangaImage and the existing delivery policy.

Deploy the backend release containing `/discovery` before this frontend. To revert
to a backend predating this endpoint, revert the frontend first. No Vercel variable
or secret changes are required. Run `npm run test:discovery` against the built local
frontend alongside the existing reader, image, controls, PDF and manga-page tests.
