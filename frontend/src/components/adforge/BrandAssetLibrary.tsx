import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  Upload,
  Trash2,
  Loader2,
  Plus,
  Palette,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  uploadBrandAsset,
  getBrandAssets,
  updateBrandColors,
  deleteBrandAsset,
} from '../../services/adforge-api';
import type { BrandAsset, BrandAssetLibrary as BrandAssetLibraryType } from '../../types';

interface BrandAssetLibraryProps {
  profileId: string;
  initialColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onColorsUpdate?: (colors: { primary: string; secondary: string; accent: string }) => void;
}

export function BrandAssetLibrary({
  profileId,
  initialColors,
  onColorsUpdate,
}: BrandAssetLibraryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [library, setLibrary] = useState<BrandAssetLibraryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'logo' | 'image'>('image');
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [newColor, setNewColor] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load library on mount
  useEffect(() => {
    loadLibrary();
  }, [profileId]);

  const loadLibrary = async () => {
    try {
      const response = await getBrandAssets(profileId);
      if (response.success && response.library) {
        setLibrary(response.library);
      }
    } catch (error) {
      console.error('Failed to load asset library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadBrandAsset(profileId, file, uploadType, file.name);

      if (response.success && response.asset) {
        setLibrary((prev) =>
          prev
            ? { ...prev, assets: [...prev.assets, response.asset!] }
            : {
                profileId,
                assets: [response.asset!],
                colors: initialColors
                  ? { ...initialColors, custom: [] }
                  : { primary: '#000000', secondary: '#ffffff', accent: '#0066ff', custom: [] },
              }
        );
        toast.success(`${uploadType === 'logo' ? 'Logo' : 'Image'} uploaded successfully!`);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const response = await deleteBrandAsset(profileId, assetId);

      if (response.success) {
        setLibrary((prev) =>
          prev ? { ...prev, assets: prev.assets.filter((a) => a.id !== assetId) } : null
        );
        toast.success('Asset deleted');
      } else {
        throw new Error(response.error || 'Delete failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleColorUpdate = async (colorKey: 'primary' | 'secondary' | 'accent', value: string) => {
    try {
      const response = await updateBrandColors(profileId, { [colorKey]: value });

      if (response.success && response.library) {
        setLibrary(response.library);
        onColorsUpdate?.({
          primary: response.library.colors.primary,
          secondary: response.library.colors.secondary,
          accent: response.library.colors.accent,
        });
        toast.success('Color updated');
      }
    } catch (error) {
      toast.error('Failed to update color');
    }

    setEditingColor(null);
  };

  const handleAddCustomColor = async () => {
    if (!newColor || !/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
      toast.error('Please enter a valid hex color (e.g., #FF5500)');
      return;
    }

    try {
      const currentCustom = library?.colors.custom || [];
      const response = await updateBrandColors(profileId, {
        custom: [...currentCustom, newColor],
      });

      if (response.success && response.library) {
        setLibrary(response.library);
        setNewColor('');
        toast.success('Custom color added');
      }
    } catch (error) {
      toast.error('Failed to add color');
    }
  };

  const handleRemoveCustomColor = async (colorToRemove: string) => {
    try {
      const currentCustom = library?.colors.custom || [];
      const response = await updateBrandColors(profileId, {
        custom: currentCustom.filter((c) => c !== colorToRemove),
      });

      if (response.success && response.library) {
        setLibrary(response.library);
        toast.success('Color removed');
      }
    } catch (error) {
      toast.error('Failed to remove color');
    }
  };

  const logos = library?.assets.filter((a) => a.type === 'logo') || [];
  const images = library?.assets.filter((a) => a.type === 'image') || [];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
            <Image size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Brand Asset Library</h3>
            <p className="text-sm text-gray-500">
              {library
                ? `${logos.length} logos, ${images.length} images, ${
                    (library.colors.custom?.length || 0) + 3
                  } colors`
                : 'Store your brand assets for reuse'}
            </p>
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          {isExpanded ? (
            <ChevronUp size={18} className="text-gray-500" />
          ) : (
            <ChevronDown size={18} className="text-gray-500" />
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-6 border-t border-gray-100">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Colors Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette size={16} className="text-gray-500" />
                      <h4 className="font-medium text-gray-900">Brand Colors</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {(['primary', 'secondary', 'accent'] as const).map((colorKey) => {
                        const colorValue =
                          library?.colors[colorKey] ||
                          initialColors?.[colorKey] ||
                          '#000000';

                        return (
                          <div key={colorKey} className="relative">
                            <div
                              className="h-16 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-300 transition-all overflow-hidden"
                              onClick={() => setEditingColor(colorKey)}
                            >
                              <div
                                className="w-full h-full"
                                style={{ backgroundColor: colorValue }}
                              />
                            </div>
                            <div className="text-xs text-center mt-1 text-gray-500 capitalize">
                              {colorKey}
                            </div>
                            <div className="text-xs text-center text-gray-400">{colorValue}</div>

                            {/* Color Picker Popover */}
                            {editingColor === colorKey && (
                              <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                                <input
                                  type="color"
                                  defaultValue={colorValue}
                                  onChange={(e) => handleColorUpdate(colorKey, e.target.value)}
                                  className="w-full h-10 cursor-pointer"
                                />
                                <button
                                  onClick={() => setEditingColor(null)}
                                  className="mt-2 w-full py-1 text-sm text-gray-500 hover:text-gray-700"
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Colors */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {library?.colors.custom?.map((color) => (
                        <div
                          key={color}
                          className="relative group w-8 h-8 rounded-lg border-2 border-gray-200"
                          style={{ backgroundColor: color }}
                        >
                          <button
                            onClick={() => handleRemoveCustomColor(color)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}

                      {/* Add Custom Color */}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="#FF5500"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={handleAddCustomColor}
                          className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Logos Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Logos ({logos.length})</h4>
                      <button
                        onClick={() => {
                          setUploadType('logo');
                          fileInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                      >
                        {isUploading && uploadType === 'logo' ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        Upload Logo
                      </button>
                    </div>

                    {logos.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg">
                        No logos uploaded yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {logos.map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            onDelete={() => handleDeleteAsset(asset.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Images Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Images ({images.length})</h4>
                      <button
                        onClick={() => {
                          setUploadType('image');
                          fileInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                      >
                        {isUploading && uploadType === 'image' ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        Upload Image
                      </button>
                    </div>

                    {images.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg">
                        No images uploaded yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {images.map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            onDelete={() => handleDeleteAsset(asset.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AssetCardProps {
  asset: BrandAsset;
  onDelete: () => void;
}

function AssetCard({ asset, onDelete }: AssetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all">
      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>

      {/* Asset Type Badge */}
      <div className="absolute top-1 left-1">
        <span
          className={`px-1.5 py-0.5 text-xs font-medium rounded ${
            asset.type === 'logo'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {asset.type}
        </span>
      </div>
    </div>
  );
}
