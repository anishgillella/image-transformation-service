import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Pencil,
  Sparkles,
  Users,
  Megaphone,
  Palette,
  Building2,
  ChevronDown,
  ChevronUp,
  Package,
  Target,
  Zap,
} from 'lucide-react';
import type { BrandProfile, Product } from '../../types';

interface BrandProfileCardProps {
  profile: BrandProfile;
  onConfirm: () => void;
  onEdit: (updates: Partial<BrandProfile>) => void;
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 space-y-4">
              {/* Features */}
              <div>
                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Features</h5>
                <div className="flex flex-wrap gap-2">
                  {product.features.map((feature, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div className="flex items-start gap-2">
                <Target size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Target Audience</h5>
                  <p className="text-sm text-gray-700">{product.targetAudience}</p>
                </div>
              </div>

              {/* Promotion Angle */}
              <div className="flex items-start gap-2">
                <Zap size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Promotion Angle</h5>
                  <p className="text-sm text-gray-700 italic">"{product.promotionAngle}"</p>
                </div>
              </div>

              {/* Key Benefits */}
              <div>
                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Benefits</h5>
                <ul className="space-y-1">
                  {product.keyBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check size={14} className="text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function BrandProfileCard({ profile, onConfirm, onEdit: _onEdit }: BrandProfileCardProps) {
  const [showProducts, setShowProducts] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4 mb-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25"
        >
          <Sparkles size={28} className="text-white" />
        </motion.div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{profile.companyName}</h2>
          <p className="text-gray-500">{profile.url}</p>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden"
      >
        {/* Colors */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={18} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Brand Colors</h3>
          </div>
          <div className="flex gap-4">
            {Object.entries(profile.colors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-14 h-14 rounded-2xl shadow-lg border-2 border-white"
                  style={{ backgroundColor: color, boxShadow: `0 8px 20px ${color}40` }}
                />
                <div>
                  <p className="text-xs text-gray-400 capitalize">{name}</p>
                  <p className="text-sm font-mono font-medium text-gray-700">{color}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Personality</h3>
          <div className="flex flex-wrap gap-2">
            {profile.personality.map((trait, index) => (
              <motion.span
                key={trait}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100"
              >
                {trait}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-6 p-6 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <Users size={20} className="text-indigo-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Target Audience</h3>
              <p className="text-gray-700">{profile.targetAudience}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Megaphone size={20} className="text-purple-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Voice & Tone</h3>
              <p className="text-gray-700">{profile.voiceTone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Palette size={20} className="text-pink-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Visual Style</h3>
              <p className="text-gray-700">{profile.visualStyle}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 size={20} className="text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Industry</h3>
              <p className="text-gray-700">{profile.industry}</p>
            </div>
          </div>
        </div>

        {/* USPs */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Unique Selling Points</h3>
          <ul className="space-y-3">
            {profile.uniqueSellingPoints.map((usp, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-gray-700">{usp}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Products Section */}
        {profile.products.length > 0 && (
          <div className="p-6">
            <button
              onClick={() => setShowProducts(!showProducts)}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <Package size={18} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Products & Services ({profile.products.length})
                </h3>
              </div>
              {showProducts ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </button>

            <AnimatePresence>
              {showProducts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {profile.products.map((product, index) => (
                    <ProductCard key={index} product={product} index={index} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center gap-4 mt-8"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {}}
          className="flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
        >
          <Pencil size={18} />
          Edit Details
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
        >
          <Check size={18} />
          Looks Right - Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
