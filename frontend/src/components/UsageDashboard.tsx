import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Image,
  Zap,
  BarChart3,
  Calendar,
  ChevronDown,
  RefreshCw,
  Folder,
  ChevronRight,
} from 'lucide-react';
import { getMonthlyUsage, getCosts, getAllCampaignsWithCosts } from '../services/cost-api';

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

interface CampaignCost {
  id: string;
  name: string;
  total: number;
  adCount: number;
  createdAt: string;
}

export function UsageDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalSpending, setTotalSpending] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonthBreakdown, setCurrentMonthBreakdown] = useState<Record<string, number>>({});
  const [campaignCosts, setCampaignCosts] = useState<CampaignCost[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('all');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'service' | 'campaign'>('service');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [monthlyResponse, , campaignsResponse] = await Promise.all([
        getMonthlyUsage(),
        getCosts(),
        getAllCampaignsWithCosts(),
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

      if (campaignsResponse.success) {
        setCampaignCosts(campaignsResponse.campaigns);
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

  // Calculate max campaign cost for scaling
  const maxCampaignCost = Math.max(...campaignCosts.map(c => c.total), 0.01);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading usage data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Usage Dashboard</h1>
            <p className="text-gray-500">Track your API costs and usage across all services</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:border-indigo-300 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>{selectedPeriod === 'all' ? 'All Time' : selectedPeriod === 'month' ? 'This Month' : 'This Week'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showPeriodDropdown && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {['all', 'month', 'week'].map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setSelectedPeriod(period as 'all' | 'month' | 'week');
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                        selectedPeriod === period ? 'text-indigo-600 font-medium' : 'text-gray-700'
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
              className="p-2 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:border-indigo-300 transition-colors"
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
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-gray-500 text-sm">Total Spending</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 font-mono">
              ${totalSpending.toFixed(4)}
            </div>
            <div className="text-xs text-gray-400 mt-2">All time</div>
          </div>

          {/* This Month */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500 text-sm">This Month</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 font-mono">
              ${currentMonthTotal.toFixed(4)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {monthChange !== 0 && (
                <>
                  <TrendingUp className={`w-3 h-3 ${monthChange > 0 ? 'text-red-500' : 'text-green-500'}`} />
                  <span className={`text-xs ${monthChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {monthChange > 0 ? '+' : ''}{monthChange.toFixed(1)}% vs last month
                  </span>
                </>
              )}
              {monthChange === 0 && (
                <span className="text-xs text-gray-400">No previous data</span>
              )}
            </div>
          </div>

          {/* Avg Per Ad */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-500 text-sm">Avg Cost Per Ad</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 font-mono">
              ~$0.05
            </div>
            <div className="text-xs text-gray-400 mt-2">Estimated average</div>
          </div>
        </motion.div>

        {/* Monthly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Spending</h2>

          {monthlyData.length > 0 ? (
            <div className="space-y-4">
              {monthlyData.slice(0, 6).map((month) => {
                const percentage = (month.total / maxMonthValue) * 100;
                const monthDate = new Date(month.month + '-01');
                const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                return (
                  <div key={month.month} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-500">{monthLabel}</div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg"
                      />
                    </div>
                    <div className="w-20 text-right text-sm font-mono text-gray-900">
                      ${month.total.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No spending data yet</p>
              <p className="text-gray-400 text-sm mt-1">Generate some ads to see costs here</p>
            </div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab('service')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'service'
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By Service
            </button>
            <button
              onClick={() => setActiveTab('campaign')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'campaign'
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By Campaign
            </button>
          </div>
        </motion.div>

        {/* Cost by Service */}
        {activeTab === 'service' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Cost by Service (This Month)</h2>

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
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${info.color}15` }}
                        >
                          <span style={{ color: info.color }}>{info.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{info.name}</div>
                          <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</div>
                        </div>
                        <div className="text-sm font-mono text-indigo-600">
                          ${cost.toFixed(4)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No service usage this month</p>
                <p className="text-gray-400 text-sm mt-1">Start generating ads to track costs</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Cost by Campaign */}
        {activeTab === 'campaign' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Cost by Campaign</h2>

            {campaignCosts.length > 0 ? (
              <div className="space-y-3">
                {campaignCosts.map((campaign) => {
                  const percentage = (campaign.total / maxCampaignCost) * 100;

                  return (
                    <Link
                      key={campaign.id}
                      to={`/campaigns/${campaign.id}`}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                    >
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Folder className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 truncate">{campaign.name}</span>
                          <span className="text-sm font-mono text-indigo-600 ml-4">
                            ${campaign.total.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            />
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {campaign.adCount} ads
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No campaigns yet</p>
                <p className="text-gray-400 text-sm mt-1">Create a campaign to track costs</p>
                <Link
                  to="/campaigns/new"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Create Campaign
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Pricing Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white border-2 border-gray-200 rounded-2xl p-6"
        >
          <h3 className="text-sm font-medium text-gray-500 mb-4">Service Pricing Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div className="text-gray-500">
              <span className="text-gray-900 font-medium">Gemini Flash</span>
              <br />$0.0005/1K input tokens
              <br />$0.003/1K output tokens
            </div>
            <div className="text-gray-500">
              <span className="text-gray-900 font-medium">Flux Pro</span>
              <br />$0.04/image
            </div>
            <div className="text-gray-500">
              <span className="text-gray-900 font-medium">Flux Fill</span>
              <br />$0.05/image
            </div>
            <div className="text-gray-500">
              <span className="text-gray-900 font-medium">Remove.bg</span>
              <br />$0.20/image
            </div>
            <div className="text-gray-500">
              <span className="text-gray-900 font-medium">Parallel AI</span>
              <br />~$0.01/request
            </div>
            <div className="text-gray-500">
              <span className="text-gray-900 font-medium">Cloudinary</span>
              <br />Free tier
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
