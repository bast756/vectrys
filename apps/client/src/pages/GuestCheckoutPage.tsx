import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking, useStore } from '@/store';
import { guestApi } from '@/api/endpoints';
import { toast } from 'sonner';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonList } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import { cn } from '@/lib/utils';

interface InstructionsData {
  checkout_time?: string;
  instructions?: string[];
  garbage_info?: string;
  checklist?: Array<{ id: string; label: string; label_en?: string; order: number; required: boolean }>;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};

export default function GuestCheckoutPage() {
  const navigate = useNavigate();
  const { reservation, checkoutChecklist, toggleChecklistTask, updateChecklist, checkout, setCheckoutChecklist, fetchReservation } = useBooking();
  const [instructions, setInstructions] = useState<InstructionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const load = async () => {
      let res = reservation;
      if (!res?.property_id) {
        try { await fetchReservation(); res = useStore.getState()?.reservation ?? null; } catch { return; }
      }
      if (!res?.property_id) return;
      setIsLoading(true);
      guestApi.getInstructions(res.property_id)
        .then((r) => {
          const data = r.data.data;
          setInstructions(data);
          if (data.checklist && checkoutChecklist.length === 0) {
            setCheckoutChecklist(data.checklist.map((item: any) => ({
              id: item.id, label: item.label, completed: false, required: item.required, order: item.order,
            })));
          }
        })
        .catch(() => toast.error('Impossible de charger les instructions'))
        .finally(() => setIsLoading(false));
    };
    load();
  }, []);

  const completedCount = checkoutChecklist.filter((t) => t.completed).length;
  const totalCount = checkoutChecklist.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Use sorted copy to avoid mutating store state
  const sortedChecklist = [...checkoutChecklist].sort((a, b) => a.order - b.order);

  const handleToggle = async (taskId: string) => {
    toggleChecklistTask(taskId);
    setIsSaving(true);
    try { await updateChecklist(); } catch { toast.error('Erreur de sauvegarde'); }
    setIsSaving(false);
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      await checkout();
      setShowSuccess(true);
      toast.success('Check-out confirme !');
    } catch {
      toast.error('Erreur lors du check-out');
    }
    setIsCheckingOut(false);
  };

  return (
    <div className="min-h-screen bg-void pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-base font-semibold text-slate-100">Checkout</h1>
          <p className="text-[11px] text-slate-500">Checklist de depart</p>
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-4">
        {showSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' as const, stiffness: 200, damping: 15 }}
            className="text-center py-12"
          >
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring' as const, stiffness: 200, damping: 12, delay: 0.2 }}
              className="text-6xl block"
            >
              🎉
            </motion.span>
            <h2 className="text-xl font-light text-slate-100 font-display mt-4">Check-out confirme !</h2>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
              Merci pour votre sejour !<br/>Nous esperons vous revoir bientot.
            </p>
            <Button onClick={() => navigate('/review')} className="mt-6">Laisser un avis</Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="mt-2 text-slate-500 text-xs">Retour a l'accueil</Button>
          </motion.div>
        ) : isLoading ? (
          <SkeletonList count={5} />
        ) : (
          <motion.div variants={stagger} initial="initial" animate="animate">
            {/* Progress */}
            {totalCount > 0 && (
              <motion.div variants={fadeUp}>
                <Card className="p-4 mb-4 gradient-border overflow-visible">
                  <div className="absolute top-0 left-0 right-0 h-[2px] gold-gradient rounded-t-2xl" />
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-semibold text-slate-100">Progression</span>
                    <motion.span
                      key={completedCount}
                      initial={{ scale: 1.4, color: '#fcd34d' }}
                      animate={{ scale: 1, color: allCompleted ? '#34d399' : '#d4a853' }}
                      className="text-xs font-semibold"
                    >
                      {completedCount}/{totalCount}
                    </motion.span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: 'spring' as const, stiffness: 100, damping: 20 }}
                      className={cn("h-full rounded-full", allCompleted ? "bg-emerald-400" : "gold-gradient")}
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Checklist */}
            {sortedChecklist.length > 0 && (
              <motion.div variants={fadeUp} className="mb-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-5 h-[2px] gold-gradient rounded-full" />
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">A faire avant de partir</p>
                </div>
                <div className="space-y-1.5">
                  {sortedChecklist.map((task) => (
                    <motion.div key={task.id} whileTap={{ scale: 0.98 }} layout>
                      <Card onClick={() => handleToggle(task.id)}
                        className={cn("flex items-start gap-3 p-3.5 cursor-pointer transition-all",
                          task.completed && "opacity-60 border-emerald-500/20")}>
                        <motion.div
                          animate={task.completed ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.25 }}
                          className={cn(
                            "w-[22px] h-[22px] rounded-md shrink-0 mt-0.5 flex items-center justify-center border-2 transition-colors",
                            task.completed ? "bg-emerald-500 border-emerald-500" : "border-glass-border"
                          )}
                        >
                          {task.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </motion.div>
                        <div>
                          <p className={cn("text-[13px] font-medium text-slate-200", task.completed && "line-through")}>
                            {task.label}
                            {task.required && <span className="text-gold ml-1">*</span>}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                {isSaving && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[10px] text-slate-500 mt-1.5">Sauvegarde...</motion.p>
                )}
              </motion.div>
            )}

            {/* Instructions */}
            {instructions && (
              <motion.div variants={fadeUp} className="mb-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-5 h-[2px] gold-gradient rounded-full" />
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">Instructions de depart</p>
                </div>
                <Card className="p-4">
                  {instructions.instructions ? (
                    <ul className="text-[13px] text-slate-400 leading-relaxed space-y-1 list-disc pl-5">
                      {instructions.instructions.map((instr, i) => <li key={i}>{instr}</li>)}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-slate-200">Depart avant {instructions.checkout_time || '11:00'}</p>
                  )}
                </Card>

                {instructions.garbage_info && (
                  <Card className="p-4 mt-2.5">
                    <p className="text-[10px] text-gold uppercase tracking-wider font-semibold mb-1">Tri des dechets</p>
                    <p className="text-[13px] text-slate-400 leading-relaxed whitespace-pre-wrap">{instructions.garbage_info}</p>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Checkout button */}
            {reservation?.status === 'checked_in' && (
              <motion.div variants={fadeUp}>
                <Button onClick={handleCheckout}
                  disabled={isCheckingOut || (!allCompleted && totalCount > 0)}
                  className="w-full h-11">
                  {isCheckingOut ? 'Confirmation...' : 'Confirmer le check-out'}
                </Button>

                {!allCompleted && totalCount > 0 && (
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    Completez toutes les taches pour confirmer votre depart.
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </main>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}
