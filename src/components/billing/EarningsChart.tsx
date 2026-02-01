import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp } from 'lucide-react';

interface EarningsData {
  date: string;
  amount: number;
  transactions: number;
}

interface ChartPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}

type PeriodType = 'week' | 'month' | 'year';

export function EarningsChart() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [data, setData] = useState<EarningsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    highest: 0,
    transactions: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔵 EarningsChart: Starting fetch with period:', period);
        setLoading(true);
        const token = localStorage.getItem('access_token');
        console.log('🔵 Token exists:', !!token);

        const url = `/api/v1/billing/earnings-report?period=${period}`;
        console.log('🔵 Fetching URL:', url);

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('🔵 Response status:', response.status);
        console.log('🔵 Response statusText:', response.statusText);
        console.log('🔵 Response headers:', {
          contentType: response.headers.get('content-type'),
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error('🔴 Response body:', responseText.substring(0, 200));
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('🔵 Parsed response:', result);

        const earningsData = result.data?.daily || [];
        console.log('🔵 Earnings data:', earningsData);

        setData(earningsData);

        // Calculate stats
        const total = earningsData.reduce((sum: number, d: EarningsData) => sum + d.amount, 0);
        const transactions = earningsData.reduce((sum: number, d: EarningsData) => sum + d.transactions, 0);
        const highest = earningsData.length > 0 ? Math.max(...earningsData.map((d: EarningsData) => d.amount)) : 0;
        const average = earningsData.length > 0 ? total / earningsData.length : 0;

        console.log('🔵 Calculated stats:', { total, average, highest, transactions });

        setStats({ total, average, highest, transactions });
        setError('');
        console.log('✅ EarningsChart: Data loaded successfully');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error loading chart data';
        console.error('🔴 EarningsChart Error:', errorMsg);
        console.error('🔴 Full error object:', err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const maxValue = Math.max(
    ...data.map((d) => d.amount),
    stats.highest || 1
  );

  const chartHeight = 200;
  const chartWidth = data.length > 0 ? Math.max(300, data.length * 40) : 300;

  const getChartPoints = (): ChartPoint[] => {
    return data.map((d, index) => ({
      x: (index / Math.max(data.length - 1, 1)) * (chartWidth - 40),
      y: chartHeight - (d.amount / maxValue) * chartHeight,
      label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: d.amount,
    }));
  };

  const points = getChartPoints();

  return (
    <div className="space-y-4 w-full">
      {/* Period Selection */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Earnings Trend
              </CardTitle>
              <CardDescription>Your earnings over time</CardDescription>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? 'default' : 'outline'}
                  onClick={() => setPeriod(p)}
                  disabled={loading}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                ${stats.total.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Daily</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ${stats.average.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Highest Day</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                ${stats.highest.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {stats.transactions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="w-full">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center h-64 flex items-center justify-center">
              <p className="text-muted-foreground">No earnings data for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
                className="w-full h-auto min-h-64 border border-border/50 rounded-lg bg-accent/20 p-4"
              >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                  <g key={`grid-${i}`}>
                    <line
                      x1="20"
                      y1={chartHeight - ratio * chartHeight}
                      x2={chartWidth - 20}
                      y2={chartHeight - ratio * chartHeight}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                      strokeDasharray="4,4"
                      className="text-foreground"
                    />
                    <text
                      x="5"
                      y={chartHeight - ratio * chartHeight + 4}
                      fontSize="10"
                      fill="currentColor"
                      fillOpacity="0.5"
                      textAnchor="end"
                      className="text-foreground"
                    >
                      ${(ratio * maxValue).toFixed(0)}
                    </text>
                  </g>
                ))}

                {/* Axes */}
                <line x1="20" y1="0" x2="20" y2={chartHeight} stroke="currentColor" className="text-foreground" />
                <line
                  x1="20"
                  y1={chartHeight}
                  x2={chartWidth}
                  y2={chartHeight}
                  stroke="currentColor"
                  className="text-foreground"
                />

                {/* Area under curve */}
                {points.length > 0 && (
                  <polygon
                    points={`20,${chartHeight} ${points.map((p) => `${p.x + 20},${p.y}`).join(' ')} ${chartWidth - 20},${chartHeight}`}
                    fill="currentColor"
                    fillOpacity="0.1"
                    className="text-green-500"
                  />
                )}

                {/* Line chart */}
                {points.length > 1 && (
                  <polyline
                    points={points.map((p) => `${p.x + 20},${p.y}`).join(' ')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600 dark:text-green-400"
                  />
                )}

                {/* Data points */}
                {points.map((p, index) => (
                  <g key={`point-${index}`}>
                    <circle cx={p.x + 20} cy={p.y} r="3" fill="currentColor" className="text-green-600 dark:text-green-400" />
                    <text
                      x={p.x + 20}
                      y={chartHeight + 20}
                      fontSize="10"
                      textAnchor="middle"
                      fill="currentColor"
                      fillOpacity="0.7"
                      className="text-foreground"
                    >
                      {p.label}
                    </text>
                    {/* Tooltip value on hover */}
                    <title>${p.value.toFixed(2)}</title>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
