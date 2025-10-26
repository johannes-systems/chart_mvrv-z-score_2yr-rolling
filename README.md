# MVRV Z-Score 2YR Rolling Window - Cloudflare Worker

Cloudflare Worker serving Bitcoin MVRV Z-Score with **2-year rolling window** calculation for more reactive market analysis.

## Key Difference: 2YR Rolling vs Standard Z-Score

```
Standard Z-Score: (MVRV - mean_all_history) / stddev_all_history
2YR Rolling:      (MVRV - mean_last_730_days) / stddev_last_730_days
```

The 2-year rolling window makes the indicator more responsive to recent market conditions.

## Architecture

```
Worker → KV Cache (24hr TTL) → JSON API → Frontend (React + Recharts)
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create KV Namespace

```bash
# Create production KV namespace
npx wrangler kv namespace create MVRV_CACHE

# Create development KV namespace (optional)
npx wrangler kv namespace create MVRV_CACHE --preview
```

Copy the namespace ID from the output and update `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "MVRV_CACHE",
    "id": "YOUR_NAMESPACE_ID_HERE"
  }
]
```

### 3. Local Development

```bash
npm run dev
```

Access the worker at `http://localhost:8787`

### 4. Test Cron Trigger

```bash
npm run test-cron
# Then trigger: curl "http://localhost:8787/__scheduled?cron=0+2+*+*+*"
```

## Deployment

```bash
npm run deploy
```

Your worker will be available at: `https://mvrv-2yr-rolling.YOUR_SUBDOMAIN.workers.dev`

## API Endpoints

### `GET /api/mvrv-2yr`

Returns complete 2YR rolling Z-Score dataset.

**Response:**
```json
{
  "window": "730d",
  "lastUpdate": "2025-10-26T02:00:00Z",
  "data": [
    { "date": "2012-07-18", "zscore": 0.12, "mvrv": 1.02 },
    { "date": "2025-10-26", "zscore": 1.99, "mvrv": 1.65 }
  ]
}
```

## KV Cache Structure

### `mvrv_2yr_rolling`
- **TTL**: 24 hours
- **Content**: Complete rolling Z-Score dataset
- **Updated**: Daily at 2 AM UTC (via cron) or on-demand

### `mvrv_historical_values`
- **TTL**: 7 days
- **Content**: Historical MVRV values for calculations
- **Source**: bitcoinisdata.com or similar

## Data Notes

- **First datapoint**: ~July 2012 (requires 2 years of prior MVRV data)
- **Window**: 730 days (exactly 2 years)
- **Each point**: Requires previous 730 days to calculate
- **More reactive**: Compared to standard all-time Z-Score

## Frontend Integration Example

```jsx
import { LineChart, Line, ReferenceLine, ReferenceArea } from 'recharts';

// Color zones for visualization
<ReferenceLine y={0} stroke="gray" />
<ReferenceArea y1={-Infinity} y2={0.1} fill="green" opacity={0.1} />
<ReferenceArea y1={7} y2={Infinity} fill="red" opacity={0.1} />
```

## TODO

1. Implement data fetching from bitcoinisdata.com
2. Load static pre-calculated dataset into KV
3. Set up monitoring and alerts
4. Add custom domain routing (optional)

## Cost

**Free tier** - Cloudflare Workers includes:
- 100,000 requests/day
- Unlimited bandwidth
- KV operations included

## License

MIT
