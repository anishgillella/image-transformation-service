import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Download,
  Trash2,
  Settings,
  Target,
  Image,
  Calendar,
  ExternalLink,
  Sparkles,
  Grid3X3,
  List,
  Package,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCampaign, generateCampaignAds, deleteCampaign } from '../../services/campaign-api';
import { getCampaignCosts } from '../../services/cost-api';
import type { Campaign, CampaignStatus, GeneratedAd } from '../../types';

const STATUS_STYLES: Record<CampaignStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  GENERATING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Generating' },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
  ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Archived' },
};

const PLATFORM_ICONS: Record<string, string> = {
  'instagram-feed': 'IG',
  'instagram-story': 'IGS',
  'facebook-feed': 'FB',
  'twitter': 'X',
  'linkedin': 'LI',
  'pinterest': 'PIN',
  'tiktok': 'TT',
};

export function CampaignView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignCost, setCampaignCost] = useState<{ total: number; avgPerAd: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAd, setSelectedAd] = useState<GeneratedAd | null>(null);

  useEffect(() => {
    if (id) {
      loadCampaign();
    }
  }, [id]);

  const loadCampaign = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [campaignResult, costsResult] = await Promise.all([
        getCampaign(id),
        getCampaignCosts(id),
      ]);
      if (campaignResult.success && campaignResult.campaign) {
        setCampaign(campaignResult.campaign);
      } else {
        toast.error(campaignResult.error || 'Failed to load campaign');
        navigate('/campaigns');
      }
      if (costsResult.success) {
        setCampaignCost({ total: costsResult.total, avgPerAd: costsResult.avgPerAd });
      }
    } catch (error) {
      toast.error('Failed to load campaign');
      navigate('/campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!id) return;

    setIsGenerating(true);
    try {
      const result = await generateCampaignAds(id);
      if (result.success) {
        toast.success(result.message || 'Generation started');
        // Reload campaign to see updated status
        setTimeout(loadCampaign, 2000);
      } else {
        toast.error(result.error || 'Failed to start generation');
      }
    } catch (error) {
      toast.error('Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !campaign) return;

    if (!confirm(`Are you sure you want to delete "${campaign.name}"? This will also delete all ads in this campaign.`)) {
      return;
    }

    try {
      const result = await deleteCampaign(id);
      if (result.success) {
        toast.success('Campaign deleted');
        navigate('/campaigns');
      } else {
        toast.error(result.error || 'Failed to delete campaign');
      }
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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

  const status = STATUS_STYLES[campaign.status];
  const ads = campaign.ads || [];

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
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

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>

              {campaign.brandProfile && (
                <p className="text-gray-500">{campaign.brandProfile.companyName}</p>
              )}

              {campaign.description && (
                <p className="text-gray-600 mt-2 max-w-2xl">{campaign.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {campaign.status === 'DRAFT' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Generate Ads
                    </>
                  )}
                </motion.button>
              )}

              <button
                onClick={() => navigate(`/campaigns/${id}/edit`)}
                className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>

              <button
                onClick={handleDelete}
                className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Target size={20} className="text-indigo-600" />
              </div>
              <span className="text-gray-500">Platforms</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{campaign.targetPlatforms?.length || 0}</span>
              <div className="flex gap-1">
                {campaign.targetPlatforms?.slice(0, 3).map((p) => (
                  <span key={p} className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                    {PLATFORM_ICONS[p] || p}
                  </span>
                ))}
                {(campaign.targetPlatforms?.length || 0) > 3 && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                    +{campaign.targetPlatforms!.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Image size={20} className="text-green-600" />
              </div>
              <span className="text-gray-500">Ads Generated</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{ads.length}</span>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign size={20} className="text-emerald-600" />
              </div>
              <span className="text-gray-500">Total Cost</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 font-mono">
              ${campaignCost?.total?.toFixed(4) || '0.0000'}
            </span>
            {campaignCost && campaignCost.avgPerAd > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                ~${campaignCost.avgPerAd.toFixed(4)}/ad
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-purple-600" />
              </div>
              <span className="text-gray-500">Created</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">{formatDate(campaign.createdAt)}</span>
          </div>
        </motion.div>

        {/* Ads section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Generated Ads</h2>

            {ads.length > 0 && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                  }`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            )}
          </div>

          {ads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No ads generated yet</p>
              {campaign.status === 'DRAFT' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  <Play size={16} />
                  Generate Ads
                </motion.button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-3'}>
              {ads.map((ad, index) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer ${
                    viewMode === 'list' ? 'flex items-center' : ''
                  }`}
                  onClick={() => setSelectedAd(ad)}
                >
                  <div className={viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square'}>
                    <img
                      src={ad.imageUrl}
                      alt={ad.copy?.headline || 'Ad'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className={viewMode === 'list' ? 'flex-1 p-4' : 'p-3'}>
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {ad.copy?.headline || 'Untitled Ad'}
                    </p>
                    {ad.productName && (
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                        <Package size={12} />
                        <span>{ad.productName}</span>
                      </div>
                    )}
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-gray-200 rounded-full capitalize">
                      {ad.style}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Ad preview modal */}
      <AnimatePresence>
        {selectedAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8"
            onClick={() => setSelectedAd(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid md:grid-cols-2 gap-6 p-6">
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={selectedAd.imageUrl}
                    alt={selectedAd.copy?.headline}
                    className="w-full"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Headline</span>
                    <p className="text-xl font-bold text-gray-900 mt-1">{selectedAd.copy?.headline}</p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Body</span>
                    <p className="text-gray-700 mt-1">{selectedAd.copy?.body}</p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">CTA</span>
                    <p className="mt-1">
                      <span className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">
                        {selectedAd.copy?.cta}
                      </span>
                    </p>
                  </div>

                  {selectedAd.copy?.hashtags && selectedAd.copy.hashtags.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase">Hashtags</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedAd.copy.hashtags.map((tag) => (
                          <span key={tag} className="text-sm text-indigo-600">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <a
                      href={selectedAd.imageUrl}
                      download
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <Download size={18} />
                      Download
                    </a>
                    <a
                      href={selectedAd.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink size={18} />
                      Open
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
