import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      <motion.div
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? '#0066FF' : '#D1D5DB',
        }}
        transition={{ duration: 0.2 }}
        className={`
          w-[400px] h-[400px]
          border-2 border-dashed rounded-3xl
          flex flex-col items-center justify-center
          cursor-pointer bg-white
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="p-4 rounded-full bg-[#0066FF]/10"
              >
                <Image size={32} className="text-[#0066FF]" />
              </motion.div>
              <p className="text-lg font-medium text-[#0066FF]">Drop it here!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-full bg-gray-100"
              >
                <Upload size={32} className="text-gray-400" />
              </motion.div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">
                  Drop your image here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Glow effect when dragging */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 -z-10 rounded-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(0,102,255,0.1) 0%, transparent 70%)',
              transform: 'scale(1.1)',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
