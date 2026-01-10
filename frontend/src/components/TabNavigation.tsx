import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wand2, ImageIcon } from 'lucide-react';

type Tab = 'adforge' | 'transformer';

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  {
    id: 'adforge' as const,
    name: 'AdForge',
    icon: Wand2,
    description: 'AI-powered ads',
    path: '/',
  },
  {
    id: 'transformer' as const,
    name: 'Image Transformer',
    icon: ImageIcon,
    description: 'Remove & flip',
    path: '/transformer',
  },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center pt-8 pb-4"
    >
      <div className="relative inline-flex bg-white/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg shadow-black/5 border border-gray-200/50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative z-10 flex items-center gap-2.5 px-6 py-3 rounded-xl font-medium transition-colors duration-200
                ${isActive ? 'text-white' : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              {/* Animated background pill - only render on active tab */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 rounded-xl bg-black shadow-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon size={18} className={`relative z-10 ${isActive ? 'text-white' : ''}`} />
              <span className="relative z-10 text-sm font-semibold">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
