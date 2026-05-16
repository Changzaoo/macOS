import React, { useState } from 'react';
import { Settings, User, Palette, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDesktop } from '../../contexts/DesktopContext';
import { useAppearance } from '../../contexts/AppearanceContext';
import { WALLPAPERS } from '../../lib/wallpapers';
import { updateUserProfile } from '../../services/userService';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import toast from 'react-hot-toast';

export const SettingsPanel: React.FC = () => {
  const { user, setUser } = useAuth();
  const { animationsEnabled, setAnimationsEnabled } = useDesktop();
  const { wallpaperId, setWallpaperId, blurEnabled, setBlurEnabled, transparencyEnabled, setTransparencyEnabled } = useAppearance();
  const [tab, setTab] = useState<'appearance' | 'account' | 'permissions'>('appearance');
  const [saving, setSaving] = useState(false);
  const [accentColor, setAccentColor] = useState(user?.accentColor ?? '#0A84FF');
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, user.uid, { displayName, accentColor });
      setUser({ ...user, displayName, accentColor });
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'appearance' as const, icon: <Palette size={15} />, label: 'Aparência' },
    { id: 'account' as const, icon: <User size={15} />, label: 'Conta' },
    { id: 'permissions' as const, icon: <Shield size={15} />, label: 'Permissões' },
  ];

  return (
    <div className="h-full flex text-white overflow-hidden" style={{ background: 'rgba(12,12,18,0.97)' }}>
      {/* Sidebar */}
      <div className="w-48 border-r border-white/08 flex flex-col p-3 gap-1 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="px-3 py-2.5 mb-1">
          <h1 className="text-white/80 font-semibold flex items-center gap-2 text-xs uppercase tracking-widest">
            <Settings size={13} /> Configurações
          </h1>
        </div>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
              tab === t.id
                ? 'bg-white/10 text-white'
                : 'text-white/45 hover:bg-white/05 hover:text-white/75'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'appearance' && (
          <div className="flex flex-col gap-7">
            {/* Wallpaper grid */}
            <div>
              <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Wallpaper</h2>
              <div className="grid grid-cols-4 gap-2.5">
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => setWallpaperId(wp.id)}
                    className="relative group"
                    title={wp.label}
                  >
                    <div
                      className="rounded-xl overflow-hidden h-16 transition-all"
                      style={{
                        background: wp.gradient,
                        border: wallpaperId === wp.id
                          ? '2px solid rgba(99,179,237,0.85)'
                          : '2px solid transparent',
                        boxShadow: wallpaperId === wp.id ? '0 0 0 1px rgba(99,179,237,0.3)' : 'none',
                        transform: wallpaperId === wp.id ? 'scale(1.04)' : 'scale(1)',
                      }}
                    />
                    <span className="block text-center text-white/50 text-xs mt-1 group-hover:text-white/75 transition-colors truncate">
                      {wp.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Cor de destaque</h2>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-9 rounded-lg cursor-pointer bg-transparent border border-white/20"
                />
                <span className="text-white/40 text-sm font-mono">{accentColor}</span>
              </div>
            </div>

            {/* Toggles */}
            <div>
              <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Preferências visuais</h2>
              <div className="flex flex-col gap-3">
                <Toggle label="Animações" checked={animationsEnabled} onChange={setAnimationsEnabled} />
                <Toggle label="Desfoque (glass)" checked={blurEnabled} onChange={setBlurEnabled} />
                <Toggle label="Transparência" checked={transparencyEnabled} onChange={setTransparencyEnabled} />
              </div>
            </div>
          </div>
        )}

        {tab === 'account' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar src={user?.avatarUrl} name={user?.displayName ?? 'U'} size="xl" />
              <div>
                <p className="text-white font-semibold text-base">{user?.displayName}</p>
                <p className="text-white/40 text-sm">@{user?.username}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 mt-1 inline-block">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-white/55 text-xs uppercase tracking-widest block mb-1.5">Nome de exibição</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none select-text transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,179,237,0.5)'; }}
                  onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
                />
              </div>
              <Button onClick={handleSaveProfile} loading={saving} size="sm">Salvar perfil</Button>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-white/35">
              <p>UID: <span className="font-mono text-white/25">{user?.uid}</span></p>
              <p>Criado em: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'}</p>
            </div>
          </div>
        )}

        {tab === 'permissions' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-white/60 text-xs uppercase tracking-widest mb-1">Suas permissões</h2>
            {user &&
              Object.entries(user.permissions)
                .filter(([k]) => k !== 'apps')
                .map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-white/05">
                    <span className="text-white/60 text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${val ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-400'}`}>
                      {val ? 'Sim' : 'Não'}
                    </span>
                  </div>
                ))}
            <div className="mt-3">
              <h3 className="text-white/40 text-xs uppercase tracking-widest mb-2">Aplicativos</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {user &&
                  Object.entries(user.permissions.apps).map(([key, val]) => (
                    <div key={key} className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs ${val ? 'bg-green-500/08 text-green-300' : 'bg-red-500/08 text-red-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${val ? 'bg-green-400' : 'bg-red-400'}`} />
                      {key}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
