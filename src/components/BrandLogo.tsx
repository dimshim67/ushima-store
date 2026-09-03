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

            {/* Brutalist geometric "У" / Architectural chevron */}
            <path
              d="M18 20 L38 20 L50 48 L62 20 L82 20 L58 64 L58 84 L42 84 L42 64 Z"
              fill="url(#metalChrome)"
            />
            {/* Beveled spine facet */}
            <path
              d="M50 48 L62 20 L58 20 L50 42 L42 20 L38 20 L50 48 Z"
              fill="url(#metalDark)"
              opacity="0.8"
            />
            {/* Lower vertical stem highlight */}
            <rect
              x="48"
              y="64"
              width="4"
              height="20"
              fill="#ffffff"
              opacity="0.8"
            />
            {/* Structural top rivets & datum line */}
            <circle cx="28" cy="14" r="2.5" fill="#94a3b8" />
            <circle cx="72" cy="14" r="2.5" fill="#94a3b8" />
            <line x1="34" y1="14" x2="66" y2="14" stroke="#475569" strokeWidth="1.5" strokeDasharray="2 3" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-xl sm:text-2xl tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] via-[#e2e8f0] to-[#94a3b8] uppercase">
              ушима
            </span>
            <span className="text-[9px] font-mono font-semibold tracking-[0.25em] text-[#64748b] uppercase hidden xs:inline">
              USHIMA
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
