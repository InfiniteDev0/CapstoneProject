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
**Vela Noire** is my luxury modest-fashion brand: "Middle Eastern Louis Vuitton". Abayas, perfume, handbags, bracelets, shayla, shoes and accessories. Tagline: "Luxury Reimagined for Her". Collections: Rare Collectibles, Infinity Bride, Modern Muse, Lux Infinity, Traditions Reimagined, Simplicity Speaks, and Seasonal (Desert Bloom, Velvet Moon, Amber Luxe, Floral Grace).

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
- [ ] Phase 2 — The storage  ← **we are here**
- [ ] Phase 3 — The kitchen
- [ ] Phase 4 — The wiring
- [ ] Phase 5 — Practice guests
- [ ] Phase 6 — The smart waiter
- [ ] Phase 7 — Waiter meets kitchen
- [ ] Phase 8 — Opening night

Update this checklist at the end of each phase.

## Build notes (things later phases need to know)
- **Versions:** Next.js 16.2.3 (pinned to match the inventory), React 19.2.4, Tailwind v4, pnpm 11, Node 22.
- **pnpm 11** uses `allowBuilds:` in `pnpm-workspace.yaml` (not `ignoredBuiltDependencies`).
- **Toasts:** always `import { notify } from "@/lib/toast"`. One `<Toaster />` lives in each root layout. Don't import `sonner` directly in pages.
- **Login placeholders (Phase 3 replaces them):** shop `Navbar.jsx` has `isAuthenticated = false`; shop `components/forms/login-form.jsx` uses a `previewAuth` stub; admin `login-form.jsx` and `nav-user.jsx` fake the login/logout; `apps/admin/src/app/dashboard/layout.js` needs the JWT guard.
- **Copy the inventory faithfully.** Shop Navbar, Banner, Footer layout and login page are the originals (Navbar floats over the Hero, Banner stays pinned). Don't "improve" layouts without asking Yussuf first.
- **Unbuilt pages** show a branded "coming soon" page: shop `app/not-found.js`, admin `app/dashboard/[...slug]/page.jsx`. Delete an entry from `comingIn` when its page is built.
- **Left in the inventory for later:** shop `text-animate.jsx`, home sections (Collection, models, services, shortcuts), admin `media-uploader.jsx` (Cloudinary) and `product-table.jsx` (all Phase 4).
- **Footer contact details** are placeholders (`href="#"`). Yussuf to supply the real ones.
- **Python is not installed yet** (only the Microsoft Store alias). Install Python 3.12 before Phase 6.
- Brand photos live in `apps/shop/public/assets/images/*.webp` (converted from the inventory PNGs).

## Rules
- Never commit `.env` files, secrets, `node_modules`, `.next`, `target/`, `.venv` or large data files.
- Small commits with clear messages (`feat:`, `fix:`, `chore:`, `docs:`).
- Keep the luxury look and feel. Don't redesign what works; copy it and tidy it.
- Skip anything not needed for the spec or the demo (real payments, emails, mobile app).