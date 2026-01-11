import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Lightbulb,
  TrendingUp,
  Target,
  Palette,
  Users,
  Zap,
  BarChart3,
  Eye,
  MessageSquare,
  Clock,
  Sparkles,
  Rocket
} from 'lucide-react';

const marketingTips = [
  {
    icon: Eye,
    title: "Visual Hierarchy Matters",
    tip: "Ads with a clear focal point get 67% more engagement. Place your main message where eyes naturally land first.",
    color: "from-blue-500 to-cyan-500",
    stat: "67%",
    statLabel: "more engagement"
  },
  {
    icon: Users,
    title: "Faces Build Trust",
    tip: "Ads featuring human faces receive 38% higher click-through rates. People connect with people, not products.",
    color: "from-purple-500 to-pink-500",
    stat: "38%",
    statLabel: "higher CTR"
  },
  {
    icon: Palette,
    title: "Color Psychology",
    tip: "Contrasting CTA buttons increase conversions by 21%. Use complementary colors to make actions pop.",
    color: "from-orange-500 to-red-500",
    stat: "21%",
    statLabel: "more conversions"
  },
  {
    icon: MessageSquare,
    title: "Less Is More",
    tip: "Ads with 5 words or fewer in headlines perform 40% better. Clear, concise messaging wins every time.",
    color: "from-green-500 to-emerald-500",
    stat: "40%",
    statLabel: "better performance"
  },
  {
    icon: Clock,
    title: "Timing Is Everything",
    tip: "Social media ads posted between 1-3 PM get 22% more engagement. Know when your audience is active.",
    color: "from-indigo-500 to-purple-500",
    stat: "22%",
    statLabel: "more engagement"
  },
  {
    icon: Target,
    title: "Personalization Pays",
    tip: "Personalized ads deliver 5-8x ROI on marketing spend. Speak directly to your audience's needs.",
    color: "from-rose-500 to-orange-500",
    stat: "5-8x",
    statLabel: "ROI increase"
  },
  {
    icon: TrendingUp,
    title: "Video Dominates",
    tip: "Video ads have 135% greater organic reach than image posts. Motion captures attention instantly.",
    color: "from-teal-500 to-cyan-500",
    stat: "135%",
    statLabel: "greater reach"
  },
  {
    icon: BarChart3,
    title: "A/B Test Everything",
    tip: "Companies that A/B test see 37% higher conversion rates. Small tweaks can lead to big wins.",
    color: "from-amber-500 to-yellow-500",
    stat: "37%",
    statLabel: "higher conversions"
  },
  {
    icon: Zap,
    title: "Speed Matters",
    tip: "53% of mobile users leave if a page takes over 3 seconds. Optimize your landing pages for speed.",
    color: "from-violet-500 to-purple-500",
    stat: "53%",
    statLabel: "bounce rate"
  },
  {
    icon: Lightbulb,
    title: "Emotional Appeal",
    tip: "Emotionally-driven campaigns perform 2x better than rational ones. Make your audience feel something.",
    color: "from-pink-500 to-rose-500",
    stat: "2x",
    statLabel: "better performance"
  }
];

interface WarmupLoaderProps {
  onReady?: () => void;
  message?: string;
}

export function WarmupLoader({ onReady, message = "Waking up our servers..." }: WarmupLoaderProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate tips every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % marketingTips.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Cap at 95% until actually ready
        return prev + Math.random() * 3;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const currentTip = marketingTips[currentTipIndex];
  const Icon = currentTip.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50"
    >
      <div className="max-w-lg w-full mx-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
          <p className="text-gray-400 text-sm">While you wait, here's a marketing tip...</p>
        </motion.div>

        {/* Tip Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTipIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
          >
            {/* Icon and Stat */}
            <div className="flex items-start justify-between mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className={`p-3 rounded-xl bg-gradient-to-br ${currentTip.color} shadow-lg`}
              >
                <Icon className="w-6 h-6 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-right"
              >
                <div className={`text-3xl font-bold bg-gradient-to-r ${currentTip.color} bg-clip-text text-transparent`}>
                  {currentTip.stat}
                </div>
                <div className="text-xs text-gray-400">{currentTip.statLabel}</div>
              </motion.div>
            </div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold text-white mb-2"
            >
              {currentTip.title}
            </motion.h3>

            {/* Tip Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-300 leading-relaxed"
            >
              {currentTip.tip}
            </motion.p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-6">
              {marketingTips.slice(0, 5).map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index === currentTipIndex % 5
                      ? 'bg-white'
                      : 'bg-white/30'
                  }`}
                  animate={index === currentTipIndex % 5 ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Connecting to server...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Fun fact footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Pro tip #{currentTipIndex + 1} of {marketingTips.length}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
