import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../components/auth/LoginPage';
import { FirstAccountPage } from '../components/auth/FirstAccountPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { DesktopPage } from './DesktopPage';

export const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/setup" element={<FirstAccountPage />} />
    <Route
      path="/desktop"
      element={
        <ProtectedRoute>
          <DesktopPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
