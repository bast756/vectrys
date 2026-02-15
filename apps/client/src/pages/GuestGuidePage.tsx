import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking, useStore } from '@/store';
import { propertyApi } from '@/api/endpoints';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Heart, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SkeletonList } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import ErrorState from '@/components/guest/ErrorState';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
};

interface GuideData {
  restaurants: Array<{ name: string; address: string; type: string; rating: number; maps_url?: string | null; source?: string; host_comment?: string | null; image_url?: string | null }>;
  attractions: Array<{ name: string; description: string; distance_km: number | null; maps_url?: string | null; source?: string; image_url?: string | null }>;
  practical_info: Record<string, string>;
}

export default function GuestGuidePage() {
  const navigate = useNavigate();
  const { reservation, fetchReservation } = useBooking();
  const [guide, setGuide] = useState<GuideData | null>(null);
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
      propertyApi.getGuide(res.property_id)
        .then((r) => setGuide(r.data.data))
        .catch(() => { setHasError(true); toast.error('Impossible de charger le guide'); })
        .finally(() => setIsLoading(false));
    };
    load();
  }, []);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={cn('text-xs', i < Math.round(rating) ? 'text-gold' : 'text-white/10')}>★</span>
    ));

  return (
    <div className="min-h-screen bg-void pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-base font-semibold text-slate-100">Guide Local</h1>
          <p className="text-[11px] text-slate-500">{reservation?.property?.city || 'Votre destination'}</p>
        </div>
      </motion.header>

      <Tabs defaultValue="restaurants">
        <TabsList>
          <TabsTrigger value="restaurants">🍽️ Restaurants</TabsTrigger>
          <TabsTrigger value="attractions">🏛️ Activites</TabsTrigger>
          <TabsTrigger value="practical">ℹ️ Pratique</TabsTrigger>
        </TabsList>

        <main className="max-w-3xl mx-auto px-4">
          {isLoading ? (
            <SkeletonList count={4} />
          ) : hasError ? (
            <ErrorState
              emoji="🗺️"
              title="Guide indisponible"
              message="Impossible de charger le guide local. Verifiez votre connexion."
              onRetry={() => {
                if (reservation?.property_id) {
                  setIsLoading(true);
                  setHasError(false);
                  propertyApi.getGuide(reservation.property_id)
                    .then((r) => setGuide(r.data.data))
                    .catch(() => setHasError(true))
                    .finally(() => setIsLoading(false));
                }
              }}
            />
          ) : !guide ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 py-12">
              <span className="text-4xl block mb-3 animate-float">🗺️</span>
              <p className="text-[13px]">Guide local non disponible.</p>
            </motion.div>
          ) : (
            <>
              <TabsContent value="restaurants">
                <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
                  {guide.restaurants.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Aucun restaurant recommande.</p>
                  ) : guide.restaurants.map((r, i) => (
                    <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.01 }}>
                      <Card className={cn('p-3.5', r.source === 'host' && 'ring-1 ring-gold/20')}>
                        {r.source === 'host' && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <Heart className="w-3 h-3 text-gold fill-gold" />
                            <span className="text-[10px] text-gold font-semibold uppercase tracking-wider">Recommande par l'hote</span>
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold text-slate-100">{r.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{r.address}</p>
                          </div>
                          <Badge variant="muted" className="text-[10px] shrink-0">{r.type}</Badge>
                        </div>
                        {r.host_comment && (
                          <p className="text-xs text-slate-400 mt-2 italic leading-relaxed">« {r.host_comment} »</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div>{renderStars(r.rating)}</div>
                          {r.maps_url && (
                            <a href={r.maps_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-gold font-medium hover:text-gold/80 transition-colors">
                              <ExternalLink className="w-3 h-3" /> Maps
                            </a>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                  {guide.restaurants.length > 0 && (
                    <motion.div variants={fadeUp} className="pt-2">
                      <button
                        onClick={() => navigate('/restaurants')}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold/8 border border-gold/15 text-gold text-[12px] font-semibold hover:bg-gold/12 transition-colors cursor-pointer"
                      >
                        Decouvrir tous les restaurants
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="attractions">
                <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
                  {guide.attractions.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Aucune activite recommandee.</p>
                  ) : guide.attractions.map((a, i) => (
                    <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.01 }}>
                      <Card className={cn('p-3.5', a.source === 'host' && 'ring-1 ring-gold/20')}>
                        {a.source === 'host' && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <Heart className="w-3 h-3 text-gold fill-gold" />
                            <span className="text-[10px] text-gold font-semibold uppercase tracking-wider">Recommande par l'hote</span>
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-100">{a.name}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{a.description}</p>
                          </div>
                          {a.distance_km != null && (
                            <Badge variant="info" className="text-[11px] font-semibold whitespace-nowrap ml-3 shrink-0">
                              {a.distance_km < 1 ? `${Math.round(a.distance_km * 1000)}m` : `${a.distance_km.toFixed(1)}km`}
                            </Badge>
                          )}
                        </div>
                        {a.maps_url && (
                          <a href={a.maps_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-2 text-[11px] text-gold font-medium hover:text-gold/80 transition-colors">
                            <ExternalLink className="w-3 h-3" /> Ouvrir dans Maps
                          </a>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="practical">
                <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
                  {Object.keys(guide.practical_info).length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Aucune info pratique disponible.</p>
                  ) : Object.entries(guide.practical_info).map(([key, value]) => (
                    <motion.div key={key} variants={fadeUp}>
                      <Card className="p-3.5">
                        <p className="text-[10px] text-gold uppercase tracking-wider font-semibold">{key.replace(/_/g, ' ')}</p>
                        <p className="text-[13px] text-slate-100 mt-1.5 leading-relaxed">{value}</p>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            </>
          )}
        </main>
      </Tabs>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}
