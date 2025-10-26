// 2-Year Rolling Z-Score Calculation Functions

import { HistoricalMVRVValue, MVRVDataPoint } from './types';

/**
 * Calculate 2-year rolling Z-Score for a given MVRV value
 * Formula: (MVRV_today - mean_last_730_days) / stddev_last_730_days
 */
export function calculate2YRRollingZScore(
  mvrvToday: number,
  last730DaysMVRV: number[]
): number {
  if (last730DaysMVRV.length < 730) {
    throw new Error('Need at least 730 days of MVRV data for 2YR rolling calculation');
  }

  // Calculate mean of last 730 days
  const mean = last730DaysMVRV.reduce((sum, val) => sum + val, 0) / 730;

  // Calculate variance
  const variance = last730DaysMVRV.reduce((sum, val) => {
    return sum + Math.pow(val - mean, 2);
  }, 0) / 730;

  // Calculate standard deviation
  const stddev = Math.sqrt(variance);

  // Avoid division by zero
  if (stddev === 0) {
    return 0;
  }

  // Calculate Z-Score
  const zscore = (mvrvToday - mean) / stddev;

  return Number(zscore.toFixed(4));
}

/**
 * Calculate today's rolling Z-Score from historical MVRV values
 */
export function calculateTodayRollingZScore(
  historicalValues: HistoricalMVRVValue[]
): MVRVDataPoint | null {
  if (historicalValues.length < 731) {
    // Need 730 days + today = 731 data points
    return null;
  }

  // Get last 731 days (730 for calculation window + today)
  const recentValues = historicalValues.slice(-731);
  const today = recentValues[recentValues.length - 1];
  const last730Days = recentValues.slice(0, 730).map(v => v.mvrv);

  const zscore = calculate2YRRollingZScore(today.mvrv, last730Days);

  return {
    date: today.date,
    zscore,
    mvrv: Number(today.mvrv.toFixed(4)),
    price: today.price || 0
  };
}

/**
 * Calculate rolling Z-Score for entire historical dataset
 * Each point requires 730 days of prior data
 */
export function calculateFullHistoricalRollingZScore(
  historicalValues: HistoricalMVRVValue[]
): MVRVDataPoint[] {
  const results: MVRVDataPoint[] = [];

  // Start from index 730 (need 730 prior days for first calculation)
  for (let i = 730; i < historicalValues.length; i++) {
    const currentDay = historicalValues[i];
    const last730Days = historicalValues.slice(i - 730, i).map(v => v.mvrv);

    const zscore = calculate2YRRollingZScore(currentDay.mvrv, last730Days);

    results.push({
      date: currentDay.date,
      zscore,
      mvrv: Number(currentDay.mvrv.toFixed(4)),
      price: currentDay.price || 0
    });
  }

  return results;
}
