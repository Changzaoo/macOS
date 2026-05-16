import React from 'react';
import { DesktopProvider } from '../contexts/DesktopContext';
import { AppearanceProvider } from '../contexts/AppearanceContext';
import { Desktop } from '../components/desktop/Desktop';
import { PasswordSetupModal } from '../components/desktop/PasswordSetupModal';
import { useAuth } from '../contexts/AuthContext';

export const DesktopPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AppearanceProvider>
      <DesktopProvider>
        <Desktop />
        {user.passwordSet === false && <PasswordSetupModal />}
      </DesktopProvider>
    </AppearanceProvider>
  );
};
