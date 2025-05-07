import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const location = useLocation();

  // Farklı yönlerden gelen geçiş animasyonları
  const variants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          duration: 0.3,
        }}
        className={`page-transition-container ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition; 