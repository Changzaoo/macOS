import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type AppIconProps = {
  icon: string;
  name: string;
  onClick: () => void;
  isOpen?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export const AppIcon: React.FC<AppIconProps> = ({ icon, name, onClick, isOpen, size = 'md' }) => {
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[icon] ?? Icons.AppWindow;

  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 32 : 26;
  const containerSize = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';

  return (
    <motion.div
      className="flex flex-col items-center gap-1 cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={`${containerSize} rounded-2xl bg-gradient-to-br from-blue-400/80 to-purple-600/80 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 transition-all duration-200`}
      >
        <IconComponent size={iconSize} className="text-white" />
      </div>
      <span className="text-white text-xs font-medium text-shadow opacity-90 text-center leading-tight max-w-[60px] truncate">
        {name}
      </span>
      {isOpen && (
        <div className="w-1 h-1 rounded-full bg-white/80 shadow-sm" />
      )}
    </motion.div>
  );
};
