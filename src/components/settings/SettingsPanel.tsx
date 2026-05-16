import React, { useState } from 'react';
import { Settings, User, Palette, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDesktop } from '../../contexts/DesktopContext';
import { updateUserProfile } from '../../services/userService';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import toast from 'react-hot-toast';

const wallpaperOptions = [
  { id: 'gradient-1', label: 'Cosmo', colors: ['#1a1a2e', '#0f3460', '#533483'] },
  { id: 'gradient-2', label: 'Noite', colors: ['#0f0c29', '#302b63', '#24243e'] },
  { id: 'gradient-3', label: 'Oceano', colors: ['#141e30', '#243b55'] },
  { id: 'gradient-4', label: 'Floresta', colors: ['#1f4037', '#99f2c8'] },
  { id: 'gradient-5', label: 'Névoa', colors: ['#2c3e50', '#4ca1af'] },
];

export const SettingsPanel: React.FC = () => {
  const { user, setUser } = useAuth();
  const { wallpaper, setWallpaper, animationsEnabled, setAnimationsEnabled } = useDesktop();
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
    { id: 'appearance' as const, icon: <Palette size={16} />, label: 'Aparência' },
    { id: 'account' as const, icon: <User size={16} />, label: 'Conta' },
    { id: 'permissions' as const, icon: <Shield size={16} />, label: 'Permissões' },
  ];

  return (
    <div className="h-full flex bg-gray-900/95 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-48 border-r border-white/10 flex flex-col p-3 gap-1 flex-shrink-0">
        <div className="px-3 py-2 mb-2">
          <h1 className="text-white font-semibold flex items-center gap-2 text-sm">
            <Settings size={16} /> Configurações
          </h1>
        </div>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
              tab === t.id
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'appearance' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-white font-medium mb-3">Wallpaper</h2>
              <div className="grid grid-cols-3 gap-3">
                {wallpaperOptions.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => setWallpaper(wp.id)}
                    className={`rounded-xl overflow-hidden h-20 border-2 transition-all ${
                      wallpaper === wp.id
                        ? 'border-blue-400 scale-105'
                        : 'border-transparent hover:border-white/20'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${wp.colors.join(', ')})`,
                    }}
                  >
                    <span className="sr-only">{wp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-white font-medium mb-3">Cor de destaque</h2>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-white/20"
                />
                <span className="text-white/50 text-sm">{accentColor}</span>
              </div>
            </div>

            <div>
              <h2 className="text-white font-medium mb-3">Preferências</h2>
              <div className="flex flex-col gap-3">
                <Toggle
                  label="Animações"
                  checked={animationsEnabled}
                  onChange={setAnimationsEnabled}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'account' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar src={user?.avatarUrl} name={user?.displayName ?? 'U'} size="xl" />
              <div>
                <p className="text-white font-semibold text-lg">{user?.displayName}</p>
                <p className="text-white/40 text-sm">@{user?.username}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mt-1 inline-block">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-white/70 text-sm font-medium block mb-1">
                  Nome de exibição
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 select-text text-sm"
                />
              </div>
              <Button onClick={handleSaveProfile} loading={saving} size="sm">
                Salvar perfil
              </Button>
            </div>

            <div className="flex flex-col gap-2 text-sm text-white/50">
              <p>
                UID:{' '}
                <span className="text-white/30 font-mono text-xs">{user?.uid}</span>
              </p>
              <p>
                Criado em:{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                  : '—'}
              </p>
            </div>
          </div>
        )}

        {tab === 'permissions' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-white font-medium mb-1">Suas permissões</h2>
            {user &&
              Object.entries(user.permissions)
                .filter(([k]) => k !== 'apps')
                .map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 border-b border-white/5"
                  >
                    <span className="text-white/70 text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        val
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {val ? 'Sim' : 'Não'}
                    </span>
                  </div>
                ))}
            <div className="mt-4">
              <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2">
                Aplicativos
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {user &&
                  Object.entries(user.permissions.apps).map(([key, val]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-sm ${
                        val
                          ? 'bg-green-500/10 text-green-300'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          val ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
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
