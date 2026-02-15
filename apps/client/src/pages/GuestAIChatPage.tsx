import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking, useStore } from '@/store';
import { aiChatApi } from '@/api/endpoints';
import { ArrowLeft, Send, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DockNav from '@/components/guest/DockNav';
import { cn } from '@/lib/utils';

const chatBubble = {
  initial: { opacity: 0, y: 12, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 22 } },
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const DEFAULT_SUGGESTIONS = [
  '📶 Comment se connecter au WiFi ?',
  '🔑 Comment accéder au logement ?',
  '🍽️ Restaurants recommandés ?',
  '🚇 Transports à proximité ?',
];

export default function GuestAIChatPage() {
  const navigate = useNavigate();
  const { reservation, fetchReservation } = useBooking();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [showMore, setShowMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const propertyName = reservation?.property?.name || 'Votre logement';

  useEffect(() => {
    fetchReservation().catch(() => {});
  }, []);

  // Welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Bonjour ! 👋 Je suis votre concierge IA pour ${propertyName}. Posez-moi n'importe quelle question sur le logement, le quartier ou votre séjour.`,
      timestamp: new Date().toISOString(),
    }]);
  }, [propertyName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const sendMessage = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: t,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const conversationHistory = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    // Try streaming first
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const token = useStore.getState().tokens?.access_token;

    try {
      setIsStreaming(true);
      setStreamingText('');

      const response = await fetch(`${apiUrl}/guest-portal/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: t,
          reservationId: reservation?.id,
          language: 'fr',
          conversationHistory,
        }),
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.type === 'chunk') {
                fullText += data.text;
                setStreamingText(fullText);
              } else if (data.type === 'done' && data.suggestions?.length > 0) {
                setSuggestions(data.suggestions);
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fullText || 'Je n\'ai pas pu générer de réponse.',
        timestamp: new Date().toISOString(),
      }]);
      setStreamingText('');
    } catch {
      // Fallback: non-streaming
      try {
        const res = await aiChatApi.sendMessage(t, reservation?.id, 'fr', conversationHistory);
        const data = res.data.data;
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        }]);
        if (data.suggestions?.length > 0) setSuggestions(data.suggestions);
      } catch {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '❌ Erreur de connexion. Veuillez réessayer.',
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [messages, isLoading, reservation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="h-screen bg-void flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3 border-b border-glass-border bg-obsidian/40 backdrop-blur-xl shrink-0"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1">
          <h1 className="text-[15px] font-semibold text-slate-100">Concierge IA</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isStreaming ? (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> Repond...
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">{propertyName} &bull; Disponible 24/7</span>
            )}
          </div>
        </div>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              variants={chatBubble}
              initial="initial"
              animate="animate"
              layout
              className={cn('flex mb-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div className={cn(
                'max-w-[80%] px-4 py-2.5 backdrop-blur-md border',
                msg.role === 'user'
                  ? 'rounded-2xl rounded-br-sm bg-gradient-to-br from-gold/20 to-gold/8 border-gold/20 text-slate-100 text-sm'
                  : 'rounded-2xl rounded-bl-sm glass text-slate-100 text-sm'
              )}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p className={cn('text-[10px] mt-1', msg.role === 'user' ? 'text-gold/50 text-right' : 'text-slate-600')}>
                  {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming bubble */}
        {isStreaming && streamingText && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-2.5">
            <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-sm glass text-slate-100 text-sm">
              <p className="whitespace-pre-wrap leading-relaxed">
                {streamingText}
                <span className="inline-block w-0.5 h-4 bg-gold ml-0.5 animate-pulse align-text-bottom" />
              </p>
            </div>
          </motion.div>
        )}

        {/* Typing dots */}
        {isLoading && !streamingText && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-2.5">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length <= 2 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-4 pb-2 flex flex-wrap gap-2 shrink-0"
        >
          {suggestions.slice(0, 4).map((s, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage(s)}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl border border-glass-border bg-white/[0.03] text-[12px] text-slate-400 hover:text-gold hover:border-gold/20 transition-colors cursor-pointer whitespace-nowrap"
            >
              {s}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Input */}
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.2 }}
        className="px-4 pb-[84px] pt-3 border-t border-glass-border bg-obsidian/60 backdrop-blur-xl flex gap-2.5 items-center shrink-0"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl border border-glass-border bg-white/[0.03] text-sm text-slate-100 outline-none focus:border-gold/50 transition-colors"
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          size="icon"
          className={cn('h-[44px] w-[44px] shrink-0 transition-all', (!input.trim() || isLoading) && 'opacity-30')}
        >
          <Send className="w-4 h-4" />
        </Button>
      </motion.div>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </div>
  );
}
