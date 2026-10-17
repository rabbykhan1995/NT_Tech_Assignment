# Backend — Retail ERP / Inventory Management

Express + TypeScript + Drizzle ORM (PostgreSQL) backend for a **single
business owner** retail ERP.

## Authentication

The app uses a minimal, single-user authentication system:

- **One predefined owner account**, created from environment variables by an
  idempotent seed script. There is no public registration, no multi-tenancy and
  no roles/permissions matrix.
- **JWT bearer tokens** signed with `JWT_SECRET` and expiring after
  `JWT_EXPIRES_IN`. Passwords are hashed with `bcrypt` (peppered with
  `BCRYPT_SECRET`).
- Login accepts **either the configured email or mobile number** as the
  identifier.

### 1. Configure environment variables

Copy the example file and fill in real values (never commit the real `.env`):

```bash
cp .env.example .env
```

Required for authentication:

| Variable          | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `JWT_SECRET`      | Long random secret used to sign/verify JWTs.                       |
| `JWT_EXPIRES_IN`  | Token lifetime, e.g. `1d`, `12h`, `60m`.                           |
| `BCRYPT_SECRET`   | Random pepper appended to passwords before hashing.                |
| `ADMIN_NAME`      | Display name of the owner account.                                 |
| `ADMIN_EMAIL`     | Owner login email. Required if `ADMIN_MOBILE` is not set.          |
| `ADMIN_MOBILE`    | Owner login mobile. Required if `ADMIN_EMAIL` is not set.          |
| `ADMIN_PASSWORD`  | Initial owner password (hashed before storage).                    |
| `DATABASE_URL`    | PostgreSQL connection string.                                      |

### 2. Create the database table

The owner account is stored in the `auth_owner` table. Generate/apply the
Drizzle migration (or `drizzle-kit push` for a quick dev setup):

```bash
bunx drizzle-kit push
```

### 3. Seed the predefined owner account

```bash
bun run seed:admin
```

This is **idempotent**: if an account already exists for the configured email or
mobile it is left untouched (its password is never reset). Re-running it on
every deployment is safe. It never creates duplicates.

### 4. Log in

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"owner@example.com","password":"ChangeMe@123"}'
```

Response:

```json
{
  "success": true,
  "msg": "Login successful",
  "data": { "id": "...", "name": "Business Owner", "email": "...", "mobile": "..." },
  "token": "<jwt>"
}
```

Call protected endpoints with the token in the `Authorization` header (a
`token` cookie and the legacy `Token` header are also accepted):

```bash
curl http://localhost:5000/api/product/list \
  -H "Authorization: Bearer <jwt>"
```

Invalid credentials always return the same generic `401 Invalid credentials`
response, so it is never revealed whether the account or the password was wrong.

### Auth endpoints

| Method | Path                | Auth | Description                          |
| ------ | ------------------- | ---- | ------------------------------------ |
| POST   | `/api/auth/login`   | No   | Log in with `identifier` + `password`. |
| GET    | `/api/auth/me`      | Yes  | Current authenticated owner.         |
| GET    | `/api/auth/logout`  | Yes  | Clears the auth cookie.              |

`logout` only clears the cookie; JWTs are stateless and cannot be revoked
server-side, so clients that store the token themselves should discard it.

### Protected business routes

All ERP/inventory endpoints require authentication via the shared
`authMiddleware`: products, sales, purchases, contacts/suppliers,
supplier–product relationships, ledger, reports/dashboard, AI analysis and
automation. Only `/api/auth/login` is public.

## Inventory & reporting

### Supplier ⇄ Product relationships

`/api/supplier-product` manages the many-to-many link between suppliers
(rows in `contacts`) and products, including supplier-specific purchase price,
lead time, minimum order quantity (`minOrderQty`), supplier SKU and a
`isPreferred` flag. The pair `(supplierID, productID)` is unique.

| Method | Path                                       | Description                          |
| ------ | ------------------------------------------ | ------------------------------------ |
| POST   | `/api/supplier-product`                    | Create a relationship.               |
| PATCH  | `/api/supplier-product/:id`                | Update a relationship.               |
| GET    | `/api/supplier-product/product/:productID` | Suppliers for a product.             |
| GET    | `/api/supplier-product/supplier/:supplierID` | Products for a supplier.           |
| DELETE | `/api/supplier-product/:id`                | Remove a relationship.               |

### Dashboard (`/api/dashboard`)

All figures are computed live from the transactional tables (no precomputed
summary row), so they are always consistent with the underlying records.

| Endpoint                   | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `GET /overview`            | Counts, purchase/sales totals, inventory qty & value, low-stock, recent sales/purchases. |
| `GET /profit-loss`         | Revenue, estimated COGS and gross profit for an optional `startDate`/`endDate`. |
| `GET /cash-flow`           | Cash received vs paid, net cash, and outstanding sale/purchase dues. |

Revenue and COGS are aggregated in separate queries so joining the one-to-many
sale items can never double-count revenue.

## AI analysis (`/api/ai`) — optional

`POST /api/ai/analyze` (body `{ "question"?: string }`) returns a plain-language
reading of the current inventory situation.

- **Deterministic first:** stock status, demand level and suggested
  replenishment quantities (rounded up to the supplier's MOQ) are calculated by
  the backend (`src/ai/ai.analysis.ts`). The AI model only *explains* those
  numbers; it never invents stock, prices or quantities.
- **Never on the critical path:** no core operation (sales, purchases, stock,
  totals) depends on the AI. If AI is unconfigured the endpoint returns `503`;
  if the provider fails it returns `502` — the rest of the app is unaffected.
- **Configuration:** set `AI_PROVIDER` (`openai`, `anthropic`, `google` or
  `openai-compatible`), `AI_MODEL` and the matching API key (see
  `.env.example`). For `openai-compatible` set `AI_BASE_URL` too.
- **Privacy:** only aggregated business figures (product ids/names, quantities,
  prices, supplier terms) are sent — never customer or credential data.

## Running

```bash
bun run dev      # start in watch mode
bun run build    # type check (tsc --noEmit)
bun test         # run tests
```

## Known limitations

This repository is a partial snapshot. Only one unreferenced file still
references a module that is not present:

- `events/shopify.event.ts` imports `config/redis.config` (missing). It is dead
  code — nothing in the running app imports it — and is the only remaining
  `tsc` error.

Everything the application currently mounts (auth, products, contacts,
purchases, sales, supplier–product links, ledger, dashboard, reports, AI and
automation) type-checks. The AI module is optional; without AI environment
variables the app still boots and only the `/api/ai` endpoint is unavailable.
