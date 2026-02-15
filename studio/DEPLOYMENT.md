# Xitolaunch - Deployment Guide

> Last Updated: 2026-02-15

Deployment guide for **Vercel** (frontend) + **Railway** (backend + PostgreSQL).

---

## Architecture

```
[Users] --> [Vercel - Next.js Frontend] --> [Railway - Express Backend] --> [Railway - PostgreSQL]
                                                      |
                                                      +--> [Stripe API]
                                                      +--> [Resend Email API]
```

Optional (recommended for production):

```
[Users] --> [Cloudflare DNS/CDN] --> [Vercel] --> [Railway]
```

---

## Quick Start (Testing / Free Tier)

### 1. Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** > **"Deploy from GitHub Repo"**
3. Select your repo and set the root directory to `studio/backend`
4. Railway auto-detects the Dockerfile

**Add a PostgreSQL database:**

1. In your Railway project, click **"+ New"** > **"Database"** > **"PostgreSQL"**
2. Railway auto-provisions and sets `DATABASE_URL`

**Set environment variables** (in Railway dashboard > Variables):

| Variable                 | Value                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Auto-set by Railway PostgreSQL                                                         |
| `PORT`                   | `3003`                                                                                 |
| `NODE_ENV`               | `production`                                                                           |
| `JWT_SECRET`             | Generate: `openssl rand -base64 48`                                                    |
| `CORS_ORIGIN`            | Your Vercel URL (e.g., `https://studio.vercel.app`)                                    |
| `STRIPE_SECRET_KEY`      | From Stripe dashboard (use test keys for testing)                                      |
| `STRIPE_WEBHOOK_SECRET`  | From Stripe webhook setup                                                              |
| `STRIPE_PUBLISHABLE_KEY` | From Stripe dashboard                                                                  |
| `STRIPE_SUCCESS_URL`     | `https://your-vercel-url.vercel.app/checkout/success?session_id={CHECKOUT_SESSION_ID}` |
| `STRIPE_CANCEL_URL`      | `https://your-vercel-url.vercel.app/checkout?cancelled=true`                           |
| `ADMIN_EMAIL`            | Your admin email                                                                       |
| `ADMIN_PASSWORD`         | Strong password for admin login                                                        |

Optional (add when ready):
| Variable | Value |
|---|---|
| `RESEND_API_KEY` | From resend.com dashboard |
| `EMAIL_FROM` | `noreply@yourdomain.com` |

5. Deploy triggers automatically. Railway runs `docker-entrypoint.sh` which:
   - Runs `prisma migrate deploy`
   - Seeds the database
   - Starts the Express server

6. Note your Railway backend URL (e.g., `https://studio-backend-production.up.railway.app`)

### 2. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"** > Import your repo
3. Set **Root Directory** to `studio/web`
4. Vercel auto-detects Next.js

**Set environment variables** (in Vercel dashboard > Settings > Environment Variables):

| Variable                             | Value                                         |
| ------------------------------------ | --------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                | `https://your-railway-url.up.railway.app/api` |
| `NEXT_PUBLIC_APP_URL`                | `https://your-vercel-url.vercel.app`          |
| `NEXT_PUBLIC_APP_NAME`               | `Xitolaunch`                                  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | From Stripe dashboard                         |

5. Click Deploy. Vercel builds and deploys automatically.

### 3. Post-Deploy Checklist

- [ ] Visit your Vercel URL - homepage should load
- [ ] Visit `/configure` - feature configurator should work
- [ ] Click "Preview App" - should open preview in new tab
- [ ] Check `/login` - admin login should work with your ADMIN_EMAIL/PASSWORD
- [ ] Update `CORS_ORIGIN` on Railway to match your actual Vercel URL
- [ ] Set up Stripe webhooks pointing to `https://your-railway-url.up.railway.app/api/checkout/webhook`

---

## Capacity Planning & When to Upgrade

### Free Tier Capacity

| Resource          | Vercel Free        | Railway Free         | Combined Capacity                 |
| ----------------- | ------------------ | -------------------- | --------------------------------- |
| **Bandwidth**     | 100 GB/month       | 100 GB/month         | ~50,000-100,000 page views/month  |
| **Compute**       | 100 hrs serverless | $5 credit (~500 hrs) | Handles ~100-500 concurrent users |
| **Database**      | N/A                | 1 GB storage         | ~50,000-100,000 rows              |
| **Build minutes** | 6,000 min/month    | Included             | Plenty for testing                |
| **RAM**           | Serverless (auto)  | 512 MB               | Sufficient for light use          |
| **CPU**           | Shared             | Shared               | Handles ~10-50 req/sec            |

**Free tier handles approximately:**

- 100-500 registered users
- 1,000-5,000 configurator sessions/month
- 100-500 preview sessions/month
- 10-50 orders/month
- Database up to ~50,000 records total

**Free tier limitations:**

- Railway: Services sleep after inactivity on free plan (cold starts ~5-10 sec)
- Vercel: No team features, limited analytics
- No automated database backups
- Shared infrastructure (noisy neighbors)
- Railway: $5 credit runs out in ~2-3 weeks of continuous use

### When to Upgrade to Launch ($40/month)

**Upgrade when ANY of these happen:**

- Railway $5 credit runs out (usually within first month)
- You get your first paying customer
- You need always-on backend (no cold starts)
- Database exceeds 1 GB
- You need a custom domain with SSL

| Resource      | Vercel Pro ($20/mo)              | Railway Pro ($20/mo)           | Combined                   |
| ------------- | -------------------------------- | ------------------------------ | -------------------------- |
| **Bandwidth** | 1 TB/month                       | Unlimited                      | ~500K-1M page views/month  |
| **Compute**   | Unlimited serverless             | 8 GB RAM, dedicated            | ~200-1000 concurrent users |
| **Database**  | N/A                              | 10 GB+ storage                 | ~500K-1M rows              |
| **Builds**    | Unlimited                        | Unlimited                      | Fast CI/CD                 |
| **Features**  | Team, analytics, preview deploys | Auto-scaling, priority support | Production-ready           |

**Launch tier handles approximately:**

- 1,000-10,000 registered users
- 10,000-50,000 configurator sessions/month
- 1,000-5,000 preview sessions/month
- 100-1,000 orders/month
- Database up to ~1M records

### When to Upgrade to Growing ($60-100/month)

**Upgrade when ANY of these happen:**

- Backend CPU/RAM consistently above 70%
- Database exceeds 10 GB or queries slow down
- Need database replicas (read scaling)
- Need multiple environments (staging + production)
- More than 50 orders/day

| Resource                | What to add                                                   | Cost       |
| ----------------------- | ------------------------------------------------------------- | ---------- |
| **Database**            | Upgrade to larger Railway PostgreSQL plan                     | +$20-40/mo |
| **Backend replicas**    | Scale to 2 replicas for high availability                     | +$20/mo    |
| **Staging environment** | Duplicate Railway project                                     | +$20/mo    |
| **Monitoring**          | Add Sentry ($26/mo) or use Vercel Analytics (included in Pro) | $0-26/mo   |

**Growing tier handles approximately:**

- 10,000-100,000 registered users
- 50,000-200,000 configurator sessions/month
- 5,000-20,000 preview sessions/month
- 500-5,000 orders/month
- Database up to ~10M records

### When to Upgrade to Scale (custom)

**Upgrade when ANY of these happen:**

- Need 99.99% uptime SLA
- Database exceeds 50 GB
- Need multi-region deployment
- Processing >5,000 orders/month
- Need SOC 2 / HIPAA compliance
- Backend handling >500 req/sec sustained

**Options at scale:**

1. **Stay on Vercel + Railway** - Railway supports auto-scaling, larger plans
2. **Migrate backend to AWS** - ECS Fargate + RDS PostgreSQL for full control
3. **Migrate everything to AWS/GCP** - Maximum control, compliance-ready

| Resource     | Vercel Enterprise   | AWS (ECS + RDS)           | Cost          |
| ------------ | ------------------- | ------------------------- | ------------- |
| **Frontend** | Custom pricing, SLA | CloudFront + S3 + ECS     | $200-500/mo   |
| **Backend**  | N/A                 | ECS Fargate (auto-scale)  | $100-500/mo   |
| **Database** | N/A                 | RDS Multi-AZ, auto-backup | $100-400/mo   |
| **Total**    |                     |                           | $400-1,400/mo |

---

## Cloudflare Setup (Recommended for Production)

> Note: Cloudflare requires a credit card for account creation, but the free plan costs $0.

### Why Cloudflare

| Benefit             | Details                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| **DDoS Protection** | Free, automatic, handles massive attacks                                  |
| **CDN**             | 300+ edge locations, caches static assets globally                        |
| **SSL**             | Free SSL certificates, auto-renewed                                       |
| **DNS**             | Fast DNS resolution (~11ms avg)                                           |
| **Bot Protection**  | Basic bot filtering on free tier                                          |
| **Analytics**       | Free web analytics (no JS required)                                       |
| **Future-proof**    | If you swap Railway for AWS later, just update the origin - zero downtime |

### Cloudflare Free Tier Limits

| Resource             | Free Tier         |
| -------------------- | ----------------- |
| **DNS queries**      | Unlimited         |
| **CDN bandwidth**    | Unlimited         |
| **DDoS protection**  | Unlimited         |
| **SSL certificates** | Unlimited         |
| **Page rules**       | 3                 |
| **Firewall rules**   | 5                 |
| **Workers**          | 100K requests/day |

### Setup Steps (When Ready)

1. **Create Cloudflare account** at [cloudflare.com](https://cloudflare.com) (requires credit card, $0 charge)

2. **Add your domain** - Cloudflare scans existing DNS records

3. **Update nameservers** - Point your domain registrar to Cloudflare nameservers

4. **Configure DNS records:**

   ```
   # Frontend (Vercel)
   Type: CNAME
   Name: studio (or @)
   Target: cname.vercel-dns.com
   Proxy: ON (orange cloud)

   # Backend API (Railway)
   Type: CNAME
   Name: api
   Target: your-app.up.railway.app
   Proxy: ON (orange cloud)
   ```

5. **SSL Settings:**
   - SSL/TLS mode: **Full (strict)**
   - Always Use HTTPS: **ON**
   - Minimum TLS Version: **1.2**

6. **Caching rules** (Page Rules or Cache Rules):

   ```
   # Cache static assets aggressively
   studio.yourdomain.com/static/*  -> Cache Level: Cache Everything, Edge TTL: 1 month
   studio.yourdomain.com/_next/*   -> Cache Level: Cache Everything, Edge TTL: 1 month

   # Never cache API or dynamic pages
   api.yourdomain.com/*            -> Cache Level: Bypass
   studio.yourdomain.com/admin/*   -> Cache Level: Bypass
   ```

7. **Update environment variables:**

   On Railway (backend):

   ```
   CORS_ORIGIN=https://studio.yourdomain.com
   STRIPE_SUCCESS_URL=https://studio.yourdomain.com/checkout/success?session_id={CHECKOUT_SESSION_ID}
   STRIPE_CANCEL_URL=https://studio.yourdomain.com/checkout?cancelled=true
   ```

   On Vercel (frontend):

   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
   NEXT_PUBLIC_APP_URL=https://studio.yourdomain.com
   ```

### Without Cloudflare (For Now)

If you skip Cloudflare for testing, you still get:

- **Vercel**: Built-in DDoS protection + CDN + SSL on `*.vercel.app` domains
- **Railway**: SSL on `*.up.railway.app` domains

This is fine for testing and early launch. Add Cloudflare when you set up a custom domain.

---

## Environment Variable Reference

### Backend (Railway)

| Variable                 | Required | Description                                        |
| ------------------------ | -------- | -------------------------------------------------- |
| `DATABASE_URL`           | Yes      | Auto-set by Railway PostgreSQL addon               |
| `PORT`                   | Yes      | `3003` (or Railway auto-assigns)                   |
| `NODE_ENV`               | Yes      | `production`                                       |
| `JWT_SECRET`             | Yes      | Min 32 chars. Generate: `openssl rand -base64 48`  |
| `CORS_ORIGIN`            | Yes      | Your Vercel frontend URL                           |
| `STRIPE_SECRET_KEY`      | Yes      | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET`  | Yes      | Stripe webhook signing secret                      |
| `STRIPE_PUBLISHABLE_KEY` | Yes      | Stripe publishable key                             |
| `STRIPE_SUCCESS_URL`     | Yes      | Checkout success redirect URL                      |
| `STRIPE_CANCEL_URL`      | Yes      | Checkout cancel redirect URL                       |
| `ADMIN_EMAIL`            | Yes      | Admin login email                                  |
| `ADMIN_PASSWORD`         | Yes      | Admin login password (use strong password)         |
| `RESEND_API_KEY`         | No       | Resend email API key (emails disabled without it)  |
| `EMAIL_FROM`             | No       | Sender email address                               |
| `S3_ENDPOINT`            | No       | S3-compatible storage endpoint                     |
| `S3_BUCKET`              | No       | Storage bucket name                                |
| `S3_ACCESS_KEY`          | No       | Storage access key                                 |
| `S3_SECRET_KEY`          | No       | Storage secret key                                 |

### Frontend (Vercel)

| Variable                             | Required | Description                    |
| ------------------------------------ | -------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL`                | Yes      | Railway backend URL + `/api`   |
| `NEXT_PUBLIC_APP_URL`                | Yes      | Your Vercel frontend URL       |
| `NEXT_PUBLIC_APP_NAME`               | No       | App name (default: Xitolaunch) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes      | Stripe publishable key         |
| `NEXT_PUBLIC_GA_TRACKING_ID`         | No       | Google Analytics ID            |
| `NEXT_PUBLIC_POSTHOG_KEY`            | No       | PostHog analytics key          |

---

## Monitoring & Alerts

### Free Monitoring Options

| Tool                 | What it monitors                    | Cost                |
| -------------------- | ----------------------------------- | ------------------- |
| **Vercel Analytics** | Frontend performance, Web Vitals    | Included in Pro     |
| **Railway Metrics**  | CPU, RAM, network                   | Included            |
| **UptimeRobot**      | Endpoint uptime (5-min checks)      | Free (50 monitors)  |
| **Sentry**           | Error tracking (frontend + backend) | Free (5K events/mo) |

### Recommended Setup

1. **UptimeRobot** (free): Monitor these endpoints:
   - `https://your-vercel-url.vercel.app/api/health` (frontend)
   - `https://your-railway-url.up.railway.app/health` (backend)

2. **Sentry** (free tier): Add error tracking when you start getting real users

---

## Troubleshooting

### Common Issues

| Issue                   | Cause                        | Fix                                            |
| ----------------------- | ---------------------------- | ---------------------------------------------- |
| CORS errors             | `CORS_ORIGIN` mismatch       | Set exact Vercel URL (no trailing slash)       |
| 502 on backend          | Service still starting       | Wait 30s, check Railway logs                   |
| DB connection refused   | `DATABASE_URL` wrong         | Use Railway-provided connection string         |
| Stripe webhooks fail    | Wrong webhook URL            | Point to Railway URL + `/api/checkout/webhook` |
| Preview not loading     | `NEXT_PUBLIC_API_URL` wrong  | Must include `/api` suffix                     |
| Admin login fails       | Seed not run                 | Check Railway logs for seed output             |
| Cold starts (free tier) | Railway sleeps idle services | Upgrade to Pro or use UptimeRobot to ping      |

### Checking Logs

```bash
# Railway CLI (install: npm i -g @railway/cli)
railway logs

# Vercel CLI (install: npm i -g vercel)
vercel logs your-project-url
```

---

## Cost Summary

| Stage              | Monthly Cost | Trigger to Upgrade                                |
| ------------------ | ------------ | ------------------------------------------------- |
| **Testing** (Free) | $0           | Railway credit depletes, or first paying customer |
| **Launch** (Pro)   | ~$40         | Backend CPU >70%, DB >10GB, need staging env      |
| **Growing**        | ~$60-100     | >50 orders/day, need replicas, need compliance    |
| **Scale**          | ~$400-1,400  | >500 req/sec, need SLA, multi-region              |
