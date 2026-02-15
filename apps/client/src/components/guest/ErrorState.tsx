import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  emoji?: string;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  emoji = '😕',
  title = 'Oups',
  message = 'Une erreur est survenue',
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="text-center py-16 px-6"
    >
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="text-5xl block mb-4"
      >
        {emoji}
      </motion.span>
      <h3 className="text-[16px] font-semibold text-slate-200 mb-1.5">{title}</h3>
      <p className="text-[13px] text-slate-500 mb-6 leading-relaxed max-w-[260px] mx-auto">{message}</p>
      {onRetry && (
        <Button variant="gold" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Reessayer
        </Button>
      )}
    </motion.div>
  );
}
