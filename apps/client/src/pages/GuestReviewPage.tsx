import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking } from '@/store';
import { reviewsApi } from '@/api/endpoints';
import { toast } from 'sonner';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DockNav from '@/components/guest/DockNav';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

const CATEGORIES = [
  { key: 'overall', label: 'Note globale', icon: '⭐' },
  { key: 'cleanliness', label: 'Proprete', icon: '✨' },
  { key: 'communication', label: 'Communication', icon: '💬' },
  { key: 'location', label: 'Localisation', icon: '📍' },
  { key: 'value', label: 'Confort', icon: '🛋️' },
] as const;

function StarRating({ value, onChange, size = 'lg' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'lg' }) {
  const [hover, setHover] = useState(0);
  const starSize = size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileTap={{ scale: 0.8 }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="cursor-pointer"
        >
          <Star
            className={cn(
              starSize, 'transition-colors',
              (hover || value) >= star
                ? 'fill-gold text-gold'
                : 'fill-transparent text-slate-600'
            )}
          />
        </motion.button>
      ))}
    </div>
  );
}

export default function GuestReviewPage() {
  const navigate = useNavigate();
  const { reservation, fetchReservation } = useBooking();
  const [ratings, setRatings] = useState<Record<string, number>>({
    overall: 0, cleanliness: 0, communication: 0, location: 0, value: 0,
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!reservation) fetchReservation().catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (ratings.overall === 0) {
      toast.error('Veuillez donner une note globale');
      return;
    }
    if (!reservation?.id) return;

    setIsSubmitting(true);
    try {
      await reviewsApi.submitReview(reservation.id, {
        rating: ratings.overall,
        cleanliness_rating: ratings.cleanliness || undefined,
        communication_rating: ratings.communication || undefined,
        value_rating: ratings.value || undefined,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      toast.success('Merci pour votre avis !');
    } catch {
      toast.error('Erreur lors de l\'envoi de votre avis');
    }
    setIsSubmitting(false);
  };

  const setRating = (key: string, value: number) => {
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-void pb-28 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' as const, stiffness: 200, damping: 15 }}
          className="text-center px-6"
        >
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring' as const, stiffness: 200, damping: 12, delay: 0.2 }}
            className="text-6xl block"
          >
            🎉
          </motion.span>
          <h2 className="text-xl font-light text-slate-100 font-display mt-4">Merci pour votre avis !</h2>
          <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
            Votre retour nous aide a nous ameliorer.<br/>Nous esperons vous revoir bientot !
          </p>
          <Button onClick={() => navigate('/')} className="mt-6">Retour a l'accueil</Button>
        </motion.div>
        <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-base font-semibold text-slate-100">Laisser un avis</h1>
          <p className="text-[11px] text-slate-500">{reservation?.property?.name || 'Votre sejour'}</p>
        </div>
      </motion.header>

      <main className="max-w-xl mx-auto px-4">
        <motion.div variants={stagger} initial="initial" animate="animate">
          {/* Rating categories */}
          {CATEGORIES.map(({ key, label, icon }) => (
            <motion.div key={key} variants={fadeUp}>
              <Card className={cn("p-4 mb-2.5", key === 'overall' && "gradient-border overflow-visible")}>
                {key === 'overall' && <div className="absolute top-0 left-0 right-0 h-[2px] gold-gradient rounded-t-2xl" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{icon}</span>
                    <span className={cn("text-[13px] font-medium", key === 'overall' ? 'text-slate-100' : 'text-slate-300')}>
                      {label}
                    </span>
                  </div>
                  <StarRating
                    value={ratings[key]}
                    onChange={(v) => setRating(key, v)}
                    size={key === 'overall' ? 'lg' : 'sm'}
                  />
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Comment */}
          <motion.div variants={fadeUp}>
            <Card className="p-4 mt-4 mb-5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Commentaire (optionnel)</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre experience..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-glass-border bg-white/[0.03] text-sm text-slate-100 resize-none outline-none focus:border-gold/50 transition-colors"
              />
            </Card>
          </motion.div>

          {/* Submit */}
          <motion.div variants={fadeUp}>
            <Button onClick={handleSubmit} disabled={isSubmitting || ratings.overall === 0} className="w-full h-11">
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer mon avis'}
            </Button>
          </motion.div>
        </motion.div>
      </main>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}
