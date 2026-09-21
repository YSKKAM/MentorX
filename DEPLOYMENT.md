# MentorX - Production Deployment Guide (Free Tier)

This guide walks you through deploying the complete full-stack **MentorX AI Classroom Platform** for free using:
- **Database**: [Neon Serverless Postgres](https://neon.tech)
- **Backend (API & WebSockets)**: [Render](https://render.com)
- **Frontend (Next.js 16)**: [Vercel](https://vercel.com)

---

## Architecture Overview

```
 ┌────────────────┐          ┌──────────────────────┐          ┌─────────────────────┐
 │  Neon Postgres │ ◄─────── │  Render Web Service  │ ◄─────── │   Vercel Frontend   │
 │   (Database)   │   SSL    │ (apps/server: Node)  │   CORS   │  (apps/web: Next)   │
 └────────────────┘          └──────────────────────┘          └─────────────────────┘
```

- **Automatic Migrations**: When the backend boots up on Render, it automatically runs all SQL migrations against Neon Postgres. No manual database setup scripts needed!
- **Persistent WebSockets**: Render provides continuous HTTP/WebSocket connections required for real-time classroom collaboration, live code editing, and chat.
- **Global CDN**: Vercel serves the Next.js frontend with sub-second response times.

---

## Step 1: Create Your Free Neon PostgreSQL Database

1. Go to **[https://neon.tech](https://neon.tech)** and sign up / log in (free tier).
2. Click **Create Project**:
   - **Project Name**: `mentorx-db` (or any name)
   - **Postgres Version**: 15 or 16 (default)
   - **Region**: Choose the region closest to you or closest to Render (e.g. `US East / Ohio` or `Frankfurt`).
3. Click **Create Project**.
4. On your project dashboard, locate the **Connection Details** box.
5. Select **Connection String** and make sure **Pooled connection** is unchecked (or check it; both work).
6. Copy the connection string. It looks like:
   ```text
   postgresql://<user>:<password>@<ep-xyz>.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > 💡 Save this connection string as your `DATABASE_URL`.

---

## Step 2: Deploy Backend to Render

1. Go to **[https://render.com](https://render.com)** and sign in with GitHub.
2. In the dashboard, click **New +** ➔ **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your repository: `YSKKAM/MentorX`.
4. Configure the service settings:
   - **Name**: `mentorx-backend` (or any unique name)
   - **Region**: Match or pick close to your Neon database region (e.g., `Ohio (US East)`).
   - **Branch**: `main`
   - **Root Directory**: `apps/server` *(crucial!)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add the following:

   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `3001` | Server port |
   | `DATABASE_URL` | *`your_neon_connection_string_here`* | Paste from Step 1 |
   | `JWT_SECRET` | *`generate_a_random_32_char_secret_key`* | e.g. `d7f8a9e2c4b610385920efad12345678` |
   | `ENCRYPTION_KEY` | *`generate_a_32_byte_hex_key`* | e.g. `0123456789abcdef0123456789abcdef` |
   | `CLIENT_URL` | `https://*.vercel.app` | Allows your Vercel domains |

   *(Optional: If you plan to use Gemini AI features globally, also add `GEMINI_API_KEY`)*

6. Click **Deploy Web Service**.
7. Wait 2-3 minutes for the build to finish. In the deployment logs, you should see:
   ```text
   Migration applied: 001_init.sql
   ...
   Database initialized successfully
   Server is running on port 3001
   ```
8. Copy your Render service URL from the top of the page (e.g., `https://mentorx-backend.onrender.com`).
   > 💡 Test health check by visiting `https://mentorx-backend.onrender.com/api/health` in your browser. It should return: `{"status":"ok"}`.

---

## Step 3: Deploy Frontend to Vercel

1. Go to **[https://vercel.com](https://vercel.com)** and log in with your GitHub account.
2. Click **Add New...** ➔ **Project**.
3. Import the `YSKKAM/MentorX` repository.
4. In the **Configure Project** screen:
   - **Project Name**: `mentorx-web`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `apps/web` *(crucial!)*
5. Expand the **Environment Variables** section and add:

   | Key | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://mentorx-backend.onrender.com/api` *(replace with your Render URL)* |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://mentorx-backend.onrender.com` *(replace with your Render URL)* |

   > ⚠️ Make sure to use `https://`, not `http://`!

6. Click **Deploy**.
7. Vercel will build and deploy the frontend in under 1 minute.
8. Once completed, click **Visit** to open your live application (e.g., `https://mentorx-web.vercel.app`)!

---

## Step 4: Verification & Smoke Test Checklist

Once both services are live:

1. **Backend Health Check**:
   - Visit: `https://<your-render-app>.onrender.com/api/health`
   - Expected response: `{"status":"ok"}`.

2. **Frontend UI**:
   - Open your Vercel URL in your browser.
   - Verify that the landing page renders smoothly.

3. **User Authentication**:
   - Click **Register** and create a new Teacher or Student account.
   - Verify that you are redirected to the dashboard.
   - Log out and log back in to verify JWT authentication.

4. **Classroom & Real-Time WebSockets**:
   - Create a classroom or join with code.
   - Open a second browser tab (or Incognito window) logged in as a student and join the same classroom.
   - Send a message in the chat and verify instant delivery on both tabs.

---

## Note on Free Tier "Cold Starts"

- **Render Free Tier**: The Web Service will spin down after 15 minutes of inactivity. When a new request arrives, it takes ~30-50 seconds to wake up (spin back up). Subsequent requests will be instant.
- **Neon Free Tier**: Neon databases scale down compute to zero when idle and wake up in ~500ms on first query.
