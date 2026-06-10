import { useState } from 'react';
import {
  X, CheckCircle, AlertTriangle, ClipboardList,
  ChevronRight, Send,
} from 'lucide-react';

const NAVY   = '#1B3A6B';
const AMBER  = '#E8A020';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';

const CHECKLIST_ITEMS = [
  { key: 'proprete_int',    icon: '🧹', label: 'Propreté intérieure',      group: 'état' },
  { key: 'proprete_ext',    icon: '✨', label: 'Propreté extérieure',      group: 'état' },
  { key: 'carburant',       icon: '⛽', label: 'Niveau carburant correct',  group: 'technique' },
  { key: 'cles',            icon: '🔑', label: 'Clés rendues',             group: 'documents' },
  { key: 'carte_grise',     icon: '📄', label: 'Carte grise rendue',       group: 'documents' },
  { key: 'assurance',       icon: '🛡️', label: 'Vignette assurance',       group: 'documents' },
  { key: 'roue_secours',    icon: '🔧', label: 'Roue de secours présente', group: 'technique' },
  { key: 'triangles',       icon: '⚠️', label: 'Triangles de sécurité',    group: 'technique' },
  { key: 'cric',            icon: '🔩', label: 'Cric présent',             group: 'technique' },
  { key: 'vitre_ok',        icon: '🪟', label: 'Vitres intactes',          group: 'carrosserie' },
  { key: 'retroviseurs_ok', icon: '🔍', label: 'Rétroviseurs intacts',     group: 'carrosserie' },
  { key: 'phares_ok',       icon: '💡', label: 'Phares/feux fonctionnels', group: 'technique' },
];

const ETAT_OPTIONS = [
  { value: 'excellent', label: 'Excellent',       color: GREEN,  bg: '#DCFCE7', emoji: '⭐' },
  { value: 'bon',       label: 'Bon état',        color: NAVY,   bg: '#EFF4FB', emoji: '👍' },
  { value: 'defauts',   label: 'Défauts mineurs', color: AMBER,  bg: '#FEF9C3', emoji: '⚠️' },
  { value: 'dommages',  label: 'Dommages',        color: RED,    bg: '#FEE2E2', emoji: '🔴' },
];

const CAR_MARKS = {
  eraflure: { color: '#F59E0B', label: 'Éraflure', emoji: '—' },
  bosse:    { color: '#DC2626', label: 'Bosse',     emoji: '●' },
};

const CAR_ZONES = [
  { id: 'avant_gauche',   x: 18, y: 30, label: 'Avant G.' },
  { id: 'avant_centre',   x: 50, y: 22, label: 'Avant' },
  { id: 'avant_droit',    x: 82, y: 30, label: 'Avant D.' },
  { id: 'milieu_gauche',  x: 12, y: 50, label: 'Flanc G.' },
  { id: 'toit',           x: 50, y: 48, label: 'Toit' },
  { id: 'milieu_droit',   x: 88, y: 50, label: 'Flanc D.' },
  { id: 'arriere_gauche', x: 18, y: 70, label: 'Arrière G.' },
  { id: 'arriere_centre', x: 50, y: 78, label: 'Arrière' },
  { id: 'arriere_droit',  x: 82, y: 70, label: 'Arrière D.' },
];

const RetourCheckModal = ({ reservation, client, vehicle, onClose, onConfirm }) => {
  const [step, setStep]           = useState(1);
  const [checklist, setChecklist] = useState(
    Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, true]))
  );
  const [markType, setMarkType]       = useState('eraflure');
  const [marks, setMarks]             = useState([]);
  const [etatGeneral, setEtatGeneral] = useState('bon');
  const [notes, setNotes]             = useState('');
  const [kilometrage, setKilometrage] = useState('');
  const [carburant, setCarburant]     = useState(100);
  const [submitting, setSubmitting]   = useState(false);

  const nbPbChecklist = CHECKLIST_ITEMS.filter(i => !checklist[i.key]).length;
  const nbMarks       = marks.length;
  const score         = Math.max(0, 100
    - nbPbChecklist * 8
    - nbMarks * 5
    - (etatGeneral === 'dommages' ? 30 : etatGeneral === 'defauts' ? 15 : 0));

  const addMark = (zone) => {
    const existing = marks.find(m => m.zone === zone.id && m.type === markType);
    if (existing) setMarks(prev => prev.filter(m => !(m.zone === zone.id && m.type === markType)));
    else setMarks(prev => [...prev, { zone: zone.id, label: zone.label, type: markType }]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onConfirm({
      reservation_id:      reservation.id,
      checklist,
      marks,
      etat_retour:         etatGeneral,
      notes_retour:        notes,
      kilometrage_retour:  kilometrage,
      carburant_retour:    carburant,
      score_retour:        score,
      eraflures_retour:    JSON.stringify(marks.filter(m => m.type === 'eraflure')),
      bosses_retour:       JSON.stringify(marks.filter(m => m.type === 'bosse')),
      date_inspection:     new Date().toISOString(),
    });
    setSubmitting(false);
  };

  const steps = ['Checklist', 'Carrosserie', 'Bilan'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '20px', width: '100%', maxWidth: '680px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2D5BA8 100%)`, padding: '20px 24px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
                <ClipboardList size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🔍 Inspection de Retour</h2>
                <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '3px' }}>
                  Rés. #{reservation.id} · {vehicle?.marque} {vehicle?.modele} ({vehicle?.immatriculation})
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600' }}>
                    📅 {reservation.date_debut} → {reservation.date_fin}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600' }}>
                    👤 {client?.prenom} {client?.nom}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white' }}>
              <X size={18} />
            </button>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px',
                  background: step === i + 1 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)',
                  border: `1.5px solid ${step === i + 1 ? 'rgba(255,255,255,0.45)' : 'transparent'}`,
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: step > i + 1 ? AMBER : step === i + 1 ? 'white' : 'rgba(255,255,255,0.25)',
                    color: step === i + 1 ? NAVY : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px',
                  }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', opacity: step === i + 1 ? 1 : 0.55 }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div style={{ width: '10px', height: '2px', background: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>

          {/* ── STEP 1: Checklist */}
          {step === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>📍 Kilométrage retour</label>
                  <input type="number" value={kilometrage} onChange={e => setKilometrage(e.target.value)}
                    placeholder={`Actuel: ${vehicle?.kilometrage || '—'} km`}
                    style={{ width: '100%', padding: '10px', border: '1.5px solid #DDE3ED', borderRadius: '8px', fontSize: '14px', fontWeight: '700', boxSizing: 'border-box' }} />
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>
                    ⛽ Carburant — <span style={{ color: carburant < 25 ? RED : carburant < 50 ? AMBER : GREEN }}>{carburant}%</span>
                  </label>
                  <input type="range" min="0" max="100" step="5" value={carburant}
                    onChange={e => setCarburant(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: carburant < 25 ? RED : carburant < 50 ? AMBER : GREEN }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                    <span>Vide</span><span>¼</span><span>½</span><span>¾</span><span>Plein</span>
                  </div>
                </div>
              </div>

              {['état', 'technique', 'carrosserie', 'documents'].map(group => (
                <div key={group} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    {group === 'état' ? '🪣 État général' : group === 'technique' ? '🔧 Technique' : group === 'carrosserie' ? '🚗 Carrosserie' : '📋 Documents'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {CHECKLIST_ITEMS.filter(i => i.group === group).map(item => {
                      const ok = checklist[item.key];
                      return (
                        <div key={item.key} onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                            border: `1.5px solid ${ok ? '#86EFAC' : '#FECACA'}`,
                            background: ok ? '#F0FFF4' : '#FFF5F5', transition: 'all 0.15s',
                          }}>
                          <span style={{ fontSize: '16px' }}>{item.icon}</span>
                          <span style={{ flex: 1, fontSize: '12.5px', fontWeight: '600', color: ok ? '#166534' : RED }}>{item.label}</span>
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                            background: ok ? GREEN : RED,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {ok ? <CheckCircle size={14} color="white" /> : <X size={14} color="white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {nbPbChecklist > 0 && (
                <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#92580A', fontWeight: '600' }}>
                  <AlertTriangle size={15} /> {nbPbChecklist} point(s) à signaler
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Carrosserie */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                {Object.entries(CAR_MARKS).map(([type, cfg]) => (
                  <button key={type} onClick={() => setMarkType(type)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                      border: `2px solid ${markType === type ? cfg.color : '#DDE3ED'}`,
                      background: markType === type ? cfg.color + '22' : 'white',
                      color: markType === type ? cfg.color : '#64748B',
                      fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}>
                    <span style={{ fontSize: '16px' }}>{cfg.emoji}</span> {cfg.label}
                  </button>
                ))}
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1.5px dashed #DDE3ED' }}>
                <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', marginBottom: '12px', fontWeight: '600' }}>
                  Cliquez sur une zone pour marquer · Recliquez pour effacer
                </div>
                <div style={{ position: 'relative', maxWidth: '420px', margin: '0 auto' }}>
                  <svg viewBox="0 0 400 220" style={{ width: '100%', height: 'auto' }}>
                    <rect x="40" y="80" width="320" height="110" rx="20" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2"/>
                    <path d="M 100 80 Q 120 30 200 25 Q 280 30 300 80 Z" fill="#94A3B8" stroke="#64748B" strokeWidth="2"/>
                    <path d="M 115 78 Q 130 42 200 38 Q 270 42 285 78 Z" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1.5"/>
                    <circle cx="110" cy="190" r="28" fill="#374151" stroke="#1F2937" strokeWidth="2"/>
                    <circle cx="110" cy="190" r="16" fill="#6B7280"/>
                    <circle cx="290" cy="190" r="28" fill="#374151" stroke="#1F2937" strokeWidth="2"/>
                    <circle cx="290" cy="190" r="16" fill="#6B7280"/>
                    <rect x="42" y="90" width="30" height="18" rx="6" fill="#FEF9C3" stroke="#FCD34D" strokeWidth="1.5"/>
                    <rect x="328" y="90" width="30" height="18" rx="6" fill="#FEF9C3" stroke="#FCD34D" strokeWidth="1.5"/>
                    <rect x="42" y="130" width="28" height="15" rx="5" fill="#FECACA" stroke="#F87171" strokeWidth="1.5"/>
                    <rect x="330" y="130" width="28" height="15" rx="5" fill="#FECACA" stroke="#F87171" strokeWidth="1.5"/>
                    {marks.map((m, i) => {
                      const zone = CAR_ZONES.find(z => z.id === m.zone);
                      if (!zone) return null;
                      const cx = (zone.x / 100) * 400;
                      const cy = (zone.y / 100) * 220;
                      const cfg = CAR_MARKS[m.type];
                      return (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r="13" fill={cfg.color} opacity="0.88" stroke="white" strokeWidth="2.5"/>
                          <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                            {m.type === 'eraflure' ? '—' : '●'}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  {CAR_ZONES.map(zone => {
                    const hasE = marks.find(m => m.zone === zone.id && m.type === 'eraflure');
                    const hasB = marks.find(m => m.zone === zone.id && m.type === 'bosse');
                    return (
                      <div key={zone.id} onClick={() => addMark(zone)} title={zone.label}
                        style={{
                          position: 'absolute',
                          left: `${zone.x}%`, top: `${zone.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: '38px', height: '38px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                          border: `2px dashed ${hasE ? '#F59E0B' : hasB ? RED : 'rgba(100,116,139,0.35)'}`,
                          cursor: 'pointer', zIndex: 10,
                        }}/>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
                  {Object.entries(CAR_MARKS).map(([type, cfg]) => (
                    <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: cfg.color }}>
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: cfg.color, display: 'inline-block' }}/>
                      {cfg.label} ({marks.filter(m => m.type === type).length})
                    </span>
                  ))}
                </div>
              </div>

              {marks.length > 0 && (
                <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#92580A', marginBottom: '8px' }}>⚠️ {marks.length} dommage(s)</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {marks.map((m, i) => {
                      const cfg = CAR_MARKS[m.type];
                      return <span key={i} style={{ background: 'white', border: `1px solid ${cfg.color}`, color: cfg.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{cfg.emoji} {m.label}</span>;
                    })}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>État général</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {ETAT_OPTIONS.map(opt => (
                    <div key={opt.value} onClick={() => setEtatGeneral(opt.value)}
                      style={{
                        textAlign: 'center', padding: '12px 8px', borderRadius: '12px', cursor: 'pointer',
                        border: `2px solid ${etatGeneral === opt.value ? opt.color : '#DDE3ED'}`,
                        background: etatGeneral === opt.value ? opt.bg : 'white', transition: 'all 0.15s',
                      }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.emoji}</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: etatGeneral === opt.value ? opt.color : '#64748B' }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Bilan */}
          {step === 3 && (
            <div>
              <div style={{
                background: `linear-gradient(135deg, ${score >= 80 ? '#DCFCE7' : score >= 60 ? '#FEF9C3' : '#FEE2E2'}, white)`,
                border: `2px solid ${score >= 80 ? GREEN : score >= 60 ? AMBER : RED}`,
                borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '20px',
              }}>
                <div style={{ fontSize: '56px', fontWeight: '900', color: score >= 80 ? GREEN : score >= 60 ? AMBER : RED, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: score >= 80 ? GREEN : score >= 60 ? AMBER : RED, marginBottom: '4px', marginTop: '4px' }}>Score de Retour / 100</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {score >= 80 ? '✅ Excellent retour' : score >= 60 ? '⚠️ Retour acceptable avec réserves' : '🔴 Retour avec dommages — à signaler'}
                </div>
                <div style={{ background: '#F0F2F5', borderRadius: '8px', height: '10px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${score}%`, background: score >= 80 ? GREEN : score >= 60 ? AMBER : RED, borderRadius: '8px', transition: 'width 0.6s' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Checklist', value: `${CHECKLIST_ITEMS.length - nbPbChecklist}/${CHECKLIST_ITEMS.length}`, ok: nbPbChecklist === 0, emoji: '✓' },
                  { label: 'Dommages',  value: nbMarks,                                                                ok: nbMarks === 0,        emoji: nbMarks === 0 ? '✓' : '⚠' },
                  { label: 'État',      value: ETAT_OPTIONS.find(o => o.value === etatGeneral)?.label,                ok: etatGeneral === 'excellent' || etatGeneral === 'bon', emoji: ETAT_OPTIONS.find(o => o.value === etatGeneral)?.emoji },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', padding: '14px', borderRadius: '12px', background: item.ok ? '#F0FFF4' : '#FFF5F5', border: `1.5px solid ${item.ok ? '#86EFAC' : '#FECACA'}` }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.emoji}</div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: item.ok ? GREEN : RED }}>{item.value}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {kilometrage && (
                <div style={{ background: '#EFF4FB', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>📍 Kilométrage retour</span>
                  <span style={{ fontWeight: '800', color: NAVY, fontSize: '15px' }}>{parseInt(kilometrage).toLocaleString()} km</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>📝 Notes & observations</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Décrivez l'état général, les dommages observés, remarques du client..."
                  rows={4}
                  style={{ width: '100%', padding: '12px', border: '1.5px solid #DDE3ED', borderRadius: '10px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F0F2F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
            Étape {step}/{steps.length}
            {step === 1 && nbPbChecklist > 0 && <span style={{ color: AMBER, marginLeft: '8px' }}>⚠️ {nbPbChecklist} point(s)</span>}
            {step === 2 && nbMarks > 0 && <span style={{ color: RED, marginLeft: '8px' }}>🔴 {nbMarks} dommage(s)</span>}
            {step === 3 && <span style={{ color: score >= 80 ? GREEN : AMBER, marginLeft: '8px', fontWeight: '800' }}>Score: {score}/100</span>}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ padding: '10px 20px', background: 'white', color: NAVY, border: `1.5px solid ${NAVY}`, borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                ← Retour
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)}
                style={{ padding: '10px 24px', background: NAVY, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Suivant <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '10px 24px', background: GREEN, color: 'white', border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? '⏳ Enregistrement...' : <><Send size={15} /> Valider l'inspection</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetourCheckModal;