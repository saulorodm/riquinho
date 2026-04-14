# Riquinho

Personal finance app focused on monthly cycle control, cash flow visibility, and patrimonial tracking.

## What it covers

- Monthly control based on a custom billing cycle
- Expenses, income, cash, investments, assets, FGTS, and receivables
- Dashboard with consolidated patrimony view
- Category-based spending analysis
- Manual and market-priced investment tracking

## Tech stack

- Frontend: React, Vite, TypeScript, Tailwind, Recharts
- Backend: Node.js, Express, TypeScript, Prisma, Zod
- Database: PostgreSQL

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your local values.

Notes:

- `BRAPI_TOKEN` is optional, but required for automatic market quotes from B3 assets
- `COINGECKO_API_KEY` is optional for crypto pricing support

### 3. Start PostgreSQL with Docker

```bash
docker compose up -d
```

### 4. Run Prisma and seed

```bash
npm run db:migrate
npm run prisma:seed --workspace backend
```

### 5. Start the app

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev --workspace frontend -- --host 127.0.0.1
```

## Default local URLs

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://localhost:3333`

## Scripts

```bash
npm run dev:backend
npm run dev --workspace frontend
npm run build
npm run lint
npm run db:generate
npm run db:migrate
```

## Security

No real credentials should be committed to this repository.
Use only local `.env` files for private tokens, database URLs, and sensitive configuration.
