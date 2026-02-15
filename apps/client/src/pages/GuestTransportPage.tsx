import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking, useStore } from '@/store';
import { transportApi } from '@/api/endpoints';
import { toast } from 'sonner';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonList } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import ErrorState from '@/components/guest/ErrorState';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
};

const T_ICONS: Record<string, string> = {
  train: '🚆', bus: '🚌', metro: '🚇', taxi: '🚕', car_rental: '🚗',
  supermarket: '🛒', pharmacy: '💊', velib: '🚲', airport: '✈️',
};

const T_CTA: Record<string, string> = {
  train: 'Voir les horaires', bus: 'Voir les horaires', metro: 'Voir les horaires',
  taxi: 'Reserver un taxi', car_rental: 'Reserver un vehicule',
  airport: 'Voir les horaires', velib: 'Voir sur la carte',
  supermarket: 'Itineraire', pharmacy: 'Itineraire',
};

interface TransportItem {
  id: string;
  name: string;
  type: string;
  from: string;
  to: string;
  duration: string;
  distance: string;
  price_range?: string | null;
  notes?: string | null;
  booking_url?: string | null;
}

export default function GuestTransportPage() {
  const navigate = useNavigate();
  const { reservation, fetchReservation } = useBooking();
  const [options, setOptions] = useState<TransportItem[]>([]);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const load = async () => {
      let res = reservation;
      if (!res?.property_id) {
        try { await fetchReservation(); res = useStore.getState()?.reservation ?? null; } catch { return; }
      }
      if (!res?.property_id) return;
      setIsLoading(true);
      setHasError(false);
      transportApi.getOptions(res.property_id)
        .then((r) => {
          const data = r.data.data;
          if (Array.isArray(data)) {
            setOptions(data as any);
          } else if (data && typeof data === 'object') {
            setOptions((data as any).options || []);
            setPropertyAddress((data as any).property_address || '');
          }
        })
        .catch(() => { setHasError(true); toast.error('Impossible de charger les transports'); })
        .finally(() => setIsLoading(false));
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-void pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-base font-semibold text-slate-100">Transport & Proximite</h1>
          <p className="text-[11px] text-slate-500">Points d'interet autour de votre logement</p>
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-4">
        {/* Property Address */}
        {(propertyAddress || reservation?.property) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}>
            <Card className="p-3.5 mb-4 gradient-border overflow-visible">
              <div className="absolute top-0 left-0 right-0 h-[2px] gold-gradient rounded-t-2xl" />
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Adresse du logement</p>
                  <p className="text-sm font-semibold text-slate-100 mt-0.5">
                    {reservation?.property?.name || 'Votre logement'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {propertyAddress || `${reservation?.property?.address}, ${reservation?.property?.zip_code || reservation?.property?.postal_code || ''} ${reservation?.property?.city}`.replace(/\s+/g, ' ').trim()}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {isLoading ? (
          <SkeletonList count={4} />
        ) : hasError ? (
          <ErrorState
            emoji="🚌"
            title="Transport indisponible"
            message="Impossible de charger les options de transport."
            onRetry={() => {
              if (reservation?.property_id) {
                setIsLoading(true);
                setHasError(false);
                transportApi.getOptions(reservation.property_id)
                  .then((r) => {
                    const data = r.data.data;
                    if (Array.isArray(data)) setOptions(data as any);
                    else if (data && typeof data === 'object') {
                      setOptions((data as any).options || []);
                      setPropertyAddress((data as any).property_address || '');
                    }
                  })
                  .catch(() => setHasError(true))
                  .finally(() => setIsLoading(false));
              }
            }}
          />
        ) : options.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 py-12">
            <span className="text-4xl block mb-3 animate-float">🚌</span>
            <p className="text-[13px]">Aucune option de transport disponible.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
            {options.map((opt) => (
              <motion.div key={opt.id} variants={fadeUp} whileHover={{ scale: 1.01 }}>
                <Card className="p-3.5">
                  <div className="flex gap-3.5 items-start">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-glass-border flex items-center justify-center text-xl shrink-0">
                      {T_ICONS[opt.type] || '📍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{opt.name}</p>
                      {opt.notes && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.notes}</p>
                      )}
                      <div className="flex flex-wrap gap-2 items-center mt-2">
                        <span className="text-[11px] text-slate-400 truncate">{opt.to}</span>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <span className="text-[11px] text-blue-400 font-medium">{opt.duration}</span>
                        {opt.distance && <span className="text-[11px] text-slate-500">{opt.distance}</span>}
                        {opt.price_range && <span className="text-[11px] text-emerald-400 font-medium">{opt.price_range}</span>}
                      </div>
                    </div>
                  </div>
                  {opt.booking_url && (
                    <motion.a whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      href={opt.booking_url} target="_blank" rel="noopener noreferrer"
                      className="block text-center mt-3 py-2.5 rounded-lg bg-gold/10 border border-gold/20 text-gold text-xs font-semibold hover:bg-gold/15 transition-colors">
                      {T_CTA[opt.type] || 'Voir sur la carte'}
                    </motion.a>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}
