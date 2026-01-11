import { useCallback, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { TabNavigation } from './components/TabNavigation';
import { AnimatedBackground } from './components/AnimatedBackground';
import { UploadZone } from './components/UploadZone';
import { ProcessingState } from './components/ProcessingState';
import { ImageResult } from './components/ImageResult';
import { AdForge } from './components/adforge/AdForge';
import { CampaignList, CampaignCreate, CampaignView } from './components/campaigns';
import { UsageDashboard } from './components/UsageDashboard';
import { CostTracker } from './components/CostTracker';
import { WarmupLoader } from './components/WarmupLoader';
import { useBackendWarmup } from './hooks/useBackendWarmup';
import { uploadImage } from './services/api';
import type { ProcessedImage, AppState } from './types';

// Image Transformer Page Component
function ImageTransformerPage() {
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
    <div className="flex-1 flex flex-col items-center justify-center p-8">
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
    </div>
  );
}

// Main App Layout with Navigation
function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isWarming, checkHealth } = useBackendWarmup();
  const [showLoader, setShowLoader] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Check backend health on initial load
  useEffect(() => {
    // Only show loader if backend takes more than 2 seconds to respond
    const loaderTimeout = setTimeout(() => {
      if (!initialCheckDone) {
        setShowLoader(true);
      }
    }, 2000);

    checkHealth().finally(() => {
      clearTimeout(loaderTimeout);
      setShowLoader(false);
      setInitialCheckDone(true);
    });

    return () => clearTimeout(loaderTimeout);
  }, [checkHealth, initialCheckDone]);

  // Determine active tab from URL
  const getActiveTab = (): 'adforge' | 'transformer' | 'campaigns' | 'usage' => {
    if (location.pathname === '/transformer') return 'transformer';
    if (location.pathname.startsWith('/campaigns')) return 'campaigns';
    if (location.pathname === '/usage') return 'usage';
    return 'adforge';
  };
  const activeTab = getActiveTab();

  const handleTabChange = (tab: 'adforge' | 'transformer' | 'campaigns' | 'usage') => {
    if (tab === 'adforge') navigate('/');
    else if (tab === 'campaigns') navigate('/campaigns');
    else if (tab === 'usage') navigate('/usage');
    else navigate('/transformer');
  };

  // Show warmup loader only if backend is slow (takes > 2 seconds)
  if (showLoader && isWarming) {
    return <WarmupLoader message="Starting up Victoria..." />;
  }

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
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1"
                >
                  <AdForge />
                </motion.div>
              }
            />
            <Route
              path="/transformer"
              element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  <ImageTransformerPage />
                </motion.div>
              }
            />
            {/* Campaign routes */}
            <Route
              path="/campaigns"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1"
                >
                  <CampaignList />
                </motion.div>
              }
            />
            <Route
              path="/campaigns/new"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1"
                >
                  <CampaignCreate />
                </motion.div>
              }
            />
            <Route
              path="/campaigns/:id"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1"
                >
                  <CampaignView />
                </motion.div>
              }
            />
            {/* Usage Dashboard */}
            <Route
              path="/usage"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1"
                >
                  <UsageDashboard />
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="py-6 text-center text-sm text-gray-400 relative z-10"
      >
        Built with AdForge
      </motion.footer>

      {/* Cost Tracker */}
      <CostTracker refreshInterval={3000} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
