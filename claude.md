# LuxuryShop — Capstone Project

## Who I am and how to work with me
- I'm Yussuf, a software engineering student (Aptech ACCP, Semester 4) in Nairobi.
- I am learning as we build, especially the **Java backend** and the **Python ML**. Explain like I'm a kid: short sentences, an analogy for every new idea, then the command or code.
- Before each step: say in 1–2 lines what it does and why, then do it. After each phase: give a short recap of what I learned.
- Ask before anything destructive (deleting folders, force-pushing, rewriting git history, dropping databases).
- Use **pnpm**, never npm or yarn, for JavaScript tools.
- My machine: Windows, PowerShell, VS Code.

## The game: a new world + two inventory chests 🎮
- **New world (this repo):** `C:\Users\USER\OneDrive\Documents\School studies\Projects\CapstoneProject`. Everything is built here.
- **Both chests are READ-ONLY. Never edit, move or delete anything in them. Only copy ideas and code out.**
- **Chest #1: Vela Noire** `C:\Users\USER\OneDrive\Documents\My projects\VELA NOIRE` (Next.js shop + admin, Node backend). Now only a reference for the **admin layout** (sidebar + top bar) and shadcn-style components. Its brand, products and photos are no longer used.
- **Chest #2: Under-Armour** `C:\Users\USER\Downloads\Under-Armour-main\Under-Armour-main` (my old React 18 + Vite practice project). Source of the **shop look** (top strip, navbar, hero, New Arrivals tiles, product grids, Categories page, Products page, RelatedProduct row, Login, Profile, LikedItems, footer, the toast style) and the **catalogue shape** (`src/assets/assets.js`, `pages.js`: category, subCategory, sizes, bestseller).
  - ⚠️ Never copy its Under Armour names, logos, photos, athlete pictures or `curry.mp4`. Generic icons and the payment card logos are fine.
  - ⚠️ Its `Context/ShopContext.jsx` contains real emails and passwords. Never copy them anywhere.

## What we are building
**LuxuryShop**: a premium activewear and fashion store (an invented brand). Departments **Men, Women, Shoes**. Tagline "Move in luxury". Brand notes: `docs/brand.md`.

The school capstone is called **"E-Commerce Intelligent Analytics & Personalization Suite"**. LuxuryShop is the store we use for it. Deadline: **13 Dec 2026**, but I want it done in **one week**.

### The restaurant analogy (use it to explain things)
| Restaurant | Project |
|---|---|
| Dining room for guests | the shop pages: `apps/api` → `/` (Thymeleaf templates in `templates/shop`) |
| Manager's office | the admin pages: `apps/api` → `/admin` (`templates/admin`) |
| Kitchen that does the real work | `apps/api` services: **Java Spring Boot** |
| Waiters who plate the food | page controllers (`web/pages`): fetch data, fill a Thymeleaf template |
| Take-away hatch | the REST API `/api/**` (JSON + JWT), used by Python, tests and Swagger |
| Receipt book | **MySQL** — users, orders, cart, transactions |
| Menu album | **MongoDB** — products, reviews, clickstream logs |
| Smart waiter who knows your taste and notices regulars who stopped coming | `ml/` — **Python FastAPI** for recommendations + churn |

Everything runs from **one Spring Boot app on http://localhost:8080**. Java asks Python for AI answers.

## School requirements (the rules we must follow)
- **Java 17+ Spring Boot**, clean MVC structure. **Pages rendered by Spring Boot with Thymeleaf** ✅ (done in the rebrand).
- **Python** with scikit-learn, pandas, numpy; FastAPI exposing `/predict-churn` and `/get-recommendations`. Models saved as `.pkl`.
- **MySQL** for users, credentials, orders and transactions. **MongoDB** for products, reviews and clickstream.
- Password hashing, JWT or session login, role-based access (customer vs admin). We have both: session login (pages) and JWT (`/api`).
- **Customer portal:** register/login, profile (demographics, tenure, devices, preferred categories), browse by category/price/tags, product detail (specs, stock, ratings), "Recommended For You" carousel, similar items, cart, simulated checkout, order history.
- **Admin portal:** dashboard (total sales, active users, churn rate, top categories), customer list with churn risk High/Medium/Low, filter at-risk customers and send a retention discount, inventory management, model metrics (Accuracy, Precision, Recall, ROC-AUC for churn; Precision@K or RMSE for recommendations).
- **Deliverables:** source code, SQL dump + MongoDB schemas, report (ER, use case and sequence diagrams, algorithm rationale, test cases), live demo: customer logs in and sees recommendations, then admin sees churn predictions.

## The catalogue (from the Under-Armour structure, made premium)
| Category | Subcategories |
|---|---|
| Men | Topwear, Bottomwear, Outerwear, Accessories |
| Women | Topwear, Bottomwear, Outerwear, Accessories |
| Shoes | Running, Training, Lifestyle |

- 72 invented products (28 Men, 28 Women, 16 Shoes), $80–$1,450. No real brand names or trademarks (no "UA", HeatGear, HOVR, ColdGear, Charged, Curry…).
- Product fields: `category`, `subCategory`, `isNew` (the "New" tab), `isBestSeller`, `sizes[]` (empty = one size), `attributes{}` (Material, Fit…), `variants[]` (one per colour: SKU, hex, stock), `images[]`.
- **Stock is per colour, not per size.** The size is saved on the cart and order line. (For the examiner: "size is recorded on each order line; stock is tracked per colour variant to keep checkout simple.")
- **Gone:** collections, seasons, seasonal lines, abaya/perfume fields, brand models, flash sales, Kids.
- Products start **without photos** (blank boxes). Yussuf adds product photos from the admin and page photos in `static/images/`.

## Repo structure
```
CapstoneProject/
├── apps/api/        Spring Boot app → http://localhost:8080
│   ├── src/main/java/com/luxuryshop/api/
│   │   ├── web/pages/shop, web/pages/admin   page controllers (Thymeleaf)
│   │   ├── web/actions                       small JSON calls from the pages (/web/**)
│   │   ├── controller                        REST API (/api/**)
│   │   └── service, repository, model, dto, security, exception, config
│   ├── src/main/resources/templates/         shop/, admin/, fragments/, error.html
│   ├── src/main/resources/static/            css/app.css (built), js/, fonts/, img/, images/
│   └── styles/app.css                        Tailwind source
├── ml/              Python FastAPI + notebooks → http://localhost:8000 (Phase 6)
├── database/        MySQL scripts + MongoDB schemas + seed data
├── docs/            brand.md, image-credits.md, diagrams, report
└── package.json     root scripts (Tailwind CLI + concurrently only)
```

## The phases
| # | Phase | Restaurant version | Depends on |
|---|---|---|---|
| 1 | **The building** | Fresh monorepo, push to GitHub | — |
| 2 | **The storage** | Install MySQL + MongoDB; tables + collections | 1 |
| 3 | **The kitchen** | Spring Boot: auth (BCrypt + JWT), products, cart, orders, admin endpoints | 2 |
| 4 | **The wiring** | Shop + admin pages talk to the kitchen; product, cart, checkout, order and admin pages | 3 |
| 5 | **Practice guests** | Generate fake customers, orders and clicks on the Men/Women/Shoes catalogue; log clickstream to MongoDB | 2, 3 |
| 6 | **The smart waiter** | Python: churn model + recommender, FastAPI endpoints | 5 |
| 7 | **Waiter meets kitchen** | Java calls Python; recommendations in shop; churn page, charts and metrics in admin | 3, 6 |
| 8 | **Opening night** | Test the demo, export databases, report + diagrams, submit | all |

## Current status
- [x] Phase 1 — The building (done 2026-11-10)
- [x] Phase 2 — The storage (done 2026-11-12)
- [x] Phase 3 — The kitchen (done 2026-11-12)
- [x] Phase 4 — The wiring (done 2026-11-12)
- [x] Rebrand to LuxuryShop + pages moved to Thymeleaf (done 2026-11-14)
- [ ] Phase 5 — Practice guests  ← **we are here**
- [ ] Phase 6 — The smart waiter
- [ ] Phase 7 — Waiter meets kitchen
- [ ] Phase 8 — Opening night

Update this checklist at the end of each phase.

## Build notes (things later phases need to know)
- **Run:** `pnpm install` once, then `pnpm dev` (Tailwind watcher + Spring Boot with the `dev` profile, which reads templates and static files straight from `src/`, so edits show on refresh). `pnpm dev:api` = Java only. `pnpm css:build` rebuilds the committed CSS. `pnpm test:api` runs the tests.
- **Versions:** Spring Boot 4.1 on **JDK 17**, Thymeleaf 3.1, Tailwind v4 (CLI), pnpm 11, Node 22. jjwt 0.13, springdoc 3.x. MongoDB properties are `spring.mongodb.*`; MockMvc lives in `org.springframework.boot.webmvc.test.autoconfigure`.
- **Security = three doors** (`security/SecurityConfig.java`):
  1. `/api/**` + Swagger: stateless **JWT** (`Authorization: Bearer`), no CSRF. Python and the tests use it.
  2. `/admin/**`: form login at `/admin/login`, **ADMIN only** (a customer gets "This account doesn't have admin access…"), session + **CSRF**.
  3. everything else (shop): form login at `/login`; browsing is public, `/cart`, `/checkout`, `/account`, `/liked`, `/web/**` need a login; session + CSRF.
  - Shop and admin logins are kept under **different session keys** (`WebSessions`), so one browser can be signed in to both separately.
  - Forms get the CSRF token automatically (`th:action`); fetch calls send it from the `<meta name="_csrf">` tag (`static/js/app.js` → `send()`).
  - The principal is always `AuthUser(id, email, role)`, for both JWT and sessions.
- **Thymeleaf 3.1 gotchas:**
  - `th:replace` runs before `th:each` / `th:if` on the same tag: wrap it, e.g. `<th:block th:each="p : ${list}"><article th:replace="~{fragments/shop :: card(${p}, ${likedIds})}"></article></th:block>`.
  - Bean calls (`${@fmt...}`) are **not allowed** inside `th:href`/`th:src` or fragment parameters: compute them first with `th:with="u=${@fmt.withParam('size', z)}" th:href="${u}"`.
  - No page data inside `onclick`; use `data-*` attributes and JS.
  - No apostrophes inside `|...|` literals.
- **Shared template pieces:** `fragments/layout.html` (head, wordmark, toast + loading bar, pager), `fragments/shop.html` (header, footer, product card, empty state), `fragments/admin.html` (the admin frame: top bar + sidebar, page header, empty state), `fragments/icons.html` (line icons). `${@fmt...}` (`web/Fmt.java`) formats money, dates, labels and status colours.
- **Toasts:** one Under-Armour style toast for the whole app: `toast("Added to bag")`, `toast(msg, "error")`, `toast(msg, "info")` (`static/js/toast.js`). After a redirect, controllers set `flash.addFlashAttribute("toast", "...")` (+ `toastType`).
- **Loading, empty and error states:** a crimson loading bar on every navigation, spinners in busy buttons, an empty state on every list, a friendly `error.html` (404/403/500), and `WebErrorAdvice` turns service errors into that page for the web (the API keeps its JSON).
- **Clickstream:** the product page logs VIEW and `/search` logs SEARCH (`ClickstreamService.logPageEvent`); cart, wishlist and checkout log ADD_TO_CART, REMOVE_FROM_CART, WISHLIST and PURCHASE. Web clicks use `web-<sessionId>` as the visit id. The browser also gets a stable `ls_device` cookie (`DeviceCookieFilter`) so logins record devices.
- **Photos:** the admin uploads product photos (Products → product → Photos). They are saved in `apps/api/uploads/` (git-ignored, served at `/uploads/**`); the first is the cover, the second shows on hover. Page photos (hero, tiles, feature, profile) are dropped into `static/images/` with the names in its README; until then dark/grey boxes show. Record every photo source in `docs/image-credits.md`.
- **Phase 7 slots:** the home page has a comment where "Recommended For You" goes (a Swiper row like Related Products); `/admin/churn` and `/admin/models` show "Activates in Phase 7"; the dashboard churn card and the customer churn column show placeholders. REST placeholders: `GET /api/admin/churn`, `/retention-offers`, `/model-metrics` return `[]`. Checkout can already redeem a `retention_offers` code.
- **Testing tip:** to test without touching Yussuf's server on 8080, run the jar from `apps/api` with `--spring.profiles.active=dev --server.port=8090`. Drive pages with headless Edge over CDP (scripts in the scratchpad). `WebPagesTests` and `ApiFlowTests` clean up after themselves.
- **Footer links and newsletter** are placeholders (`href="#"`, newsletter shows a "coming soon" toast).
- **Python is not installed yet** (only the Microsoft Store alias). Install Python 3.12 before Phase 6.
- **Databases:** see `database/README.md` (install, create, seed, reset, demo logins) and `docs/diagrams/er-diagram.md`.
  - MySQL 9.3 runs as service `MySQL93` on port 3306. `mysql.exe` is **not on PATH**: it's at `C:\Program Files\MySQL\MySQL Server 9.3\bin`. The app connects as `luxury_app` to `luxuryshop` (password in `.env`), never as root. `database\mysql\reset.ps1` rebuilds the tables and seed.
  - MongoDB 8.3 runs as service `MongoDB` on 27017, database `luxuryshop`. mongosh is at `%LOCALAPPDATA%\Programs\mongosh\mongosh.exe`. In PowerShell, run mongosh with `--file script.js`, not `--eval`.
  - Product `_id`s are fixed (`6750a1000000000000000` + 3-digit code: 1xx Men, 2xx Women, 3xx Shoes). SKUs look like `LS-W-BOT-08-ONY`. MySQL stores product ids as `CHAR(24)`. There's no foreign key across the two databases, so **Java checks** product, SKU, size and stock before cart and order writes.
  - Money: MySQL `DECIMAL(10,2)`, Mongo `Decimal128`. In Java use `BigDecimal`, never `double`.
  - Seed users: 1 admin, 2 Amira, 3 Layla (`@luxuryshop.local`, BCrypt `$2a$10$`). 5 sample orders. The demo passwords are in `database/README.md`.
  - The old `vela_noire` databases and `vela_app` user may still exist; drop them only after asking Yussuf.
- **REST API details:** every endpoint is in `apps/api/README.md`; Swagger at http://localhost:8080/swagger-ui.html. Errors are always `{ error, message, status }`. Don't put `@Validated` on controllers (it turns URL validation errors into 500s). The checkout pattern: take stock in MongoDB (atomic `$inc` with an "enough left" condition), write MySQL in `OrderWriter` (`@Transactional`), give stock back if MySQL fails; admin cancel/refund returns stock after the commit.
- **Admin look:** the old Vela Noire layout (full-width top bar with sidebar toggle, page title, search and bell; sidebar under it with the LS mark, menu and account) in LuxuryShop colours. Menu: Dashboard, Products (All · Add), Inventory, Orders, Customers, Churn Risk, Model Health. Yussuf's taste: **no borders**, `rounded-lg`, no breadcrumb, no create button in the top bar, scrollbars use `.scrollbar-pill`.

## Rules
- Never commit `.env` files, secrets, `node_modules`, `target/`, `.venv`, `uploads/` or large data files.
- Small commits with clear messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Keep the LuxuryShop look (Under-Armour layout, white / #101010 / crimson, Bebas Neue + Outfit). Don't redesign what works without asking.
- Skip anything not needed for the spec or the demo (real payments, emails, mobile app, flash sales).
