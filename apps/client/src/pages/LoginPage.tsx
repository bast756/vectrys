import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const fadeUp = {
  initial: { opacity: 0, y: 24, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 220, damping: 24 } },
};

const container = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithBookingCode, requestMagicLink, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'booking' | 'magic'>('booking');
  const [email, setEmail] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [magicSent, setMagicSent] = useState(false);

  const handleBookingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithBookingCode(bookingCode);
      toast.success('Connexion reussie !');
      navigate('/terms');
    } catch {
      toast.error('Code de reservation invalide');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestMagicLink(email);
      setMagicSent(true);
      toast.success('Lien envoye ! Verifiez votre email.');
    } catch {
      toast.error('Impossible d\'envoyer le lien magique');
    }
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-void p-5 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/[0.03] blur-[120px]" />

      <motion.div variants={container} initial="initial" animate="animate" className="w-full max-w-[420px]">
        <Card className="gradient-border overflow-visible">
          <div className="absolute top-0 left-0 right-0 h-[2px] gold-gradient rounded-t-2xl" />
          <CardContent className="p-8">

            {/* Logo */}
            <motion.div variants={fadeUp} className="text-center mb-8">
              <img src="/brand/logo-stacked-white.png" alt="VECTRYS" className="h-20 mx-auto mb-3 object-contain" />
              <p className="text-xl font-light text-slate-100 font-display">Guest Portal</p>
            </motion.div>

            {/* Mode tabs */}
            <motion.div variants={fadeUp} className="flex rounded-xl overflow-hidden border border-glass-border mb-6 relative">
              <motion.div
                className="absolute top-0 bottom-0 w-1/2 bg-gold/12 border-y border-gold/20"
                animate={{ x: mode === 'booking' ? 0 : '100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
              <button
                onClick={() => { setMode('booking'); clearError(); setMagicSent(false); }}
                className="flex-1 py-2.5 text-xs font-semibold transition-colors cursor-pointer relative z-10 text-center"
                style={{ color: mode === 'booking' ? '#d4a853' : '#64748b' }}
              >
                Code reservation
              </button>
              <button
                onClick={() => { setMode('magic'); clearError(); }}
                className="flex-1 py-2.5 text-xs font-semibold transition-colors cursor-pointer border-l border-glass-border relative z-10 text-center"
                style={{ color: mode === 'magic' ? '#d4a853' : '#64748b' }}
              >
                Lien magique
              </button>
            </motion.div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </motion.div>
            )}

            {mode === 'booking' ? (
              <motion.form variants={fadeUp} onSubmit={handleBookingLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Code de reservation</label>
                  <Input
                    value={bookingCode} onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    required placeholder="VEC-XXXXX" maxLength={10}
                    className="text-xl font-bold text-center tracking-[4px] text-gold h-14"
                  />
                  <p className="text-[11px] text-slate-500 mt-2">Entrez le code recu par email ou SMS</p>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-11">
                  {isLoading ? 'Verification...' : 'Acceder a ma reservation'}
                </Button>
              </motion.form>
            ) : magicSent ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <span className="text-5xl block mb-3 animate-float">✉️</span>
                <p className="text-[15px] font-semibold text-slate-100">Email envoye !</p>
                <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">
                  Verifiez votre boite mail et cliquez sur le lien pour vous connecter.
                </p>
                <Button variant="ghost" onClick={() => setMagicSent(false)} className="mt-4 text-xs text-gold">
                  Renvoyer le lien
                </Button>
              </motion.div>
            ) : (
              <motion.form variants={fadeUp} onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Adresse email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@exemple.com" />
                  <p className="text-[11px] text-slate-500 mt-2">Recevez un lien de connexion par email</p>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-11">
                  {isLoading ? 'Envoi en cours...' : 'Recevoir le lien magique'}
                </Button>
              </motion.form>
            )}

            {/* Divider */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-glass-border" />
              <span className="text-[11px] text-slate-500">ou</span>
              <div className="flex-1 h-px bg-glass-border" />
            </motion.div>

            {/* Google */}
            <motion.div variants={fadeUp}>
              <Button variant="secondary" onClick={handleGoogleLogin} className="w-full gap-2.5 h-11">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continuer avec Google
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} className="text-center text-xs text-slate-500 mt-6">
              Pas encore de compte ? <Link to="/register" className="text-gold font-semibold hover:underline">Creer un compte</Link>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
