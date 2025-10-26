# Quick Start - MVRV 2YR Rolling Z-Score

## TL;DR - Best Free Source

**USE: Coin Metrics Community API**
- URL: `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics`
- Cost: **FREE** (no API key needed)
- Has: Market Cap + Realized Cap (everything we need)
- Must: Calculate MVRV and rolling Z-Score ourselves

---

## Working API Call

```bash
# Fetch Bitcoin Market Cap and Realized Cap
curl "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapRealUSD,CapMrktCurUSD&frequency=1d&start_time=2010-01-01&format=json"
```

**Returns:**
```json
{
  "data": [
    {
      "asset": "btc",
      "time": "2024-01-01T00:00:00.000000000Z",
      "CapMrktCurUSD": "850000000000",
      "CapRealUSD": "550000000000"
    }
  ]
}
```

---

## Why Not Other Sources?

| Source | Status | Issue |
|--------|--------|-------|
| Glassnode | ❌ | API only for $1,000+/year plans |
| bitcoinisdata.com | ❌ | Requires paid subscription |
| Bitcoin Magazine Pro | ❌ | $1,188/year for 2YR rolling chart |
| CoinGecko | ❌ | No Realized Cap metric |

---

## Calculation (Simple)

```javascript
// 1. Calculate MVRV
const mvrv = marketCap / realizedCap;

// 2. For each day, get last 730 days of MVRV
const last730Days = mvrvArray.slice(i - 729, i + 1);

// 3. Calculate rolling mean
const mean = last730Days.reduce((a,b) => a+b) / 730;

// 4. Calculate rolling standard deviation
const variance = last730Days.reduce((sum, val) =>
  sum + Math.pow(val - mean, 2), 0) / 730;
const stddev = Math.sqrt(variance);

// 5. Calculate Z-Score
const zscore = (mvrvToday - mean) / stddev;
```

---

## Key Numbers

- **Data starts:** 2010 (Bitcoin genesis + 1 year)
- **First valid Z-Score:** July 2012 (need 730 days prior)
- **Update frequency:** Daily (24-hour resolution)
- **Rate limit:** 10 requests per 6 seconds (plenty for daily updates)
- **Cost:** $0 forever

---

## Implementation Timeline

1. **Hour 1:** Write calculation function + test
2. **Hour 2:** Build Cloudflare Worker with caching
3. **Hour 3:** Create KV namespace + deploy
4. **Hour 4:** Frontend with Recharts (optional)

**Total:** 3-4 hours for complete implementation

---

## Read Full Report

See `DATA-SOURCE-RESEARCH-REPORT.md` for:
- Detailed verification of all sources
- Working API examples
- Complete calculation logic
- Backup strategies
- Code snippets
