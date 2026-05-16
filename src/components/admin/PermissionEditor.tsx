import React from 'react';
import { Toggle } from '../ui/Toggle';
import type { UserPermissions } from '../../types/user';

type PermissionEditorProps = {
  permissions: UserPermissions;
  onChange: (p: UserPermissions) => void;
};

export const PermissionEditor: React.FC<PermissionEditorProps> = ({ permissions, onChange }) => {
  const update = (key: keyof Omit<UserPermissions, 'apps'>, value: boolean) => {
    onChange({ ...permissions, [key]: value });
  };

  const updateApp = (key: keyof UserPermissions['apps'], value: boolean) => {
    onChange({ ...permissions, apps: { ...permissions.apps, [key]: value } });
  };

  const systemPerms: Array<[keyof Omit<UserPermissions, 'apps'>, string]> = [
    ['canCreateUsers', 'Criar usuários'],
    ['canEditUsers', 'Editar usuários'],
    ['canDeleteUsers', 'Deletar usuários'],
    ['canManagePermissions', 'Gerenciar permissões'],
    ['canAccessSettings', 'Acessar configurações'],
    ['canOpenApps', 'Abrir aplicativos'],
    ['canUseFullscreen', 'Tela cheia'],
    ['canCustomizeDesktop', 'Personalizar desktop'],
  ];

  const appPerms: Array<[keyof UserPermissions['apps'], string]> = [
    ['crescer', 'Crescer'],
    ['gardenz', 'Gardenz'],
    ['criptoHub', 'Cripto Hub'],
    ['bitrade', 'Bitrade'],
    ['trade', 'Trade'],
    ['betintel', 'BetIntel'],
    ['yield', 'Yield'],
    ['aura', 'Aura'],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
          Sistema
        </h3>
        <div className="flex flex-col gap-3">
          {systemPerms.map(([key, label]) => (
            <Toggle
              key={key}
              label={label}
              checked={permissions[key]}
              onChange={(v) => update(key, v)}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10" />

      <div>
        <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
          Aplicativos
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {appPerms.map(([key, label]) => (
            <Toggle
              key={key}
              label={label}
              checked={permissions.apps[key]}
              onChange={(v) => updateApp(key, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
