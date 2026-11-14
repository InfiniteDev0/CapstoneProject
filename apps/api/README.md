# LuxuryShop app (Spring Boot)

One **Java 17 / Spring Boot 4.1** application that does everything:

- it **serves the web pages** (customer shop and admin portal) with **Thymeleaf**
- it exposes a **REST API** (`/api/**`, JWT) for the Python AI service, the tests and Swagger
- it stores accounts, carts and orders in **MySQL**, and the catalogue, reviews and clickstream in **MongoDB**

```
Browser ──► Spring Boot :8080 ─┬─ /            shop pages      (Thymeleaf, session login + CSRF)
                               ├─ /admin/**    admin pages     (Thymeleaf, ADMIN only)
                               ├─ /api/**      REST API        (JSON, JWT)
                               │
                               ├─► MySQL   users, devices, wishlist, cart, orders, payments
                               └─► MongoDB products, categories, reviews, clickstream
```

## Run it

You need **JDK 17+**, **Node 22 + pnpm** (only to build the CSS), and MySQL + MongoDB with the `luxuryshop` databases (see [`database/README.md`](../../database/README.md)). Maven is not needed: the wrapper (`mvnw`) downloads it.

1. Fill in the root `.env` (copy `.env.example`): the MySQL `luxury_app` password and a `JWT_SECRET`. The app reads it automatically.
2. From the project root:
   ```powershell
   pnpm install      # once: the Tailwind CLI
   pnpm dev          # Tailwind watcher + Spring Boot (dev profile: template edits show on refresh)
   ```
   `pnpm dev:api` starts only Java. Without pnpm: `cd apps/api; .\mvnw.cmd spring-boot:run` (the built CSS is committed).
3. Open:

| What | URL |
|---|---|
| Shop | http://localhost:8080 |
| Admin | http://localhost:8080/admin |
| Health (app, MySQL, MongoDB) | http://localhost:8080/api/health |
| Swagger UI (REST API) | http://localhost:8080/swagger-ui.html |

The demo logins are in [`database/README.md`](../../database/README.md).

### Styles
The look lives in [`styles/app.css`](styles/app.css) (Tailwind v4). `pnpm css:build` writes `src/main/resources/static/css/app.css` (minified, committed so Java runs on its own). `pnpm css:watch` rebuilds on every template change.

### Tests
```powershell
pnpm test:api            # or: cd apps/api; .\mvnw.cmd test
```
- **ApiFlowTests** (REST): login works, a wrong password fails, a customer is blocked from admin routes, a product with sizes needs one, and checkout lowers stock.
- **WebPagesTests** (Thymeleaf): browsing pages render, an unknown product shows the 404 page, private pages ask guests to log in, shop login works and a form without its CSRF token is refused, and the admin door refuses customers but lets the admin in.

They use the local seeded databases and put back everything they change.

## How the code is organised (MVC)

| Package | Role | Restaurant analogy |
|---|---|---|
| `web/pages/shop`, `web/pages/admin` | page controllers: fill a Thymeleaf template with data | the waiters who plate the food |
| `web/actions` | small JSON calls the pages make (add to bag, like, quantity) | the runner |
| `controller` | the REST API (`/api/**`) | the hatch for take-away orders |
| `service` | business rules (stock, prices, checkout) | the chef |
| `repository/jpa`, `repository/mongo` | read/write MySQL and MongoDB | the storeroom keepers |
| `model/entity`, `model/document` | the shape of MySQL rows and MongoDB documents | the moulds |
| `dto` | what goes in and out (never the password hash) | order tickets |
| `security` | BCrypt, the 3 doors (API JWT, admin session, shop session), CSRF | the bouncers and wristbands |
| `exception`, `web/WebErrorAdvice` | one JSON error shape for the API, a friendly error page for the web | the complaints desk |
| `templates/` | Thymeleaf pages; `fragments/` holds the navbar, footer, product card, admin sidebar and top bar (written once) | the plates |

Key decisions:
- **Same services for pages and API.** A page controller and its REST twin call the same service, so the rules (stock, sizes, prices) live in one place.
- **Two web logins, one browser.** The shop and the admin keep their logins under different session keys, so signing in to one never signs you in to the other. Both use Spring Security form login with **CSRF** tokens; `/api/**` stays stateless with **JWT**.
- **`ddl-auto=validate`:** the tables come from `database/mysql/schema.sql`. Hibernate only checks that the Java classes match them.
- **No cross-database foreign keys:** before writing a cart or order row, the services check in MongoDB that the product, colour, size and stock exist.
- **Checkout across two databases:** stock is taken in MongoDB with one atomic conditional update per colour. The order, its lines, the payment and the emptied bag are then written in one MySQL `@Transactional`. If the MySQL write fails, the stock is given back.
- **Clickstream:** the product page logs a VIEW and the search page a SEARCH; the cart, wishlist and checkout log ADD_TO_CART, REMOVE_FROM_CART, WISHLIST and PURCHASE. Web clicks share the browser session as their visit id.
- **Photos:** products start with none (a blank box shows). The admin uploads them on the product page; they are saved in `uploads/` (git-ignored) and served at `/uploads/**`. Page photos (hero, tiles) go in `static/images/` (see its README).

## Web pages

| Shop | | Admin (ADMIN only) | |
|---|---|---|---|
| `/` | home: hero, New Arrivals, New In, best sellers | `/admin/login` | admin sign-in (customers are refused) |
| `/categories/{men\|women\|shoes\|new}` | browse: subcategory, size, price, sort | `/admin` | dashboard: sales, orders, active users, churn (Phase 7), charts |
| `/search?q=` | search | `/admin/products`, `/new`, `/{id}` | list, add, edit, photos, delete |
| `/product/{slug}` | product page, reviews, related products | `/admin/inventory` | low / sold-out / all colours, restock |
| `/cart`, `/checkout` | bag and simulated checkout 🔑 | `/admin/orders`, `/{id}` | orders and status moves |
| `/liked` | favourites 🔑 | `/admin/customers`, `/{id}` | customers and profiles |
| `/account`, `/account/orders` | profile, devices, orders 🔑 | `/admin/churn`, `/admin/models` | AI pages (Phase 7) |
| `/login`, `/register` | sign in / sign up | `/admin/search?q=` | search everything |

## REST API

🔓 public · 🔑 any logged-in user · 👑 ADMIN only. Log in with `POST /api/auth/login`, then send `Authorization: Bearer <token>` (Swagger: **Authorize**).

### Auth and health
| Method | Path | | What it does |
|---|---|---|---|
| GET | `/api/health` | 🔓 | App, MySQL and MongoDB status |
| POST | `/api/auth/register` | 🔓 | Create a customer account, returns a token |
| POST | `/api/auth/login` | 🔓 | Log in, returns a token (records the device from the User-Agent) |
| GET | `/api/auth/me` | 🔑 | Who am I |

### Store (MongoDB)
| Method | Path | | What it does |
|---|---|---|---|
| GET | `/api/store/products` | 🔓 | Browse. Filters: `category` (men, women, shoes), `subCategory`, `isNew`, `isBestSeller`, `productSize`, `minPrice`, `maxPrice`, `tags` (repeat), `q` (text search). `sort` = newest, price_asc, price_desc, rating, popular, relevance. `page` (from 0) and `size` |
| GET | `/api/store/products/{slug}` | 🔓 | Product: sizes, attributes, colours with stock, ratings |
| GET | `/api/store/categories` | 🔓 | Categories with their subcategories, in menu order |
| GET | `/api/store/products/{id}/reviews` | 🔓 | Reviews, newest first |
| POST | `/api/store/products/{id}/reviews` | 🔑 | Rate 1–5 (one review per product; "verified purchase" checked against MySQL orders) |

### Customer
| Method | Path | | What it does |
|---|---|---|---|
| GET | `/api/user/me` | 🔑 | Profile: demographics, preferred categories, tenure, devices, order totals |
| PATCH | `/api/user/me` | 🔑 | Update profile fields |
| GET | `/api/wishlist` | 🔑 | My liked products |
| POST | `/api/wishlist` | 🔑 | Like a product `{ productId }` |
| DELETE | `/api/wishlist/{productId}` | 🔑 | Unlike |
| GET | `/api/cart` | 🔑 | My bag, priced live (free shipping from $75) |
| POST | `/api/cart/items` | 🔑 | Add `{ productId, sku, quantity, selectedSize }` (size required when the product has sizes) |
| PATCH | `/api/cart/items/{itemId}` | 🔑 | Change quantity |
| DELETE | `/api/cart/items/{itemId}` | 🔑 | Remove a line |
| DELETE | `/api/cart` | 🔑 | Empty the bag |
| POST | `/api/orders/checkout` | 🔑 | Simulated checkout: order + lines + PAID payment, lowers stock, empties bag. Optional `discountCode` |
| GET | `/api/orders` | 🔑 | My orders |
| GET | `/api/orders/{id}` | 🔑 | One of my orders |
| POST | `/api/events` | 🔓 | Log a click `{ type, sessionId, productId?, category?, query?, page? }`. With a token, it is tied to the customer |

### Admin
| Method | Path | | What it does |
|---|---|---|---|
| GET | `/api/admin/dashboard/stats` | 👑 | Total sales, order count, average order, customers, active users (30 days), new customers, low-stock colours, top categories, sales by month |
| GET | `/api/admin/products` | 👑 | All products, any status (`q`, `category`, `subCategory`, `status`, pages) |
| GET | `/api/admin/products/{id}` | 👑 | One product |
| POST | `/api/admin/products` | 👑 | Create (status defaults to IN_PRODUCTION, hidden from the shop) |
| PUT | `/api/admin/products/{id}` | 👑 | Replace details, sizes, attributes and colours |
| DELETE | `/api/admin/products/{id}` | 👑 | Delete, plus its reviews and any cart or wishlist rows |
| POST | `/api/admin/products/{id}/variants` | 👑 | Add a colour |
| PATCH | `/api/admin/products/{id}/variants/{sku}` | 👑 | Change a colour |
| DELETE | `/api/admin/products/{id}/variants/{sku}` | 👑 | Remove a colour (at least one stays) |
| PUT | `/api/admin/products/{id}/variants/{sku}/stock` | 👑 | Set stock `{ stock }` |
| GET | `/api/admin/inventory` | 👑 | Every colour's stock, lowest first (`atOrBelow`, `category`) |
| GET | `/api/admin/customers` | 👑 | Customers with orders, spend and devices (`search`, `sort`, pages) |
| GET | `/api/admin/customers/{id}` | 👑 | One customer's profile |
| GET | `/api/admin/orders` | 👑 | All orders (`status`, `search`, pages) |
| GET | `/api/admin/orders/{id}` | 👑 | One order |
| PATCH | `/api/admin/orders/{id}/status` | 👑 | PAID → PROCESSING → SHIPPED → DELIVERED; CANCELLED / REFUNDED put the stock back |
| GET | `/api/admin/churn` | 👑 | Placeholder (Phase 7: churn risk per customer) |
| GET | `/api/admin/retention-offers` | 👑 | Placeholder (Phase 7: win-back discounts) |
| GET | `/api/admin/model-metrics` | 👑 | Placeholder (Phase 7: accuracy, precision, recall, ROC-AUC, Precision@K) |
| GET | `/api/admin/ping` | 👑 | Role check: customers get 403 |
