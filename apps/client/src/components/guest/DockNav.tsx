import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingBag, MessageCircle, MapPin, Menu, Sun, Bus, Wifi, CheckCircle, ScrollText } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { dockOverlay, dockMenu, dockItem } from '@/lib/motion';
import BrandIcon from '@/components/ui/BrandIcon';

const DOCK_ITEMS = [
  { path: '/', label: 'Accueil', icon: Home },
  { path: '/services', label: 'Services', icon: ShoppingBag, badgeKey: 'pendingOrderCount' as const },
  { path: '/chat', label: 'Chat', icon: MessageCircle, badgeKey: 'unreadMessageCount' as const },
  { path: '/guide', label: 'Guide', icon: MapPin },
  { path: '/more', label: 'Plus', icon: Menu },
];

const MORE_ITEMS = [
  { path: '/weather', label: 'Météo', icon: Sun },
  { path: '/transport', label: 'Transport', icon: Bus },
  { path: '/wifi', label: 'Wi-Fi', icon: Wifi },
  { path: '/rules', label: 'Règlement', icon: ScrollText },
  { path: '/checkout-checklist', label: 'Checkout', icon: CheckCircle },
];

interface DockNavProps {
  showMore?: boolean;
  onToggleMore?: () => void;
}

export default function DockNav({ showMore, onToggleMore }: DockNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadMessageCount = useStore((s) => s.unreadMessageCount);
  const pendingOrderCount = useStore((s) => s.pendingOrderCount);

  const badges: Record<string, number> = {
    unreadMessageCount,
    pendingOrderCount,
  };

  const handleClick = (path: string) => {
    if (path === '/more') { onToggleMore?.(); } else { navigate(path); }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/more') return showMore || MORE_ITEMS.some(m => location.pathname === m.path);
    return location.pathname === path;
  };

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              variants={dockOverlay} initial="initial" animate="animate" exit="exit"
              onClick={onToggleMore}
              className="fixed inset-0 bg-void/60 backdrop-blur-sm z-[998]"
            />
            <motion.div
              variants={dockMenu} initial="initial" animate="animate" exit="exit"
              className="fixed bottom-[76px] left-4 right-4 z-[999] glass rounded-2xl p-2.5 grid grid-cols-2 gap-2"
            >
              {MORE_ITEMS.map(({ path, label, icon: Icon }, i) => (
                <motion.button
                  key={path}
                  custom={i}
                  variants={dockItem}
                  initial="initial"
                  animate="animate"
                  onClick={() => { navigate(path); onToggleMore?.(); }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-3.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer",
                    location.pathname === path
                      ? "bg-gold/12 border border-gold/30 text-gold"
                      : "bg-white/[0.03] border border-glass-border text-slate-200 hover:bg-white/[0.06]"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  {label}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dock bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[1000] px-3 pb-2" style={{ background: 'linear-gradient(to top, rgba(5,8,13,0.98) 60%, transparent 100%)' }}>
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
          className="flex justify-around items-center glass rounded-[20px] py-2 px-1"
        >
          {DOCK_ITEMS.map(({ path, label, icon: Icon, badgeKey }) => {
            const active = isActive(path);
            const badgeCount = badgeKey ? badges[badgeKey] || 0 : 0;
            return (
              <motion.button
                key={path}
                onClick={() => handleClick(path)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={cn(
                  "flex flex-col items-center gap-0.5 min-w-[56px] rounded-[14px] py-2 px-3 transition-all duration-200 cursor-pointer border relative",
                  active
                    ? "bg-gold/15 border-gold/25"
                    : "bg-transparent border-transparent hover:bg-white/[0.04]"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="dock-active"
                    className="absolute inset-0 bg-gold/15 border border-gold/25 rounded-[14px]"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
                <div className="relative">
                  <BrandIcon icon={Icon} active={active} size={20} />
                  {/* Badge */}
                  {badgeCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 z-20"
                    >
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </motion.span>
                  )}
                </div>
                <span className={cn("text-[10px] relative z-10", active ? "font-semibold text-gold" : "text-slate-500")}>
                  {label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </nav>
    </>
  );
}
