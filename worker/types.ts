// Type definitions for MVRV Z-Score 2YR Rolling Worker

export interface Env {
  MVRV_CACHE: KVNamespace;
  ASSETS: Fetcher; // Static assets binding for serving React frontend
}

export interface MVRVDataPoint {
  date: string; // ISO 8601 format: "YYYY-MM-DD"
  zscore: number; // 2-year rolling Z-Score
  mvrv: number; // Market Value to Realized Value ratio
  price: number; // Bitcoin price in USD
}

export interface MVRVResponse {
  window: string; // "730d" for 2-year rolling
  lastUpdate: string; // ISO 8601 timestamp
  data: MVRVDataPoint[];
}

export interface HistoricalMVRVValue {
  date: string;
  mvrv: number;
  marketCap?: number;
  realizedCap?: number;
  price?: number;
}
