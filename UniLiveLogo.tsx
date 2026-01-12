import React from 'react';

interface UniLiveLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const UniLiveLogo: React.FC<UniLiveLogoProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-7 h-7',
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
    xl: 'w-56 h-56'
  };

  // Direct URL to the high-quality 3D Unicorn logo provided
  const logoUrl = "https://i.ibb.co/Xz9H8vC/3d-unicorn.png";

  return (
    <div className={`relative flex items-center justify-center animate-logo-3d ${sizes[size]} ${className}`}>
      {/* 
          The new 3D logo is used directly. 
          Assuming it's a high-quality PNG with transparency.
      */}
      <img 
        src={logoUrl} 
        alt="UniLive 3D Logo" 
        className="w-full h-full object-contain pointer-events-none"
        onError={(e) => {
          // Fallback to stylized emoji if image is still 'not found'
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) parent.innerHTML = '<span class="text-2xl">🦄</span>';
        }}
      />
      
      {/* Dynamic aura glow that pulses with the 'live' animation */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
    </div>
  );
};

export default UniLiveLogo;