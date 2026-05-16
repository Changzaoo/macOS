import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDesktop } from '../../contexts/DesktopContext';

const ICON_OPTIONS = [
  'Globe', 'Chrome', 'Youtube', 'ShoppingCart', 'Play', 'Music',
  'Video', 'Newspaper', 'Briefcase', 'BookOpen', 'Code2', 'Camera',
  'Mail', 'Phone', 'MapPin', 'Star', 'Heart', 'Coffee',
  'Zap', 'Flame', 'Rocket', 'Cloud', 'Database', 'Cpu',
  'TrendingUp', 'BarChart3', 'LineChart', 'DollarSign', 'Bitcoin', 'Coins',
  'Shield', 'Lock', 'Settings', 'Wrench', 'Trophy', 'Gamepad2',
  'Home', 'Building2', 'Car', 'Plane', 'Ship', 'Bot',
];

export const AddAppModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addCustomApp } = useDesktop();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('Globe');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Digite um nome para o aplicativo.'); return; }
    if (!url.trim()) { setError('Digite a URL do site.'); return; }

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    try { new URL(finalUrl); } catch { setError('URL inválida. Inclua o endereço completo.'); return; }

    addCustomApp({ name: name.trim(), url: finalUrl, icon });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 460, damping: 36 }}
        className="relative w-full max-w-md"
        style={{
          background: 'rgba(26,26,30,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-white font-semibold text-base">Adicionar Aplicativo</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wider">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: YouTube"
              autoFocus
              className="w-full px-3.5 py-2.5 text-white text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: '#fff',
              }}
            />
          </div>

          {/* URL */}
          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wider">URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com"
              className="w-full px-3.5 py-2.5 text-white text-sm outline-none transition-all font-mono"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: '#fff',
              }}
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-white/50 text-xs font-medium block mb-2 uppercase tracking-wider">Ícone</label>
            <div
              className="grid gap-1.5 overflow-y-auto pr-1"
              style={{ gridTemplateColumns: 'repeat(9, 1fr)', maxHeight: 160 }}
            >
              {ICON_OPTIONS.map((ic) => {
                const Ic = (Icons as unknown as Record<string, LucideIcon>)[ic];
                if (!Ic) return null;
                const selected = icon === ic;
                return (
                  <button
                    key={ic}
                    type="button"
                    title={ic}
                    onClick={() => setIcon(ic)}
                    className="flex items-center justify-center rounded-lg transition-all"
                    style={{
                      width: 36, height: 36,
                      background: selected ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.05)',
                      border: selected ? '1px solid rgba(99,179,237,0.5)' : '1px solid transparent',
                      color: selected ? '#fff' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    <Ic size={15} />
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-white/50 hover:text-white text-sm font-medium transition-colors hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors"
              style={{ background: 'rgba(59,130,246,0.9)' }}
            >
              Adicionar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
