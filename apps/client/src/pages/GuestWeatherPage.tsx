import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking, useStore } from '@/store';
import { weatherApi } from '@/api/endpoints';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonWeather } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import ErrorState from '@/components/guest/ErrorState';
import type { WeatherData } from '@/types';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};

const W_ICONS: Record<string, string> = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️', '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️', '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '🌨️', '13n': '🌨️', '50d': '🌫️', '50n': '🌫️',
};

export default function GuestWeatherPage() {
  const navigate = useNavigate();
  const { reservation, fetchReservation } = useBooking();
  const [weather, setWeather] = useState<WeatherData | null>(null);
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
      weatherApi.getWeather(res.property_id)
        .then((r) => setWeather(r.data.data))
        .catch(() => { setHasError(true); toast.error('Impossible de charger la meteo'); })
        .finally(() => setIsLoading(false));
    };
    load();
  }, []);

  const icon = (code: string) => W_ICONS[code] || '🌤️';

  return (
    <div className="min-h-screen bg-void pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-base font-semibold text-slate-100">Meteo</h1>
      </motion.header>

      <main className="max-w-3xl mx-auto px-4">
        {isLoading ? (
          <SkeletonWeather />
        ) : hasError ? (
          <ErrorState
            emoji="🌤️"
            title="Meteo indisponible"
            message="Impossible de charger les previsions meteo."
            onRetry={() => {
              if (reservation?.property_id) {
                setIsLoading(true);
                setHasError(false);
                weatherApi.getWeather(reservation.property_id)
                  .then((r) => setWeather(r.data.data))
                  .catch(() => setHasError(true))
                  .finally(() => setIsLoading(false));
              }
            }}
          />
        ) : !weather ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 py-12">
            <span className="text-4xl block mb-3 animate-float">☀️</span>
            <p className="text-[13px]">Meteo non disponible.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="initial" animate="animate">
            {/* Current Weather */}
            <motion.div variants={fadeUp}>
              <Card className="p-8 text-center mb-5 gradient-border overflow-visible">
                <div className="absolute top-0 left-0 right-0 h-[2px] gold-gradient rounded-t-2xl" />
                <p className="text-xs text-slate-500 tracking-wider mb-1">{weather.city}, {weather.country}</p>
                <motion.span
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="text-6xl block"
                >
                  {icon(weather.current.icon)}
                </motion.span>
                <p className="text-5xl font-light text-slate-100 font-display mt-2">{Math.round(weather.current.temp)}°</p>
                <p className="text-[15px] text-slate-400 capitalize mt-1">{weather.current.description}</p>
                <p className="text-xs text-slate-500 mt-1">Ressenti {Math.round(weather.current.feels_like)}°C</p>

                <div className="flex justify-center gap-8 mt-6">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Humidite</p>
                    <p className="text-base font-semibold text-slate-100 mt-1">{weather.current.humidity}%</p>
                  </div>
                  <div className="w-px bg-glass-border" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Vent</p>
                    <p className="text-base font-semibold text-slate-100 mt-1">{Math.round(weather.current.wind_speed)} km/h</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Forecast */}
            <motion.div variants={fadeUp} className="mb-2.5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-[2px] gold-gradient rounded-full" />
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">Previsions</p>
              </div>
            </motion.div>

            <div className="space-y-1.5">
              {weather.forecast.map((day, i) => {
                const d = new Date(day.date);
                const name = i === 0 ? "Aujourd'hui" : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
                return (
                  <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.01 }}>
                    <Card className="flex items-center gap-3 px-3.5 py-2.5">
                      <span className="text-xs font-medium text-slate-400 min-w-[85px]">{name}</span>
                      <span className="text-xl">{icon(day.icon)}</span>
                      <span className="flex-1 text-[11px] text-slate-500 capitalize">{day.description}</span>
                      {day.precipitation_probability > 0 && (
                        <span className="text-[10px] text-blue-400 font-medium">💧{day.precipitation_probability}%</span>
                      )}
                      <div className="text-right min-w-[55px]">
                        <span className="text-sm font-semibold text-slate-100">{Math.round(day.temp_max)}°</span>
                        <span className="text-[11px] text-slate-500 ml-1">{Math.round(day.temp_min)}°</span>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}
