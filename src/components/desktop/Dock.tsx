import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Plus, Trash2 } from 'lucide-react';
import { useDesktop } from '../../contexts/DesktopContext';
import { usePermissions } from '../../hooks/usePermissions';
import { apps } from '../../config/apps';
import type { AppPermissions } from '../../types/user';
import { getFaviconUrl } from '../../lib/favicon';
import { AddAppModal } from './AddAppModal';

const ICON_SIZE = 54;
const GAP = 7;

function getMagnified(mouseX: number | null, index: number, dockLeft: number) {
  if (mouseX === null) return { scale: 1, y: 0 };
  const center = dockLeft + index * (ICON_SIZE + GAP) + ICON_SIZE / 2;
  const dist = Math.abs(mouseX - center);
  const radius = 96;
  if (dist > radius) return { scale: 1, y: 0 };
  const t = 1 - dist / radius;
  return { scale: 1 + 0.58 * t * t, y: -12 * t * t };
}

type DockItem = {
  id: string;
  name: string;
  icon: string;
  url?: string;
  gradient?: string;
  isCustom: boolean;
};

const DockIcon: React.FC<{
  item: DockItem;
  scale: number;
  y: number;
  isOpen: boolean;
  isMinimized: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ item, scale, y, isOpen, onClick, onContextMenu }) => {
  const [faviconError, setFaviconError] = useState(false);
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[item.icon] ?? Icons.Globe;
  const faviconUrl = item.url && !faviconError ? getFaviconUrl(item.url, 128) : '';
  const bg = item.gradient ?? 'linear-gradient(145deg, #475569, #1e293b)';

  return (
    <motion.div
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        scale,
        y,
        transformOrigin: 'bottom center',
        cursor: 'pointer',
        borderRadius: 15,
        background: faviconUrl ? 'rgba(255,255,255,0.93)' : bg,
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: isOpen
          ? '0 0 0 2px rgba(99,179,237,0.5), 0 6px 24px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      whileTap={{ scale: scale * 0.92 }}
    >
      {faviconUrl ? (
        <img
          src={faviconUrl}
          alt={item.name}
          width={38}
          height={38}
          onError={() => setFaviconError(true)}
          style={{ objectFit: 'contain', borderRadius: 6 }}
        />
      ) : (
        <IconComponent size={27} className="text-white drop-shadow" />
      )}
    </motion.div>
  );
};

export const Dock: React.FC = () => {
  const { windows, openApp, customApps, removeCustomApp } = useDesktop();
  const { canOpenApp } = usePermissions();
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rightClickApp, setRightClickApp] = useState<string | null>(null);

  const allowedBuiltIn = apps.filter((a) => canOpenApp(a.permissionKey as keyof AppPermissions));

  const allItems: DockItem[] = [
    ...allowedBuiltIn.map((a) => ({ id: a.id, name: a.name, icon: a.icon, url: a.url, gradient: a.gradient, isCustom: false })),
    ...customApps.map((a) => ({ id: a.id, name: a.name, icon: a.icon, url: a.url, isCustom: true })),
  ];

  const handleMouseMove = (e: React.MouseEvent) => setMouseX(e.clientX);
  const handleMouseLeave = () => { setMouseX(null); setRightClickApp(null); };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.15 }}
          ref={dockRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="dock-glass flex items-end px-3 py-2.5 relative"
          style={{ borderRadius: 22, gap: GAP }}
        >
          {allItems.map((item, index) => {
            const dockLeft = dockRef.current?.getBoundingClientRect().left ?? 0;
            const { scale, y } = getMagnified(mouseX, index, dockLeft);
            const isOpen = windows.some((w) => w.appId === item.id && !w.isMinimized);
            const isMinimized = windows.some((w) => w.appId === item.id && w.isMinimized);
            const nearCursor = mouseX !== null &&
              Math.abs(mouseX - (dockLeft + index * (ICON_SIZE + GAP) + ICON_SIZE / 2)) < 56;

            return (
              <div key={item.id} className="relative flex flex-col items-center">
                {/* Context menu */}
                <AnimatePresence>
                  {rightClickApp === item.id && item.isCustom && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.88, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.88 }}
                      className="absolute popup-glass"
                      style={{ bottom: ICON_SIZE + 14, left: '50%', transform: 'translateX(-50%)', borderRadius: 10, padding: 4, zIndex: 200, whiteSpace: 'nowrap' }}
                    >
                      <button
                        onClick={() => { removeCustomApp(item.id); setRightClickApp(null); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tooltip */}
                <AnimatePresence>
                  {nearCursor && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute pointer-events-none popup-glass"
                      style={{
                        bottom: ICON_SIZE * scale + 14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderRadius: 8,
                        padding: '3px 9px',
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.88)',
                        whiteSpace: 'nowrap',
                        zIndex: 300,
                      }}
                    >
                      {item.name}
                    </motion.div>
                  )}
                </AnimatePresence>

                <DockIcon
                  item={item}
                  scale={scale}
                  y={y}
                  isOpen={isOpen}
                  isMinimized={isMinimized}
                  onClick={() => { setRightClickApp(null); openApp(item.id); }}
                  onContextMenu={(e) => { e.preventDefault(); setRightClickApp(rightClickApp === item.id ? null : item.id); }}
                />

                {/* Indicator dot */}
                <div style={{
                  width: 4, height: 4, borderRadius: '50%', marginTop: 3, flexShrink: 0,
                  background: isOpen
                    ? 'rgba(255,255,255,0.85)'
                    : isMinimized
                    ? 'rgba(251,191,36,0.8)'
                    : 'transparent',
                  transition: 'background 0.2s',
                }} />
              </div>
            );
          })}

          {/* Separator */}
          {allItems.length > 0 && (
            <div style={{ width: 1, height: ICON_SIZE * 0.55, background: 'rgba(255,255,255,0.15)', alignSelf: 'center', flexShrink: 0, marginInline: 2 }} />
          )}

          {/* Add button */}
          <div className="flex flex-col items-center">
            <motion.button
              onClick={() => setShowAddModal(true)}
              whileTap={{ scale: 0.92 }}
              title="Adicionar aplicativo"
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                borderRadius: 15,
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px dashed rgba(255,255,255,0.22)',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
              }}
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
