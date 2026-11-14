# LuxuryShop

**E-Commerce Intelligent Analytics & Personalization Suite**: a capstone project built around **LuxuryShop**, an invented premium activewear and fashion store (Men, Women, Shoes).

Everything runs from **one Spring Boot app on http://localhost:8080**:

| Part | Where | Built with |
|---|---|---|
| Customer shop | http://localhost:8080 | Spring Boot + Thymeleaf + Tailwind |
| Admin portal | http://localhost:8080/admin | Spring Boot + Thymeleaf + Tailwind + Chart.js |
| REST API + Swagger | http://localhost:8080/swagger-ui.html | Spring Boot, JWT |
| Accounts, orders, payments | MySQL `luxuryshop` | |
| Products, reviews, clickstream | MongoDB `luxuryshop` | |
| Recommendations + churn (Phase 6) | `ml/` → http://localhost:8000 | Python, scikit-learn, FastAPI |

## Quick start (Windows, PowerShell)

1. Install JDK 17+, Node 22 + pnpm, MySQL 8+ and MongoDB 7+.
2. Copy `.env.example` to `.env` and fill in the passwords and a `JWT_SECRET`.
3. Create and fill the databases (details in [`database/README.md`](database/README.md)):
   ```powershell
   powershell -ExecutionPolicy Bypass -File database\mysql\setup.ps1   # once, asks for the MySQL root password
   powershell -ExecutionPolicy Bypass -File database\mysql\reset.ps1
   mongosh --file database/mongodb/init.js
   mongosh --file database/mongodb/seed.js
   ```
4. Run it:
   ```powershell
   pnpm install
   pnpm dev        # Tailwind watcher + Spring Boot
   ```
5. Open http://localhost:8080 (shop) and http://localhost:8080/admin (admin). Demo logins are in [`database/README.md`](database/README.md).

Tests: `pnpm test:api`.

## Folders

```
apps/api/     Spring Boot app: web pages (Thymeleaf), REST API, security, services
database/     MySQL scripts, MongoDB validators and seed data
docs/         brand, image credits, diagrams (ER), report material
ml/           Python AI (Phase 6)
```

More: [`apps/api/README.md`](apps/api/README.md) (code layout, pages, every endpoint), [`docs/brand.md`](docs/brand.md), [`docs/diagrams/er-diagram.md`](docs/diagrams/er-diagram.md).
