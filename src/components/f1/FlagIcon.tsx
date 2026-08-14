import React from "react";

type FlagIconProps = {
  country: string;
  className?: string;
};

export const FlagIcon: React.FC<FlagIconProps> = ({ country, className = "w-5 h-5" }) => {
  const code = country.toUpperCase();

  return (
    <div
      className={`relative inline-block rounded-full overflow-hidden shrink-0 border border-white/40 shadow-sm ${className}`}
      title={code}
    >
      <svg viewBox="0 0 32 32" className="w-full h-full block" aria-hidden="true">
        <defs>
          <clipPath id="circle-clip">
            <circle cx="16" cy="16" r="16" />
          </clipPath>
        </defs>

        <g clipPath="url(#circle-clip)">
          {/* GB / UK */}
          {code === "GB" && (
            <g>
              <rect width="32" height="32" fill="#012169" />
              <path d="M0,0 L32,32 M32,0 L0,32" stroke="#FFFFFF" strokeWidth="5" />
              <path d="M0,0 L32,32 M32,0 L0,32" stroke="#C8102E" strokeWidth="3" />
              <path d="M16,0 V32 M0,16 H32" stroke="#FFFFFF" strokeWidth="8" />
              <path d="M16,0 V32 M0,16 H32" stroke="#C8102E" strokeWidth="4.5" />
            </g>
          )}

          {/* IT - Italy */}
          {code === "IT" && (
            <g>
              <rect x="0" y="0" width="10.67" height="32" fill="#009246" />
              <rect x="10.67" y="0" width="10.67" height="32" fill="#FFFFFF" />
              <rect x="21.34" y="0" width="10.66" height="32" fill="#CE2B37" />
            </g>
          )}

          {/* MC - Monaco */}
          {code === "MC" && (
            <g>
              <rect x="0" y="0" width="32" height="16" fill="#E20909" />
              <rect x="0" y="16" width="32" height="16" fill="#FFFFFF" />
            </g>
          )}

          {/* AU - Australia */}
          {code === "AU" && (
            <g>
              <rect width="32" height="32" fill="#000080" />
              {/* Canton Union Jack */}
              <g transform="scale(0.5)">
                <rect width="32" height="32" fill="#012169" />
                <path d="M0,0 L32,32 M32,0 L0,32" stroke="#FFFFFF" strokeWidth="5" />
                <path d="M0,0 L32,32 M32,0 L0,32" stroke="#C8102E" strokeWidth="3" />
                <path d="M16,0 V32 M0,16 H32" stroke="#FFFFFF" strokeWidth="8" />
                <path d="M16,0 V32 M0,16 H32" stroke="#C8102E" strokeWidth="4.5" />
              </g>
              {/* Stars */}
              <circle cx="8" cy="24" r="2.5" fill="#FFFFFF" />
              <circle cx="22" cy="7" r="1.5" fill="#FFFFFF" />
              <circle cx="26" cy="13" r="1.5" fill="#FFFFFF" />
              <circle cx="24" cy="20" r="1.5" fill="#FFFFFF" />
              <circle cx="20" cy="26" r="1.5" fill="#FFFFFF" />
            </g>
          )}

          {/* NL - Netherlands */}
          {code === "NL" && (
            <g>
              <rect x="0" y="0" width="32" height="10.67" fill="#AE1C28" />
              <rect x="0" y="10.67" width="32" height="10.67" fill="#FFFFFF" />
              <rect x="0" y="21.34" width="32" height="10.66" fill="#21468B" />
            </g>
          )}

          {/* FR - France */}
          {code === "FR" && (
            <g>
              <rect x="0" y="0" width="10.67" height="32" fill="#00209F" />
              <rect x="10.67" y="0" width="10.67" height="32" fill="#FFFFFF" />
              <rect x="21.34" y="0" width="10.66" height="32" fill="#F42A41" />
            </g>
          )}

          {/* NZ - New Zealand */}
          {code === "NZ" && (
            <g>
              <rect width="32" height="32" fill="#00247D" />
              <g transform="scale(0.5)">
                <rect width="32" height="32" fill="#012169" />
                <path d="M0,0 L32,32 M32,0 L0,32" stroke="#FFFFFF" strokeWidth="5" />
                <path d="M0,0 L32,32 M32,0 L0,32" stroke="#C8102E" strokeWidth="3" />
                <path d="M16,0 V32 M0,16 H32" stroke="#FFFFFF" strokeWidth="8" />
                <path d="M16,0 V32 M0,16 H32" stroke="#C8102E" strokeWidth="4.5" />
              </g>
              {/* Red stars */}
              <circle cx="23" cy="8" r="1.8" fill="#FFFFFF" />
              <circle cx="23" cy="8" r="1.2" fill="#CC142B" />
              <circle cx="26" cy="14" r="1.8" fill="#FFFFFF" />
              <circle cx="26" cy="14" r="1.2" fill="#CC142B" />
              <circle cx="24" cy="22" r="1.8" fill="#FFFFFF" />
              <circle cx="24" cy="22" r="1.2" fill="#CC142B" />
            </g>
          )}

          {/* AR - Argentina */}
          {code === "AR" && (
            <g>
              <rect x="0" y="0" width="32" height="10.67" fill="#74ACDF" />
              <rect x="0" y="10.67" width="32" height="10.67" fill="#FFFFFF" />
              <rect x="0" y="21.34" width="32" height="10.66" fill="#74ACDF" />
              <circle cx="16" cy="16" r="3.2" fill="#F6B40E" />
            </g>
          )}

          {/* DE - Germany */}
          {code === "DE" && (
            <g>
              <rect x="0" y="0" width="32" height="10.67" fill="#000000" />
              <rect x="0" y="10.67" width="32" height="10.67" fill="#DD0000" />
              <rect x="0" y="21.34" width="32" height="10.66" fill="#FFCE00" />
            </g>
          )}

          {/* BR - Brazil */}
          {code === "BR" && (
            <g>
              <rect width="32" height="32" fill="#009C3B" />
              <polygon points="16,4 28,16 16,28 4,16" fill="#FFDF00" />
              <circle cx="16" cy="16" r="6" fill="#002776" />
              <path d="M10,16 Q16,13 22,16" stroke="#FFFFFF" strokeWidth="1" fill="none" />
            </g>
          )}

          {/* ES - Spain */}
          {code === "ES" && (
            <g>
              <rect x="0" y="0" width="32" height="8" fill="#AA1529" />
              <rect x="0" y="8" width="32" height="16" fill="#F1BF00" />
              <rect x="0" y="24" width="32" height="8" fill="#AA1529" />
            </g>
          )}

          {/* TH - Thailand */}
          {code === "TH" && (
            <g>
              <rect x="0" y="0" width="32" height="5.33" fill="#A71930" />
              <rect x="0" y="5.33" width="32" height="5.33" fill="#FFFFFF" />
              <rect x="0" y="10.66" width="32" height="10.68" fill="#1B254B" />
              <rect x="0" y="21.34" width="32" height="5.33" fill="#FFFFFF" />
              <rect x="0" y="26.67" width="32" height="5.33" fill="#A71930" />
            </g>
          )}

          {/* CA - Canada */}
          {code === "CA" && (
            <g>
              <rect x="0" y="0" width="8" height="32" fill="#FF0000" />
              <rect x="8" y="0" width="16" height="32" fill="#FFFFFF" />
              <rect x="24" y="0" width="8" height="32" fill="#FF0000" />
              {/* Simplified Maple Leaf */}
              <path d="M16,10 L18,14 L20,13 L19,16 L22,17 L18,20 L16,19 L14,20 L10,17 L13,16 L12,13 L14,14 Z" fill="#FF0000" />
            </g>
          )}

          {/* MX - Mexico */}
          {code === "MX" && (
            <g>
              <rect x="0" y="0" width="10.67" height="32" fill="#006847" />
              <rect x="10.67" y="0" width="10.67" height="32" fill="#FFFFFF" />
              <rect x="21.34" y="0" width="10.66" height="32" fill="#CE1126" />
              <circle cx="16" cy="16" r="2.5" fill="#8B5A2B" />
            </g>
          )}

          {/* FI - Finland */}
          {code === "FI" && (
            <g>
              <rect width="32" height="32" fill="#FFFFFF" />
              <rect x="9" y="0" width="6" height="32" fill="#003580" />
              <rect x="0" y="13" width="32" height="6" fill="#003580" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
