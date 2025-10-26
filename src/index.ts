/**
 * MVRV Z-Score 2YR Rolling Window - Cloudflare Worker
 *
 * Serves MVRV Z-Score with 2-year (730-day) rolling window calculation
 * Uses KV for caching with 24-hour TTL
 *
 * Key difference from standard Z-Score:
 * - Standard: (MVRV - mean_all_history) / stddev_all_history
 * - 2YR Rolling: (MVRV - mean_last_730_days) / stddev_last_730_days
 */

import { Env, MVRVResponse, MVRVDataPoint } from './types';
import { calculateFullHistoricalRollingZScore, calculateTodayRollingZScore } from './calculator';
import { fetchHistoricalMVRVData, fetchLatestMVRVData } from './data-fetcher';
import { htmlTemplate } from './html-template';

// KV Cache Keys
const CACHE_KEY_ROLLING = 'mvrv_2yr_rolling';
const CACHE_KEY_HISTORICAL = 'mvrv_historical_values';

// Cache TTLs (in seconds)
const TTL_24_HOURS = 86400; // 24 hours for rolling data
const TTL_7_DAYS = 604800; // 7 days for historical values

export default {
  /**
   * Handle HTTP requests to the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Route: GET /api/mvrv-2yr (JSON API)
    if (url.pathname === '/api/mvrv-2yr' && request.method === 'GET') {
      try {
        const data = await getMVRV2YRData(env);
        return jsonResponse(data);
      } catch (error) {
        console.error('Error fetching MVRV 2YR data:', error);
        return jsonResponse(
          { error: 'Failed to fetch MVRV data' },
          500
        );
      }
    }

    // Route: GET / (HTML Frontend)
    if (url.pathname === '/' && request.method === 'GET') {
      return htmlResponse(htmlTemplate);
    }

    // Default route - API info
    return jsonResponse(
      {
        service: 'MVRV Z-Score 2YR Rolling',
        endpoints: {
          'GET /': 'Interactive chart (HTML)',
          'GET /api/mvrv-2yr': 'Returns complete 2YR rolling Z-Score dataset (JSON)'
        }
      },
      200
    );
  },

  /**
   * Handle scheduled cron triggers (runs daily at 2 AM UTC)
   */
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    console.log('Cron trigger started:', new Date().toISOString());

    try {
      // Pre-calculate and cache data
      await getMVRV2YRData(env, true);
      console.log('Successfully updated MVRV 2YR cache');
    } catch (error) {
      console.error('Error in scheduled update:', error);
    }
  }
};

/**
 * Get MVRV 2YR rolling data (from cache or calculate fresh)
 */
async function getMVRV2YRData(env: Env, forceRefresh = false): Promise<MVRVResponse> {
  // Try to get cached data first
  if (!forceRefresh) {
    const cached = await env.MVRV_CACHE.get(CACHE_KEY_ROLLING, 'json');
    if (cached) {
      console.log('Returning cached MVRV 2YR data');
      return cached as MVRVResponse;
    }
  }

  console.log('Cache miss or forced refresh - calculating fresh data');

  // Get historical MVRV values from Coin Metrics
  const historicalValues = await getHistoricalMVRVValues(env);

  if (historicalValues.length < 731) {
    throw new Error('Insufficient historical data for 2YR rolling calculation');
  }

  // Calculate rolling Z-Score for entire historical dataset
  // This calculates Z-Score for every day (starting from day 730)
  const finalData: MVRVDataPoint[] = calculateFullHistoricalRollingZScore(historicalValues);

  console.log(`Calculated ${finalData.length} rolling Z-Score data points`);

  const response: MVRVResponse = {
    window: '730d',
    lastUpdate: new Date().toISOString(),
    data: finalData
  };

  // Cache with 24-hour TTL
  await env.MVRV_CACHE.put(
    CACHE_KEY_ROLLING,
    JSON.stringify(response),
    { expirationTtl: TTL_24_HOURS }
  );

  return response;
}

/**
 * Get historical MVRV values from Coin Metrics Community API
 */
async function getHistoricalMVRVValues(env: Env): Promise<any[]> {
  // Try cache first
  const cached = await env.MVRV_CACHE.get(CACHE_KEY_HISTORICAL, 'json');
  if (cached) {
    console.log('Returning cached historical MVRV values');
    return cached as any[];
  }

  console.log('Fetching fresh historical data from Coin Metrics');

  // Fetch from Coin Metrics Community API (FREE!)
  const historicalData = await fetchHistoricalMVRVData('2012-01-01');

  // Cache for 7 days
  await env.MVRV_CACHE.put(
    CACHE_KEY_HISTORICAL,
    JSON.stringify(historicalData),
    { expirationTtl: TTL_7_DAYS }
  );

  console.log(`Cached ${historicalData.length} historical MVRV values`);

  return historicalData;
}


/**
 * Helper: Create JSON response with CORS headers
 */
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=3600' // Browser cache for 1 hour
    }
  });
}

/**
 * Helper: Create HTML response
 */
function htmlResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600' // Browser cache for 1 hour
    }
  });
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
