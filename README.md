# Lugo Tailoring

Website for Lugo Tailoring — a custom luxury suit tailoring studio. Built with Node.js, Express, EJS, and MySQL.

## Features

- **Public site** — Home, About, Gallery, Store, Booking, Contact
- **Appointment booking** — customers pick an open time slot; the request is held as "pending" until an admin approves it. Unapproved holds automatically expire (default 24h) and free the slot back up.
- **Custom suit ordering** — customers choose a fabric, configure design options (lapel, buttons, lining, fit, monogram, pocket), and submit their exact measurements, then pay online via [Chapa](https://developer.chapa.co).
- **Admin dashboard** (`/admin`) — approve/reject bookings, manage orders and fulfillment status, manage fabrics, design options, and gallery images, and read contact form messages.

## Tech stack

- Node.js + Express, server-rendered with EJS
- MySQL via Sequelize (models, migrations, seeders)
- Sessions stored in MySQL (`express-mysql-session`), admin auth via bcrypt-hashed passwords
- Chapa for online payments
- Plain CSS design system (no frontend framework/build step required)

## Getting started

### Prerequisites

- Node.js 18+
- A running MySQL server (8.x recommended) with a database created for the app

### Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — your MySQL connection details (create the database first, e.g. `CREATE DATABASE lugo_tailoring;`)
- `SESSION_SECRET` — a long random string
- `CSRF_SECRET` — optional, another long random string used to sign CSRF tokens. Falls back to `SESSION_SECRET` if left blank.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the admin account created by the seeder
- `CHAPA_SECRET_KEY` / `CHAPA_PUBLIC_KEY` — from your [Chapa dashboard](https://dashboard.chapa.co) (use test keys while developing)
- `BASE_URL` — the public URL of the site (used to build Chapa callback/return URLs — must be reachable from the internet for the payment callback to work, e.g. via a tunnel in local dev)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` — optional, for email notifications (see below). Leave blank to skip emails entirely (bookings/orders/messages still work, they're just not emailed).
- `ADMIN_NOTIFICATION_EMAIL` — where "new booking / new order / new message" emails go. Defaults to `ADMIN_EMAIL` if left blank.

Then run migrations and seed sample data (admin user, fabrics, design options, gallery placeholders):

```bash
npm run migrate
npm run seed
```

Start the app:

```bash
npm run dev    # with auto-reload (nodemon)
npm start      # production
```

Visit `http://localhost:3000`. Admin dashboard is at `/admin/login` using the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set.

## Booking rules

Configured via env vars (see `.env.example`):

- `BOOKING_SLOT_MINUTES` — length of each bookable slot
- `BOOKING_OPEN_HOUR` / `BOOKING_CLOSE_HOUR` — daily business hours (24h)
- `BOOKING_CLOSED_WEEKDAYS` — comma-separated closed days (`0`=Sunday … `6`=Saturday)
- `BOOKING_HOLD_HOURS` — how long a pending (unapproved) booking holds its slot before it auto-expires

A background job (`node-cron`) checks every 10 minutes for expired holds and releases those slots.

## Email notifications

If `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` are set, the site emails:

- **Customers**: booking submitted, booking approved/rejected, order payment confirmed, order status changes (in production / ready / completed / cancelled)
- **Admin** (`ADMIN_NOTIFICATION_EMAIL` or `ADMIN_EMAIL`): new booking request, new paid order, new contact message

If SMTP isn't configured, nothing breaks — emails are skipped and logged to the console instead, so bookings/orders/messages still work without an email provider set up. Any provider that gives you SMTP credentials works (Gmail app password, SendGrid, Mailgun, Amazon SES, your own mail server, etc.).

## Payments

Checkout creates one `Order` row per cart item, all sharing a single Chapa transaction reference, then redirects the customer to Chapa's hosted checkout. Chapa calls back to `POST /order/webhook` on completion, and the customer is redirected to `GET /order/return`, both of which verify the transaction with Chapa before marking the order(s) as paid.

## Project structure

```
src/
  config/       env-driven config (database, chapa, booking rules)
  models/       Sequelize models
  migrations/   Sequelize migrations (MySQL schema)
  seeders/      sample data + admin user
  routes/       Express route handlers (public, booking, store, auth, admin)
  middleware/   auth guard, file upload (multer)
  services/     Chapa client, booking availability, cart, booking-expiry cron
  views/        EJS templates (public + admin)
  public/       CSS, client-side JS, images/uploads
```

## Notes

- Image uploads (gallery photos, fabric swatches, via the admin dashboard) accept **JPG and PNG only**. All static brand/placeholder imagery ships as PNG for the same reason — there's no SVG anywhere in the app.
- The logo (`src/public/images/logo.png`, full lockup at `logo-full.png`) is a recreation of the supplied Lugo Tailoring mark. Swap in the official brand files whenever ready — keep the same filenames/extension (`logo.png`, `logo-full.png`) and no code changes are needed. Everywhere else references those exact paths.
- Fabric swatches and gallery photos currently use generated placeholder PNGs so the site isn't full of broken images — replace them with real photography via the admin dashboard (Gallery/Fabrics pages) or by swapping files in `src/public/images/`.
