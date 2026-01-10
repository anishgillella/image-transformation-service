import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Smartphone, Monitor } from 'lucide-react';
import type { GeneratedAd } from '../../types';

interface AdPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: GeneratedAd;
}

type PreviewMode =
  | 'instagram-feed'
  | 'instagram-story'
  | 'facebook-feed'
  | 'twitter'
  | 'linkedin'
  | 'pinterest'
  | 'tiktok';

interface PreviewConfig {
  id: PreviewMode;
  name: string;
  containerWidth: number;
  containerHeight: number;
  imageAspectRatio: string;
  deviceType: 'mobile' | 'desktop';
  showHeader: boolean;
  showCaption: boolean;
}

const PREVIEW_CONFIGS: PreviewConfig[] = [
  {
    id: 'instagram-feed',
    name: 'Instagram Feed',
    containerWidth: 375,
    containerHeight: 600,
    imageAspectRatio: '1 / 1',
    deviceType: 'mobile',
    showHeader: true,
    showCaption: true,
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    containerWidth: 375,
    containerHeight: 667,
    imageAspectRatio: '9 / 16',
    deviceType: 'mobile',
    showHeader: true,
    showCaption: false,
  },
  {
    id: 'facebook-feed',
    name: 'Facebook Feed',
    containerWidth: 500,
    containerHeight: 500,
    imageAspectRatio: '1.91 / 1',
    deviceType: 'desktop',
    showHeader: true,
    showCaption: true,
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    containerWidth: 500,
    containerHeight: 450,
    imageAspectRatio: '16 / 9',
    deviceType: 'desktop',
    showHeader: true,
    showCaption: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    containerWidth: 500,
    containerHeight: 480,
    imageAspectRatio: '1.91 / 1',
    deviceType: 'desktop',
    showHeader: true,
    showCaption: true,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    containerWidth: 300,
    containerHeight: 500,
    imageAspectRatio: '2 / 3',
    deviceType: 'mobile',
    showHeader: false,
    showCaption: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    containerWidth: 375,
    containerHeight: 667,
    imageAspectRatio: '9 / 16',
    deviceType: 'mobile',
    showHeader: true,
    showCaption: false,
  },
];

export function AdPreviewModal({ isOpen, onClose, ad }: AdPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentConfig = PREVIEW_CONFIGS[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? PREVIEW_CONFIGS.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === PREVIEW_CONFIGS.length - 1 ? 0 : prev + 1));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-4xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Platform Selector */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {PREVIEW_CONFIGS.map((config, index) => (
              <button
                key={config.id}
                onClick={() => setCurrentIndex(index)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  index === currentIndex
                    ? 'bg-white text-gray-900'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {config.name}
              </button>
            ))}
          </div>

          {/* Preview Container */}
          <div className="flex items-center justify-center gap-4">
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Device Frame */}
            <motion.div
              key={currentConfig.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              {/* Device Type Indicator */}
              <div className="flex items-center gap-2 mb-4 text-white/70">
                {currentConfig.deviceType === 'mobile' ? (
                  <Smartphone size={18} />
                ) : (
                  <Monitor size={18} />
                )}
                <span className="text-sm">{currentConfig.name}</span>
              </div>

              {/* Device Frame */}
              <div
                className={`bg-white rounded-3xl overflow-hidden shadow-2xl ${
                  currentConfig.deviceType === 'mobile' ? 'p-2' : 'p-1'
                }`}
                style={{
                  width: currentConfig.containerWidth,
                  maxHeight: currentConfig.containerHeight,
                }}
              >
                {/* Platform-specific Preview */}
                {currentConfig.id === 'instagram-feed' && (
                  <InstagramFeedPreview ad={ad} config={currentConfig} />
                )}
                {currentConfig.id === 'instagram-story' && (
                  <InstagramStoryPreview ad={ad} config={currentConfig} />
                )}
                {currentConfig.id === 'facebook-feed' && (
                  <FacebookFeedPreview ad={ad} config={currentConfig} />
                )}
                {currentConfig.id === 'twitter' && (
                  <TwitterPreview ad={ad} config={currentConfig} />
                )}
                {currentConfig.id === 'linkedin' && (
                  <LinkedInPreview ad={ad} config={currentConfig} />
                )}
                {currentConfig.id === 'pinterest' && (
                  <PinterestPreview ad={ad} config={currentConfig} />
                )}
                {currentConfig.id === 'tiktok' && (
                  <TikTokPreview ad={ad} config={currentConfig} />
                )}
              </div>
            </motion.div>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {PREVIEW_CONFIGS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-6' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Instagram Feed Preview
function InstagramFeedPreview({ ad, config }: { ad: GeneratedAd; config: PreviewConfig }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: ad.brandProfile.colors.primary }}
        />
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">{ad.brandProfile.companyName}</div>
          <div className="text-xs text-gray-500">Sponsored</div>
        </div>
        <div className="text-gray-400">...</div>
      </div>

      {/* Image */}
      <div style={{ aspectRatio: config.imageAspectRatio }}>
        <img src={ad.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex gap-4 mb-2">
          <HeartIcon />
          <CommentIcon />
          <ShareIcon />
        </div>
        <div className="text-sm">
          <span className="font-semibold">{ad.copy.headline}</span>
        </div>
        <div className="text-sm text-gray-700 mt-1">{ad.copy.body}</div>
        <div className="text-sm text-blue-600 mt-1">{ad.copy.hashtags.join(' ')}</div>
      </div>

      {/* CTA Button */}
      <div className="px-3 pb-3">
        <button
          className="w-full py-2 rounded-lg text-white text-sm font-semibold"
          style={{ backgroundColor: ad.brandProfile.colors.primary }}
        >
          {ad.copy.cta}
        </button>
      </div>
    </div>
  );
}

// Instagram Story Preview
function InstagramStoryPreview({ ad }: { ad: GeneratedAd; config: PreviewConfig }) {
  return (
    <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
      <img src={ad.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />

      {/* Story Header */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full border-2 border-white"
            style={{ backgroundColor: ad.brandProfile.colors.primary }}
          />
          <span className="text-white text-sm font-medium">{ad.brandProfile.companyName}</span>
          <span className="text-white/70 text-xs">Sponsored</span>
        </div>
      </div>

      {/* Swipe Up CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="text-center">
          <div className="text-white font-bold mb-2">{ad.copy.headline}</div>
          <div className="flex flex-col items-center">
            <ChevronUpIcon />
            <span className="text-white text-sm">{ad.copy.cta}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Facebook Feed Preview
function FacebookFeedPreview({ ad, config }: { ad: GeneratedAd; config: PreviewConfig }) {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <div
          className="w-10 h-10 rounded-full"
          style={{ backgroundColor: ad.brandProfile.colors.primary }}
        />
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{ad.brandProfile.companyName}</div>
          <div className="text-xs text-gray-500">Sponsored</div>
        </div>
      </div>

      {/* Caption */}
      <div className="px-3 pb-2 text-sm text-gray-800">{ad.copy.body}</div>

      {/* Image */}
      <div style={{ aspectRatio: config.imageAspectRatio }}>
        <img src={ad.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />
      </div>

      {/* CTA */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">{ad.brandProfile.url}</div>
          <button
            className="px-4 py-1.5 rounded text-white text-sm font-semibold"
            style={{ backgroundColor: ad.brandProfile.colors.primary }}
          >
            {ad.copy.cta}
          </button>
        </div>
        <div className="text-sm font-semibold mt-1">{ad.copy.headline}</div>
      </div>
    </div>
  );
}

// Twitter Preview
function TwitterPreview({ ad, config }: { ad: GeneratedAd; config: PreviewConfig }) {
  return (
    <div className="bg-white p-3">
      <div className="flex gap-3">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: ad.brandProfile.colors.primary }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-900">{ad.brandProfile.companyName}</span>
            <span className="text-gray-500 text-sm">@{ad.brandProfile.companyName.toLowerCase().replace(/\s/g, '')}</span>
            <span className="text-gray-500 text-sm">· Ad</span>
          </div>
          <div className="text-gray-900 mt-1">{ad.copy.body}</div>
          <div className="text-blue-500 text-sm">{ad.copy.hashtags.join(' ')}</div>

          {/* Image Card */}
          <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
            <div style={{ aspectRatio: config.imageAspectRatio }}>
              <img src={ad.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />
            </div>
            <div className="p-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">{ad.brandProfile.url}</div>
              <div className="font-semibold">{ad.copy.headline}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// LinkedIn Preview
function LinkedInPreview({ ad, config }: { ad: GeneratedAd; config: PreviewConfig }) {
  return (
    <div className="bg-white">
      <div className="flex items-start gap-3 p-3">
        <div
          className="w-12 h-12 rounded"
          style={{ backgroundColor: ad.brandProfile.colors.primary }}
        />
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{ad.brandProfile.companyName}</div>
          <div className="text-xs text-gray-500">Promoted</div>
        </div>
      </div>

      <div className="px-3 pb-2 text-sm text-gray-800">{ad.copy.body}</div>

      <div style={{ aspectRatio: config.imageAspectRatio }}>
        <img src={ad.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />
      </div>

      <div className="p-3 border-t border-gray-200">
        <div className="text-sm font-semibold">{ad.copy.headline}</div>
        <button
          className="mt-2 px-4 py-2 rounded-full text-white text-sm font-semibold"
          style={{ backgroundColor: '#0a66c2' }}
        >
          {ad.copy.cta}
        </button>
      </div>
    </div>
  );
}

// Pinterest Preview
function PinterestPreview({ ad }: { ad: GeneratedAd; config: PreviewConfig }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div style={{ aspectRatio: '2 / 3' }}>
        <img src={ad.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <div className="font-semibold text-gray-900">{ad.copy.headline}</div>
        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{ad.copy.body}</div>
        <div className="flex items-center gap-2 mt-2">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: ad.brandProfile.colors.primary }}
          />
          <span className="text-xs text-gray-500">{ad.brandProfile.companyName}</span>
        </div>
      </div>
    </div>
  );
}

// TikTok Preview
function TikTokPreview({ ad }: { ad: GeneratedAd; config: PreviewConfig }) {
  return (
    <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
      <img src={ad.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-white"
          style={{ backgroundColor: ad.brandProfile.colors.primary }}
        />
        <HeartIcon className="text-white" />
        <CommentIcon className="text-white" />
        <ShareIcon className="text-white" />
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-bold">@{ad.brandProfile.companyName.toLowerCase().replace(/\s/g, '')}</span>
          <span className="text-white/70 text-xs px-1 bg-white/20 rounded">Ad</span>
        </div>
        <div className="text-white text-sm">{ad.copy.headline}</div>
        <button
          className="mt-2 px-4 py-1.5 rounded-full text-white text-sm font-semibold"
          style={{ backgroundColor: ad.brandProfile.colors.primary }}
        >
          {ad.copy.cta}
        </button>
      </div>
    </div>
  );
}

// Icon Components
function HeartIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function CommentIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function ShareIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg className="w-6 h-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}
