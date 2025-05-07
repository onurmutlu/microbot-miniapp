import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  return (
    <motion.div
      className={`
        bg-white/10 backdrop-blur-md border-white/30 border 
        shadow-lg rounded-xl overflow-hidden
        transition-all duration-500 hover:shadow-glow-light hover:scale-[1.02]
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1.0], // cubic-bezier
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard; 