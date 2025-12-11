import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const HOVER_GRADIENT_STYLE: React.CSSProperties = {
  background: "radial-gradient(circle at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
};

interface GalleryLoadingSkeletonProps {
  count?: number;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.85,
    y: 10,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const GalleryLoadingSkeleton = memo(function GalleryLoadingSkeleton({
  count = 8,
  className = "",
}: GalleryLoadingSkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 ${className}`}
      variants={shouldReduceMotion ? reducedMotionVariants : containerVariants}
      initial="hidden"
      animate="visible"
      role="status"
      aria-busy="true"
      aria-label="Loading gallery"
      data-testid="gallery-loading-skeleton"
    >
      <span className="sr-only">Loading photos...</span>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          variants={shouldReduceMotion ? reducedMotionVariants : itemVariants}
          className="aspect-square rounded-lg overflow-hidden relative group"
        >
          <div className="w-full h-full shimmer-modern" />
          <div 
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={HOVER_GRADIENT_STYLE}
          />
        </motion.div>
      ))}
    </motion.div>
  );
});

interface ListLoadingSkeletonProps {
  count?: number;
  className?: string;
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const listItemVariants = {
  hidden: { 
    opacity: 0, 
    x: -16,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
    },
  },
};

export const ListLoadingSkeleton = memo(function ListLoadingSkeleton({
  count = 6,
  className = "",
}: ListLoadingSkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`space-y-2 ${className}`}
      variants={shouldReduceMotion ? reducedMotionVariants : listContainerVariants}
      initial="hidden"
      animate="visible"
      role="status"
      aria-busy="true"
      aria-label="Loading list"
      data-testid="list-loading-skeleton"
    >
      <span className="sr-only">Loading items...</span>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          variants={shouldReduceMotion ? reducedMotionVariants : listItemVariants}
          className="flex items-center gap-3 p-3 rounded-lg overflow-hidden bg-card/30"
        >
          <div className="w-16 h-16 rounded-lg shimmer-modern flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="h-4 w-3/4 rounded-md shimmer-modern" />
            <div className="h-3 w-1/2 rounded-md shimmer-modern" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
});

interface FolderLoadingSkeletonProps {
  count?: number;
  className?: string;
}

export const FolderLoadingSkeleton = memo(function FolderLoadingSkeleton({
  count = 4,
  className = "",
}: FolderLoadingSkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}
      variants={shouldReduceMotion ? reducedMotionVariants : containerVariants}
      initial="hidden"
      animate="visible"
      role="status"
      aria-busy="true"
      aria-label="Loading folders"
      data-testid="folder-loading-skeleton"
    >
      <span className="sr-only">Loading folders...</span>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          variants={shouldReduceMotion ? reducedMotionVariants : itemVariants}
          className="rounded-xl overflow-hidden bg-card/50 shadow-sm"
        >
          <div className="aspect-square shimmer-modern" />
          <div className="p-3 space-y-2.5">
            <div className="h-4 w-3/4 rounded-md shimmer-modern" />
            <div className="h-3 w-1/3 rounded-md shimmer-modern" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
});
