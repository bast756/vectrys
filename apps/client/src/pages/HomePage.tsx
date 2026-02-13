import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useBooking, useUI } from '@/store';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { reservation, isLoading, fetchReservation } = useBooking();

  useEffect(() => {
    fetchReservation().catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#0f172a', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>VECTRYS</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{user?.email}</span>
          <button onClick={handleLogout}
            style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            Deconnexion
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Bienvenue{user?.first_name ? `, ${user.first_name}` : ''} !
          </h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Votre espace Guest Portal</p>
        </div>

        {/* Reservation Card */}
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Chargement de votre reservation...</div>
        ) : reservation ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>{reservation.property?.name || 'Votre sejour'}</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{reservation.property?.address}, {reservation.property?.city}</p>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: reservation.status === 'checked_in' ? '#dcfce7' : reservation.status === 'confirmed' ? '#dbeafe' : '#f1f5f9',
                color: reservation.status === 'checked_in' ? '#16a34a' : reservation.status === 'confirmed' ? '#2563eb' : '#64748b' }}>
                {reservation.status === 'checked_in' ? 'En cours' : reservation.status === 'confirmed' ? 'Confirme' : reservation.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: '16px 0', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Arrivee</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '2px 0 0' }}>{new Date(reservation.check_in_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Depart</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '2px 0 0' }}>{new Date(reservation.check_out_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Voyageurs</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '2px 0 0' }}>{reservation.guest_count}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: '#64748b', fontSize: 14 }}>Aucune reservation trouvee.</p>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {[
            { label: 'Chat', icon: '💬', path: '/chat', desc: 'Contacter votre hote' },
            { label: 'Services', icon: '🛎️', path: '/services', desc: 'Petit-dejeuner, menage...' },
            { label: 'Guide', icon: '🗺️', path: '/guide', desc: 'Restaurants, activites' },
            { label: 'Meteo', icon: '☀️', path: '/weather', desc: 'Previsions locales' },
            { label: 'Transport', icon: '🚌', path: '/transport', desc: 'Comment venir' },
            { label: 'Wi-Fi', icon: '📶', path: '/wifi', desc: 'Acces internet' },
          ].map(({ label, icon, desc }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
              <span style={{ fontSize: 28 }}>{icon}</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '8px 0 2px' }}>{label}</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
