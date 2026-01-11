import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Image,
  Zap,
  BarChart3,
  Calendar,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { getMonthlyUsage, getCosts } from '../services/cost-api';

// Service display names and colors
const SERVICE_INFO: Record<string, { name: string; color: string; icon: React.ReactNode }> = {
  'gemini-3-flash': { name: 'Gemini Flash', color: '#4285F4', icon: <Zap className="w-4 h-4" /> },
  'flux-pro-1.1': { name: 'Flux Pro', color: '#9333EA', icon: <Image className="w-4 h-4" /> },
  'flux-pro-fill': { name: 'Flux Fill', color: '#A855F7', icon: <Image className="w-4 h-4" /> },
  'remove-bg': { name: 'Remove.bg', color: '#10B981', icon: <Image className="w-4 h-4" /> },
  'parallel-ai': { name: 'Parallel AI', color: '#F59E0B', icon: <Zap className="w-4 h-4" /> },
  'cloudinary': { name: 'Cloudinary', color: '#06B6D4', icon: <Image className="w-4 h-4" /> },
};

interface MonthlyData {
  month: string;
  total: number;
  byService: Record<string, number>;
}

export function UsageDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalSpending, setTotalSpending] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonthBreakdown, setCurrentMonthBreakdown] = useState<Record<string, number>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('all');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [monthlyResponse] = await Promise.all([
        getMonthlyUsage(),
        getCosts(),
      ]);

      if (monthlyResponse.success) {
        setTotalSpending(monthlyResponse.totalSpending);
        setMonthlyData(monthlyResponse.monthly);

        // Get current month breakdown
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentMonthData = monthlyResponse.monthly.find(m => m.month === currentMonth);
        if (currentMonthData) {
          setCurrentMonthBreakdown(currentMonthData.byService);
        }
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthData = monthlyData.find(m => m.month === currentMonth);
  const currentMonthTotal = currentMonthData?.total || 0;

  // Get previous month for comparison
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthKey = prevMonth.toISOString().slice(0, 7);
  const prevMonthData = monthlyData.find(m => m.month === prevMonthKey);
  const prevMonthTotal = prevMonthData?.total || 0;

  // Calculate month-over-month change
  const monthChange = prevMonthTotal > 0
    ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
    : 0;

  // Get max value for chart scaling
  const maxMonthValue = Math.max(...monthlyData.map(m => m.total), 0.01);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading usage data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Usage Dashboard</h1>
            <p className="text-zinc-400">Track your API costs and usage across all services</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white hover:border-zinc-600 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>{selectedPeriod === 'all' ? 'All Time' : selectedPeriod === 'month' ? 'This Month' : 'This Week'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showPeriodDropdown && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 overflow-hidden">
                  {['all', 'month', 'week'].map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setSelectedPeriod(period as any);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 transition-colors ${
                        selectedPeriod === period ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {period === 'all' ? 'All Time' : period === 'month' ? 'This Month' : 'This Week'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={fetchData}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white hover:border-zinc-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Total Spending */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-zinc-400 text-sm">Total Spending</span>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              ${totalSpending.toFixed(4)}
            </div>
            <div className="text-xs text-zinc-500 mt-2">All time</div>
          </div>

          {/* This Month */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-zinc-400 text-sm">This Month</span>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              ${currentMonthTotal.toFixed(4)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {monthChange !== 0 && (
                <>
                  <TrendingUp className={`w-3 h-3 ${monthChange > 0 ? 'text-red-400' : 'text-green-400'}`} />
                  <span className={`text-xs ${monthChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {monthChange > 0 ? '+' : ''}{monthChange.toFixed(1)}% vs last month
                  </span>
                </>
              )}
              {monthChange === 0 && (
                <span className="text-xs text-zinc-500">No previous data</span>
              )}
            </div>
          </div>

          {/* Avg Per Ad */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-zinc-400 text-sm">Avg Cost Per Ad</span>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              ~$0.05
            </div>
            <div className="text-xs text-zinc-500 mt-2">Estimated average</div>
          </div>
        </motion.div>

        {/* Monthly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Monthly Spending</h2>

          {monthlyData.length > 0 ? (
            <div className="space-y-4">
              {monthlyData.slice(0, 6).map((month) => {
                const percentage = (month.total / maxMonthValue) * 100;
                const monthDate = new Date(month.month + '-01');
                const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                return (
                  <div key={month.month} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-zinc-400">{monthLabel}</div>
                    <div className="flex-1 h-8 bg-zinc-700/50 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg"
                      />
                    </div>
                    <div className="w-20 text-right text-sm font-mono text-white">
                      ${month.total.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">No spending data yet</p>
              <p className="text-zinc-600 text-sm mt-1">Generate some ads to see costs here</p>
            </div>
          )}
        </motion.div>

        {/* Service Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Cost by Service (This Month)</h2>

          {Object.keys(currentMonthBreakdown).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(currentMonthBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([service, cost]) => {
                  const info = SERVICE_INFO[service] || { name: service, color: '#6B7280', icon: <Zap className="w-4 h-4" /> };
                  const percentage = currentMonthTotal > 0 ? (cost / currentMonthTotal) * 100 : 0;

                  return (
                    <div
                      key={service}
                      className="flex items-center gap-4 p-4 bg-zinc-700/30 rounded-lg"
                    >
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${info.color}20` }}
                      >
                        <span style={{ color: info.color }}>{info.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{info.name}</div>
                        <div className="text-xs text-zinc-500">{percentage.toFixed(1)}% of total</div>
                      </div>
                      <div className="text-sm font-mono text-emerald-400">
                        ${cost.toFixed(4)}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">No service usage this month</p>
              <p className="text-zinc-600 text-sm mt-1">Start generating ads to track costs</p>
            </div>
          )}
        </motion.div>

        {/* Pricing Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6"
        >
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Service Pricing Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div className="text-zinc-500">
              <span className="text-white">Gemini Flash</span>
              <br />$0.0005/1K input tokens
              <br />$0.003/1K output tokens
            </div>
            <div className="text-zinc-500">
              <span className="text-white">Flux Pro</span>
              <br />$0.04/image
            </div>
            <div className="text-zinc-500">
              <span className="text-white">Flux Fill</span>
              <br />$0.05/image
            </div>
            <div className="text-zinc-500">
              <span className="text-white">Remove.bg</span>
              <br />$0.20/image
            </div>
            <div className="text-zinc-500">
              <span className="text-white">Parallel AI</span>
              <br />~$0.01/request
            </div>
            <div className="text-zinc-500">
              <span className="text-white">Cloudinary</span>
              <br />Free tier
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
