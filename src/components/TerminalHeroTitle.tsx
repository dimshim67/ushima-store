import React, { useState, useEffect, useMemo } from 'react';

interface TerminalHeroTitleProps {
  title: string;
  className?: string;
}

export const TerminalHeroTitle: React.FC<TerminalHeroTitleProps> = ({
  title,
  className = '',
}) => {
  // Parse base brand title and whether it features trailing slashes
  const parsed = useMemo(() => {
    const trimmed = (title || 'USHIMA. ///').trim();
    const slashMatch = trimmed.match(/(\s*\/{2,3}\s*)$/);
    if (slashMatch) {
      return {
        base: trimmed.slice(0, slashMatch.index).trimEnd(),
      };
    }
    return {
      base: trimmed,
    };
  }, [title]);

  const [displayedBase, setDisplayedBase] = useState('');
  const [slashCount, setSlashCount] = useState(0); // 0, 1, 2, 3
  const [initialDone, setInitialDone] = useState(false);

  // 1. Initial Typewriter Effect on page load (runs only once)
  useEffect(() => {
    let isCancelled = false;
    const baseText = parsed.base;
    let currBaseIndex = 0;

    // Step 1: Type the base brand text letter by letter
    const typeBaseInterval = setInterval(() => {
      if (isCancelled) return;
      currBaseIndex++;
      setDisplayedBase(baseText.slice(0, currBaseIndex));

      if (currBaseIndex >= baseText.length) {
        clearInterval(typeBaseInterval);

        // Step 2: Short pause, then type the 3 slashes one by one
        setTimeout(() => {
          if (isCancelled) return;
          let currentSlashes = 0;
          const slashInterval = setInterval(() => {
            if (isCancelled) return;
            currentSlashes++;
            setSlashCount(currentSlashes);

            if (currentSlashes >= 3) {
              clearInterval(slashInterval);
              setInitialDone(true);
            }
          }, 150);
        }, 200);
      }
    }, 75);

    return () => {
      isCancelled = true;
      clearInterval(typeBaseInterval);
    };
  }, [parsed.base]);

  // 2. Periodic cycle: 3 slashes disappear and re-type like terminal commands
  useEffect(() => {
    if (!initialDone) return;

    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    const startSlashCycle = () => {
      // Pause for 3.2 seconds while displaying the full "USHIMA. ///"
      timeoutId = setTimeout(() => {
        if (isCancelled) return;

        // Erase slashes one by one (3 -> 2 -> 1 -> 0)
        let current = 3;
        intervalId = setInterval(() => {
          if (isCancelled) return;
          current--;
          setSlashCount(current);

          if (current <= 0) {
            clearInterval(intervalId);

            // Pause for 800ms with no slashes, showing "USHIMA. _"
            timeoutId = setTimeout(() => {
              if (isCancelled) return;

              // Retype slashes one by one (0 -> 1 -> 2 -> 3)
              let retype = 0;
              intervalId = setInterval(() => {
                if (isCancelled) return;
                retype++;
                setSlashCount(retype);

                if (retype >= 3) {
                  clearInterval(intervalId);
                  // Repeat cycle
                  startSlashCycle();
                }
              }, 150);
            }, 800);
          }
        }, 110);
      }, 3200);
    };

    startSlashCycle();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [initialDone]);

  // Render trailing slashes
  const slashesString = slashCount > 0 ? ' ' + '/'.repeat(slashCount) : '';

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-widest uppercase flex items-center flex-wrap min-h-[36px] sm:min-h-[44px]">
        {/* Main Typed Base Text */}
        <span className="text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.2)]">
          {displayedBase}
        </span>

        {/* Dynamic Slashes (///) that periodically disappear and re-type */}
        {slashesString && (
          <span className="text-[#cbd5e1] font-mono tracking-wider ml-1 italic">
            {slashesString}
          </span>
        )}

        {/* Authentic Terminal Underscore Cursor (_) */}
        <span
          className="inline-block text-[#38bdf8] font-mono font-black ml-1 select-none animate-terminal-cursor drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
          style={{ transform: 'translateY(1px)' }}
          aria-hidden="true"
        >
          _
        </span>
      </h1>
    </div>
  );
};
