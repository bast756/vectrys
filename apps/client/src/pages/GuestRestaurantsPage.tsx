import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking, useStore } from '@/store';
import { propertyApi } from '@/api/endpoints';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Heart, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonList } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import ErrorState from '@/components/guest/ErrorState';
import { cn } from '@/lib/utils';

// ── Animations ──────────────────────────────────────
const cardReveal = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 220, damping: 22 },
  },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

const chipSlide = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

// ── Category Filters ────────────────────────────────
const CUISINE_FILTERS = [
  { key: 'all', label: 'Tous', emoji: '🍽️' },
  { key: 'francais', label: 'Français', emoji: '🥐' },
  { key: 'italien', label: 'Italien', emoji: '🍝' },
  { key: 'asiatique', label: 'Asiatique', emoji: '🥢' },
  { key: 'fast-food', label: 'Fast-food', emoji: '🍔' },
  { key: 'cafe', label: 'Café/Bar', emoji: '☕' },
  { key: 'bakery', label: 'Boulangerie', emoji: '🥖' },
] as const;

// ── Type ────────────────────────────────────────────
interface RestaurantItem {
  name: string;
  address: string;
  type: string;
  rating: number;
  maps_url?: string | null;
  source?: string;
  host_comment?: string | null;
  image_url?: string | null;
}

type SortMode = 'recommended' | 'rating';

// ── Cuisine type keyword matching ───────────────────
const CUISINE_KEYWORDS: Record<string, string[]> = {
  francais: ['français', 'francais', 'french', 'bistrot', 'brasserie', 'provençal', 'crêperie', 'creperie'],
  italien: ['italien', 'italian', 'pizza', 'pasta', 'trattoria', 'osteria'],
  asiatique: ['asiatique', 'asian', 'japonais', 'japanese', 'chinois', 'chinese', 'thai', 'thaï', 'vietnamien', 'coréen', 'korean', 'sushi', 'ramen', 'wok'],
  'fast-food': ['fast', 'fast-food', 'burger', 'falafel', 'street food', 'kebab', 'tacos', 'sandwich'],
  cafe: ['café', 'cafe', 'bar', 'coffee', 'cocktail', 'wine', 'pub', 'lounge'],
  bakery: ['boulangerie', 'bakery', 'pâtisserie', 'patisserie', 'viennoiserie'],
};

function matchesCuisine(type: string, filterKey: string): boolean {
  if (filterKey === 'all') return true;
  const keywords = CUISINE_KEYWORDS[filterKey] || [];
  const lower = type.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

// ── Placeholder image gradients ─────────────────────
const PLACEHOLDER_GRADIENTS = [
  'from-amber-900/40 to-orange-800/20',
  'from-rose-900/40 to-pink-800/20',
  'from-emerald-900/40 to-teal-800/20',
  'from-violet-900/40 to-purple-800/20',
  'from-sky-900/40 to-blue-800/20',
  'from-red-900/40 to-amber-800/20',
];

const FOOD_EMOJIS = ['🍷', '🍴', '🥂', '🍜', '🍣', '🥘', '🫕', '🍕', '☕', '🥗'];

// ── Component ───────────────────────────────────────
export default function GuestRestaurantsPage() {
  const navigate = useNavigate();
  const { reservation, fetchReservation } = useBooking();
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [showMore, setShowMore] = useState(false);

  const loadData = async () => {
    let res = reservation;
    if (!res?.property_id) {
      try {
        await fetchReservation();
        res = useStore.getState()?.reservation ?? null;
      } catch {
        return;
      }
    }
    if (!res?.property_id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const r = await propertyApi.getGuide(res.property_id);
      setRestaurants(r.data.data.restaurants || []);
    } catch {
      setHasError(true);
      toast.error('Impossible de charger les restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Filter + Sort ──
  const filtered = restaurants
    .filter(r => matchesCuisine(r.type, activeFilter))
    .sort((a, b) => {
      if (sortMode === 'recommended') {
        const aHost = a.source === 'host' ? 0 : 1;
        const bHost = b.source === 'host' ? 0 : 1;
        if (aHost !== bHost) return aHost - bHost;
        return b.rating - a.rating;
      }
      return b.rating - a.rating;
    });

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.3;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'w-3.5 h-3.5 transition-colors',
              i < full
                ? 'text-gold fill-gold'
                : i === full && hasHalf
                  ? 'text-gold fill-gold/40'
                  : 'text-white/10 fill-white/5'
            )}
          />
        ))}
        <span className="text-[11px] text-slate-400 ml-1.5 font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-void pb-28">
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="px-4 pt-3 pb-2"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/guide')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">
              Restaurants & Cafes
            </h1>
            <p className="text-[11px] text-slate-500">
              {reservation?.property?.city || 'Autour de votre logement'}
            </p>
          </div>
        </div>
      </motion.header>

      {/* ── Filter Chips ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-4 mb-3"
      >
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
        >
          {CUISINE_FILTERS.map(f => (
            <motion.button
              key={f.key}
              variants={chipSlide}
              onClick={() => setActiveFilter(f.key)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer border',
                activeFilter === f.key
                  ? 'bg-gold/15 border-gold/30 text-gold shadow-[0_0_16px_rgba(212,168,83,0.12)]'
                  : 'bg-white/[0.03] border-glass-border text-slate-400 hover:text-slate-200 hover:border-white/10'
              )}
            >
              <span className="text-sm">{f.emoji}</span>
              {f.label}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Sort Toggle ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-between px-4 mb-4"
      >
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-glass-border">
          <button
            onClick={() => setSortMode('recommended')}
            className={cn(
              'px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
              sortMode === 'recommended'
                ? 'bg-gold/15 text-gold'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Heart className="w-3 h-3 inline mr-1 -mt-[1px]" />
            Recommandes
          </button>
          <button
            onClick={() => setSortMode('rating')}
            className={cn(
              'px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
              sortMode === 'rating'
                ? 'bg-gold/15 text-gold'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Star className="w-3 h-3 inline mr-1 -mt-[1px]" />
            Mieux notes
          </button>
        </div>
        <span className="text-[11px] text-slate-600">
          {filtered.length} resultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-4">
        {isLoading ? (
          <SkeletonList count={4} />
        ) : hasError ? (
          <ErrorState
            emoji="🍽️"
            title="Restaurants indisponibles"
            message="Impossible de charger les restaurants. Verifiez votre connexion."
            onRetry={loadData}
          />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <span className="text-5xl block mb-4 animate-float">🍴</span>
            <p className="text-[14px] font-medium text-slate-400">Aucun restaurant trouve</p>
            <p className="text-[12px] text-slate-600 mt-1">
              {activeFilter !== 'all'
                ? 'Essayez un autre filtre'
                : 'Aucun restaurant disponible pour le moment'}
            </p>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-4 text-[12px] text-gold font-semibold hover:text-gold/80 transition-colors cursor-pointer"
              >
                Voir tous les restaurants
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((r, i) => {
                const isHost = r.source === 'host';
                const gradient = PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length];
                const emoji = FOOD_EMOJIS[i % FOOD_EMOJIS.length];

                return (
                  <motion.div
                    key={`${r.name}-${i}`}
                    variants={cardReveal}
                    layout
                    whileHover={{ scale: 1.008 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <Card
                      className={cn(
                        'overflow-hidden transition-shadow',
                        isHost && 'ring-1 ring-gold/25 shadow-[0_0_24px_rgba(212,168,83,0.06)]'
                      )}
                    >
                      {/* Host recommendation banner */}
                      {isHost && (
                        <div className="flex items-center gap-2 px-4 pt-3 pb-0">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20">
                            <Heart className="w-3 h-3 text-gold fill-gold" />
                            <span className="text-[10px] text-gold font-bold uppercase tracking-wider">
                              Coup de coeur de l'hote
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 p-4">
                        {/* Image / Placeholder */}
                        <div className="shrink-0">
                          {r.image_url ? (
                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-glass-border">
                              <img
                                src={r.image_url}
                                alt={r.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'w-20 h-20 rounded-xl border border-glass-border flex items-center justify-center bg-gradient-to-br',
                                gradient
                              )}
                            >
                              <span className="text-3xl">{emoji}</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[15px] font-bold text-slate-100 leading-tight truncate">
                              {r.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-white/[0.05] border border-glass-border text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              {r.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-2">
                            <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                            <p className="text-[11px] text-slate-500 truncate">{r.address}</p>
                          </div>

                          <div className="mt-2">{renderStars(r.rating)}</div>
                        </div>
                      </div>

                      {/* Host comment */}
                      {isHost && r.host_comment && (
                        <div className="px-4 pb-3 -mt-1">
                          <div className="pl-3 border-l-2 border-gold/30">
                            <p className="text-[12px] text-slate-400 italic leading-relaxed">
                              « {r.host_comment} »
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Maps CTA */}
                      {r.maps_url && (
                        <div className="px-4 pb-4">
                          <motion.a
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            href={r.maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gold/8 border border-gold/15 text-gold text-[12px] font-semibold hover:bg-gold/12 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Voir sur Maps
                          </motion.a>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}
