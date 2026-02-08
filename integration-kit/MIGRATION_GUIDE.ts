// ============================================================
// VECTRYS — Guide de Migration Écran par Écran
// Du MOCK (données hardcodées) vers l'API (backend réel)
// ============================================================

/*

## 🎯 ORDRE DE MIGRATION RECOMMANDÉ

| # | Écran | Hook/Store | Priorité | Complexité |
|---|-------|-----------|----------|------------|
| 1 | Onboarding (Auth) | `useAuth()` | 🔴 Bloquant | Moyenne |
| 2 | Terms (CGU) | `useAuth().acceptTerms` | 🔴 Bloquant | Faible |
| 3 | Home | `useBooking()` | 🔴 Bloquant | Faible |
| 4 | Rules | `useBooking().acceptRules` | 🟡 Important | Faible |
| 5 | WiFi | `useBooking().reservation.property` | 🟢 Simple | Faible |
| 6 | Services | `useServices()` | 🟡 Important | Moyenne |
| 7 | Chat | `useChat()` + WebSocket | 🟡 Important | Haute |
| 8 | Checkout | `useBooking()` | 🟡 Important | Moyenne |
| 9 | Rating | `reviewsApi` | 🟢 Simple | Faible |
| 10 | Transport | `useTransport()` | 🟢 Simple | Faible |
| 11 | Weather | `useWeather()` | 🟢 Simple | Faible |
| 12 | Profile | `useAuth()` + `useUI()` | 🟢 Simple | Faible |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 MIGRATION PATTERNS

### Pattern général

```tsx
// ❌ AVANT (Mock - Données hardcodées)
const [userData, setUserData] = useState({
  name: "Jean Dupont",
  email: "jean@example.com"
});

// ✅ APRÈS (API)
import { useAuth } from '@/store';

const { user, isLoading, error } = useAuth();
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1️⃣ ONBOARDING SCREEN (Auth) — 🔴 BLOQUANT

### ❌ AVANT (Mock)

```tsx
// OnboardingScreen.tsx
import { useState } from 'react';

export default function OnboardingScreen() {
  const [bookingCode, setBookingCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Fake validation
    if (bookingCode === 'ABC123') {
      // Navigate to home
      navigate('home');
    } else {
      setError('Code invalide');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={bookingCode}
        onChange={(e) => setBookingCode(e.target.value)}
        placeholder="Code de réservation"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Se connecter</button>
    </form>
  );
}
```

### ✅ APRÈS (API)

```tsx
// OnboardingScreen.tsx
import { useState } from 'react';
import { useAuth, useUI } from '@/store';

export default function OnboardingScreen() {
  const [bookingCode, setBookingCode] = useState('');
  const { loginWithBookingCode, isLoading, error, clearError } = useAuth();
  const { navigate } = useUI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await loginWithBookingCode(bookingCode);
      navigate('terms'); // Redirection après login réussi
    } catch {
      // L'erreur est déjà dans le store
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={bookingCode}
        onChange={(e) => setBookingCode(e.target.value)}
        placeholder="Code de réservation"
        disabled={isLoading}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
}
```

**📌 Points clés :**
- Utiliser `loginWithBookingCode()` du store
- Gérer les états `isLoading` et `error`
- Rediriger vers `terms` si CGU non acceptées, sinon vers `home`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2️⃣ TERMS SCREEN (CGU/CGV) — 🔴 BLOQUANT

### ❌ AVANT (Mock)

```tsx
export default function TermsScreen() {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      navigate('home');
    }
  };

  return (
    <div>
      <Checkbox checked={accepted} onChange={setAccepted} />
      <button onClick={handleAccept}>Accepter et continuer</button>
    </div>
  );
}
```

### ✅ APRÈS (API)

```tsx
import { useState } from 'react';
import { useAuth, useUI } from '@/store';

export default function TermsScreen() {
  const [cgu, setCgu] = useState(false);
  const [cgv, setCgv] = useState(false);
  const [rgpd, setRgpd] = useState(false);
  const { acceptTerms, isLoading, error } = useAuth();
  const { navigate } = useUI();

  const handleAccept = async () => {
    try {
      await acceptTerms(cgu, cgv, rgpd);
      navigate('home'); // Redirection après acceptation
    } catch {
      // Erreur déjà gérée par le store
    }
  };

  const allAccepted = cgu && cgv && rgpd;

  return (
    <div>
      <Checkbox checked={cgu} onChange={setCgu} label="J'accepte les CGU" />
      <Checkbox checked={cgv} onChange={setCgv} label="J'accepte les CGV" />
      <Checkbox checked={rgpd} onChange={setRgpd} label="J'accepte la politique RGPD" />

      {error && <p className="error">{error}</p>}

      <button onClick={handleAccept} disabled={!allAccepted || isLoading}>
        {isLoading ? 'Enregistrement...' : 'Accepter et continuer'}
      </button>
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3️⃣ HOME SCREEN — 🔴 BLOQUANT

### ❌ AVANT (Mock)

```tsx
const mockReservation = {
  property_name: "Villa Paradise",
  check_in_date: "2024-05-01",
  check_out_date: "2024-05-08",
  guest_count: 4
};

export default function HomeScreen() {
  return (
    <div>
      <h1>Bienvenue à {mockReservation.property_name}</h1>
      <p>Arrivée : {mockReservation.check_in_date}</p>
      <p>Départ : {mockReservation.check_out_date}</p>
    </div>
  );
}
```

### ✅ APRÈS (API)

```tsx
import { useEffect } from 'react';
import { useBooking } from '@/store';
import { format } from 'date-fns';

export default function HomeScreen() {
  const { reservation, isLoading, fetchReservation } = useBooking();

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  if (isLoading) return <Spinner />;
  if (!reservation) return <p>Aucune réservation trouvée</p>;

  return (
    <div>
      <h1>Bienvenue à {reservation.property.name}</h1>
      <p>Arrivée : {format(new Date(reservation.check_in_date), 'dd/MM/yyyy')}</p>
      <p>Départ : {format(new Date(reservation.check_out_date), 'dd/MM/yyyy')}</p>
      <p>{reservation.guest_count} personnes</p>

      {/* Afficher les infos WiFi */}
      {reservation.property.wifi_ssid && (
        <div>
          <h2>WiFi</h2>
          <p>Réseau : {reservation.property.wifi_ssid}</p>
          <p>Mot de passe : {reservation.property.wifi_password}</p>
        </div>
      )}
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4️⃣ RULES SCREEN — 🟡 IMPORTANT

### ✅ APRÈS (API)

```tsx
import { useBooking } from '@/store';

export default function RulesScreen() {
  const { reservation, acceptRules, isLoading } = useBooking();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;
    try {
      await acceptRules();
      navigate('home'); // Ou l'écran suivant
    } catch (error) {
      console.error('Erreur acceptation règlement', error);
    }
  };

  return (
    <div>
      <h1>Règlement intérieur</h1>
      <div dangerouslySetInnerHTML={{ __html: reservation?.property.house_rules || '' }} />

      <Checkbox
        checked={accepted}
        onChange={setAccepted}
        label="J'ai lu et j'accepte le règlement"
      />

      <button onClick={handleAccept} disabled={!accepted || isLoading}>
        Accepter
      </button>
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 5️⃣ WIFI SCREEN — 🟢 SIMPLE

### ✅ APRÈS (API)

```tsx
import { useBooking } from '@/store';

export default function WiFiScreen() {
  const { reservation } = useBooking();

  if (!reservation?.property) return <Spinner />;

  const { wifi_ssid, wifi_password } = reservation.property;

  return (
    <div className="wifi-screen">
      <h1>Connexion WiFi</h1>

      {wifi_ssid ? (
        <>
          <div className="wifi-card">
            <label>Réseau WiFi</label>
            <p className="wifi-ssid">{wifi_ssid}</p>
          </div>

          <div className="wifi-card">
            <label>Mot de passe</label>
            <p className="wifi-password">{wifi_password}</p>
            <button onClick={() => navigator.clipboard.writeText(wifi_password || '')}>
              Copier
            </button>
          </div>

          {/* QR Code si disponible */}
          {/* <img src={qr_code_url} alt="QR WiFi" /> */}
        </>
      ) : (
        <p>Aucune information WiFi disponible</p>
      )}
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 6️⃣ SERVICES SCREEN — 🟡 IMPORTANT

### ✅ APRÈS (API)

```tsx
import { useEffect } from 'react';
import { useServices, useUI } from '@/store';

export default function ServicesScreen() {
  const { catalog, cart, cartTotal, cartCount, isLoading, fetchCatalog, addToCart } = useServices();
  const { navigate } = useUI();

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1>Services disponibles</h1>

      <div className="services-grid">
        {catalog.map((service) => (
          <div key={service.id} className="service-card">
            <img src={service.image_url} alt={service.name} />
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <p className="price">{service.price}€</p>
            <button onClick={() => addToCart(service)}>
              Ajouter au panier
            </button>
          </div>
        ))}
      </div>

      {/* Panier flottant */}
      {cartCount > 0 && (
        <div className="cart-float">
          <p>{cartCount} article(s) • {cartTotal}€</p>
          <button onClick={() => navigate('cart')}>Voir le panier</button>
        </div>
      )}
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 7️⃣ CHAT SCREEN — 🟡 IMPORTANT (Haute complexité)

### ✅ APRÈS (API avec WebSocket)

```tsx
import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/store';

export default function ChatScreen() {
  const { messages, isTyping, hostOnline, wsConnected, fetchMessages, sendMessage, connectChat, disconnectChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages(); // Charger historique
    connectChat();   // Connecter WebSocket

    return () => disconnectChat(); // Cleanup
  }, [fetchMessages, connectChat, disconnectChat]);

  useEffect(() => {
    // Auto-scroll vers le bas
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <h1>Chat avec l'hôte</h1>
        <span className={hostOnline ? 'status-online' : 'status-offline'}>
          {hostOnline ? 'En ligne' : 'Hors ligne'}
        </span>
        {!wsConnected && <span className="ws-disconnected">⚠️ Reconnexion...</span>}
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.from}`}>
            <p>{msg.text}</p>
            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}

        {isTyping && <p className="typing-indicator">L'hôte est en train d'écrire...</p>}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Écrire un message..."
        />
        <button onClick={handleSend}>Envoyer</button>
      </div>
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 8️⃣ CHECKOUT SCREEN — 🟡 IMPORTANT

### ✅ APRÈS (API)

```tsx
import { useBooking } from '@/store';

export default function CheckoutScreen() {
  const { checkoutChecklist, toggleChecklistTask, updateChecklist, checkout, isLoading } = useBooking();

  const allCompleted = checkoutChecklist.every((task) => task.completed);

  const handleCheckout = async () => {
    try {
      await updateChecklist(); // Sauvegarder checklist
      await checkout();        // Effectuer checkout
      navigate('rating');      // Rediriger vers avis
    } catch (error) {
      console.error('Erreur checkout', error);
    }
  };

  return (
    <div>
      <h1>Checklist de départ</h1>

      <ul className="checklist">
        {checkoutChecklist.map((task) => (
          <li key={task.id}>
            <Checkbox
              checked={task.completed}
              onChange={() => toggleChecklistTask(task.id)}
              label={task.label}
            />
            {task.description && <p className="task-desc">{task.description}</p>}
          </li>
        ))}
      </ul>

      <button
        onClick={handleCheckout}
        disabled={!allCompleted || isLoading}
        className={allCompleted ? 'btn-primary' : 'btn-disabled'}
      >
        {isLoading ? 'Chargement...' : 'Confirmer le départ'}
      </button>
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 9️⃣ RATING SCREEN — 🟢 SIMPLE

### ✅ APRÈS (API)

```tsx
import { useState } from 'react';
import { useBooking } from '@/store';
import { reviewsApi } from '@/api/endpoints';

export default function RatingScreen() {
  const { reservation } = useBooking();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reservation) return;

    try {
      await reviewsApi.submitReview(reservation.id, {
        rating,
        comment,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Erreur envoi avis', error);
    }
  };

  if (submitted) {
    return <p>✅ Merci pour votre avis !</p>;
  }

  return (
    <div>
      <h1>Évaluez votre séjour</h1>

      <StarRating value={rating} onChange={setRating} />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Partagez votre expérience..."
      />

      <button onClick={handleSubmit}>
        Envoyer mon avis
      </button>
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔟 TRANSPORT SCREEN — 🟢 SIMPLE

### ✅ APRÈS (API)

```tsx
import { useTransport } from '@/hooks';

export default function TransportScreen() {
  const { options, loading, error } = useTransport();

  if (loading) return <Spinner />;
  if (error) return <p>Erreur: {error}</p>;

  return (
    <div>
      <h1>Transports à proximité</h1>

      <div className="transport-list">
        {options.map((option) => (
          <div key={option.id} className="transport-card">
            <div className="transport-icon">{option.icon}</div>
            <h3>{option.name}</h3>
            <p>{option.description}</p>
            <p>{option.duration_minutes} min • {option.price_range}</p>
            {option.booking_url && (
              <a href={option.booking_url} target="_blank" rel="noopener">
                Réserver
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1️⃣1️⃣ WEATHER SCREEN — 🟢 SIMPLE

### ✅ APRÈS (API)

```tsx
import { useWeather } from '@/hooks';

export default function WeatherScreen() {
  const { weather, loading, error, refresh } = useWeather();

  if (loading) return <Spinner />;
  if (error) return <p>Erreur: {error}</p>;
  if (!weather) return null;

  return (
    <div>
      <h1>Météo à {weather.city}</h1>

      {/* Météo actuelle */}
      <div className="weather-current">
        <img
          src={`https://openweathermap.org/img/wn/${weather.current.icon}@2x.png`}
          alt={weather.current.description}
        />
        <h2>{Math.round(weather.current.temp)}°C</h2>
        <p>{weather.current.description}</p>
        <p>Ressentie: {Math.round(weather.current.feels_like)}°C</p>
        <p>Humidité: {weather.current.humidity}%</p>
      </div>

      {/* Prévisions 5 jours */}
      <div className="weather-forecast">
        <h3>Prévisions</h3>
        {weather.forecast.map((day, i) => (
          <div key={i} className="forecast-day">
            <p>{new Date(day.date).toLocaleDateString('fr', { weekday: 'short' })}</p>
            <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt={day.description} />
            <p>{Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°</p>
          </div>
        ))}
      </div>

      <button onClick={refresh}>Rafraîchir</button>
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1️⃣2️⃣ PROFILE SCREEN — 🟢 SIMPLE

### ✅ APRÈS (API)

```tsx
import { useState } from 'react';
import { useAuth, useUI } from '@/store';

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const { lang, setLang, accessibilitySettings, updateAccessibility } = useUI();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');

  const handleSave = async () => {
    await updateProfile({ first_name: firstName, last_name: lastName });
  };

  const handleLogout = () => {
    logout();
    navigate('onboarding');
  };

  return (
    <div>
      <h1>Mon profil</h1>

      {/* Infos personnelles */}
      <section>
        <h2>Informations</h2>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <p>Email: {user?.email}</p>
        <button onClick={handleSave}>Enregistrer</button>
      </section>

      {/* Langue */}
      <section>
        <h2>Langue</h2>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </section>

      {/* Accessibilité */}
      <section>
        <h2>Accessibilité</h2>
        <label>
          <input
            type="checkbox"
            checked={accessibilitySettings.ttsEnabled}
            onChange={(e) => updateAccessibility({ ttsEnabled: e.target.checked })}
          />
          Synthèse vocale (TTS)
        </label>
        <label>
          <input
            type="checkbox"
            checked={accessibilitySettings.highContrast}
            onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
          />
          Contraste élevé
        </label>
      </section>

      <button onClick={handleLogout} className="btn-danger">
        Déconnexion
      </button>
    </div>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📌 CHECKLIST DE MIGRATION

Avant de passer à l'écran suivant, vérifier :

- [ ] Import des hooks/store corrects
- [ ] Gestion du loading state (`isLoading`)
- [ ] Gestion des erreurs (`error`)
- [ ] UI cohérente avec les mocks
- [ ] Formulaires avec validation
- [ ] Navigation correcte entre écrans
- [ ] Test sur données réelles du backend
- [ ] Test des edge cases (erreur réseau, timeout, etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*/

export {};
