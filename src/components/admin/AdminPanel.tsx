import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield } from 'lucide-react';
import { getAllUsers } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import type { UserProfile } from '../../types/user';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { Button } from '../ui/Button';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const all = await getAllUsers();
      setUsers(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full text-white/50 flex-col gap-3">
        <Shield size={40} className="opacity-30" />
        <p>Acesso restrito a administradores.</p>
      </div>
    );
  }

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-900/95 text-white overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-blue-400" />
          <h1 className="font-semibold text-lg">Painel Administrativo</h1>
        </div>
        <Button onClick={() => { setEditTarget(null); setShowForm(true); }} size="sm">
          <Plus size={14} className="mr-1" /> Novo Usuário
        </Button>
      </div>

      <div className="px-6 py-3 border-b border-white/10 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuários..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm select-text"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full" />
          </div>
        ) : (
          <UserList
            users={filtered}
            currentUser={user!}
            onEdit={(u) => { setEditTarget(u); setShowForm(true); }}
            onRefresh={loadUsers}
          />
        )}
      </div>

      {showForm && (
        <UserForm
          editUser={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={() => { setShowForm(false); setEditTarget(null); loadUsers(); }}
          actorUid={user!.uid}
        />
      )}
    </div>
  );
};
