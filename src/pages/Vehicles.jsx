import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Plus, Pencil, Trash2, FileText, Search,
  Fuel, Users, Gauge, Palette, AlertTriangle,
  CheckCircle, Wrench, Shield, ChevronDown, ChevronUp,
  Filter, SlidersHorizontal,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

// ── Real car photos by brand (fallback)
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

// ── Photos permanentes par immatriculation
const IMMAT_PHOTOS = {
  '240TN5082': 'https://i.ibb.co/FZmVWK6/vec1.jpg',
  '259TN5651': 'https://i.ibb.co/F4SbDBMM/vec2.jpg',
  '243TN1422': 'https://i.ibb.co/gbw2JtTH/vec3.jpg',
  '236TN5648': 'https://i.ibb.co/0RJ31jBB/vec4.jpg',
  '234TN2126': 'https://i.ibb.co/prkyKtjv/vec5.jpg',
  '244TN7005': 'https://i.ibb.co/P81vS80/vec6.jpg',
  '251TN1694': 'https://i.ibb.co/5WBKGTGL/vec7.jpg',
  '252TN3310': 'https://i.ibb.co/9kNtVZGB/vec8.png',
  '253TN4421': 'https://i.ibb.co/jvRzYcDB/vec9.png',
  '254TN6632': 'https://i.ibb.co/hxvysSY4/vec10.png',
  '255TN7743': 'https://i.ibb.co/dsfz2VnP/vec11.png',
  '256TN8854': 'https://i.ibb.co/35ccmkFY/vec12.jpg',
  // ✅ Nouveaux véhicules — Cloudinary
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

// ── Helper: durée en flotte depuis date_acquisition UNIQUEMENT (Option B)
const getAge = (date_acquisition) => {
  if (!date_acquisition) return 0;
  const acq = new Date(date_acquisition);
  const now = new Date();
  return (now - acq) / (1000 * 60 * 60 * 24 * 365.25);
};

const getCarPhoto = (v) => {
  if (IMMAT_PHOTOS[v?.immatriculation]) return IMMAT_PHOTOS[v?.immatriculation];
  if (v?.photo) {
    const p = String(v.photo);
    if (p.startsWith('http')) return p;
    return `https://web-production-e6e97.up.railway.app${p}`;
  }
  return CAR_PHOTOS[(v?.marque||'').toLowerCase()] || CAR_PHOTOS.default;
};

// ── Vehicle category classification by seats / model keywords
const CATEGORIES = [
  { key: 'all',     label: 'Tous',          icon: <Car size={14} /> },
  { key: 'small',   label: 'Petite',        icon: <Car size={14} />, desc: '2–4 places / citadine' },
  { key: 'medium',  label: 'Moyenne',       icon: <Car size={14} />, desc: '5 places / berline' },
  { key: 'large',   label: 'Grande',        icon: <Car size={14} />, desc: '6–7 places / familiale' },
  { key: 'suv',     label: 'SUV / 4x4',     icon: <Car size={14} /> },
  { key: 'van',     label: 'Van / Utilitaire', icon: <Car size={14} /> },
  { key: 'luxury',  label: 'Luxe / Premium', icon: <Car size={14} /> },
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

const Vehicles = () => {
  const { user }    = useAuth();
  const isAdmin     = user?.role === 'admin';
  const navigate    = useNavigate();

  const [vehicles,   setVehicles]   = useState([]);
  const [reservations, setReservations] = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [editingVeh, setEditingVeh] = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [statFilter, setStatFilter] = useState('all');
  const [catFilter,  setCatFilter]  = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab,  setActiveTab]  = useState('infos');
  const [expandedId, setExpandedId] = useState(null);
  const [photoFile,  setPhotoFile]  = useState(null);

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
    impacts:   reservations.filter(r => r.vehicle === id).reduce((s,r) => s + (r.bosses_retour ? JSON.parse(r.bosses_retour).length : 0), 0),
    rayures:   reservations.filter(r => r.vehicle === id).reduce((s,r) => s + (r.eraflures_retour ? JSON.parse(r.eraflures_retour).length : 0), 0),
  });

  const hasAlert = (v) => {
    const today = new Date();
    const soon  = (dateStr) => { if (!dateStr) return false; const d = new Date(dateStr); return d < today || ((d - today) < 30*24*3600*1000); };
    return soon(v.date_revision) || soon(v.date_assurance) || soon(v.date_ct);
  };

  const filtered = vehicles.filter(v => {
    const q   = search.toLowerCase();
    const matchSearch = !q || [v.marque,v.modele,v.immatriculation,v.couleur].some(f => (f||'').toLowerCase().includes(q));
    const norm = (s) => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const matchStat   = statFilter === 'all' || norm(v.statut) === norm(statFilter);
    const matchCat    = catFilter  === 'all' || classifyVehicle(v) === catFilter;
    return matchSearch && matchStat && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE);

  const handleSearch   = (v) => { setSearch(v);     setCurrentPage(1); };
  const handleStatFilt = (v) => { setStatFilter(v); setCurrentPage(1); };
  const handleCatFilt  = (v) => { setCatFilter(v);  setCurrentPage(1); };

  const totalVeh     = vehicles.length;
  const disponibles  = vehicles.filter(v => v.statut === 'disponible').length;
  const loues        = vehicles.filter(v => (v.statut||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'') === 'loue').length;
  const alerts       = vehicles.filter(v => hasAlert(v)).length;

  const statutStyle = (s) => ({
    disponible:  { bg: '#DCFCE7', color: '#16A34A', label: 'disponible' },
    'loué':      { bg: '#DBEAFE', color: '#1B3A6B', label: 'loué' },
    maintenance: { bg: '#FEF9C3', color: '#D97706', label: 'maintenance' },
    'hors service': { bg: '#FEE2E2', color: '#DC2626', label: 'hors service' },
  }[s] || { bg: '#F1F5F9', color: '#64748B', label: s });

  const etatStyle = (e) => ({
    excellent:    { bg: '#DCFCE7', color: '#16A34A', label: 'Excellent état' },
    defauts:      { bg: '#FEF9C3', color: '#D97706', label: 'Défauts mineurs' },
    dommages:     { bg: '#FEE2E2', color: '#DC2626', label: 'Dommages visibles' },
    sinistre:     { bg: '#FEE2E2', color: '#DC2626', label: 'Sinistre déclaré' },
  }[e] || { bg: '#F1F5F9', color: '#64748B', label: e });

  const suggestPrices = () => {
    const base = parseFloat(form.prix_journalier);
    if (isNaN(base) || base <= 0) return;
    setForm(f => ({
      ...f,
      prix_haute_saison:      (base * 1.25).toFixed(2),
      prix_tres_haute_saison: (base * 1.50).toFixed(2),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v !== '' && v !== null) fd.append(k, v); });
      if (photoFile) fd.append('photo', photoFile);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingVeh) await api.put(`/vehicles/${editingVeh.id}/`, fd, cfg);
      else            await api.post('/vehicles/', fd, cfg);
      fetchAll();
      setShowModal(false);
      setPhotoFile(null);
    } catch (err) {
      alert('Erreur: ' + JSON.stringify(err.response?.data));
    } finally { setLoading(false); }
  };

  const openEdit = (v) => {
    setEditingVeh(v);
    setForm({ ...EMPTY_FORM, ...v, prix_journalier: v.prix_journalier || '', prix_haute_saison: v.prix_haute_saison || '', prix_tres_haute_saison: v.prix_tres_haute_saison || '' });
    setActiveTab('infos');
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingVeh(null);
    setForm(EMPTY_FORM);
    setActiveTab('infos');
    setShowModal(true);
  };

  // ── Vente process
  const handleMettreEnVente = async (v) => {
    if (!window.confirm(`Mettre "${v.marque} ${v.modele}" en vente ?\nLe véhicule ne sera plus disponible pour de nouvelles réservations.`)) return;
    try {
      await api.patch(`/vehicles/${v.id}/`, { statut: 'a_vendre' });
      setVehicles(prev => prev.map(x => x.id === v.id ? { ...x, statut: 'a_vendre' } : x));
    } catch { alert('Erreur lors de la mise en vente'); }
  };

  const handleMarquerVendu = async (v) => {
    if (!window.confirm(`Confirmer la vente de "${v.marque} ${v.modele}" ?\nLe véhicule sera retiré de la flotte active.`)) return;
    try {
      await api.patch(`/vehicles/${v.id}/`, { statut: 'vendu' });
      setVehicles(prev => prev.map(x => x.id === v.id ? { ...x, statut: 'vendu' } : x));
    } catch { alert('Erreur lors de la confirmation de vente'); }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Car size={22} color={NAVY} /> Gestion des Véhicules
        </h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Plus size={16} /> Ajouter un véhicule
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total',       value: totalVeh,    color: NAVY,      bg: '#EFF4FB', icon: <Car size={18} /> },
          { label: 'Disponibles', value: disponibles, color: '#16A34A', bg: '#DCFCE7', icon: <CheckCircle size={18} /> },
          { label: 'Loués',       value: loues,       color: '#7C3AED', bg: '#F3EEFF', icon: <Car size={18} /> },
          { label: 'Alertes',     value: alerts,      color: '#DC2626', bg: '#FEE2E2', icon: <AlertTriangle size={18} /> },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {CATEGORIES.map(cat => {
          const count = cat.key === 'all' ? vehicles.length : vehicles.filter(v => classifyVehicle(v) === cat.key).length;
          const active = catFilter === cat.key;
          return (
            <button key={cat.key} onClick={() => handleCatFilt(cat.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '20px', border: active ? 'none' : '1.5px solid #DDE3ED', background: active ? NAVY : 'white', color: active ? 'white' : '#64748B', fontWeight: active ? '700' : '500', fontSize: '12.5px', cursor: 'pointer', transition: 'all 0.14s' }}>
              {cat.icon} {cat.label}
              <span style={{ background: active ? 'rgba(255,255,255,0.2)' : '#F1F5F9', color: active ? 'white' : '#64748B', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher par marque, modèle, immatriculation..."
            style={{ paddingLeft: '34px', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { value: 'all',          label: 'Tous',         color: NAVY,      bg: '#EFF4FB' },
            { value: 'disponible',   label: '✅ Disponible', color: '#16A34A', bg: '#DCFCE7' },
            { value: 'loué',         label: '🚗 Loué',       color: '#1B3A6B', bg: '#DBEAFE' },
            { value: 'maintenance',  label: '🔧 Maintenance',color: '#D97706', bg: '#FEF9C3' },
            { value: 'a_vendre',     label: '🔴 À vendre',   color: '#E8A020', bg: '#FEF3DC' },
            { value: 'vendu',        label: '✅ Vendu',       color: '#64748B', bg: '#F1F5F9' },
            { value: 'hors service', label: '❌ Hors service',color: '#DC2626', bg: '#FEE2E2' },
          ].map(s => (
            <button key={s.value} onClick={() => handleStatFilt(s.value)}
              style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', background: statFilter === s.value ? s.color : s.bg, color: statFilter === s.value ? 'white' : s.color, transition: 'all 0.15s', boxShadow: statFilter === s.value ? `0 2px 8px ${s.color}40` : 'none' }}>
              {s.label}
              {s.value !== 'all' && (
                <span style={{ marginLeft: '6px', fontWeight: '800' }}>
                  ({vehicles.filter(v => (v.statut||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'') === (s.value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '14px' }}>
        <strong style={{ color: '#1A2535' }}>{filtered.length}</strong> véhicule{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
        {(search || statFilter !== 'all' || catFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setStatFilter('all'); setCatFilter('all'); setCurrentPage(1); }}
            style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textDecoration: 'underline' }}>
            Effacer filtres
          </button>
        )}
      </div>

      {paginated.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
          <Car size={40} color="#DDE3ED" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: '600' }}>Aucun véhicule trouvé</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Modifiez vos filtres ou ajoutez un nouveau véhicule</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '18px' }}>
          {paginated.map(v => {
            const stats   = getVehicleStats(v.id);
            const st      = statutStyle(v.statut);
            const et      = etatStyle(v.etat_carrosserie);
            const alert   = hasAlert(v);
            const cat     = classifyVehicle(v);
            const catInfo = CATEGORIES.find(c => c.key === cat);

            return (
              <div key={v.id} style={{ background: 'white', borderRadius: '14px', border: `1.5px solid ${alert ? '#FECACA' : '#DDE3ED'}`, overflow: 'hidden', transition: 'box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(27,58,107,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}>

                <div style={{ position: 'relative', height: '150px', overflow: 'hidden' }}>
                  <img src={getCarPhoto(v)} alt={`${v.marque} ${v.modele}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backdropFilter: 'blur(4px)' }}>
                      {st.label}
                    </span>
                    {getAge(v.date_acquisition) >= 3.5 && v.statut !== 'a_vendre' && v.statut !== 'vendu' && (
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', background: 'rgba(232,160,32,0.9)', color: 'white' }}>
                        🔴 +3.5a
                      </span>
                    )}
                    <span style={{ background: 'rgba(255,255,255,0.9)', color: '#64748B', padding: '3px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '600' }}>
                      {catInfo?.label}
                    </span>
                  </div>
                  {alert && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <AlertTriangle size={18} color="#DC2626" style={{ background: 'white', borderRadius: '50%', padding: '2px' }} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                    {v.prix_haute_saison && (
                      <span style={{ background: '#FEF3DC', color: '#92580A', padding: '2px 7px', borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>
                        Été: {parseFloat(v.prix_haute_saison).toFixed(0)} DT/j
                      </span>
                    )}
                    {v.prix_tres_haute_saison && (
                      <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '2px 7px', borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>
                        Juil-Août: {parseFloat(v.prix_tres_haute_saison).toFixed(0)} DT/j
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px', color: '#1A2535' }}>{v.marque} {v.modele}</div>
                      <div style={{ color: NAVY, fontWeight: '700', fontSize: '12px', marginTop: '1px' }}>{v.immatriculation} · {v.annee}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#16A34A' }}>{parseFloat(v.prix_journalier).toFixed(0)} DT/j</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {[
                      { icon: <Fuel size={12} />,    val: v.type_carburant },
                      { icon: <Users size={12} />,   val: `${v.nombre_places} pl.` },
                      { icon: <Gauge size={12} />,   val: `${(v.kilometrage||0).toLocaleString()} km` },
                      { icon: <Palette size={12} />, val: v.couleur },
                    ].map((s, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#64748B' }}>
                        {s.icon} {s.val}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', borderRadius: '8px', padding: '7px 10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Shield size={12} /> État carrosserie
                    </span>
                    <span style={{ background: et.bg, color: et.color, padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                      {et.label}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px', marginBottom: '12px' }}>
                    {[
                      { icon: <Car size={13} />,           val: stats.locations, label: 'Locations', color: NAVY },
                      { icon: <AlertTriangle size={13} />, val: stats.sinistres, label: 'Sinistres', color: '#DC2626' },
                      { icon: <Wrench size={13} />,        val: stats.impacts,   label: 'Impacts',   color: '#D97706' },
                      { icon: <Shield size={13} />,        val: stats.rayures,   label: 'Rayures',   color: '#7C3AED' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: '7px', padding: '5px 4px' }}>
                        <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>{s.icon}</div>
                        <div style={{ fontWeight: '800', fontSize: '13px', color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: '600' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Action buttons */}
                  <div style={{ display: 'flex', gap: '7px', flexDirection: 'column' }}>
                    {/* Row 1: Modifier + Rapport */}
                    <div style={{ display: 'flex', gap: '7px' }}>
                      <button onClick={() => openEdit(v)}
                        style={{ flex: 1, padding: '8px', background: NAVY, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <Pencil size={13} /> Modifier
                      </button>
                      <button onClick={() => navigate(`/vehicles/${v.id}/state`)}
                        style={{ flex: 1, padding: '8px', background: '#EFF4FB', color: NAVY, border: '1.5px solid #DDE3ED', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <FileText size={13} /> Rapport état
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(v.id)}
                          style={{ width: '36px', padding: '8px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {/* Row 2: Vente buttons — shown only when relevant */}
                    {isAdmin && v.statut !== 'vendu' && getAge(v.date_acquisition) >= 3.5 && v.statut !== 'a_vendre' && (
                      <button onClick={() => handleMettreEnVente(v)}
                        style={{ width: '100%', padding: '8px', background: '#FEF3DC', color: '#E8A020', border: '1.5px solid #FCD34D', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        🔴 Mettre en vente
                      </button>
                    )}
                    {isAdmin && v.statut === 'a_vendre' && (
                      <button onClick={() => handleMarquerVendu(v)}
                        style={{ width: '100%', padding: '8px', background: '#DCFCE7', color: '#16A34A', border: '1.5px solid #86EFAC', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        ✅ Marquer comme vendu
                      </button>
                    )}
                    {v.statut === 'vendu' && (
                      <div style={{ width: '100%', padding: '8px', background: '#F1F5F9', color: '#64748B', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        ✅ Véhicule vendu
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ marginTop: '20px' }}>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h2>{editingVeh ? <><Pencil size={17} /> Modifier le véhicule</> : <><Plus size={17} /> Ajouter un véhicule</>}</h2>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#F8FAFC', borderRadius: '10px', padding: '4px' }}>
              {[
                { key:'infos',    label:'Infos' },
                { key:'tech',     label:'Technique' },
                { key:'tarifs',   label:'Tarifs' },
                { key:'assurance',label:'Assurance' },
                { key:'photo',    label:'Photo' },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12.5px', background: activeTab === t.key ? NAVY : 'transparent', color: activeTab === t.key ? 'white' : '#64748B', transition: 'all 0.14s' }}>
                  {t.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit}>
              {activeTab === 'infos' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group"><label>Marque *</label><input value={form.marque} onChange={e=>setForm({...form,marque:e.target.value})} required /></div>
                  <div className="form-group"><label>Modèle *</label><input value={form.modele} onChange={e=>setForm({...form,modele:e.target.value})} required /></div>
                  <div className="form-group"><label>Immatriculation *</label><input value={form.immatriculation} onChange={e=>setForm({...form,immatriculation:e.target.value})} required /></div>
                  <div className="form-group"><label>Année</label><input type="number" value={form.annee} onChange={e=>setForm({...form,annee:e.target.value})} /></div>
                  <div className="form-group"><label>Couleur</label><input value={form.couleur} onChange={e=>setForm({...form,couleur:e.target.value})} /></div>
                  <div className="form-group"><label>Statut</label>
                    <select value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})}>
                      <option value="disponible">Disponible</option>
                      <option value="loué">Loué</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="a_vendre">🔴 À vendre</option>
                      <option value="vendu">✅ Vendu</option>
                      <option value="hors service">Hors service</option>
                    </select>
                  </div>
                  <div className="form-group" style={{gridColumn:'1/-1'}}><label>État carrosserie</label>
                    <select value={form.etat_carrosserie} onChange={e=>setForm({...form,etat_carrosserie:e.target.value})}>
                      <option value="excellent">Excellent état</option>
                      <option value="defauts">Défauts mineurs</option>
                      <option value="dommages">Dommages visibles</option>
                      <option value="sinistre">Sinistre déclaré</option>
                    </select>
                  </div>
                </div>
              )}
              {activeTab === 'tech' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group"><label>Type carburant</label>
                    <select value={form.type_carburant} onChange={e=>setForm({...form,type_carburant:e.target.value})}>
                      <option value="essence">Essence</option>
                      <option value="diesel">Diesel</option>
                      <option value="hybride">Hybride</option>
                      <option value="électrique">Électrique</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Nombre de places</label><input type="number" value={form.nombre_places} onChange={e=>setForm({...form,nombre_places:e.target.value})} min="2" max="9" /></div>
                  <div className="form-group"><label>Kilométrage</label><input type="number" value={form.kilometrage} onChange={e=>setForm({...form,kilometrage:e.target.value})} /></div>
                  <div className="form-group"><label>Date révision</label><input type="date" value={form.date_revision||''} onChange={e=>setForm({...form,date_revision:e.target.value})} /></div>
                  <div className="form-group"><label>Date CT</label><input type="date" value={form.date_ct||''} onChange={e=>setForm({...form,date_ct:e.target.value})} /></div>
                </div>
              )}
              {activeTab === 'tarifs' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div className="form-group" style={{gridColumn:'1/-1'}}>
                      <label>Prix journalier de base (DT) *</label>
                      <input type="number" value={form.prix_journalier} onChange={e=>setForm({...form,prix_journalier:e.target.value})} required step="0.01" />
                    </div>
                  </div>
                  <button type="button" onClick={suggestPrices} style={{ marginBottom: '14px', padding: '8px 14px', background: '#EFF4FB', color: NAVY, border: '1.5px solid #DDE3ED', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12.5px' }}>
                    Suggérer prix saisonniers automatiquement
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group" style={{ background: '#FEF9C3', padding: '12px', borderRadius: '10px', border: '1px solid #FEF08A' }}>
                      <label style={{ color: '#92580A' }}>Prix Haute saison +25% (Juin/Sep)</label>
                      <input type="number" value={form.prix_haute_saison} onChange={e=>setForm({...form,prix_haute_saison:e.target.value})} step="0.01" style={{ marginTop: '6px' }} />
                    </div>
                    <div className="form-group" style={{ background: '#FEE2E2', padding: '12px', borderRadius: '10px', border: '1px solid #FECACA' }}>
                      <label style={{ color: '#991B1B' }}>Prix Très haute saison +50% (Juil/Août)</label>
                      <input type="number" value={form.prix_tres_haute_saison} onChange={e=>setForm({...form,prix_tres_haute_saison:e.target.value})} step="0.01" style={{ marginTop: '6px' }} />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'assurance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group"><label>Date assurance</label><input type="date" value={form.date_assurance||''} onChange={e=>setForm({...form,date_assurance:e.target.value})} /></div>
                  <div className="form-group"><label>Numéro police</label><input value={form.numero_police||''} onChange={e=>setForm({...form,numero_police:e.target.value})} /></div>
                  <div className="form-group" style={{gridColumn:'1/-1'}}><label>Notes</label><textarea rows={3} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} style={{resize:'vertical'}} /></div>
                </div>
              )}
              {activeTab === 'photo' && (
                <div>
                  {editingVeh?.photo && (
                    <div style={{ marginBottom: '14px' }}>
                      <img src={getCarPhoto(editingVeh)} alt="actuelle" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '10px' }} />
                      <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>Photo actuelle</p>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Choisir une nouvelle photo</label>
                    <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
                  </div>
                  {photoFile && (
                    <img src={URL.createObjectURL(photoFile)} alt="aperçu" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginTop: '10px' }} />
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
    </div>
  );
};

export default Vehicles;