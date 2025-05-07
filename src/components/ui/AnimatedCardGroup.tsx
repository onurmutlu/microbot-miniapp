import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardGroupProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  containerDelay?: number;
}

const AnimatedCardGroup: React.FC<AnimatedCardGroupProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  containerDelay = 0,
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: containerDelay,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div 
          key={index} 
          variants={item}
          whileHover={{ 
            scale: 1.02, 
            transition: { duration: 0.2 } 
          }}
          className="animated-card"
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AnimatedCardGroup; 