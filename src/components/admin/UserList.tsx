import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, ToggleLeft, ToggleRight, Crown } from 'lucide-react';
import { toggleUserActive } from '../../services/userService';
import type { UserProfile } from '../../types/user';
import { Avatar } from '../ui/Avatar';
import toast from 'react-hot-toast';

const roleColors: Record<string, string> = {
  owner: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  admin: 'bg-red-500/20 text-red-300 border-red-500/30',
  manager: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  user: 'bg-green-500/20 text-green-300 border-green-500/30',
  guest: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

type UserListProps = {
  users: UserProfile[];
  currentUser: UserProfile;
  onEdit: (u: UserProfile) => void;
  onRefresh: () => void;
};

export const UserList: React.FC<UserListProps> = ({ users, currentUser, onEdit, onRefresh }) => {
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (target: UserProfile) => {
    if (target.role === 'owner') {
      toast.error('O owner não pode ser desativado.');
      return;
    }
    setToggling(target.uid);
    try {
      await toggleUserActive(currentUser.uid, target.uid, !target.active);
      toast.success(target.active ? 'Usuário desativado.' : 'Usuário ativado.');
      onRefresh();
    } catch {
      toast.error('Erro ao alterar status.');
    } finally {
      setToggling(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center text-white/30 py-12 text-sm">Nenhum usuário encontrado.</div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {users.map((u) => (
        <motion.div
          key={u.uid}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
            u.active
              ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
              : 'bg-red-900/10 border-red-500/20 opacity-60'
          }`}
        >
          <Avatar src={u.avatarUrl} name={u.displayName} size="md" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-white truncate">{u.displayName}</span>
              {u.role === 'owner' && <Crown size={12} className="text-yellow-400 flex-shrink-0" />}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${roleColors[u.role]}`}>
                {u.role}
              </span>
              {!u.active && <span className="text-xs text-red-400">Inativo</span>}
            </div>
            <p className="text-white/40 text-xs mt-0.5">@{u.username}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="text-white/30 text-xs hidden sm:block">
              {new Date(u.createdAt).toLocaleDateString('pt-BR')}
            </p>

            {currentUser.role === 'owner' ||
            (currentUser.role === 'admin' && u.role !== 'owner') ? (
              <>
                <button
                  onClick={() => onEdit(u)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                {u.uid !== currentUser.uid && (
                  <button
                    onClick={() => handleToggle(u)}
                    disabled={toggling === u.uid}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {u.active ? (
                      <ToggleRight size={16} className="text-green-400" />
                    ) : (
                      <ToggleLeft size={16} className="text-white/30" />
                    )}
                  </button>
                )}
              </>
            ) : null}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
