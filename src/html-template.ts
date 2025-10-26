// HTML template for serving the frontend
// Self-contained with React, Recharts, and Tailwind CSS via CDN

export const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MVRV Z-Score (2-Year Rolling) | Bitcoin Market Analysis</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Babel Standalone (must load first for JSX) -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- React & ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

  <!-- Recharts (must load before our script) -->
  <script src="https://unpkg.com/recharts@2.10.3/dist/Recharts.js"></script>

  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    .loading-spinner {
      border: 3px solid #f3f4f6;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel" data-type="module">
    const { useState, useEffect } = React;
    const {
      LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
      ResponsiveContainer, ReferenceLine, ReferenceArea
    } = Recharts;

    // Card components
    const Card = ({ children }) => (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        {children}
      </div>
    );

    const CardHeader = ({ children }) => (
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        {children}
      </div>
    );

    const CardTitle = ({ children }) => (
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </h2>
    );

    const CardDescription = ({ children }) => (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {children}
      </p>
    );

    const CardContent = ({ children }) => (
      <div className="p-6">{children}</div>
    );

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
      if (!active || !payload?.length) return null;

      const data = payload[0].payload;
      const zscore = parseFloat(data.zscore).toFixed(2);
      const mvrv = parseFloat(data.mvrv).toFixed(2);

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
            <p className={\`text-sm font-semibold \${zoneColor}\`}>
              Z-Score: {zscore}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              MVRV: {mvrv}
            </p>
            <p className={\`text-xs font-medium \${zoneColor}\`}>
              {zoneLabel}
            </p>
          </div>
        </div>
      );
    };

    // Main App Component
    function MVRVChart() {
      const [data, setData] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [lastUpdate, setLastUpdate] = useState('');

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
            <div className="loading-spinner"></div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
            <Card>
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
                  Bitcoin market valuation indicator using 730-day rolling window • Last updated: {lastUpdate}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div style={{ height: '500px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                      <ReferenceArea
                        y1={-10}
                        y2={0.1}
                        fill="#10b981"
                        fillOpacity={0.1}
                      />

                      <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />

                      <ReferenceArea
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

            <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>Data starts July 2012 • Updates daily at 2 AM UTC</p>
              <p className="mt-1">Powered by Cloudflare Workers</p>
            </div>
          </div>
        </div>
      );
    }

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<MVRVChart />);
  </script>
</body>
</html>
`;
