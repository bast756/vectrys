// ============================================================================
// VECTRYS — Employee Login Page (2FA)
// Step 1: Matricule + Password → Step 2: OTP verification
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEmployeeStore } from '@/store';
import { employeeTokenManager } from '@/api/employeeApi';

const DL = {
  void: '#05080d', obsidian: '#0d1220', surface: '#121828', elevated: '#171e34',
  glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853', gold300: '#fcd34d',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  gradient: { gold: 'linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)' },
};

const inputStyle = (hasError: boolean) => ({
  width: '100%', padding: '14px 16px', background: DL.obsidian,
  border: `1px solid ${hasError ? '#ef4444' : DL.glassBorder}`,
  borderRadius: 10, color: DL.text.primary, fontSize: 14, outline: 'none',
  boxSizing: 'border-box' as const, marginBottom: 12, fontFamily: "'DM Sans', sans-serif",
});

export default function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { employeeLogin, verifyOtp, cancelOtp, isEmployeeLoading, employeeError, clearEmployeeError, otpPending } = useEmployeeStore();
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP input when switching to step 2
  useEffect(() => {
    if (otpPending) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [otpPending]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      employeeTokenManager.setRememberMe(rememberMe);
      await employeeLogin(matricule, password);
    } catch { /* error in store */ }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    clearEmployeeError();

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (newDigits.every(d => d !== '') && value) {
      submitOtp(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split('');
      setOtpDigits(newDigits);
      otpRefs.current[5]?.focus();
      submitOtp(pasted);
    }
  };

  const submitOtp = async (code: string) => {
    try {
      await verifyOtp(code);
      const emp = useEmployeeStore.getState().employee;
      if (emp?.temp_password) {
        navigate('/employee/change-password');
      } else if (emp && !emp.nda_accepted_at) {
        navigate('/employee/nda');
      } else {
        navigate('/employee/dashboard');
      }
    } catch {
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleBack = () => {
    cancelOtp();
    setOtpDigits(['', '', '', '', '', '']);
    clearEmployeeError();
  };

  return (
    <div style={{
      minHeight: '100vh', background: DL.void, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        background: DL.surface, border: `1px solid ${DL.glassBorder}`,
        borderRadius: 20, padding: '48px 40px', width: 420, textAlign: 'center',
      }}>
        {/* Brand */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 800,
            letterSpacing: 6, background: DL.gradient.gold,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>VECTRYS</span>
        </div>
        <p style={{ fontSize: 13, color: DL.text.muted, margin: '0 0 32px', letterSpacing: 1 }}>
          ESPACE EMPLOYE
        </p>

        {!otpPending ? (
          /* ── STEP 1: Credentials ── */
          <form onSubmit={handleStep1}>
            <input
              type="text"
              value={matricule}
              onChange={(e) => { setMatricule(e.target.value.toUpperCase()); clearEmployeeError(); }}
              placeholder="Matricule (ex: VEC-001)"
              autoFocus
              style={inputStyle(!!employeeError)}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearEmployeeError(); }}
              placeholder="Mot de passe"
              style={inputStyle(!!employeeError)}
            />

            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: DL.text.secondary, cursor: 'pointer',
              marginBottom: 16, userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: 16, height: 16, accentColor: DL.gold400, cursor: 'pointer',
                }}
              />
              Rester connecte
            </label>

            {employeeError && (
              <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{employeeError}</p>
            )}

            <button type="submit" disabled={isEmployeeLoading} style={{
              width: '100%', padding: '14px 0', background: DL.gradient.gold,
              color: DL.void, border: 'none', borderRadius: 10, fontSize: 14,
              fontWeight: 700, cursor: isEmployeeLoading ? 'wait' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5,
              opacity: isEmployeeLoading ? 0.7 : 1,
            }}>
              {isEmployeeLoading ? 'Verification...' : 'Se connecter'}
            </button>

            <Link to="/employee/forgot-password" style={{
              display: 'block', fontSize: 12, color: DL.gold400, marginTop: 16,
              textDecoration: 'none',
            }}>
              Mot de passe oublie ?
            </Link>
          </form>
        ) : (
          /* ── STEP 2: OTP Verification ── */
          <div>
            <div style={{
              background: `${DL.gold400}10`, border: `1px solid ${DL.gold400}25`,
              borderRadius: 10, padding: 16, marginBottom: 24,
            }}>
              <p style={{ fontSize: 13, color: DL.text.secondary, margin: 0 }}>
                Un code de verification a ete envoye a
              </p>
              <p style={{ fontSize: 14, color: DL.gold400, fontWeight: 600, margin: '4px 0 0' }}>
                {otpPending.email}
              </p>
            </div>

            <p style={{ fontSize: 12, color: DL.text.muted, marginBottom: 16 }}>
              Saisissez le code a 6 chiffres
            </p>

            {/* OTP Input Grid */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}
              onPaste={handleOtpPaste}
            >
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center',
                    background: DL.obsidian, border: `2px solid ${digit ? DL.gold400 : DL.glassBorder}`,
                    borderRadius: 10, color: DL.gold400, fontSize: 22, fontWeight: 700,
                    outline: 'none', fontFamily: "'DM Sans', sans-serif",
                    transition: 'border-color 0.2s',
                  }}
                />
              ))}
            </div>

            {employeeError && (
              <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{employeeError}</p>
            )}

            {isEmployeeLoading && (
              <p style={{ fontSize: 12, color: DL.gold400, margin: '0 0 12px' }}>Verification...</p>
            )}

            <button onClick={handleBack} style={{
              background: 'transparent', color: DL.text.muted, border: `1px solid ${DL.glassBorder}`,
              borderRadius: 8, padding: '8px 20px', fontSize: 12, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", marginTop: 8,
            }}>
              Retour
            </button>
          </div>
        )}

        <p style={{ fontSize: 11, color: DL.text.muted, marginTop: 24 }}>
          Acces reserve aux employes VECTRYS
        </p>
      </div>
    </div>
  );
}
