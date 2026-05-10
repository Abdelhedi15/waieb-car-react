import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye, EyeOff, User, Lock, Car,
  CalendarCheck, CreditCard, FileText, Users,
  ShieldCheck, ChevronRight, AlertCircle,
} from 'lucide-react';

// ── Inline SVG car logo
const WaiebLogo = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="56" height="56" rx="16" fill="#E8A020" />
    <rect x="3" y="3" width="50" height="50" rx="14" fill="url(#logoGrad)" />
    {/* Car body */}
    <path d="M10 34h36v4a2 2 0 01-2 2H12a2 2 0 01-2-2v-4z" fill="white" fillOpacity="0.95" />
    <path d="M12 34l5-10h22l5 10H12z" fill="white" />
    {/* Windshield */}
    <path d="M19 34l3-7h12l3 7H19z" fill="#1B3A6B" fillOpacity="0.35" />
    {/* Wheels */}
    <circle cx="18" cy="38" r="4" fill="#1B3A6B" />
    <circle cx="18" cy="38" r="2" fill="white" fillOpacity="0.6" />
    <circle cx="38" cy="38" r="4" fill="#1B3A6B" />
    <circle cx="38" cy="38" r="2" fill="white" fillOpacity="0.6" />
    {/* Key accent */}
    <circle cx="44" cy="14" r="5" fill="#E8A020" />
    <path d="M44 11v6M41 14h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="logoGrad" x1="3" y1="3" x2="53" y2="53" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1B3A6B" />
        <stop offset="1" stopColor="#0D1F3C" />
      </linearGradient>
    </defs>
  </svg>
);

// ── Animated background dots pattern
const DotPattern = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)" />
  </svg>
);

const FEATURES = [
  { icon: <CalendarCheck size={20} />, title: 'Gestion des réservations', desc: 'Calendrier, disponibilité et suivi en temps réel' },
  { icon: <Car size={20} />,           title: 'Suivi de la flotte',        desc: 'État des véhicules, maintenance et alertes' },
  { icon: <CreditCard size={20} />,    title: 'Suivi des paiements',       desc: 'Acomptes, virements et situation financière' },
  { icon: <FileText size={20} />,      title: 'Gestion des contrats',      desc: 'Génération automatique et facturation TVA' },
];

const Login = () => {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]               = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form.username, form.password);
      navigate(user.role === 'admin' ? '/' : '/vehicles');
    } catch {
      setError("Nom d'utilisateur ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Left panel */}
      <div style={{
        flex: '0 0 55%', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg, #0D1F3C 0%, #1B3A6B 50%, #0D1F3C 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px', color: 'white',
      }}>
        <DotPattern />

        {/* Decorative amber circle */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,160,32,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,160,32,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Brand */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
            <WaiebLogo size={64} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1.1 }}>
                Waieb
                <span style={{ color: '#E8A020' }}> Car</span> Rent
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '4px' }}>
                Système de gestion
              </div>
            </div>
          </div>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.65)', maxWidth: '380px', lineHeight: 1.6, margin: '0 auto' }}>
            Gérez votre flotte, vos réservations et vos clients depuis une interface unifiée.
          </p>
        </div>

        {/* Features */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '400px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 18px', backdropFilter: 'blur(8px)', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,160,32,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(232,160,32,0.2)', color: '#E8A020', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'rgba(255,255,255,0.92)' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{f.desc}</div>
              </div>
              <ChevronRight size={16} color="rgba(255,255,255,0.2)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: '36px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(232,160,32,0.15)', border: '1px solid rgba(232,160,32,0.3)', borderRadius: '20px', padding: '8px 16px' }}>
          <ShieldCheck size={15} color="#E8A020" />
          <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
            Accès sécurisé — Authentification JWT
          </span>
        </div>
      </div>

      {/* ── Right panel */}
      <div style={{ flex: 1, background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '4px', height: '28px', background: '#E8A020', borderRadius: '2px' }} />
              <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1A2535', letterSpacing: '-0.5px', margin: 0 }}>
                Connexion
              </h1>
            </div>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0, paddingLeft: '14px' }}>
              Connectez-vous à votre espace de gestion
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626', fontSize: '13.5px', fontWeight: '600' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>
                Nom d'utilisateur
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Nom d'utilisateur"
                  required
                  style={{ width: '100%', padding: '13px 14px 13px 42px', border: '1.5px solid #DDE3ED', borderRadius: '10px', fontSize: '14px', background: 'white', outline: 'none', boxSizing: 'border-box', color: '#1A2535', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onFocus={e => { e.target.style.borderColor = '#1B3A6B'; e.target.style.boxShadow = '0 0 0 3px rgba(27,58,107,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#DDE3ED'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Mot de passe"
                  required
                  style={{ width: '100%', padding: '13px 44px 13px 42px', border: '1.5px solid #DDE3ED', borderRadius: '10px', fontSize: '14px', background: 'white', outline: 'none', boxSizing: 'border-box', color: '#1A2535', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onFocus={e => { e.target.style.borderColor = '#1B3A6B'; e.target.style.boxShadow = '0 0 0 3px rgba(27,58,107,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#DDE3ED'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#94A3B8' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: '28px' }}>
              <span style={{ fontSize: '13px', color: '#1B3A6B', fontWeight: '600', cursor: 'default' }}>
                Contacter l'administrateur en cas de problème
              </span>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#94A3B8' : '#1B3A6B', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.15s', boxShadow: loading ? 'none' : '0 4px 16px rgba(27,58,107,0.35)', letterSpacing: '0.3px' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#2A5298'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(27,58,107,0.45)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#1B3A6B'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,58,107,0.35)'; } }}>
              {loading ? (
                <>
                  <div style={{ width: '18px', height: '18px', border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Role info cards */}
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { role: 'Admin', icon: <ShieldCheck size={15} />, color: '#1B3A6B', bg: '#EFF4FB', desc: 'Accès complet' },
              { role: 'Employé', icon: <Users size={15} />,   color: '#16A34A', bg: '#DCFCE7', desc: 'Accès limité' },
            ].map(r => (
              <div key={r.role} style={{ background: r.bg, borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: r.color, flexShrink: 0 }}>{r.icon}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: r.color }}>{r.role}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
            Waieb Car Rent © {new Date().getFullYear()} — Système de gestion de flotte
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Login;