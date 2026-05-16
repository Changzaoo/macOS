import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import { loginWithUsername, loginWithoutPassword } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { useFirstUserCheck } from '../../hooks/useFirstUserCheck';
import { Button } from '../ui/Button';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstLoading, setFirstLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { firstUserExists, loading: checking } = useFirstUserCheck();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    setLoading(true);
    try {
      const profile = await loginWithUsername(username.trim(), password);
      setUser(profile);
      navigate('/desktop');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar.';
      setError(
        msg.includes('wrong-password') ||
          msg.includes('user-not-found') ||
          msg.includes('invalid-credential')
          ? 'Usuário ou senha incorretos.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFirstAccess = async () => {
    if (!username.trim()) {
      setError('Digite o nome de usuário para o primeiro acesso.');
      return;
    }
    setError('');
    setFirstLoading(true);
    try {
      const profile = await loginWithoutPassword(username.trim());
      setUser(profile);
      navigate('/desktop');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro no primeiro acesso.');
    } finally {
      setFirstLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      <div className="absolute w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-sm mx-4"
      >
        <div className="glass rounded-3xl p-8 window-shadow">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">Bem-vindo</h1>
            <p className="text-white/50 text-sm mt-1">Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 z-10" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nome de usuário"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 select-text"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 z-10" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 select-text"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={!username || !password}
              size="lg"
              className="mt-2 w-full"
            >
              Entrar
            </Button>
          </form>

          {/* Primeiro acesso sem senha */}
          <div className="mt-6">
            <div className="h-px bg-white/10 mb-4" />
            {!checking && !firstUserExists ? (
              <p className="text-white/40 text-xs text-center mb-3">
                Nenhum administrador cadastrado
              </p>
            ) : (
              <p className="text-white/30 text-xs text-center mb-3">
                Primeiro acesso? Entre sem senha e defina uma depois.
              </p>
            )}
            <button
              type="button"
              onClick={handleFirstAccess}
              disabled={firstLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <LogIn size={15} />
              {firstLoading ? 'Entrando…' : 'Entrar sem senha (primeiro acesso)'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
