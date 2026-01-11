import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Download, RefreshCw, ArrowRight, Trash2 } from 'lucide-react';
import { deleteImage } from '../services/api';
import type { ProcessedImage } from '../types';

interface ImageResultProps {
  originalPreview: string;
  result: ProcessedImage;
  onReset: () => void;
  onDelete?: () => void;
}

export function ImageResult({ originalPreview, result, onReset, onDelete }: ImageResultProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `transformed-${result.originalName}`;
    link.target = '_blank';
    link.click();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteImage(result.id);
      onDelete?.();
      onReset();
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl flex flex-col items-center gap-10"
    >
      {/* Before / After Comparison */}
      <div className="flex items-center gap-6 w-full">
        {/* Original */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 flex flex-col gap-3"
        >
          <p className="text-sm font-medium text-gray-400 text-center uppercase tracking-wide">
            Original
          </p>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
            <img
              src={originalPreview}
              alt="Original"
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100"
        >
          <ArrowRight size={24} className="text-gray-400" />
        </motion.div>

        {/* Transformed */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 flex flex-col gap-3"
        >
          <p className="text-sm font-medium text-gray-400 text-center uppercase tracking-wide">
            Transformed
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #f5f5f5 25%, transparent 25%),
                linear-gradient(-45deg, #f5f5f5 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #f5f5f5 75%),
                linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)
              `,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          >
            <img
              src={result.url}
              alt="Transformed"
              className="w-full h-full object-contain"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* URL Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-xl"
      >
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="text"
            value={result.url}
            readOnly
            className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate font-mono"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-colors duration-200
              ${copied
                ? 'bg-[#00C853]/10 text-[#00C853]'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }
            `}
          >
            {copied ? (
              <>
                <Check size={16} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDownload}
          className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-colors"
        >
          <Download size={20} />
          Download
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
          className="flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={20} />
          Transform Another
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 px-8 py-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={20} />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
