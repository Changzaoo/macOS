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
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-500' : 'bg-white/20'}`}
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
