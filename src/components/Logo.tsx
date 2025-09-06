import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ collapsed = false, className = '', size = 'medium' }) => {
  if (collapsed) {
    return (
      <div className={`w-9 h-9 rounded-full bg-[#B8956A] flex items-center justify-center ${className}`}>
        <img 
          src="/fav-icon-1.png" 
          alt="Hichhki" 
          className="w-6 h-6 object-contain brightness-0 invert"
        />
      </div>
    );
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'flex items-center gap-1',
          icon: 'w-5 h-5',
          text: 'text-sm font-bold',
          subtitle: 'text-[9px]'
        };
      case 'large':
        return {
          container: 'flex items-center gap-3',
          icon: 'w-8 h-8',
          text: 'text-2xl font-bold',
          subtitle: 'text-sm'
        };
      default: // medium
        return {
          container: 'flex items-center gap-2',
          icon: 'w-6 h-6',
          text: 'text-xl font-bold',
          subtitle: 'text-[11px]'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center justify-center">
        <img 
          src="/Hichhki-logo.png" 
          alt="Hichhki" 
          className={`${size === 'small' ? 'h-8' : size === 'large' ? 'h-12' : 'h-10'} object-contain brightness-0 invert`}
        />
      </div>
      <span className={`${sizeClasses.subtitle} text-[#f7f5ef] font-normal italic mt-1 tracking-wide whitespace-nowrap`}>
        Admin Dashboard
      </span>
    </div>
  );
};
