import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createUserByAdmin } from '../../services/authService';
import { updateUserProfile } from '../../services/userService';
import type { UserProfile, UserRole } from '../../types/user';
import { defaultPermissionsByRole } from '../../types/user';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { PermissionEditor } from './PermissionEditor';

type UserFormProps = {
  editUser: UserProfile | null;
  onClose: () => void;
  onSaved: () => void;
  actorUid: string;
};

export const UserForm: React.FC<UserFormProps> = ({ editUser, onClose, onSaved, actorUid }) => {
  const [username, setUsername] = useState(editUser?.username ?? '');
  const [displayName, setDisplayName] = useState(editUser?.displayName ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(editUser?.role ?? 'user');
  const [active, setActive] = useState(editUser?.active ?? true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(editUser?.theme ?? 'dark');
  const [accentColor, setAccentColor] = useState(editUser?.accentColor ?? '#0A84FF');
  const [avatarUrl, setAvatarUrl] = useState(editUser?.avatarUrl ?? '');
  const [permissions, setPermissions] = useState(
    editUser?.permissions ?? defaultPermissionsByRole('user')
  );
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'basic' | 'permissions'>('basic');

  const isEdit = editUser !== null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (username.length < 3) { toast.error('Username deve ter ao menos 3 caracteres.'); return; }
    if (!isEdit && password.length < 6) { toast.error('Senha deve ter ao menos 6 caracteres.'); return; }

    setLoading(true);
    try {
      if (isEdit) {
        await updateUserProfile(actorUid, editUser.uid, {
          displayName: displayName || username,
          role,
          active,
          theme,
          accentColor,
          avatarUrl: avatarUrl || undefined,
          permissions,
        });
        toast.success('Usuário atualizado.');
      } else {
        await createUserByAdmin(actorUid, {
          username: username.trim(),
          displayName: displayName || username,
          password,
          role,
          active,
          theme,
          accentColor,
          avatarUrl: avatarUrl || undefined,
        });
        toast.success('Usuário criado com sucesso.');
      }
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-lg glass rounded-2xl window-shadow overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex border-b border-white/10">
          {(['basic', 'permissions'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'basic' ? 'Informações' : 'Permissões'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="max-h-[60vh] overflow-y-auto">
          {tab === 'basic' && (
            <div className="p-6 flex flex-col gap-4">
              <Input
                label="Username"
                value={username}
                onChange={setUsername}
                placeholder="min. 3 caracteres"
                disabled={isEdit}
              />
              <Input
                label="Nome de exibição"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Nome completo"
              />
              {!isEdit && (
                <Input
                  label="Senha temporária"
                  value={password}
                  onChange={setPassword}
                  type="password"
                  placeholder="min. 6 caracteres"
                />
              )}
              <Input
                label="URL do Avatar (opcional)"
                value={avatarUrl}
                onChange={setAvatarUrl}
                placeholder="https://..."
              />
              <Select
                label="Role"
                value={role}
                onChange={(v) => {
                  setRole(v as UserRole);
                  setPermissions(defaultPermissionsByRole(v as UserRole));
                }}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'user', label: 'User' },
                  { value: 'guest', label: 'Guest' },
                ]}
              />
              <Select
                label="Tema"
                value={theme}
                onChange={(v) => setTheme(v as 'light' | 'dark' | 'auto')}
                options={[
                  { value: 'dark', label: 'Escuro' },
                  { value: 'light', label: 'Claro' },
                  { value: 'auto', label: 'Automático' },
                ]}
              />
              <div className="flex items-center gap-3">
                <label className="text-sm text-white/70">Cor de destaque</label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer bg-transparent border border-white/20"
                />
              </div>
              <Toggle label="Conta ativa" checked={active} onChange={setActive} />
            </div>
          )}

          {tab === 'permissions' && (
            <div className="p-6">
              <PermissionEditor permissions={permissions} onChange={setPermissions} />
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => handleSubmit()} loading={loading}>
            {isEdit ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
