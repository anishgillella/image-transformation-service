import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Loader2,
  Check,
  AlertTriangle,
  DollarSign,
  Package,
  Layers,
  Shapes,
  ImageIcon,
  XCircle,
  StopCircle,
  CheckCircle2,
  Image,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product, AdStyle, GeneratedAd } from '../../types';

// Cost constants (matching backend costTracker.ts)
const COSTS = {
  GEMINI_PER_AD: 0.01, // ~500 tokens in + ~300 tokens out
  FLUX_PRO: 0.04, // Per image generation
  FLUX_FILL: 0.05, // Per image with product
  CLOUDINARY: 0, // Free tier
};

const COST_WITHOUT_PRODUCT = COSTS.GEMINI_PER_AD + COSTS.FLUX_PRO; // ~$0.05
const COST_WITH_PRODUCT = COSTS.GEMINI_PER_AD + COSTS.FLUX_FILL; // ~$0.06

// Parallel generation settings
const PARALLEL_BATCH_SIZE = 4; // Generate 4 ads at a time

interface BatchGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  brandName: string;
  products: Product[];
  onBatchComplete: (ads: GeneratedAd[]) => void;
}

interface BatchItem {
  productIndex: number | null; // null = brand-level
  style: AdStyle;
  productName: string;
  status: 'pending' | 'generating' | 'complete' | 'error' | 'cancelled';
  ad?: GeneratedAd;
  error?: string;
}

const STYLES: { id: AdStyle; name: string; icon: typeof Sparkles }[] = [
  { id: 'minimal', name: 'Minimal', icon: Sparkles },
  { id: 'gradient', name: 'Gradient', icon: Layers },
  { id: 'abstract', name: 'Abstract', icon: Shapes },
  { id: 'lifestyle', name: 'Lifestyle', icon: ImageIcon },
];

export function BatchGenerateModal({
  isOpen,
  onClose,
  profileId,
  brandName,
  products,
  onBatchComplete,
}: BatchGenerateModalProps) {
  // Selection state
  const [selectedProducts, setSelectedProducts] = useState<Set<number | null>>(new Set());
  const [selectedStyles, setSelectedStyles] = useState<Set<AdStyle>>(new Set());
  const [includeProductImages, setIncludeProductImages] = useState(true);
  const [budgetLimit, setBudgetLimit] = useState<number>(0); // 0 = no limit
  const [customBudget, setCustomBudget] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedAds, setCompletedAds] = useState<GeneratedAd[]>([]);
  const cancelRef = useRef(false);

  // Calculate estimated cost
  const estimatedCost = useCallback(() => {
    const numAds = selectedProducts.size * selectedStyles.size;
    const costPerAd = includeProductImages ? COST_WITH_PRODUCT : COST_WITHOUT_PRODUCT;
    return numAds * costPerAd;
  }, [selectedProducts.size, selectedStyles.size, includeProductImages]);

  // Toggle product selection
  const toggleProduct = (index: number | null) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedProducts(newSelection);
  };

  // Toggle style selection
  const toggleStyle = (style: AdStyle) => {
    const newSelection = new Set(selectedStyles);
    if (newSelection.has(style)) {
      newSelection.delete(style);
    } else {
      newSelection.add(style);
    }
    setSelectedStyles(newSelection);
  };

  // Select all products
  const selectAllProducts = () => {
    const all = new Set<number | null>([null, ...products.map((_, i) => i)]);
    setSelectedProducts(all);
  };

  // Select all styles
  const selectAllStyles = () => {
    setSelectedStyles(new Set(STYLES.map((s) => s.id)));
  };

  // Clear selections
  const clearSelections = () => {
    setSelectedProducts(new Set());
    setSelectedStyles(new Set());
  };

  // Handle budget input
  const handleBudgetChange = (value: string) => {
    setCustomBudget(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setBudgetLimit(num);
    } else if (value === '') {
      setBudgetLimit(0);
    }
  };

  // Generate a single ad
  const generateSingleAd = async (
    item: BatchItem,
    index: number,
    API_URL: string
  ): Promise<{ index: number; success: boolean; ad?: GeneratedAd; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('profileId', profileId);
      formData.append('style', item.style);

      // Debug logging
      console.log(`[BatchGenerate] Generating ad for: productIndex=${item.productIndex}, productName=${item.productName}, style=${item.style}`);

      if (item.productIndex !== null) {
        formData.append('productIndex', item.productIndex.toString());
        console.log(`[BatchGenerate] Appending productIndex: ${item.productIndex}`);
      } else {
        console.log(`[BatchGenerate] No productIndex (Overall Brand)`);
      }

      const response = await fetch(`${API_URL}/adforge/generate`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.ad) {
        return { index, success: true, ad: data.ad };
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      return {
        index,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Start batch generation with parallel processing
  const startBatchGeneration = async () => {
    if (selectedProducts.size === 0 || selectedStyles.size === 0) {
      toast.error('Please select at least one product and one style');
      return;
    }

    // Build batch items - capture current selections to avoid stale closure
    const currentSelectedProducts = Array.from(selectedProducts);
    const currentSelectedStyles = Array.from(selectedStyles);

    const items: BatchItem[] = [];
    console.log('[BatchGenerate] Selected products:', currentSelectedProducts);
    console.log('[BatchGenerate] Selected styles:', currentSelectedStyles);
    console.log('[BatchGenerate] Available products:', products.map((p, i) => `${i}: ${p.name}`));

    for (const productIdx of currentSelectedProducts) {
      for (const style of currentSelectedStyles) {
        const productName = productIdx === null ? 'Brand' : products[productIdx]?.name || 'Unknown';
        console.log(`[BatchGenerate] Adding batch item: productIdx=${productIdx}, productName=${productName}, style=${style}`);
        items.push({
          productIndex: productIdx,
          style,
          productName,
          status: 'pending',
        });
      }
    }

    console.log('[BatchGenerate] Total batch items:', items.length);

    // Initialize state before starting
    const initialItems = [...items];
    setBatchItems(initialItems);
    setTotalSpent(0);
    setCompletedAds([]);
    setIsGenerating(true);
    cancelRef.current = false;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const costPerAd = includeProductImages ? COST_WITH_PRODUCT : COST_WITHOUT_PRODUCT;
    let spent = 0;
    const completed: GeneratedAd[] = [];

    // Use a mutable copy to track state changes
    const itemsState = initialItems.map(item => ({ ...item }));

    // Process items in parallel batches
    for (let batchStart = 0; batchStart < items.length; batchStart += PARALLEL_BATCH_SIZE) {
      // Check for cancellation before starting a new batch
      if (cancelRef.current) {
        for (let i = batchStart; i < items.length; i++) {
          if (itemsState[i].status === 'pending') {
            itemsState[i].status = 'cancelled';
          }
        }
        setBatchItems([...itemsState]);
        break;
      }

      // Check budget limit before starting batch
      const remainingItems = items.length - batchStart;
      const batchSize = Math.min(PARALLEL_BATCH_SIZE, remainingItems);
      const batchCost = batchSize * costPerAd;

      if (budgetLimit > 0 && spent + batchCost > budgetLimit) {
        // Calculate how many we can still afford
        const affordable = Math.floor((budgetLimit - spent) / costPerAd);
        if (affordable <= 0) {
          toast.warning(`Budget limit of $${budgetLimit.toFixed(2)} reached`);
          for (let i = batchStart; i < items.length; i++) {
            if (itemsState[i].status === 'pending') {
              itemsState[i].status = 'cancelled';
            }
          }
          setBatchItems([...itemsState]);
          break;
        }
      }

      // Get items for this batch
      const batchEnd = Math.min(batchStart + PARALLEL_BATCH_SIZE, items.length);
      const batchIndices = Array.from({ length: batchEnd - batchStart }, (_, i) => batchStart + i);

      // Mark batch items as generating
      for (const idx of batchIndices) {
        itemsState[idx].status = 'generating';
      }
      setBatchItems([...itemsState]);

      // Generate all items in this batch in parallel
      const batchPromises = batchIndices.map((idx) =>
        generateSingleAd(items[idx], idx, API_URL)
      );

      const results = await Promise.all(batchPromises);

      // Process results and update state
      for (const result of results) {
        if (result.success && result.ad) {
          spent += costPerAd;
          completed.push(result.ad);
          itemsState[result.index] = {
            ...itemsState[result.index],
            status: 'complete',
            ad: result.ad,
          };
        } else {
          itemsState[result.index] = {
            ...itemsState[result.index],
            status: 'error',
            error: result.error,
          };
        }
      }

      // Update all state after processing batch results
      setBatchItems([...itemsState]);
      setTotalSpent(spent);
      setCompletedAds([...completed]);
    }

    setIsGenerating(false);

    if (completed.length > 0) {
      toast.success(`Generated ${completed.length} ads in parallel!`);
      onBatchComplete(completed);
    }
  };

  // Cancel generation
  const cancelGeneration = () => {
    cancelRef.current = true;
    toast.info('Cancelling... completing current ad');
  };

  // Reset modal on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedProducts(new Set());
      setSelectedStyles(new Set());
      setIncludeProductImages(true);
      setBudgetLimit(0);
      setCustomBudget('');
      setIsGenerating(false);
      setBatchItems([]);
      setTotalSpent(0);
      setCompletedAds([]);
      cancelRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numAds = selectedProducts.size * selectedStyles.size;
  const estimated = estimatedCost();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Batch Generate Ads</h2>
              <p className="text-sm text-gray-500 mt-1">
                Generate multiple ads at once for {brandName}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {!isGenerating ? (
              <>
                {/* Product Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Select Products ({selectedProducts.size} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllProducts}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => setSelectedProducts(new Set())}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {/* Brand-level option */}
                    <button
                      onClick={() => toggleProduct(null)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedProducts.has(null)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          selectedProducts.has(null)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Sparkles size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">Overall Brand</div>
                        <div className="text-xs text-gray-500">General awareness</div>
                      </div>
                      {selectedProducts.has(null) && (
                        <Check size={16} className="text-indigo-600 flex-shrink-0" />
                      )}
                    </button>

                    {/* Products */}
                    {products.map((product, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleProduct(idx)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selectedProducts.has(idx)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            selectedProducts.has(idx)
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Package size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{product.name}</div>
                          <div className="text-xs text-gray-500 truncate">{product.description}</div>
                        </div>
                        {selectedProducts.has(idx) && (
                          <Check size={16} className="text-indigo-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Select Styles ({selectedStyles.size} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllStyles}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => setSelectedStyles(new Set())}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => toggleStyle(style.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          selectedStyles.has(style.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            selectedStyles.has(style.id)
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <style.icon size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{style.name}</span>
                        {selectedStyles.has(style.id) && (
                          <Check size={14} className="text-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="mb-6 space-y-4">
                  {/* Skip product images option */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Image size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Include Product Images</div>
                        <div className="text-xs text-gray-500">
                          {includeProductImages
                            ? `Uses Flux Fill ($${COST_WITH_PRODUCT.toFixed(2)}/ad)`
                            : `Uses Flux Pro ($${COST_WITHOUT_PRODUCT.toFixed(2)}/ad)`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIncludeProductImages(!includeProductImages)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        includeProductImages ? 'bg-indigo-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          includeProductImages ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Budget limit */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <DollarSign size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Budget Limit</div>
                        <div className="text-xs text-gray-500">
                          Stop generation when cost exceeds this amount
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customBudget}
                        onChange={(e) => handleBudgetChange(e.target.value)}
                        placeholder="0.00 (no limit)"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
                      />
                      <div className="flex gap-1">
                        {[0.50, 1.00, 2.00].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => {
                              setBudgetLimit(amount);
                              setCustomBudget(amount.toFixed(2));
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              budgetLimit === amount
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            ${amount.toFixed(2)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Estimate */}
                {numAds > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border-2 ${
                      budgetLimit > 0 && estimated > budgetLimit
                        ? 'bg-red-50 border-red-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        size={20}
                        className={
                          budgetLimit > 0 && estimated > budgetLimit
                            ? 'text-red-500'
                            : 'text-amber-500'
                        }
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Cost Estimate</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-bold text-lg">${estimated.toFixed(2)}</span>
                          {' '}for {numAds} ad{numAds !== 1 ? 's' : ''}{' '}
                          ({selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} ×{' '}
                          {selectedStyles.size} style{selectedStyles.size !== 1 ? 's' : ''})
                        </div>
                        {budgetLimit > 0 && estimated > budgetLimit && (
                          <div className="text-sm text-red-600 mt-2">
                            Exceeds budget limit of ${budgetLimit.toFixed(2)} - generation will stop early
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              /* Generation Progress */
              <div className="space-y-4">
                {/* Progress Summary */}
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                  <div>
                    <div className="font-semibold text-gray-900">
                      Generating in parallel ({PARALLEL_BATCH_SIZE} at a time)
                    </div>
                    <div className="text-sm text-gray-600">
                      Completed: {completedAds.length}/{batchItems.length} | Spent: ${totalSpent.toFixed(2)}
                      {budgetLimit > 0 && ` / $${budgetLimit.toFixed(2)}`}
                    </div>
                  </div>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${(completedAds.length / batchItems.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Batch Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {batchItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        item.status === 'generating'
                          ? 'border-indigo-300 bg-indigo-50'
                          : item.status === 'complete'
                          ? 'border-green-200 bg-green-50'
                          : item.status === 'error'
                          ? 'border-red-200 bg-red-50'
                          : item.status === 'cancelled'
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {item.status === 'generating' && (
                          <Loader2 size={18} className="text-indigo-500 animate-spin" />
                        )}
                        {item.status === 'complete' && (
                          <CheckCircle2 size={18} className="text-green-500" />
                        )}
                        {item.status === 'error' && (
                          <XCircle size={18} className="text-red-500" />
                        )}
                        {item.status === 'cancelled' && (
                          <StopCircle size={18} className="text-gray-400" />
                        )}
                        {item.status === 'pending' && (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.productName} - {item.style}
                        </div>
                        {item.error && (
                          <div className="text-xs text-red-600">{item.error}</div>
                        )}
                      </div>
                      {item.status === 'complete' && item.ad && (
                        <img
                          src={item.ad.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {!isGenerating ? (
              <div className="flex gap-3">
                <button
                  onClick={clearSelections}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear All
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={startBatchGeneration}
                  disabled={numAds === 0}
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
                >
                  <Sparkles size={20} />
                  Generate {numAds} Ad{numAds !== 1 ? 's' : ''} (~${estimated.toFixed(2)})
                </motion.button>
              </div>
            ) : (
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={cancelGeneration}
                  disabled={cancelRef.current}
                  className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <StopCircle size={20} />
                  {cancelRef.current ? 'Cancelling...' : 'Cancel Generation'}
                </motion.button>
                {completedAds.length > 0 && (
                  <button
                    onClick={onClose}
                    className="px-6 py-3.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
