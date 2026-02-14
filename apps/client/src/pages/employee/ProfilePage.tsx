// ============================================================================
// VECTRYS — Employee Profile Page
// Matricule, name, email, role, avatar upload, password change
// ============================================================================

import { useState, useRef } from 'react';
import { useEmployeeStore } from '@/store';

const DL = {
  void: '#05080d', obsidian: '#0d1220', surface: '#121828', elevated: '#171e34',
  glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853', gold300: '#fcd34d',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  gradient: { gold: 'linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)' },
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function ProfilePage() {
  const { employee, uploadAvatar, removeAvatar, changePassword } = useEmployeeStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Password form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  if (!employee) return null;

  const avatarUrl = employee.avatar_url ? `${API_BASE}${employee.avatar_url}` : null;
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(file);
    } catch { /* silent */ }
    setUploading(false);
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      await removeAvatar();
    } catch { /* silent */ }
    setUploading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPw !== confirmPw) { setPwError('Les mots de passe ne correspondent pas'); return; }
    if (newPw.length < 8) { setPwError('Minimum 8 caracteres'); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess('Mot de passe modifie !');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setShowPasswordForm(false), 1500);
    } catch (err: any) {
      setPwError(err?.response?.data?.error || 'Erreur');
    }
    setPwLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: DL.obsidian,
    border: `1px solid ${DL.glassBorder}`, borderRadius: 8,
    color: DL.text.primary, fontSize: 13, outline: 'none',
    boxSizing: 'border-box' as const, marginBottom: 10,
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: DL.text.primary, fontSize: 22, fontWeight: 700, marginBottom: 32 }}>
        Mon profil
      </h1>

      {/* Avatar Section */}
      <div style={{
        background: DL.surface, border: `1px solid ${DL.glassBorder}`,
        borderRadius: 16, padding: 32, marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%', margin: '0 auto 16px',
          background: avatarUrl ? `url(${avatarUrl}) center/cover` : DL.elevated,
          border: `3px solid ${DL.gold400}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 700, color: DL.gold400, overflow: 'hidden',
        }}>
          {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>

        <input type="file" ref={fileRef} accept=".jpg,.jpeg,.png,.webp" onChange={handleAvatarUpload} style={{ display: 'none' }} />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
            padding: '8px 16px', background: DL.gradient.gold, color: DL.void,
            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            opacity: uploading ? 0.6 : 1,
          }}>
            {uploading ? 'Envoi...' : 'Changer la photo'}
          </button>
          {avatarUrl && (
            <button onClick={handleRemoveAvatar} disabled={uploading} style={{
              padding: '8px 16px', background: 'transparent', color: DL.text.muted,
              border: `1px solid ${DL.glassBorder}`, borderRadius: 8, fontSize: 12,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              Supprimer
            </button>
          )}
        </div>
        <p style={{ fontSize: 11, color: DL.text.muted, marginTop: 8 }}>JPG, PNG ou WebP. Max 2 Mo.</p>
      </div>

      {/* Info Section */}
      <div style={{
        background: DL.surface, border: `1px solid ${DL.glassBorder}`,
        borderRadius: 16, padding: 24, marginBottom: 20,
      }}>
        {[
          { label: 'Matricule', value: employee.matricule },
          { label: 'Prenom', value: employee.first_name },
          { label: 'Nom', value: employee.last_name },
          { label: 'Email', value: employee.email },
          { label: 'Role', value: employee.role.toUpperCase() },
          { label: 'Horaires autorises', value: `${employee.work_schedule_start || '08:00'} — ${employee.work_schedule_end || '19:00'}` },
        ].map((item) => (
          <div key={item.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: `1px solid ${DL.glassBorder}`,
          }}>
            <span style={{ fontSize: 13, color: DL.text.muted }}>{item.label}</span>
            <span style={{ fontSize: 13, color: DL.text.primary, fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Password Section */}
      <div style={{
        background: DL.surface, border: `1px solid ${DL.glassBorder}`,
        borderRadius: 16, padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPasswordForm ? 16 : 0 }}>
          <span style={{ fontSize: 14, color: DL.text.primary, fontWeight: 600 }}>Mot de passe</span>
          <button onClick={() => { setShowPasswordForm(!showPasswordForm); setPwError(''); setPwSuccess(''); }} style={{
            padding: '6px 14px', background: showPasswordForm ? 'transparent' : `${DL.gold400}15`,
            color: showPasswordForm ? DL.text.muted : DL.gold400,
            border: `1px solid ${showPasswordForm ? DL.glassBorder : DL.gold400 + '30'}`,
            borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            {showPasswordForm ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange}>
            <input type="password" value={currentPw} onChange={(e) => { setCurrentPw(e.target.value); setPwError(''); }}
              placeholder="Mot de passe actuel" style={inputStyle} />
            <input type="password" value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwError(''); }}
              placeholder="Nouveau mot de passe (min. 8 car.)" style={inputStyle} />
            <input type="password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setPwError(''); }}
              placeholder="Confirmer" style={inputStyle} />

            {pwError && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 8px' }}>{pwError}</p>}
            {pwSuccess && <p style={{ fontSize: 12, color: '#10b981', margin: '0 0 8px' }}>{pwSuccess}</p>}

            <button type="submit" disabled={pwLoading} style={{
              width: '100%', padding: '12px 0', background: DL.gradient.gold,
              color: DL.void, border: 'none', borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: pwLoading ? 'wait' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {pwLoading ? 'Modification...' : 'Valider'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
