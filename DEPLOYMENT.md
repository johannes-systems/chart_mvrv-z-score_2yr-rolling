# Deployment Guide

Step-by-step guide to deploy the MVRV Z-Score 2YR Rolling Worker to Cloudflare.

## Prerequisites

1. Cloudflare account (free tier works)
2. Node.js installed (v18+)
3. Git (optional, for version control)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Authenticate Wrangler

```bash
npx wrangler login
```

This opens a browser window to authenticate with Cloudflare.

## Step 3: Create KV Namespace

```bash
# Create production KV namespace
npx wrangler kv namespace create MVRV_CACHE
```

**Expected output:**
```
⛅️ wrangler 3.x.x
-------------------
🌀 Creating namespace with title "mvrv-2yr-rolling-MVRV_CACHE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "MVRV_CACHE", id = "abc123def456..." }
```

**Update `wrangler.jsonc`** with your namespace ID:
```jsonc
"kv_namespaces": [
  {
    "binding": "MVRV_CACHE",
    "id": "abc123def456..."  // Use your actual ID
  }
]
```

### Optional: Create Preview Namespace (for development)

```bash
npx wrangler kv namespace create MVRV_CACHE --preview
```

Add preview namespace to `wrangler.jsonc`:
```jsonc
"kv_namespaces": [
  {
    "binding": "MVRV_CACHE",
    "id": "prod_id_here",
    "preview_id": "preview_id_here"
  }
]
```

## Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:8787/api/mvrv-2yr` to test the endpoint.

### Test Cron Trigger Locally

```bash
npm run test-cron
```

Then in another terminal:
```bash
curl "http://localhost:8787/__scheduled?cron=0+2+*+*+*"
```

## Step 5: Upload Static Data (Important!)

Before deploying, you should upload your pre-calculated static dataset to KV:

```bash
# Using Wrangler CLI
npx wrangler kv:key put --namespace-id=YOUR_NAMESPACE_ID "mvrv_2yr_rolling_static" @path/to/static-data.json
```

Or programmatically via the REST API after deployment.

## Step 6: Deploy to Cloudflare

```bash
npm run deploy
```

**Expected output:**
```
⛅️ wrangler 3.x.x
-------------------
Your worker has been deployed!
https://mvrv-2yr-rolling.YOUR_SUBDOMAIN.workers.dev
```

## Step 7: Test Production Deployment

```bash
curl https://mvrv-2yr-rolling.YOUR_SUBDOMAIN.workers.dev/api/mvrv-2yr
```

## Step 8: Verify Cron Trigger

Check in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click "Triggers" tab
4. Verify cron trigger shows: `0 2 * * *` (daily at 2 AM UTC)

## Optional: Configure Custom Domain

### Via Cloudflare Dashboard:

1. Go to Workers & Pages → Your Worker
2. Click "Triggers" tab
3. Scroll to "Custom Domains"
4. Click "Add Custom Domain"
5. Enter: `api.yourdomain.com`
6. Click "Add Custom Domain"

### Via Wrangler:

Add to `wrangler.jsonc`:
```jsonc
"routes": [
  {
    "pattern": "api.yourdomain.com/api/*",
    "zone_name": "yourdomain.com"
  }
]
```

Then redeploy: `npm run deploy`

## Monitoring

### View Logs

```bash
npx wrangler tail
```

### Check Analytics

Cloudflare Dashboard → Workers & Pages → Your Worker → Analytics

### Monitor Cron Executions

Dashboard → Workers → Your Worker → Triggers → View cron logs

## Updating the Worker

1. Make code changes
2. Test locally: `npm run dev`
3. Deploy: `npm run deploy`

Cloudflare automatically handles zero-downtime deployments.

## Troubleshooting

### "KV namespace not found"
- Verify namespace ID in `wrangler.jsonc` matches created namespace
- Run `npx wrangler kv namespace list` to see all namespaces

### "Module not found" errors
- Ensure TypeScript is configured correctly
- Run `npm install` again
- Check `tsconfig.json` settings

### Cron not triggering
- Changes take up to 15 minutes to propagate globally
- Check cron syntax is valid: https://crontab.guru/
- View cron logs in Cloudflare Dashboard

### API returns empty data
- Upload static data to KV first (Step 5)
- Check worker logs: `npx wrangler tail`
- Verify data fetching logic in `src/index.ts`

## Cost Estimate

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- 10ms CPU time per request
- Unlimited bandwidth

**KV Free Tier:**
- 100,000 reads/day
- 1,000 writes/day
- 1 GB storage

**This project on free tier:**
- Cron: 1 write/day (negligible)
- API reads: ~1,000-10,000/day (well within limits)
- **Total cost: $0** (unless you exceed free tier)

## Next Steps

1. Set up monitoring alerts
2. Add custom domain (optional)
3. Implement data source integration
4. Configure CDN caching rules
5. Set up CI/CD with GitHub Actions
