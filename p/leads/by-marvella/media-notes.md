# MARVELLA demo — media provenance and remaining work

- Public profile checked: `https://imginn.com/by_marvella/` and `https://www.pixnoy.com/profile/by_marvella/` on 2026-10-25.
- The page uses no Instagram embed, feed, API, or external script. Product information, filters, and the order-request builder are static/local HTML and JavaScript.
- The five product photos in `index.html` are hotlinked from Imginn's image proxy. Their signed URLs carry `oe` expiration values on 2026-10-29. They are **not stored in this repository** and should be replaced by approved local files before treating the demo as durable or publishing it for the brand.
- Attempts to fetch the binary media through both Imginn's download URL and Pixnoy's mirrored image URL failed in this sandbox (binary fetch HTTP 500; shell egress is blocked). Do not represent the current photo files as uploaded/self-hosted. Keep the CSS fallbacks until local files are supplied.
- The original public post URLs below are for provenance only; using their images commercially/publicly should be approved by the brand.

## Selected public posts used in the catalogue

| Post | Public mirror | Product information observed |
|---|---|---|
| Starry-sky handwoven silk crop | `https://imginn.com/p/DKzB7H9sjEC/` | Caption says handwoven silk, custom colour/size, limited; gives size 65–90 without a unit. No size range is reproduced on the site. |
| Red handmade look | `https://imginn.com/p/DegwQy-sjT2/` | Caption describes handmade made-to-measure crops and wrap skirts. No current stock/price asserted. |
| Chiffon wrap skirt + handmade top | `https://imginn.com/p/DeXCwKmse5v/` | Caption mentions adjustable wrap tie and sizes 36–42 plus larger sizes. Site labels this as one post's detail, not a universal size chart. |
| Three-piece crop/shrug/full skirt | `https://imginn.com/p/DePZrsasWxr/` | Caption describes a three-piece combination and separate items; sizes 36–44 plus larger sizes in that caption. Site does not generalize sizes. |
| Red-or-yellow crop + short wrap skirt | `https://imginn.com/p/DeuTujXMOlM/` | Caption asks “red or yellow?” and says colour/size customization. Current colour availability is not asserted. |

## Ordering details

- The mirrored profile says orders via DM/WhatsApp. No verified WhatsApp number was found; demo CTA currently opens `https://ig.me/m/by_marvella` and never sends automatically.
- Prices, current inventory, fabrics for every individual item, production times, shipping rates/destinations, payment, and return/exchange policy are not established. The page asks the seller to confirm them.
