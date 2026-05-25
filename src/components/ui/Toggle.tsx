import React from 'react';
import { motion } from 'framer-motion';

type ToggleProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled }) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div
        className="relative w-11 h-6 rounded-full transition-colors duration-200"
        style={{
          background: checked
            ? 'linear-gradient(145deg, #6ee7f9, #60a5fa 48%, #f0abfc)'
            : 'rgba(255,255,255,0.16)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: checked ? '0 8px 22px rgba(96,165,250,0.24)' : 'inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
        onClick={() => !disabled && onChange(!checked)}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        />
      </div>
      {label && <span className="text-sm text-white/80">{label}</span>}
    </label>
  );
};
