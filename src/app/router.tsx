import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DesktopPage } from './DesktopPage';

export const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/desktop" element={<DesktopPage />} />
    <Route path="*" element={<Navigate to="/desktop" replace />} />
  </Routes>
);
