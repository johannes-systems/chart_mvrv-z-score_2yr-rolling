import { useEffect, useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MVRVDataPoint {
  date: string;
  zscore: number;
  mvrv: number;
  price: number;
}

interface MVRVResponse {
  window: string;
  lastUpdate: string;
  data: MVRVDataPoint[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: MVRVDataPoint;
  }>;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const zscore = data.zscore.toFixed(2);
  const mvrv = data.mvrv.toFixed(2);
  const price = data.price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  let zoneColor = 'text-gray-600 dark:text-gray-400';
  let zoneLabel = 'Neutral';

  if (data.zscore < 0.1) {
    zoneColor = 'text-green-600 dark:text-green-500';
    zoneLabel = 'Undervalued';
  } else if (data.zscore > 7) {
    zoneColor = 'text-red-600 dark:text-red-500';
    zoneLabel = 'Overvalued';
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{data.date}</p>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Price: {price}
        </p>
        <p className={`text-sm font-semibold ${zoneColor}`}>
          Z-Score: {zscore}
        </p>
        <p className="text-xs text-foreground">
          MVRV: {mvrv}
        </p>
        <p className={`text-xs font-medium ${zoneColor}`}>
          {zoneLabel}
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<MVRVDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    console.log('Fetching data from /api/mvrv-2yr...');
    // Add cache-busting timestamp to ensure fresh data
    fetch(`/api/mvrv-2yr?t=${Date.now()}`)
      .then(res => {
        console.log('Response status:', res.status);
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then((result: MVRVResponse) => {
        console.log('Data received:', result.data.length, 'points');
        console.log('First point:', result.data[0]);
        console.log('Last point:', result.data[result.data.length - 1]);
        setData(result.data);
        setLastUpdate(new Date(result.lastUpdate).toLocaleDateString());
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">MVRV Z-Score (2-Year Rolling)</CardTitle>
            <CardDescription>
              Bitcoin market valuation indicator using 730-day rolling window • Last updated: {lastUpdate}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div style={{ width: '100%', height: '500px', display: 'flex', justifyContent: 'center' }}>
              <LineChart width={900} height={500} data={data} margin={{ top: 5, right: 60, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

                {/* Green zone: Undervalued (< 0.1) - referenced to right Y-axis */}
                <ReferenceArea
                  yAxisId="right"
                  y1={-10}
                  y2={0.1}
                  fill="#22c55e"
                  fillOpacity={0.1}
                />

                {/* Zero reference line - referenced to right Y-axis */}
                <ReferenceLine yAxisId="right" y={0} stroke="#9ca3af" strokeDasharray="3 3" />

                {/* Red zone: Overvalued (> 7) - referenced to right Y-axis */}
                <ReferenceArea
                  yAxisId="right"
                  y1={7}
                  y2={15}
                  fill="#ef4444"
                  fillOpacity={0.1}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.getFullYear().toString();
                  }}
                />

                {/* Left Y-Axis: Bitcoin Price */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tick={{ fontSize: 12, fill: '#10b981' }}
                  label={{ value: 'Bitcoin Price (USD)', angle: -90, position: 'insideLeft', style: { fill: '#10b981', fontSize: 14, fontWeight: 'bold' } }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  domain={['auto', 'auto']}
                  stroke="#10b981"
                />

                {/* Right Y-Axis: Z-Score */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#6366f1' }}
                  label={{ value: '2YR Rolling Z-Score', angle: 90, position: 'insideRight', style: { fill: '#6366f1', fontSize: 14, fontWeight: 'bold' } }}
                  domain={[-2, 12]}
                  stroke="#6366f1"
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Bitcoin Price Line (Green) */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="price"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />

                {/* Z-Score Line (Blue) */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="zscore"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-3">
              {/* Lines Legend */}
              <div className="flex flex-wrap gap-6 justify-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-green-500"></div>
                  <span className="text-muted-foreground font-medium">Bitcoin Price (USD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-indigo-500"></div>
                  <span className="text-muted-foreground font-medium">2YR Rolling Z-Score</span>
                </div>
              </div>

              {/* Zones Legend */}
              <div className="flex flex-wrap gap-6 justify-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500 opacity-30"></div>
                  <span className="text-muted-foreground">Undervalued (&lt; 0.1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-400 dark:bg-gray-600"></div>
                  <span className="text-muted-foreground">Neutral (0.1 - 7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500 opacity-30"></div>
                  <span className="text-muted-foreground">Overvalued (&gt; 7)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info footer */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>Data starts July 2012 • Updates daily at 2 AM UTC</p>
          <p className="mt-1">Powered by Cloudflare Workers + Vite + React</p>
        </div>
      </div>
    </div>
  );
}
