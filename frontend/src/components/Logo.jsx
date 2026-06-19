import React from 'react';

const Logo = ({ size = 28, showText = true, textClass = '' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      <svg 
        viewBox="0 0 100 100" 
        width={size} 
        height={size} 
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="onlymans-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00B4D8" stopOpacity="1" />
            <stop offset="100%" stopColor="#901FEB" stopOpacity="1" />
          </linearGradient>
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Sleek circle frame backdrop */}
        <circle cx="50" cy="50" r="46" fill="rgba(255, 255, 255, 0.02)" stroke="url(#onlymans-logo-grad)" strokeWidth="3" opacity="0.4" />
        
        {/* stylized gradient letter "M" with a glow */}
        <path 
          d="M24,72 L24,36 L44,58 L50,49 L56,58 L76,36 L76,72" 
          fill="none" 
          stroke="url(#onlymans-logo-grad)" 
          strokeWidth="11" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#logo-glow)"
        />
        
        {/* Glowing crown dot above the center M */}
        <circle cx="50" cy="24" r="7.5" fill="#00B4D8" filter="url(#logo-glow)" />
      </svg>
      {showText && (
        <span className={textClass} style={textClass ? {} : { color: 'var(--text-primary)', fontWeight: 800 }}>
          OnlyMans
        </span>
      )}
    </div>
  );
};

export default Logo;
