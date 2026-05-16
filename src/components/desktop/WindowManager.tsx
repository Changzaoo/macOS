import React from 'react';
import { useDesktop } from '../../contexts/DesktopContext';
import { AppWindow } from './AppWindow';

export const WindowManager: React.FC = () => {
  const { windows } = useDesktop();

  return (
    <>
      {windows.map((win) => (
        <AppWindow key={win.id} window={win} />
      ))}
    </>
  );
};
