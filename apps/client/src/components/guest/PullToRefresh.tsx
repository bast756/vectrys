import { useRef, useState, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
}

const THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const y = useMotionValue(0);

  const indicatorOpacity = useTransform(y, [0, 40, THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, THRESHOLD], [0.5, 1]);
  const indicatorRotate = useTransform(y, [0, THRESHOLD], [0, 180]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = containerRef.current;
    if (el && el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      // Apply resistance (pull further = less movement)
      const resistance = Math.min(diff * 0.4, THRESHOLD + 20);
      y.set(resistance);
    }
  }, [refreshing, y]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (y.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      animate(y, 50, { type: 'spring', stiffness: 300, damping: 30 });
      try {
        await onRefresh();
      } catch { /* silent */ }
      setRefreshing(false);
    }

    animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
  }, [y, refreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity, scale: indicatorScale }}
        className="flex justify-center py-2"
      >
        <motion.div
          style={{ rotate: refreshing ? undefined : indicatorRotate }}
          animate={refreshing ? { rotate: 360 } : {}}
          transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
        >
          <RefreshCw className="w-5 h-5 text-gold" />
        </motion.div>
      </motion.div>

      {/* Content shifted down */}
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
