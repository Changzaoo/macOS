import React, { useState } from 'react';
import { Palette, Settings, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useDesktop } from '../../contexts/DesktopContext';
import { useAppearance } from '../../contexts/AppearanceContext';
import { WALLPAPERS } from '../../lib/wallpapers';
import { updateUserProfile } from '../../services/userService';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

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
    { id: 'appearance' as const, icon: <Palette size={15} />, label: 'Aparencia' },
    { id: 'account' as const, icon: <User size={15} />, label: 'Conta' },
    { id: 'permissions' as const, icon: <Shield size={15} />, label: 'Permissoes' },
  ];

  return (
    <div className="settings-shell h-full flex text-white overflow-hidden">
      <div className="settings-sidebar w-52 border-r border-white/10 flex flex-col p-3 gap-1 flex-shrink-0">
        <div className="px-3 py-2.5 mb-1">
          <h1 className="text-white/80 font-semibold flex items-center gap-2 text-xs uppercase tracking-widest">
            <Settings size={13} /> Ajustes
          </h1>
        </div>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
              tab === item.id
                ? 'bg-white/20 text-white shadow-inner'
                : 'text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'appearance' && (
          <div className="flex flex-col gap-5 max-w-3xl">
            <section>
              <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Wallpaper</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {WALLPAPERS.map((wallpaper) => (
                  <button
                    key={wallpaper.id}
                    type="button"
                    onClick={() => setWallpaperId(wallpaper.id)}
                    className="relative group text-left"
                    title={wallpaper.label}
                  >
                    <div
                      className="rounded-2xl overflow-hidden h-20 transition-all"
                      style={{
                        background: wallpaper.gradient,
                        border: wallpaperId === wallpaper.id
                          ? '2px solid rgba(255,255,255,0.86)'
                          : '1px solid rgba(255,255,255,0.12)',
                        boxShadow: wallpaperId === wallpaper.id
                          ? '0 0 0 3px rgba(96,165,250,0.28), 0 16px 34px rgba(0,0,0,0.22)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.12)',
                        transform: wallpaperId === wallpaper.id ? 'translateY(-2px)' : 'translateY(0)',
                      }}
                    />
                    <span className="block text-center text-white/60 text-xs mt-2 group-hover:text-white/80 transition-colors truncate">
                      {wallpaper.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="settings-card p-4">
              <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Cor de destaque</h2>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-11 h-10 rounded-xl cursor-pointer bg-transparent border border-white/20"
                />
                <span className="text-white/50 text-sm font-mono">{accentColor}</span>
              </div>
            </section>

            <section className="settings-card p-4">
              <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Preferencias visuais</h2>
              <div className="flex flex-col gap-3">
                <Toggle label="Animacoes" checked={animationsEnabled} onChange={setAnimationsEnabled} />
                <Toggle label="Desfoque glass" checked={blurEnabled} onChange={setBlurEnabled} />
                <Toggle label="Transparencia" checked={transparencyEnabled} onChange={setTransparencyEnabled} />
              </div>
            </section>
          </div>
        )}

        {tab === 'account' && (
          <div className="flex flex-col gap-5 max-w-xl">
            <section className="settings-card p-4 flex items-center gap-4">
              <Avatar src={user?.avatarUrl} name={user?.displayName ?? 'U'} size="xl" />
              <div>
                <p className="text-white font-semibold text-base">{user?.displayName}</p>
                <p className="text-white/50 text-sm">@{user?.username}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-300/20 mt-2 inline-block">
                  {user?.role}
                </span>
              </div>
            </section>

            <section className="settings-card p-4 flex flex-col gap-3">
              <div>
                <label className="text-white/60 text-xs uppercase tracking-widest block mb-1.5">Nome de exibicao</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none select-text transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(125,211,252,0.58)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                />
              </div>
              <Button onClick={handleSaveProfile} loading={saving} size="sm">Salvar perfil</Button>
            </section>

            <div className="flex flex-col gap-1.5 text-xs text-white/40 px-1">
              <p>UID: <span className="font-mono text-white/30">{user?.uid}</span></p>
              <p>Criado em: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
          </div>
        )}

        {tab === 'permissions' && (
          <div className="flex flex-col gap-3 max-w-2xl">
            <h2 className="text-white/60 text-xs uppercase tracking-widest mb-1">Suas permissoes</h2>
            {user &&
              Object.entries(user.permissions)
                .filter(([key]) => key !== 'apps')
                .map(([key, value]) => (
                  <div key={key} className="settings-card flex items-center justify-between py-2.5 px-4">
                    <span className="text-white/70 text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${value ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-300'}`}>
                      {value ? 'Sim' : 'Nao'}
                    </span>
                  </div>
                ))}

            <h3 className="text-white/50 text-xs uppercase tracking-widest mt-3">Aplicativos</h3>
            <div className="grid grid-cols-2 gap-2">
              {user &&
                Object.entries(user.permissions.apps).map(([key, value]) => (
                  <div key={key} className={`settings-card flex items-center gap-2 py-2 px-3 text-xs ${value ? 'text-green-200' : 'text-red-300'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${value ? 'bg-green-300' : 'bg-red-300'}`} />
                    {key}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
