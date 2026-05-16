import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { AppRouter } from './router';
import { isFirebaseConfigured, missingFirebaseEnv } from '../lib/firebase';
import '../styles/globals.css';

// ── Tela de configuração ausente ────────────────────────────────────────────
const FirebaseSetupScreen: React.FC<{ missing: string[] }> = ({ missing }) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
    }}
  >
    <div
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚙️</div>
      <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>
        Firebase não configurado
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 20px', lineHeight: 1.6 }}>
        {missing.length === 7
          ? 'Nenhuma variável de ambiente foi encontrada.'
          : `${missing.length} variável(is) ausente(s) no ambiente.`}
        {' '}Adicione-as no painel da Vercel e faça um novo deploy.
      </p>
      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'left',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Variáveis ausentes
        </p>
        {missing.map((v) => (
          <div key={v} style={{ color: 'rgba(251,146,60,0.9)', fontSize: '12px', fontFamily: 'monospace', padding: '2px 0' }}>
            {v}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0c29', color: '#f87171', fontFamily: 'monospace', padding: 24, textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: 18, marginBottom: 8 }}>Erro inesperado</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── App principal ───────────────────────────────────────────────────────────
const App: React.FC = () => {
  if (!isFirebaseConfigured) {
    return <FirebaseSetupScreen missing={missingFirebaseEnv} />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(30, 30, 40, 0.95)',
                color: '#fff',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#4ade80', secondary: '#fff' } },
              error: { iconTheme: { primary: '#f87171', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
