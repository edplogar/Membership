import React from 'react';

interface LombokGardenLogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const LombokGardenLogo: React.FC<LombokGardenLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showText = true,
}) => {
  // Exact Brand Color of Lombok Garden Hotel
  const brandGreen = '#00A651';

  // Dimension scaling
  const dimensions = {
    sm: { icon: 32, textMain: 'text-sm', textSub: 'text-[9px]' },
    md: { icon: 44, textMain: 'text-base', textSub: 'text-[10px]' },
    lg: { icon: 64, textMain: 'text-xl', textSub: 'text-xs' },
    xl: { icon: 96, textMain: 'text-2xl', textSub: 'text-sm' },
  }[size];

  // The 5-Petal Flower Emblem with white radiating stamen & central core (Exact official shape & color)
  const FlowerEmblem = ({ sizePx }: { sizePx: number }) => (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 400 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <g fill={brandGreen}>
        {/* Top Petal */}
        <path d="M 195 155 C 180 85 220 30 275 45 C 325 60 335 120 295 170 C 265 205 220 185 195 155 Z" />
        {/* Top-Left Petal */}
        <path d="M 185 165 C 145 115 95 105 60 160 C 35 195 70 235 130 235 C 160 235 180 205 185 165 Z" />
        {/* Right Petal */}
        <path d="M 215 170 C 275 140 350 145 370 200 C 385 245 335 285 275 270 C 235 260 210 210 215 170 Z" />
        {/* Bottom-Right Petal */}
        <path d="M 205 195 C 245 245 250 305 210 335 C 170 360 130 330 145 280 C 155 250 180 220 205 195 Z" />
        {/* Bottom-Left Petal */}
        <path d="M 180 190 C 135 220 115 280 155 315 C 185 340 225 310 215 255 C 210 225 195 205 180 190 Z" />

        {/* Natural Petal Silhouettes */}
        <path d="M 200 60 C 240 40 280 50 295 90 C 310 130 275 165 245 175 C 220 185 190 165 185 135 C 180 105 190 70 200 60 Z" />
        <path d="M 80 150 C 65 175 75 215 110 230 C 150 245 185 225 190 190 C 195 155 165 130 130 130 C 105 130 90 140 80 150 Z" />
        <path d="M 275 150 C 320 155 355 190 350 225 C 345 260 310 280 270 260 C 240 245 235 205 250 175 C 255 160 265 150 275 150 Z" />
        <path d="M 220 230 C 255 255 250 300 220 320 C 190 340 155 320 160 285 C 165 255 190 235 220 230 Z" />

        {/* Center White Radiating Stamen */}
        <path
          fill="#FFFFFF"
          d="M 205 180 L 210 135 L 218 175 L 245 150 L 232 185 L 268 180 L 238 198 L 265 220 L 230 215 L 238 250 L 212 225 L 195 255 L 198 220 L 170 235 L 190 208 L 160 195 L 195 190 L 178 160 L 202 178 Z"
        />

        {/* Central Core Circle */}
        <circle cx="210" cy="202" r="16" fill={brandGreen} />
      </g>
    </svg>
  );

  if (variant === 'icon' || !showText) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <FlowerEmblem sizePx={dimensions.icon} />
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <FlowerEmblem sizePx={dimensions.icon * 1.5} />
        <div className="mt-3">
          <div
            className={`font-black tracking-tight leading-none text-[#00A651] ${dimensions.textMain}`}
            style={{ fontFamily: "'Montserrat', 'Poppins', sans-serif", letterSpacing: '0.04em' }}
          >
            LOMBOK GARDEN
          </div>
          <div
            className={`font-bold text-[#00A651] tracking-[0.45em] uppercase mt-1 leading-none ${dimensions.textSub}`}
            style={{ fontFamily: "'Montserrat', 'Poppins', sans-serif" }}
          >
            HOTEL
          </div>
        </div>
      </div>
    );
  }

  // Default: Horizontal layout
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <FlowerEmblem sizePx={dimensions.icon} />
      <div className="flex flex-col text-left">
        <span
          className={`font-black text-[#00A651] tracking-tight leading-tight ${dimensions.textMain}`}
          style={{ fontFamily: "'Montserrat', 'Poppins', sans-serif", letterSpacing: '0.02em' }}
        >
          LOMBOK GARDEN
        </span>
        <span
          className={`font-bold text-[#00A651] tracking-[0.42em] uppercase leading-none mt-0.5 ${dimensions.textSub}`}
          style={{ fontFamily: "'Montserrat', 'Poppins', sans-serif" }}
        >
          HOTEL
        </span>
      </div>
    </div>
  );
};
