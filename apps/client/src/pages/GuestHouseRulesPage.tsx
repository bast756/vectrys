import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking } from '@/store';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonList } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
};

// Map rule keywords to icons
const RULE_ICONS: Record<string, string> = {
  bruit: '🔇', noise: '🔇', calme: '🔇', silence: '🔇',
  fumer: '🚭', fumeur: '🚭', smoke: '🚭', cigarette: '🚭',
  animal: '🐾', animaux: '🐾', pet: '🐾', chien: '🐾', chat: '🐾',
  fete: '🎉', fête: '🎉', party: '🎉', soirée: '🎉', soiree: '🎉',
  menage: '🧹', ménage: '🧹', clean: '🧹', nettoy: '🧹',
  poubelle: '🗑️', dechet: '🗑️', déchet: '🗑️', tri: '🗑️', garbage: '🗑️',
  clef: '🔑', clé: '🔑', cle: '🔑', key: '🔑', serrure: '🔑',
  porte: '🚪', door: '🚪', entrée: '🚪', entree: '🚪',
  eau: '💧', water: '💧', douche: '💧',
  chauffage: '🌡️', heating: '🌡️', thermostat: '🌡️', temperature: '🌡️',
  voisin: '🏘️', neighbour: '🏘️', neighbor: '🏘️',
  parking: '🅿️', voiture: '🚗', car: '🚗',
  jardin: '🌳', garden: '🌳', terrasse: '🌳', balcon: '🌳',
  cuisine: '🍳', kitchen: '🍳',
  checkin: '📋', checkout: '📋', arrivee: '📋', arrivée: '📋', depart: '📋', départ: '📋',
  piscine: '🏊', pool: '🏊',
  wifi: '📶',
  enfant: '👶', enfants: '👶', child: '👶', bebe: '👶', bébé: '👶',
};

function getRuleIcon(rule: string): string {
  const lower = rule.toLowerCase();
  for (const [keyword, icon] of Object.entries(RULE_ICONS)) {
    if (lower.includes(keyword)) return icon;
  }
  return '📌';
}

export default function GuestHouseRulesPage() {
  const navigate = useNavigate();
  const { reservation, isLoading, fetchReservation } = useBooking();
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!reservation) fetchReservation().catch(() => {});
  }, []);

  // Parse house_rules — could be string (newline-separated), JSON string, or object
  const parseRules = (): string[] => {
    const raw = reservation?.property?.house_rules;
    if (!raw) return [];
    if (typeof raw === 'string') {
      // Try JSON parse first
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'object') return Object.values(parsed).flat().map(String);
      } catch {
        // Split by newlines or semicolons
        return raw.split(/[\n;]+/).map(r => r.trim()).filter(Boolean);
      }
    }
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return Object.values(raw).flat().map(String);
    return [];
  };

  const rules = parseRules();

  return (
    <div className="min-h-screen bg-void pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-base font-semibold text-slate-100">Reglement interieur</h1>
          <p className="text-[11px] text-slate-500">{reservation?.property?.name || 'Votre logement'}</p>
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-4">
        {isLoading ? (
          <SkeletonList count={6} />
        ) : rules.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 py-12">
            <span className="text-5xl block mb-4 animate-float">📜</span>
            <p className="text-[14px] font-medium text-slate-400">Aucun reglement disponible</p>
            <p className="text-[12px] text-slate-600 mt-1">Le proprietaire n'a pas defini de regles specifiques.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
            {rules.map((rule, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.01 }}>
                <Card className="flex items-start gap-3.5 p-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-glass-border flex items-center justify-center text-xl shrink-0">
                    {getRuleIcon(rule)}
                  </div>
                  <p className="text-[13px] text-slate-200 leading-relaxed pt-2">{rule}</p>
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
