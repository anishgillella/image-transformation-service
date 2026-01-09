import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { TabNavigation } from './components/TabNavigation';
import { AnimatedBackground } from './components/AnimatedBackground';
import { UploadZone } from './components/UploadZone';
import { ProcessingState } from './components/ProcessingState';
import { ImageResult } from './components/ImageResult';
import { AdForge } from './components/adforge/AdForge';
import { uploadImage } from './services/api';
import type { ProcessedImage, AppState } from './types';

type Tab = 'adforge' | 'transformer';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('adforge');
  const [state, setState] = useState<AppState>('idle');
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [statusText, setStatusText] = useState('');

  const handleFileSelect = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setState('processing');
    setStatusText('Removing background...');

    try {
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
    <div className="min-h-screen flex flex-col relative">
      {/* Animated Background */}
      <AnimatedBackground />

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

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'adforge' ? (
            <motion.div
              key="adforge"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <AdForge />
            </motion.div>
          ) : (
            <motion.div
              key="transformer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center p-8"
            >
              <AnimatePresence mode="wait">
                {state === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-center mb-12"
                    >
                      <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                        Image Transformer
                      </h1>
                      <p className="text-xl text-gray-500">
                        Remove background & flip horizontally
                      </p>
                    </motion.div>

                    <UploadZone onFileSelect={handleFileSelect} />
                  </motion.div>
                )}

                {state === 'processing' && (
                  <ProcessingState key="processing" status={statusText} preview={preview} />
                )}

                {state === 'complete' && result && (
                  <ImageResult
                    key="complete"
                    originalPreview={preview}
                    result={result}
                    onReset={handleReset}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="py-6 text-center text-sm text-gray-400 relative z-10"
      >
        Built for Uplane
      </motion.footer>
    </div>
  );
}

export default App;
