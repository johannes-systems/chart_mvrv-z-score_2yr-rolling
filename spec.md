# MVRV Z-Score 2YR Rolling - Cloudflare Worker Spec

## Purpose
Serve MVRV Z-Score with 2-year rolling window calculation, daily updates

## Key Difference: 2YR Rolling Window
```
Standard Z-Score: (MVRV - mean_all_history) / stddev_all_history
2YR Rolling:      (MVRV - mean_last_730_days) / stddev_last_730_days
```

## Architecture
```
Worker → KV Cache (24hr TTL) → JSON API → React + Recharts
```
Docs: https://bitcoinisdata.com/api_page

## Data Requirements

### Option A: Use Pre-Calculated (Easiest)
**Source**: https://bitcoinisdata.com/mvrv_z_score/
- They have "Rolling Window Z-Score" with adjustable window
- Set window to 730 days (2 years)
- Download their data directly

### Option B: Calculate Yourself
**Need:**
- Historical MVRV ratio values (Market Cap / Realized Cap)
- Calculate rolling mean & stddev over 730-day window
- Apply Z-score formula at each point

## Data Strategy
- **Static**: Pre-calculated 2YR rolling Z-Score (2010 - yesterday)
- **Dynamic**: Today's value (needs last 730 days of MVRV to calculate)
- **Cache**: 24 hours

## Worker Endpoints

### `GET /api/mvrv-2yr`
Returns complete 2YR rolling Z-Score dataset

**Response:**
```json
{
  "window": "730d",
  "lastUpdate": "2025-10-26T00:00:00Z",
  "data": [
    { "date": "2012-07-18", "zscore": 0.12, "mvrv": 1.02 },
    { "date": "2025-10-26", "zscore": 1.99, "mvrv": 1.65 }
  ]
}
```
Note: Data starts in 2012 (need 2 years before first calculation)

## Data Source Options

### Primary: Scrape/Download from bitcoinisdata.com
```
URL: https://bitcoinisdata.com/mvrv_z_score/
Method: 
- Check for JSON/API endpoint
- Or scrape chart data with rolling window = 730
- Or download CSV with 730-day window selected
```

### Fallback: Calculate Yourself
**Requirements:**
1. Get MVRV values (Market Cap / Realized Cap) daily
2. For each day, calculate:
```javascript
   window = last_730_days_of_mvrv
   mean = avg(window)
   stddev = sqrt(variance(window))
   zscore = (mvrv_today - mean) / stddev
```

## Worker Logic
```typescript
1. Check KV: 'mvrv_2yr_rolling'
2. If cached (< 24hrs old) → return
3. If expired:
   a. Fetch historical 2YR rolling data (static backup in KV)
   b. Get latest 730 days of MVRV values
   c. Calculate today's rolling Z-Score:
      - mean(last 730 MVRV values)
      - stddev(last 730 MVRV values)
      - zscore = (MVRV_today - mean) / stddev
   d. Append to dataset
   e. Cache with 24h TTL
4. Return JSON
```

## KV Structure
```
Key: 'mvrv_2yr_rolling'
Value: { window: "730d", lastUpdate, data[] }
TTL: 86400 seconds

Key: 'mvrv_historical_values' (for calculations)
Value: { date, mvrv, marketCap, realizedCap }[]
TTL: 604800 (7 days, less frequent update)
```

## Calculation Example
```javascript
// To calculate today's 2YR rolling Z-Score
const last730Days = mvrvValues.slice(-730);
const mean = last730Days.reduce((a,b) => a+b) / 730;
const variance = last730Days.reduce((a,v) => a + (v-mean)**2, 0) / 730;
const stddev = Math.sqrt(variance);
const zscore = (mvrvToday - mean) / stddev;
```

## Frontend Chart Config
```javascript
// Recharts with color zones
<ReferenceLine y={0} stroke="gray" />
<ReferenceArea y1={-Infinity} y2={0.1} fill="green" opacity={0.1} />
<ReferenceArea y1={7} y2={Infinity} fill="red" opacity={0.1} />
```

## Scheduled Worker (Optional)
```
Cron: 0 2 * * * (2 AM UTC daily)
Action: Pre-calculate and cache
```

## Data Notes
- First datapoint: ~July 2012 (need 2 years prior history)
- Each point needs previous 730 days to calculate
- More reactive to recent market conditions than standard Z-Score

---
**Build time**: 3-4 hours (if calculating) or 2 hours (if using pre-calculated)
**Cost**: $0