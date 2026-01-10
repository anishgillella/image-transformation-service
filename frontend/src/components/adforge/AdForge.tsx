import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { UrlInput } from './UrlInput';
import { AnalyzingState } from './AnalyzingState';
import { BrandProfileCard } from './BrandProfileCard';
import { StyleSelector } from './StyleSelector';
import { GeneratingState } from './GeneratingState';
import { AdResult } from './AdResult';
import { BatchResultsGallery } from './BatchResultsGallery';
import {
  analyzeCompany,
  updateBrandProfile,
  generateAd,
  regenerateAdCopy,
} from '../../services/adforge-api';
import type {
  BrandProfile,
  GeneratedAd,
  AdForgeState,
  AdStyle,
} from '../../types';

export function AdForge() {
  const [state, setState] = useState<AdForgeState>('idle');
  const [analyzingUrl, setAnalyzingUrl] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AdStyle | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null);
  const [batchAds, setBatchAds] = useState<GeneratedAd[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Step 1: Analyze company URL
  const handleAnalyze = useCallback(async (url: string) => {
    setAnalyzingUrl(url);
    setState('analyzing');

    try {
      const response = await analyzeCompany(url);

      if (response.success && response.brandProfile && response.profileId) {
        setProfileId(response.profileId);
        setBrandProfile(response.brandProfile);
        setState('profile-ready');
        toast.success(`Found ${response.brandProfile.products.length} products!`, {
          description: `Brand analysis complete for ${response.brandProfile.companyName}`,
        });
      } else {
        throw new Error(response.error || 'Failed to analyze brand');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
      setState('idle');
    }
  }, []);

  // Step 2: Confirm or edit brand profile
  const handleConfirmProfile = useCallback(() => {
    setState('configuring');
  }, []);

  const handleEditProfile = useCallback(
    async (updates: Partial<BrandProfile>) => {
      if (!profileId) return;

      const response = await updateBrandProfile(profileId, updates);
      if (response.success && response.brandProfile) {
        setBrandProfile(response.brandProfile);
        toast.success('Profile updated');
      }
    },
    [profileId]
  );

  // Step 3: Generate ad
  const handleGenerate = useCallback(
    async (
      style: AdStyle,
      options: {
        customInstructions?: string;
        productIndex?: number;
        productImage?: File;
      }
    ) => {
      if (!profileId || !brandProfile) return;

      setSelectedStyle(style);
      setSelectedProductIndex(options.productIndex ?? null);
      setState('generating');

      try {
        const response = await generateAd({
          profileId,
          style,
          customInstructions: options.customInstructions,
          productIndex: options.productIndex,
          productImage: options.productImage,
        });

        if (response.success && response.ad) {
          setGeneratedAd(response.ad);
          setState('complete');
          toast.success('Ad generated successfully!');
        } else {
          throw new Error(response.error || 'Failed to generate ad');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Generation failed');
        setState('configuring');
      }
    },
    [profileId, brandProfile]
  );

  // Regenerate copy
  const handleRegenerateCopy = useCallback(async () => {
    if (!generatedAd) return;

    setIsRegenerating(true);

    try {
      const response = await regenerateAdCopy(generatedAd.id);

      if (response.success && response.ad) {
        setGeneratedAd(response.ad);
        toast.success('Copy regenerated!');
      } else {
        throw new Error(response.error || 'Failed to regenerate');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Regeneration failed');
    } finally {
      setIsRegenerating(false);
    }
  }, [generatedAd]);

  // Handle batch generation complete
  const handleBatchComplete = useCallback((ads: GeneratedAd[]) => {
    setBatchAds(ads);
    setState('batch-complete');
  }, []);

  // Start over
  const handleStartOver = useCallback(() => {
    setState('idle');
    setAnalyzingUrl('');
    setProfileId(null);
    setBrandProfile(null);
    setSelectedStyle(null);
    setSelectedProductIndex(null);
    setGeneratedAd(null);
    setBatchAds([]);
  }, []);

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
      <AnimatePresence mode="wait">
        {/* Idle - URL Input */}
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex flex-col items-center"
          >
            <UrlInput onAnalyze={handleAnalyze} isLoading={false} />
          </motion.div>
        )}

        {/* Analyzing */}
        {state === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnalyzingState url={analyzingUrl} />
          </motion.div>
        )}

        {/* Profile Ready */}
        {state === 'profile-ready' && brandProfile && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BrandProfileCard
              profile={brandProfile}
              onConfirm={handleConfirmProfile}
              onEdit={handleEditProfile}
            />
          </motion.div>
        )}

        {/* Configuring - Style Selection */}
        {state === 'configuring' && brandProfile && profileId && (
          <motion.div
            key="configuring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StyleSelector
              brandName={brandProfile.companyName}
              products={brandProfile.products}
              profileId={profileId}
              onGenerate={handleGenerate}
              isGenerating={false}
              onBatchComplete={handleBatchComplete}
            />
          </motion.div>
        )}

        {/* Generating */}
        {state === 'generating' && brandProfile && selectedStyle && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GeneratingState
              brandName={brandProfile.companyName}
              style={selectedStyle}
              productName={
                selectedProductIndex !== null
                  ? brandProfile.products[selectedProductIndex]?.name
                  : undefined
              }
            />
          </motion.div>
        )}

        {/* Complete */}
        {state === 'complete' && generatedAd && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdResult
              ad={generatedAd}
              selectedProductName={
                selectedProductIndex !== null && brandProfile
                  ? brandProfile.products[selectedProductIndex]?.name
                  : undefined
              }
              profileId={profileId || undefined}
              onRegenerateCopy={handleRegenerateCopy}
              onStartOver={handleStartOver}
              isRegenerating={isRegenerating}
              onAdUpdate={setGeneratedAd}
            />
          </motion.div>
        )}

        {/* Batch Complete */}
        {state === 'batch-complete' && batchAds.length > 0 && (
          <motion.div
            key="batch-complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BatchResultsGallery
              ads={batchAds}
              brandName={brandProfile?.companyName || ''}
              onStartOver={handleStartOver}
              onViewAd={(ad) => {
                setGeneratedAd(ad);
                setState('complete');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
