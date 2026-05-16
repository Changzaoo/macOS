import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { AppRouter } from './router';
import { isFirebaseConfigured, missingFirebaseEnv } from '../config/firebase';
import '../styles/globals.css';

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
      return <CrashScreen message={this.state.error.message} missing={[]} />;
    }
    return this.props.children;
  }
}

// ── Tela de configuração incompleta ────────────────────────────────────────
const CrashScreen: React.FC<{ missing?: string[]; message?: string }> = ({
  missing = [],
  message,
}) => (
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
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(251,146,60,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '28px',
        }}
      >
        ⚙️
      </div>
      <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>
        Firebase não configurado
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 16px', lineHeight: 1.6 }}>
        {missing.length === 6
          ? 'Nenhuma variável de ambiente do Firebase foi encontrada.'
          : `${missing.length} variável(is) ausente(s). Adicione-as no painel da Vercel e faça um novo deploy.`}
      </p>
      {missing.length > 0 && (
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '20px',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Variáveis ausentes
          </p>
          {missing.map((v) => (
            <div
              key={v}
              style={{ color: 'rgba(251,146,60,0.9)', fontSize: '12px', fontFamily: 'monospace', padding: '2px 0' }}
            >
              {v}
            </div>
          ))}
        </div>
      )}
      {message && (
        <p style={{ color: 'rgba(248,113,113,0.8)', fontSize: '12px', fontFamily: 'monospace', margin: 0 }}>
          {message}
        </p>
      )}
    </div>
  </div>
);

// ── App principal ───────────────────────────────────────────────────────────
const App: React.FC = () => {
  if (!isFirebaseConfigured) {
    return <CrashScreen missing={missingFirebaseEnv} />;
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
