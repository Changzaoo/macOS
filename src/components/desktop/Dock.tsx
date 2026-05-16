import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Plus, Trash2 } from 'lucide-react';
import { useDesktop } from '../../contexts/DesktopContext';
import { usePermissions } from '../../hooks/usePermissions';
import { apps } from '../../config/apps';
import type { AppPermissions } from '../../types/user';

import { AddAppModal } from './AddAppModal';

const ICON_SIZE = 52; // px, the base dock icon size
const GAP = 6;

// Magnification math
function getMagnified(mouseX: number | null, index: number, _total: number, dockLeft: number) {
  if (mouseX === null) return { scale: 1, y: 0 };
  const iconCenter = dockLeft + index * (ICON_SIZE + GAP) + ICON_SIZE / 2;
  const dist = Math.abs(mouseX - iconCenter);
  const radius = 90;
  if (dist > radius) return { scale: 1, y: 0 };
  const t = 1 - dist / radius;
  const scale = 1 + 0.55 * t * t;
  const liftY = -10 * t * t;
  return { scale, y: liftY };
}

export const Dock: React.FC = () => {
  const { windows, openApp, customApps, removeCustomApp } = useDesktop();
  const { canOpenApp } = usePermissions();
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rightClickApp, setRightClickApp] = useState<string | null>(null);

  const allowedBuiltIn = apps.filter((app) =>
    canOpenApp(app.permissionKey as keyof AppPermissions)
  );

  const allDockItems = [
    ...allowedBuiltIn.map((a) => ({ id: a.id, name: a.name, icon: a.icon, isCustom: false })),
    ...customApps.map((a) => ({ id: a.id, name: a.name, icon: a.icon, isCustom: true })),
  ];

  const handleMouseMove = (e: React.MouseEvent) => setMouseX(e.clientX);
  const handleMouseLeave = () => { setMouseX(null); setRightClickApp(null); };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.2 }}
          ref={dockRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="flex items-end px-3 py-2.5 relative"
          style={{
            background: 'rgba(255,255,255,0.11)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            gap: GAP,
          }}
        >
          {allDockItems.map((item, index) => {
            const dockLeft = dockRef.current?.getBoundingClientRect().left ?? 0;
            const { scale, y } = getMagnified(mouseX, index, allDockItems.length, dockLeft);
            const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[item.icon] ?? Icons.Globe;
            const isOpen = windows.some((w) => w.appId === item.id && !w.isMinimized);
            const isMinimized = windows.some((w) => w.appId === item.id && w.isMinimized);

            return (
              <div key={item.id} className="relative flex flex-col items-center">
                {/* Context menu for custom apps */}
                <AnimatePresence>
                  {rightClickApp === item.id && item.isCustom && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
                      style={{
                        background: 'rgba(26,26,30,0.97)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 10,
                        padding: '4px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        zIndex: 200,
                      }}
                    >
                      <button
                        onClick={() => removeCustomApp(item.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tooltip */}
                {mouseX !== null && Math.abs(mouseX - ((dockRef.current?.getBoundingClientRect().left ?? 0) + index * (ICON_SIZE + GAP) + ICON_SIZE / 2)) < 60 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute pointer-events-none"
                    style={{
                      bottom: ICON_SIZE * scale + 12,
                      background: 'rgba(26,26,30,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '3px 8px',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.85)',
                      whiteSpace: 'nowrap',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {item.name}
                  </motion.div>
                )}

                {/* Icon */}
                <motion.div
                  onClick={() => { setRightClickApp(null); openApp(item.id); }}
                  onContextMenu={(e) => { e.preventDefault(); setRightClickApp(rightClickApp === item.id ? null : item.id); }}
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    scale,
                    y,
                    transformOrigin: 'bottom center',
                    cursor: 'pointer',
                    borderRadius: 14,
                    background: 'linear-gradient(145deg, rgba(80,80,100,0.7), rgba(40,40,55,0.8))',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isOpen ? '0 0 0 2px rgba(99,179,237,0.4)' : 'none',
                    backdropFilter: 'blur(10px)',
                  }}
                  whileTap={{ scale: scale * 0.93 }}
                >
                  <IconComponent size={26} className="text-white drop-shadow" />
                </motion.div>

                {/* Open indicator dot */}
                <div
                  style={{
                    width: 4, height: 4, borderRadius: '50%', marginTop: 3,
                    background: isOpen ? 'rgba(255,255,255,0.85)' : isMinimized ? 'rgba(251,191,36,0.8)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                />
              </div>
            );
          })}

          {/* Separator + Add button */}
          {allDockItems.length > 0 && (
            <div style={{ width: 1, height: ICON_SIZE * 0.6, background: 'rgba(255,255,255,0.15)', alignSelf: 'center', flexShrink: 0, marginInline: 2 }} />
          )}

          <div className="flex flex-col items-center">
            <motion.button
              onClick={() => setShowAddModal(true)}
              whileTap={{ scale: 0.92 }}
              className="flex items-center justify-center"
              title="Adicionar aplicativo"
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.07)',
                border: '1.5px dashed rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
            >
              <Plus size={22} />
            </motion.button>
            <div style={{ width: 4, height: 4, marginTop: 3 }} />
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddModal && <AddAppModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </>
  );
};
