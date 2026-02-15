import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking, useStore } from '@/store';
import { guestApi } from '@/api/endpoints';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonHero } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import ErrorState from '@/components/guest/ErrorState';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

interface WifiInfo { ssid: string; password: string; qr_code?: string | null; }

export default function GuestWifiPage() {
  const navigate = useNavigate();
  const { reservation, fetchReservation } = useBooking();
  const [wifi, setWifi] = useState<WifiInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
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
      guestApi.getWifiInfo(res.property_id)
        .then((r) => setWifi(r.data.data))
        .catch(() => { setHasError(true); toast.error('Impossible de charger les infos Wi-Fi'); })
        .finally(() => setIsLoading(false));
    };
    load();
  }, []);

  const copy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea'); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(field);
    toast.success('Copie dans le presse-papier !');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-void pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-base font-semibold text-slate-100">Wi-Fi</h1>
      </motion.header>

      <main className="max-w-xl mx-auto px-4">
        {isLoading ? (
          <SkeletonHero />
        ) : hasError ? (
          <ErrorState
            emoji="📶"
            title="Wi-Fi indisponible"
            message="Impossible de charger les informations Wi-Fi."
            onRetry={() => {
              if (reservation?.property_id) {
                setIsLoading(true);
                setHasError(false);
                guestApi.getWifiInfo(reservation.property_id)
                  .then((r) => setWifi(r.data.data))
                  .catch(() => setHasError(true))
                  .finally(() => setIsLoading(false));
              }
            }}
          />
        ) : !wifi ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 py-12">
            <span className="text-5xl block mb-3 animate-float">📶</span>
            <p className="text-[13px]">Informations Wi-Fi non disponibles.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="initial" animate="animate">
            {/* Hero */}
            <motion.div variants={fadeUp}>
              <Card className="p-8 text-center mb-5 gradient-border overflow-visible">
                <div className="absolute top-0 left-0 right-0 h-[2px] gold-gradient rounded-t-2xl" />
                <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl block">
                  📶
                </motion.span>
                <h2 className="text-xl font-light text-slate-100 font-display mt-4">Connexion Wi-Fi</h2>
                <p className="text-xs text-slate-500 mt-1">Connectez-vous au reseau de votre logement</p>
              </Card>
            </motion.div>

            {/* SSID */}
            <motion.div variants={fadeUp}>
              <Card className="p-4 mb-2.5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Nom du reseau (SSID)</p>
                    <p className="text-lg font-bold text-gold font-mono mt-1.5">{wifi.ssid}</p>
                  </div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button variant={copied === 'ssid' ? 'gold' : 'secondary'} size="sm" onClick={() => copy(wifi.ssid, 'ssid')}>
                      {copied === 'ssid' ? <><Check className="w-3.5 h-3.5" /> Copie !</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp}>
              <Card className="p-4 mb-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Mot de passe</p>
                    <p className="text-lg font-bold text-gold font-mono mt-1.5">{wifi.password}</p>
                  </div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button variant={copied === 'pwd' ? 'gold' : 'secondary'} size="sm" onClick={() => copy(wifi.password, 'pwd')}>
                      {copied === 'pwd' ? <><Check className="w-3.5 h-3.5" /> Copie !</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {/* QR */}
            {wifi.qr_code && (
              <motion.div variants={fadeUp}>
                <Card className="p-6 text-center mb-5">
                  <p className="text-sm font-semibold text-slate-100 mb-3">Scanner le QR Code</p>
                  <div className="bg-white rounded-xl p-4 inline-block">
                    <img src={wifi.qr_code} alt="WiFi QR" className="w-44 h-44 rounded" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3">Scannez avec l'appareil photo</p>
                </Card>
              </motion.div>
            )}

            {/* Tips */}
            <motion.div variants={fadeUp}>
              <Card className="p-4 border-gold/15">
                <p className="text-xs font-semibold text-gold mb-2">Conseils</p>
                <ul className="text-xs text-slate-400 leading-relaxed space-y-1.5 list-disc pl-4">
                  <li>Verifiez que le Wi-Fi est active sur votre appareil</li>
                  <li>Le mot de passe est sensible aux majuscules/minuscules</li>
                  <li>En cas de probleme, redemarrez le routeur (attendre 30s)</li>
                  <li>Contactez votre hote via le chat si le probleme persiste</li>
                </ul>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </main>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}
