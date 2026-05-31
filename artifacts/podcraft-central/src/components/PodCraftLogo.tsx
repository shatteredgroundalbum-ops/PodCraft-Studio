import React from 'react';
import { motion } from 'framer-motion';

interface PodCraftLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function PodCraftLogo({ variant = 'light', size = 'md', animated = false }: PodCraftLogoProps) {
  const barHeights = [16, 24, 32, 24, 16];
  const wordmarkColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  const subtitleColor = variant === 'light' ? 'text-violet-400' : 'text-gray-500';
  const sizeClasses = {
    sm: { wordmark: 'text-xl', subtitle: 'text-[9px]', gap: 'gap-1.5', barScale: 0.55 },
    md: { wordmark: 'text-4xl', subtitle: 'text-xs', gap: 'gap-3', barScale: 0.8 },
    lg: { wordmark: 'text-5xl md:text-6xl', subtitle: 'text-sm', gap: 'gap-4', barScale: 1 },
  };
  const currentSize = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center ${currentSize.gap}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {barHeights.map((height, i) => (
            <motion.div
              key={i}
              className="bg-violet-500 rounded-full"
              style={{ width: `${4 * currentSize.barScale}px`, height: `${height * currentSize.barScale}px` }}
              animate={animated ? { scaleY: [1, 1.2, 0.8, 1] } : {}}
              transition={animated ? { duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' } : {}}
            />
          ))}
        </div>
      </div>
      <div className="text-center">
        <h1 className={`font-black ${wordmarkColor} ${currentSize.wordmark} leading-none`}>
          PodCraft
        </h1>
        <p className={`${subtitleColor} ${currentSize.subtitle} font-semibold tracking-[0.2em] uppercase mt-1`}>
          Central
        </p>
      </div>
    </div>
  );
}
