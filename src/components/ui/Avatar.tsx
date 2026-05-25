import React from 'react';

type AvatarProps = {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizeMap = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
      className={`rounded-full object-cover ring-1 ring-white/25 ${sizeMap[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-cyan-300 via-blue-400 to-pink-300 flex items-center justify-center font-semibold text-white ring-1 ring-white/25 shadow-sm ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
};
