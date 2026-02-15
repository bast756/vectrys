import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices, useBooking } from '@/store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SkeletonList } from '@/components/ui/skeleton';
import DockNav from '@/components/guest/DockNav';
import { StripePaymentSheet } from '@/components/guest/StripePaymentSheet';
import { ArrowLeft, Minus, Plus, X, ShoppingBag, CreditCard, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import PullToRefresh from '@/components/guest/PullToRefresh';
import { SERVICE_ICONS } from '@/components/icons/ServiceIcons';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};

const CAT_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: 'Petit-dej', emoji: '🥐' }, cleaning: { label: 'Menage', emoji: '🧹' },
  grocery: { label: 'Courses', emoji: '🛒' }, transport: { label: 'Transport', emoji: '🚗' },
  experience: { label: 'Experiences', emoji: '🎭' }, equipment: { label: 'Equipement', emoji: '🔧' },
  minibar: { label: 'Minibar', emoji: '🍷' }, other: { label: 'Autres', emoji: '📦' },
};

// Order status timeline
const STATUS_STEPS = [
  { key: 'pending', label: 'En attente', icon: '⏳' },
  { key: 'confirmed', label: 'Confirmee', icon: '✅' },
  { key: 'preparing', label: 'Preparation', icon: '👨‍🍳' },
  { key: 'delivered', label: 'Livree', icon: '📦' },
] as const;

function OrderTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-red-400 text-[11px] font-medium">Commande annulee</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 mt-3">
      {STATUS_STEPS.map((step, i) => {
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <motion.div
              initial={false}
              animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] border transition-colors",
                isActive
                  ? "bg-gold/20 border-gold/40 text-gold"
                  : "bg-white/[0.03] border-glass-border text-slate-600"
              )}
            >
              {step.icon}
            </motion.div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={cn(
                "w-4 h-0.5 rounded-full transition-colors",
                i < currentIdx ? "bg-gold/40" : "bg-white/[0.06]"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function GuestServicesPage() {
  const navigate = useNavigate();
  const { fetchReservation } = useBooking();
  const {
    catalog, cart, orders, isLoading, cartTotal, cartCount,
    paymentClientSecret, pendingOrderId,
    fetchCatalog, addToCart, removeFromCart, updateCartQuantity, clearCart,
    placeOrder, confirmPayment, clearPayment, fetchOrders, cancelOrder,
  } = useServices();
  const [tab, setTab] = useState('catalog');
  const [filter, setFilter] = useState('all');
  const [showMore, setShowMore] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchReservation().then(() => { fetchCatalog(); fetchOrders(); }).catch(() => {});
  }, []);

  // Auto-poll orders every 30s
  useEffect(() => {
    if (tab !== 'orders') return;
    const interval = setInterval(() => fetchOrders(), 30000);
    return () => clearInterval(interval);
  }, [tab]);

  const categories = ['all', ...new Set(catalog.map((s) => s.category))];
  const filtered = filter === 'all' ? catalog : catalog.filter((s) => s.category === filter);
  const getCartQty = (id: string) => cart.find((c) => c.service.id === id)?.quantity || 0;

  const handleOrder = async () => {
    setIsProcessing(true);
    try {
      const result = await placeOrder();
      if (result) {
        if (result.clientSecret) {
          setShowPayment(true);
          toast.info('Veuillez proceder au paiement');
        } else {
          toast.success('Commande passee avec succes !');
          setTab('orders');
        }
      }
    } catch { toast.error('Erreur lors de la commande'); }
    setIsProcessing(false);
  };

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    if (!pendingOrderId) return;
    try {
      await confirmPayment(pendingOrderId, paymentIntentId);
      toast.success('Paiement reussi ! Commande confirmee.');
      setShowPayment(false);
      clearPayment();
      setTab('orders');
      fetchOrders();
    } catch {
      toast.error('Erreur de confirmation du paiement');
    }
  }, [pendingOrderId, confirmPayment, clearPayment, fetchOrders]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      toast.success('Commande annulee');
    } catch {
      toast.error('Impossible d\'annuler la commande');
    }
  };

  const QtyBtn = ({ icon: Icon, onClick }: { icon: typeof Plus; onClick: () => void }) => (
    <motion.button whileTap={{ scale: 0.85 }} onClick={onClick}
      className="w-7 h-7 rounded-full border border-glass-border bg-glass flex items-center justify-center text-slate-300 hover:text-gold hover:border-gold/30 transition-colors cursor-pointer">
      <Icon className="w-3.5 h-3.5" />
    </motion.button>
  );

  return (
    <PullToRefresh onRefresh={async () => { await fetchOrders(); await fetchCatalog(); }} className="min-h-screen bg-void pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}
        className="flex items-center gap-3 px-4 py-3"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-base font-semibold text-slate-100 flex-1">Services</h1>
        {cartCount > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}>
            <Button size="sm" onClick={() => setTab('cart')} className="gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> {cartCount}
            </Button>
          </motion.div>
        )}
      </motion.header>

      {/* Stripe Payment Sheet */}
      {showPayment && paymentClientSecret && pendingOrderId && (
        <StripePaymentSheet
          clientSecret={paymentClientSecret}
          orderId={pendingOrderId}
          amount={cartTotal}
          onSuccess={handlePaymentSuccess}
          onCancel={() => { setShowPayment(false); clearPayment(); }}
        />
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="catalog">Catalogue</TabsTrigger>
          <TabsTrigger value="cart">Panier ({cartCount})</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
        </TabsList>

        <main className="max-w-3xl mx-auto px-4">
          {/* CATALOG */}
          <TabsContent value="catalog">
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {categories.map((cat) => (
                <motion.button key={cat} whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer border backdrop-blur-sm",
                    filter === cat
                      ? "border-gold text-gold bg-gold/15"
                      : "border-glass-border text-slate-400 bg-glass hover:text-slate-200"
                  )}>
                  {cat === 'all' ? 'Tous' : CAT_LABELS[cat]?.label || cat}
                </motion.button>
              ))}
            </div>

            {isLoading ? (
              <SkeletonList count={4} />
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 py-12">
                <span className="text-4xl block mb-3 animate-float">🛍️</span>
                <p className="text-[13px]">Aucun service disponible.</p>
              </motion.div>
            ) : (
              <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
                {filtered.map((svc) => {
                  const qty = getCartQty(svc.id);
                  return (
                    <motion.div key={svc.id} variants={fadeUp} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Card className="flex items-center gap-3.5 p-3.5">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-glass-border flex items-center justify-center shrink-0">
                          {SERVICE_ICONS[svc.category]
                            ? SERVICE_ICONS[svc.category]({ size: 24, className: 'text-gold/70' })
                            : <span className="text-xl">{CAT_LABELS[svc.category]?.emoji || '📦'}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-100 truncate">{svc.name}</p>
                          <p className="text-xs text-slate-500 truncate">{svc.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-gold">{(svc.price ?? 0).toFixed(2)}€</p>
                          {qty === 0 ? (
                            <motion.div whileTap={{ scale: 0.9 }}>
                              <Button variant="gold" size="sm" onClick={() => addToCart(svc)} className="mt-1.5 text-[11px]">Ajouter</Button>
                            </motion.div>
                          ) : (
                            <div className="flex items-center gap-2 mt-1.5">
                              <QtyBtn icon={Minus} onClick={() => updateCartQuantity(svc.id, qty - 1)} />
                              <span className="text-sm font-bold text-gold w-5 text-center">{qty}</span>
                              <QtyBtn icon={Plus} onClick={() => updateCartQuantity(svc.id, qty + 1)} />
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </TabsContent>

          {/* CART */}
          <TabsContent value="cart">
            {cart.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center text-slate-500 py-12">
                <span className="text-5xl block mb-4 animate-float">🛒</span>
                <p className="text-[14px] font-medium text-slate-400">Panier vide</p>
                <p className="text-[12px] text-slate-600 mt-1">Ajoutez des services depuis le catalogue</p>
              </motion.div>
            ) : (
              <motion.div variants={stagger} initial="initial" animate="animate">
                <div className="space-y-2.5 mb-5">
                  <AnimatePresence>
                    {cart.map(({ service: svc, quantity }) => (
                      <motion.div key={svc.id} variants={fadeUp} exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }} layout>
                        <Card className="flex items-center gap-3 p-3.5">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-100">{svc.name}</p>
                            <p className="text-xs text-slate-500">{(svc.price ?? 0).toFixed(2)}€ x {quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <QtyBtn icon={Minus} onClick={() => updateCartQuantity(svc.id, quantity - 1)} />
                            <span className="text-sm font-bold text-gold w-5 text-center">{quantity}</span>
                            <QtyBtn icon={Plus} onClick={() => updateCartQuantity(svc.id, quantity + 1)} />
                          </div>
                          <p className="text-sm font-bold text-gold min-w-[55px] text-right">{((svc.price ?? 0) * quantity).toFixed(2)}€</p>
                          <motion.button whileTap={{ scale: 0.8 }} onClick={() => removeFromCart(svc.id)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer">
                            <X className="w-4 h-4" />
                          </motion.button>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <motion.div variants={fadeUp}>
                  <Card className="p-4 gradient-border">
                    <div className="flex justify-between mb-4">
                      <span className="text-[15px] font-semibold text-slate-100">Total</span>
                      <span className="text-xl font-bold text-gold">{cartTotal.toFixed(2)}€</span>
                    </div>
                    <Button onClick={handleOrder} disabled={isProcessing} className="w-full h-11 gap-2">
                      <CreditCard className="w-4 h-4" />
                      {isProcessing ? 'Traitement...' : `Payer ${cartTotal.toFixed(2)}€`}
                    </Button>
                    <Button variant="ghost" onClick={clearCart} className="w-full mt-2 text-red-400 text-xs">Vider le panier</Button>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </TabsContent>

          {/* ORDERS */}
          <TabsContent value="orders">
            {orders.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 py-12">
                <span className="text-4xl block mb-3 animate-float">📋</span>
                <p className="text-[13px]">Aucune commande pour l'instant.</p>
              </motion.div>
            ) : (
              <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
                {orders.map((order) => {
                  const sMap: Record<string, { variant: 'warning' | 'info' | 'success' | 'danger' | 'muted'; label: string }> = {
                    pending: { variant: 'warning', label: 'En attente' },
                    confirmed: { variant: 'info', label: 'Confirmee' },
                    preparing: { variant: 'muted', label: 'En preparation' },
                    delivered: { variant: 'success', label: 'Livree' },
                    cancelled: { variant: 'danger', label: 'Annulee' },
                  };
                  const s = sMap[order.status] || sMap.pending;
                  return (
                    <motion.div key={order.id} variants={fadeUp}>
                      <Card className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] text-slate-500">{new Date(order.created_at).toLocaleString('fr-FR')}</span>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </div>
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between py-1 text-[13px]">
                            <span className="text-slate-200">{item.service?.name || 'Service'} x{item.quantity}</span>
                            <span className="text-slate-500 font-medium">{(item.total_price ?? 0).toFixed(2)}€</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 mt-2 border-t border-glass-border">
                          <span className="text-[13px] font-semibold text-slate-200">Total</span>
                          <span className="text-sm font-bold text-gold">{(order.total_amount ?? 0).toFixed(2)}€</span>
                        </div>

                        {/* Order Timeline */}
                        <OrderTimeline status={order.status} />

                        {/* Cancel button for pending orders */}
                        {order.status === 'pending' && (
                          <motion.div whileTap={{ scale: 0.98 }} className="mt-3">
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium hover:text-red-300 transition-colors cursor-pointer"
                            >
                              <Ban className="w-3 h-3" /> Annuler la commande
                            </button>
                          </motion.div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </TabsContent>
        </main>
      </Tabs>

      <DockNav showMore={showMore} onToggleMore={() => setShowMore(!showMore)} />
    </PullToRefresh>
  );
}
