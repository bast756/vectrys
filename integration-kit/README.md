# 📦 VECTRYS Integration Kit

Kit d'intégration complet pour connecter le **Guest Portal React** au **Backend Express/Prisma**.

---

## ✅ Contenu du Kit

```
vectrys-integration-kit/
├── index.ts                 ← Barrel exports (point d'entrée unique)
├── MIGRATION_GUIDE.ts       ← Guide migration écran par écran (COMMENCER ICI!)
├── README.md                ← Ce fichier
│
├── types/
│   └── index.ts             ← 40+ types TypeScript (User, Reservation, Service, etc.)
│
├── api/
│   ├── client.ts            ← Axios client avec JWT auto-refresh
│   ├── endpoints.ts         ← 50+ endpoints typés (auth, booking, services, chat, AI...)
│   └── websocket.ts         ← Socket.io client pour chat temps réel
│
├── hooks/
│   └── index.ts             ← useWeather, useTransport, useNotifications, useAIChat, useTTS...
│
└── store/
    └── index.ts             ← Zustand store (useAuth, useBooking, useServices, useChat, useUI)
```

---

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install zustand axios socket.io-client
```

### 2. Copier le kit dans votre projet

```bash
# Option A: Copier le dossier complet
cp -r vectrys-integration-kit/ /path/to/your/project/src/

# Option B: Copier dans un sous-dossier (recommandé)
cp -r vectrys-integration-kit/ /path/to/your/project/src/lib/vectrys/
```

### 3. Configurer les variables d'environnement

Créer ou mettre à jour `.env` :

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
VITE_GOOGLE_MAPS_KEY=AIza_xxx
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 🎯 Démarrage Rapide

### Étape 1: Initialiser l'app au démarrage

```tsx
// App.tsx ou main.tsx
import { useInitApp } from '@/lib/vectrys/hooks';

export default function App() {
  const { ready, isAuthenticated } = useInitApp();

  if (!ready) {
    return <SplashScreen />;
  }

  return <Router>{/* Vos routes */}</Router>;
}
```

### Étape 2: Utiliser les hooks dans vos composants

```tsx
// OnboardingScreen.tsx
import { useAuth, useUI } from '@/lib/vectrys/store';

export default function OnboardingScreen() {
  const { loginWithBookingCode, isLoading, error } = useAuth();
  const { navigate } = useUI();

  const handleLogin = async (code: string) => {
    try {
      await loginWithBookingCode(code);
      navigate('home');
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleLogin(bookingCode); }}>
      {/* Votre UI */}
    </form>
  );
}
```

### Étape 3: Afficher les données de la réservation

```tsx
// HomeScreen.tsx
import { useEffect } from 'react';
import { useBooking } from '@/lib/vectrys/store';

export default function HomeScreen() {
  const { reservation, isLoading, fetchReservation } = useBooking();

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  if (isLoading) return <Spinner />;
  if (!reservation) return <p>Aucune réservation</p>;

  return (
    <div>
      <h1>Bienvenue à {reservation.property.name}</h1>
      <p>Check-in: {reservation.check_in_date}</p>
      <p>Check-out: {reservation.check_out_date}</p>
    </div>
  );
}
```

---

## 📖 Guide de Migration (IMPORTANT!)

**Lisez le fichier `MIGRATION_GUIDE.ts`** pour voir comment migrer chaque écran du Guest Portal pas à pas.

### Ordre recommandé:

1. **🔴 Onboarding** (Auth) - BLOQUANT
2. **🔴 Terms** (CGU/CGV) - BLOQUANT
3. **🔴 Home** - BLOQUANT
4. **🟡 Rules** - IMPORTANT
5. **🟢 WiFi** - SIMPLE
6. **🟡 Services** - IMPORTANT
7. **🟡 Chat** - IMPORTANT (complexe avec WebSocket)
8. **🟡 Checkout** - IMPORTANT
9. **🟢 Rating** - SIMPLE
10. **🟢 Transport** - SIMPLE
11. **🟢 Weather** - SIMPLE
12. **🟢 Profile** - SIMPLE

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Guest Portal React              │
│  ┌───────────────────────────────────┐  │
│  │   Composants (OnboardingScreen,   │  │
│  │   HomeScreen, ServicesScreen...)  │  │
│  └────────────┬──────────────────────┘  │
│               │                          │
│  ┌────────────▼──────────────────────┐  │
│  │  Hooks (useAuth, useBooking...)   │  │
│  └────────────┬──────────────────────┘  │
│               │                          │
│  ┌────────────▼──────────────────────┐  │
│  │  Zustand Store (état global)      │  │
│  └────────────┬──────────────────────┘  │
│               │                          │
│  ┌────────────▼──────────────────────┐  │
│  │  API Client (axios + interceptors)│  │
│  └────────────┬──────────────────────┘  │
└───────────────┼──────────────────────────┘
                │
                │ HTTP / WebSocket
                ▼
┌───────────────────────────────────────────┐
│         Backend Express/Prisma            │
│  /api/auth/*, /api/guest-portal/*...     │
└───────────────────────────────────────────┘
```

---

## 🔑 Principales APIs Disponibles

### **Auth API** (Priorité 🔴 Bloquante)

```ts
import { authApi } from '@/lib/vectrys/api/endpoints';

await authApi.loginWithBookingCode('ABC123');
await authApi.loginWithGoogle(idToken);
await authApi.acceptTerms({ cgu: true, cgv: true, rgpd: true });
await authApi.getMe();
await authApi.updateMe({ first_name: 'Jean' });
```

### **Guest Portal API** (Priorité 🔴 Bloquante)

```ts
import { guestApi } from '@/lib/vectrys/api/endpoints';

const { data } = await guestApi.getMyReservation();
await guestApi.acceptHouseRules(reservationId);
await guestApi.checkin(reservationId);
await guestApi.checkout(reservationId);
const { data: wifi } = await guestApi.getWifiInfo(propertyId);
```

### **Services API** (Priorité 🟡 Importante)

```ts
import { servicesApi } from '@/lib/vectrys/api/endpoints';

const { data: catalog } = await servicesApi.getCatalog(propertyId);
const { data: order } = await servicesApi.placeOrder([
  { service_id: 's1', quantity: 2 },
]);
const { data: orders } = await servicesApi.getMyOrders();
```

### **Chat API** (Priorité 🟡 Importante)

```ts
import { chatApi, wsClient } from '@/lib/vectrys/api/endpoints';

// HTTP fallback
const { data: messages } = await chatApi.getMessages();
await chatApi.sendMessage('Bonjour!');

// WebSocket (temps réel)
wsClient
  .on('onMessage', (msg) => console.log('New message:', msg))
  .on('onTyping', ({ isTyping }) => console.log('Host typing:', isTyping))
  .connect(reservationId);

wsClient.sendMessage('Hello!');
wsClient.disconnect();
```

---

## 🎨 Utilisation des Hooks Avancés

### Weather Hook

```tsx
import { useWeather } from '@/lib/vectrys/hooks';

function WeatherWidget() {
  const { weather, loading, error, refresh } = useWeather();

  if (loading) return <Spinner />;
  if (error) return <p>Erreur: {error}</p>;

  return (
    <div>
      <p>{weather?.current.temp}°C - {weather?.current.description}</p>
      <button onClick={refresh}>Rafraîchir</button>
    </div>
  );
}
```

### Transport Hook

```tsx
import { useTransport } from '@/lib/vectrys/hooks';

function TransportList() {
  const { options, loading } = useTransport();

  if (loading) return <Spinner />;

  return (
    <ul>
      {options.map((opt) => (
        <li key={opt.id}>{opt.name} - {opt.duration_minutes} min</li>
      ))}
    </ul>
  );
}
```

### AI Chat Hook

```tsx
import { useAIChat } from '@/lib/vectrys/hooks';

function AIChatWidget() {
  const { ask, response, loading } = useAIChat();

  const handleAsk = async () => {
    const res = await ask('Comment aller à la gare?');
    console.log('AI response:', res);
  };

  return (
    <div>
      <button onClick={handleAsk} disabled={loading}>
        Demander à l'IA
      </button>
      {response && <p>{response.message}</p>}
    </div>
  );
}
```

### Text-to-Speech Hook

```tsx
import { useTTS } from '@/lib/vectrys/hooks';

function AccessibleText({ text }: { text: string }) {
  const { speak, stop, enabled } = useTTS();

  return (
    <div>
      <p>{text}</p>
      {enabled && (
        <>
          <button onClick={() => speak(text)}>🔊 Écouter</button>
          <button onClick={stop}>⏸ Arrêter</button>
        </>
      )}
    </div>
  );
}
```

---

## 🔒 Gestion de l'Authentification

### JWT Auto-Refresh

Le client API inclut un **auto-refresh automatique** du token JWT lors d'une erreur 401:

```ts
// api/client.ts
// ✅ Aucune action nécessaire de votre part!
// Les tokens sont automatiquement rafraîchis et les requêtes retentées.
```

### Logout Auto sur 401

```ts
// Configuré automatiquement dans store/index.ts
setOnUnauthorized(() => {
  useStore.getState().logout(); // Auto-logout si refresh échoue
});
```

---

## 🌐 WebSocket (Chat Temps Réel)

### Connexion

```ts
import { wsClient } from '@/lib/vectrys/api/websocket';

// Connecter au chat pour une réservation
wsClient
  .on('onMessage', (message) => {
    console.log('Message reçu:', message);
  })
  .on('onTyping', ({ isTyping }) => {
    console.log('L\'hôte écrit...', isTyping);
  })
  .on('onPresence', ({ online }) => {
    console.log('Hôte en ligne:', online);
  })
  .connect(reservationId);
```

### Envoi de message

```ts
const sent = wsClient.sendMessage('Bonjour!');
if (!sent) {
  // Fallback HTTP si WebSocket non connecté
  await chatApi.sendMessage('Bonjour!');
}
```

### Déconnexion

```ts
wsClient.disconnect();
```

---

## 🛠️ Troubleshooting

### Erreur: "Cannot find module '@/lib/vectrys'"

Vérifiez votre `tsconfig.json` ou `vite.config.ts`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Erreur: "Network Error" ou "CORS"

Vérifiez que le backend est démarré et que les variables d'environnement sont correctes:

```bash
echo $VITE_API_URL  # Doit afficher: http://localhost:3001/api
```

Vérifiez les headers CORS côté backend:

```ts
// backend/src/config/cors.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### WebSocket ne se connecte pas

1. Vérifiez `VITE_WS_URL` dans `.env`
2. Vérifiez que Socket.io est bien installé côté backend
3. Ouvrez la console réseau (Network tab) pour voir les tentatives de connexion

---

## 📚 Ressources

- **Migration Guide** : [MIGRATION_GUIDE.ts](./MIGRATION_GUIDE.ts) (COMMENCER ICI!)
- **Types** : [types/index.ts](./types/index.ts)
- **API Endpoints** : [api/endpoints.ts](./api/endpoints.ts)
- **Zustand Store** : [store/index.ts](./store/index.ts)
- **Hooks** : [hooks/index.ts](./hooks/index.ts)

---

## ✅ Checklist Post-Installation

- [ ] Dépendances installées (`zustand`, `axios`, `socket.io-client`)
- [ ] Kit copié dans `src/lib/vectrys/`
- [ ] Variables `.env` configurées
- [ ] Backend démarré sur `http://localhost:3001`
- [ ] `useInitApp()` ajouté dans `App.tsx`
- [ ] Migration guide lu (MIGRATION_GUIDE.ts)
- [ ] Premier écran migré (Onboarding)

---

**🎉 Vous êtes prêt à migrer votre Guest Portal vers l'API backend !**

Commencez par lire `MIGRATION_GUIDE.ts` et suivez l'ordre de migration recommandé.
