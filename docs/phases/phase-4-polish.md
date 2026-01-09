# Phase 4: Polish & Animations

## Objective
Add Framer Motion animations, microinteractions, and final UI polish for a premium experience.

---

## 4.1 Animation Principles

### The Apple Way
- **Subtle** - Animations enhance, never distract
- **Purposeful** - Every animation communicates something
- **Responsive** - Instant feedback on user actions
- **Smooth** - 60fps, eased curves, no jank

### Timing Guidelines
| Action | Duration | Easing |
|--------|----------|--------|
| Hover effects | 150-200ms | ease-out |
| State transitions | 300-400ms | ease-out |
| Page transitions | 400-500ms | ease-in-out |
| Micro-feedback | 100-150ms | ease-out |

---

## 4.2 Update Upload Zone with Animations

Update `src/components/UploadZone.tsx`:

```tsx
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
          w-full max-w-lg aspect-square
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
                className="p-4 rounded-full bg-accent/10"
              >
                <Image size={32} className="text-accent" />
              </motion.div>
              <p className="text-lg font-medium text-accent">Drop it here!</p>
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
```

---

## 4.3 Update Processing State with Animations

Update `src/components/ProcessingState.tsx`:

```tsx
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ProcessingStateProps {
  status: string;
  preview?: string;
}

export function ProcessingState({ status, preview }: ProcessingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg flex flex-col items-center gap-6"
    >
      {/* Image Preview */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-lg"
        >
          <img
            src={preview}
            alt="Processing"
            className="w-full h-full object-contain"
          />

          {/* Overlay with spinner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="p-4 rounded-full bg-white/90 shadow-lg"
            >
              <Loader2 size={32} className="text-accent animate-spin" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Status Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-medium text-gray-700"
        >
          {status}
        </motion.p>

        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-accent"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
```

---

## 4.4 Update Image Result with Animations

Update `src/components/ImageResult.tsx`:

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Download, RefreshCw, ArrowRight } from 'lucide-react';
import { ProcessedImage } from '../types';

interface ImageResultProps {
  originalPreview: string;
  result: ProcessedImage;
  onReset: () => void;
}

export function ImageResult({ originalPreview, result, onReset }: ImageResultProps) {
  const [copied, setCopied] = useState(false);

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
                ? 'bg-success/10 text-success'
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
      </motion.div>
    </motion.div>
  );
}
```

---

## 4.5 Update Main App with AnimatePresence

Update `src/App.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { UploadZone } from './components/UploadZone';
import { ProcessingState } from './components/ProcessingState';
import { ImageResult } from './components/ImageResult';
import { uploadImage } from './services/api';
import { ProcessedImage, AppState } from './types';

function App() {
  const [state, setState] = useState<AppState>('idle');
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [statusText, setStatusText] = useState('');

  const handleFileSelect = useCallback(async (file: File) => {
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Start processing
    setState('processing');
    setStatusText('Removing background...');

    try {
      // Simulate progress updates
      const timer1 = setTimeout(() => setStatusText('Flipping image...'), 2000);
      const timer2 = setTimeout(() => setStatusText('Uploading to cloud...'), 4000);

      const response = await uploadImage(file);

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (response.success && response.image) {
        setResult(response.image);
        setState('complete');
        toast.success('Image transformed successfully!');
      } else {
        throw new Error(response.error || 'Failed to process image');
      }
    } catch (error) {
      setState('error');
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      // Reset to idle after error
      setTimeout(() => {
        setState('idle');
        setPreview('');
      }, 2000);
    }
  }, []);

  const handleReset = useCallback(() => {
    setState('idle');
    setPreview('');
    setResult(null);
    setStatusText('');
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toast Container */}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {/* Idle State */}
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-12"
              >
                <h1 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
                  Image Transformer
                </h1>
                <p className="text-xl text-gray-500">
                  Remove background & flip horizontally
                </p>
              </motion.div>

              <UploadZone onFileSelect={handleFileSelect} />
            </motion.div>
          )}

          {/* Processing State */}
          {state === 'processing' && (
            <ProcessingState key="processing" status={statusText} preview={preview} />
          )}

          {/* Complete State */}
          {state === 'complete' && result && (
            <ImageResult
              key="complete"
              originalPreview={preview}
              result={result}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="py-6 text-center text-sm text-gray-400"
      >
        Built for Uplane
      </motion.footer>
    </div>
  );
}

export default App;
```

---

## 4.6 Additional CSS Polish

Update `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #FAFAFA;
  color: #1A1A1A;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}

/* Selection color */
::selection {
  background-color: rgba(0, 102, 255, 0.2);
}

/* Focus styles */
button:focus-visible,
input:focus-visible {
  outline: 2px solid #0066FF;
  outline-offset: 2px;
}

/* Smooth image loading */
img {
  opacity: 1;
  transition: opacity 0.3s ease;
}

img[src=""] {
  opacity: 0;
}
```

---

## 4.7 Verification Checklist

### Animations
- [ ] Upload zone fades in on load
- [ ] Drag over shows glow effect and bouncing icon
- [ ] State transitions are smooth
- [ ] Processing spinner is smooth
- [ ] Result images slide in from sides
- [ ] Buttons have hover/tap feedback
- [ ] Copy button shows success state

### Polish
- [ ] Fonts load correctly (Inter)
- [ ] Colors match design system
- [ ] Spacing feels balanced
- [ ] Scrollbar is styled
- [ ] Focus states are visible
- [ ] No jank or stuttering

---

## Next Phase

UI polish is complete. Proceed to **Phase 5: Deployment** to deploy the application online.
