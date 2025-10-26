# MVRV Z-Score 2YR Rolling Window API

**Free Bitcoin market analysis API** serving MVRV Z-Score with a **2-year rolling window** for more reactive market insights.

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Cost](https://img.shields.io/badge/cost-$0%20forever-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## What is This?

A Cloudflare Worker that calculates and serves Bitcoin's MVRV Z-Score using a **730-day rolling window** instead of all-time history, making it more reactive to recent market conditions.

### Key Difference

```
Standard Z-Score: (MVRV - mean_all_history) / stddev_all_history  ← Uses entire history
2YR Rolling:      (MVRV - mean_last_730_days) / stddev_last_730_days  ← Last 2 years only
```

**Result**: More responsive to recent market trends vs. standard indicator.

## Features

- ✅ **Free Forever** - Runs on Cloudflare Workers free tier + free Coin Metrics API
- ✅ **Fast** - First request: 30-60s, cached requests: <10ms
- ✅ **Reliable** - Daily auto-updates at 2 AM UTC
- ✅ **Global** - Served from 330+ Cloudflare locations worldwide
- ✅ **CORS Enabled** - Ready for frontend integration
- ✅ **Type-Safe** - Full TypeScript implementation

## Quick Start (8 minutes)

### 1. Install & Login (2 min)

```bash
npm install
npx wrangler login  # Opens browser to authenticate
```

### 2. Create KV Namespace (1 min)

```bash
npx wrangler kv namespace create MVRV_CACHE
```

Copy the `id` from output and update `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  { "binding": "MVRV_CACHE", "id": "YOUR_ID_HERE" }
]
```

### 3. Test Locally (2 min)

```bash
npm run dev
# Visit: http://localhost:8787/api/mvrv-2yr
```

### 4. Deploy (1 min)

```bash
npm run deploy
```

🎉 **Done!** Your API is live at `https://mvrv-2yr-rolling.YOUR_SUBDOMAIN.workers.dev`

**Need help?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## API Usage

### Endpoint

```
GET https://YOUR_WORKER.workers.dev/api/mvrv-2yr
```

### Response Example

```json
{
  "window": "730d",
  "lastUpdate": "2025-10-26T02:00:00Z",
  "data": [
    { "date": "2014-09-23", "zscore": 0.12, "mvrv": 1.02 },
    { "date": "2025-10-26", "zscore": 1.99, "mvrv": 1.65 }
  ]
}
```

### Data Points

- **~3,970 data points** from 2014 to present
- **Updates**: Daily at 2 AM UTC automatically
- **Cache**: 24-hour TTL for instant responses

## Frontend Integration

### React + Recharts Example

```jsx
import { LineChart, Line, ReferenceLine, ReferenceArea } from 'recharts';

function MVRVChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('https://YOUR_WORKER.workers.dev/api/mvrv-2yr')
      .then(res => res.json())
      .then(json => setData(json.data));
  }, []);

  return (
    <LineChart width={800} height={400} data={data}>
      {/* Green zone: Undervalued */}
      <ReferenceArea y1={-Infinity} y2={0.1} fill="green" opacity={0.1} />

      {/* Reference line */}
      <ReferenceLine y={0} stroke="gray" />

      {/* Red zone: Overvalued */}
      <ReferenceArea y1={7} y2={Infinity} fill="red" opacity={0.1} />

      <Line type="monotone" dataKey="zscore" stroke="#8884d8" dot={false} />
    </LineChart>
  );
}
```

**See [FRONTEND-GUIDE.md](./FRONTEND-GUIDE.md) for complete examples.**

## How It Works

1. **Data Source**: Fetches Market Cap & Realized Cap from Coin Metrics (free API)
2. **Calculate MVRV**: Market Cap ÷ Realized Cap for each day
3. **Rolling Z-Score**: For each day, calculates Z-Score using last 730 days
4. **Cache**: Stores result in KV for 24 hours
5. **Auto-Update**: Cron runs daily at 2 AM UTC to refresh

## Performance

| Metric | Value |
|--------|-------|
| First Request | 30-60 seconds (calculates ~3,970 points) |
| Cached Requests | <10ms (served from KV) |
| Cache Duration | 24 hours |
| Update Schedule | Daily at 2 AM UTC |
| Global Availability | 330+ Cloudflare locations |

## Cost Breakdown

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| Cloudflare Workers | 100,000 req/day | ~1,000-10,000/day | $0 |
| KV Reads | 100,000/day | ~1,000/day | $0 |
| KV Writes | 1,000/day | 1/day (cron) | $0 |
| Coin Metrics API | Unlimited | ~5 req/day | $0 |
| **Total** | - | - | **$0/month** |

## Project Structure

```
src/
├── index.ts          # Main worker (fetch & scheduled handlers)
├── types.ts          # TypeScript interfaces
├── calculator.ts     # Z-Score calculation logic
└── data-fetcher.ts   # Coin Metrics API integration

config/
├── wrangler.jsonc    # Cloudflare Worker configuration
├── tsconfig.json     # TypeScript settings
└── package.json      # Dependencies

docs/
├── DEPLOYMENT.md                 # Step-by-step deployment guide
├── API-TESTING-RESULTS.md       # Verified API test results
├── NEXT-STEPS.md                # Quick start instructions
├── IMPLEMENTATION-SUMMARY.md    # Feature verification checklist
└── FRONTEND-GUIDE.md            # React integration examples
```

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Storage**: Cloudflare KV
- **Scheduling**: Cron Triggers
- **Data Source**: Coin Metrics Community API (free)

## Documentation

| Guide | Description |
|-------|-------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Complete deployment walkthrough |
| [NEXT-STEPS.md](./NEXT-STEPS.md) | Quick 8-minute setup guide |
| [FRONTEND-GUIDE.md](./FRONTEND-GUIDE.md) | React + Recharts integration |
| [API-TESTING-RESULTS.md](./API-TESTING-RESULTS.md) | API verification report |
| [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) | Feature checklist |

## Contributing

Contributions welcome! This project follows minimal code principles - fewer lines are better.

## Support

- 📖 [Documentation](./DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/johannes-systems/chart_mvrv-z-score_2yr-rolling/issues)
- 📧 Contact: Via GitHub issues

## License

MIT - Use freely in any project

---

**Built with ❤️ using Cloudflare Workers** | **Verified against official Cloudflare documentation**
