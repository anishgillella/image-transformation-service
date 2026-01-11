import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Target,
  Check,
  Globe,
  Palette,
  MessageSquare,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { createCampaign, getCampaignPlatforms } from '../../services/campaign-api';
import { analyzeCompany } from '../../services/adforge-api';
import type { PlatformInfo, AdStyle, BrandProfile, ExportPlatform, Product } from '../../types';

const STYLES: { id: AdStyle; name: string; description: string; color: string }[] = [
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple', color: 'bg-gray-700' },
  { id: 'gradient', name: 'Gradient', description: 'Bold color transitions', color: 'bg-indigo-600' },
  { id: 'abstract', name: 'Abstract', description: 'Artistic patterns', color: 'bg-amber-600' },
  { id: 'lifestyle', name: 'Lifestyle', description: 'Real-world context', color: 'bg-green-600' },
];

type Step = 'brand' | 'products' | 'details' | 'platforms' | 'style';

export function CampaignCreate() {
  const navigate = useNavigate();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('brand');

  // Brand analysis state
  const [brandUrl, setBrandUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  // Campaign details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Product selection
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [includeBrandAd, setIncludeBrandAd] = useState(true);

  // Platform selection
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<ExportPlatform>>(new Set());

  // Style selection
  const [selectedStyle, setSelectedStyle] = useState<AdStyle | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');

  // Creating state
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const result = await getCampaignPlatforms();
      if (result.success) {
        setPlatforms(result.platforms);
      }
    } catch (error) {
      console.error('Failed to load platforms:', error);
    }
  };

  const handleAnalyzeBrand = async () => {
    if (!brandUrl.trim()) {
      toast.error('Please enter a website URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeCompany(brandUrl);
      if (result.success && result.profileId && result.brandProfile) {
        setProfileId(result.profileId);
        setBrandProfile(result.brandProfile);
        setName(`${result.brandProfile.companyName} Campaign`);
        toast.success(`Analyzed ${result.brandProfile.companyName}`);
        setCurrentStep('details');
      } else {
        toast.error(result.error || 'Failed to analyze brand');
      }
    } catch (error) {
      toast.error('Failed to analyze brand');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePlatform = (platformId: ExportPlatform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(new Set(platforms.map((p) => p.id)));
  };

  const clearPlatforms = () => {
    setSelectedPlatforms(new Set());
  };

  const handleCreate = async () => {
    if (!profileId || !name.trim() || selectedPlatforms.size === 0) {
      toast.error('Please complete all required fields');
      return;
    }

    if (!includeBrandAd && selectedProducts.size === 0) {
      toast.error('Please select at least one product or include a brand ad');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createCampaign({
        name: name.trim(),
        description: description.trim() || undefined,
        brandProfileId: profileId,
        targetPlatforms: Array.from(selectedPlatforms),
        style: selectedStyle || undefined,
        customInstructions: customInstructions.trim() || undefined,
        selectedProducts: Array.from(selectedProducts),
        includeBrandAd,
      });

      if (result.success && result.campaign) {
        toast.success('Campaign created!');
        navigate(`/campaigns/${result.campaign.id}`);
      } else {
        toast.error(result.error || 'Failed to create campaign');
      }
    } catch (error) {
      toast.error('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = {
    brand: !!profileId,
    products: includeBrandAd || selectedProducts.size > 0,
    details: name.trim().length > 0,
    platforms: selectedPlatforms.size > 0,
    style: true, // Style is optional
  };

  const steps: { id: Step; label: string; icon: typeof Globe }[] = [
    { id: 'brand', label: 'Brand', icon: Globe },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'details', label: 'Details', icon: MessageSquare },
    { id: 'platforms', label: 'Platforms', icon: Target },
    { id: 'style', label: 'Style', icon: Palette },
  ];

  const toggleProduct = (index: number) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAllProducts = () => {
    if (brandProfile) {
      setSelectedProducts(new Set(brandProfile.products.map((_, i) => i)));
    }
  };

  const clearProducts = () => {
    setSelectedProducts(new Set());
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Campaigns
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
          <p className="text-gray-500 mt-1">
            Generate ads for multiple platforms with consistent branding
          </p>
        </motion.div>

        {/* Progress steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-8 bg-white rounded-2xl p-4 border-2 border-gray-200"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isPast = steps.findIndex((s) => s.id === currentStep) > index;
            const isClickable = isPast || (index === 0);

            return (
              <button
                key={step.id}
                onClick={() => isClickable && setCurrentStep(step.id)}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : isPast
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-400'
                } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-indigo-600 text-white' : isPast ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  {isPast ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className="font-medium hidden sm:block">{step.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Step content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-6"
        >
          {/* Step 1: Brand */}
          {currentStep === 'brand' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Analyze Your Brand</h2>
              <p className="text-gray-500 mb-6">
                Enter your website URL and we'll extract your brand colors, voice, and style.
              </p>

              {!brandProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={brandUrl}
                      onChange={(e) => setBrandUrl(e.target.value)}
                      placeholder="https://your-company.com"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeBrand()}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAnalyzeBrand}
                    disabled={isAnalyzing}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Analyze Brand
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                      <Check size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">{brandProfile.companyName}</p>
                      <p className="text-sm text-green-600">{brandProfile.industry}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Brand colors:</span>
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: brandProfile.colors.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: brandProfile.colors.secondary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: brandProfile.colors.accent }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setBrandProfile(null);
                      setProfileId(null);
                      setBrandUrl('');
                    }}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Analyze a different brand
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Products */}
          {currentStep === 'products' && brandProfile && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Select Products</h2>
              <p className="text-gray-500 mb-4">
                Choose which products to generate ads for. You can also include a general brand ad.
              </p>

              {/* Brand-level ad option */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIncludeBrandAd(!includeBrandAd)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all mb-4 ${
                  includeBrandAd
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: brandProfile.colors.primary }}
                    >
                      <Globe size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{brandProfile.companyName} - Brand Ad</p>
                      <p className="text-sm text-gray-500">General brand awareness ad</p>
                    </div>
                  </div>
                  {includeBrandAd && (
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
              </motion.button>

              {/* Products header */}
              {brandProfile.products.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Products ({brandProfile.products.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllProducts}
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={clearProducts}
                        className="text-sm text-gray-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Product list */}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {brandProfile.products.map((product, index) => {
                      const isSelected = selectedProducts.has(index);
                      return (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => toggleProduct(index)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{product.name}</p>
                              <p className="text-sm text-gray-500 truncate">{product.description}</p>
                              {product.keyBenefits && product.keyBenefits.length > 0 && (
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  {product.keyBenefits.slice(0, 2).join(' • ')}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                                <Check size={14} className="text-white" />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}

              {brandProfile.products.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No products detected from the website.</p>
                  <p className="text-sm">A brand-level ad will be generated.</p>
                </div>
              )}

              <p className="text-sm text-gray-500 mt-4">
                {includeBrandAd ? 1 : 0} brand ad + {selectedProducts.size} product ad{selectedProducts.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 'details' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Campaign Details</h2>
              <p className="text-gray-500 mb-6">
                Give your campaign a name and optional description.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Q1 Product Launch"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the goal of this campaign..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Platforms */}
          {currentStep === 'platforms' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Target Platforms</h2>
              <p className="text-gray-500 mb-4">
                Select which platforms you want to generate ads for.
              </p>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllPlatforms}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearPlatforms}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {platforms.map((platform) => {
                  const isSelected = selectedPlatforms.has(platform.id);
                  return (
                    <motion.button
                      key={platform.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => togglePlatform(platform.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{platform.name}</span>
                        {isSelected && (
                          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {platform.width} x {platform.height}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-sm text-gray-500 mt-4">
                {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Step 4: Style */}
          {currentStep === 'style' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Visual Style</h2>
              <p className="text-gray-500 mb-6">
                Choose a default style for your campaign ads (optional).
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {STYLES.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <motion.button
                      key={style.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedStyle(isSelected ? null : style.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${style.color}`} />
                        <div>
                          <p className="font-medium text-gray-900">{style.name}</p>
                          <p className="text-sm text-gray-500">{style.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions (optional)
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Any specific requirements for the ad generation..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between mt-6"
        >
          <button
            onClick={() => {
              const currentIndex = steps.findIndex((s) => s.id === currentStep);
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1].id);
              }
            }}
            disabled={currentStep === 'brand'}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          {currentStep === 'style' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={isCreating || !canProceed.details || !canProceed.platforms}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Create Campaign
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const currentIndex = steps.findIndex((s) => s.id === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id);
                }
              }}
              disabled={!canProceed[currentStep]}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg shadow-indigo-500/25"
            >
              Continue
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
