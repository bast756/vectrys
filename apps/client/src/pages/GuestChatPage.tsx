import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat, useBooking } from '@/store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SkeletonChat } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import { ArrowLeft, Send, Languages, Smile } from 'lucide-react';
import EmojiPicker from '@/components/guest/EmojiPicker';
import { cn } from '@/lib/utils';
import PullToRefresh from '@/components/guest/PullToRefresh';

const chatBubble = {
  initial: { opacity: 0, y: 12, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 22 } },
};

export default function GuestChatPage() {
  const navigate = useNavigate();
  const { fetchReservation } = useBooking();
  const { messages, isTyping, hostOnline, hostStatus, isLoading, wsConnected, fetchMessages, sendMessage, connectChat, disconnectChat } = useChat();
  const [text, setText] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [translatedIds, setTranslatedIds] = useState<Set<string>>(new Set());
  const [showEmojis, setShowEmojis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReservation().catch(() => {});
    fetchMessages();
    connectChat();
    return () => disconnectChat();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    try { await sendMessage(t); } catch { toast.error('Echec de l\'envoi'); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleEmojiSelect = (emoji: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      setText(newText);
      // Restore cursor position after emoji
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + emoji.length;
        ta.focus();
      });
    } else {
      setText(prev => prev + emoji);
    }
  };

  const toggleTranslation = (msgId: string) => {
    setTranslatedIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  return (
    <div className="h-screen bg-void flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3 border-b border-glass-border bg-obsidian/40 backdrop-blur-xl"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-100">
            {hostStatus?.hostName ? `Chat avec ${hostStatus.hostName}` : 'Chat'}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <motion.span
              animate={hostOnline ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={cn("w-[7px] h-[7px] rounded-full", hostOnline ? "bg-emerald-400" : "bg-slate-600")}
            />
            <span className="text-[11px] text-slate-500">
              {hostOnline
                ? `${hostStatus?.hostName || 'Hote'} en ligne`
                : hostStatus?.avgResponseMinutes
                  ? `${hostStatus.hostName} repond generalement en ${hostStatus.avgResponseMinutes < 60
                      ? `${hostStatus.avgResponseMinutes} min`
                      : `${Math.round(hostStatus.avgResponseMinutes / 60)}h`}`
                  : `${hostStatus?.hostName || 'Hote'} hors ligne`}
            </span>
            {wsConnected && (
              <span className="text-[9px] text-gold font-bold ml-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                LIVE
              </span>
            )}
          </div>
        </div>
      </motion.header>

      {/* Messages */}
      <PullToRefresh onRefresh={async () => { await fetchMessages(); }} className="flex-1 overflow-auto px-4 py-3">
        {isLoading ? (
          <SkeletonChat />
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center text-slate-500 py-16">
            <span className="text-5xl block mb-4 animate-float">💬</span>
            <p className="text-[14px] font-medium text-slate-400">Aucun message</p>
            <p className="text-[12px] text-slate-600 mt-1">Envoyez un message a votre hote !</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isGuest = msg.from === 'guest';
              const isSystem = msg.from === 'system';
              const showTranslated = translatedIds.has(msg.id) && msg.translatedContent;
              const displayText = showTranslated ? msg.translatedContent! : msg.text;

              return (
                <motion.div
                  key={msg.id}
                  variants={chatBubble}
                  initial="initial"
                  animate="animate"
                  layout
                  className={cn("flex mb-2.5", isSystem ? "justify-center" : isGuest ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[78%] px-4 py-2.5 backdrop-blur-md border",
                    isSystem
                      ? "rounded-lg bg-white/[0.03] border-transparent text-slate-500 text-[11px]"
                      : isGuest
                        ? "rounded-2xl rounded-br-sm bg-gradient-to-br from-gold/20 to-gold/8 border-gold/20 text-slate-100 text-sm"
                        : "rounded-2xl rounded-bl-sm glass text-slate-100 text-sm"
                  )}>
                    <p className="whitespace-pre-wrap leading-relaxed">{displayText}</p>
                    <div className={cn("flex items-center gap-2 mt-1", isGuest ? "justify-end" : "justify-start")}>
                      <p className={cn("text-[10px]", isGuest ? "text-gold/50" : "text-slate-600")}>
                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {isGuest && msg.read && <span className="text-gold ml-1">✓✓</span>}
                      </p>
                      {/* Translation toggle */}
                      {msg.translatedContent && !isSystem && (
                        <button
                          onClick={() => toggleTranslation(msg.id)}
                          className={cn(
                            "flex items-center gap-0.5 text-[9px] font-medium transition-colors cursor-pointer",
                            showTranslated ? "text-gold" : "text-slate-600 hover:text-slate-400"
                          )}
                        >
                          <Languages className="w-3 h-3" />
                          {showTranslated ? 'Original' : 'Traduire'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-2.5">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </PullToRefresh>

      {/* Input */}
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.2 }}
        className="relative px-4 pb-[84px] pt-3 border-t border-glass-border bg-obsidian/60 backdrop-blur-xl"
      >
        <EmojiPicker isOpen={showEmojis} onClose={() => setShowEmojis(false)} onSelect={handleEmojiSelect} />
        <div className="flex gap-2.5 items-end">
          <button
            onClick={() => setShowEmojis(prev => !prev)}
            className={cn(
              "h-[44px] w-[44px] shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
              showEmojis
                ? "bg-gold/15 border-gold/30 text-gold"
                : "border-glass-border bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:border-gold/20"
            )}
          >
            <Smile className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ecrivez votre message..." rows={1}
            className="flex-1 px-4 py-3 rounded-xl border border-glass-border bg-white/[0.03] text-sm text-slate-100 resize-none outline-none focus:border-gold/50 max-h-[120px] min-h-[44px] transition-colors"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim()}
            size="icon"
            className={cn("h-[44px] w-[44px] shrink-0 transition-all", !text.trim() && "opacity-30")}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}
