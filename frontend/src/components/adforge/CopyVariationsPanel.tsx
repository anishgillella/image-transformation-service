import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateCopyVariations, selectCopy } from '../../services/adforge-api';
import type { CopyVariations, AdCopy } from '../../types';

interface CopyVariationsPanelProps {
  adId: string;
  currentCopy: AdCopy;
  onCopyUpdate: (copy: AdCopy) => void;
}

export function CopyVariationsPanel({ adId, currentCopy, onCopyUpdate }: CopyVariationsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<CopyVariations | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<number | null>(null);
  const [selectedBody, setSelectedBody] = useState<number | null>(null);
  const [selectedCta, setSelectedCta] = useState<number | null>(null);

  const handleGenerateVariations = async () => {
    setIsGenerating(true);

    try {
      const response = await generateCopyVariations(adId);

      if (response.success && response.variations) {
        setVariations(response.variations);
        setIsExpanded(true);
        toast.success('Generated copy variations!');
      } else {
        throw new Error(response.error || 'Failed to generate variations');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariation = async (
    type: 'headline' | 'body' | 'cta',
    index: number,
    value: string
  ) => {
    // Update local selection state
    if (type === 'headline') setSelectedHeadline(index);
    if (type === 'body') setSelectedBody(index);
    if (type === 'cta') setSelectedCta(index);

    // Update on server
    try {
      const selection: { headline?: string; body?: string; cta?: string } = {};
      selection[type] = value;

      const response = await selectCopy(adId, selection);

      if (response.success && response.ad) {
        onCopyUpdate(response.ad.copy);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated!`);
      }
    } catch (error) {
      toast.error('Failed to update copy');
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Copy Variations</h3>
            <p className="text-sm text-gray-500">
              {variations
                ? `${variations.headlines.length} headlines, ${variations.bodies.length} bodies, ${variations.ctas.length} CTAs`
                : 'Generate A/B test variations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!variations && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateVariations();
              }}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate
                </>
              )}
            </motion.button>
          )}

          {variations && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateVariations();
              }}
              disabled={isGenerating}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Regenerate variations"
            >
              <RefreshCw size={18} className={`text-gray-500 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          )}

          {variations && (
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              {isExpanded ? (
                <ChevronUp size={18} className="text-gray-500" />
              ) : (
                <ChevronDown size={18} className="text-gray-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Variations Content */}
      <AnimatePresence>
        {isExpanded && variations && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-6 border-t border-gray-100">
              {/* Headlines */}
              <VariationSection
                title="Headlines"
                description="3-8 words, creates curiosity"
                variations={variations.headlines}
                currentValue={currentCopy.headline}
                selectedIndex={selectedHeadline}
                onSelect={(index, value) => handleSelectVariation('headline', index, value)}
                colorClass="from-blue-500 to-indigo-500"
              />

              {/* Bodies */}
              <VariationSection
                title="Body Copy"
                description="1-2 sentences, benefit-focused"
                variations={variations.bodies}
                currentValue={currentCopy.body}
                selectedIndex={selectedBody}
                onSelect={(index, value) => handleSelectVariation('body', index, value)}
                colorClass="from-green-500 to-emerald-500"
              />

              {/* CTAs */}
              <VariationSection
                title="Call to Action"
                description="2-4 words, action-oriented"
                variations={variations.ctas}
                currentValue={currentCopy.cta}
                selectedIndex={selectedCta}
                onSelect={(index, value) => handleSelectVariation('cta', index, value)}
                colorClass="from-orange-500 to-red-500"
              />

              {/* Hashtags (display only) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Hashtags</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {variations.hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface VariationSectionProps {
  title: string;
  description: string;
  variations: string[];
  currentValue: string;
  selectedIndex: number | null;
  onSelect: (index: number, value: string) => void;
  colorClass: string;
}

function VariationSection({
  title,
  description,
  variations,
  currentValue,
  selectedIndex,
  onSelect,
  colorClass,
}: VariationSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>

      <div className="space-y-2">
        {/* Current Selection */}
        <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">CURRENT</span>
          </div>
          <p className="text-gray-900">{currentValue}</p>
        </div>

        {/* Variations */}
        {variations.map((variation, index) => {
          const isSelected = selectedIndex === index;
          const isSameAsCurrent = variation === currentValue;

          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => !isSameAsCurrent && onSelect(index, variation)}
              disabled={isSameAsCurrent}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? `border-transparent bg-gradient-to-r ${colorClass} text-white`
                  : isSameAsCurrent
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'text-white/80' : 'text-gray-500'
                      }`}
                    >
                      OPTION {index + 1}
                      {isSameAsCurrent && ' (SAME AS CURRENT)'}
                    </span>
                  </div>
                  <p className={isSelected ? 'text-white' : 'text-gray-900'}>{variation}</p>
                </div>
                {isSelected && (
                  <div className="p-1 bg-white/20 rounded">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
