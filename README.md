# NovaStake Dummy Backend (Node/Express)

This is a simple **Node.js + Express** backend for the NovaStake staking platform. It uses an **in-memory store** (no real database) and **no blockchain** — just enough to support front-end integration and demos.

## Features

- User registration and login with JWT auth
- Dummy wallet per user with initial balance (1000 NST)
- Staking endpoint (moves funds from balance to staked)
- Simple APR-based reward accrual (12% APR, linear, non-compounding)
- Wallet & dashboard summary endpoints
- Transaction history endpoint

## Project Structure

- `package.json` – dependencies and scripts
- `src/server.js` – HTTP server
- `src/app.js` – Express app and routes wiring
- `src/data/store.js` – in-memory arrays for users, wallets, stakes, transactions
- `src/middleware/auth.js` – JWT auth middleware
- `src/routes/auth.js` – register/login
- `src/routes/wallet.js` – wallet + dashboard summary
- `src/routes/stake.js` – staking
- `src/routes/transactions.js` – history

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root (same folder as `package.json`):

```env
PORT=4000
JWT_SECRET=your-dev-secret
```

3. Run the dev server (with nodemon):

```bash
npm run dev
```

Or run once with Node:

```bash
npm start
```

The backend will start on:

```text
http://localhost:4000
```

## Example Endpoints

- `GET /api/health` – service status
- `POST /api/auth/register` – `{ name, email, password }`
- `POST /api/auth/login` – `{ email, password }`
- `GET /api/wallet` – requires `Authorization: Bearer <token>`
- `GET /api/wallet/dashboard-summary` – dashboard data
- `POST /api/stake` – body `{ amount }`
- `GET /api/stake` – list stakes
- `GET /api/transactions` – paginated history

## Notes

- Data is **not persisted**; it resets when the server restarts.
- This backend is designed as a **demo/mock**, suitable to be replaced by a real DB and real blockchain logic later.
