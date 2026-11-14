# LuxuryShop: Brand

**LuxuryShop** is a premium activewear and fashion store: training and everyday pieces made from merino, cashmere, silk blends and technical knits, plus running, training and lifestyle shoes. It is an invented brand for the capstone *E-Commerce Intelligent Analytics & Personalization Suite*.

- **Tagline:** Move in luxury.
- **Departments:** Men, Women, Shoes.
- **Price level:** premium, about $80 (a beanie) to $1,450 (a leather bomber).

## Voice

Calm, confident and short. Talk about fabric, fit and feel, not hype. No exclamation marks in product copy, no "UA" or other real brand names.

> A featherweight merino-silk tee that breathes on the move and drapes like tailoring off duty.

## Look

| | |
|---|---|
| Wordmark | `LUXURY•SHOP` in Bebas Neue, black on white or white on black (`apps/api/src/main/resources/static/img/logo.svg`) |
| Mark | `LS` in a black rounded square (favicon, admin sidebar) |
| Colours | White `#ffffff`, Ink `#101010`, Mist `#f4f4f4`, Crimson accent `#dc143c` (active tab, badges, "NEW") |
| Type | **Bebas Neue** for headings, **Outfit** for text (both self-hosted, SIL Open Font License) |
| Shape | No borders; soft grey panels and `rounded-md` / `rounded-lg` corners |
| Feedback | One toast style: white card at the top right, coloured icon, Bebas Neue text, a 3-second progress bar |

The layout follows the owner's earlier Under-Armour practice project: black top strip, white navbar with category tabs, full-width hero, "New Arrivals" tiles, product grids, a product page with Related Products, and a black footer. Only the layout ideas were reused; no Under Armour names, logos or photos.

## Photos

Products start with a blank photo box and get real photos from the admin. Use photos you own or that are free to use, with **no visible brand logos**. Page photos (hero, tiles) go in `apps/api/src/main/resources/static/images/` (see its README). Sources are listed in [`image-credits.md`](image-credits.md).
