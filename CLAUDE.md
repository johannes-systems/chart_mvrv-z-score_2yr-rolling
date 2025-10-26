# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Rules:

 - Whenever you tell me anything about Cloudflare or before writing any code connected to it, please first back it up with the Cloudflare MCP!!! and Cloudfkares methods, best practices and templates. I don't want you to ever use context from your pre trained memory about CloudFlare.
 
 - Plan and create your own Task/Checklist.
 - Keep the code minimal and performant.
 - Always create well commented commits, so we have checkpoints.
 We want to make minimal robust and thought out edits in the code. Generally we want minimalistic clean code. 
 The less code the solution has, the better. The easier it is to work on. Keep it stupid simple. And always reuse what you can.

## Project Overview

This is a Cloudflare Worker project that serves MVRV Z-Score data with a **2-year rolling window** calculation for Bitcoin market analysis. The key difference from standard Z-Score is that it uses a 730-day rolling window instead of all historical data, making it more reactive to recent market conditions.

## Architecture

- **Platform**: Cloudflare Workers
- **Storage**: KV Store with 24-hour TTL for calculated data
- **Data Flow**: Worker → KV Cache → JSON API → React + Recharts frontend
- **Update Frequency**: Daily updates (optional cron: 2 AM UTC)

## Critical Implementation Details

### 2-Year Rolling Window Calculation

The core difference from standard Z-Score:
- **Standard Z-Score**: `(MVRV - mean_all_history) / stddev_all_history`
- **2YR Rolling**: `(MVRV - mean_last_730_days) / stddev_last_730_days`

Each data point requires the previous 730 days of MVRV values to calculate, meaning the dataset starts in mid-2012 (need 2 years prior history from Bitcoin's genesis).

### Data Strategy

**Static Data**: Pre-calculated 2YR rolling Z-Score from 2012 to yesterday
**Dynamic Data**: Today's value calculated from last 730 days of MVRV
**Cache TTL**: 24 hours in KV

### KV Store Structure

```
Key: 'mvrv_2yr_rolling'
Value: { window: "730d", lastUpdate, data[] }
TTL: 86400 seconds

Key: 'mvrv_historical_values'
Value: { date, mvrv, marketCap, realizedCap }[]
TTL: 604800 seconds (7 days)
```

### API Endpoint

`GET /api/mvrv-2yr` - Returns complete 2YR rolling Z-Score dataset

Response format:
```json
{
  "window": "730d",
  "lastUpdate": "2025-10-26T00:00:00Z",
  "data": [
    { "date": "2012-07-18", "zscore": 0.12, "mvrv": 1.02 }
  ]
}
```

## Data Sources

**Primary**: bitcoinisdata.com/mvrv_z_score/ (with 730-day rolling window setting)
- Check for JSON/API endpoint first
- Fallback to CSV download with 730-day window

**Fallback**: Calculate manually from MVRV values (Market Cap / Realized Cap)

## Calculation Logic

For each day's rolling Z-Score:
```javascript
const last730Days = mvrvValues.slice(-730);
const mean = last730Days.reduce((a,b) => a+b) / 730;
const variance = last730Days.reduce((a,v) => a + (v-mean)**2, 0) / 730;
const stddev = Math.sqrt(variance);
const zscore = (mvrvToday - mean) / stddev;
```

## Worker Logic Flow

1. Check KV for `mvrv_2yr_rolling` key
2. If cached and < 24hrs old → return cached data
3. If expired:
   - Fetch historical 2YR rolling data (static backup)
   - Get latest 730 days of MVRV values
   - Calculate today's rolling Z-Score
   - Append to dataset
   - Cache with 24h TTL
4. Return JSON response

## Frontend Integration

Chart zones for Recharts:
- Green zone: -∞ to 0.1 (undervalued)
- Gray reference line: 0
- Red zone: 7 to ∞ (overvalued)

## Development Notes

- First valid datapoint starts around July 2012 (requires 2 years of prior MVRV data)
- More reactive to recent market conditions than standard all-time Z-Score
- Estimated build time: 2 hours (using pre-calculated) or 3-4 hours (calculating from scratch)
- Zero cost on Cloudflare Workers free tier
