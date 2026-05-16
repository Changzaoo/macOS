import React from 'react';

type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  disabled,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm text-white/70 font-medium">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl
          bg-white/10 border border-white/20
          text-white placeholder-white/30
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          select-text
          ${error ? 'border-red-500/50 focus:ring-red-500/50' : ''}
        `}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
};
