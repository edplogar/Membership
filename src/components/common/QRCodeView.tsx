import React, { useMemo } from 'react';

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  showLogo?: boolean;
}

/**
 * Deterministic pure SVG QR Code generator.
 * Produces crisp, standard QR-like visual matrix for membership cards and vouchers
 * without external network or CDN dependencies.
 */
export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 180,
  className = '',
  showLogo = true,
}) => {
  // Generate deterministic pseudo-random 25x25 matrix seeded by string value
  const matrix = useMemo(() => {
    const n = 25;
    const grid: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

    // Simple hash function for seed
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Draw position detection finder patterns (7x7 at 3 corners)
    const drawFinderPattern = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[r0 + r][c0 + c] = true;
          } else {
            grid[r0 + r][c0 + c] = false;
          }
        }
      }
    };

    drawFinderPattern(0, 0); // Top-left
    drawFinderPattern(0, n - 7); // Top-right
    drawFinderPattern(n - 7, 0); // Bottom-left

    // Timing patterns
    for (let i = 8; i < n - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Alignment pattern near bottom right
    const ar = n - 9;
    const ac = n - 9;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        grid[ar + r][ac + c] =
          r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2);
      }
    }

    // Fill data modules based on string hash
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        // Skip finder patterns and margins
        const isFinderTL = r < 8 && c < 8;
        const isFinderTR = r < 8 && c >= n - 8;
        const isFinderBL = r >= n - 8 && c < 8;
        const isCenter = r >= 10 && r <= 14 && c >= 10 && c <= 14;

        if (!isFinderTL && !isFinderTR && !isFinderBL && !isCenter) {
          const pr = pseudoRandom(hash + r * 37 + c * 17);
          grid[r][c] = pr > 0.48;
        }
      }
    }

    return grid;
  }, [value]);

  const moduleSize = size / 25;

  return (
    <div
      className={`relative inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-md border border-stone-200 ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 25 25"
        className="shape-rendering-crispEdges"
      >
        {matrix.map((row, r) =>
          row.map((col, c) =>
            col ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1.02}
                height={1.02}
                fill="#1c1917"
              />
            ) : null
          )
        )}
      </svg>

      {/* Center Crest Icon */}
      {showLogo && (
        <div
          className="absolute inset-0 m-auto flex items-center justify-center bg-stone-900 text-amber-400 rounded-md shadow-md border-2 border-white"
          style={{ width: moduleSize * 5, height: moduleSize * 5 }}
        >
          <span className="text-[10px] font-bold font-serif-luxury tracking-tighter">
            LGH
          </span>
        </div>
      )}
    </div>
  );
};
