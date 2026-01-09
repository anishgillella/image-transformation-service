# Phase 3: Frontend Implementation

## Objective
Build the core React components: upload zone, processing state, and result display.

---

## 3.1 Type Definitions

Create `src/types/index.ts`:

```typescript
export interface ProcessedImage {
  id: string;
  originalName: string;
  url: string;
  publicId: string;
  createdAt: string;
}

export interface UploadResponse {
  success: boolean;
  image?: ProcessedImage;
  error?: string;
}

export type AppState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
```

---

## 3.2 API Service

Create `src/services/api.ts`:

```typescript
import { ProcessedImage, UploadResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Upload an image for processing
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/images/upload`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

/**
 * Get all processed images
 */
export async function getImages(): Promise<ProcessedImage[]> {
  const response = await fetch(`${API_URL}/images`);
  const data = await response.json();
  return data.images || [];
}

/**
 * Delete an image
 */
export async function deleteImage(id: string): Promise<void> {
  await fetch(`${API_URL}/images/${id}`, {
    method: 'DELETE',
  });
}
```

---

## 3.3 Upload Zone Component

Create `src/components/UploadZone.tsx`:

```tsx
import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';

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
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full max-w-lg aspect-square
        border-2 border-dashed rounded-2xl
        flex flex-col items-center justify-center
        cursor-pointer transition-all duration-300 ease-out
        ${isDragging
          ? 'border-accent bg-accent/5 scale-105'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
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

      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <div className={`
          p-4 rounded-full transition-colors duration-300
          ${isDragging ? 'bg-accent/10' : 'bg-gray-100'}
        `}>
          <Upload
            size={32}
            className={isDragging ? 'text-accent' : 'text-gray-400'}
          />
        </div>

        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            {isDragging ? 'Drop it here!' : 'Drop your image here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 3.4 Processing State Component

Create `src/components/ProcessingState.tsx`:

```tsx
import { Loader2 } from 'lucide-react';

interface ProcessingStateProps {
  status: string;
  preview?: string;
}

export function ProcessingState({ status, preview }: ProcessingStateProps) {
  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-6">
      {/* Image Preview */}
      {preview && (
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
          <img
            src={preview}
            alt="Processing"
            className="w-full h-full object-contain opacity-50"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Loader2 size={48} className="text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Status Text */}
      <div className="flex items-center gap-3">
        {!preview && <Loader2 size={24} className="text-accent animate-spin" />}
        <p className="text-lg text-gray-600">{status}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full animate-progress" />
      </div>
    </div>
  );
}
```

Add to `src/index.css`:

```css
@keyframes progress {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 90%;
  }
}

.animate-progress {
  animation: progress 3s ease-out forwards;
}
```

---

## 3.5 Image Result Component

Create `src/components/ImageResult.tsx`:

```tsx
import { useState } from 'react';
import { Copy, Check, Download, RefreshCw } from 'lucide-react';
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
    <div className="w-full max-w-4xl flex flex-col items-center gap-8">
      {/* Before / After Comparison */}
      <div className="flex gap-6 w-full">
        {/* Original */}
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-500 text-center">Original</p>
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={originalPreview}
              alt="Original"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center text-gray-300">
          <span className="text-2xl">→</span>
        </div>

        {/* Transformed */}
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-500 text-center">Transformed</p>
          <div
            className="aspect-square rounded-xl overflow-hidden border border-gray-200"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          >
            <img
              src={result.url}
              alt="Transformed"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* URL Display */}
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
          <input
            type="text"
            value={result.url}
            readOnly
            className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check size={16} className="text-success" />
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <Download size={20} />
          Download
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={20} />
          Transform Another
        </button>
      </div>
    </div>
  );
}
```

---

## 3.6 Main App Component

Replace `src/App.tsx`:

```tsx
import { useState, useCallback } from 'react';
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
      setTimeout(() => setStatusText('Flipping image...'), 1500);
      setTimeout(() => setStatusText('Almost done...'), 3000);

      const response = await uploadImage(file);

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
      <Toaster position="top-center" richColors />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Title - Only show when idle */}
        {state === 'idle' && (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold text-gray-900 mb-3">
              Image Transformer
            </h1>
            <p className="text-lg text-gray-500">
              Remove background & flip horizontally
            </p>
          </div>
        )}

        {/* Upload Zone */}
        {state === 'idle' && (
          <UploadZone onFileSelect={handleFileSelect} />
        )}

        {/* Processing State */}
        {state === 'processing' && (
          <ProcessingState status={statusText} preview={preview} />
        )}

        {/* Result */}
        {state === 'complete' && result && (
          <ImageResult
            originalPreview={preview}
            result={result}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-400">
        Built for Uplane
      </footer>
    </div>
  );
}

export default App;
```

---

## 3.7 Clean Up Default Styles

Replace `src/App.css`:

```css
/* Keep empty or add custom app-specific styles */
```

---

## 3.8 Verification Checklist

- [ ] App loads without errors
- [ ] Upload zone appears centered
- [ ] Drag over zone shows visual feedback
- [ ] File selection triggers upload
- [ ] Processing state shows spinner and status
- [ ] Result shows before/after comparison
- [ ] Copy URL button works
- [ ] Download button works
- [ ] "Transform Another" resets the app
- [ ] Toast notifications appear

---

## 3.9 Testing

### Manual Test Flow

1. Open `http://localhost:5173`
2. Verify upload zone is visible
3. Drag an image over the zone - should highlight
4. Drop the image
5. Processing state should appear with preview
6. Wait for processing to complete
7. Result should show original and transformed images
8. Click "Copy" - URL should copy to clipboard
9. Click "Download" - image should download
10. Click "Transform Another" - should reset to upload zone

---

## Next Phase

Core functionality is complete. Proceed to **Phase 4: Polish & Animations** to add Framer Motion animations and microinteractions.
