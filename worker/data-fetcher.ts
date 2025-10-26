/**
 * Data Fetcher for Coin Metrics Community API
 * Fetches historical Market Cap and Realized Cap data
 */

import { HistoricalMVRVValue } from './types';

const COIN_METRICS_BASE_URL = 'https://community-api.coinmetrics.io/v4/timeseries/asset-metrics';
const RATE_LIMIT_DELAY = 600; // 600ms delay = 10 requests per 6 seconds

interface CoinMetricsDataPoint {
  asset: string;
  time: string;
  CapMrktCurUSD: string;
  CapRealUSD: string;
  PriceUSD: string;
}

interface CoinMetricsResponse {
  data: CoinMetricsDataPoint[];
  next_page_token?: string;
  next_page_url?: string;
}

/**
 * Fetch historical Market Cap and Realized Cap data from Coin Metrics
 * Handles pagination automatically
 */
export async function fetchHistoricalMVRVData(
  startDate: string = '2012-01-01',
  endDate?: string
): Promise<HistoricalMVRVValue[]> {
  const allData: HistoricalMVRVValue[] = [];
  let nextPageToken: string | undefined;
  const end = endDate || new Date().toISOString().split('T')[0];

  console.log(`Fetching MVRV data from ${startDate} to ${end}`);

  do {
    const url = buildCoinMetricsURL(startDate, end, nextPageToken);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Coin Metrics API error: ${response.status} ${response.statusText}`);
      }

      const json: CoinMetricsResponse = await response.json();

      // Process data points
      for (const point of json.data) {
        // Skip if missing required metrics
        if (!point.CapMrktCurUSD || !point.CapRealUSD || !point.PriceUSD) {
          continue;
        }

        const marketCap = parseFloat(point.CapMrktCurUSD);
        const realizedCap = parseFloat(point.CapRealUSD);
        const price = parseFloat(point.PriceUSD);

        // Calculate MVRV ratio
        const mvrv = realizedCap > 0 ? marketCap / realizedCap : 0;

        allData.push({
          date: point.time.split('T')[0], // Extract YYYY-MM-DD
          mvrv: Number(mvrv.toFixed(6)),
          marketCap,
          realizedCap,
          price: Number(price.toFixed(2))
        });
      }

      console.log(`Fetched ${json.data.length} data points (total: ${allData.length})`);

      // Check for pagination
      nextPageToken = json.next_page_token;

      // Respect rate limits
      if (nextPageToken) {
        await sleep(RATE_LIMIT_DELAY);
      }

    } catch (error) {
      console.error('Error fetching from Coin Metrics:', error);
      throw error;
    }

  } while (nextPageToken);

  console.log(`Total data points fetched: ${allData.length}`);

  // Sort data chronologically (oldest to newest) to ensure correct order
  allData.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`First date after sort: ${allData[0]?.date}, Last date: ${allData[allData.length - 1]?.date}`);

  return allData;
}

/**
 * Fetch only the latest data point (for daily updates)
 */
export async function fetchLatestMVRVData(): Promise<HistoricalMVRVValue | null> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const url = buildCoinMetricsURL(yesterday, today);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Coin Metrics API error: ${response.status}`);
    }

    const json: CoinMetricsResponse = await response.json();

    if (json.data.length === 0) {
      return null;
    }

    // Get the most recent point
    const point = json.data[json.data.length - 1];

    if (!point.CapMrktCurUSD || !point.CapRealUSD) {
      return null;
    }

    const marketCap = parseFloat(point.CapMrktCurUSD);
    const realizedCap = parseFloat(point.CapRealUSD);
    const mvrv = realizedCap > 0 ? marketCap / realizedCap : 0;

    return {
      date: point.time.split('T')[0],
      mvrv: Number(mvrv.toFixed(6)),
      marketCap,
      realizedCap
    };

  } catch (error) {
    console.error('Error fetching latest data:', error);
    return null;
  }
}

/**
 * Build Coin Metrics API URL with parameters
 */
function buildCoinMetricsURL(
  startDate: string,
  endDate: string,
  pageToken?: string
): string {
  const params = new URLSearchParams({
    assets: 'btc',
    metrics: 'CapMrktCurUSD,CapRealUSD,PriceUSD',
    start_time: startDate,
    end_time: endDate,
    page_size: '1000' // Max records per page
  });

  if (pageToken) {
    params.set('next_page_token', pageToken);
  }

  return `${COIN_METRICS_BASE_URL}?${params.toString()}`;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
