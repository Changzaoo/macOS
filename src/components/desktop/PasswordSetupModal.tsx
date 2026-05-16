import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { setUserPassword } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

export const PasswordSetupModal: React.FC = () => {
  const { user, setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await setUserPassword(password);
      if (user) setUser({ ...user, passwordSet: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao definir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="w-full max-w-sm"
        style={{
          background: 'rgba(22,22,28,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          boxShadow: '0 32px 96px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center px-8 pt-8 pb-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-xl">Defina sua senha</h2>
          <p className="text-white/45 text-sm mt-1 leading-relaxed">
            Olá, <span className="text-white/70 font-medium">{user?.displayName}</span>!
            Crie uma senha para proteger seu acesso.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 flex flex-col gap-3">
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              autoFocus
              className="w-full pl-9 pr-10 py-3 rounded-xl bg-white/08 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all select-text"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmar senha"
              className="w-full pl-9 pr-4 py-3 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all select-text"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12 }}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="mt-1 w-full py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: loading ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.9)' }}
          >
            {loading ? 'Salvando…' : 'Definir senha e entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
