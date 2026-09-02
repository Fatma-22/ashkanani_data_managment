import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'antd';
import { Sport } from '../types';
import { normalizePosition, hasVisualPitch } from '../utils/positions';

interface PositionPoint {
  x: number; // percentage from left
  y: number; // percentage from top
}

// Mapping of position codes to pitch coordinates (0-100)
const POSITION_MAPS: Record<string, PositionPoint> = {
  // Football
  'GK': { x: 50, y: 88 },
  'CB': { x: 50, y: 72 },
  'LCB': { x: 35, y: 72 },
  'RCB': { x: 65, y: 72 },
  'LB': { x: 15, y: 68 },
  'RB': { x: 85, y: 68 },
  'LWB': { x: 12, y: 55 },
  'RWB': { x: 88, y: 55 },
  'CDM': { x: 50, y: 58 },
  'LDM': { x: 40, y: 58 },
  'RDM': { x: 60, y: 58 },
  'CM': { x: 50, y: 48 },
  'LCM': { x: 35, y: 48 },
  'RCM': { x: 65, y: 48 },
  'LM': { x: 15, y: 45 },
  'RM': { x: 85, y: 45 },
  'CAM': { x: 50, y: 35 },
  'LCAM': { x: 35, y: 35 },
  'RCAM': { x: 65, y: 35 },
  'LW': { x: 15, y: 25 },
  'RW': { x: 85, y: 25 },
  'CF': { x: 50, y: 20 },
  'SS': { x: 50, y: 22 },
  'ST': { x: 50, y: 12 },
  'LS': { x: 40, y: 12 },
  'RS': { x: 60, y: 12 },

  // Padel
  'Back-Left': { x: 30, y: 70 },
  'Back-Right': { x: 70, y: 70 },
  'Net-Left': { x: 30, y: 30 },
  'Net-Right': { x: 70, y: 30 },
  'Left': { x: 30, y: 50 },
  'Right': { x: 70, y: 50 },
  
  // Basketball
  'PG': { x: 50, y: 72 }, // Top of the arc (Playmaker)
  'SG': { x: 80, y: 78 }, // Wing right
  'SF': { x: 20, y: 78 }, // Wing left
  'PF': { x: 35, y: 88 }, // Power Forward (Near key)
  'C': { x: 50, y: 92 },  // Center (Under hoop)

  // Volleyball
  // Court viewed top-down: net at y=150, our team is bottom half (y 150-290)
  // Positions (rotation 1): S=pos1(back right), OH=pos4(front left), OPP=pos2(front right), MB=pos3(front center), L=pos6(back left)
  'S':   { x: 80, y: 73 },   // Position 1 - back right
  'OH':  { x: 82, y: 43 },   // Position 2 - front right (above net)
  'OPP': { x: 18, y: 43 },   // Position 4 - front left (above net)
  'MB':  { x: 50, y: 43 },   // Position 3 - front center (above net)
  'L':   { x: 18, y: 73 },   // Position 6 - back left (libero)

  // Handball
  'P': { x: 50, y: 25 },

  // Futsal
  'FIXO': { x: 50, y: 65 },
  'ALA': { x: 20, y: 45 }, // Will use same point for both wings for simplicity or add ALA-L/R
  'PIVOT': { x: 50, y: 25 },

  // Water Polo
  'FLATS': { x: 30, y: 45 },
  'WINGS': { x: 15, y: 30 },
};

interface PitchDisplayProps {
  sport: Sport;
  positions: string[];
  width?: number | string;
}

const PitchDisplay: React.FC<PitchDisplayProps> = ({ sport, positions, width = 300 }) => {
  const { t } = useTranslation();

  if (!hasVisualPitch(sport)) {
    return null;
  }

  const renderFootballPitch = () => (
    <svg viewBox="0 0 200 300" className="w-full h-full">
      {/* Pitch Outer */}
      <rect x="0" y="0" width="200" height="300" fill="#2d5a27" rx="4" />
      <rect x="5" y="5" width="190" height="290" fill="none" stroke="white" strokeWidth="2" />
      
      {/* Center Line */}
      <line x1="5" y1="150" x2="195" y2="150" stroke="white" strokeWidth="2" />
      <circle cx="100" cy="150" r="30" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="100" cy="150" r="2" fill="white" />

      {/* Penalty Areas */}
      {/* Top */}
      <rect x="40" y="5" width="120" height="50" fill="none" stroke="white" strokeWidth="2" />
      <rect x="70" y="5" width="60" height="15" fill="none" stroke="white" strokeWidth="2" />
      <path d="M 75 55 A 40 40 0 0 0 125 55" fill="none" stroke="white" strokeWidth="2" />
      
      {/* Bottom */}
      <rect x="40" y="245" width="120" height="50" fill="none" stroke="white" strokeWidth="2" />
      <rect x="70" y="280" width="60" height="15" fill="none" stroke="white" strokeWidth="2" />
      <path d="M 75 245 A 40 40 0 0 1 125 245" fill="none" stroke="white" strokeWidth="2" />

      {/* Corners */}
      <path d="M 5 15 A 10 10 0 0 0 15 5" fill="none" stroke="white" strokeWidth="1" />
      <path d="M 185 5 A 10 10 0 0 0 195 15" fill="none" stroke="white" strokeWidth="1" />
      <path d="M 195 285 A 10 10 0 0 0 185 295" fill="none" stroke="white" strokeWidth="1" />
      <path d="M 15 295 A 10 10 0 0 0 5 285" fill="none" stroke="white" strokeWidth="1" />
    </svg>
  );

  const renderPadelPitch = () => (
    <svg viewBox="0 0 200 300" className="w-full h-full">
      <rect x="0" y="0" width="200" height="300" fill="#2a6ca6" rx="4" />
      <rect x="5" y="5" width="190" height="290" fill="none" stroke="white" strokeWidth="2" />
      
      {/* Net Area */}
      <rect x="5" y="148" width="190" height="4" fill="white" opacity="0.6" />
      
      {/* Service Lines */}
      <line x1="5" y1="100" x2="195" y2="100" stroke="white" strokeWidth="2" />
      <line x1="5" y1="200" x2="195" y2="200" stroke="white" strokeWidth="2" />
      <line x1="100" y1="100" x2="100" y2="200" stroke="white" strokeWidth="2" />
    </svg>
  );

  const renderBasketballCourt = () => (
    <svg viewBox="0 0 200 300" className="w-full h-full">
      {/* Court Base */}
      <rect x="0" y="0" width="200" height="300" fill="#e38e4a" rx="4" />
      <rect x="5" y="5" width="190" height="290" fill="none" stroke="white" strokeWidth="2" />
      
      {/* Center Line and Circle */}
      <line x1="5" y1="150" x2="195" y2="150" stroke="white" strokeWidth="2" />
      <circle cx="100" cy="150" r="30" fill="none" stroke="white" strokeWidth="2" />
      
      {/* Basket Areas (Top and Bottom) */}
      {/* Bottom Side (Main display side) */}
      <path d="M 40 295 A 60 60 0 0 0 160 295" fill="none" stroke="white" strokeWidth="2" /> {/* 3pt line */}
      <rect x="75" y="245" width="50" height="50" fill="none" stroke="white" strokeWidth="2" /> {/* Key */}
      <circle cx="100" cy="275" r="5" fill="none" stroke="white" strokeWidth="2" /> {/* Basket */}
      
      {/* Top Side */}
      <path d="M 40 5 A 60 60 0 0 1 160 5" fill="none" stroke="white" strokeWidth="2" />
      <rect x="75" y="5" width="50" height="50" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="100" cy="25" r="5" fill="none" stroke="white" strokeWidth="2" />
    </svg>
  );

  const renderTennisCourt = () => (
    <svg viewBox="0 0 200 300" className="w-full h-full">
      <rect x="0" y="0" width="200" height="300" fill="#4c8c5c" rx="4" />
      <rect x="20" y="20" width="160" height="260" fill="none" stroke="white" strokeWidth="2" />
      
      {/* Service Boxes */}
      <line x1="20" y1="150" x2="180" y2="150" stroke="white" strokeWidth="3" /> {/* Net */}
      <line x1="20" y1="100" x2="180" y2="100" stroke="white" strokeWidth="2" />
      <line x1="20" y1="200" x2="180" y2="200" stroke="white" strokeWidth="2" />
      <line x1="100" y1="100" x2="100" y2="200" stroke="white" strokeWidth="2" />
      
      {/* Doubles Sidelines */}
      <line x1="35" y1="20" x2="35" y2="280" stroke="white" strokeWidth="1" opacity="0.6" />
      <line x1="165" y1="20" x2="165" y2="280" stroke="white" strokeWidth="1" opacity="0.6" />
    </svg>
  );

  const renderVolleyballCourt = () => (
    <svg viewBox="0 0 200 300" className="w-full h-full">
      <rect x="0" y="0" width="200" height="300" fill="#f1c40f" rx="4" opacity="0.9" />
      <rect x="10" y="10" width="180" height="280" fill="none" stroke="white" strokeWidth="2" />
      
      {/* Net & Attack Lines */}
      <line x1="10" y1="150" x2="190" y2="150" stroke="white" strokeWidth="4" /> {/* Net */}
      <line x1="10" y1="110" x2="190" y2="110" stroke="white" strokeWidth="2" opacity="0.7" />
      <line x1="10" y1="190" x2="190" y2="190" stroke="white" strokeWidth="2" opacity="0.7" />
    </svg>
  );

  const renderGenericPitch = () => (
    <div className="w-full h-full bg-charcoal-black/20 rounded-lg flex items-center justify-center border border-white/5">
       <span className="text-white/10 uppercase tracking-widest font-black rotate-[-45deg] text-3xl">
          {sport}
       </span>
    </div>
  );

  const getPitch = () => {
    switch (sport?.toLowerCase()) {
      case 'football': 
      case 'soccer': return renderFootballPitch();
      case 'basketball': return renderBasketballCourt();
      case 'tennis': return renderTennisCourt();
      case 'volleyball': return renderVolleyballCourt();
      case 'padel': return renderPadelPitch();
      case 'handball': return renderFootballPitch(); // Similar layout
      default: return renderGenericPitch();
    }
  };

  return (
    <div 
      style={{ maxWidth: width, margin: '0 auto' }}
      className="relative w-full aspect-[4/5] overflow-hidden rounded-xl"
    >
      {getPitch()}
      
      {/* Overlay Positions */}
      {positions.map((pos, index) => {
        const normalized = normalizePosition(pos);
        const coords = POSITION_MAPS[normalized] || POSITION_MAPS[normalized.toUpperCase()];
        if (!coords) return null;

        const isPrimary = index === 0;
        const size = isPrimary ? 24 : 16;
        
        return (
          <Tooltip title={t(`enums.Position.${pos}`, { defaultValue: pos })} key={index}>
            <div 
              style={{
                position: 'absolute',
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: 'translate(-50%, -50%)',
                width: size,
                height: size,
                borderRadius: '50%',
                background: isPrimary ? 'radial-gradient(circle at 30% 30%, #fff, #C9A24D)' : 'radial-gradient(circle at 30% 30%, #eee, #888)',
                boxShadow: isPrimary ? '0 0 15px #C9A24D, 0 4px 8px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.5)',
                border: '1px solid rgba(0,0,0,0.1)',
                zIndex: isPrimary ? 10 : 5,
                transition: 'all 0.3s ease',
              }}
              className={`position-ball ${isPrimary ? 'animate-pulse' : ''}`}
            />
          </Tooltip>
        );
      })}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default PitchDisplay;
