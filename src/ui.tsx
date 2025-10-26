// UI Component for MVRV 2YR Rolling Z-Score Chart
// Clean, minimal design with shadcn/ui components

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

// shadcn/ui Card component (inline for simplicity)
const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
    {children}
  </div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
    {children}
  </h2>
);

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
    {children}
  </p>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6">
    {children}
  </div>
);

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const zscore = data.zscore.toFixed(2);
  const mvrv = data.mvrv.toFixed(2);

  // Determine zone color
  let zoneColor = 'text-gray-600';
  let zoneLabel = 'Neutral';

  if (zscore < 0.1) {
    zoneColor = 'text-green-600';
    zoneLabel = 'Undervalued';
  } else if (zscore > 7) {
    zoneColor = 'text-red-600';
    zoneLabel = 'Overvalued';
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{data.date}</p>
      <div className="space-y-1">
        <p className={`text-sm font-semibold ${zoneColor}`}>
          Z-Score: {zscore}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          MVRV: {mvrv}
        </p>
        <p className={`text-xs font-medium ${zoneColor}`}>
          {zoneLabel}
        </p>
      </div>
    </div>
  );
};

// Main Chart Component
export default function MVRVChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetch('/api/mvrv-2yr')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then(result => {
        setData(result.data);
        setLastUpdate(new Date(result.lastUpdate).toLocaleDateString());
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>MVRV Z-Score (2-Year Rolling)</CardTitle>
            <CardDescription>
              Bitcoin market valuation indicator using 730-day rolling window
              • Last updated: {lastUpdate}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                  {/* Green zone: Undervalued (< 0.1) */}
                  <ReferenceArea
                    y1={-10}
                    y2={0.1}
                    fill="#10b981"
                    fillOpacity={0.1}
                    label={{ value: 'Undervalued', position: 'insideTopLeft', fill: '#10b981', fontSize: 12 }}
                  />

                  {/* Zero reference line */}
                  <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />

                  {/* Red zone: Overvalued (> 7) */}
                  <ReferenceArea
                    y1={7}
                    y2={15}
                    fill="#ef4444"
                    fillOpacity={0.1}
                    label={{ value: 'Overvalued', position: 'insideTopRight', fill: '#ef4444', fontSize: 12 }}
                  />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.getFullYear().toString();
                    }}
                  />

                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    domain={[-2, 12]}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="zscore"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500 opacity-30"></div>
                <span className="text-gray-600 dark:text-gray-400">Undervalued (&lt; 0.1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-400"></div>
                <span className="text-gray-600 dark:text-gray-400">Neutral (0.1 - 7)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500 opacity-30"></div>
                <span className="text-gray-600 dark:text-gray-400">Overvalued (&gt; 7)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info footer */}
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Data starts July 2012 • Updates daily at 2 AM UTC</p>
          <p className="mt-1">Powered by Cloudflare Workers</p>
        </div>
      </div>
    </div>
  );
}
