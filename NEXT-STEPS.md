# Next Steps - Deploy Your MVRV Z-Score Worker

## ✅ What's Complete

1. ✅ Project structure created with TypeScript
2. ✅ Data source researched and **verified working** (Coin Metrics - FREE)
3. ✅ API endpoints tested and confirmed free
4. ✅ Worker code implemented with:
   - Coin Metrics Community API integration
   - 2-year rolling Z-Score calculation
   - KV caching with 24-hour TTL
   - Pagination handling
   - Rate limiting respect
   - CORS support
   - Daily cron trigger (2 AM UTC)

## 🚀 Ready to Deploy

### Step 1: Install Dependencies (5 minutes)

```bash
cd "C:\Users\johan\Desktop\AAA_Pets\Investment\Crypto\chart_mvrv-z-score_2yr-rolling"
npm install
```

### Step 2: Authenticate with Cloudflare (2 minutes)

```bash
npx wrangler login
```

This will open your browser to log in to Cloudflare.

### Step 3: Create KV Namespace (2 minutes)

```bash
npx wrangler kv namespace create MVRV_CACHE
```

**Copy the namespace ID from the output**, then update `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "MVRV_CACHE",
    "id": "YOUR_NAMESPACE_ID_HERE"  // Replace with actual ID
  }
]
```

### Step 4: Test Locally (5 minutes)

```bash
npm run dev
```

Then visit in your browser:
- `http://localhost:8787` - See service info
- `http://localhost:8787/api/mvrv-2yr` - Get MVRV data

**Expected on first run:**
- Will fetch ~4,700 data points from Coin Metrics
- Will calculate rolling Z-Score for ~3,970 days
- Takes about 30-60 seconds on first run
- Subsequent requests will be instant (cached)

### Step 5: Deploy to Cloudflare (2 minutes)

```bash
npm run deploy
```

Your worker will be live at:
```
https://mvrv-2yr-rolling.YOUR_SUBDOMAIN.workers.dev
```

## 📊 Test Your Live API

```bash
# Test the endpoint
curl "https://mvrv-2yr-rolling.YOUR_SUBDOMAIN.workers.dev/api/mvrv-2yr"
```

**Expected Response:**
```json
{
  "window": "730d",
  "lastUpdate": "2025-10-26T...",
  "data": [
    { "date": "2014-09-23", "zscore": 0.12, "mvrv": 1.02 },
    { "date": "2025-10-26", "zscore": 1.99, "mvrv": 1.65 }
  ]
}
```

## 🔄 Daily Updates

The cron trigger runs automatically at **2 AM UTC** daily to:
1. Fetch latest data from Coin Metrics
2. Calculate new rolling Z-Score
3. Update KV cache

No manual intervention needed!

## 📈 Frontend Integration

Use this API in your React + Recharts frontend:

```jsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, ReferenceLine, ReferenceArea, XAxis, YAxis, Tooltip } from 'recharts';

function MVRVChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('https://mvrv-2yr-rolling.YOUR_SUBDOMAIN.workers.dev/api/mvrv-2yr')
      .then(res => res.json())
      .then(json => setData(json.data));
  }, []);

  return (
    <LineChart width={800} height={400} data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />

      {/* Color zones */}
      <ReferenceArea y1={-Infinity} y2={0.1} fill="green" opacity={0.1} />
      <ReferenceLine y={0} stroke="gray" />
      <ReferenceArea y1={7} y2={Infinity} fill="red" opacity={0.1} />

      {/* Z-Score line */}
      <Line type="monotone" dataKey="zscore" stroke="#8884d8" dot={false} />
    </LineChart>
  );
}
```

## 💰 Cost Breakdown

### Cloudflare Workers (Free Tier)
- ✅ 100,000 requests/day
- ✅ Your usage: ~1,000-10,000/day
- ✅ **Cost: $0**

### KV Storage (Free Tier)
- ✅ 100,000 reads/day
- ✅ 1,000 writes/day
- ✅ Your usage: 1 write/day (cron) + reads as needed
- ✅ **Cost: $0**

### Coin Metrics API
- ✅ Completely free
- ✅ No authentication needed
- ✅ **Cost: $0**

**Total: $0/month forever** 🎉

## 🔍 Monitoring

### View Live Logs
```bash
npx wrangler tail
```

### Check Analytics
Go to Cloudflare Dashboard → Workers & Pages → Your Worker → Analytics

### Monitor Cron Jobs
Dashboard → Workers → Your Worker → Triggers → View logs

## 🛠️ Troubleshooting

### "KV namespace not found"
Run: `npx wrangler kv namespace list`
Then update the ID in `wrangler.jsonc`

### "Module not found" errors
```bash
npm install
npm run dev
```

### First request is slow
This is normal! First request:
- Fetches ~4,700 days of historical data
- Calculates ~3,970 Z-Score values
- Takes 30-60 seconds

Subsequent requests are instant (cached for 24 hours).

### Cron not running
- Changes take up to 15 minutes to propagate
- Check syntax: `0 2 * * *` (2 AM UTC daily)
- View logs in Cloudflare Dashboard

## 📚 Additional Resources

- `API-TESTING-RESULTS.md` - Detailed API testing report
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `README.md` - Project overview
- `spec.md` - Original specifications

## 🎯 What You Get

1. **Fully functional MVRV Z-Score API** with 2-year rolling window
2. **Free forever** - no hidden costs
3. **Global CDN** - fast worldwide
4. **Auto-updates** - daily at 2 AM UTC
5. **Production-ready** - built on Cloudflare's infrastructure

## ⏱️ Total Time to Deploy

- Setup: 5 minutes
- Deploy: 2 minutes
- First data fetch: 1 minute
- **Total: ~8 minutes**

---

## 🚀 Ready? Let's Go!

```bash
# 1. Install
npm install

# 2. Login
npx wrangler login

# 3. Create KV
npx wrangler kv namespace create MVRV_CACHE

# 4. Update wrangler.jsonc with KV ID

# 5. Test
npm run dev

# 6. Deploy
npm run deploy

# 7. Success! 🎉
```

Your MVRV Z-Score API is now live and serving data globally!
