# Vela Noire API

The backend of the Vela Noire shop and admin: a **Java 17 / Spring Boot 4.1** REST API.
It stores accounts, carts and orders in **MySQL** and the catalogue, reviews and clickstream in **MongoDB**.

```
Shop (Next.js :3000) ─┐
                      ├─► API (Spring Boot :8080) ─┬─► MySQL   users, devices, wishlist, cart, orders, payments
Admin (Next.js :3001) ┘                            └─► MongoDB products, categories, collections, reviews, clicks
```

## Run it

You need **JDK 17+**, plus MySQL and MongoDB running with the `vela_noire` databases (see [`database/README.md`](../../database/README.md)). Maven is not needed: the wrapper (`mvnw`) downloads it.

1. Fill in the root `.env` (copy `.env.example`): the MySQL `vela_app` password and a `JWT_SECRET`. The API reads it automatically.
2. Start the API from the project root:
   ```powershell
   pnpm dev:api
   ```
   or from `apps/api`: `.\mvnw.cmd spring-boot:run` (Windows) / `./mvnw spring-boot:run` (macOS/Linux).
3. Open **http://localhost:8080/swagger-ui.html** to try every endpoint in the browser.

| Check | URL |
|---|---|
| Health (API, MySQL, MongoDB) | http://localhost:8080/api/health |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

### Logging in with Swagger
1. `POST /api/auth/login` with a demo account (the demo passwords are listed in `database/README.md`).
2. Copy the `token` from the response, click **Authorize**, and paste it.
3. Every request now carries `Authorization: Bearer <token>`.

### Tests
```powershell
cd apps/api
.\mvnw.cmd test
```
MockMvc tests cover: login works, a wrong password fails, a customer is blocked from admin routes, and checkout lowers stock. They use the local seeded databases and put back everything they change.

## How the code is organised (MVC)

| Package | Role | Restaurant analogy |
|---|---|---|
| `controller` | HTTP endpoints; no business logic | the waiter |
| `service` | business rules (stock, prices, checkout) | the chef |
| `repository/jpa`, `repository/mongo` | read/write MySQL and MongoDB | the storeroom keepers |
| `model/entity`, `model/document` | the shape of MySQL rows and MongoDB documents | the moulds |
| `dto` | what goes in and out as JSON (never the password hash) | order tickets and plates |
| `security` | BCrypt, JWT filter, role rules, CORS | the bouncer and wristbands |
| `exception` | one error shape for everything | the complaints desk |
| `config` | JWT settings, Swagger | the notice board |

Key decisions:
- **`ddl-auto=validate`:** the tables come from `database/mysql/schema.sql`. Hibernate only checks that the Java classes match them.
- **No cross-database foreign keys:** before writing a cart or order row, the services check in MongoDB that the product, colour and stock exist.
- **Checkout across two databases:** stock is taken in MongoDB with one atomic conditional update per colour. The order, its lines, the payment and the emptied cart are then written in one MySQL `@Transactional`. If the MySQL write fails, the stock is given back.
- **Errors** always look like `{ "error": "Not Found", "message": "...", "status": 404 }`.

## Endpoints

🔓 public · 🔑 any logged-in user · 👑 ADMIN only

### Auth and health
| Method | Path | | What it does |
|---|---|---|---|
| GET | `/api/health` | 🔓 | API, MySQL and MongoDB status |
| POST | `/api/auth/register` | 🔓 | Create a customer account, returns a token |
| POST | `/api/auth/login` | 🔓 | Log in, returns a token (records the device from the User-Agent) |
| GET | `/api/auth/me` | 🔑 | Who am I |

### Store (MongoDB)
| Method | Path | | What it does |
|---|---|---|---|
| GET | `/api/store/products` | 🔓 | Browse. Filters: `category`, `collection`, `season`, `seasonalLine`, `minPrice`, `maxPrice`, `tags` (repeat), `q` (text search). `sort` = newest, price_asc, price_desc, rating, popular, relevance. `page` (from 0) and `size` |
| GET | `/api/store/products/{slug}` | 🔓 | Product page: specs, colours with stock, ratings |
| GET | `/api/store/categories` | 🔓 | Categories in menu order |
| GET | `/api/store/collections` | 🔓 | Collections (Seasonal includes its 4 lines) |
| GET | `/api/store/products/{id}/reviews` | 🔓 | Reviews, newest first |
| POST | `/api/store/products/{id}/reviews` | 🔑 | Rate 1–5 (one review per product; "verified purchase" checked against MySQL orders) |

### Customer
| Method | Path | | What it does |
|---|---|---|---|
| GET | `/api/user/me` | 🔑 | Profile: demographics, preferred categories, tenure, devices, order totals |
| PATCH | `/api/user/me` | 🔑 | Update profile fields |
| GET | `/api/wishlist` | 🔑 | My hearted products |
| POST | `/api/wishlist` | 🔑 | Heart a product `{ productId }` |
| DELETE | `/api/wishlist/{productId}` | 🔑 | Un-heart |
| GET | `/api/cart` | 🔑 | My bag, priced live (free shipping from $75) |
| POST | `/api/cart/items` | 🔑 | Add `{ productId, sku, quantity, selectedSize? (abayas), selectedStyle?, shaylaType? }` |
| PATCH | `/api/cart/items/{itemId}` | 🔑 | Change quantity |
| DELETE | `/api/cart/items/{itemId}` | 🔑 | Remove a line |
| DELETE | `/api/cart` | 🔑 | Empty the bag |
| POST | `/api/orders/checkout` | 🔑 | Simulated checkout: order + lines + PAID payment, lowers stock, empties bag. Optional `discountCode` |
| GET | `/api/orders` | 🔑 | My orders |
| GET | `/api/orders/{id}` | 🔑 | One of my orders |
| POST | `/api/events` | 🔓 | Log a click `{ type, sessionId, productId?, category?, query?, page? }`. With a token, it is tied to the customer |

Cart, wishlist and checkout also log their own clickstream events (ADD_TO_CART, REMOVE_FROM_CART, WISHLIST, PURCHASE). The shop can send `X-Session-Id` so these join the visit's session.

### Admin
| Method | Path | | What it does |
|---|---|---|---|
| GET | `/api/admin/dashboard/stats` | 👑 | Total sales, order count, average order, customers, active users (30 days), new customers, low-stock colours, top categories, sales by month |
| GET | `/api/admin/products` | 👑 | All products, any status (`q`, `category`, `status`, pages) |
| GET | `/api/admin/products/{id}` | 👑 | One product |
| POST | `/api/admin/products` | 👑 | Create (status defaults to IN_PRODUCTION, hidden from the shop) |
| PUT | `/api/admin/products/{id}` | 👑 | Replace details and colours |
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
