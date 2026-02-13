import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/store';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle, error } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      loginWithGoogle(code)
        .then(() => navigate('/'))
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <p style={{ color: '#dc2626' }}>{error}</p>
        ) : (
          <p style={{ color: '#64748b' }}>Connexion en cours...</p>
        )}
      </div>
    </div>
  );
}
