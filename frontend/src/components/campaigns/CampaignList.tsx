import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Folder,
  Image,
  Calendar,
  ChevronRight,
  Trash2,
  Edit3,
  MoreVertical,
  Target,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCampaigns, deleteCampaign } from '../../services/campaign-api';
import { getAllCampaignsWithCosts } from '../../services/cost-api';
import type { Campaign, CampaignStatus } from '../../types';

const STATUS_STYLES: Record<CampaignStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  GENERATING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Generating' },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
  ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Archived' },
};

export function CampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignCosts, setCampaignCosts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const [campaignsResult, costsResult] = await Promise.all([
        getCampaigns(),
        getAllCampaignsWithCosts(),
      ]);
      if (campaignsResult.success) {
        setCampaigns(campaignsResult.campaigns);
      } else {
        toast.error(campaignsResult.error || 'Failed to load campaigns');
      }
      if (costsResult.success) {
        const costsMap: Record<string, number> = {};
        costsResult.campaigns.forEach((c) => {
          costsMap[c.id] = c.total;
        });
        setCampaignCosts(costsMap);
      }
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all ads in this campaign.`)) {
      return;
    }

    try {
      const result = await deleteCampaign(id);
      if (result.success) {
        toast.success('Campaign deleted');
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(result.error || 'Failed to delete campaign');
      }
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
    setMenuOpen(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-500 mt-1">
              Manage your ad campaigns across multiple platforms
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/campaigns/new')}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"
          >
            <Plus size={20} />
            New Campaign
          </motion.button>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && campaigns.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Folder size={40} className="text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No campaigns yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first campaign to generate ads optimized for multiple platforms at once.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/campaigns/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25"
            >
              <Plus size={20} />
              Create Campaign
            </motion.button>
          </motion.div>
        )}

        {/* Campaign grid */}
        {!isLoading && campaigns.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {campaigns.map((campaign, index) => {
                const status = STATUS_STYLES[campaign.status];
                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all group relative"
                  >
                    {/* Preview thumbnails */}
                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
                      {campaign.ads && campaign.ads.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1 p-2 h-full">
                          {campaign.ads.slice(0, 4).map((ad) => (
                            <div key={ad.id} className="bg-gray-200 rounded overflow-hidden">
                              <img
                                src={ad.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Sparkles size={32} className="text-gray-300" />
                        </div>
                      )}

                      {/* Status badge */}
                      <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                        {status.label}
                      </div>

                      {/* Menu button */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === campaign.id ? null : campaign.id);
                          }}
                          className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                        >
                          <MoreVertical size={16} className="text-gray-600" />
                        </button>

                        {/* Dropdown menu */}
                        <AnimatePresence>
                          {menuOpen === campaign.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-10 min-w-[140px]"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/campaigns/${campaign.id}/edit`);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit3 size={14} />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(campaign.id, campaign.name);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Content */}
                    <Link to={`/campaigns/${campaign.id}`} className="block p-4">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                        {campaign.name}
                      </h3>

                      {campaign.brandProfile && (
                        <p className="text-sm text-gray-500 mb-3">
                          {campaign.brandProfile.companyName}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Target size={14} />
                          <span>{campaign.targetPlatforms?.length || 0} platforms</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Image size={14} />
                          <span>{campaign.adCount || 0} ads</span>
                        </div>
                        {campaignCosts[campaign.id] !== undefined && campaignCosts[campaign.id] > 0 && (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <DollarSign size={14} />
                            <span className="font-mono">${campaignCosts[campaign.id].toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                        <Calendar size={12} />
                        <span>{formatDate(campaign.createdAt)}</span>
                      </div>
                    </Link>

                    {/* Hover overlay with action */}
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end justify-center pb-6">
                      <div className="flex items-center gap-2 text-white font-medium pointer-events-auto">
                        <span>View Campaign</span>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  );
}
