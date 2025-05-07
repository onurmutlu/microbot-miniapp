import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "../../utils/cn";

export interface SkeletonProps {
  height?: string | number;
  width?: string | number;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'text' | 'circular' | 'rectangular' | 'button' | 'card';
  animate?: boolean;
  children?: React.ReactNode;
}

const Skeleton: React.FC<SkeletonProps> = ({
  height,
  width,
  className = '',
  rounded = 'md',
  variant = 'rectangular',
  animate = true,
  children,
}) => {
  // Rounded sınıflarını belirle
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  // Variant sınıfları
  const variantClass = {
    text: 'h-4 w-full',
    circular: 'aspect-square rounded-full',
    rectangular: '',
    button: 'h-10 rounded-lg',
    card: 'rounded-xl',
  }[variant];

  // Stil özellikleri
  const style: React.CSSProperties = {
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
  };

  // Shimmer animasyonu için varyantlar
  const shimmerVariants = {
    hidden: { 
      backgroundPosition: '0% 0%'
    },
    visible: { 
      backgroundPosition: ['0% 0%', '100% 0%', '100% 0%'],
      transition: {
        repeat: Infinity,
        duration: 2.5,
      },
    },
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden ${roundedClass} ${variantClass} 
        bg-gray-300/20 dark:bg-gray-700/20
        ${className}
      `}
      style={style}
      initial="hidden"
      animate={animate ? "visible" : "hidden"}
      variants={shimmerVariants}
      // Shimmer gradient efekti
      css={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        backgroundSize: '200% 100%',
      }}
    >
      {children}
    </motion.div>
  );
};

// Çoklu skeleton örneği için yardımcı bileşen
export const SkeletonGroup: React.FC<{
  count: number;
  as?: keyof JSX.IntrinsicElements;
  gap?: string;
  children: (index: number) => React.ReactNode;
}> = ({ count, as: Component = 'div', gap = 'gap-4', children }) => {
  return (
    <Component className={`flex flex-col ${gap}`}>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{children(index)}</React.Fragment>
      ))}
    </Component>
  );
};

// Farklı Skeleton çeşitleri için hazır bileşenler
export const TextSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton {...props} variant="text" />
);

export const CircularSkeleton: React.FC<Omit<SkeletonProps, 'variant' | 'rounded'>> = (props) => (
  <Skeleton {...props} variant="circular" rounded="full" />
);

export const ButtonSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton {...props} variant="button" />
);

export const CardSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton {...props} variant="card" />
);

export default Skeleton; 