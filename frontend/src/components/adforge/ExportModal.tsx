import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Loader2,
  Check,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportAd, exportAdToAllPlatforms } from '../../services/adforge-api';
import type { ExportPlatform, ExportAllResult } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
  brandName: string;
}

interface PlatformOption {
  id: ExportPlatform;
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  aspectRatio: string;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: 'instagram-feed',
    name: 'Instagram Feed',
    width: 1080,
    height: 1080,
    icon: <Instagram size={20} />,
    aspectRatio: '1:1',
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    icon: <Instagram size={20} />,
    aspectRatio: '9:16',
  },
  {
    id: 'facebook-feed',
    name: 'Facebook Feed',
    width: 1200,
    height: 628,
    icon: <Facebook size={20} />,
    aspectRatio: '1.91:1',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    width: 1200,
    height: 675,
    icon: <Twitter size={20} />,
    aspectRatio: '16:9',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    width: 1200,
    height: 627,
    icon: <Linkedin size={20} />,
    aspectRatio: '1.91:1',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    width: 1000,
    height: 1500,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
    aspectRatio: '2:3',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    width: 1080,
    height: 1920,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
      </svg>
    ),
    aspectRatio: '9:16',
  },
];

export function ExportModal({ isOpen, onClose, adId, brandName }: ExportModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<ExportPlatform>>(new Set());
  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResults, setExportResults] = useState<ExportAllResult | null>(null);

  const togglePlatform = (platform: ExportPlatform) => {
    const newSelection = new Set(selectedPlatforms);
    if (newSelection.has(platform)) {
      newSelection.delete(platform);
    } else {
      newSelection.add(platform);
    }
    setSelectedPlatforms(newSelection);
  };

  const selectAll = () => {
    setSelectedPlatforms(new Set(PLATFORMS.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedPlatforms(new Set());
  };

  const handleExport = async () => {
    if (selectedPlatforms.size === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    setIsExporting(true);
    setExportResults(null);

    try {
      if (selectedPlatforms.size === PLATFORMS.length) {
        // Export all at once
        const response = await exportAdToAllPlatforms(adId, format);
        if (response.success && response.exports) {
          setExportResults(response.exports);
          toast.success(`Exported to ${Object.keys(response.exports).length} platforms!`);
        } else {
          throw new Error(response.error || 'Export failed');
        }
      } else {
        // Export selected platforms one by one
        const results: ExportAllResult = {};
        for (const platform of selectedPlatforms) {
          const response = await exportAd(adId, platform, format);
          if (response.success && response.export) {
            results[platform] = {
              url: response.export.url,
              width: response.export.width,
              height: response.export.height,
              platformName: response.export.platformName,
            };
          }
        }
        setExportResults(results);
        toast.success(`Exported to ${Object.keys(results).length} platforms!`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = (url: string, platformName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${brandName}-${platformName}.${format}`;
    link.target = '_blank';
    link.click();
  };

  if (!isOpen) return null;

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
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export Ad</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose platforms and download optimized images
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {!exportResults ? (
              <>
                {/* Format Selection */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Image Format
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFormat('png')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        format === 'png'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      PNG (Lossless)
                    </button>
                    <button
                      onClick={() => setFormat('jpg')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        format === 'jpg'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      JPG (Smaller)
                    </button>
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Select Platforms ({selectedPlatforms.size}/{PLATFORMS.length})
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAll}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={clearSelection}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          selectedPlatforms.has(platform.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            selectedPlatforms.has(platform.id)
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {platform.icon}
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-medium text-gray-900">{platform.name}</div>
                          <div className="text-xs text-gray-500">
                            {platform.width}x{platform.height} ({platform.aspectRatio})
                          </div>
                        </div>
                        {selectedPlatforms.has(platform.id) && (
                          <Check size={18} className="text-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Export Results */
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Exported Images ({Object.keys(exportResults).length})
                </h3>
                {Object.entries(exportResults).map(([platform, result]) => (
                  <div
                    key={platform}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <Check size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{result.platformName}</div>
                        <div className="text-xs text-gray-500">
                          {result.width}x{result.height}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(result.url, result.platformName)}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => window.open(result.url, '_blank')}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {!exportResults ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleExport}
                disabled={isExporting || selectedPlatforms.size === 0}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Export {selectedPlatforms.size} Format{selectedPlatforms.size !== 1 ? 's' : ''}
                  </>
                )}
              </motion.button>
            ) : (
              <button
                onClick={() => setExportResults(null)}
                className="w-full py-3.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Export More Formats
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
