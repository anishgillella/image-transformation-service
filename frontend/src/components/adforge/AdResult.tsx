import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  RotateCcw,
  Share2,
  ExternalLink,
  Eye,
  FileDown,
} from 'lucide-react';
import type { GeneratedAd } from '../../types';
import { ExportModal } from './ExportModal';
import { AdPreviewModal } from './AdPreviewModal';
import { CopyVariationsPanel } from './CopyVariationsPanel';
import { BrandAssetLibrary } from './BrandAssetLibrary';

interface AdResultProps {
  ad: GeneratedAd;
  selectedProductName?: string;
  profileId?: string;
  onRegenerateCopy: () => void;
  onStartOver: () => void;
  isRegenerating: boolean;
  onAdUpdate?: (ad: GeneratedAd) => void;
}

export function AdResult({
  ad,
  selectedProductName,
  profileId,
  onRegenerateCopy,
  onStartOver,
  isRegenerating,
  onAdUpdate,
}: AdResultProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentAd, setCurrentAd] = useState(ad);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentAd.imageUrl;
    link.download = `${currentAd.brandProfile.companyName}-${currentAd.style}-ad.png`;
    link.target = '_blank';
    link.click();
  };

  const handleCopyUpdate = (newCopy: typeof currentAd.copy) => {
    const updatedAd = { ...currentAd, copy: newCopy };
    setCurrentAd(updatedAd);
    onAdUpdate?.(updatedAd);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${currentAd.brandProfile.companyName} Ad`,
        text: currentAd.copy.headline,
        url: currentAd.imageUrl,
      });
    } else {
      copyToClipboard(currentAd.imageUrl, 'share');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-5xl"
    >
      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        adId={currentAd.id}
        brandName={currentAd.brandProfile.companyName}
      />
      <AdPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        ad={currentAd}
      />

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
            className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25"
          >
            <Sparkles size={24} className="text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Ad is Ready!</h2>
            <p className="text-gray-500">
              {currentAd.brandProfile.companyName}
              {selectedProductName && ` • ${selectedProductName}`}
              {' '}• <span className="capitalize">{currentAd.style}</span> style
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartOver}
          className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <RotateCcw size={18} />
          Start Over
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-2 gap-8">
        {/* Image Preview */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 shadow-2xl shadow-gray-300/50 bg-gray-100">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="w-10 h-10 border-3 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}
            <motion.img
              src={currentAd.imageUrl}
              alt={`${currentAd.brandProfile.companyName} ad`}
              className="w-full aspect-square object-cover"
              onLoad={() => setImageLoaded(true)}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: imageLoaded ? 1 : 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Image Actions */}
          <div className="flex gap-3 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"
            >
              <Download size={20} />
              Download
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowExportModal(true)}
              className="px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              title="Export to platforms"
            >
              <FileDown size={20} className="text-gray-600" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              title="Preview on platforms"
            >
              <Eye size={20} className="text-gray-600" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Share2 size={20} className="text-gray-600" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open(currentAd.imageUrl, '_blank')}
              className="px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <ExternalLink size={20} className="text-gray-600" />
            </motion.button>
          </div>
        </motion.div>

        {/* Copy Section */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Headline */}
          <CopyBlock
            label="Headline"
            value={currentAd.copy.headline}
            onCopy={() => copyToClipboard(currentAd.copy.headline, 'headline')}
            isCopied={copiedField === 'headline'}
            className="text-2xl font-bold text-gray-900"
          />

          {/* Body */}
          <CopyBlock
            label="Body Copy"
            value={currentAd.copy.body}
            onCopy={() => copyToClipboard(currentAd.copy.body, 'body')}
            isCopied={copiedField === 'body'}
            className="text-gray-700"
          />

          {/* CTA */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-indigo-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Call to Action
              </span>
              <button
                onClick={() => copyToClipboard(currentAd.copy.cta, 'cta')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {copiedField === 'cta' ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} className="text-gray-400" />
                )}
              </button>
            </div>
            <span
              className="inline-block px-5 py-2.5 rounded-lg font-semibold text-white"
              style={{ backgroundColor: currentAd.brandProfile.colors.primary }}
            >
              {currentAd.copy.cta}
            </span>
          </div>

          {/* Hashtags */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-indigo-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Hashtags
              </span>
              <button
                onClick={() => copyToClipboard(currentAd.copy.hashtags.join(' '), 'hashtags')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {copiedField === 'hashtags' ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} className="text-gray-400" />
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentAd.copy.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>

          {/* Regenerate Copy Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onRegenerateCopy}
            disabled={isRegenerating}
            className="w-full py-3.5 border-2 border-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={isRegenerating ? 'animate-spin' : ''} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Copy'}
          </motion.button>

          {/* Copy Variations Panel */}
          <CopyVariationsPanel
            adId={currentAd.id}
            currentCopy={currentAd.copy}
            onCopyUpdate={handleCopyUpdate}
          />

          {/* Brand Asset Library */}
          {profileId && (
            <BrandAssetLibrary
              profileId={profileId}
              initialColors={currentAd.brandProfile.colors}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function CopyBlock({
  label,
  value,
  onCopy,
  isCopied,
  className,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  className?: string;
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-indigo-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
        <button
          onClick={onCopy}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isCopied ? (
            <Check size={16} className="text-green-500" />
          ) : (
            <Copy size={16} className="text-gray-400" />
          )}
        </button>
      </div>
      <p className={className}>{value}</p>
    </div>
  );
}
