import { motion } from 'framer-motion';
import { Wand2, ImageIcon, Type, Sparkles, Zap } from 'lucide-react';

interface GeneratingStateProps {
  brandName: string;
  style: string;
  productName?: string;
}

const steps = [
  { icon: Wand2, label: 'Crafting image prompt', color: 'from-indigo-500 to-purple-500' },
  { icon: ImageIcon, label: 'Generating visuals', color: 'from-purple-500 to-pink-500' },
  { icon: Type, label: 'Writing ad copy', color: 'from-pink-500 to-rose-500' },
  { icon: Sparkles, label: 'Finalizing your ad', color: 'from-rose-500 to-orange-500' },
];

export function GeneratingState({ brandName, style, productName }: GeneratingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center py-8"
    >
      {/* Animated Visual */}
      <motion.div className="relative w-56 h-56 mb-10">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-200"
        />

        {/* Second ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 rounded-full border-2 border-dashed border-purple-200"
        />

        {/* Third ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-8 rounded-full border-2 border-dashed border-pink-200"
        />

        {/* Orbiting dots */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.5,
            }}
            className="absolute inset-0"
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-r ${steps[i].color}`}
            />
          </motion.div>
        ))}

        {/* Center icon */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              '0 0 30px rgba(99, 102, 241, 0.3)',
              '0 0 60px rgba(99, 102, 241, 0.5)',
              '0 0 30px rgba(99, 102, 241, 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl"
        >
          <Zap size={48} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-gray-900 mb-2"
      >
        Creating Your Ad
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 mb-10 text-center"
      >
        <span className="font-semibold text-indigo-600">{brandName}</span>
        {productName && (
          <>
            {' '}• <span className="font-medium">{productName}</span>
          </>
        )}
        {' '}• <span className="capitalize">{style}</span> style
      </motion.p>

      {/* Progress Steps */}
      <div className="space-y-4 w-full max-w-sm">
        {steps.map((step, index) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.2 }}
            className="flex items-center gap-4"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.4,
              }}
              className={`p-3 rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}
            >
              <step.icon size={20} className="text-white" />
            </motion.div>

            <div className="flex-1">
              <p className="text-gray-700 font-medium">{step.label}</p>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    delay: 0.5 + index * 1.5,
                    duration: 3,
                    ease: 'easeInOut',
                  }}
                  className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Time estimate */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-sm text-gray-400 mt-10"
      >
        This usually takes 15-30 seconds
      </motion.p>
    </motion.div>
  );
}
