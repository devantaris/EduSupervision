import React from "react";

interface InstitutionSealProps {
  initials?: string;
  size?: number;
  className?: string;
}

export default function InstitutionSeal({ initials = "OA", size = 56, className }: InstitutionSealProps) {
  return (
    <div className={`shrink-0 ${className || ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_4px_12px_rgba(197,163,103,0.25)]">
        <circle cx="32" cy="32" r="30" fill="none" stroke="#c5a367" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="25" fill="none" stroke="#c5a367" strokeWidth="0.75" strokeDasharray="2 3" />
        <path
          d="M32 13 L46 19 V33 C46 43 39.5 49.5 32 52 C24.5 49.5 18 43 18 33 V19 Z"
          fill="#7f1d1d"
          stroke="#dfc397"
          strokeWidth="1.4"
        />
        <path
          d="M32 17 L42.5 21.6 V33 C42.5 40.6 37.5 45.8 32 48 C26.5 45.8 21.5 40.6 21.5 33 V21.6 Z"
          fill="none"
          stroke="#dfc397"
          strokeWidth="0.6"
          opacity="0.6"
        />
        <text
          x="32"
          y="37.5"
          textAnchor="middle"
          fontFamily="Cinzel, serif"
          fontWeight="700"
          fontSize="14"
          fill="#dfc397"
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}
