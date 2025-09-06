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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 7.5C5 6.11929 6.11929 5 7.5 5H12.5C13.8807 5 15 6.11929 15 7.5V12.5C15 13.8807 13.8807 15 12.5 15H7.5C6.11929 15 5 13.8807 5 12.5V7.5Z" fill="white"/>
          <circle cx="10" cy="10" r="1.5" fill="#B8956A"/>
        </svg>
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
      <div className={sizeClasses.container}>
        <svg className={sizeClasses.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#B8956A"/>
          <path d="M6 9C6 7.34315 7.34315 6 9 6H15C16.6569 6 18 7.34315 18 9V15C18 16.6569 16.6569 18 15 18H9C7.34315 18 6 16.6569 6 15V9Z" fill="white"/>
          <circle cx="12" cy="12" r="1.5" fill="#B8956A"/>
        </svg>
        <span className={sizeClasses.text} style={{ color: '#fff', letterSpacing: '0.5px' }}>
          <span style={{ color: '#B8956A' }}>Hichhki</span> <span style={{ color: '#fff' }}>Admin</span>
        </span>
      </div>
      <span className={`${sizeClasses.subtitle} text-[#f7f5ef] font-normal italic mt-1 tracking-wide whitespace-nowrap`}>
        Admin Dashboard
      </span>
    </div>
  );
};
