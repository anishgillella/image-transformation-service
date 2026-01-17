import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Check,
  MessageSquare,
  Package,
  Globe,
  Sparkles,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCampaign, updateCampaign, getCampaignPlatforms, generateCampaignAds } from '../../services/campaign-api';
import type { PlatformInfo, AdStyle, Campaign, ExportPlatform } from '../../types';

const STYLES: { id: AdStyle; name: string; description: string; color: string }[] = [
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple', color: 'bg-gray-700' },
  { id: 'gradient', name: 'Gradient', description: 'Bold color transitions', color: 'bg-indigo-600' },
  { id: 'abstract', name: 'Abstract', description: 'Artistic patterns', color: 'bg-amber-600' },
  { id: 'lifestyle', name: 'Lifestyle', description: 'Real-world context', color: 'bg-green-600' },
];

export function CampaignEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Campaign data
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<ExportPlatform>>(new Set());
  const [selectedStyle, setSelectedStyle] = useState<AdStyle | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');

  // Product selection for generating more ads
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [includeBrandAd, setIncludeBrandAd] = useState(false);

  // Platform data
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);

  // Active tab
  const [activeTab, setActiveTab] = useState<'details' | 'generate'>('details');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [campaignResult, platformsResult] = await Promise.all([
        getCampaign(id),
        getCampaignPlatforms(),
      ]);

      if (campaignResult.success && campaignResult.campaign) {
        const c = campaignResult.campaign;
        setCampaign(c);
        setName(c.name);
        setDescription(c.description || '');
        setSelectedPlatforms(new Set(c.targetPlatforms || []));
        setSelectedStyle((c.style as AdStyle) || null);
        setCustomInstructions(c.customInstructions || '');
      } else {
        toast.error('Failed to load campaign');
        navigate('/campaigns');
      }

      if (platformsResult.success) {
        setPlatforms(platformsResult.platforms);
      }
    } catch (error) {
      toast.error('Failed to load campaign');
      navigate('/campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateCampaign(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        targetPlatforms: Array.from(selectedPlatforms),
        style: selectedStyle || undefined,
        customInstructions: customInstructions.trim() || undefined,
      });

      if (result.success) {
        toast.success('Campaign updated!');
        navigate(`/campaigns/${id}`);
      } else {
        toast.error(result.error || 'Failed to update campaign');
      }
    } catch (error) {
      toast.error('Failed to update campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!id) return;

    if (!includeBrandAd && selectedProducts.size === 0) {
      toast.error('Please select at least one product or include a brand ad');
      return;
    }

    if (selectedPlatforms.size === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    setIsGenerating(true);
    try {
      // First update the campaign with new settings
      await updateCampaign(id, {
        targetPlatforms: Array.from(selectedPlatforms),
        style: selectedStyle || undefined,
        customInstructions: customInstructions.trim() || undefined,
        selectedProducts: Array.from(selectedProducts),
        includeBrandAd,
      });

      // Then trigger generation
      const result = await generateCampaignAds(id);
      if (result.success) {
        toast.success(result.message || 'Generation started!');
        navigate(`/campaigns/${id}`);
      } else {
        toast.error(result.error || 'Failed to start generation');
      }
    } catch (error) {
      toast.error('Failed to generate ads');
    } finally {
      setIsGenerating(false);
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

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const brandProfile = campaign.brandProfile;

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
            onClick={() => navigate(`/campaigns/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Campaign
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
          <p className="text-gray-500 mt-1">
            Modify settings or generate more ads for {campaign.name}
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          <button
            onClick={() => setActiveTab('details')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'details'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              Edit Details
            </div>
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'generate'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus size={18} />
              Generate More Ads
            </div>
          </button>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-6"
        >
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Campaign name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the campaign..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                />
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Visual Style
                </label>
                <div className="grid grid-cols-2 gap-3">
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
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Any specific requirements..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                />
              </div>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <p className="text-sm text-indigo-800">
                  Generate additional ads for this campaign. Select products and platforms below.
                  New ads will be added to the existing campaign.
                </p>
              </div>

              {/* Product Selection */}
              {brandProfile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Products to Generate
                  </label>

                  {/* Brand Ad Option */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIncludeBrandAd(!includeBrandAd)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all mb-3 ${
                      includeBrandAd
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: brandProfile.colors?.primary || '#6366f1' }}
                        >
                          <Globe size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Brand Ad</p>
                          <p className="text-sm text-gray-500">General brand awareness</p>
                        </div>
                      </div>
                      {includeBrandAd && (
                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                  </motion.button>

                  {/* Products */}
                  {brandProfile.products && brandProfile.products.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {brandProfile.products.map((product: any, index: number) => {
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
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <Package size={20} className="text-gray-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  <p className="text-sm text-gray-500 truncate max-w-xs">
                                    {product.description}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <Check size={14} className="text-white" />
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Target Platforms
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => {
                    const isSelected = selectedPlatforms.has(platform.id);
                    return (
                      <motion.button
                        key={platform.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => togglePlatform(platform.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900 text-sm">{platform.name}</span>
                            <p className="text-xs text-gray-500">{platform.width}x{platform.height}</p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Style for new ads */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Style for New Ads
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    return (
                      <motion.button
                        key={style.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStyle(isSelected ? null : style.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${style.color}`} />
                          <span className="font-medium text-gray-900 text-sm">{style.name}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  Will generate: {(includeBrandAd ? 1 : 0) + selectedProducts.size} ad(s) × {selectedPlatforms.size} platform(s) = {' '}
                  <span className="font-semibold text-gray-900">
                    {((includeBrandAd ? 1 : 0) + selectedProducts.size) * selectedPlatforms.size} new ads
                  </span>
                </p>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGenerateMore}
                disabled={isGenerating || (selectedProducts.size === 0 && !includeBrandAd) || selectedPlatforms.size === 0}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate New Ads
                  </>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
