import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ExternalLink, Plus, RefreshCw, Trash2 } from 'lucide-react';
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
  logoUrl?: string;
  gradient?: string;
  isCustom: boolean;
  source: 'builtin' | 'custom' | 'vercel';
  vercelProjectUrl?: string;
  gitRepo?: string;
  fallbackUrl?: string;
};

function hostOf(url?: string) {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, '') : '';
  } catch {
    return '';
  }
}

function sameProjectName(left: string, right: string) {
  const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean(left) === clean(right) || clean(left).includes(clean(right)) || clean(right).includes(clean(left));
}

const DockIcon: React.FC<{
  item: DockItem;
  scale: number;
  y: number;
  isOpen: boolean;
  isMinimized: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ item, scale, y, isOpen, onClick, onContextMenu }) => {
  const [logoError, setLogoError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[item.icon] ?? Icons.Globe;
  const exactLogoUrl = item.logoUrl && !logoError ? item.logoUrl : '';
  const faviconUrl = !exactLogoUrl && item.url && !faviconError ? getFaviconUrl(item.url, 128) : '';
  const imageUrl = exactLogoUrl || faviconUrl;
  const bg = item.gradient ?? 'linear-gradient(145deg, #475569, #1e293b)';

  return (
    <motion.div
      className="liquid-app-icon"
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
        background: imageUrl
          ? 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(255,255,255,0.78))'
          : bg,
        border: '1px solid rgba(255,255,255,0.26)',
        boxShadow: isOpen
          ? '0 0 0 2px rgba(255,255,255,0.38), 0 10px 30px rgba(59,130,246,0.34), 0 8px 26px rgba(0,0,0,0.34)'
          : '0 8px 24px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
      whileTap={{ scale: scale * 0.92 }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.name}
          width={38}
          height={38}
          onError={() => {
            if (exactLogoUrl) setLogoError(true);
            else setFaviconError(true);
          }}
          style={{ objectFit: 'contain', borderRadius: 8 }}
        />
      ) : (
        <IconComponent size={27} className="text-white drop-shadow" />
      )}
    </motion.div>
  );
};

export const Dock: React.FC = () => {
  const { windows, openApp, customApps, removeCustomApp, vercelApps, vercelSync, refreshVercelApps } = useDesktop();
  const { canOpenApp } = usePermissions();
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [dockLeft, setDockLeft] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rightClickApp, setRightClickApp] = useState<string | null>(null);

  const allowedBuiltIn = apps.filter((a) => canOpenApp(a.permissionKey as keyof AppPermissions));

  const builtinMatches = new Map<string, string>();
  const builtInItems: DockItem[] = allowedBuiltIn.map((app) => {
    const match = vercelApps.find((vercelApp) =>
      hostOf(vercelApp.url) === hostOf(app.url) || sameProjectName(vercelApp.name, app.name) || sameProjectName(vercelApp.slug, app.id)
    );
    if (match) builtinMatches.set(match.id, app.id);
    return {
      id: app.id,
      name: app.name,
      icon: app.icon,
      url: match?.url || app.url,
      logoUrl: match?.logoUrl,
      gradient: app.gradient,
      isCustom: false,
      source: match ? 'vercel' : 'builtin',
      vercelProjectUrl: match?.vercelProjectUrl,
      gitRepo: match?.gitRepo,
      fallbackUrl: match?.fallbackUrl,
    };
  });

  const dynamicVercelItems: DockItem[] = vercelApps
    .filter((app) => !builtinMatches.has(app.id))
    .map((app) => ({
      id: app.id,
      name: app.name,
      icon: app.icon,
      url: app.url,
      fallbackUrl: app.fallbackUrl,
      logoUrl: app.logoUrl,
      gradient: app.gradient,
      isCustom: false,
      source: 'vercel',
      vercelProjectUrl: app.vercelProjectUrl,
      gitRepo: app.gitRepo,
    }));

  const allItems: DockItem[] = [
    ...builtInItems,
    ...dynamicVercelItems,
    ...customApps.map((app) => ({
      id: app.id,
      name: app.name,
      icon: app.icon,
      url: app.url,
      fallbackUrl: app.fallbackUrl,
      logoUrl: app.logoUrl,
      gradient: app.gradient,
      isCustom: true,
      source: 'custom' as const,
    })),
  ];

  const handleMouseMove = (e: React.MouseEvent) => {
    setMouseX(e.clientX);
    setDockLeft(dockRef.current?.getBoundingClientRect().left ?? 0);
  };
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
          style={{ borderRadius: 26, gap: GAP }}
        >
          {allItems.map((item, index) => {
            const { scale, y } = getMagnified(mouseX, index, dockLeft);
            const isOpen = windows.some((w) => w.appId === item.id && !w.isMinimized);
            const isMinimized = windows.some((w) => w.appId === item.id && w.isMinimized);
            const nearCursor = mouseX !== null &&
              Math.abs(mouseX - (dockLeft + index * (ICON_SIZE + GAP) + ICON_SIZE / 2)) < 56;

            return (
              <div key={item.id} className="relative flex flex-col items-center">
                {/* Context menu */}
                <AnimatePresence>
                  {rightClickApp === item.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.88, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.88 }}
                      className="absolute popup-glass"
                      style={{ bottom: ICON_SIZE + 14, left: '50%', transform: 'translateX(-50%)', borderRadius: 14, padding: 4, zIndex: 200, whiteSpace: 'nowrap' }}
                    >
                      {item.url && (
                        <button
                          onClick={() => { globalThis.open(item.url, '_blank'); setRightClickApp(null); }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 rounded-xl text-white/75 hover:bg-white/10 text-xs transition-colors"
                        >
                          <ExternalLink size={12} />
                          Abrir site
                        </button>
                      )}
                      {item.vercelProjectUrl && (
                        <button
                          onClick={() => { globalThis.open(item.vercelProjectUrl, '_blank'); setRightClickApp(null); }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 rounded-xl text-white/75 hover:bg-white/10 text-xs transition-colors"
                        >
                          <ExternalLink size={12} />
                          Vercel
                        </button>
                      )}
                      {item.source === 'vercel' && (
                        <button
                          onClick={() => { void refreshVercelApps(); setRightClickApp(null); }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 rounded-xl text-white/75 hover:bg-white/10 text-xs transition-colors"
                        >
                          <RefreshCw size={12} className={vercelSync.status === 'syncing' ? 'animate-spin' : ''} />
                          Sincronizar
                        </button>
                      )}
                      <button
                        onClick={() => { removeCustomApp(item.id); setRightClickApp(null); }}
                        className={`${item.isCustom ? 'flex' : 'hidden'} w-full items-center gap-2 px-3 py-1.5 rounded-xl text-red-300 hover:bg-red-500/10 text-xs transition-colors`}
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
                        borderRadius: 999,
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
                  width: 4, height: 4, borderRadius: '50%', marginTop: 4, flexShrink: 0,
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
            <div style={{ width: 1, height: ICON_SIZE * 0.55, background: 'rgba(255,255,255,0.22)', alignSelf: 'center', flexShrink: 0, marginInline: 4 }} />
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
                borderRadius: 16,
                background: 'rgba(255,255,255,0.14)',
                border: '1.5px dashed rgba(255,255,255,0.34)',
                color: 'rgba(255,255,255,0.68)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.22)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.68)';
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
