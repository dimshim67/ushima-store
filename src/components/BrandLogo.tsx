import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showText = true }) => {
  const iconDimensions = {
    sm: { w: 26, h: 26 },
    md: { w: 34, h: 34 },
    lg: { w: 46, h: 46 },
  }[size];

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer select-none">
      {/* Avant-garde Metallic Chrome Monogram "У" */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-b from-[#2a303c] via-[#161a22] to-[#0a0c0f] p-[1px] shadow-[0_4px_16px_rgba(0,0,0,0.7)] group-hover:shadow-[0_0_20px_rgba(200,210,225,0.25)] transition-all duration-300"
        style={{ width: iconDimensions.w + 6, height: iconDimensions.h + 6 }}
      >
        <div className="w-full h-full rounded-[11px] bg-[#0c0d10] flex items-center justify-center overflow-hidden relative">
          {/* Sheen reflection light beam */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />

          <svg
            width={iconDimensions.w}
            height={iconDimensions.h}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform duration-500 group-hover:scale-105"
          >
            <defs>
              <linearGradient id="metalChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#cbd5e1" />
                <stop offset="60%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="metalDark" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>
              <linearGradient id="accentCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>

            {/* Brutalist geometric "U" / Architectural Metallic Monogram */}
            <path
              d="M20 20 L36 20 L36 55 Q36 68 50 68 Q64 68 64 55 L64 20 L80 20 L80 55 Q80 84 50 84 Q20 84 20 55 Z"
              fill="url(#metalChrome)"
            />
            {/* Inner bevel contour */}
            <path
              d="M36 20 L39 23 L39 55 Q39 65 50 65 Q61 65 61 55 L61 23 L64 20 L64 55 Q64 68 50 68 Q36 68 36 55 Z"
              fill="url(#metalDark)"
              opacity="0.85"
            />
            {/* Top rim polished chrome highlights */}
            <rect x="20" y="20" width="16" height="2.5" fill="#ffffff" opacity="0.95" />
            <rect x="64" y="20" width="16" height="2.5" fill="#ffffff" opacity="0.95" />
            {/* Left pillar vertical specular reflection */}
            <line x1="28" y1="24" x2="28" y2="55" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            {/* Right pillar secondary reflection */}
            <line x1="72" y1="24" x2="72" y2="55" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            {/* Bottom curvature center bevel reflection */}
            <path
              d="M32 72 Q50 82 68 72 Q50 80 32 72 Z"
              fill="#ffffff"
              opacity="0.6"
            />
            {/* Structural top rivets & datum line */}
            <circle cx="28" cy="13" r="2.5" fill="#94a3b8" />
            <circle cx="72" cy="13" r="2.5" fill="#94a3b8" />
            <line x1="34" y1="13" x2="66" y2="13" stroke="#475569" strokeWidth="1.5" strokeDasharray="2 3" />
            {/* Titanium cyan datum micro-tick */}
            <rect x="48.5" y="80" width="3" height="4.5" fill="#38bdf8" rx="0.5" opacity="0.9" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-lg sm:text-xl tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] via-[#e2e8f0] to-[#94a3b8] uppercase">
              U S H I M A.
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.2em] text-[#6b7280] uppercase -mt-0.5">
            METALLIC ARCHIVE // TOKYO-MOSCOW
          </span>
        </div>
      )}
    </div>
  );
};
