import { motion } from 'framer-motion';
import { Globe, Brain, Palette, Target, Package, Sparkles } from 'lucide-react';

interface AnalyzingStateProps {
  url: string;
}

const steps = [
  { icon: Globe, label: 'Scanning website', color: 'from-blue-500 to-cyan-500' },
  { icon: Brain, label: 'Analyzing brand identity', color: 'from-purple-500 to-pink-500' },
  { icon: Package, label: 'Extracting products', color: 'from-orange-500 to-red-500' },
  { icon: Palette, label: 'Identifying visual style', color: 'from-green-500 to-emerald-500' },
  { icon: Target, label: 'Profiling target audience', color: 'from-indigo-500 to-purple-500' },
];

export function AnalyzingState({ url }: AnalyzingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center py-8"
    >
      {/* Animated Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="relative mb-10"
      >
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 w-32 h-32 rounded-full border-2 border-dashed border-indigo-200"
        />

        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 w-28 h-28 rounded-full border-2 border-dashed border-purple-200"
        />

        {/* Inner glowing orb */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 20px rgba(99, 102, 241, 0.3)',
              '0 0 40px rgba(99, 102, 241, 0.5)',
              '0 0 20px rgba(99, 102, 241, 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
        >
          <Sparkles size={40} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-gray-900 mb-2"
      >
        Analyzing Brand
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 mb-10 px-4 py-2 bg-gray-100 rounded-full text-sm"
      >
        {url}
      </motion.p>

      {/* Steps */}
      <div className="space-y-4 w-full max-w-sm">
        {steps.map((step, index) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.15 }}
            className="flex items-center gap-4"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
              className={`p-3 rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}
            >
              <step.icon size={20} className="text-white" />
            </motion.div>

            <div className="flex-1">
              <p className="text-gray-700 font-medium">{step.label}</p>
              <motion.div
                className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden"
              >
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    delay: 0.5 + index * 0.3,
                    duration: 2,
                    ease: 'easeInOut',
                  }}
                  className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
                />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Estimated time */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-sm text-gray-400 mt-10"
      >
        This usually takes 10-20 seconds
      </motion.p>
    </motion.div>
  );
}
