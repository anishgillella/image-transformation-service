import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, RotateCcw, ChevronDown, ChevronUp, Zap, Image, Globe, Cloud } from 'lucide-react';
import { getCosts, resetCosts } from '../services/cost-api';
import type { CostSummary } from '../types';

// Model icons mapping
const MODEL_ICONS: Record<string, React.ReactNode> = {
  'gemini-3-flash': <Zap className="w-4 h-4" />,
  'flux-pro-1.1': <Image className="w-4 h-4" />,
  'flux-pro-fill': <Image className="w-4 h-4" />,
  'remove-bg': <Image className="w-4 h-4" />,
  'parallel-ai': <Globe className="w-4 h-4" />,
  'cloudinary': <Cloud className="w-4 h-4" />,
};

// Model colors for the distribution chart
const MODEL_COLORS: Record<string, string> = {
  'gemini-3-flash': '#4285F4',
  'flux-pro-1.1': '#9333EA',
  'flux-pro-fill': '#A855F7',
  'remove-bg': '#10B981',
  'parallel-ai': '#F59E0B',
  'cloudinary': '#06B6D4',
};

interface CostTrackerProps {
  refreshInterval?: number; // ms between refreshes, default 5000
  minimized?: boolean;
}

export function CostTracker({ refreshInterval = 5000, minimized: initialMinimized = true }: CostTrackerProps) {
  const [costs, setCosts] = useState<CostSummary | null>(null);
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const fetchCosts = useCallback(async () => {
    try {
      const data = await getCosts();
      if (data.success) {
        setCosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch costs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(async () => {
    try {
      await resetCosts();
      await fetchCosts();
    } catch (error) {
      console.error('Failed to reset costs:', error);
    }
  }, [fetchCosts]);

  useEffect(() => {
    fetchCosts();
    const interval = setInterval(fetchCosts, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchCosts, refreshInterval]);

  if (isLoading || !costs) {
    return null;
  }

  const hasAnyCosts = costs.totalCost > 0;
  const modelEntries = Object.entries(costs.byModel).filter(([, data]) => data.totalCost > 0);

  // Calculate percentages for distribution
  const distribution = modelEntries.map(([model, data]) => ({
    model,
    ...data,
    percentage: costs.totalCost > 0 ? (data.totalCost / costs.totalCost) * 100 : 0,
  })).sort((a, b) => b.totalCost - a.totalCost);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-full shadow-lg hover:border-zinc-600 transition-colors"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-mono text-white">
              ${costs.totalCost.toFixed(4)}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-80 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-white">Cost Tracker</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Reset costs"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total Cost */}
            <div className="px-4 py-4 border-b border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Session Total</div>
              <div className="text-3xl font-mono font-bold text-white">
                ${costs.totalCost.toFixed(4)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Since {new Date(costs.sessionStart).toLocaleTimeString()}
              </div>
            </div>

            {/* Distribution Bar */}
            {hasAnyCosts && (
              <div className="px-4 py-3 border-b border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Distribution</div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                  {distribution.map(({ model, percentage }) => (
                    <motion.div
                      key={model}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full"
                      style={{ backgroundColor: MODEL_COLORS[model] || '#6B7280' }}
                      title={`${model}: ${percentage.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Model Breakdown */}
            {hasAnyCosts && (
              <div className="px-4 py-3">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full text-xs text-zinc-500 uppercase tracking-wide mb-2 hover:text-zinc-400 transition-colors"
                >
                  <span>By Model</span>
                  {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {distribution.map(({ model, displayName, totalCost, count, tokens, images, requests }) => (
                        <div
                          key={model}
                          className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg"
                        >
                          <div
                            className="p-1.5 rounded-md"
                            style={{ backgroundColor: `${MODEL_COLORS[model]}20` }}
                          >
                            <span style={{ color: MODEL_COLORS[model] }}>
                              {MODEL_ICONS[model] || <Zap className="w-4 h-4" />}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {displayName}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {count} {count === 1 ? 'call' : 'calls'}
                              {tokens && ` • ${(tokens.input + tokens.output).toLocaleString()} tokens`}
                              {images && ` • ${images} ${images === 1 ? 'image' : 'images'}`}
                              {requests && ` • ${requests} ${requests === 1 ? 'request' : 'requests'}`}
                            </div>
                          </div>
                          <div className="text-sm font-mono text-emerald-400">
                            ${totalCost.toFixed(4)}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Empty State */}
            {!hasAnyCosts && (
              <div className="px-4 py-6 text-center">
                <div className="text-zinc-500 text-sm">No costs tracked yet</div>
                <div className="text-zinc-600 text-xs mt-1">Generate an ad to see costs</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
