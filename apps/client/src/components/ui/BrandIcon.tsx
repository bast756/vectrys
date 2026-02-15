import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BrandIconProps {
  icon: LucideIcon;
  active?: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * VECTRYS BrandIcon — Wraps any Lucide icon with brand identity:
 * - Gold gradient glow on active state
 * - Subtle gold drop-shadow on hover
 * - Signature accent dot (135° position)
 * - Consistent tap animation
 */
export default function BrandIcon({
  icon: Icon,
  active = false,
  size = 20,
  strokeWidth = 1.5,
  className,
}: BrandIconProps) {
  return (
    <motion.div
      className={cn('relative inline-flex items-center justify-center group', className)}
      whileTap={{ scale: 0.85, rotate: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {/* Ambient glow — visible on active */}
      <div
        className={cn(
          'absolute inset-[-4px] rounded-full transition-all duration-500',
          active
            ? 'bg-gold/15 blur-[8px] opacity-100'
            : 'bg-transparent blur-[6px] opacity-0 group-hover:bg-gold/8 group-hover:opacity-100'
        )}
      />

      {/* Icon */}
      <Icon
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'relative z-10 transition-all duration-300',
          active
            ? 'text-gold drop-shadow-[0_0_6px_rgba(212,168,83,0.4)]'
            : 'text-slate-500 group-hover:text-slate-300 group-hover:drop-shadow-[0_0_4px_rgba(212,168,83,0.15)]'
        )}
      />

      {/* Signature accent dot — gold, positioned at 135° (bottom-right) */}
      {active && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
          className="absolute -bottom-[2px] -right-[2px] w-[5px] h-[5px] rounded-full z-20"
          style={{ background: 'linear-gradient(135deg, #fcd34d, #b8860b)' }}
        />
      )}
    </motion.div>
  );
}
