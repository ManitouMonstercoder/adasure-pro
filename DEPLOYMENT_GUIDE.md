# AdaSure Pro - Deployment Guide

## 🚀 Complete Deployment Setup

### Step 1: Create GitHub Repository
1. Go to GitHub.com → Create new repository
2. Repository name: `adasure-pro` (or your preferred name)
3. Set to **Public** (required for GitHub Pages)
4. Don't initialize with README

### Step 2: Connect Local Repository to GitHub
```bash
cd "C:\Users\fidel\Desktop\imfrolic"
git remote add origin https://github.com/YOUR_USERNAME/adasure-pro.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository → Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `gh-pages` (will be created automatically by GitHub Actions)
4. Your site will be available at: `https://YOUR_USERNAME.github.io/adasure-pro`

### Step 4: Update Environment URLs
Replace `YOUR_USERNAME` with your actual GitHub username in `.env`:

```env
# Frontend URL (GitHub Pages)
APP_URL=https://YOUR_USERNAME.github.io/adasure-pro

# API URL (Cloudflare Worker)
API_BASE_URL=https://adasure-api.YOUR_SUBDOMAIN.workers.dev
CLOUDFLARE_WORKERS_URL=https://adasure-api.YOUR_SUBDOMAIN.workers.dev
```

### Step 5: Deploy Cloudflare Worker
```bash
cd Accessibility
npx wrangler login
npx wrangler deploy
```

### Step 6: Configure Stripe Webhooks
**Webhook Endpoint URL:** `https://adasure-api.YOUR_SUBDOMAIN.workers.dev/payments/webhook`

**Events to listen for:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Step 7: Set GitHub Secrets
Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `JWT_SECRET`: Your JWT secret key
- `SENDPULSE_API_SECRET`: Your SendPulse API secret

## 🔗 Final URLs Structure

### Frontend (GitHub Pages)
- **Landing Page**: `https://YOUR_USERNAME.github.io/adasure-pro`
- **Login**: `https://YOUR_USERNAME.github.io/adasure-pro/login.html`
- **Signup**: `https://YOUR_USERNAME.github.io/adasure-pro/signup.html`
- **Dashboard**: `https://YOUR_USERNAME.github.io/adasure-pro/dashboard.html`

### API (Cloudflare Workers)
- **Base API**: `https://adasure-api.YOUR_SUBDOMAIN.workers.dev`
- **Auth Endpoints**: `https://adasure-api.YOUR_SUBDOMAIN.workers.dev/auth/*`
- **Payment Endpoints**: `https://adasure-api.YOUR_SUBDOMAIN.workers.dev/payments/*`
- **Stripe Webhook**: `https://adasure-api.YOUR_SUBDOMAIN.workers.dev/payments/webhook`

## 📊 Monitoring & Analytics

### Free Monitoring Tools
- **Cloudflare Analytics**: Built into Workers dashboard
- **GitHub Actions**: Deployment status and logs
- **Stripe Dashboard**: Payment and subscription analytics

### Usage Limits (Free Tier)
- **Cloudflare Workers**: 100,000 requests/day
- **Cloudflare KV**: 100 operations/second
- **Cloudflare D1**: 100,000 reads/writes per day
- **Cloudflare R2**: 10GB storage
- **GitHub Pages**: 100GB bandwidth/month

## 🎯 Next Steps After Deployment

1. **Test the signup flow**: Create test account
2. **Test Stripe integration**: Use test card numbers
3. **Verify emails**: Check SendPulse delivery
4. **Monitor usage**: Watch Cloudflare dashboard
5. **Custom domain**: Point your domain to GitHub Pages (optional)

## 💡 Pro Tips

- Use Cloudflare's free SSL for custom domains
- Monitor your free tier usage in Cloudflare dashboard
- Set up alerts for approaching limits
- Use Stripe test mode during development