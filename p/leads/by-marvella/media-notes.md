# MARVELLA demo — media provenance and hosting

## Local hosting status

- The storefront now serves all five catalogue covers and the hero image from this repository; no product photo depends on an Instagram, Imginn, Pixnoy, or other remote image CDN.
- Four Reel products have a **پخش ریل** control. Their original MP4 files are hosted locally and loaded only when a visitor opens playback, to avoid downloading video bytes on initial page load.
- All originals, optimized WebP derivatives, and the source manifest are preserved under `assets/media/`.
- The package was retrieved from the user-provided Google Drive folder `SitePine/Leads/MARVELLA/media/`. All 14 files match the supplied `manifest.csv` on SHA-256 and file size after transfer into this repository.
- WebP derivatives are used for page display; original JPEG and MP4 files remain unchanged under `assets/media/originals/`.

## Local files

- Web covers: `assets/media/web/<post_id>_01_web.webp`
- Original post media: `assets/media/originals/<post_id>/<post_id>_01_original.(jpg|mp4)`
- Package manifest and notes: `assets/media/manifest.csv`, `assets/media/README.txt`

## Selected public posts used in the catalogue

| Post | Product detail observed | Local media |
|---|---|---|
| [`DKzB7H9sjEC`](https://www.instagram.com/p/DKzB7H9sjEC/) | Handwoven crochet crop with satin skirt; the image contains the brand's own watermark. | Original JPEG + WebP cover |
| [`DegwQy-sjT2`](https://www.instagram.com/p/DegwQy-sjT2/) | Red handmade crop/skirt look. | Original Reel MP4 + original cover JPEG + WebP cover |
| [`DeXCwKmse5v`](https://www.instagram.com/p/DeXCwKmse5v/) | Handmade top and wrap-skirt look. | Original Reel MP4 + original cover JPEG + WebP cover |
| [`DePZrsasWxr`](https://www.instagram.com/p/DePZrsasWxr/) | Three-piece crop, shrug, and skirt look. | Original Reel MP4 + original cover JPEG + WebP cover |
| [`DeuTujXMOlM`](https://www.instagram.com/p/DeuTujXMOlM/) | Red/orange crop with short skirt; caption asks “red or yellow?”. | Original Reel MP4 + original cover JPEG + WebP cover |

## Ordering details and usage caution

- The public profile indicates orders by DM/WhatsApp. No verified WhatsApp number was found; the demo opens `https://ig.me/m/by_marvella` and never sends a message automatically.
- Prices, current inventory, production times, shipping rates/destinations, payment, and return/exchange policy are not established. The page asks the seller to confirm them.
- The media are from public brand posts, but public availability alone does not establish a commercial-use license. Obtain the brand's approval before using these assets in a production storefront or paid campaign.
