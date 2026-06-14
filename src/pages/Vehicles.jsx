import { useState, useEffect } from 'react';
import {
  Car, Plus, Pencil, Trash2, Search,
  Fuel, Users, Gauge, Palette, AlertTriangle,
  CheckCircle, Wrench, Shield, Tag, XCircle,
  Key, X, Calendar, User, Clock, ChevronRight, Eye,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

const CAR_PHOTOS = {
  renault:    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=500&q=80',
  peugeot:    'https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=500&q=80',
  volkswagen: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&q=80',
  toyota:     'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=500&q=80',
  hyundai:    'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=500&q=80',
  dacia:      'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=500&q=80',
  kia:        'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&q=80',
  seat:       'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80',
  ford:       'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=500&q=80',
  skoda:      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=500&q=80',
  bmw:        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&q=80',
  audi:       'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500&q=80',
  mercedes:   'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500&q=80',
  default:    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80',
};

const IMMAT_PHOTOS = {
  '240TN5082': 'https://i.ibb.co/FZmVWK6/vec1.jpg',
  '259TN5651': 'https://i.ibb.co/F4SbDBMM/vec2.jpg',
  '243TN1422': 'https://i.ibb.co/gbw2JtTH/vec3.jpg',
  '236TN5648': 'https://i.ibb.co/0RJ31jBB/vec4.jpg',
  '234TN2126': 'https://i.ibb.co/prkyKtjv/vec5.jpg',
  '244TN7005': 'https://i.ibb.co/P81vS80/vec6.jpg',
  '251TN1694': 'https://i.ibb.co/5WBKGTGL/vec7.jpg',
  '252TN3310': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80',
  '253TN4421': 'https://i.ibb.co/jvRzYcDB/vec9.png',
  '254TN6632': 'https://i.ibb.co/hxvysSY4/vec10.png',
  '255TN7743': 'https://i.ibb.co/dsfz2VnP/vec11.png',
  '256TN8854': 'https://i.ibb.co/35ccmkFY/vec12.jpg',
  '257TN1301': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155233/vec13_jwhixy.jpg',
  '258TN1402': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155237/vec14_emprhi.jpg',
  '259TN1503': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec15_y7lazd.jpg',
  '260TN1604': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec16_pkydhf.jpg',
  '261TN1705': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec17_z2iw32.jpg',
  '262TN1806': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec18_byuiqk.jpg',
  '263TN1907': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec19_g9yvnw.jpg',
  '264TN2008': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec20_kvsoqj.jpg',
  '265TN2109': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec21_bjkcyt.jpg',
  '266TN2210': 'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155236/vec22_gkpzax.jpg',
};

const getAge = (date_acquisition) => {
  if (!date_acquisition) return 0;
  return (new Date() - new Date(date_acquisition)) / (1000 * 60 * 60 * 24 * 365.25);
};

const getCarPhoto = (v) => {
  if (IMMAT_PHOTOS[v?.immatriculation]) return IMMAT_PHOTOS[v?.immatriculation];
  if (v?.photo) {
    const p = String(v.photo);
    if (p.startsWith('http')) return p;
    return `https://web-production-e6e97.up.railway.app${p}`;
  }
  return CAR_PHOTOS[(v?.marque || '').toLowerCase()] || CAR_PHOTOS.default;
};

const CATEGORIES = [
  { key: 'all',    label: 'Tous',             icon: '🚗' },
  { key: 'small',  label: 'Petite',           icon: '🚙' },
  { key: 'medium', label: 'Moyenne',          icon: '🚘' },
  { key: 'large',  label: 'Grande',           icon: '🚖' },
  { key: 'suv',    label: 'SUV / 4x4',        icon: '🏔️' },
  { key: 'van',    label: 'Van / Utilitaire', icon: '🚐' },
  { key: 'luxury', label: 'Luxe / Premium',   icon: '💎' },
];

const STATUT_FILTERS = [
  { value: 'all',          label: 'Tous',         icon: null,                     color: '#1B3A6B', bg: '#EFF4FB' },
  { value: 'disponible',   label: 'Disponible',   icon: <CheckCircle size={13}/>, color: '#16A34A', bg: '#DCFCE7' },
  { value: 'loué',         label: 'Loué',         icon: <Key size={13}/>,         color: '#1B3A6B', bg: '#DBEAFE' },
  { value: 'maintenance',  label: 'Maintenance',  icon: <Wrench size={13}/>,      color: '#D97706', bg: '#FEF9C3' },
  { value: 'a_vendre',     label: 'À vendre',     icon: <Tag size={13}/>,         color: '#E8A020', bg: '#FEF3DC' },
  { value: 'vendu',        label: 'Vendu',        icon: <Shield size={13}/>,      color: '#64748B', bg: '#F1F5F9' },
  { value: 'hors service', label: 'Hors service', icon: <XCircle size={13}/>,     color: '#DC2626', bg: '#FEE2E2' },
];

const SMALL_MODELS   = ['clio','picanto','ibiza','fabia','fiesta','yaris','i20','208','polo','c3','i10','aygo','up','smart'];
const MEDIUM_MODELS  = ['golf','logan','megane','focus','corolla','civic','308','passat','301','astra'];
const LARGE_MODELS   = ['508','laguna','insignia','avensis','camry','accord','mondeo'];
const SUV_KEYWORDS   = ['suv','4x4','rav','kuga','tiguan','tuscon','tucson','qashqai','cx','duster','ecosport','sportage','4runner','xtrail','crossover','kadjar','captur','renegade','2008','3008','5008'];
const VAN_KEYWORDS   = ['van','trafic','jumpy','vito','transit','kangoo','berlingo','partner','caddy','master','ducato','boxer','expert','vivaro','transporter'];
const LUXURY_KEYWORDS= ['mercedes','bmw','audi','lexus','porsche','jaguar','maserati','bentley','volvo','infiniti','tesla','genesis'];

const classifyVehicle = (v) => {
  const model   = (v.modele  || '').toLowerCase();
  const brand   = (v.marque  || '').toLowerCase();
  const places  = parseInt(v.nombre_places || 5);
  const prix    = parseFloat(v.prix_journalier || 0);
  const combined = `${brand} ${model}`;
  if (LUXURY_KEYWORDS.some(k => combined.includes(k)) || prix > 200) return 'luxury';
  if (VAN_KEYWORDS.some(k => combined.includes(k)))                   return 'van';
  if (SUV_KEYWORDS.some(k => combined.includes(k)))                   return 'suv';
  if (places >= 6)                                                     return 'large';
  if (LARGE_MODELS.some(k => model.includes(k)))                      return 'large';
  if (SMALL_MODELS.some(k => model.includes(k)) || places <= 4)       return 'small';
  if (MEDIUM_MODELS.some(k => model.includes(k)) || places === 5)     return 'medium';
  return 'medium';
};

const ITEMS_PER_PAGE = 9;

const EMPTY_FORM = {
  marque:'', modele:'', immatriculation:'', annee:'', couleur:'',
  prix_journalier:'', prix_haute_saison:'', prix_tres_haute_saison:'',
  statut:'disponible', type_carburant:'essence', nombre_places:5,
  kilometrage:'', etat_carrosserie:'excellent', notes:'',
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const nb = (v) => parseInt(v || 0);
const parseZones = (raw) => { if (!raw) return []; try { return JSON.parse(raw); } catch { return []; } };

const etatLabel = (e) => ({
  excellent: { label: 'Excellent',        bg: '#DCFCE7', color: '#16A34A' },
  defauts:   { label: 'Défauts mineurs',  bg: '#FEF9C3', color: '#D97706' },
  dommages:  { label: 'Dommages',         bg: '#FEE2E2', color: '#DC2626' },
  sinistre:  { label: 'Sinistre',         bg: '#FEE2E2', color: '#991B1B' },
}[e] || { label: e || '—', bg: '#F1F5F9', color: '#64748B' });

const scoreBadge = (score) => {
  const s = nb(score);
  if (s >= 80) return { bg: '#DCFCE7', color: '#16A34A' };
  if (s >= 50) return { bg: '#FEF9C3', color: '#D97706' };
  return            { bg: '#FEE2E2', color: '#DC2626' };
};

const ZoneChip = ({ zones, color, label }) => {
  if (!zones || zones.length === 0) return null;
  return (
    <span style={{ background: color + '22', color, fontSize:'10.5px', fontWeight:'700',
      padding:'2px 8px', borderRadius:'8px', display:'inline-flex', gap:'4px', alignItems:'center' }}>
      {label}: {zones.length}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// RENTAL ROW
// ─────────────────────────────────────────────────────────────
const RentalRow = ({ r, idx }) => {
  const bosses    = parseZones(r.bosses_retour);
  const eraflures = parseZones(r.eraflures_retour);
  const etatAv    = etatLabel(r.etat_depart || 'excellent');
  const etatAp    = etatLabel(r.etat_retour || null);
  const score     = r.score_retour != null ? scoreBadge(r.score_retour) : null;
  const hasIssue  = r.a_accident || bosses.length > 0 || eraflures.length > 0 || (r.score_retour != null && nb(r.score_retour) < 70);

  return (
    <div style={{ border:`1.5px solid ${hasIssue ? '#FECACA' : '#E2E8F0'}`, borderRadius:'10px',
      marginBottom:'10px', overflow:'hidden', background: hasIssue ? '#FFFAFA' : 'white' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'9px 14px', background: hasIssue ? '#FFF5F5' : '#F8FAFC', borderBottom:'1px solid #F1F5F9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontWeight:'800', fontSize:'11px', color:'#1B3A6B',
            background:'#EFF4FB', borderRadius:'6px', padding:'2px 7px' }}>#{idx + 1}</span>
          <Calendar size={12} color="#64748B"/>
          <span style={{ fontSize:'12px', fontWeight:'700', color:'#1A2535' }}>
            {fmtDate(r.date_debut)} → {fmtDate(r.date_fin)}
          </span>
        </div>
        <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
          {r.a_accident && (
            <span style={{ background:'#FEE2E2', color:'#DC2626', padding:'2px 8px', borderRadius:'8px', fontSize:'10.5px', fontWeight:'700' }}>⚠ Accident</span>
          )}
          {r.inspection_retour_faite ? (
            <span style={{ background:'#DCFCE7', color:'#16A34A', padding:'2px 8px', borderRadius:'8px', fontSize:'10.5px', fontWeight:'700' }}>✓ Inspecté</span>
          ) : (
            <span style={{ background:'#FEF9C3', color:'#D97706', padding:'2px 8px', borderRadius:'8px', fontSize:'10.5px', fontWeight:'700' }}>En cours</span>
          )}
        </div>
      </div>
      <div style={{ padding:'11px 14px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 20px 1fr', gap:'6px', alignItems:'center', marginBottom:'8px' }}>
          <div style={{ background:'#F8FAFC', borderRadius:'8px', padding:'7px 10px' }}>
            <div style={{ fontSize:'9.5px', color:'#94A3B8', fontWeight:'700', marginBottom:'3px', textTransform:'uppercase', letterSpacing:'0.5px' }}>État départ</div>
            <span style={{ background:etatAv.bg, color:etatAv.color, padding:'2px 8px', borderRadius:'8px', fontSize:'10.5px', fontWeight:'700' }}>{etatAv.label}</span>
            {r.kilometrage_depart != null && (
              <div style={{ fontSize:'10px', color:'#64748B', marginTop:'4px', display:'flex', gap:'3px', alignItems:'center' }}>
                <Gauge size={9}/> {nb(r.kilometrage_depart).toLocaleString()} km
              </div>
            )}
          </div>
          <ChevronRight size={14} color="#94A3B8" style={{ margin:'0 auto' }}/>
          <div style={{ background:'#F8FAFC', borderRadius:'8px', padding:'7px 10px' }}>
            <div style={{ fontSize:'9.5px', color:'#94A3B8', fontWeight:'700', marginBottom:'3px', textTransform:'uppercase', letterSpacing:'0.5px' }}>État retour</div>
            {r.inspection_retour_faite ? (
              <>
                <span style={{ background:etatAp.bg, color:etatAp.color, padding:'2px 8px', borderRadius:'8px', fontSize:'10.5px', fontWeight:'700' }}>{etatAp.label}</span>
                {r.kilometrage_retour != null && (
                  <div style={{ fontSize:'10px', color:'#64748B', marginTop:'4px', display:'flex', gap:'3px', alignItems:'center', flexWrap:'wrap' }}>
                    <Gauge size={9}/> {nb(r.kilometrage_retour).toLocaleString()} km
                    {r.kilometrage_depart != null && (
                      <span style={{ color:'#7C3AED', fontWeight:'700' }}>(+{(nb(r.kilometrage_retour) - nb(r.kilometrage_depart)).toLocaleString()})</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize:'10.5px', color:'#94A3B8', fontStyle:'italic' }}>Non inspecté</span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', alignItems:'center' }}>
          {score && (
            <span style={{ background:score.bg, color:score.color, padding:'2px 9px', borderRadius:'8px', fontSize:'10.5px', fontWeight:'800' }}>
              Score: {nb(r.score_retour)}/100
            </span>
          )}
          <ZoneChip zones={bosses}    color="#D97706" label="Bosses"/>
          <ZoneChip zones={eraflures} color="#DC2626" label="Éraflures"/>
          {r.carburant_retour != null && (
            <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'10px', color:'#64748B',
              background:'#F8FAFC', padding:'2px 7px', borderRadius:'7px', fontWeight:'600' }}>
              <Fuel size={9}/> Carburant: {r.carburant_retour}%
            </span>
          )}
        </div>
        {(r.client_nom || r.client) && (
          <div style={{ marginTop:'7px', fontSize:'10.5px', color:'#64748B', display:'flex', gap:'4px', alignItems:'center' }}>
            <User size={10}/> Client: <strong style={{ color:'#1A2535' }}>{r.client_nom || `#${r.client}`}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// RAPPORT ÉTAT MODAL — avec signalement incidents
// ─────────────────────────────────────────────────────────────
const RapportEtatModal = ({ vehicle, reservations, onClose, onDommageSignale }) => {
  const NAVY = '#1B3A6B';

  const [showSignal, setShowSignal] = useState(false);
  const [incidents,  setIncidents]  = useState([]);
  const [loadingInc, setLoadingInc] = useState(false);

  // Form signalement
  const [sigType,    setSigType]    = useState('impact');
  const [sigGravite, setSigGravite] = useState('mineur');
  const [sigZone,    setSigZone]    = useState('');
  const [sigNotes,   setSigNotes]   = useState('');
  const [sigDate,    setSigDate]    = useState(new Date().toISOString().split('T')[0]);
  const [sigCout,    setSigCout]    = useState('');
  const [sigRes,     setSigRes]     = useState('');
  const [sigLoading, setSigLoading] = useState(false);
  const [sigDone,    setSigDone]    = useState(false);

  const vRes = [...(reservations || [])]
    .filter(r => r.vehicle === vehicle?.id)
    .sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut));

  // Charger incidents
  useEffect(() => {
    if (!vehicle?.id) return;
    setLoadingInc(true);
    api.get(`/incidents/?vehicle=${vehicle.id}`)
      .then(res => setIncidents(res.data))
      .catch(() => setIncidents([]))
      .finally(() => setLoadingInc(false));
  }, [vehicle?.id, sigDone]);

  // Stats = reservations + incidents manuels
  const locations = vRes.length;
  const sinistres = [
    ...vRes.filter(r => r.a_accident),
    ...incidents.filter(i => i.type_incident === 'accident'),
  ].length;
  const impacts = vRes.reduce((s, r) => s + parseZones(r.bosses_retour).length, 0)
                + incidents.filter(i => i.type_incident === 'impact').length;
  const rayures = vRes.reduce((s, r) => s + parseZones(r.eraflures_retour).length, 0)
                + incidents.filter(i => i.type_incident === 'rayure').length;
  const inspected = vRes.filter(r => r.inspection_retour_faite).length;
  const kmTotal   = vRes.reduce((s, r) => {
    const diff = nb(r.kilometrage_retour) - nb(r.kilometrage_depart);
    return s + (diff > 0 ? diff : 0);
  }, 0);
  const scores   = vRes.filter(r => r.score_retour != null).map(r => nb(r.score_retour));
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const et       = etatLabel(vehicle?.etat_carrosserie);

  const SIG_TYPES = [
    { key: 'impact',   label: 'Impact / Bosse',    emoji: '💥', color: '#DC2626' },
    { key: 'rayure',   label: 'Éraflure / Rayure', emoji: '—',  color: '#D97706' },
    { key: 'accident', label: 'Accident',           emoji: '⚠️', color: '#991B1B' },
    { key: 'autre',    label: 'Autre',              emoji: '🔧', color: '#64748B' },
  ];
  const GRAVITES = [
    { key: 'mineur', label: 'Mineur', color: '#16A34A' },
    { key: 'modere', label: 'Modéré', color: '#D97706' },
    { key: 'grave',  label: 'Grave',  color: '#DC2626' },
  ];
  const ZONES = ['Avant','Avant gauche','Avant droit','Flanc gauche',
    'Flanc droit','Arrière','Arrière gauche','Arrière droit','Toit','Pare-brise'];

  const handleSignaler = async () => {
    if (!sigNotes.trim()) { alert('Décrivez le dommage avant de sauvegarder.'); return; }
    setSigLoading(true);
    try {
      const payload = {
        vehicle:       vehicle.id,
        type_incident: sigType,
        gravite:       sigGravite,
        zone:          sigZone,
        description:   sigNotes.trim(),
        date_incident: sigDate,
        cout_reparation: sigCout ? parseFloat(sigCout) : null,
        ...(sigRes ? { reservation: parseInt(sigRes) } : {}),
      };
      await api.post('/incidents/', payload);
      setSigDone(true);
      if (onDommageSignale) onDommageSignale();
      setTimeout(() => {
        setSigDone(false); setShowSignal(false);
        setSigNotes(''); setSigZone(''); setSigType('impact');
        setSigGravite('mineur'); setSigCout(''); setSigRes('');
      }, 2200);
    } catch (err) {
      alert('Erreur : ' + JSON.stringify(err?.response?.data || err?.message));
    } finally { setSigLoading(false); }
  };

  const handleMarkRepare = async (incId) => {
    try {
      await api.patch(`/incidents/${incId}/`, { repare: true, date_reparation: new Date().toISOString().split('T')[0] });
      setIncidents(prev => prev.map(i => i.id === incId ? { ...i, repare: true } : i));
    } catch { alert('Erreur lors de la mise à jour'); }
  };

  const incidentColor = (type) => ({ impact:'#DC2626', rayure:'#D97706', accident:'#991B1B', autre:'#64748B' }[type] || '#64748B');
  const incidentEmoji = (type) => ({ impact:'💥', rayure:'—', accident:'⚠️', autre:'🔧' }[type] || '🔧');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex:1100 }}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{ maxWidth:'680px', maxHeight:'90vh', display:'flex', flexDirection:'column', padding:0 }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', background:NAVY, borderRadius:'12px 12px 0 0',
          display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <div style={{ color:'white', fontWeight:'800', fontSize:'15px', display:'flex', gap:'7px', alignItems:'center' }}>
              <Shield size={16}/> Rapport d'État — {vehicle.marque} {vehicle.modele}
            </div>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'11.5px', marginTop:'2px' }}>
              {vehicle.immatriculation} · {vehicle.annee} · {vehicle.couleur}
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={() => { setShowSignal(s => !s); setSigDone(false); }}
              style={{ background: showSignal ? '#DC2626' : 'rgba(220,38,38,0.18)', color: showSignal ? 'white' : '#FCA5A5',
                border:'none', borderRadius:'8px', cursor:'pointer', padding:'7px 13px',
                fontWeight:'700', fontSize:'12px', display:'flex', alignItems:'center', gap:'5px' }}>
              <AlertTriangle size={14}/> {showSignal ? '✕ Fermer' : '+ Signaler dommage'}
            </button>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none',
              borderRadius:'8px', color:'white', cursor:'pointer', padding:'6px', display:'flex' }}>
              <X size={17}/>
            </button>
          </div>
        </div>

        {/* Panneau signalement */}
        {showSignal && (
          <div style={{ background:'#FFF5F5', borderBottom:'2px solid #FECACA', padding:'16px 20px', flexShrink:0 }}>
            {sigDone ? (
              <div style={{ textAlign:'center', padding:'14px', color:'#16A34A', fontWeight:'800', fontSize:'14px',
                background:'#F0FFF4', borderRadius:'10px', border:'2px solid #86EFAC' }}>
                ✅ Incident enregistré — état du véhicule mis à jour automatiquement
              </div>
            ) : (
              <>
                <div style={{ fontWeight:'800', fontSize:'12.5px', color:'#DC2626', marginBottom:'12px',
                  display:'flex', alignItems:'center', gap:'6px' }}>
                  <AlertTriangle size={13}/> Signaler un incident / dommage
                </div>

                {/* Type */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px', marginBottom:'11px' }}>
                  {SIG_TYPES.map(t => (
                    <button key={t.key} onClick={() => setSigType(t.key)}
                      style={{ padding:'8px 4px', borderRadius:'8px', cursor:'pointer', textAlign:'center',
                        border:`2px solid ${sigType === t.key ? t.color : '#DDE3ED'}`,
                        background: sigType === t.key ? t.color + '15' : 'white',
                        color: sigType === t.key ? t.color : '#64748B',
                        fontWeight:'700', fontSize:'11px' }}>
                      <div style={{ fontSize:'16px', marginBottom:'2px' }}>{t.emoji}</div>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Gravité */}
                <div style={{ display:'flex', gap:'6px', marginBottom:'11px', alignItems:'center' }}>
                  <span style={{ fontSize:'11px', fontWeight:'700', color:'#64748B', marginRight:'4px' }}>Gravité :</span>
                  {GRAVITES.map(g => (
                    <button key={g.key} onClick={() => setSigGravite(g.key)}
                      style={{ flex:1, padding:'6px', borderRadius:'8px', cursor:'pointer',
                        border:`2px solid ${sigGravite === g.key ? g.color : '#DDE3ED'}`,
                        background: sigGravite === g.key ? g.color + '15' : 'white',
                        color: sigGravite === g.key ? g.color : '#64748B',
                        fontWeight:'700', fontSize:'11.5px' }}>
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Zone + Date + Cout */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'10px' }}>
                  <div>
                    <label style={{ fontSize:'10.5px', fontWeight:'700', color:'#64748B', display:'block', marginBottom:'3px' }}>Zone</label>
                    <select value={sigZone} onChange={e => setSigZone(e.target.value)}
                      style={{ width:'100%', padding:'7px', borderRadius:'7px', border:'1.5px solid #DDE3ED', fontSize:'12px' }}>
                      <option value="">-- Générale --</option>
                      {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:'10.5px', fontWeight:'700', color:'#64748B', display:'block', marginBottom:'3px' }}>Date incident</label>
                    <input type="date" value={sigDate} onChange={e => setSigDate(e.target.value)}
                      style={{ width:'100%', padding:'7px', borderRadius:'7px', border:'1.5px solid #DDE3ED', fontSize:'12px', boxSizing:'border-box' }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:'10.5px', fontWeight:'700', color:'#64748B', display:'block', marginBottom:'3px' }}>Coût réparation (DT)</label>
                    <input type="number" value={sigCout} onChange={e => setSigCout(e.target.value)}
                      placeholder="Optionnel"
                      style={{ width:'100%', padding:'7px', borderRadius:'7px', border:'1.5px solid #DDE3ED', fontSize:'12px', boxSizing:'border-box' }}/>
                  </div>
                </div>

                {/* Réservation liée */}
                {vRes.length > 0 && (
                  <div style={{ marginBottom:'10px' }}>
                    <label style={{ fontSize:'10.5px', fontWeight:'700', color:'#64748B', display:'block', marginBottom:'3px' }}>
                      Lier à une réservation (optionnel)
                    </label>
                    <select value={sigRes} onChange={e => setSigRes(e.target.value)}
                      style={{ width:'100%', padding:'7px', borderRadius:'7px', border:'1.5px solid #DDE3ED', fontSize:'12px' }}>
                      <option value="">-- Sans réservation (incident garage) --</option>
                      {vRes.map(r => (
                        <option key={r.id} value={r.id}>
                          #{r.id} · {r.date_debut} → {r.date_fin} · {r.client_nom || `Client #${r.client}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div style={{ marginBottom:'10px' }}>
                  <label style={{ fontSize:'10.5px', fontWeight:'700', color:'#64748B', display:'block', marginBottom:'3px' }}>
                    Description <span style={{ color:'#DC2626' }}>*</span>
                  </label>
                  <textarea value={sigNotes} onChange={e => setSigNotes(e.target.value)}
                    placeholder="Ex: Éraflure profonde sur le flanc droit, longueur ~20cm, découverte au retour de location..."
                    rows={2}
                    style={{ width:'100%', padding:'9px', border:'1.5px solid #FECACA', borderRadius:'8px',
                      fontSize:'12.5px', resize:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
                </div>

                <div style={{ background:'#FEF9C3', border:'1px solid #FDE68A', borderRadius:'8px',
                  padding:'7px 12px', fontSize:'11px', color:'#92580A', fontWeight:'600', marginBottom:'10px',
                  display:'flex', alignItems:'center', gap:'6px' }}>
                  ℹ️ L'état carrosserie du véhicule sera mis à jour automatiquement.
                  {sigType === 'accident' && ' La réservation liée sera marquée "accident".'}
                </div>

                <button onClick={handleSignaler} disabled={sigLoading || !sigNotes.trim()}
                  style={{ width:'100%', padding:'10px', fontWeight:'800', fontSize:'13px', border:'none',
                    borderRadius:'9px', cursor: sigLoading || !sigNotes.trim() ? 'not-allowed' : 'pointer',
                    background: sigLoading || !sigNotes.trim() ? '#DDE3ED' : '#DC2626',
                    color:'white', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                  {sigLoading ? '⏳ Enregistrement...' : '💾 Enregistrer l\'incident'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ overflowY:'auto', flex:1, padding:'16px 20px' }}>

          {/* État actuel */}
          <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'12px 14px',
            marginBottom:'14px', border:'1.5px solid #E2E8F0' }}>
            <div style={{ fontWeight:'800', fontSize:'12.5px', color:NAVY, marginBottom:'8px',
              display:'flex', gap:'5px', alignItems:'center' }}>
              <Eye size={13}/> État actuel du véhicule
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ background:et.bg, color:et.color, padding:'2px 9px', borderRadius:'9px', fontSize:'11px', fontWeight:'700' }}>
                {et.label}
              </span>
              <span style={{ fontSize:'11px', color:'#64748B', display:'flex', gap:'3px', alignItems:'center' }}>
                <Gauge size={11}/> {nb(vehicle.kilometrage).toLocaleString()} km
              </span>
              <span style={{ fontSize:'11px', color:'#64748B', display:'flex', gap:'3px', alignItems:'center' }}>
                <Fuel size={11}/> {vehicle.type_carburant}
              </span>
              <span style={{ fontSize:'11px', color:'#64748B', display:'flex', gap:'3px', alignItems:'center' }}>
                <Users size={11}/> {vehicle.nombre_places} places
              </span>
            </div>
          </div>

          {/* Stats — incluent incidents manuels */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'7px', marginBottom:'12px' }}>
            {[
              { icon:<Car size={14}/>,           val:locations, label:'Locations', color:NAVY      },
              { icon:<AlertTriangle size={14}/>, val:sinistres, label:'Sinistres', color:'#DC2626' },
              { icon:<Wrench size={14}/>,        val:impacts,   label:'Impacts',   color:'#D97706' },
              { icon:<Shield size={14}/>,        val:rayures,   label:'Rayures',   color:'#7C3AED' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center', background:'#F8FAFC', borderRadius:'8px', padding:'8px 4px' }}>
                <div style={{ color:s.color, display:'flex', justifyContent:'center', marginBottom:'2px' }}>{s.icon}</div>
                <div style={{ fontWeight:'800', fontSize:'17px', color:s.color }}>{s.val}</div>
                <div style={{ fontSize:'9.5px', color:'#94A3B8', fontWeight:'600' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Km / Score / Inspections */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'7px', marginBottom:'16px' }}>
            <div style={{ background:'#EFF4FB', borderRadius:'8px', padding:'9px 10px', textAlign:'center' }}>
              <div style={{ fontSize:'9.5px', color:'#64748B', fontWeight:'700', textTransform:'uppercase', marginBottom:'3px' }}>Km parcourus</div>
              <div style={{ fontWeight:'800', fontSize:'14px', color:NAVY }}>{kmTotal > 0 ? `+${kmTotal.toLocaleString()}` : '—'}</div>
            </div>
            <div style={{ background:'#F3EEFF', borderRadius:'8px', padding:'9px 10px', textAlign:'center' }}>
              <div style={{ fontSize:'9.5px', color:'#64748B', fontWeight:'700', textTransform:'uppercase', marginBottom:'3px' }}>Score moyen retour</div>
              <div style={{ fontWeight:'800', fontSize:'14px', color:'#7C3AED' }}>{avgScore != null ? `${avgScore}/100` : '—'}</div>
            </div>
            <div style={{ background:'#DCFCE7', borderRadius:'8px', padding:'9px 10px', textAlign:'center' }}>
              <div style={{ fontSize:'9.5px', color:'#64748B', fontWeight:'700', textTransform:'uppercase', marginBottom:'3px' }}>Inspections</div>
              <div style={{ fontWeight:'800', fontSize:'14px', color:'#16A34A' }}>{inspected}/{locations}</div>
            </div>
          </div>

          {/* Incidents manuels */}
          {(incidents.length > 0 || loadingInc) && (
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontWeight:'800', fontSize:'12.5px', color:'#DC2626', marginBottom:'9px',
                display:'flex', gap:'5px', alignItems:'center' }}>
                <AlertTriangle size={13}/> Incidents enregistrés
                <span style={{ background:'#FEE2E2', color:'#DC2626', padding:'1px 7px', borderRadius:'7px', fontSize:'10.5px' }}>
                  {incidents.length}
                </span>
              </div>
              {loadingInc ? (
                <div style={{ textAlign:'center', padding:'12px', color:'#94A3B8', fontSize:'12px' }}>Chargement...</div>
              ) : (
                incidents.map(inc => (
                  <div key={inc.id} style={{ border:`1.5px solid ${inc.repare ? '#DDE3ED' : incidentColor(inc.type_incident) + '55'}`,
                    borderRadius:'9px', marginBottom:'8px', overflow:'hidden',
                    background: inc.repare ? '#F8FAFC' : '#FFFAFA', opacity: inc.repare ? 0.7 : 1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'8px 12px', background: inc.repare ? '#F1F5F9' : incidentColor(inc.type_incident) + '10',
                      borderBottom:'1px solid #F1F5F9' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                        <span style={{ fontSize:'14px' }}>{incidentEmoji(inc.type_incident)}</span>
                        <span style={{ fontWeight:'800', fontSize:'11.5px', color:incidentColor(inc.type_incident) }}>{inc.type_label}</span>
                        <span style={{ background:incidentColor(inc.type_incident) + '20', color:incidentColor(inc.type_incident),
                          padding:'1px 7px', borderRadius:'7px', fontSize:'10px', fontWeight:'700' }}>{inc.gravite_label}</span>
                        {inc.zone && (
                          <span style={{ background:'#F1F5F9', color:'#64748B', padding:'1px 7px', borderRadius:'7px', fontSize:'10px', fontWeight:'600' }}>
                            📍 {inc.zone}
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'10.5px', color:'#94A3B8', fontWeight:'600' }}>
                          {new Date(inc.date_incident).toLocaleDateString('fr-FR')}
                        </span>
                        {inc.repare ? (
                          <span style={{ background:'#DCFCE7', color:'#16A34A', padding:'2px 8px', borderRadius:'7px', fontSize:'10px', fontWeight:'700' }}>✓ Réparé</span>
                        ) : (
                          <button onClick={() => handleMarkRepare(inc.id)}
                            style={{ background:'#DCFCE7', color:'#16A34A', border:'none', borderRadius:'7px',
                              padding:'3px 9px', cursor:'pointer', fontWeight:'700', fontSize:'10px' }}>
                            Marquer réparé
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ padding:'8px 12px' }}>
                      <div style={{ fontSize:'12px', color:'#475569', marginBottom:'4px' }}>{inc.description}</div>
                      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                        {inc.reservation_info ? (
                          <span style={{ fontSize:'10.5px', color:'#1B3A6B', display:'flex', gap:'3px', alignItems:'center' }}>
                            <Calendar size={10}/> Rés. #{inc.reservation_info.id} · {inc.reservation_info.date_debut} → {inc.reservation_info.date_fin}
                          </span>
                        ) : (
                          <span style={{ fontSize:'10.5px', color:'#94A3B8', fontStyle:'italic' }}>🔧 Incident hors réservation (garage)</span>
                        )}
                        {inc.cout_reparation && (
                          <span style={{ fontSize:'10.5px', color:'#D97706', fontWeight:'700' }}>
                            💰 Coût: {parseFloat(inc.cout_reparation).toFixed(0)} DT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Historique locations */}
          <div style={{ fontWeight:'800', fontSize:'12.5px', color:NAVY, marginBottom:'9px',
            display:'flex', gap:'5px', alignItems:'center' }}>
            <Clock size={13}/> Historique des locations
            <span style={{ background:'#EFF4FB', color:NAVY, padding:'1px 7px', borderRadius:'7px', fontSize:'10.5px' }}>{locations}</span>
          </div>
          {vRes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px', color:'#94A3B8',
              background:'#F8FAFC', borderRadius:'10px', border:'1.5px dashed #DDE3ED' }}>
              <Car size={30} color="#DDE3ED" style={{ margin:'0 auto 8px' }}/>
              <p style={{ fontWeight:'600', color:'#64748B', margin:0 }}>Aucune location enregistrée</p>
            </div>
          ) : (
            vRes.map((r, idx) => <RentalRow key={r.id} r={r} idx={vRes.length - 1 - idx}/>)
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'11px 20px', borderTop:'1px solid #E2E8F0', background:'#F8FAFC',
          borderRadius:'0 0 12px 12px', flexShrink:0, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 22px', background:NAVY, color:'white',
            border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'13px' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const Vehicles = () => {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [vehicles,     setVehicles]     = useState([]);
  const [reservations, setReservations] = useState([]);
  const [showModal,    setShowModal]    = useState(false);
  const [editingVeh,   setEditingVeh]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [statFilter,   setStatFilter]   = useState('all');
  const [catFilter,    setCatFilter]    = useState('all');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [activeTab,    setActiveTab]    = useState('infos');
  const [photoFile,    setPhotoFile]    = useState(null);
  const [rapportVeh,   setRapportVeh]   = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [v, r] = await Promise.all([api.get('/vehicles/'), api.get('/reservations/')]);
      setVehicles(v.data);
      setReservations(r.data);
    } catch (err) { console.error(err); }
  };

  const getVehicleStats = (id) => ({
    locations: reservations.filter(r => r.vehicle === id).length,
    sinistres: reservations.filter(r => r.vehicle === id && r.a_accident).length,
    impacts:   reservations.filter(r => r.vehicle === id).reduce((s, r) => s + parseZones(r.bosses_retour).length, 0),
    rayures:   reservations.filter(r => r.vehicle === id).reduce((s, r) => s + parseZones(r.eraflures_retour).length, 0),
  });

  const hasAlert = (v) => {
    const today = new Date();
    const soon = (dateStr) => { if (!dateStr) return false; const d = new Date(dateStr); return d < today || ((d - today) < 30*24*3600*1000); };
    return soon(v.date_revision) || soon(v.date_assurance) || soon(v.date_ct);
  };

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || [v.marque, v.modele, v.immatriculation, v.couleur].some(f => (f || '').toLowerCase().includes(q));
    const matchStat   = statFilter === 'all' || norm(v.statut) === norm(statFilter);
    const matchCat    = catFilter  === 'all' || classifyVehicle(v) === catFilter;
    return matchSearch && matchStat && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalVeh    = vehicles.length;
  const disponibles = vehicles.filter(v => v.statut === 'disponible').length;
  const loues       = vehicles.filter(v => norm(v.statut) === 'loue').length;
  const alerts      = vehicles.filter(v => hasAlert(v)).length;

  const statutStyle = (s) => ({
    disponible:     { bg:'#DCFCE7', color:'#16A34A', label:'disponible'   },
    'loué':         { bg:'#DBEAFE', color:'#1B3A6B', label:'loué'         },
    maintenance:    { bg:'#FEF9C3', color:'#D97706', label:'maintenance'  },
    'hors service': { bg:'#FEE2E2', color:'#DC2626', label:'hors service' },
    'a_vendre':     { bg:'#FEF3DC', color:'#E8A020', label:'à vendre'     },
    'vendu':        { bg:'#F1F5F9', color:'#64748B', label:'vendu'        },
  }[s] || { bg:'#F1F5F9', color:'#64748B', label:s });

  const etatStyle = (e) => ({
    excellent: { bg:'#DCFCE7', color:'#16A34A', label:'Excellent état'    },
    defauts:   { bg:'#FEF9C3', color:'#D97706', label:'Défauts mineurs'  },
    dommages:  { bg:'#FEE2E2', color:'#DC2626', label:'Dommages visibles' },
    sinistre:  { bg:'#FEE2E2', color:'#DC2626', label:'Sinistre déclaré'  },
  }[e] || { bg:'#F1F5F9', color:'#64748B', label:e });

  const suggestPrices = () => {
    const base = parseFloat(form.prix_journalier);
    if (isNaN(base) || base <= 0) return;
    setForm(f => ({ ...f, prix_haute_saison:(base*1.25).toFixed(2), prix_tres_haute_saison:(base*1.50).toFixed(2) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v); });
      if (photoFile) fd.append('photo', photoFile);
      const cfg = { headers:{ 'Content-Type':'multipart/form-data' } };
      if (editingVeh) await api.put(`/vehicles/${editingVeh.id}/`, fd, cfg);
      else            await api.post('/vehicles/', fd, cfg);
      fetchAll(); setShowModal(false); setPhotoFile(null);
    } catch (err) { alert('Erreur: ' + JSON.stringify(err.response?.data)); }
    finally { setLoading(false); }
  };

  const openEdit = (v) => {
    setEditingVeh(v);
    setForm({ ...EMPTY_FORM, ...v, prix_journalier:v.prix_journalier||'', prix_haute_saison:v.prix_haute_saison||'', prix_tres_haute_saison:v.prix_tres_haute_saison||'' });
    setActiveTab('infos'); setShowModal(true);
  };
  const openAdd = () => { setEditingVeh(null); setForm(EMPTY_FORM); setActiveTab('infos'); setShowModal(true); };

  const handleMettreEnVente = async (v) => {
    if (!window.confirm(`Mettre "${v.marque} ${v.modele}" en vente ?`)) return;
    try { await api.patch(`/vehicles/${v.id}/`, { statut:'a_vendre' }); setVehicles(prev => prev.map(x => x.id===v.id ? {...x,statut:'a_vendre'} : x)); }
    catch { alert('Erreur lors de la mise en vente'); }
  };
  const handleMarquerVendu = async (v) => {
    if (!window.confirm(`Confirmer la vente de "${v.marque} ${v.modele}" ?`)) return;
    try { await api.patch(`/vehicles/${v.id}/`, { statut:'vendu' }); setVehicles(prev => prev.map(x => x.id===v.id ? {...x,statut:'vendu'} : x)); }
    catch { alert('Erreur lors de la confirmation de vente'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce véhicule ?')) return;
    try { await api.delete(`/vehicles/${id}/`); fetchAll(); }
    catch (err) { alert('Erreur: ' + JSON.stringify(err.response?.data)); }
  };

  const NAVY  = '#1B3A6B';
  const AMBER = '#E8A020';

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h1 className="page-title" style={{ margin:0, display:'flex', alignItems:'center', gap:'10px' }}>
          <Car size={22} color={NAVY}/> Gestion des Véhicules
        </h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:'7px' }}>
            <Plus size={16}/> Ajouter un véhicule
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
        {[
          { label:'Total',       value:totalVeh,    color:NAVY,     bg:'#EFF4FB', icon:<Car size={18}/> },
          { label:'Disponibles', value:disponibles, color:'#16A34A',bg:'#DCFCE7', icon:<CheckCircle size={18}/> },
          { label:'Loués',       value:loues,       color:'#7C3AED',bg:'#F3EEFF', icon:<Key size={18}/> },
          { label:'Alertes',     value:alerts,      color:'#DC2626',bg:'#FEE2E2', icon:<AlertTriangle size={18}/> },
        ].map(s => (
          <div key={s.label} className="card" style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px 18px' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:s.bg, color:s.color,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:'24px', fontWeight:'800', color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ color:'#64748B', fontSize:'12px', marginTop:'2px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Catégories */}
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'12px' }}>
        {CATEGORIES.map(cat => {
          const count  = cat.key === 'all' ? vehicles.length : vehicles.filter(v => classifyVehicle(v) === cat.key).length;
          const active = catFilter === cat.key;
          return (
            <button key={cat.key} onClick={() => { setCatFilter(cat.key); setCurrentPage(1); }}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 14px', borderRadius:'20px',
                border: active ? 'none' : '1.5px solid #DDE3ED',
                background: active ? NAVY : 'white', color: active ? 'white' : '#64748B',
                fontWeight: active ? '700' : '500', fontSize:'12.5px', cursor:'pointer' }}>
              <span style={{ fontSize:'14px', lineHeight:1 }}>{cat.icon}</span>
              {cat.label}
              <span style={{ background: active ? 'rgba(255,255,255,0.22)' : '#F1F5F9', color: active ? 'white' : '#64748B',
                padding:'1px 7px', borderRadius:'10px', fontSize:'11px', fontWeight:'700' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'12px', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
          <Search size={15} color="#94A3B8" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
          <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Rechercher par marque, modèle, immatriculation..."
            style={{ paddingLeft:'34px', width:'100%' }}/>
        </div>
      </div>

      {/* Statuts */}
      <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', marginBottom:'16px' }}>
        {STATUT_FILTERS.map(s => {
          const count  = s.value === 'all' ? null : vehicles.filter(v => norm(v.statut) === norm(s.value)).length;
          const active = statFilter === s.value;
          return (
            <button key={s.value} onClick={() => { setStatFilter(s.value); setCurrentPage(1); }}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'20px',
                border: active ? 'none' : '1.5px solid #DDE3ED',
                background: active ? s.color : s.bg, color: active ? 'white' : s.color,
                fontWeight:'700', fontSize:'12px', cursor:'pointer',
                boxShadow: active ? `0 2px 10px ${s.color}40` : 'none' }}>
              {s.icon && <span style={{ display:'flex', alignItems:'center' }}>{s.icon}</span>}
              {s.label}
              {count !== null && (
                <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                  padding:'1px 7px', borderRadius:'10px', fontSize:'11px', fontWeight:'800' }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize:'12.5px', color:'#64748B', marginBottom:'14px' }}>
        <strong style={{ color:'#1A2535' }}>{filtered.length}</strong> véhicule{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
        {(search || statFilter !== 'all' || catFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setStatFilter('all'); setCatFilter('all'); setCurrentPage(1); }}
            style={{ marginLeft:'10px', background:'none', border:'none', color:'#DC2626', cursor:'pointer', fontSize:'12px', fontWeight:'600', textDecoration:'underline' }}>
            Effacer filtres
          </button>
        )}
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'40px', color:'#64748B' }}>
          <Car size={40} color="#DDE3ED" style={{ margin:'0 auto 12px' }}/>
          <p style={{ fontWeight:'600' }}>Aucun véhicule trouvé</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'18px' }}>
          {paginated.map(v => {
            const stats   = getVehicleStats(v.id);
            const st      = statutStyle(v.statut);
            const et      = etatStyle(v.etat_carrosserie);
            const alert   = hasAlert(v);
            const cat     = classifyVehicle(v);
            const catInfo = CATEGORIES.find(c => c.key === cat);

            return (
              <div key={v.id} style={{ background:'white', borderRadius:'14px',
                border:`1.5px solid ${alert ? '#FECACA' : '#DDE3ED'}`, overflow:'hidden',
                transition:'box-shadow 0.15s', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 6px 20px rgba(27,58,107,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'}>

                <div style={{ position:'relative', height:'150px', overflow:'hidden' }}>
                  <img src={getCarPhoto(v)} alt={`${v.marque} ${v.modele}`}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.src = CAR_PHOTOS.default; }}/>
                  <div style={{ position:'absolute', top:'10px', left:'10px', display:'flex', gap:'5px', flexWrap:'wrap' }}>
                    <span style={{ background:st.bg, color:st.color, padding:'3px 10px', borderRadius:'12px',
                      fontSize:'11px', fontWeight:'700', backdropFilter:'blur(4px)' }}>{st.label}</span>
                    {getAge(v.date_acquisition) >= 3.5 && v.statut !== 'a_vendre' && v.statut !== 'vendu' && (
                      <span style={{ fontSize:'10px', fontWeight:'800', padding:'2px 6px', borderRadius:'4px',
                        background:'rgba(232,160,32,0.9)', color:'white' }}>🔴 +3.5a</span>
                    )}
                    <span style={{ background:'rgba(255,255,255,0.9)', color:'#64748B', padding:'3px 8px',
                      borderRadius:'10px', fontSize:'10.5px', fontWeight:'600' }}>{catInfo?.icon} {catInfo?.label}</span>
                  </div>
                  {alert && (
                    <div style={{ position:'absolute', top:'10px', right:'10px' }}>
                      <AlertTriangle size={18} color="#DC2626" style={{ background:'white', borderRadius:'50%', padding:'2px' }}/>
                    </div>
                  )}
                  <div style={{ position:'absolute', bottom:'8px', right:'8px', display:'flex', flexDirection:'column', gap:'3px', alignItems:'flex-end' }}>
                    {v.prix_haute_saison && (
                      <span style={{ background:'#FEF3DC', color:'#92580A', padding:'2px 7px', borderRadius:'8px', fontSize:'10px', fontWeight:'700' }}>
                        Été: {parseFloat(v.prix_haute_saison).toFixed(0)} DT/j
                      </span>
                    )}
                    {v.prix_tres_haute_saison && (
                      <span style={{ background:'#FEE2E2', color:'#DC2626', padding:'2px 7px', borderRadius:'8px', fontSize:'10px', fontWeight:'700' }}>
                        Juil-Août: {parseFloat(v.prix_tres_haute_saison).toFixed(0)} DT/j
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                    <div>
                      <div style={{ fontWeight:'800', fontSize:'15px', color:'#1A2535' }}>{v.marque} {v.modele}</div>
                      <div style={{ color:NAVY, fontWeight:'700', fontSize:'12px', marginTop:'1px' }}>{v.immatriculation} · {v.annee}</div>
                    </div>
                    <div style={{ fontSize:'16px', fontWeight:'800', color:'#16A34A' }}>{parseFloat(v.prix_journalier).toFixed(0)} DT/j</div>
                  </div>

                  <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'10px' }}>
                    {[
                      { icon:<Fuel size={12}/>,    val:v.type_carburant },
                      { icon:<Users size={12}/>,   val:`${v.nombre_places} pl.` },
                      { icon:<Gauge size={12}/>,   val:`${(v.kilometrage||0).toLocaleString()} km` },
                      { icon:<Palette size={12}/>, val:v.couleur },
                    ].map((s,i) => (
                      <span key={i} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11.5px', color:'#64748B' }}>
                        {s.icon} {s.val}
                      </span>
                    ))}
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    background:'#F8FAFC', borderRadius:'8px', padding:'7px 10px', marginBottom:'10px' }}>
                    <span style={{ fontSize:'11.5px', color:'#64748B', display:'flex', alignItems:'center', gap:'5px' }}>
                      <Shield size={12}/> État carrosserie
                    </span>
                    <span style={{ background:et.bg, color:et.color, padding:'2px 8px', borderRadius:'8px', fontSize:'11px', fontWeight:'700' }}>
                      {et.label}
                    </span>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'4px', marginBottom:'12px' }}>
                    {[
                      { icon:<Car size={13}/>,           val:stats.locations, label:'Locations', color:NAVY      },
                      { icon:<AlertTriangle size={13}/>, val:stats.sinistres, label:'Sinistres', color:'#DC2626' },
                      { icon:<Wrench size={13}/>,        val:stats.impacts,   label:'Impacts',   color:'#D97706' },
                      { icon:<Shield size={13}/>,        val:stats.rayures,   label:'Rayures',   color:'#7C3AED' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign:'center', background:'#F8FAFC', borderRadius:'7px', padding:'5px 4px' }}>
                        <div style={{ color:s.color, display:'flex', justifyContent:'center', marginBottom:'2px' }}>{s.icon}</div>
                        <div style={{ fontWeight:'800', fontSize:'13px', color:s.color }}>{s.val}</div>
                        <div style={{ fontSize:'9.5px', color:'#94A3B8', fontWeight:'600' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    <div style={{ display:'flex', gap:'7px' }}>
                      <button onClick={() => openEdit(v)}
                        style={{ flex:1, padding:'8px', background:NAVY, color:'white', border:'none',
                          borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'12.5px',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                        <Pencil size={13}/> Modifier
                      </button>
                      <button onClick={() => setRapportVeh(v)}
                        style={{ flex:1, padding:'8px', background:'#F3EEFF', color:'#7C3AED',
                          border:'1.5px solid #DDD6FE', borderRadius:'8px', cursor:'pointer',
                          fontWeight:'700', fontSize:'12.5px', display:'flex', alignItems:'center',
                          justifyContent:'center', gap:'5px' }}>
                        <Eye size={13}/> Rapport État
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(v.id)}
                          style={{ width:'36px', padding:'8px', background:'#FEE2E2', color:'#DC2626',
                            border:'none', borderRadius:'8px', cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                    {isAdmin && v.statut !== 'vendu' && getAge(v.date_acquisition) >= 3.5 && v.statut !== 'a_vendre' && (
                      <button onClick={() => handleMettreEnVente(v)}
                        style={{ width:'100%', padding:'8px', background:'#FEF3DC', color:'#E8A020',
                          border:'1.5px solid #FCD34D', borderRadius:'8px', cursor:'pointer',
                          fontWeight:'700', fontSize:'12px', display:'flex', alignItems:'center',
                          justifyContent:'center', gap:'6px' }}>
                        <Tag size={13}/> Mettre en vente
                      </button>
                    )}
                    {isAdmin && v.statut === 'a_vendre' && (
                      <button onClick={() => handleMarquerVendu(v)}
                        style={{ width:'100%', padding:'8px', background:'#DCFCE7', color:'#16A34A',
                          border:'1.5px solid #86EFAC', borderRadius:'8px', cursor:'pointer',
                          fontWeight:'700', fontSize:'12px', display:'flex', alignItems:'center',
                          justifyContent:'center', gap:'6px' }}>
                        <CheckCircle size={13}/> Marquer comme vendu
                      </button>
                    )}
                    {v.statut === 'vendu' && (
                      <div style={{ width:'100%', padding:'8px', background:'#F1F5F9', color:'#64748B',
                        borderRadius:'8px', fontWeight:'700', fontSize:'12px',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                        <Shield size={13}/> Véhicule vendu
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ marginTop:'20px' }}>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
          totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE}/>
      </div>

      {/* Modal Ajouter/Modifier */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:'700px' }}>
            <h2>{editingVeh ? <><Pencil size={17}/> Modifier le véhicule</> : <><Plus size={17}/> Ajouter un véhicule</>}</h2>
            <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:'#F8FAFC', borderRadius:'10px', padding:'4px' }}>
              {[{key:'infos',label:'Infos'},{key:'tech',label:'Technique'},{key:'tarifs',label:'Tarifs'},{key:'assurance',label:'Assurance'},{key:'photo',label:'Photo'}].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{ flex:1, padding:'7px', border:'none', borderRadius:'8px', cursor:'pointer',
                    fontWeight:'700', fontSize:'12.5px',
                    background: activeTab === t.key ? NAVY : 'transparent',
                    color: activeTab === t.key ? 'white' : '#64748B' }}>
                  {t.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit}>
              {activeTab === 'infos' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <div className="form-group"><label>Marque *</label><input value={form.marque} onChange={e => setForm({...form,marque:e.target.value})} required/></div>
                  <div className="form-group"><label>Modèle *</label><input value={form.modele} onChange={e => setForm({...form,modele:e.target.value})} required/></div>
                  <div className="form-group"><label>Immatriculation *</label><input value={form.immatriculation} onChange={e => setForm({...form,immatriculation:e.target.value})} required/></div>
                  <div className="form-group"><label>Année</label><input type="number" value={form.annee} onChange={e => setForm({...form,annee:e.target.value})}/></div>
                  <div className="form-group"><label>Couleur</label><input value={form.couleur} onChange={e => setForm({...form,couleur:e.target.value})}/></div>
                  <div className="form-group"><label>Statut</label>
                    <select value={form.statut} onChange={e => setForm({...form,statut:e.target.value})}>
                      <option value="disponible">Disponible</option>
                      <option value="loué">Loué</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="a_vendre">À vendre</option>
                      <option value="vendu">Vendu</option>
                      <option value="hors service">Hors service</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}><label>État carrosserie</label>
                    <select value={form.etat_carrosserie} onChange={e => setForm({...form,etat_carrosserie:e.target.value})}>
                      <option value="excellent">Excellent état</option>
                      <option value="defauts">Défauts mineurs</option>
                      <option value="dommages">Dommages visibles</option>
                      <option value="sinistre">Sinistre déclaré</option>
                    </select>
                  </div>
                </div>
              )}
              {activeTab === 'tech' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <div className="form-group"><label>Type carburant</label>
                    <select value={form.type_carburant} onChange={e => setForm({...form,type_carburant:e.target.value})}>
                      <option value="essence">Essence</option>
                      <option value="diesel">Diesel</option>
                      <option value="hybride">Hybride</option>
                      <option value="électrique">Électrique</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Nombre de places</label><input type="number" value={form.nombre_places} onChange={e => setForm({...form,nombre_places:e.target.value})} min="2" max="9"/></div>
                  <div className="form-group"><label>Kilométrage</label><input type="number" value={form.kilometrage} onChange={e => setForm({...form,kilometrage:e.target.value})}/></div>
                  <div className="form-group"><label>Date révision</label><input type="date" value={form.date_revision||''} onChange={e => setForm({...form,date_revision:e.target.value})}/></div>
                  <div className="form-group"><label>Date CT</label><input type="date" value={form.date_ct||''} onChange={e => setForm({...form,date_ct:e.target.value})}/></div>
                </div>
              )}
              {activeTab === 'tarifs' && (
                <div>
                  <div style={{ marginBottom:'14px' }}>
                    <div className="form-group">
                      <label>Prix journalier de base (DT) *</label>
                      <input type="number" value={form.prix_journalier} onChange={e => setForm({...form,prix_journalier:e.target.value})} required step="0.01"/>
                    </div>
                  </div>
                  <button type="button" onClick={suggestPrices}
                    style={{ marginBottom:'14px', padding:'8px 14px', background:'#EFF4FB', color:NAVY,
                      border:'1.5px solid #DDE3ED', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'12.5px' }}>
                    Suggérer prix saisonniers automatiquement
                  </button>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                    <div className="form-group" style={{ background:'#FEF9C3', padding:'12px', borderRadius:'10px', border:'1px solid #FEF08A' }}>
                      <label style={{ color:'#92580A' }}>Prix Haute saison +25% (Juin/Sep)</label>
                      <input type="number" value={form.prix_haute_saison} onChange={e => setForm({...form,prix_haute_saison:e.target.value})} step="0.01" style={{ marginTop:'6px' }}/>
                    </div>
                    <div className="form-group" style={{ background:'#FEE2E2', padding:'12px', borderRadius:'10px', border:'1px solid #FECACA' }}>
                      <label style={{ color:'#991B1B' }}>Prix Très haute saison +50% (Juil/Août)</label>
                      <input type="number" value={form.prix_tres_haute_saison} onChange={e => setForm({...form,prix_tres_haute_saison:e.target.value})} step="0.01" style={{ marginTop:'6px' }}/>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'assurance' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <div className="form-group"><label>Date assurance</label><input type="date" value={form.date_assurance||''} onChange={e => setForm({...form,date_assurance:e.target.value})}/></div>
                  <div className="form-group"><label>Numéro police</label><input value={form.numero_police||''} onChange={e => setForm({...form,numero_police:e.target.value})}/></div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}><label>Notes</label><textarea rows={3} value={form.notes||''} onChange={e => setForm({...form,notes:e.target.value})} style={{ resize:'vertical' }}/></div>
                </div>
              )}
              {activeTab === 'photo' && (
                <div>
                  {editingVeh?.photo && (
                    <div style={{ marginBottom:'14px' }}>
                      <img src={getCarPhoto(editingVeh)} alt="actuelle" style={{ width:'100%', height:'180px', objectFit:'cover', borderRadius:'10px' }}/>
                      <p style={{ fontSize:'12px', color:'#64748B', marginTop:'6px' }}>Photo actuelle</p>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Choisir une nouvelle photo</label>
                    <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])}/>
                  </div>
                  {photoFile && (
                    <img src={URL.createObjectURL(photoFile)} alt="aperçu" style={{ width:'100%', height:'160px', objectFit:'cover', borderRadius:'10px', marginTop:'10px' }}/>
                  )}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : (editingVeh ? 'Modifier' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rapport État */}
      {rapportVeh && (
        <RapportEtatModal
          vehicle={rapportVeh}
          reservations={reservations}
          onClose={() => setRapportVeh(null)}
          onDommageSignale={fetchAll}
        />
      )}
    </div>
  );
};

export default Vehicles;