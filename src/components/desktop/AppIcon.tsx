import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getFaviconUrl } from '../../lib/favicon';

type AppIconProps = {
  icon: string;
  name: string;
  url?: string;
  gradient?: string;
  onClick: () => void;
  isOpen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
};

export const AppIcon: React.FC<AppIconProps> = ({
  icon, name, url, gradient, onClick, isOpen, size = 'md', showLabel = true,
}) => {
  const [faviconError, setFaviconError] = useState(false);
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[icon] ?? Icons.AppWindow;

  const px = size === 'sm' ? 44 : size === 'lg' ? 72 : 56;
  const iconPx = size === 'sm' ? 22 : size === 'lg' ? 36 : 28;
  const faviconSz = size === 'sm' ? 32 : size === 'lg' ? 52 : 40;
  const radius = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

  const faviconUrl = url && !faviconError ? getFaviconUrl(url, 128) : '';

  const bg = gradient ?? 'linear-gradient(145deg, #3b82f6, #1d4ed8)';

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 cursor-pointer select-none"
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
    >
      <div
        className="liquid-app-icon"
        style={{
          width: px,
          height: px,
          borderRadius: radius,
          background: faviconUrl
            ? 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(255,255,255,0.78))'
            : bg,
          border: '1px solid rgba(255,255,255,0.26)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt={name}
            width={faviconSz}
            height={faviconSz}
            onError={() => setFaviconError(true)}
            style={{ objectFit: 'contain', borderRadius: 8 }}
          />
        ) : (
          <IconComponent size={iconPx} className="text-white drop-shadow" />
        )}
      </div>

      {showLabel && (
        <span
          className="text-white text-xs font-medium text-center leading-tight"
          style={{
            maxWidth: px + 12,
            textShadow: '0 1px 4px rgba(0,0,0,0.7)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
      )}

      {isOpen && (
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', marginTop: -2 }} />
      )}
    </motion.div>
  );
};
