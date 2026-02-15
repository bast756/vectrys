import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 24, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 220, damping: 24 } },
};

const container = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

export default function TermsPage() {
  const navigate = useNavigate();
  const { acceptTerms, isLoading, error } = useAuth();
  const [cgu, setCgu] = useState(false);
  const [cgv, setCgv] = useState(false);
  const [rgpd, setRgpd] = useState(false);
  const allAccepted = cgu && cgv && rgpd;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAccepted) return;
    try {
      await acceptTerms(cgu, cgv, rgpd);
      toast.success('Conditions acceptees');
      navigate('/');
    } catch {
      toast.error('Erreur lors de la validation');
    }
  };

  const terms = [
    { checked: cgu, set: setCgu, title: "Conditions Generales d'Utilisation (CGU)", desc: "J'accepte les conditions generales d'utilisation de la plateforme VECTRYS." },
    { checked: cgv, set: setCgv, title: "Conditions Generales de Vente (CGV)", desc: "J'accepte les conditions de vente applicables aux services proposes." },
    { checked: rgpd, set: setRgpd, title: "Protection des donnees (RGPD)", desc: "J'accepte le traitement de mes donnees personnelles conformement a la politique de confidentialite." },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-void p-5 relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/[0.03] blur-[120px]" />

      <motion.div variants={container} initial="initial" animate="animate" className="w-full max-w-[480px]">
        <Card className="gradient-border overflow-visible">
          <div className="absolute top-0 left-0 right-0 h-[2px] gold-gradient rounded-t-2xl" />
          <CardContent className="p-8">
            <motion.div variants={fadeUp} className="text-center mb-8">
              <img src="/brand/logo-stacked-white.png" alt="VECTRYS" className="h-16 mx-auto mb-3 object-contain" />
              <p className="text-xl font-light text-slate-100 font-display">Conditions d'utilisation</p>
              <p className="text-slate-500 text-xs mt-1.5">Veuillez accepter les conditions pour continuer</p>
            </motion.div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</motion.div>
            )}

            <form onSubmit={handleSubmit}>
              {terms.map(({ checked, set, title, desc }, i) => (
                <motion.label
                  key={i}
                  variants={fadeUp}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "flex items-start gap-3.5 py-4 cursor-pointer transition-colors group",
                    i < 2 && 'border-b border-glass-border'
                  )}
                >
                  <motion.div
                    animate={checked ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "w-[22px] h-[22px] rounded-lg shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all duration-200",
                      checked ? "bg-gold border-gold" : "border-glass-border group-hover:border-gold/40"
                    )}
                  >
                    {checked && <Check className="w-3 h-3 text-void" strokeWidth={3} />}
                  </motion.div>
                  <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="sr-only" />
                  <div>
                    <span className="text-[13px] font-medium text-slate-200">{title}</span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </motion.label>
              ))}

              <motion.div variants={fadeUp}>
                <Button type="submit" disabled={!allAccepted || isLoading} className="w-full mt-6 h-11">
                  {isLoading ? 'Validation...' : 'Accepter et continuer'}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
