import { memo, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedSection = memo(function AnimatedSection({
  children,
  delay = 0,
  className = "",
}: AnimatedSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0.2 } : {
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: delay * 0.05,
      }}
    >
      {children}
    </motion.div>
  );
});

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const reducedContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 15,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

const reducedItemVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.15,
    },
  },
};

export const AnimatedContainer = memo(function AnimatedContainer({
  children,
  className = "",
}: AnimatedContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={shouldReduceMotion ? reducedContainerVariants : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
});

export const AnimatedItem = memo(function AnimatedItem({
  children,
  className = "",
}: AnimatedContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div 
      className={className} 
      variants={shouldReduceMotion ? reducedItemVariants : itemVariants}
    >
      {children}
    </motion.div>
  );
});
