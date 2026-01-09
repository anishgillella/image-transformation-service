import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onAnalyze, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onAnalyze(url.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full mb-6 border border-indigo-200/50"
        >
          <Sparkles size={16} className="text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">AI-Powered Ad Creation</span>
        </motion.div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
            AdForge
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-lg mx-auto leading-relaxed">
          Enter any website and we'll create brand-perfect ads in seconds
        </p>
      </motion.div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          animate={{
            boxShadow: isFocused
              ? '0 0 0 4px rgba(99, 102, 241, 0.1), 0 20px 40px -15px rgba(0, 0, 0, 0.1)'
              : '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
          }}
          transition={{ duration: 0.2 }}
          className={`
            flex items-center gap-4 p-2 pl-6 bg-white rounded-2xl border-2 transition-colors duration-200
            ${isFocused ? 'border-indigo-400' : 'border-gray-200'}
          `}
        >
          <Globe
            size={24}
            className={`flex-shrink-0 transition-colors ${isFocused ? 'text-indigo-500' : 'text-gray-400'}`}
          />

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter company website (e.g., stripe.com)"
            disabled={isLoading}
            className="flex-1 text-lg py-3 outline-none bg-transparent placeholder:text-gray-400 disabled:opacity-50"
          />

          <motion.button
            type="submit"
            disabled={!url.trim() || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200
              ${url.trim() && !isLoading
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </motion.div>
      </form>

      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-gray-400 mt-6"
      >
        We'll analyze the brand's identity, products, and create tailored ad campaigns
      </motion.p>

      {/* Example URLs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-3 mt-4"
      >
        <span className="text-xs text-gray-400">Try:</span>
        {['stripe.com', 'notion.so', 'linear.app'].map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setUrl(example)}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
          >
            {example}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
