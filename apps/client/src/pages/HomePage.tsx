import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useBooking } from '@/store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import {
  MessageCircle, ShoppingBag, MapPin, Sun, Bus, Wifi,
  CheckCircle, LogOut, CalendarDays, Moon, Sparkles,
  ChevronLeft, ChevronRight, ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { initPushNotifications } from '@/lib/firebase';
import PullToRefresh from '@/components/guest/PullToRefresh';
import BrandIcon from '@/components/ui/BrandIcon';

/* ─── Animation Variants ────────────────────────────── */

const page = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 28, filter: 'blur(6px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 220, damping: 24 },
  },
};

const widgetGrid = {
  initial: {},
  animate: { transition: { staggerChildren: 0.055, delayChildren: 0.35 } },
};

const widgetCard = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 280, damping: 22 },
  },
};

/* ─── Photo Carousel ────────────────────────────────── */

function PhotoCarousel({ photos }: { photos: string[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Auto-advance
  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [photos.length, next]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.95, transition: { duration: 0.25 } }),
  };

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-obsidian">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.img
          key={current}
          src={photos[current]}
          alt={`Photo ${current + 1}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/30 pointer-events-none" />

      {/* Nav arrows */}
      {photos.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer z-10">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer z-10">
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {photos.map((_, i) => (
            <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                i === current ? "w-6 bg-gold" : "w-1.5 bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      )}

      {/* Photo count badge */}
      <div className="absolute top-3 right-3 text-[10px] font-medium text-white/70 bg-void/50 backdrop-blur-md px-2.5 py-1 rounded-full z-10">
        {current + 1} / {photos.length}
      </div>
    </div>
  );
}

/* ─── Widget Config ─────────────────────────────────── */

const WIDGETS = [
  { label: 'Chat',        icon: MessageCircle, path: '/chat',               desc: 'Contacter votre hote',    accent: 'from-blue-500/20 to-blue-600/5' },
  { label: 'Services',    icon: ShoppingBag,   path: '/services',           desc: 'Room service & extras',   accent: 'from-gold/20 to-gold-dark/5' },
  { label: 'Guide Local', icon: MapPin,        path: '/guide',              desc: 'Restaurants, activites',  accent: 'from-emerald-500/20 to-emerald-600/5' },
  { label: 'Meteo',       icon: Sun,           path: '/weather',            desc: 'Previsions locales',      accent: 'from-amber-500/20 to-amber-600/5' },
  { label: 'Transport',   icon: Bus,           path: '/transport',          desc: 'Comment venir',           accent: 'from-violet-500/20 to-violet-600/5' },
  { label: 'Wi-Fi',       icon: Wifi,          path: '/wifi',               desc: 'Acces internet',          accent: 'from-cyan-500/20 to-cyan-600/5' },
  { label: 'Reglement',   icon: ScrollText,    path: '/rules',              desc: 'Regles du logement',      accent: 'from-orange-500/20 to-orange-600/5' },
  { label: 'Checkout',    icon: CheckCircle,   path: '/checkout-checklist', desc: 'Checklist depart',        accent: 'from-rose-500/20 to-rose-600/5' },
];

/* ─── Component ─────────────────────────────────────── */

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { reservation, isLoading, fetchReservation } = useBooking();
  const [showMore, setShowMore] = useState(false);
  const [greeting, setGreeting] = useState('Bonsoir');
  const [greetingIcon, setGreetingIcon] = useState<typeof Sun>(Moon);

  useEffect(() => {
    fetchReservation().catch(() => toast.error('Impossible de charger votre reservation'));
    // Register FCM token for push notifications
    initPushNotifications().catch(() => {});
    const h = new Date().getHours();
    if (h < 12) { setGreeting('Bonjour'); setGreetingIcon(Sun); }
    else if (h < 18) { setGreeting('Bon apres-midi'); setGreetingIcon(Sparkles); }
    else { setGreeting('Bonsoir'); setGreetingIcon(Moon); }
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const nights = reservation
    ? Math.ceil((new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) / 86400000)
    : 0;

  // Countdown to checkout
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    if (!reservation?.check_out_date) return;
    const update = () => {
      const now = Date.now();
      const checkout = new Date(reservation.check_out_date).getTime();
      const diff = checkout - now;
      if (diff <= 0) { setCountdown('Checkout !'); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (days > 0) setCountdown(`${days}j ${hours}h`);
      else setCountdown(`${hours}h ${mins}min`);
    };
    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [reservation?.check_out_date]);

  const photos = reservation?.property?.image_urls || reservation?.property?.photos || [];
  const GreetIcon = greetingIcon;

  return (
    <PullToRefresh onRefresh={async () => { await fetchReservation(); }} className="min-h-screen bg-void pb-28 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-gold/[0.04] blur-[120px]" />

      <motion.div variants={page} initial="initial" animate="animate">

        {/* Header */}
        <motion.header variants={fadeUp} className="flex items-center justify-between px-5 pt-5 pb-1 relative z-10">
          <div className="flex items-center gap-2.5">
            <img src="/brand/app-icon.png" alt="V" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-[11px] font-bold text-gold/80 tracking-[0.2em] uppercase">VECTRYS</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 text-xs gap-1.5 hover:text-red-400">
            <LogOut className="w-3.5 h-3.5" />
            Deconnexion
          </Button>
        </motion.header>

        <main className="px-5 pt-3 relative z-10">
          {/* Greeting */}
          <motion.div variants={fadeUp} className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <GreetIcon className="w-4 h-4 text-gold/60" />
              <span className="text-[11px] text-gold/60 font-medium uppercase tracking-wider">{greeting}</span>
            </div>
            <h2 className="text-[28px] font-light text-slate-100 font-display leading-tight">
              {user?.first_name || 'Cher voyageur'}
            </h2>
            <p className="text-slate-500 text-[13px] mt-1.5">Bienvenue dans votre espace personnel</p>
          </motion.div>

          {/* Photo Carousel */}
          {isLoading ? (
            <motion.div variants={fadeUp} className="mb-5">
              <Skeleton className="aspect-[16/9] rounded-2xl" />
            </motion.div>
          ) : photos.length > 0 ? (
            <motion.div variants={fadeUp} className="mb-5">
              <PhotoCarousel photos={photos} />
            </motion.div>
          ) : (
            <motion.div variants={fadeUp} className="mb-5">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-obsidian border border-glass-border">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.06] to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl mb-3">🏠</span>
                  <p className="text-sm font-medium text-slate-400">
                    {reservation?.property?.name || 'Votre logement'}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {reservation?.property?.city || ''}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Countdown to checkout */}
          {countdown && reservation?.status === 'checked_in' && (
            <motion.div variants={fadeUp} className="mb-4">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gold/[0.06] border border-gold/15">
                <span className="text-[13px] text-slate-400">Depart dans</span>
                <span className="text-[17px] font-bold text-gold font-display">{countdown}</span>
              </div>
            </motion.div>
          )}

          {/* Reservation Card */}
          <motion.div variants={fadeUp}>
            {isLoading ? (
              <SkeletonCard className="mb-5" />
            ) : reservation ? (
              <Card className="mb-5 gradient-border overflow-visible">
                <div className="absolute top-0 left-0 right-0 h-[2px] gold-gradient rounded-t-2xl" />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start gap-3 mb-5">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-slate-100 truncate">
                        {reservation.property?.name || 'Votre sejour'}
                      </h3>
                      <p className="text-[12px] text-slate-500 mt-0.5 truncate">
                        {reservation.property?.address}, {reservation.property?.zip_code || reservation.property?.postal_code || ''} {reservation.property?.city}
                      </p>
                    </div>
                    <Badge
                      variant={reservation.status === 'checked_in' ? 'success' : 'default'}
                      className="shrink-0"
                    >
                      {reservation.status === 'checked_in' ? 'En cours' : reservation.status === 'confirmed' ? 'Confirme' : reservation.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-glass-border">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CalendarDays className="w-3 h-3 text-gold/50" />
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Arrivee</p>
                      </div>
                      <p className="text-[15px] font-semibold text-slate-100">
                        {new Date(reservation.check_in_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CalendarDays className="w-3 h-3 text-gold/50" />
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Depart</p>
                      </div>
                      <p className="text-[15px] font-semibold text-slate-100">
                        {new Date(reservation.check_out_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Nuits</p>
                      <p className="text-[22px] font-light text-gold font-display leading-none">{nights}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center mb-5">
                <p className="text-slate-500 text-[13px]">Aucune reservation trouvee.</p>
              </Card>
            )}
          </motion.div>

          {/* Widgets Section */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-5 h-[2px] gold-gradient rounded-full" />
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">Acces rapide</p>
            </div>
          </motion.div>

          <motion.div variants={widgetGrid} initial="initial" animate="animate" className="grid grid-cols-2 gap-2.5">
            {WIDGETS.map(({ label, icon: Icon, path, desc, accent }) => (
              <motion.div
                key={label}
                variants={widgetCard}
                whileHover={{ scale: 1.03, y: -3, transition: { type: 'spring' as const, stiffness: 400, damping: 18 } }}
                whileTap={{ scale: 0.97 }}
              >
                <Card
                  onClick={() => navigate(path)}
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-300 group relative overflow-hidden",
                    "hover:border-gold/20"
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", accent)} />
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-glass-border flex items-center justify-center mb-3 group-hover:border-gold/20 transition-colors">
                      <BrandIcon icon={Icon} size={20} />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-200 group-hover:text-slate-100 transition-colors">{label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug group-hover:text-slate-400 transition-colors">{desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </main>
      </motion.div>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </PullToRefresh>
  );
}
