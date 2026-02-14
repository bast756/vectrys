// ============================================================================
// VECTRYS — NDA Acceptance Page
// First-login confidentiality agreement with checkbox attestation
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/store';

const DL = {
  void: '#05080d', obsidian: '#0d1220', surface: '#121828', elevated: '#171e34',
  glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  gradient: { gold: 'linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)' },
};

const NDA_TEXT = `ACCORD DE NON-DIVULGATION ET DE CONFIDENTIALITE

En cochant la case ci-dessous, je soussigne(e), employe(e) de VECTRYS, atteste sur l'honneur avoir pris connaissance et accepter les engagements suivants :

1. OBLIGATION DE CONFIDENTIALITE
Je m'engage a ne divulguer, transmettre ou communiquer a quiconque, par quelque moyen que ce soit, les informations relatives aux echanges avec les clients, prospects, partenaires ou investisseurs de VECTRYS auxquelles j'ai acces dans le cadre de mes fonctions.

2. INTERDICTION DE REPRODUCTION
Toute reproduction, copie, capture d'ecran, photographie, enregistrement audio ou video, ou tout autre moyen de duplication des contenus, donnees, conversations, documents internes ou informations confidentielles est strictement interdite.

3. PROTECTION DES DONNEES CLIENTS
Je m'engage a ne pas extraire, copier, exporter ou transferer les donnees personnelles ou professionnelles des clients et prospects accessibles via les outils VECTRYS (CRM, Call Assistant, tableau de bord).

4. PERIMETERE DES INFORMATIONS PROTEGEES
Sont consideres comme confidentiels : les echanges telephoniques et leurs transcriptions, les donnees CRM, les notes internes, les strategies commerciales, les informations financieres, les donnees techniques, les profils comportementaux (FATE), et toute information relative a l'activite de VECTRYS.

5. DUREE
Cette obligation de confidentialite s'applique pendant toute la duree de mon contrat et se prolonge pendant une duree de 2 (deux) ans apres la fin de la relation contractuelle.

6. SANCTIONS
Tout manquement a ces obligations constitue une faute grave pouvant entrainer des poursuites disciplinaires et judiciaires. Conformement aux articles L. 1227-1 et suivants du Code du travail et aux articles 226-13 et 226-14 du Code penal, la violation du secret professionnel est passible de sanctions penales pouvant aller jusqu'a un an d'emprisonnement et 15 000 euros d'amende.

7. RESPONSABILITE
Je reconnais etre personnellement responsable de la protection des informations confidentielles qui me sont confiees et m'engage a signaler immediatement toute violation ou tentative de violation dont j'aurais connaissance.`;

export default function NdaAcceptancePage() {
  const navigate = useNavigate();
  const { employee, acceptNda, employeeLogout } = useEmployeeStore();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!accepted) return;
    setSubmitting(true);
    setError(null);
    try {
      await acceptNda();
      navigate('/employee/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la validation');
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    employeeLogout();
    navigate('/employee/login');
  };

  return (
    <div style={{
      minHeight: '100vh', background: DL.void, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: 24,
    }}>
      <div style={{
        background: DL.surface, border: `1px solid ${DL.glassBorder}`,
        borderRadius: 20, padding: '40px 36px', maxWidth: 640, width: '100%',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 800,
            letterSpacing: 5, background: DL.gradient.gold,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>VECTRYS</span>
          <p style={{ fontSize: 12, color: DL.text.muted, margin: '8px 0 0', letterSpacing: 1 }}>
            ACCORD DE CONFIDENTIALITE
          </p>
        </div>

        {/* Welcome */}
        {employee && (
          <p style={{ fontSize: 14, color: DL.text.secondary, textAlign: 'center', margin: '0 0 24px' }}>
            Bienvenue <span style={{ color: DL.gold400, fontWeight: 600 }}>
              {employee.first_name} {employee.last_name}
            </span>. Avant d'acceder a votre espace, veuillez prendre connaissance
            et accepter l'accord de confidentialite ci-dessous.
          </p>
        )}

        {/* NDA Text */}
        <div style={{
          background: DL.obsidian, border: `1px solid ${DL.glassBorder}`,
          borderRadius: 12, padding: '20px 24px', maxHeight: 360, overflowY: 'auto',
          marginBottom: 24,
        }}>
          <pre style={{
            fontSize: 12, lineHeight: 1.7, color: DL.text.secondary, whiteSpace: 'pre-wrap',
            fontFamily: "'DM Sans', system-ui, sans-serif", margin: 0,
          }}>
            {NDA_TEXT}
          </pre>
        </div>

        {/* Checkbox */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
          padding: '16px 20px', background: accepted ? `${DL.gold400}08` : 'transparent',
          border: `1px solid ${accepted ? `${DL.gold400}30` : DL.glassBorder}`,
          borderRadius: 12, marginBottom: 20, transition: 'all 0.2s',
        }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{
              marginTop: 2, width: 18, height: 18, accentColor: DL.gold400,
              cursor: 'pointer', flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, color: DL.text.primary, lineHeight: 1.6 }}>
            J'atteste avoir lu et compris l'accord de confidentialite ci-dessus.
            Je m'engage a ne divulguer aucune information confidentielle, a ne prendre
            aucune photo, capture d'ecran ou copie des contenus accessibles via les outils VECTRYS.
            Je reconnais que toute reproduction est interdite et passible de poursuites judiciaires.
          </span>
        </label>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 16px', textAlign: 'center' }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleDecline}
            style={{
              flex: 1, padding: '14px 0', background: 'transparent',
              color: DL.text.muted, border: `1px solid ${DL.glassBorder}`,
              borderRadius: 10, fontSize: 13, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Refuser et se deconnecter
          </button>
          <button
            onClick={handleAccept}
            disabled={!accepted || submitting}
            style={{
              flex: 1, padding: '14px 0',
              background: accepted ? DL.gradient.gold : DL.elevated,
              color: accepted ? DL.void : DL.text.muted,
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: !accepted || submitting ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5,
              opacity: !accepted || submitting ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Validation...' : 'Accepter et continuer'}
          </button>
        </div>

        {/* Legal footer */}
        <p style={{
          fontSize: 10, color: DL.text.muted, textAlign: 'center', marginTop: 24,
          lineHeight: 1.5, letterSpacing: 0.3,
        }}>
          Document horodate electroniquement. La validation vaut signature conformement
          aux articles 1366 et 1367 du Code civil.
        </p>
      </div>
    </div>
  );
}
