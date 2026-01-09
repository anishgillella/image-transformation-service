import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ProcessingStateProps {
  status: string;
  preview?: string;
}

export function ProcessingState({ status, preview }: ProcessingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-[400px] flex flex-col items-center gap-6"
    >
      {/* Image Preview */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-lg"
        >
          <img
            src={preview}
            alt="Processing"
            className="w-full h-full object-contain"
          />

          {/* Overlay with spinner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="p-4 rounded-full bg-white/90 shadow-lg"
            >
              <Loader2 size={32} className="text-[#0066FF] animate-spin" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Status Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-medium text-gray-700"
        >
          {status}
        </motion.p>

        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-[#0066FF]"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
