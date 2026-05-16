import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDesktop } from '../../contexts/DesktopContext';
import { usePermissions } from '../../hooks/usePermissions';
import { apps } from '../../config/apps';
import type { AppPermissions } from '../../types/user';

export const Dock: React.FC = () => {
  const { windows, openApp } = useDesktop();
  const { canOpenApp } = usePermissions();

  const allowedApps = apps.filter((app) => canOpenApp(app.permissionKey as keyof AppPermissions));

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
        className="flex items-end gap-2 px-4 py-3 glass-dark rounded-2xl dock-shadow"
      >
        {allowedApps.map((app) => {
          const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[app.icon] ?? Icons.AppWindow;
          const isOpen = windows.some((w) => w.appId === app.id && !w.isMinimized);
          const isMinimized = windows.some((w) => w.appId === app.id && w.isMinimized);

          return (
            <DockIcon
              key={app.id}
              icon={<IconComponent size={28} className="text-white" />}
              name={app.name}
              isOpen={isOpen}
              isMinimized={isMinimized}
              onClick={() => openApp(app.id)}
            />
          );
        })}
      </motion.div>
    </div>
  );
};

type DockIconProps = {
  icon: React.ReactNode;
  name: string;
  isOpen: boolean;
  isMinimized: boolean;
  onClick: () => void;
};

const DockIcon: React.FC<DockIconProps> = ({ icon, name, isOpen, isMinimized, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
    >
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-8 bg-gray-900/90 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap backdrop-blur-sm border border-white/10 pointer-events-none"
        >
          {name}
        </motion.div>
      )}
      <motion.div
        animate={{ scale: hovered ? 1.3 : 1, y: hovered ? -8 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-600/60 to-gray-800/60 backdrop-blur-sm border border-white/15 flex items-center justify-center shadow-lg"
      >
        {icon}
      </motion.div>
      <div className={`mt-1 w-1 h-1 rounded-full transition-all duration-200 ${isOpen ? 'bg-white/80' : isMinimized ? 'bg-yellow-400/80' : 'bg-transparent'}`} />
    </motion.div>
  );
};
