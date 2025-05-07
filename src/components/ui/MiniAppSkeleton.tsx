import React from 'react';

interface MiniAppSkeletonProps {
  variant?: 'text' | 'rectangle' | 'circle' | 'card' | 'button' | 'avatar' | 'list';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  animated?: boolean;
  rounded?: boolean;
}

const MiniAppSkeleton: React.FC<MiniAppSkeletonProps> = ({
  variant = 'rectangle',
  width,
  height,
  count = 1,
  className = '',
  animated = true,
  rounded = true,
}) => {
  // Temel shimmer animasyonu sınıfı
  const shimmerClass = animated ? 'animate-pulse-gradient relative overflow-hidden after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:animate-shimmer' : '';
  
  // Varyanta göre boyut ve şekil sınıfları
  const variantStyles = {
    text: `h-4 ${width ? '' : 'w-full'} rounded-md`,
    rectangle: `${width ? '' : 'w-full'} ${height ? '' : 'h-24'} rounded-xl`,
    circle: `rounded-full ${width ? '' : 'w-12'} ${height ? '' : 'h-12'}`,
    card: `rounded-xl ${width ? '' : 'w-full'} ${height ? '' : 'h-40'}`,
    button: `rounded-xl ${width ? '' : 'w-32'} ${height ? '' : 'h-12'}`,
    avatar: `rounded-full ${width ? '' : 'w-10'} ${height ? '' : 'h-10'}`,
    list: `flex flex-col gap-3 ${width ? '' : 'w-full'}`,
  };
  
  // Genişlik ve yükseklik stilleri
  const sizeStyle = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };
  
  // Temel iskelet stili
  const baseSkeletonClass = `
    ${variantStyles[variant]} 
    ${shimmerClass} 
    bg-gray-200 
    dark:bg-gray-700
    ${rounded ? 'rounded-xl' : ''}
  `;
  
  // Tüm CSS sınıflarını birleştir
  const skeletonClasses = `${baseSkeletonClass} ${className}`.trim();
  
  // Liste varyantı için
  if (variant === 'list') {
    return (
      <div className={`${width ? '' : 'w-full'} ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div 
              className={`${shimmerClass} rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0`}
              style={{ width: '40px', height: '40px' }}
            />
            
            {/* İçerik */}
            <div className="flex-1 flex flex-col gap-2">
              {/* Başlık */}
              <div 
                className={`${shimmerClass} h-4 bg-gray-200 dark:bg-gray-700 rounded-md`}
                style={{ width: '70%' }}
              />
              
              {/* İçerik satırları */}
              <div 
                className={`${shimmerClass} h-3 bg-gray-200 dark:bg-gray-700 rounded-md`}
                style={{ width: '90%' }}
              />
              <div 
                className={`${shimmerClass} h-3 bg-gray-200 dark:bg-gray-700 rounded-md`}
                style={{ width: '60%' }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Çoklu eleman için
  if (count > 1) {
    return (
      <div className={`flex flex-col gap-2 ${width ? '' : 'w-full'} ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={skeletonClasses}
            style={sizeStyle}
          />
        ))}
      </div>
    );
  }
  
  // Tekli eleman
  return (
    <div
      className={skeletonClasses}
      style={sizeStyle}
    />
  );
};

// UnoCSS keyframes ve animasyon tanımlamaları için CSS
const MiniAppSkeletonStyle = () => (
  <style jsx global>{`
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
    
    @keyframes pulse-gradient {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
    
    .animate-pulse-gradient {
      animation: pulse-gradient 1.5s ease-in-out 0.5s infinite;
    }
  `}</style>
);

export default MiniAppSkeleton; 