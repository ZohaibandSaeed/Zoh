# ⚡ Zinks - Custom URL Shortener

A minimalist, high-performance URL shortener built with **Next.js (App Router)**, **Neon Serverless PostgreSQL**, and **Tailwind CSS**, designed for deployment on Netlify at `zinks.netlify.app`.

---

## 🌟 Key Features

1. **6-Digit PIN Authentication**
   - Access-controlled admin portal (`/login`) with a modern 6-box PIN input.
   - JWT sessions encrypted via `jose` and stored in secure HTTP-only cookies.
   - Next.js Edge Middleware protecting admin routes (`/dashboard`, `/manage`).
   - Dynamic database PIN updates from the UI.

2. **100% Custom Slugs & Duplicate Protection**
   - User specifies their own short name (e.g. `zinks.netlify.app/myportfolio`).
   - Neon PostgreSQL uniqueness verification before saving.
   - Reserved route protection (`list`, `login`, `api`, `manage`, etc.).

3. **Ultra-Fast Dynamic Redirection (`/[slug]`)**
   - Direct HTTP 307 Temporary Redirects to destination URLs with zero rendering overhead.
   - Asynchronous click counter updates.
   - Branded custom 404 page for missing or removed links.

4. **URL Management Studio (`/manage`)**
   - Full CRUD: Rename custom slugs, update destination targets, or delete short links.
   - Real-time search filter and aggregate click counters.
   - "Change Passcode" security modal with database persistence.

5. **Public Directory (`/list`)**
   - **Accessible without login** at `zinks.netlify.app/list`.
   - Complete directory of active short links.
   - Real-time search by keyword or target domain.
   - Instant click-to-redirect and one-click link copying.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Styling:** Tailwind CSS + Lucide Icons
- **Auth:** 6-Digit Passcode + HTTP-Only JWT Session
- **Hosting / Deployment:** Netlify (`netlify.toml` configured)

---

## 🚀 Getting Started

### 1. Environment Variables

Create `.env.local` in the project root:

```env
# Neon PostgreSQL Connection String
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 6-Digit Admin Passcode (Default: 123456)
ADMIN_PIN="123456"

# JWT Secret (minimum 32 characters)
SESSION_SECRET="zinks-super-secret-session-key-32-chars-long-local-env"

# Base Application URL
NEXT_PUBLIC_APP_URL="https://zinks.netlify.app"
```

### 2. Development

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## 🌐 Deploying to Netlify (`zinks.netlify.app`)

1. Push this repository to GitHub: `git push origin main`.
2. In Netlify dashboard, click **"Add new site"** &rarr; **"Import an existing project"**.
3. Select your repository:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
4. In **Site Configuration &rarr; Environment Variables**, add:
   - `DATABASE_URL`: Your Neon DB connection string.
   - `ADMIN_PIN`: Your desired 6-digit passcode.
   - `SESSION_SECRET`: A secure random 32+ character string.
   - `NEXT_PUBLIC_APP_URL`: `https://zinks.netlify.app`
5. Under **Domain Management**, set your site name to **`zinks`** (giving you `zinks.netlify.app`).
6. Deploy!
