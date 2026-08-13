# Cara Fashion — Full-Stack Setup Guide

Your original frontend (index, shop, blog, about, contact — same design, colors,
navbar, footer, product cards) is untouched except for small hooks that connect
it to a real backend. Everything new follows the same visual style.

## What backend and why: Supabase

| | Firebase | Supabase | Strapi |
|---|---|---|---|
| Works with plain HTML/JS (no build step) | Yes, via SDK | Yes, via SDK | Yes, via REST/GraphQL, but you must self-host or pay for hosting |
| Database | Firestore (NoSQL) | **Postgres (SQL)** — better fit for orders/products/relations | Postgres/SQL, but needs its own server |
| Auth (register/login/reset password) built-in | Yes | **Yes**, out of the box, email+password, reset emails included | Needs plugin config |
| Roles/permissions | Custom rules (verbose) | **Row Level Security (SQL policies)** — clean, enforced by the DB itself | Role-based, admin panel included but heavier to run |
| Free tier | Generous | **Generous**, and everything runs as a hosted service — nothing to deploy yourself | Free only if you self-host (needs a server you manage) |
| Setup effort for this assignment | Medium | **Low** — one JS file, no server code at all | High — requires deploying a Node backend |

**Supabase wins** for this project: it's Postgres (a natural fit for
products/orders/order_items relationships), authentication with password
reset is built in, and Row Level Security gives you real admin-vs-user
permissions enforced at the database level — all without writing or
hosting any server code. You only edit `js/supabase-config.js`.

## Step 1 — Create your Supabase project
1. Go to https://supabase.com → New project (free tier is fine).
2. Wait ~2 minutes for it to provision.

## Step 2 — Run the database schema
1. In your Supabase project, open **SQL Editor → New query**.
2. Paste the entire contents of `schema.sql` (in this folder) and click **Run**.
   This creates: `profiles`, `categories`, `products`, `orders`, `order_items`,
   `messages` — with Row Level Security policies already applied.

## Step 3 — Connect the frontend
1. In Supabase: **Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `js/supabase-config.js` and paste them in:
   ```js
   const SUPABASE_URL = "https://xxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi....";
   ```

## Step 4 — Create your admin account
1. Open `register.html` in a browser (or deploy the site — see below) and
   register a normal account with your own email.
2. Back in Supabase → SQL Editor, run:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Log out and back in — you'll now see an "Admin" link in the navbar.

## Step 5 — Turn off email confirmation (optional, for faster testing)
Supabase requires email confirmation by default. For local testing:
**Authentication → Providers → Email → toggle off "Confirm email"**.
Turn it back on before submitting/deploying for real use.

## Step 6 — Run the site
Because this uses `fetch` under the hood, open it through a local server
(not `file://`), e.g. from this folder:
```
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

You can also deploy for free on **Netlify** or **Vercel** (drag-and-drop the
folder) or **GitHub Pages** — it's static HTML/CSS/JS, so no build step needed.

## What's new vs. your original files
- `js/supabase-config.js`, `js/auth.js`, `js/products.js`, `js/cart.js` — new
- `login.html`, `register.html`, `forgot-password.html`, `reset-password.html`,
  `cart.html`, `product.html`, `account.html` — new, built in your existing style
- `admin/dashboard.html`, `admin/products.html`, `admin/orders.html`,
  `admin/messages.html`, `admin/users.html` — new admin area
- `index.html`, `shop.html` — product grids now load real data from Supabase
  (markup/design unchanged, just given IDs and a loader script)
- `contact.html` — form now saves messages to the database
- `about.html`, `blog.html` — only got the auth scripts added (so the navbar
  shows Login/Logout consistently); nothing else changed
- `style.css` — a small block appended at the end for the cart table, admin
  dashboard sidebar/cards, and buttons — using your existing teal (#088178)
  and dark (#1a1a1a) palette. Nothing existing was edited or removed.
- `schema.sql` — run once in Supabase to create your database

## Entities used (matches what your project actually needs)
- **profiles** — extends Supabase auth users with `full_name` and `role` (user/admin)
- **categories** — product categories (Feature, Casual, New)
- **products** — name, brand, price, rating, image, stock, description
- **orders** / **order_items** — a user's cart becomes an order at checkout
- **messages** — submissions from the Contact page

No extra/unused entities were added.
