import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { journalApi } from '@/api/endpoints';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pin, Edit3, Trash2, X, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SkeletonList } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
};

type EntryType = 'note' | 'memory' | 'tip' | 'checklist' | 'highlight';
type Mood = 'happy' | 'excited' | 'relaxed' | 'adventurous' | 'neutral' | 'sad';

const TYPE_CONFIG: Record<EntryType, { label: string; emoji: string; color: string }> = {
  note: { label: 'Note', emoji: '📝', color: 'text-slate-400' },
  memory: { label: 'Souvenir', emoji: '📸', color: 'text-gold' },
  tip: { label: 'Bon plan', emoji: '💡', color: 'text-emerald-400' },
  checklist: { label: 'Checklist', emoji: '✅', color: 'text-cyan-400' },
  highlight: { label: 'Moment fort', emoji: '⭐', color: 'text-amber-400' },
};

const MOOD_CONFIG: Record<Mood, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: 'Content' },
  excited: { emoji: '🤩', label: 'Excite' },
  relaxed: { emoji: '😌', label: 'Detendu' },
  adventurous: { emoji: '🤠', label: 'Aventurier' },
  neutral: { emoji: '😐', label: 'Neutre' },
  sad: { emoji: '😢', label: 'Triste' },
};

interface JournalEntry {
  id: string;
  type: EntryType;
  title: string;
  content: string;
  emoji: string;
  mood: Mood | null;
  photos: string[];
  tags: string[];
  pinned: boolean;
  createdAt: string;
  reservation?: {
    id: string;
    code: string;
    checkIn: string;
    checkOut: string;
    property: { name: string; city: string; country: string; imageUrls: string[] };
  } | null;
}

interface TripSummary {
  id: string;
  code: string;
  property: { id: string; name: string; city: string; country: string; imageUrls: string[] };
  checkIn: string;
  checkOut: string;
  status: string;
  notesCount: number;
  hasRating: boolean;
}

export default function GuestJournalPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [filterType, setFilterType] = useState<EntryType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showMore, setShowMore] = useState(false);

  // Editor state
  const [edType, setEdType] = useState<EntryType>('note');
  const [edTitle, setEdTitle] = useState('');
  const [edContent, setEdContent] = useState('');
  const [edEmoji, setEdEmoji] = useState('📝');
  const [edMood, setEdMood] = useState<Mood | null>(null);
  const [edTags, setEdTags] = useState('');
  const [edPinned, setEdPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await journalApi.getEntries(filterType !== 'all' ? filterType : undefined);
      setEntries(res.data.data || []);
    } catch {
      toast.error('Erreur chargement du carnet');
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await journalApi.getTrips();
      setTrips(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchEntries(); fetchTrips(); }, [fetchEntries, fetchTrips]);

  const resetEditor = () => {
    setShowEditor(false);
    setEditingEntry(null);
    setEdType('note');
    setEdTitle('');
    setEdContent('');
    setEdEmoji('📝');
    setEdMood(null);
    setEdTags('');
    setEdPinned(false);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEdType(entry.type);
    setEdTitle(entry.title);
    setEdContent(entry.content);
    setEdEmoji(entry.emoji);
    setEdMood(entry.mood);
    setEdTags(entry.tags.join(', '));
    setEdPinned(entry.pinned);
    setShowEditor(true);
  };

  const saveEntry = async () => {
    if (!edContent.trim()) return;
    setIsSaving(true);
    try {
      const data = {
        type: edType,
        title: edTitle,
        content: edContent,
        emoji: edEmoji,
        mood: edMood,
        tags: edTags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (editingEntry) {
        await journalApi.updateEntry(editingEntry.id, { ...data, pinned: edPinned });
      } else {
        await journalApi.createEntry(data);
      }
      toast.success(editingEntry ? 'Entree modifiee' : 'Entree ajoutee');
      resetEditor();
      fetchEntries();
    } catch {
      toast.error('Erreur sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await journalApi.deleteEntry(id);
      toast.success('Entree supprimee');
      fetchEntries();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const pinnedEntries = entries.filter(e => e.pinned);
  const otherEntries = entries.filter(e => !e.pinned);

  return (
    <div className="min-h-screen bg-void pb-28">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="px-4 pt-3 pb-2"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Carnet de Voyage</h1>
            <p className="text-[11px] text-slate-500">
              {entries.length} entree{entries.length !== 1 ? 's' : ''} &bull; {trips.length} sejour{trips.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </motion.header>

      <Tabs defaultValue="journal">
        <TabsList>
          <TabsTrigger value="journal">📝 Journal</TabsTrigger>
          <TabsTrigger value="trips">✈️ Mes Sejours</TabsTrigger>
        </TabsList>

        <main className="max-w-3xl mx-auto px-4">
          {/* JOURNAL TAB */}
          <TabsContent value="journal">
            {/* Filters */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 mb-3">
              {(['all', ...Object.keys(TYPE_CONFIG)] as const).map(type => {
                const conf = type === 'all' ? null : TYPE_CONFIG[type as EntryType];
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type as EntryType | 'all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer border',
                      filterType === type
                        ? 'bg-gold/15 border-gold/30 text-gold'
                        : 'bg-white/[0.03] border-glass-border text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {type === 'all' ? '🔮 Tout' : `${conf!.emoji} ${conf!.label}`}
                  </button>
                );
              })}
            </motion.div>

            {/* New Entry Button */}
            <motion.button
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEditor(true)}
              className="w-full py-3.5 mb-4 rounded-xl border border-dashed border-gold/20 bg-gold/5 text-gold text-[13px] font-semibold hover:bg-gold/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle entree
            </motion.button>

            {isLoading ? (
              <SkeletonList count={3} />
            ) : entries.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                <span className="text-5xl block mb-4 animate-float">📔</span>
                <p className="text-[14px] font-medium text-slate-400">Votre carnet est vide</p>
                <p className="text-[12px] text-slate-600 mt-1">Notez vos impressions, bons plans et souvenirs</p>
              </motion.div>
            ) : (
              <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
                {/* Pinned */}
                {pinnedEntries.length > 0 && (
                  <>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Epinglees
                    </p>
                    {pinnedEntries.map(entry => (
                      <JournalCard key={entry.id} entry={entry} onEdit={startEdit} onDelete={deleteEntry} />
                    ))}
                  </>
                )}
                {otherEntries.map(entry => (
                  <JournalCard key={entry.id} entry={entry} onEdit={startEdit} onDelete={deleteEntry} />
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* TRIPS TAB */}
          <TabsContent value="trips">
            {trips.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <span className="text-5xl block mb-4 animate-float">✈️</span>
                <p className="text-[14px] font-medium text-slate-400">Aucun sejour</p>
                <p className="text-[12px] text-slate-600 mt-1">Vos sejours apparaitront ici</p>
              </motion.div>
            ) : (
              <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
                {trips.map(trip => (
                  <motion.div key={trip.id} variants={fadeUp}>
                    <Card className="p-4 cursor-pointer hover:ring-1 hover:ring-gold/20 transition-all" onClick={() => navigate('/')}>
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-glass-border flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                          {trip.property.imageUrls?.[0] ? (
                            <img src={trip.property.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Plane className="w-6 h-6 text-slate-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-slate-100">{trip.property.name}</p>
                          <p className="text-[12px] text-slate-500">{trip.property.city}, {trip.property.country}</p>
                          <p className="text-[11px] text-slate-600 mt-1">
                            {new Date(trip.checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            {' → '}
                            {new Date(trip.checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right text-[11px] text-slate-600 shrink-0">
                          <span className={cn(
                            'inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold mb-1',
                            trip.status === 'CHECKED_IN' ? 'bg-emerald-400/15 text-emerald-400'
                              : trip.status === 'CONFIRMED' ? 'bg-cyan-400/15 text-cyan-400'
                              : 'bg-slate-500/15 text-slate-500'
                          )}>
                            {trip.status === 'CHECKED_IN' ? 'En cours' : trip.status === 'CONFIRMED' ? 'Confirme' : trip.status === 'CHECKED_OUT' ? 'Termine' : trip.status}
                          </span>
                          <p>📝 {trip.notesCount} notes</p>
                          {trip.hasRating && <p>⭐ Evalue</p>}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </main>
      </Tabs>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center"
            onClick={e => e.target === e.currentTarget && resetEditor()}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-lg max-h-[85vh] bg-surface rounded-t-2xl p-5 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-slate-100">
                  {editingEntry ? 'Modifier' : 'Nouvelle entree'}
                </h3>
                <button onClick={resetEditor} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Type selector */}
              <div className="flex gap-2 flex-wrap mb-4">
                {(Object.entries(TYPE_CONFIG) as [EntryType, typeof TYPE_CONFIG[EntryType]][]).map(([type, conf]) => (
                  <button
                    key={type}
                    onClick={() => { setEdType(type); setEdEmoji(conf.emoji); }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer border',
                      edType === type
                        ? 'bg-gold/15 border-gold/30 text-gold'
                        : 'border-glass-border text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {conf.emoji} {conf.label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <input
                value={edTitle} onChange={e => setEdTitle(e.target.value)}
                placeholder="Titre (optionnel)"
                className="w-full px-4 py-2.5 rounded-xl border border-glass-border bg-white/[0.03] text-sm text-slate-100 outline-none focus:border-gold/50 mb-3"
              />

              {/* Content */}
              <textarea
                value={edContent} onChange={e => setEdContent(e.target.value)}
                placeholder="Ecrivez ici..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-glass-border bg-white/[0.03] text-sm text-slate-100 outline-none focus:border-gold/50 resize-vertical mb-3 leading-relaxed"
              />

              {/* Mood */}
              <p className="text-[11px] text-slate-600 mb-2 font-semibold">Humeur</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([m, conf]) => (
                  <button
                    key={m}
                    onClick={() => setEdMood(edMood === m ? null : m)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer border',
                      edMood === m
                        ? 'bg-gold/15 border-gold/30 text-gold'
                        : 'border-glass-border text-slate-500'
                    )}
                  >
                    {conf.emoji} {conf.label}
                  </button>
                ))}
              </div>

              {/* Tags */}
              <input
                value={edTags} onChange={e => setEdTags(e.target.value)}
                placeholder="Tags separes par des virgules"
                className="w-full px-4 py-2.5 rounded-xl border border-glass-border bg-white/[0.03] text-[13px] text-slate-100 outline-none focus:border-gold/50 mb-3"
              />

              {/* Pin */}
              <label className="flex items-center gap-2 mb-5 cursor-pointer text-[13px] text-slate-400">
                <input
                  type="checkbox" checked={edPinned} onChange={e => setEdPinned(e.target.checked)}
                  className="accent-gold"
                />
                <Pin className="w-3 h-3" /> Epingler cette entree
              </label>

              {/* Save */}
              <Button
                onClick={saveEntry}
                disabled={!edContent.trim() || isSaving}
                className="w-full"
              >
                {editingEntry ? 'Enregistrer' : 'Ajouter au carnet'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}

// ── Journal Card ────────────────────────────────
function JournalCard({ entry, onEdit, onDelete }: { entry: JournalEntry; onEdit: (e: JournalEntry) => void; onDelete: (id: string) => void }) {
  const [showActions, setShowActions] = useState(false);
  const conf = TYPE_CONFIG[entry.type] || TYPE_CONFIG.note;

  return (
    <motion.div variants={fadeUp}>
      <Card className={cn('p-3.5 relative', entry.pinned && 'ring-1 ring-gold/15')}>
        {/* Type + Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{entry.emoji}</span>
            {entry.title && <span className="text-[14px] font-semibold text-slate-100">{entry.title}</span>}
            <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.05]', conf.color)}>
              {conf.label}
            </span>
            {entry.pinned && <Pin className="w-3 h-3 text-gold" />}
          </div>
          <div className="relative">
            <button onClick={() => setShowActions(!showActions)} className="text-slate-600 hover:text-slate-300 cursor-pointer px-1">⋯</button>
            {showActions && (
              <div className="absolute right-0 top-7 bg-elevated border border-glass-border rounded-xl p-1 z-10 min-w-[120px] shadow-xl">
                <button
                  onClick={() => { onEdit(entry); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-300 hover:bg-white/[0.04] rounded-lg cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Modifier
                </button>
                <button
                  onClick={() => { onDelete(entry.id); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-white/[0.04] rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reservation info */}
        {entry.reservation && (
          <p className="text-[11px] text-slate-600 mt-1">
            🏠 {entry.reservation.property.name} — {entry.reservation.property.city}
          </p>
        )}

        {/* Content */}
        <p className="text-[13px] text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap line-clamp-4">{entry.content}</p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1.5 flex-wrap">
            {entry.mood && (
              <span className="text-[10px] text-slate-500">
                {MOOD_CONFIG[entry.mood]?.emoji} {MOOD_CONFIG[entry.mood]?.label}
              </span>
            )}
            {entry.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-slate-600">#{tag}</span>
            ))}
          </div>
          <span className="text-[10px] text-slate-600">
            {new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
