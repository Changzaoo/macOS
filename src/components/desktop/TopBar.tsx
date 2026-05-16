import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Settings, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/authService';
import { usePermissions } from '../../hooks/usePermissions';
import { useDesktop } from '../../contexts/DesktopContext';
import { Avatar } from '../ui/Avatar';

export const TopBar: React.FC = () => {
  const { user, setUser } = useAuth();
  const { isAdmin, can } = usePermissions();
  const { openApp } = useDesktop();
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (user) await logoutUser(user.uid);
    setUser(null);
    setMenuOpen(false);
  };

  const formatted = time.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateFormatted = time.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-9 glass-dark flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-4">
        <span className="text-white font-semibold text-sm">◆ macOS</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-white/60 text-xs">{dateFormatted}</span>
        <span className="text-white text-sm font-medium">{formatted}</span>

        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Avatar src={user?.avatarUrl} name={user?.displayName ?? 'U'} size="sm" />
            <span className="text-white/80 text-xs">{user?.displayName}</span>
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-10 w-52 glass-dark rounded-xl overflow-hidden window-shadow"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-white font-medium text-sm">{user?.displayName}</p>
                    <p className="text-white/40 text-xs">@{user?.username} · {user?.role}</p>
                  </div>
                  <div className="p-1">
                    {can('canAccessSettings') && (
                      <MenuItem
                        icon={<Settings size={14} />}
                        label="Configurações"
                        onClick={() => { openApp('settings'); setMenuOpen(false); }}
                      />
                    )}
                    {isAdmin && (
                      <MenuItem
                        icon={<Shield size={14} />}
                        label="Painel Admin"
                        onClick={() => { openApp('admin'); setMenuOpen(false); }}
                      />
                    )}
                    <MenuItem icon={<User size={14} />} label="Meu Perfil" onClick={() => setMenuOpen(false)} />
                    <div className="h-px bg-white/10 my-1" />
                    <MenuItem icon={<LogOut size={14} />} label="Sair" onClick={handleLogout} danger />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      danger
        ? 'text-red-400 hover:bg-red-500/10'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);
