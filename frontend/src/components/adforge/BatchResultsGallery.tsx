import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Eye,
  RotateCcw,
  Check,
  Sparkles,
  Grid3X3,
  List,
  Package,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { GeneratedAd } from '../../types';

// Style colors for badges
const STYLE_COLORS: Record<string, string> = {
  minimal: 'bg-gray-700',
  gradient: 'bg-indigo-600',
  abstract: 'bg-amber-600',
  lifestyle: 'bg-green-600',
};

interface BatchResultsGalleryProps {
  ads: GeneratedAd[];
  brandName: string;
  onStartOver: () => void;
  onViewAd: (ad: GeneratedAd) => void;
}

export function BatchResultsGallery({
  ads,
  brandName,
  onStartOver,
  onViewAd,
}: BatchResultsGalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());

  const toggleSelect = (adId: string) => {
    const newSelection = new Set(selectedAds);
    if (newSelection.has(adId)) {
      newSelection.delete(adId);
    } else {
      newSelection.add(adId);
    }
    setSelectedAds(newSelection);
  };

  const selectAll = () => {
    setSelectedAds(new Set(ads.map((ad) => ad.id)));
  };

  const clearSelection = () => {
    setSelectedAds(new Set());
  };

  const downloadSelected = async () => {
    const toDownload = ads.filter((ad) => selectedAds.has(ad.id));

    for (const ad of toDownload) {
      const link = document.createElement('a');
      link.href = ad.imageUrl;
      link.download = `${brandName}-${ad.style}-ad.png`;
      link.target = '_blank';
      link.click();
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between downloads
    }

    toast.success(`Downloaded ${toDownload.length} ads`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-6xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25"
          >
            <Sparkles size={24} className="text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Batch Complete!
            </h2>
            <p className="text-gray-500">
              Generated {ads.length} ads for {brandName}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartOver}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <RotateCcw size={18} />
          Start Over
        </motion.button>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={18} />
            </button>
          </div>

          <div className="text-sm text-gray-500">
            {selectedAds.size > 0 && (
              <span className="font-medium text-indigo-600">
                {selectedAds.size} selected
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedAds.size > 0 ? (
            <>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Clear
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadSelected}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Download size={16} />
                Download {selectedAds.size}
              </motion.button>
            </>
          ) : (
            <button
              onClick={selectAll}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Select All
            </button>
          )}
        </div>
      </motion.div>

      {/* Gallery */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ads.map((ad, index) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                selectedAds.has(ad.id)
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleSelect(ad.id)}
            >
              <div className="aspect-square">
                <img
                  src={ad.imageUrl}
                  alt={`${brandName} ${ad.style} ad`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewAd(ad);
                  }}
                  className="p-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Eye size={18} />
                </button>
              </div>

              {/* Selection indicator */}
              <div
                className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedAds.has(ad.id)
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'bg-white/80 border-gray-300 group-hover:border-indigo-400'
                }`}
              >
                {selectedAds.has(ad.id) && (
                  <Check size={14} className="text-white" />
                )}
              </div>

              {/* Product & Style badges */}
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                {/* Product badge */}
                <span className="flex items-center gap-1 px-2 py-1 bg-white/90 text-gray-800 text-xs font-medium rounded-md shadow-sm">
                  {ad.productName ? (
                    <>
                      <Package size={10} />
                      <span className="truncate max-w-20">{ad.productName}</span>
                    </>
                  ) : (
                    <>
                      <Building2 size={10} />
                      Brand
                    </>
                  )}
                </span>
                {/* Style badge */}
                <span className={`px-2 py-1 ${STYLE_COLORS[ad.style] || 'bg-gray-600'} text-white text-xs font-medium rounded-md capitalize`}>
                  {ad.style}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad, index) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                selectedAds.has(ad.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => toggleSelect(ad.id)}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedAds.has(ad.id)
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedAds.has(ad.id) && (
                  <Check size={14} className="text-white" />
                )}
              </div>

              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={ad.imageUrl}
                  alt={`${brandName} ${ad.style} ad`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Product badge */}
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    {ad.productName ? (
                      <>
                        <Package size={10} />
                        {ad.productName}
                      </>
                    ) : (
                      <>
                        <Building2 size={10} />
                        Brand
                      </>
                    )}
                  </span>
                  {/* Style badge */}
                  <span className={`px-2 py-0.5 ${STYLE_COLORS[ad.style] || 'bg-gray-600'} text-white text-xs font-medium rounded capitalize`}>
                    {ad.style}
                  </span>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {ad.copy.headline}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewAd(ad);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye size={18} className="text-gray-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = ad.imageUrl;
                    link.download = `${brandName}-${ad.style}-ad.png`;
                    link.target = '_blank';
                    link.click();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download size={18} className="text-gray-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100"
      >
        <h3 className="font-semibold text-gray-900 mb-4">Generation Summary</h3>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{ads.length}</div>
            <div className="text-sm text-gray-500">Total Ads</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {new Set(ads.map((ad) => ad.productName || 'Brand')).size}
            </div>
            <div className="text-sm text-gray-500">Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600">
              {new Set(ads.map((ad) => ad.style)).size}
            </div>
            <div className="text-sm text-gray-500">Styles</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              ${(ads.length * 0.05).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Est. Cost</div>
          </div>
        </div>

        {/* Products breakdown */}
        <div className="border-t border-indigo-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">By Product:</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(ads.map((ad) => ad.productName || 'Overall Brand'))).map((productName) => {
              const count = ads.filter((ad) => (ad.productName || 'Overall Brand') === productName).length;
              return (
                <span
                  key={productName}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-sm shadow-sm"
                >
                  {productName === 'Overall Brand' ? (
                    <Building2 size={14} className="text-gray-500" />
                  ) : (
                    <Package size={14} className="text-indigo-500" />
                  )}
                  <span className="font-medium text-gray-800">{productName}</span>
                  <span className="text-gray-400">({count})</span>
                </span>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
