# Vela Noire — Capstone Project

## Who I am and how to work with me
- I'm Yussuf, a software engineering student (Aptech ACCP, Semester 4) in Nairobi.
- I am learning as we build, especially the **Java backend** and the **Python ML**. Explain like I'm a kid: short sentences, an analogy for every new idea, then the command or code.
- Before each step: say in 1–2 lines what it does and why, then do it. After each phase: give a short recap of what I learned.
- Ask before anything destructive (deleting folders, force-pushing, rewriting git history, dropping databases).
- Use **pnpm**, never npm or yarn, for JavaScript apps.
- My machine: Windows, PowerShell, VS Code.

## The game: a new world + an inventory chest 🎮
- **New world (this repo):** `C:\Users\USER\OneDrive\Documents\School studies\Projects\CapstoneProject`. A clean slate. Everything is built here.
- **Inventory chest (READ-ONLY):** `C:\Users\USER\OneDrive\Documents\My projects\VELA NOIRE`. My personal Vela Noire project, with folders `frontend/` (shop), `admin/` and `backend/` (Node/Express).
  - **Never edit, move or delete anything in the inventory.** Only **copy** items out of it.
  - Take what we need: logo, images, fonts, colors and theme (`globals.css`, `global.scss`), shadcn `ui/` components, layouts (Navbar, Footer, sidebar), tables, forms, toasts, page designs, brand text.
  - Upgrade items as we copy them (cleaner code, consistent toasts with sonner, loading states). Don't copy junk (old notes, unused files, `node_modules`, `.next`, package-lock files).
  - `backend/` is the **recipe book**: `prisma/schema.prisma` and `src/routes/*.js` show the data models and endpoints to rebuild in Java.
  - `admin/brandDetails.md` is the **brand bible**. Copy it to `docs/`.

## What we are building
**Vela Noire** is my luxury modest-fashion brand: "Middle Eastern Louis Vuitton". Abayas, perfume, handbags, bracelets, shayla, shoes and accessories. Tagline: "Luxury Reimagined for Her". Collections (we use only these **4**):
1. **Seasonal**: Desert Bloom (summer), Velvet Moon (winter), Amber Luxe (autumn), Floral Grace (spring)
2. **Modern Muse**
3. **Traditions Reimagined**
4. **Simplicity Speaks**

Rare Collectibles, Lux Infinity and Infinity Bride are **dropped**. Use only the 4 above in the seed data (Phase 2 and later).

The school capstone is called **"E-Commerce Intelligent Analytics & Personalization Suite"**. Vela Noire is the store we use for it. Deadline: **13 Dec 2026**, but I want it done in **one week**.

### The restaurant analogy (use it to explain things)
| Restaurant | Project |
|---|---|
| Dining room for guests | `apps/shop` — customer website (Next.js) |
| Manager's office | `apps/admin` — admin website (Next.js) |
| Kitchen that does the real work | `apps/api` — **Java Spring Boot** backend |
| Receipt book | **MySQL** — users, orders, cart, transactions |
| Menu album | **MongoDB** — products, reviews, clickstream logs |
| Smart waiter who knows your taste and notices regulars who stopped coming | `ml/` — **Python FastAPI** for recommendations + churn |

Guests never enter the kitchen. Shop/Admin → Java → databases. Java asks Python for AI answers.

## School requirements (the rules we must follow)
- **Java 17+ Spring Boot**, clean MVC structure.
- **Python** with scikit-learn, pandas, numpy; FastAPI exposing `/predict-churn` and `/get-recommendations`. Models saved as `.pkl`.
- **MySQL** for users, credentials, orders and transactions. **MongoDB** for products, reviews and clickstream.
- Password hashing, JWT or session login, role-based access (customer vs admin).
- **Customer portal:** register/login, profile (demographics, tenure, devices, preferred categories), browse by category/price/tags, product detail (specs, stock, ratings), "Recommended For You" carousel, similar items, cart, simulated checkout, order history.
- **Admin portal:** dashboard (total sales, active users, churn rate, top categories), customer list with churn risk High/Medium/Low, filter at-risk customers and send a retention discount, inventory management, model metrics (Accuracy, Precision, Recall, ROC-AUC for churn; Precision@K or RMSE for recommendations).
- **Deliverables:** source code, SQL dump + MongoDB schemas, report (ER, use case and sequence diagrams, algorithm rationale, test cases), live demo: customer logs in and sees recommendations, then admin sees churn predictions.
- ⚠️ The spec says pages should be Thymeleaf/JSP rendered by Spring Boot. We are using Next.js UIs calling Spring Boot as a REST API. I'm confirming with my lecturer that this is allowed.

## Inventory list: what I have vs what I need
**Key:** 📦 Copy from inventory · ⬆️ Copy and upgrade · 🔨 Craft new

| Item | In my inventory | Needed for school | Action |
|---|---|---|---|
| Logo, icons, images | ✅ `frontend/public`, `src/app/icon.svg` | Brand look | 📦 Copy |
| Fonts, colors, theme | ✅ `globals.css`, `global.scss` | Brand look | 📦 Copy |
| shadcn UI parts (button, input, card, table, dialog, sidebar…) | ✅ both apps' `components/ui` | Building blocks | 📦 Copy |
| Toasts / notifications | ✅ sonner + `useToast`, `toastStore` | Feedback messages | ⬆️ One clean toast style everywhere |
| Shop layout (Navbar, Footer, Banner, Loader) | ✅ `frontend/src/components/shared` | Customer site | ⬆️ Copy and upgrade |
| Home page (Hero, collections, models) | ✅ `frontend/src/components/home` | Customer site | ⬆️ Copy and upgrade |
| Login form | ✅ both apps | Register/login | ⬆️ Rewire to Java JWT |
| Account page (MyVn) | ✅ basic | Profile with demographics, devices, preferred categories | ⬆️ Extend |
| Category pages (gifts, men) | ✅ basic | Browse by category, price, tags + search | ⬆️ Extend |
| Product page | ❌ | Specs, stock, ratings, similar items | 🔨 Craft |
| Cart page | ❌ (backend only) | Add/remove items | 🔨 Craft |
| Checkout + order history | ❌ | Simulated checkout, saved orders | 🔨 Craft |
| Reviews / ratings | ❌ | Ratings on products | 🔨 Craft |
| "Recommended For You" carousel | ❌ | Personalised feed | 🔨 Craft |
| Admin layout (sidebar, header, nav) | ✅ `admin/src/components` | Admin site | 📦 Copy |
| Admin products, variants, inventory, collections | ✅ | Inventory management | ⬆️ Rewire to Java |
| Admin tables | ✅ `product-table.jsx`, `ui/table.jsx` | Lists everywhere | 📦 Copy |
| Admin dashboard | ✅ basic | Sales, active users, churn rate, top categories | ⬆️ Add charts |
| Churn page | ❌ | Customers with High/Medium/Low risk + send discount | 🔨 Craft |
| Model health page | ❌ | Accuracy, precision, recall, ROC-AUC, Precision@K | 🔨 Craft |
| Data models | ✅ Prisma schema (PostgreSQL) | MySQL + MongoDB | ⬆️ Translate |
| Backend | ✅ Node/Express | **Java Spring Boot** | 🔨 Craft (use recipe book) |
| Login security | ✅ better-auth | BCrypt + JWT, roles | 🔨 Craft in Java |
| Image uploads | ✅ Cloudinary | Not required | 📦 Keep |
| Click tracking | ⚠️ recently viewed/searched only | Full clickstream in MongoDB | 🔨 Craft |
| Fake data | ⚠️ small seed file | Lots of customers, orders, clicks | 🔨 Craft |
| Python AI | ❌ | Churn + recommender + FastAPI | 🔨 Craft |
| Report + diagrams | ❌ | ER, use case, sequence, tests | 🔨 Craft |

## Target structure (this repo)
```
CapstoneProject/
├── apps/
│   ├── shop/        Next.js customer site      → http://localhost:3000
│   ├── admin/       Next.js admin site         → http://localhost:3001
│   └── api/         Java Spring Boot (Maven)   → http://localhost:8080
├── ml/              Python FastAPI + notebooks → http://localhost:8000
├── database/        MySQL scripts + MongoDB schemas + seed data
├── docs/            report, diagrams, brandDetails.md
├── pnpm-workspace.yaml   (only shop + admin; Java uses Maven, Python uses pip)
└── package.json          root scripts
```

## The phases
| # | Phase | Restaurant version | Depends on |
|---|---|---|---|
| 1 | **The building** | Fresh monorepo, fresh shop + admin apps dressed in the Vela Noire look from the inventory, push to GitHub | — |
| 2 | **The storage** | Install MySQL + MongoDB; translate the Prisma schema into MySQL tables + Mongo collections | 1 |
| 3 | **The kitchen** | Spring Boot: auth (BCrypt + JWT), products, cart, orders, admin endpoints | 2 |
| 4 | **The wiring** | Shop + admin talk to Java; craft product, cart, checkout and order pages; bring in admin product pages | 3 |
| 5 | **Practice guests** | Generate fake customers, orders and clicks; log clickstream to MongoDB | 2, 3 |
| 6 | **The smart waiter** | Python: churn model + recommender, FastAPI endpoints | 5 |
| 7 | **Waiter meets kitchen** | Java calls Python; recommendations in shop; churn page, charts and metrics in admin | 3, 6 |
| 8 | **Opening night** | Test the demo, export databases, report + diagrams, submit | all |

## Current status
- [x] Phase 1 — The building (done 2026-11-10)
- [x] Phase 2 — The storage (done 2026-11-12)
- [x] Phase 3 — The kitchen (done 2026-11-12)
- [x] Phase 4 — The wiring (done 2026-11-12)
- [ ] Phase 5 — Practice guests  ← **we are here**
- [ ] Phase 6 — The smart waiter
- [ ] Phase 7 — Waiter meets kitchen
- [ ] Phase 8 — Opening night

Update this checklist at the end of each phase.

## Build notes (things later phases need to know)
- **Versions:** Next.js 16.2.3 (pinned to match the inventory), React 19.2.4, Tailwind v4, pnpm 11, Node 22.
- **Fonts are local** (`@fontsource-variable/outfit`, `@fontsource/birthstone`, `@fontsource-variable/geist-mono`), imported in each root layout. Don't use `next/font/google`: Turbopack dev crashes on it here ("next/font/google queries have exactly one entry").
- **If a new page looks unstyled in dev**, restart `pnpm dev` (OneDrive can hide new files from Tailwind's watcher).
- **pnpm 11** uses `allowBuilds:` in `pnpm-workspace.yaml` (not `ignoredBuiltDependencies`).
- **Toasts:** always `import { notify } from "@/lib/toast"`. One `<Toaster />` lives in each root layout. Don't import `sonner` directly in pages.
- **Auth in the websites (Phase 4):** shop token in cookie `vn_token`, admin token in `vn_admin_token` (cookies on localhost are shared across ports, so the names must differ). Each app has `src/proxy.js` (Next 16 middleware) guarding private routes on the server: shop `/account`, `/checkout`; admin `/dashboard/**` (role ADMIN). A normal (not httpOnly) cookie because Java returns the token as JSON. For the report: httpOnly set by the server would be safer.
- **Copy the inventory faithfully.** Shop Navbar, Banner, Footer layout and login page are the originals (Navbar floats over the Hero, Banner stays pinned). Don't "improve" layouts without asking Yussuf first.
- **Websites talk to Java through ONE client per app:** `src/lib/api.js` (base URL from `NEXT_PUBLIC_API_URL`, JWT, device/session ids, error toast from `{ message }`, 401 → login). Pages load data with `hooks/use-api.js` and always show a skeleton, an empty state and an error state. Both apps read `NEXT_PUBLIC_*` from the root `.env` (via `next.config.mjs`).
- **Clickstream from the shop:** `src/lib/track.js` sends only VIEW (product page) and SEARCH (search box), fire-and-forget. Java logs ADD_TO_CART, REMOVE_FROM_CART, WISHLIST and PURCHASE itself. The browser sends `X-Session-Id` (per visit) and `X-Device-Id` (per browser).
- **Phase 7 slots already wired:** shop `components/shop/RecommendedForYou.jsx` (hidden while empty; on home and product pages) and `components/product/SimilarItems.jsx` (same collection for now); admin `/dashboard/churn` and `/dashboard/models` call their endpoints and show "Activates in Phase 7"; the dashboard churn card and customer churn column show placeholders.
- **Testing tip:** to test against a copy of the API without touching Yussuf's servers, run the jar with `--server.port=8090 --app.cors.allowed-origins=http://localhost:3101,http://localhost:3102`, build the app with `NEXT_PUBLIC_API_URL=http://localhost:8090`, and serve it with `next start -p 3101/3102`. Rebuild without the variable afterwards.
- **Left in the inventory for later:** shop `text-animate.jsx`, home sections (Collection, models, services, shortcuts), admin `media-uploader.jsx` (Cloudinary) and `product-table.jsx` (all Phase 4).
- **Footer contact details** are placeholders (`href="#"`). Yussuf to supply the real ones.
- **Python is not installed yet** (only the Microsoft Store alias). Install Python 3.12 before Phase 6.
- Brand photos live in `apps/shop/public/assets/images/*.webp` (converted from the inventory PNGs).
- **Databases (Phase 2):** how to install, create, seed and reset is in `database/README.md`; the ER diagram is in `docs/diagrams/er-diagram.md`.
  - MySQL 9.3 runs as service `MySQL93` on port 3306. `mysql.exe` is **not on PATH**: it's at `C:\Program Files\MySQL\MySQL Server 9.3\bin`. The app connects as `vela_app` (password in `.env`), never as root. `database\mysql\reset.ps1` rebuilds the tables and seed.
  - MongoDB 8.3 runs as service `MongoDB` on 27017. mongosh is at `%LOCALAPPDATA%\Programs\mongosh\mongosh.exe`. In PowerShell, run mongosh queries with `--file script.js`, not `--eval` (PowerShell strips the quotes).
  - Product `_id`s are fixed (`6750a1000000000000000` + 3-digit code: 1xx Seasonal, 4xx Modern Muse, 6xx Traditions, 7xx Simplicity). MySQL stores them as `product_id CHAR(24)`. There's no foreign key across the two databases, so **Java must check** that a product and SKU exist and are in stock before cart and order writes.
  - Money: MySQL `DECIMAL(10,2)`, Mongo `Decimal128`. In Java use `BigDecimal`, never `double`.
  - Seed users: 1 admin, 2 Amira, 3 Layla (BCrypt `$2a$10$`, which Spring Security's `BCryptPasswordEncoder` accepts). The demo passwords are in `database/README.md`.
- **API (Phase 3):** `apps/api`, Spring Boot 4.1 on **JDK 17** (Yussuf chose 17; it meets "Java 17+"). Every endpoint is listed in `apps/api/README.md`; Swagger is at http://localhost:8080/swagger-ui.html.
  - Run it with `pnpm dev:api` (it runs `.\mvnw.cmd spring-boot:run`) and test with `cd apps/api; .\mvnw.cmd test`. It reads the root `.env` (MySQL, MongoDB, `JWT_SECRET`) through `spring.config.import`.
  - Spring Boot 4 notes: the MongoDB properties are `spring.mongodb.*`; MockMvc lives in `org.springframework.boot.webmvc.test.autoconfigure`; springdoc is 3.x; jjwt is 0.13.
  - Auth: `POST /api/auth/login` returns `{ token, user }`. The frontends send `Authorization: Bearer <token>`, plus optionally `X-Device-Id` (a stable browser id) and `X-Session-Id` (the visit id, which ties clickstream events together). CORS allows 3000 and 3001.
  - Errors are always `{ error, message, status }`, so the frontends can show `message` with `notify.apiError`.
  - Don't put `@Validated` on controllers: it turns URL validation errors into 500s (Spring MVC validates `@Pattern`/`@Min` on parameters by itself).
  - The checkout pattern: take stock in MongoDB (atomic `$inc` with an "enough left" condition), write MySQL in `OrderWriter` (`@Transactional`), and give stock back if MySQL fails. Admin cancel/refund returns stock after the commit.
  - The tests (`ApiFlowTests`) use the real local databases and clean up after themselves. When a dev server is already on 8080, start a second copy with `--server.port=8090`.
  - Phase 7 placeholders: `GET /api/admin/churn`, `/retention-offers` and `/model-metrics` return `[]`; `DashboardStats.churnRate` and `CustomerRow.churnRisk` are null. Checkout can already redeem a `retention_offers` code.
- **Admin UI (Barista-style shell):** `components/admin-shell.jsx` (frame), `admin-topbar.jsx` (logo, Ctrl K search, theme toggle, bell), `app-sidebar.jsx` (floating, collapsible card), `stat-card.jsx`, `notifications/` (@beui/alert cards, swipe gestures, AnimatedList). The menu lives in `lib/admin-nav.js`. Yussuf's taste: **no borders**, small but not tiny rounding (`rounded-lg`), no breadcrumb, no create button, and scrollbars use `.scrollbar-pill`.

## Rules
- Never commit `.env` files, secrets, `node_modules`, `.next`, `target/`, `.venv` or large data files.
- Small commits with clear messages (`feat:`, `fix:`, `chore:`, `docs:`).
- Keep the luxury look and feel. Don't redesign what works; copy it and tidy it.
- Skip anything not needed for the spec or the demo (real payments, emails, mobile app).
- **Toned down (removed from the shop, don't build):** The VN Gala, VN Saloon, Gifts & personalization services (monograms, gift wrap), Sales & Deals / flash-sale pages, and Rare Collectibles. The brand bible still mentions them; ignore those parts. (Still built: the AI "Recommended For You" personalisation and the admin retention discount, both required by the spec.)

## Later ideas (not now)
- **Seasonal theme:** the shop's colours and hero change with the current season. This is a rule based on the date, not ML (December → winter → Velvet Moon colours).
- **Seasonal personalisation:** the recommender ranks which seasonal drop each customer sees first, based on their history. The theme follows the calendar; the products follow the person.