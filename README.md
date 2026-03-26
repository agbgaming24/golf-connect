# GolfGive

GolfGive is a full-stack web app where golfers submit scores, enter prize draws, and support charities through subscriptions and donations.

It includes:
- A React + TypeScript frontend
- An Express + MySQL backend
- JWT authentication and admin controls
- Stripe-powered subscription and payment flows

## Table Of Contents

1. Overview
2. Tech Stack
3. Repository Structure
4. Prerequisites
5. Environment Variables
6. Local Development Setup
7. Available Scripts
8. API Overview
9. Key Product Flows
10. Troubleshooting
11. Current Limitations
12. Contributing Notes

## Overview

GolfGive supports two user roles:

- User
	- Register/login
	- Submit and manage recent scores
	- Subscribe monthly/yearly
	- Choose a charity
	- View draw and payment history
- Admin
	- Manage users and subscriptions
	- Run random/algorithmic draws
	- Manage charities
	- Verify winners and mark payouts
	- Access platform reports

## Tech Stack

Frontend:
- React 18
- TypeScript
- Vite
- Tailwind CSS + shadcn/ui components
- Axios
- Stripe Elements

Backend:
- Node.js
- Express 5
- PostgreSQL (pg driver)
- JWT (jsonwebtoken)
- bcrypt
- Stripe SDK

## Repository Structure

```text
github-clone/
	backend/
		server.js
		package.json
		src/
			app.js
			config/
			controller/
			middleware/
			models/
			routes/
			services/
	frontend/
		package.json
		src/
			components/
			contexts/
			lib/
			pages/
			services/
			types/
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 12+ (running locally or remote)
- Stripe account (test keys for local development)

## Environment Variables

Create these files:
- `backend/.env`
- `frontend/.env`

### Backend `.env`

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASS=your_postgres_password
DB_NAME=golfgive

JWT_SECRET=replace_with_a_strong_random_secret

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Notes:
- Frontend falls back to `http://localhost:5000/api` if `VITE_API_BASE_URL` is not set.
- Keep secrets out of Git.

## Local Development Setup

Install dependencies:

```bash
# Terminal 1
cd backend
npm install

# Terminal 2
cd frontend
npm install
```

Start backend:

```bash
cd backend
npm run dev
```

Start frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:8080` (Vite may choose another open port)
- Backend API: `http://localhost:5000/api`

## Available Scripts

Backend (`backend/package.json`):
- `npm run dev` -> start backend with file watch
- `npm start` -> start backend normally
- `npm test` -> placeholder (no backend tests configured yet)

Frontend (`frontend/package.json`):
- `npm run dev` -> start Vite dev server
- `npm run build` -> production build
- `npm run build:dev` -> development-mode build
- `npm run lint` -> ESLint
- `npm run preview` -> preview production build
- `npm run test` -> run Vitest once
- `npm run test:watch` -> watch tests

## API Overview

Base URL: `/api`

Auth:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (auth required)
- `POST /auth/logout` (auth required)

Users:
- `GET /users/stats`
- `PUT /users/me/charity` (auth required)
- `GET /users` (auth + admin required)

Scores:
- `GET /scores/me` (auth)
- `POST /scores` (auth)
- `PUT /scores/:id` (auth)
- `DELETE /scores/:id` (auth)

Draws:
- `GET /draws`
- `GET /draws/:id`

Charities:
- `GET /charities`
- `GET /charities/:id`

Payments:
- `GET /payments/config`
- `POST /payments/create-intent` (auth)
- `POST /payments/confirm` (auth)
- `GET /payments/subscription/me` (auth)
- `POST /payments/subscription/pause` (auth)
- `POST /payments/subscription/cancel` (auth)
- `POST /payments/subscription/resume` (auth)
- `GET /payments/history` (auth)
- `POST /payments/webhook`

Admin:
- `GET /admin/users`
- `PUT /admin/users/:id`
- `PUT /admin/users/:userId/scores/:scoreId`
- `PUT /admin/users/:id/subscription`
- `POST /admin/draws/random`
- `POST /admin/draws/algorithmic`
- `POST /admin/draws/simulate`
- `POST /admin/draws/:id/publish`
- `POST /admin/charities`
- `PUT /admin/charities/:id`
- `DELETE /admin/charities/:id`
- `PUT /admin/winners/:id/approve`
- `PUT /admin/winners/:id/reject`
- `PUT /admin/winners/:id/payout`
- `GET /admin/reports/overview`

## Key Product Flows

1. User onboarding
- Register -> login -> JWT stored in frontend local storage

2. Score flow
- User adds/edit/delete score
- Dashboard uses latest rolling scores for display and draw eligibility

3. Subscription flow
- User selects monthly/yearly plan
- Frontend creates payment intent
- Stripe confirmation updates subscription state
- User can pause/cancel/resume subscription

4. Admin draw flow
- Admin triggers random or algorithmic draw
- Winners can be approved/rejected and marked paid

5. Charity management
- Users can switch their preferred charity
- Admin can create/update/delete charities

## Troubleshooting

1. Frontend shows unauthorized or logs out immediately
- Verify `JWT_SECRET` is set in backend `.env`
- Ensure token exists in browser local storage key `auth_token`
- Confirm backend is running on expected port

2. API calls fail from frontend
- Check `VITE_API_BASE_URL`
- Confirm CORS is enabled (it is in backend app)

3. Payments fail locally
- Verify Stripe keys in backend `.env` and frontend `.env`
- Make sure webhook secret is valid if testing webhook path

4. Admin options not visible
- Confirm account role is `admin` in DB
- Log out and log in again after role changes

5. Database connection errors
- Recheck `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- Confirm PostgreSQL server is running

## Current Limitations

- Backend automated tests are not configured yet.
- Some frontend E2E workflows may still need dedicated Playwright coverage.
- Production deployment assets (CI/CD, Docker, infra) are not included in this repo.

## Contributing Notes

- Keep API response shapes consistent (`{ data: ... }` is expected by frontend interceptors).
- Reuse shared normalizers in `frontend/src/lib/normalizers.ts` for mapping API responses.
- Prefer incremental, scoped changes and run `npm run build` in frontend before merging.

