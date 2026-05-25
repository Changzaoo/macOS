import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AppWindow,
  Battery,
  BatteryCharging,
  CalendarDays,
  Check,
  Clipboard,
  Copy,
  ExternalLink,
  FilePlus,
  Grid2X2,
  LayoutGrid,
  LogOut,
  Minimize2,
  Monitor,
  Moon,
  Power,
  RefreshCw,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Sun,
  User,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useAppearance } from '../../contexts/AppearanceContext';
import { logoutUser } from '../../services/authService';
import { usePermissions } from '../../hooks/usePermissions';
import { useDesktop } from '../../contexts/DesktopContext';
import { apps } from '../../config/apps';
import type { AppPermissions } from '../../types/user';
import { Avatar } from '../ui/Avatar';
import { Toggle } from '../ui/Toggle';
import { AddAppModal } from './AddAppModal';

type Panel =
  | 'apple'
  | 'finder'
  | 'file'
  | 'edit'
  | 'view'
  | 'spotlight'
  | 'control'
  | 'wifi'
  | 'battery'
  | 'calendar'
  | null;

type LaunchItem = {
  id: string;
  name: string;
  icon: string;
  url?: string;
  logoUrl?: string;
  source: 'builtin' | 'vercel' | 'custom';
};

type BatteryState = {
  supported: boolean;
  level: number;
  charging: boolean;
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

function monthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const item = new Date(start);
    item.setDate(start.getDate() + index);
    return item;
  });
}

export const TopBar: React.FC = () => {
  const { user, setUser } = useAuth();
  const { isAdmin, can, canOpenApp } = usePermissions();
  const {
    animationsEnabled,
    arrangeWindows,
    closeActiveWindow,
    closeAllWindows,
    customApps,
    minimizeActiveWindow,
    minimizeAllWindows,
    openApp,
    openUrl,
    refreshVercelApps,
    setAnimationsEnabled,
    setWidgetsVisible,
    vercelApps,
    vercelSync,
    widgetsVisible,
    windows,
  } = useDesktop();
  const { blurEnabled, setBlurEnabled, setTransparencyEnabled, transparencyEnabled } = useAppearance();
  const [time, setTime] = useState(new Date());
  const [panel, setPanel] = useState<Panel>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [finderSearch, setFinderSearch] = useState('');
  const [spotlightSearch, setSpotlightSearch] = useState('');
  const [brightness, setBrightness] = useState(82);
  const [volume, setVolume] = useState(48);
  const [batteryState, setBatteryState] = useState<BatteryState>({ supported: false, level: 1, charging: false });
  const spotlightRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (panel === 'spotlight') setTimeout(() => spotlightRef.current?.focus(), 40);
  }, [panel]);

  useEffect(() => {
    const getBattery = (navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
    }).getBattery;
    if (!getBattery) return;
    getBattery.call(navigator).then((battery) => {
      setBatteryState({ supported: true, level: battery.level, charging: battery.charging });
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPanel('spotlight');
      }
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeWindow = useMemo(
    () => windows.filter((window) => !window.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0],
    [windows],
  );

  const launchItems = useMemo<LaunchItem[]>(() => {
    const allowedBuiltIn = apps.filter((app) => canOpenApp(app.permissionKey as keyof AppPermissions));
    const matchedVercel = new Set<string>();
    const builtInItems = allowedBuiltIn.map((app) => {
      const match = vercelApps.find((vercelApp) =>
        hostOf(vercelApp.url) === hostOf(app.url) || sameProjectName(vercelApp.name, app.name) || sameProjectName(vercelApp.slug, app.id)
      );
      if (match) matchedVercel.add(match.id);
      return {
        id: app.id,
        name: app.name,
        icon: app.icon,
        url: match?.url ?? app.url,
        logoUrl: match?.logoUrl,
        source: match ? 'vercel' as const : 'builtin' as const,
      };
    });

    return [
      ...builtInItems,
      ...vercelApps
        .filter((app) => !matchedVercel.has(app.id))
        .map((app) => ({
          id: app.id,
          name: app.name,
          icon: app.icon,
          url: app.url,
          logoUrl: app.logoUrl,
          source: 'vercel' as const,
        })),
      ...customApps.map((app) => ({
        id: app.id,
        name: app.name,
        icon: app.icon,
        url: app.url,
        logoUrl: app.logoUrl,
        source: 'custom' as const,
      })),
    ];
  }, [canOpenApp, customApps, vercelApps]);

  const finderResults = useMemo(() => {
    const query = finderSearch.trim().toLowerCase();
    return query
      ? launchItems.filter((item) => item.name.toLowerCase().includes(query) || item.url?.toLowerCase().includes(query))
      : launchItems;
  }, [finderSearch, launchItems]);

  const spotlightResults = useMemo(() => {
    const query = spotlightSearch.trim().toLowerCase();
    const actionItems: LaunchItem[] = [
      { id: 'action-settings', name: 'Abrir Ajustes', icon: 'Settings', source: 'builtin' },
      { id: 'action-arrange', name: 'Organizar janelas', icon: 'LayoutGrid', source: 'builtin' },
      { id: 'action-sync', name: 'Sincronizar Vercel', icon: 'RefreshCw', source: 'builtin' },
    ];
    return [...launchItems, ...actionItems]
      .filter((item) => !query || item.name.toLowerCase().includes(query) || item.url?.toLowerCase().includes(query))
      .slice(0, 9);
  }, [launchItems, spotlightSearch]);

  const timeFormatted = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = time.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  const batteryPercent = Math.round(batteryState.level * 100);

  const togglePanel = (target: Panel) => {
    setMenuOpen(false);
    setPanel((current) => (current === target ? null : target));
  };

  const handleLogout = async () => {
    if (user) await logoutUser(user.uid);
    setUser(null);
    setMenuOpen(false);
  };

  const runLaunchItem = (item: LaunchItem) => {
    if (item.id === 'action-settings') openApp('settings');
    else if (item.id === 'action-arrange') arrangeWindows();
    else if (item.id === 'action-sync') void refreshVercelApps();
    else openApp(item.id);
    setPanel(null);
    setSpotlightSearch('');
  };

  const runSpotlight = () => {
    const first = spotlightResults[0];
    if (first) {
      runLaunchItem(first);
      return;
    }

    const raw = spotlightSearch.trim();
    if (!raw) return;
    const url = raw.includes('.') && !raw.includes(' ')
      ? (raw.startsWith('http') ? raw : `https://${raw}`)
      : `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
    openUrl(url, raw.includes('.') ? raw : 'Busca', 'Search');
    setPanel(null);
    setSpotlightSearch('');
  };

  const copyActiveUrl = async () => {
    if (!activeWindow?.currentUrl) {
      toast.error('Nenhuma janela ativa com URL.');
      return;
    }
    await navigator.clipboard.writeText(activeWindow.currentUrl);
    toast.success('URL copiada.');
  };

  const openClipboard = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return toast.error('Area de transferencia vazia.');
      const url = text.includes('.') && !text.includes(' ')
        ? (text.startsWith('http') ? text : `https://${text}`)
        : `https://www.google.com/search?q=${encodeURIComponent(text)}`;
      openUrl(url, 'Clipboard', 'Clipboard');
      setPanel(null);
    } catch {
      toast.error('Permissao de clipboard negada pelo navegador.');
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 h-9 topbar-glass flex items-center justify-between px-3 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <MenuAnchor>
            <button type="button" onClick={() => togglePanel('apple')} className="menu-pill h-6 px-2.5 flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-[5px]"
                style={{ background: 'linear-gradient(145deg, #fff, #8bd9ff 38%, #a78bfa 72%, #ff9ccf)' }}
              />
              <span className="text-white/90 font-semibold text-sm tracking-normal">macOS</span>
            </button>
            <TopbarPanel open={panel === 'apple'} onClose={() => setPanel(null)} width={260}>
              <PanelHeader title="macOS" subtitle="Liquid Glass Desktop" />
              <MenuItem icon={<Monitor size={14} />} label="Sobre este Mac" detail="Vercel OS" onClick={() => toast.success('macOS web inspirado em Liquid Glass.')} />
              <MenuItem icon={<RefreshCw size={14} />} label="Sincronizar dock" detail={vercelSync.status} onClick={() => { void refreshVercelApps(); setPanel(null); }} />
              <MenuItem icon={<Settings size={14} />} label="Ajustes" onClick={() => { openApp('settings'); setPanel(null); }} />
              <Divider />
              <MenuItem icon={<LayoutGrid size={14} />} label="Organizar janelas" onClick={() => { arrangeWindows(); setPanel(null); }} />
              <MenuItem icon={<Moon size={14} />} label="Repousar" detail="Minimiza tudo" onClick={() => { minimizeAllWindows(); setPanel(null); }} />
              <MenuItem icon={<Power size={14} />} label="Encerrar sessao visual" danger onClick={() => { closeAllWindows(); setPanel(null); }} />
            </TopbarPanel>
          </MenuAnchor>

          <div className="hidden md:flex items-center gap-1 text-white/70 text-[13px]">
            <MenuAnchor>
              <TopButton active={panel === 'finder'} onClick={() => togglePanel('finder')}>Finder</TopButton>
              <TopbarPanel open={panel === 'finder'} onClose={() => setPanel(null)} width={420}>
                <PanelHeader title="Finder" subtitle={`${launchItems.length} apps conectados`} />
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    value={finderSearch}
                    onChange={(event) => setFinderSearch(event.target.value)}
                    placeholder="Buscar apps, projetos e URLs"
                    className="w-full rounded-2xl bg-white/10 border border-white/20 pl-9 pr-3 py-2 text-sm outline-none select-text placeholder-white/40"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {finderResults.map((item) => (
                    <LaunchTile key={item.id} item={item} onClick={() => runLaunchItem(item)} />
                  ))}
                </div>
              </TopbarPanel>
            </MenuAnchor>

            <MenuAnchor>
              <TopButton active={panel === 'file'} onClick={() => togglePanel('file')}>Arquivo</TopButton>
              <TopbarPanel open={panel === 'file'} onClose={() => setPanel(null)} width={270}>
                <PanelHeader title="Arquivo" subtitle={activeWindow?.title ?? 'Nenhuma janela ativa'} />
                <MenuItem icon={<FilePlus size={14} />} label="Novo app no dock" onClick={() => { setShowAddModal(true); setPanel(null); }} />
                <MenuItem icon={<ExternalLink size={14} />} label="Abrir janela web" detail="Google" onClick={() => { openUrl('https://www.google.com', 'Google', 'Globe'); setPanel(null); }} />
                <Divider />
                <MenuItem icon={<Minimize2 size={14} />} label="Minimizar janela ativa" disabled={!activeWindow} onClick={() => { minimizeActiveWindow(); setPanel(null); }} />
                <MenuItem icon={<X size={14} />} label="Fechar janela ativa" disabled={!activeWindow} onClick={() => { closeActiveWindow(); setPanel(null); }} />
                <MenuItem icon={<LayoutGrid size={14} />} label="Organizar janelas" disabled={windows.length === 0} onClick={() => { arrangeWindows(); setPanel(null); }} />
              </TopbarPanel>
            </MenuAnchor>

            <MenuAnchor>
              <TopButton active={panel === 'edit'} onClick={() => togglePanel('edit')}>Editar</TopButton>
              <TopbarPanel open={panel === 'edit'} onClose={() => setPanel(null)} width={280}>
                <PanelHeader title="Editar" subtitle="Clipboard inteligente" />
                <MenuItem icon={<Copy size={14} />} label="Copiar URL ativa" disabled={!activeWindow?.currentUrl} onClick={() => { void copyActiveUrl(); setPanel(null); }} />
                <MenuItem icon={<Clipboard size={14} />} label="Abrir do clipboard" detail="URL ou busca" onClick={() => { void openClipboard(); }} />
                <MenuItem icon={<Search size={14} />} label="Buscar no Spotlight" onClick={() => setPanel('spotlight')} />
              </TopbarPanel>
            </MenuAnchor>

            <MenuAnchor>
              <TopButton active={panel === 'view'} onClick={() => togglePanel('view')}>Visualizar</TopButton>
              <TopbarPanel open={panel === 'view'} onClose={() => setPanel(null)} width={300}>
                <PanelHeader title="Visualizar" subtitle="Ajustes instantaneos" />
                <ToggleRow label="Widgets" checked={widgetsVisible} onChange={setWidgetsVisible} />
                <ToggleRow label="Liquid blur" checked={blurEnabled} onChange={setBlurEnabled} />
                <ToggleRow label="Transparencia" checked={transparencyEnabled} onChange={setTransparencyEnabled} />
                <ToggleRow label="Animacoes" checked={animationsEnabled} onChange={setAnimationsEnabled} />
                <Divider />
                <MenuItem icon={<Grid2X2 size={14} />} label="Mission Control" detail="Grade" onClick={() => { arrangeWindows(); setPanel(null); }} />
              </TopbarPanel>
            </MenuAnchor>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="status-pill h-6 px-2 hidden sm:flex items-center gap-2 text-white/70">
            <IconButton title="Spotlight" active={panel === 'spotlight'} onClick={() => togglePanel('spotlight')}><Search size={13} strokeWidth={1.8} /></IconButton>
            <IconButton title="Central de Controle" active={panel === 'control'} onClick={() => togglePanel('control')}><SlidersHorizontal size={13} strokeWidth={1.8} /></IconButton>
            <IconButton title="Vercel Sync" active={panel === 'wifi'} onClick={() => togglePanel('wifi')}>
              {vercelSync.status === 'offline' || vercelSync.status === 'error' ? <WifiOff size={13} strokeWidth={1.8} /> : <Wifi size={13} strokeWidth={1.8} />}
            </IconButton>
            <IconButton title="Bateria" active={panel === 'battery'} onClick={() => togglePanel('battery')}>
              {batteryState.charging ? <BatteryCharging size={14} strokeWidth={1.8} /> : <Battery size={14} strokeWidth={1.8} />}
            </IconButton>
          </div>

          <MenuAnchor>
            <button type="button" onClick={() => togglePanel('calendar')} className="status-pill h-6 px-2.5 flex items-center gap-2">
              <span className="hidden sm:inline text-white/60 text-xs capitalize">{dateFormatted}</span>
              <span className="text-white/90 text-sm font-semibold tabular-nums">{timeFormatted}</span>
            </button>
            <TopbarPanel open={panel === 'calendar'} onClose={() => setPanel(null)} align="right" width={330}>
              <CalendarPanel date={time} vercelStatus={vercelSync.status} openWindows={windows.filter((window) => !window.isMinimized).length} />
            </TopbarPanel>
          </MenuAnchor>

          <MenuAnchor>
            <TopbarPanel open={panel === 'control'} onClose={() => setPanel(null)} align="right" width={330}>
              <PanelHeader title="Central de Controle" subtitle="Sistema visual" />
              <RangeRow icon={<Sun size={15} />} label="Brilho" value={brightness} onChange={setBrightness} />
              <RangeRow icon={<Volume2 size={15} />} label="Som" value={volume} onChange={setVolume} />
              <Divider />
              <ToggleRow label="Widgets" checked={widgetsVisible} onChange={setWidgetsVisible} />
              <ToggleRow label="Blur" checked={blurEnabled} onChange={setBlurEnabled} />
              <ToggleRow label="Transparencia" checked={transparencyEnabled} onChange={setTransparencyEnabled} />
              <MenuItem icon={<RefreshCw size={14} />} label="Atualizar projetos Vercel" detail={vercelSync.status} onClick={() => { void refreshVercelApps(); }} />
            </TopbarPanel>
          </MenuAnchor>

          <MenuAnchor>
            <TopbarPanel open={panel === 'wifi'} onClose={() => setPanel(null)} align="right" width={320}>
              <PanelHeader title="Vercel Sync" subtitle={vercelSync.configured ? 'Dock automatico ativo' : 'Configure VERCEL_TOKEN'} />
              <div className="settings-card p-3 mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Projetos no dock</p>
                    <p className="text-xs text-white/50">{vercelApps.length} apps sincronizados</p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${vercelSync.status === 'ready' ? 'bg-green-300' : vercelSync.status === 'syncing' ? 'bg-sky-300' : 'bg-red-300'}`} />
                </div>
              </div>
              {vercelSync.error && <p className="text-xs text-red-200 bg-red-500/10 border border-red-300/20 rounded-xl p-2 mb-2">{vercelSync.error}</p>}
              <MenuItem icon={<RefreshCw size={14} className={vercelSync.status === 'syncing' ? 'animate-spin' : ''} />} label="Sincronizar agora" onClick={() => { void refreshVercelApps(); }} />
              {vercelApps.slice(0, 4).map((item) => (
                <MenuItem key={item.id} icon={<AppWindow size={14} />} label={item.name} detail={hostOf(item.url)} onClick={() => { openApp(item.id); setPanel(null); }} />
              ))}
            </TopbarPanel>
          </MenuAnchor>

          <MenuAnchor>
            <TopbarPanel open={panel === 'battery'} onClose={() => setPanel(null)} align="right" width={290}>
              <PanelHeader title="Energia" subtitle={batteryState.supported ? `${batteryPercent}% ${batteryState.charging ? 'carregando' : 'na bateria'}` : 'API de bateria indisponivel'} />
              <div className="settings-card p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Bateria</span>
                  <span className="text-sm font-semibold text-white">{batteryState.supported ? `${batteryPercent}%` : 'Navegador'}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-sky-300" style={{ width: `${batteryState.supported ? batteryPercent : 76}%` }} />
                </div>
              </div>
              <MenuItem icon={<Moon size={14} />} label="Repousar desktop" detail="Minimiza janelas" onClick={() => { minimizeAllWindows(); setPanel(null); }} />
              <MenuItem icon={<Power size={14} />} label="Fechar todas as janelas" danger disabled={windows.length === 0} onClick={() => { closeAllWindows(); setPanel(null); }} />
            </TopbarPanel>
          </MenuAnchor>

          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setPanel(null); setMenuOpen((value) => !value); }}
              className="menu-pill flex items-center gap-2 h-7 px-2 transition-colors hover:bg-white/10"
            >
              <Avatar src={user?.avatarUrl} name={user?.displayName ?? 'U'} size="sm" />
              <span className="hidden sm:inline text-white/80 text-xs font-medium">{user?.displayName}</span>
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <button type="button" className="fixed inset-0 cursor-default" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 w-56 popup-glass rounded-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white font-medium text-sm">{user?.displayName}</p>
                      <p className="text-white/50 text-xs">@{user?.username} - {user?.role}</p>
                    </div>
                    <div className="p-1">
                      {can('canAccessSettings') && (
                        <MenuAction
                          icon={<Settings size={13} />}
                          label="Ajustes"
                          onClick={() => { openApp('settings'); setMenuOpen(false); }}
                        />
                      )}
                      {isAdmin && (
                        <MenuAction
                          icon={<Shield size={13} />}
                          label="Painel Admin"
                          onClick={() => { openApp('admin'); setMenuOpen(false); }}
                        />
                      )}
                      <MenuAction icon={<User size={13} />} label="Meu perfil" onClick={() => setMenuOpen(false)} />
                      <div className="h-px bg-white/10 my-1" />
                      <MenuAction icon={<LogOut size={13} />} label="Sair" onClick={handleLogout} danger />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {panel === 'spotlight' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh] bg-black/20 backdrop-blur-sm"
            onClick={() => setPanel(null)}
          >
            <motion.div
              initial={{ y: -20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -20, scale: 0.96 }}
              className="spotlight-panel w-[min(640px,calc(100vw-32px))] overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <Search size={20} className="text-white/60" />
                <input
                  ref={spotlightRef}
                  value={spotlightSearch}
                  onChange={(event) => setSpotlightSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') runSpotlight();
                  }}
                  placeholder="Buscar apps, comandos ou abrir URL"
                  className="flex-1 bg-transparent outline-none text-white text-lg select-text placeholder-white/40"
                />
              </div>
              <div className="p-2 max-h-[420px] overflow-y-auto">
                {spotlightResults.map((item) => (
                  <SpotlightItem key={item.id} item={item} onClick={() => runLaunchItem(item)} />
                ))}
                {spotlightResults.length === 0 && (
                  <button type="button" onClick={runSpotlight} className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-white/10">
                    <Search size={18} className="text-white/60" />
                    <span className="text-white/75 text-sm">Pesquisar "{spotlightSearch}"</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && <AddAppModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </>
  );
};

const MenuAnchor: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative flex items-center">{children}</div>
);

const TopButton: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2 py-1 rounded-full transition-colors ${active ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
  >
    {children}
  </button>
);

const IconButton: React.FC<{ title: string; active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ title, active, onClick, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
  >
    {children}
  </button>
);

const TopbarPanel: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
  width?: number;
}> = ({ open, onClose, children, align = 'left', width = 280 }) => (
  <AnimatePresence>
    {open && (
      <>
        <button type="button" className="fixed inset-0 z-[41] cursor-default" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.14 }}
          className={`absolute top-8 z-[42] popup-glass rounded-2xl overflow-hidden p-2 ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{ width }}
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const PanelHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="px-2.5 py-2">
    <p className="text-white font-semibold text-sm">{title}</p>
    {subtitle && <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>}
  </div>
);

const Divider = () => <div className="h-px bg-white/10 my-1" />;

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  detail?: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}> = ({ icon, label, detail, onClick, danger, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors disabled:opacity-35 disabled:cursor-default ${
      danger
        ? 'text-red-300 hover:bg-red-500/10'
        : 'text-white/75 hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className="w-4 flex justify-center">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    {detail && <span className="text-white/40">{detail}</span>}
  </button>
);

const MenuAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${
      danger
        ? 'text-red-300 hover:bg-red-500/10'
        : 'text-white/75 hover:bg-white/10 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: (value: boolean) => void }> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5">
    <span className="text-xs text-white/75">{label}</span>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

const RangeRow: React.FC<{ icon: React.ReactNode; label: string; value: number; onChange: (value: number) => void }> = ({ icon, label, value, onChange }) => (
  <div className="settings-card p-3 mb-2">
    <div className="flex items-center gap-2 text-white/75 text-xs mb-2">
      {icon}
      <span>{label}</span>
      <span className="ml-auto tabular-nums">{value}%</span>
    </div>
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="system-slider w-full"
    />
  </div>
);

const LaunchTile: React.FC<{ item: LaunchItem; onClick: () => void }> = ({ item, onClick }) => {
  const [failed, setFailed] = useState(false);
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[item.icon] ?? Icons.AppWindow;

  return (
    <button type="button" onClick={onClick} className="rounded-2xl p-3 hover:bg-white/10 transition-colors text-left">
      <div className="w-11 h-11 rounded-2xl liquid-app-icon flex items-center justify-center mb-2 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #49a8ff, #1f6dff 52%, #8f7cff)' }}>
        {item.logoUrl && !failed ? (
          <img src={item.logoUrl} alt={item.name} className="w-8 h-8 object-contain rounded-lg" onError={() => setFailed(true)} />
        ) : (
          <Icon size={21} className="text-white" />
        )}
      </div>
      <p className="text-white text-xs font-medium truncate">{item.name}</p>
      <p className="text-white/40 text-[11px] truncate">{item.source}</p>
    </button>
  );
};

const SpotlightItem: React.FC<{ item: LaunchItem; onClick: () => void }> = ({ item, onClick }) => {
  const [failed, setFailed] = useState(false);
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[item.icon] ?? Icons.AppWindow;

  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-white/10">
      <div className="w-9 h-9 rounded-xl liquid-app-icon flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #6ee7f9, #60a5fa 46%, #f0abfc)' }}>
        {item.logoUrl && !failed ? (
          <img src={item.logoUrl} alt={item.name} className="w-7 h-7 object-contain rounded-md" onError={() => setFailed(true)} />
        ) : (
          <Icon size={18} className="text-white" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate">{item.name}</p>
        <p className="text-white/40 text-xs truncate">{item.url ? hostOf(item.url) : 'Comando do sistema'}</p>
      </div>
      <Check size={14} className="ml-auto text-white/30" />
    </button>
  );
};

const CalendarPanel: React.FC<{ date: Date; vercelStatus: string; openWindows: number }> = ({ date, vercelStatus, openWindows }) => {
  const today = new Date();
  const days = monthDays(date);
  const month = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div>
      <PanelHeader title={month} subtitle={`${openWindows} janelas abertas - Vercel ${vercelStatus}`} />
      <div className="grid grid-cols-7 gap-1 px-1.5 pb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} className="text-center text-[11px] text-white/40 py-1">{day}</div>
        ))}
        {days.map((day) => {
          const active = day.toDateString() === today.toDateString();
          const muted = day.getMonth() !== date.getMonth();
          return (
            <div
              key={day.toISOString()}
              className={`h-8 rounded-xl flex items-center justify-center text-xs ${
                active ? 'bg-white text-slate-950 font-bold' : muted ? 'text-white/30' : 'text-white/70'
              }`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
      <div className="settings-card p-3 mt-1">
        <div className="flex items-center gap-2 text-white/75">
          <CalendarDays size={15} />
          <span className="text-xs">Hoje</span>
        </div>
        <p className="text-white text-sm font-semibold mt-1">{date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
      </div>
    </div>
  );
};
