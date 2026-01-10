import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Layers,
  Shapes,
  ImageIcon,
  Upload,
  X,
  ChevronDown,
  Package,
  Building2,
} from 'lucide-react';
import type { AdStyle, Product } from '../../types';

interface StyleSelectorProps {
  brandName: string;
  products: Product[];
  onGenerate: (
    style: AdStyle,
    options: {
      customInstructions?: string;
      productIndex?: number;
      productImage?: File;
    }
  ) => void;
  isGenerating: boolean;
}

const styles: {
  id: AdStyle;
  name: string;
  description: string;
  icon: typeof Sparkles;
  gradient: string;
  preview: string;
}[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, elegant, premium feel',
    icon: Sparkles,
    gradient: 'from-gray-700 to-gray-900',
    preview: 'bg-gradient-to-br from-gray-100 to-white',
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Modern color transitions',
    icon: Layers,
    gradient: 'from-indigo-500 to-purple-600',
    preview: 'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    description: 'Artistic, creative shapes',
    icon: Shapes,
    gradient: 'from-amber-500 to-orange-600',
    preview: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Contextual, relatable scenes',
    icon: ImageIcon,
    gradient: 'from-green-500 to-teal-600',
    preview: 'bg-gradient-to-br from-green-400 via-teal-500 to-cyan-500',
  },
];

export function StyleSelector({
  brandName,
  products,
  onGenerate,
  isGenerating,
}: StyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<AdStyle | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string>('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      setProductPreview(URL.createObjectURL(file));
    }
  };

  const removeProductImage = () => {
    setProductImage(null);
    setProductPreview('');
  };

  const handleGenerate = () => {
    if (selectedStyle) {
      onGenerate(selectedStyle, {
        customInstructions: customInstructions || undefined,
        productIndex: selectedProductIndex ?? undefined,
        productImage: productImage || undefined,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Ad</h2>
        <p className="text-gray-500">
          Choose a style for your <span className="font-semibold text-indigo-600">{brandName}</span> ad
        </p>
      </motion.div>

      {/* Product Selector (if products exist) */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            What are we advertising?
          </label>
          <div className="relative">
            <button
              onClick={() => setShowProductDropdown(!showProductDropdown)}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-300 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {selectedProductIndex !== null ? (
                  <>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                      <Package size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {products[selectedProductIndex].name}
                      </p>
                      <p className="text-sm text-gray-500">Product-specific ad</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800">
                      <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Overall Brand</p>
                      <p className="text-sm text-gray-500">General brand awareness ad</p>
                    </div>
                  </>
                )}
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-400 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showProductDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto"
                >
                  <button
                    onClick={() => {
                      setSelectedProductIndex(null);
                      setShowProductDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left ${
                      selectedProductIndex === null ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800">
                      <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Overall Brand</p>
                      <p className="text-sm text-gray-500">General brand awareness ad</p>
                    </div>
                  </button>

                  <div className="border-t border-gray-100" />

                  {products.map((product, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedProductIndex(index);
                        setShowProductDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left ${
                        selectedProductIndex === index ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Package size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Style Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {styles.map((style, index) => (
          <motion.button
            key={style.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedStyle(style.id)}
            className={`
              relative p-6 rounded-2xl text-left transition-all overflow-hidden
              ${selectedStyle === style.id
                ? 'ring-2 ring-indigo-500 ring-offset-2 bg-white shadow-lg'
                : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            {/* Preview gradient */}
            <div className={`absolute top-0 right-0 w-24 h-24 ${style.preview} opacity-30 blur-2xl`} />

            <div
              className={`
                relative z-10 p-3 rounded-xl w-fit mb-4 bg-gradient-to-br ${style.gradient}
                shadow-lg
              `}
            >
              <style.icon size={24} className="text-white" />
            </div>

            <h3 className="relative z-10 font-bold text-gray-900 text-lg">{style.name}</h3>
            <p className="relative z-10 text-sm text-gray-500 mt-1">{style.description}</p>

            {selectedStyle === style.id && (
              <motion.div
                layoutId="selectedIndicator"
                className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Product Image Upload (Optional) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Product Image <span className="font-normal text-gray-400">(Optional)</span>
        </label>

        {productPreview ? (
          <div className="relative inline-block">
            <img
              src={productPreview}
              alt="Product preview"
              className="w-32 h-32 object-contain rounded-xl border-2 border-gray-200 bg-white shadow-sm"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={removeProductImage}
              className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
            >
              <X size={14} />
            </motion.button>
          </div>
        ) : (
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="flex flex-col items-center text-gray-500 group-hover:text-indigo-600 transition-colors">
              <Upload size={24} className="mb-2" />
              <span className="text-sm font-medium">Upload product image</span>
              <span className="text-xs text-gray-400 group-hover:text-indigo-400">or let AI generate one</span>
            </div>
          </label>
        )}
      </motion.div>

      {/* Custom Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mb-8"
      >
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Custom Instructions <span className="font-normal text-gray-400">(Optional)</span>
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="e.g., Make it feel more premium and exclusive, focus on the AI features..."
          className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all"
          rows={3}
        />
      </motion.div>

      {/* Generate Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleGenerate}
        disabled={!selectedStyle || isGenerating}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all
          ${selectedStyle && !isGenerating
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
            Generating Your Ad...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Sparkles size={20} />
            Generate Ad
          </span>
        )}
      </motion.button>
    </motion.div>
  );
}
