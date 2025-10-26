# MVRV Z-Score Data Source Research Report
**Date:** 2025-10-26
**Project:** 2-Year Rolling MVRV Z-Score Cloudflare Worker

---

## Executive Summary

After comprehensive research and verification, **there is NO completely free source for pre-calculated 2-year rolling MVRV Z-Score data**. However, we can **manually calculate** it using free data from Coin Metrics Community API.

### Recommended Approach

**Best Strategy:** Calculate the 2-year rolling Z-Score ourselves using free historical data from **Coin Metrics Community API**.

**Reasoning:**
- Free, no API key required
- Contains both Market Cap and Realized Cap (needed for MVRV)
- Updated daily
- Accessible via HTTP API or GitHub CSV
- Rate limits are generous (10 requests per 6 seconds)

---

## 1. Primary Data Source (RECOMMENDED)

### ✅ Coin Metrics Community API

**Status:** FREE, VERIFIED WORKING

#### API Endpoint
```
https://community-api.coinmetrics.io/v4/timeseries/asset-metrics
```

#### Key Metrics Available (FREE)
- `CapMrktCurUSD` - Market Capitalization in USD
- `CapRealUSD` - Realized Capitalization in USD

#### Example API Call
```
https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapRealUSD,CapMrktCurUSD&frequency=1d&start_time=2010-01-01&format=json
```

#### CSV Export Option
```
https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapRealUSD,CapMrktCurUSD&frequency=1d&format=csv
```

#### GitHub Data Archive (Alternative)
```
https://github.com/coinmetrics/data/blob/master/csv/btc.csv
```
- Updated daily
- Same data as API
- Direct CSV download available
- Note: File is large (>10MB), exceeds WebFetch limit

#### Authentication
- **None required** for community endpoints
- Truly free, no registration needed

#### Rate Limits
- **10 requests per 6 seconds** per IP address
- **10 parallel HTTP requests** maximum

#### Data Format
JSON response structure:
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

#### Historical Data
- Goes back to **2010** (Bitcoin's early days)
- More than enough for 2-year rolling calculations
- Daily frequency (24-hour resolution)

#### Limitations
- No pre-calculated MVRV or Z-Score (must calculate ourselves)
- Daily resolution only (no hourly data on free tier)
- Cannot change frequency below 24h

---

## 2. Alternative Free Sources

### ⚠️ Glassnode API

**Status:** VERY LIMITED FREE ACCESS

#### What They Offer
- MVRV Z-Score metric available: `/v1/metrics/market/mvrv_z_score`
- Market Cap: `/v1/metrics/market/marketcap_usd`
- Realized Cap: `/v1/metrics/market/marketcap_realized_usd`
- MVRV Ratio: `/v1/metrics/market/mvrv`

#### Critical Limitations
- **API access ONLY for Professional plan** subscribers ($1,000+/year)
- Free tier: Web UI only, no API access
- Free tier: Only "Basic" metrics at 24-hour resolution
- Free tier: No CSV/JSON downloads
- MVRV Z-Score is likely a **paid metric** (not in basic tier)

#### Verdict
**NOT VIABLE** for free programmatic access

---

### ❌ bitcoinisdata.com

**Status:** REQUIRES PAID SUBSCRIPTION

#### What They Offer
- MVRV Rolling Window Z-Score charts
- API endpoint: `https://bitcoinisdata.com/api/get_data`
- Supports CSV and JSON formats
- Has 730-day rolling window option (EXACTLY what we need!)

#### Requirements
- **Paid subscription required**
- API key needed (from /accounts/my_account/)
- No free trial mentioned
- Pricing not publicly listed

#### Verdict
**NOT FREE** - Skip this source

---

### ⚠️ Bitcoin Magazine Pro

**Status:** PAID ONLY

#### What They Offer
- Pre-calculated **2YR Rolling MVRV Z-Score** chart
- Exact metric we need!
- URL: `https://www.bitcoinmagazinepro.com/charts/mvrv-zscore-2yr-rolling/`

#### Requirements
- **"Advanced" plan required** (~$1,188/year)
- Chart viewing requires subscription
- May have API access (not verified)

#### Verdict
**NOT FREE** - Data exists but behind paywall

---

### ❌ CoinGecko API

**Status:** NO REALIZED CAP DATA

#### What They Offer
- Free tier: 30 calls/min, 10,000/month
- Market Cap historical data available
- Price, volume, market cap only

#### Missing
- **No Realized Cap metric**
- No MVRV or Z-Score metrics
- Cannot calculate MVRV without Realized Cap

#### Verdict
**INSUFFICIENT** - Missing critical data

---

### ❌ CryptoDataDownload

**Status:** EXCHANGE DATA ONLY

#### What They Offer
- Free OHLCV (candlestick) data
- Exchange trading data
- Funding rates, options data

#### Missing
- **No on-chain metrics**
- No Market Cap or Realized Cap
- Exchange data only, not blockchain data

#### Verdict
**WRONG DATA TYPE** - Not applicable

---

## 3. Manual Calculation Requirements

Since no free source provides pre-calculated 2YR rolling Z-Score, we must calculate it ourselves.

### Data Needed
1. **Market Cap** (daily, historical) ✅ Available from Coin Metrics
2. **Realized Cap** (daily, historical) ✅ Available from Coin Metrics

### Calculation Steps

#### Step 1: Calculate MVRV Ratio
```javascript
MVRV = Market_Cap / Realized_Cap
```

#### Step 2: For Each Day, Calculate Rolling Z-Score
```javascript
// Get last 730 days of MVRV values
const last730Days = mvrvValues.slice(i - 729, i + 1); // 730 days including today

// Calculate rolling mean
const mean = last730Days.reduce((a,b) => a+b) / 730;

// Calculate rolling standard deviation
const variance = last730Days.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 730;
const stddev = Math.sqrt(variance);

// Calculate Z-Score
const zscore = (mvrvToday - mean) / stddev;
```

#### Key Difference from Standard Z-Score
- **Standard Z-Score:** Uses all-time mean and stddev
- **2YR Rolling Z-Score:** Uses only last 730 days' mean and stddev
- **Result:** More reactive to recent market conditions

### First Valid Date
- Need 730 days of MVRV before first Z-Score calculation
- Bitcoin genesis: January 3, 2009
- Coin Metrics data starts: ~2010
- **First valid Z-Score:** ~July 2012 (2 years after data availability)

---

## 4. Implementation Strategy for Cloudflare Worker

### Recommended Architecture

```
┌─────────────────────┐
│  Coin Metrics API   │
│  (Free Community)   │
└──────────┬──────────┘
           │
           │ Daily Fetch
           ▼
┌─────────────────────┐
│  Cloudflare Worker  │
│  - Fetch raw data   │
│  - Calculate MVRV   │
│  - Calculate 730d   │
│    rolling Z-Score  │
└──────────┬──────────┘
           │
           │ Cache
           ▼
┌─────────────────────┐
│   Cloudflare KV     │
│   TTL: 24 hours     │
└─────────────────────┘
```

### Data Flow

1. **On First Request or Cache Miss:**
   - Fetch historical Market Cap and Realized Cap from Coin Metrics
   - Calculate MVRV for all dates
   - Calculate 730-day rolling Z-Score for each date
   - Store in KV with 24-hour TTL
   - Return JSON response

2. **On Subsequent Requests (within 24h):**
   - Retrieve from KV cache
   - Return immediately

3. **Daily Update (Optional Cron):**
   - Fetch latest day's data
   - Append to existing dataset
   - Recalculate only the new Z-Score
   - Update KV cache

### KV Store Structure

```json
{
  "window": "730d",
  "lastUpdate": "2025-10-26T00:00:00Z",
  "dataSource": "coinmetrics-community",
  "data": [
    {
      "date": "2012-07-18",
      "mvrv": 1.05,
      "zscore": 0.12,
      "marketCap": 100000000,
      "realizedCap": 95000000
    }
  ]
}
```

### API Endpoint Design

```
GET /api/mvrv-2yr

Response:
{
  "window": "730d",
  "lastUpdate": "2025-10-26T00:00:00Z",
  "dataSource": "coinmetrics-community",
  "calculationMethod": "rolling-window",
  "totalDataPoints": 4840,
  "data": [ ... ]
}
```

---

## 5. Data Source Comparison Table

| Source | Free? | Has MVRV/Z-Score? | Has Market Cap? | Has Realized Cap? | API Access? | 2YR Rolling? |
|--------|-------|-------------------|-----------------|-------------------|-------------|--------------|
| **Coin Metrics Community** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Must Calculate |
| Glassnode | ⚠️ Limited | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Paid Only | ❌ No |
| bitcoinisdata.com | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Paid Only | ✅ Yes |
| Bitcoin Mag Pro | ❌ No | ✅ Yes (2YR!) | ✅ Yes | ✅ Yes | ❓ Unknown | ✅ Yes |
| CoinGecko | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| CryptoDataDownload | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 6. Working Example API Calls

### Fetch Last 365 Days of Data
```bash
curl "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapRealUSD,CapMrktCurUSD&frequency=1d&start_time=2024-01-01&format=json"
```

### Fetch All Historical Data (2010-present)
```bash
curl "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapRealUSD,CapMrktCurUSD&frequency=1d&start_time=2010-01-01&format=json"
```

### Export to CSV
```bash
curl "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapRealUSD,CapMrktCurUSD&frequency=1d&start_time=2010-01-01&format=csv" > bitcoin_caps.csv
```

---

## 7. Cost Analysis

### Coin Metrics Community (RECOMMENDED)
- **Cost:** $0/month
- **Limitations:** Daily resolution only, no pre-calculated metrics
- **Effort:** Medium (must write calculation code)
- **Sustainability:** High (free forever, no rate limit concerns)

### Glassnode Professional + API
- **Cost:** ~$1,000+/year
- **Limitations:** Still may not have 2YR rolling
- **Effort:** Low (pre-calculated Z-Score)
- **Sustainability:** Low (expensive for hobby project)

### bitcoinisdata.com
- **Cost:** Unknown (no public pricing)
- **Limitations:** Must maintain subscription
- **Effort:** Low (has 730-day rolling option)
- **Sustainability:** Unknown

### Bitcoin Magazine Pro Advanced
- **Cost:** ~$1,188/year
- **Limitations:** No confirmed API access
- **Effort:** Unknown
- **Sustainability:** Low (very expensive)

---

## 8. Final Recommendation

### ✅ Use Coin Metrics Community API

**Reasons:**
1. **Completely free** - No API key, no registration, no cost
2. **Reliable data** - Industry-standard source, daily updates
3. **Has required metrics** - Both Market Cap and Realized Cap
4. **Good rate limits** - 10 req/6sec is plenty for daily updates
5. **Historical depth** - Data back to 2010
6. **Sustainable** - Won't disappear or change pricing

**Trade-off:**
- Must implement calculation logic ourselves
- Adds ~2-3 hours to build time
- Initial data fetch will be large (~15 years of daily data)

### Implementation Plan

1. **Static Historical Dataset (One-time):**
   - Fetch all historical Market Cap and Realized Cap from Coin Metrics
   - Calculate MVRV for each day
   - Calculate 730-day rolling Z-Score for each day (starting July 2012)
   - Save as static JSON file or KV backup

2. **Daily Update (Worker Logic):**
   - Check KV cache
   - If stale (>24h), fetch last 730 days from Coin Metrics
   - Calculate today's Z-Score
   - Append to dataset
   - Cache in KV with 24h TTL

3. **API Response:**
   - Serve complete historical + current data
   - Include metadata (window, update time, source)
   - Format for Recharts consumption

---

## 9. Backup Strategy

If Coin Metrics Community API becomes unavailable:

**Option 1:** GitHub CSV Archive
- Same data as API
- Download `btc.csv` from github.com/coinmetrics/data
- Parse CSV in Worker (larger payload)

**Option 2:** Pre-calculate and Commit
- Calculate entire dataset once
- Commit static JSON file to repository
- Only fetch new day's data from Coin Metrics
- Fallback: Serve static data if API fails

**Option 3:** Hybrid Approach
- Keep last 2 years in KV (rolling window)
- Fetch only what's needed daily
- Reduces API dependency

---

## 10. Next Steps

1. ✅ **Data source verified** - Coin Metrics Community API
2. ⬜ **Write calculation function** - 730-day rolling Z-Score
3. ⬜ **Test with sample data** - Verify calculations match expected values
4. ⬜ **Build Cloudflare Worker** - Implement fetch, calculate, cache logic
5. ⬜ **Create KV namespace** - Set up caching layer
6. ⬜ **Deploy and test** - Verify API endpoint works
7. ⬜ **Add frontend** - Recharts visualization

**Estimated Build Time:** 3-4 hours (including calculation implementation)

---

## 11. Code Snippet Preview

```javascript
// Cloudflare Worker - MVRV 2YR Rolling Z-Score

async function calculate2YRRollingZScore(marketCapData, realizedCapData) {
  // Step 1: Calculate MVRV for all dates
  const mvrv = marketCapData.map((item, i) => ({
    date: item.time,
    mvrv: parseFloat(item.CapMrktCurUSD) / parseFloat(realizedCapData[i].CapRealUSD),
    marketCap: parseFloat(item.CapMrktCurUSD),
    realizedCap: parseFloat(realizedCapData[i].CapRealUSD)
  }));

  // Step 2: Calculate 730-day rolling Z-Score
  const results = [];

  for (let i = 729; i < mvrv.length; i++) {
    const window = mvrv.slice(i - 729, i + 1);
    const mvrvValues = window.map(d => d.mvrv);

    // Mean
    const mean = mvrvValues.reduce((a, b) => a + b) / 730;

    // Standard Deviation
    const variance = mvrvValues.reduce((sum, val) =>
      sum + Math.pow(val - mean, 2), 0) / 730;
    const stddev = Math.sqrt(variance);

    // Z-Score
    const zscore = (mvrv[i].mvrv - mean) / stddev;

    results.push({
      date: mvrv[i].date.split('T')[0],
      zscore: zscore,
      mvrv: mvrv[i].mvrv,
      marketCap: mvrv[i].marketCap,
      realizedCap: mvrv[i].realizedCap
    });
  }

  return results;
}

// Fetch from Coin Metrics
async function fetchCoinMetricsData() {
  const url = 'https://community-api.coinmetrics.io/v4/timeseries/asset-metrics' +
    '?assets=btc' +
    '&metrics=CapRealUSD,CapMrktCurUSD' +
    '&frequency=1d' +
    '&start_time=2010-01-01' +
    '&format=json';

  const response = await fetch(url);
  const json = await response.json();

  return json.data;
}
```

---

## Appendix: Verified URLs

### Working Endpoints
- Coin Metrics API: `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics`
- Coin Metrics GitHub: `https://github.com/coinmetrics/data`
- Coin Metrics Docs: `https://docs.coinmetrics.io/api/v4/`

### Reference Charts (No Data Export)
- Bitcoin Mag Pro 2YR: `https://www.bitcoinmagazinepro.com/charts/mvrv-zscore-2yr-rolling/`
- Glassnode MVRV: `https://studio.glassnode.com/metrics?a=BTC&m=market.MvrvZScore`
- bitcoinisdata: `https://bitcoinisdata.com/mvrv_z_score/`

---

**Report Compiled:** 2025-10-26
**Status:** READY FOR IMPLEMENTATION
**Recommended Source:** Coin Metrics Community API (FREE)
