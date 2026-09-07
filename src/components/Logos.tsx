import React from 'react';

export function SDALogo({ className = 'w-12 h-12', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SDA Logo"
    >
      {/* Flame & Cross Stylized SDA Emblem */}
      <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3" />
      
      {/* Open Bible at the base */}
      <path
        d="M20 70C35 65 45 72 50 75C55 72 65 65 80 70V80C65 75 55 82 50 85C45 82 35 75 20 80V70Z"
        fill={color}
        opacity="0.95"
      />
      <line x1="50" y1="75" x2="50" y2="85" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
      
      {/* Golden Cross rising from Bible */}
      <path
        d="M48 30H52V73H48V30ZM42 42H58V46H42V42Z"
        fill={color}
      />
      
      {/* Triple Flames representing the Three Angels' Message & Holy Spirit */}
      <path
        d="M32 45C28 35 34 22 45 18C41 24 44 32 46 36C48 32 53 25 51 16C58 20 66 28 64 42C62 36 57 32 54 36C52 40 56 46 54 52C52 46 48 42 45 44C41 46 42 52 38 56C36 50 34 47 32 45Z"
        fill={color}
        opacity="0.85"
      />
    </svg>
  );
}

export function SabbathSchoolLogo({ className = 'w-12 h-12', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sabbath School Logo"
    >
      {/* Outer circular badge representation of Sabbath School seal */}
      <circle cx="60" cy="60" r="54" stroke={color} strokeWidth="2" opacity="0.9" />
      <circle cx="60" cy="60" r="48" stroke={color} strokeWidth="0.8" strokeDasharray="4 2" opacity="0.5" />
      
      {/* Globe longitude/latitude grid lines in background */}
      <path d="M60 12V108" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <path d="M12 60H108" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <path d="M20 35C40 45 80 45 100 35" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <path d="M20 85C40 75 80 75 100 85" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <path d="M35 20C45 40 45 80 35 100" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <path d="M85 20C75 40 75 80 85 100" stroke={color} strokeWidth="0.5" opacity="0.2" />

      {/* Styled Open Holy Book in center */}
      <path
        d="M28 65C44 59 55 68 60 72C65 68 76 59 92 65V88C76 82 65 91 60 95C55 91 44 82 28 88V65Z"
        fill={color}
        opacity="0.9"
      />
      <path d="M60 72V95" stroke="#fff" strokeWidth="1.2" opacity="0.5" />

      {/* The Hourglass Flame of Study */}
      <path
        d="M60 18C61.3 18 64.9 22.9 64.9 27.5C64.9 31.8 62.1 33.7 60 35.8C57.9 33.7 55.1 31.8 55.1 27.5C55.1 22.9 58.7 18 60 18Z"
        fill={color}
      />
      
      {/* Redemptive Holy Cross rising on the right side over the Bible */}
      <path
        d="M59 34H61V68H59V34ZM56 42H64V44H56V42Z"
        fill={color}
        opacity="0.9"
      />

      {/* Radiant Light Beams */}
      <path d="M60 16L60 3" stroke={color} strokeWidth="1.5" />
      <path d="M72 20L82 12" stroke={color} strokeWidth="1" />
      <path d="M48 20L38 12" stroke={color} strokeWidth="1" />
      <path d="M79 30L90 26" stroke={color} strokeWidth="1" />
      <path d="M41 30L30 26" stroke={color} strokeWidth="1" />
    </svg>
  );
}
