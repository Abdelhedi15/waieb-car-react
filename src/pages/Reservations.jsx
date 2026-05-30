import { useState, useEffect } from 'react';
import {
  PlusCircle, Bell, RefreshCw, CalendarDays,
  Car, CheckCircle, AlertTriangle, ChevronRight,
  ChevronLeft, SlidersHorizontal, Search,
  Banknote, Users, Gauge, ArrowRight,
} from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';
import './Reservations.css';

const NAVY   = '#1B3A6B';
const AMBER  = '#E8A020';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';

const VEHICLES_PER_PAGE = 6;

// ── Real car photos by brand
const CAR_PHOTOS = {
  renault:    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80',
  peugeot:    'https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=400&q=80',
  volkswagen: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&q=80',
  toyota:     'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&q=80',
  hyundai:    'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=400&q=80',
  dacia:      'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&q=80',
  kia:        'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&q=80',
  seat:       'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80',
  ford:       'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80',
  skoda:      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&q=80',
  default:    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80',
};
const IMMAT_PHOTOS = {'240TN5082':'https://i.ibb.co/FZmVWK6/vec1.jpg','259TN5651':'https://i.ibb.co/F4SbDBMM/vec2.jpg','243TN1422':'https://i.ibb.co/gbw2JtTH/vec3.jpg','236TN5648':'https://i.ibb.co/0RJ31jBB/vec4.jpg','234TN2126':'https://i.ibb.co/prkyKtjv/vec5.jpg','244TN7005':'https://i.ibb.co/P81vS80/vec6.jpg','251TN1694':'https://i.ibb.co/5WBKGTGL/vec7.jpg','252TN3310':'https://i.ibb.co/9kNtVZGB/vec8.png','253TN4421':'https://i.ibb.co/jvRzYcDB/vec9.png','254TN6632':'https://i.ibb.co/hxvysSY4/vec10.png','255TN7743':'https://i.ibb.co/dsfz2VnP/vec11.png','256TN8854':'https://i.ibb.co/35ccmkFY/vec12.jpg','257TN1301':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155233/vec13_jwhixy.jpg','258TN1402':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155237/vec14_emprhi.jpg','259TN1503':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec15_y7lazd.jpg','260TN1604':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec16_pkydhf.jpg','261TN1705':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec17_z2iw32.jpg','262TN1806':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec18_byuiqk.jpg','263TN1907':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec19_g9yvnw.jpg','264TN2008':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec20_kvsoqj.jpg','265TN2109':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec21_bjkcyt.jpg','266TN2210':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155236/vec22_gkpzax.jpg'};
const getCarPhoto = (vehicle) => {
  if (IMMAT_PHOTOS[vehicle?.immatriculation]) return IMMAT_PHOTOS[vehicle?.immatriculation];
  if (vehicle?.photo) {
    const p = String(vehicle.photo);
    if (p.startsWith('http')) return p;
    return `https://web-production-e6e97.up.railway.app${p}`;
  }
  return CAR_PHOTOS[(vehicle?.marque||'').toLowerCase()] || CAR_PHOTOS.default;
};

// ── Season logic
const getPrixSaison = (vehicle, dateDebut) => {
  if (!vehicle || !dateDebut) return 0;
  const mois = new Date(dateDebut).getMonth() + 1;
  if ([7, 8].includes(mois))
    return parseFloat(vehicle.prix_tres_haute_saison || parseFloat(vehicle.prix_journalier) * 1.5);
  if ([6, 9].includes(mois))
    return parseFloat(vehicle.prix_haute_saison || parseFloat(vehicle.prix_journalier) * 1.25);
  return parseFloat(vehicle.prix_journalier);
};

const getSaisonInfo = (dateDebut) => {
  if (!dateDebut) return null;
  const mois = new Date(dateDebut).getMonth() + 1;
  if ([7, 8].includes(mois)) return { label: 'Très haute saison — Juil/Août', color: '#B91C1C', bg: '#FEE2E2', pct: '+50%' };
  if ([6, 9].includes(mois)) return { label: 'Haute saison — Juin/Sep',       color: '#92580A', bg: '#FEF3DC', pct: '+25%' };
  return                            { label: 'Basse saison',                   color: '#166534', bg: '#DCFCE7', pct: 'tarif normal' };
};

// ── Dynamic acompte rules
const ACOMPTE_RULES = [
  { min: 1,  max: 3,   pct: 15, label: '1–3 jours' },
  { min: 4,  max: 7,   pct: 20, label: '4–7 jours' },
  { min: 8,  max: 14,  pct: 25, label: '8–14 jours' },
  { min: 15, max: 999, pct: 30, label: '15+ jours' },
];
const getAcompteRule = (days) =>
  ACOMPTE_RULES.find(r => days >= r.min && days <= r.max) || ACOMPTE_RULES[ACOMPTE_RULES.length - 1];

const calcDays = (debut, fin) => {
  if (!debut || !fin) return 0;
  return Math.max(1, Math.round((new Date(fin) - new Date(debut)) / 86400000));
};

const EMPTY_FORM = {
  client: '', vehicle: '', date_debut: '', date_fin: '',
  statut: 'en_attente', montant_total: '', acompte: '',
  caution: '', notes: '',
  vehicule_remplace: '', raison_remplacement: '',
};

// ── Mini pagination component (inline, no external import needed)
const MiniPagination = ({ currentPage, totalPages, onPageChange, totalItems, perPage }) => {
  if (totalPages <= 1) return null;
  const from = (currentPage - 1) * perPage + 1;
  const to   = Math.min(currentPage * perPage, totalItems);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #DDE3ED' }}>
      <div style={{ fontSize: '12px', color: '#64748B' }}>
        <strong style={{ color: '#1A2535' }}>{from}–{to}</strong> sur <strong style={{ color: '#1A2535' }}>{totalItems}</strong> véhicules
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          style={{ width: '32px', height: '32px', border: '1.5px solid #DDE3ED', borderRadius: '8px', background: currentPage === 1 ? '#FAFAFA' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === 1 ? '#C8D0DC' : NAVY }}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPageChange(p)}
            style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: p === currentPage ? NAVY : 'white', border: p === currentPage ? 'none' : '1.5px solid #DDE3ED', color: p === currentPage ? 'white' : '#1A2535', fontWeight: p === currentPage ? '800' : '500', fontSize: '13px', cursor: 'pointer' }}>
            {p}
          </button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          style={{ width: '32px', height: '32px', border: '1.5px solid #DDE3ED', borderRadius: '8px', background: currentPage === totalPages ? '#FAFAFA' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === totalPages ? '#C8D0DC' : NAVY }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

const Reservations = () => {
  const [reservations, setReservations]           = useState([]);
  const [clients, setClients]                     = useState([]);
  const [vehicles, setVehicles]                   = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [showModal, setShowModal]                 = useState(false);
  const [showCalendar, setShowCalendar]           = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRemplacementModal, setShowRemplacementModal] = useState(false);
  const [remplacementReservation, setRemplacementReservation] = useState(null);
  const [vehiculesRemplacement, setVehiculesRemplacement]     = useState([]);
  const [editingRes, setEditingRes]               = useState(null);
  const [fromCalendar, setFromCalendar]           = useState(false);
  const [form, setForm]                           = useState(EMPTY_FORM);
  const [loading, setLoading]                     = useState(false);
  const [calendarDates, setCalendarDates]         = useState([new Date(), new Date()]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // ── Vehicles grid state
  const [vehiclePage,   setVehiclePage]   = useState(1);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleSort,   setVehicleSort]   = useState('prix_asc');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [r, c, v] = await Promise.all([
        api.get('/reservations/'),
        api.get('/clients/'),
        api.get('/vehicles/'),
      ]);
      setReservations(r.data);
      setClients(c.data);
      setVehicles(v.data);
    } catch (err) { console.error(err); }
  };

  // ── Notifications
  const getUpcomingReservations = () => {
    const today = new Date(); today.setHours(0,0,0,0);
    return reservations
      .filter(r => r.statut !== 'annulée' && r.statut !== 'terminée')
      .map(r => {
        const debut = new Date(r.date_debut); debut.setHours(0,0,0,0);
        return { ...r, daysLeft: Math.round((debut - today) / 86400000) };
      })
      .filter(r => r.daysLeft >= 0 && r.daysLeft <= 5)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };
  const upcomingReservations = getUpcomingReservations();
  const notifColor = (d) => d === 0 ? RED : d <= 2 ? '#D97706' : NAVY;
  const notifLabel = (d) => d === 0 ? "Aujourd'hui" : d === 1 ? 'Demain' : `Dans ${d} jours`;

  // ── Calendar
  const bookedDates = (() => {
    const dates = [];
    reservations.forEach(r => {
      if (r.statut === 'annulée') return;
      let cur = new Date(r.date_debut);
      const end = new Date(r.date_fin);
      while (cur <= end) { dates.push(cur.toDateString()); cur.setDate(cur.getDate() + 1); }
    });
    return dates;
  })();
  const tileClassName = ({ date }) => bookedDates.includes(date.toDateString()) ? 'booked-day' : null;

  const checkAvailability = async () => {
    if (!calendarDates[0] || !calendarDates[1]) return;
    setCheckingAvailability(true);
    setVehiclePage(1);
    setVehicleSearch('');
    try {
      const d1 = calendarDates[0].toISOString().split('T')[0];
      const d2 = calendarDates[1].toISOString().split('T')[0];
      const res = await api.get(`/vehicles/available/?date_debut=${d1}&date_fin=${d2}`);
      setAvailableVehicles(res.data);
      setShowCalendar(true);
    } catch (err) { console.error(err); }
    finally { setCheckingAvailability(false); }
  };

  // ── Filter + sort + paginate available vehicles
  const filteredVehicles = availableVehicles
    .filter(v => {
      const q = vehicleSearch.toLowerCase();
      return !q || `${v.marque} ${v.modele} ${v.immatriculation}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const d1 = calendarDates[0]?.toISOString().split('T')[0];
      const pA = getPrixSaison(a, d1);
      const pB = getPrixSaison(b, d1);
      if (vehicleSort === 'prix_asc')  return pA - pB;
      if (vehicleSort === 'prix_desc') return pB - pA;
      if (vehicleSort === 'marque')    return `${a.marque} ${a.modele}`.localeCompare(`${b.marque} ${b.modele}`);
      return 0;
    });

  const totalVehiclePages = Math.ceil(filteredVehicles.length / VEHICLES_PER_PAGE);
  const paginatedVehicles = filteredVehicles.slice(
    (vehiclePage - 1) * VEHICLES_PER_PAGE,
    vehiclePage * VEHICLES_PER_PAGE
  );

  const openReserveFromCalendar = (vehicle) => {
    const d1   = calendarDates[0].toISOString().split('T')[0];
    const d2   = calendarDates[1].toISOString().split('T')[0];
    const days = calcDays(d1, d2);
    const prix = getPrixSaison(vehicle, d1);
    const total = (days * prix).toFixed(2);
    const rule  = getAcompteRule(days);
    const acompteMin = (parseFloat(total) * rule.pct / 100).toFixed(2);
    setEditingRes(null);
    setFromCalendar(true);
    setForm({ ...EMPTY_FORM, vehicle: String(vehicle.id), date_debut: d1, date_fin: d2, montant_total: total, acompte: acompteMin });
    setShowModal(true);
  };

  const calcTotal = (debut, fin, vehicleId) => {
    if (!debut || !fin || !vehicleId) return;
    const v = vehicles.find(v => v.id === parseInt(vehicleId));
    if (!v) return;
    const days  = calcDays(debut, fin);
    const prix  = getPrixSaison(v, debut);
    const total = (days * prix).toFixed(2);
    const rule  = getAcompteRule(days);
    const acompteMin = (parseFloat(total) * rule.pct / 100).toFixed(2);
    setForm(f => ({ ...f, montant_total: total, acompte: acompteMin }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.caution || parseFloat(form.caution) <= 0) {
      alert('La caution est obligatoire. Veuillez saisir un montant.');
      return;
    }
    const days    = calcDays(form.date_debut, form.date_fin);
    const rule    = getAcompteRule(days);
    const minAcpt = parseFloat(form.montant_total) * rule.pct / 100;
    if (!form.acompte || parseFloat(form.acompte) < minAcpt) {
      alert(`L'acompte minimum est ${minAcpt.toFixed(2)} DT (${rule.pct}% pour ${rule.label})`);
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.vehicule_remplace)   delete payload.vehicule_remplace;
      if (!payload.raison_remplacement) delete payload.raison_remplacement;
      if (editingRes) await api.put(`/reservations/${editingRes.id}/`, payload);
      else            await api.post('/reservations/', payload);
      fetchAll();
      setShowModal(false);
      setShowCalendar(false);
    } catch (err) {
      alert('Erreur: ' + JSON.stringify(err.response?.data));
    } finally { setLoading(false); }
  };

  const openRemplacement = async (res) => {
    setRemplacementReservation(res);
    try {
      const resp = await api.get(`/vehicles/available/?date_debut=${res.date_debut}&date_fin=${res.date_fin}`);
      const prixRef = parseFloat(vehicles.find(v => v.id === res.vehicle)?.prix_journalier || 0);
      const similaires = resp.data.filter(v =>
        v.id !== res.vehicle &&
        parseFloat(v.prix_journalier) >= prixRef * 0.7 &&
        parseFloat(v.prix_journalier) <= prixRef * 1.3
      );
      setVehiculesRemplacement(similaires);
    } catch { setVehiculesRemplacement([]); }
    setShowRemplacementModal(true);
  };

  const confirmerRemplacement = async (vehicleId, raison) => {
    try {
      await api.patch(`/reservations/${remplacementReservation.id}/`, {
        vehicle: vehicleId,
        vehicule_remplace: remplacementReservation.vehicle,
        raison_remplacement: raison,
        statut: 'confirmée',
      });
      fetchAll();
      setShowRemplacementModal(false);
    } catch (e) {
      alert('Erreur: ' + JSON.stringify(e.response?.data));
    }
  };

  // ── Form computed values
  const selectedVehicle = vehicles.find(v => v.id === parseInt(form.vehicle));
  const formDays        = calcDays(form.date_debut, form.date_fin);
  const activeRule      = getAcompteRule(formDays || 1);
  const acompteMin      = form.montant_total ? (parseFloat(form.montant_total) * activeRule.pct / 100).toFixed(2) : '0.00';
  const acompteVal      = parseFloat(form.acompte) || 0;
  const acompteInvalid  = form.acompte !== '' && acompteVal < parseFloat(acompteMin);
  const acompteValid    = acompteVal >= parseFloat(acompteMin) && form.acompte !== '';
  const saisonInfo      = getSaisonInfo(form.date_debut);

  return (
    <div>
      {/* ── Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarDays size={22} color={NAVY} /> Gestion des Réservations
        </h1>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifications(!showNotifications)}
            style={{ background: 'white', border: '1.5px solid #DDE3ED', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <Bell size={19} color={NAVY} />
            {upcomingReservations.length > 0 && (
              <span style={{ position: 'absolute', top: '-3px', right: '-3px', background: RED, color: 'white', borderRadius: '50%', width: '17px', height: '17px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                {upcomingReservations.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{ position: 'absolute', right: 0, top: '50px', background: 'white', borderRadius: '12px', width: '340px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', zIndex: 1000, border: '1px solid #DDE3ED', overflow: 'hidden' }}>
              <div style={{ background: NAVY, color: 'white', padding: '13px 16px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={15} /> Rappels ({upcomingReservations.length})
              </div>
              {upcomingReservations.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Aucune location dans les 5 prochains jours</div>
              ) : upcomingReservations.map(r => {
                const client  = clients.find(c => c.id === r.client);
                const vehicle = vehicles.find(v => v.id === r.vehicle);
                const color   = notifColor(r.daysLeft);
                return (
                  <div key={r.id} style={{ padding: '11px 16px', borderBottom: '1px solid #F0F2F5', borderLeft: `4px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{client ? `${client.prenom} ${client.nom}` : '—'}</span>
                      <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800' }}>{notifLabel(r.daysLeft)}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Car size={12} /> {vehicle ? `${vehicle.marque} ${vehicle.modele}` : '—'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CalendarDays size={11} /> {r.date_debut} → {r.date_fin}
                    </div>
                    {r.a_accident && (
                      <button onClick={() => { setShowNotifications(false); openRemplacement(r); }}
                        style={{ marginTop: '7px', padding: '4px 10px', background: RED, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <RefreshCw size={12} /> Remplacer le véhicule
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total',      value: reservations.length,                                        color: NAVY,   bg: '#EFF4FB' },
          { label: 'En attente', value: reservations.filter(r => r.statut === 'en_attente').length, color: '#D97706', bg: '#FEF9C3' },
          { label: 'Confirmées', value: reservations.filter(r => r.statut === 'confirmée').length,  color: GREEN,  bg: '#DCFCE7' },
          { label: 'Terminées',  value: reservations.filter(r => r.statut === 'terminée').length,   color: PURPLE, bg: '#F3EEFF' },
          { label: 'Annulées',   value: reservations.filter(r => r.statut === 'annulée').length,    color: RED,    bg: '#FEE2E2' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ color: '#64748B', fontSize: '11.5px', marginTop: '3px', fontWeight: '600' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Calendar + Availability section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: NAVY, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', margin: 0 }}>
            <CalendarDays size={18} color={AMBER} /> Vérifier la disponibilité des véhicules
          </h2>
          {showCalendar && (
            <div style={{ fontSize: '12.5px', color: '#64748B' }}>
              <strong style={{ color: NAVY }}>{filteredVehicles.length}</strong> véhicule(s) disponible(s)
            </div>
          )}
        </div>

        {/* Two columns: calendar left, results right */}
        <div style={{ display: 'grid', gridTemplateColumns: showCalendar ? '300px 1fr' : '300px', gap: '28px', alignItems: 'flex-start' }}>

          {/* ── Left: calendar */}
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#FCA5A5', borderRadius: '50%' }}></span>
              Jours réservés
            </div>
            <Calendar
              selectRange={true}
              onChange={setCalendarDates}
              value={calendarDates}
              tileClassName={tileClassName}
              locale="fr-FR"
            />

            {/* Selected period summary */}
            {calendarDates[0] && calendarDates[1] && (
              <div style={{ marginTop: '12px', background: '#EFF4FB', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ color: '#64748B' }}>{calendarDates[0].toLocaleDateString('fr-FR')}</div>
                  <ArrowRight size={13} color="#94A3B8" />
                  <div style={{ color: '#64748B' }}>{calendarDates[1].toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ textAlign: 'center', fontWeight: '800', color: NAVY, marginTop: '4px' }}>
                  {calcDays(calendarDates[0].toISOString().split('T')[0], calendarDates[1].toISOString().split('T')[0])} jour(s)
                </div>
                {/* Season badge */}
                {(() => {
                  const s = getSaisonInfo(calendarDates[0].toISOString().split('T')[0]);
                  return s ? (
                    <div style={{ marginTop: '8px', background: s.bg, color: s.color, padding: '5px 10px', borderRadius: '7px', fontWeight: '700', fontSize: '11.5px', textAlign: 'center' }}>
                      {s.label} ({s.pct})
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <button className="btn btn-primary" onClick={checkAvailability} disabled={checkingAvailability}
              style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
              {checkingAvailability ? 'Vérification...' : 'Voir véhicules disponibles'}
            </button>
          </div>

          {/* ── Right: available vehicles with search + sort + pagination */}
          {showCalendar && (
            <div>
              {/* Subheader */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: GREEN, fontWeight: '700', fontSize: '13.5px' }}>
                  <CheckCircle size={15} /> Disponibles
                </div>

                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                  <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input value={vehicleSearch} onChange={e => { setVehicleSearch(e.target.value); setVehiclePage(1); }}
                    placeholder="Marque, modèle..."
                    style={{ paddingLeft: '28px', fontSize: '12.5px', padding: '7px 10px 7px 28px' }} />
                </div>

                {/* Sort */}
                <div style={{ position: 'relative' }}>
                  <SlidersHorizontal size={12} color="#94A3B8" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <select value={vehicleSort} onChange={e => { setVehicleSort(e.target.value); setVehiclePage(1); }}
                    style={{ paddingLeft: '28px', fontSize: '12.5px', padding: '7px 10px 7px 28px', minWidth: '130px' }}>
                    <option value="prix_asc">Prix croissant</option>
                    <option value="prix_desc">Prix décroissant</option>
                    <option value="marque">Marque A→Z</option>
                  </select>
                </div>
              </div>

              {filteredVehicles.length === 0 ? (
                <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '10px', padding: '20px', textAlign: 'center', color: RED, fontWeight: '600', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={22} />
                  {vehicleSearch ? 'Aucun véhicule correspond à votre recherche.' : 'Aucun véhicule disponible pour cette période.'}
                </div>
              ) : (
                <>
                  {/* Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>
                    {paginatedVehicles.map(v => {
                      const d1   = calendarDates[0].toISOString().split('T')[0];
                      const days = calcDays(d1, calendarDates[1].toISOString().split('T')[0]);
                      const prix = getPrixSaison(v, d1);
                      const total = (days * prix).toFixed(2);
                      const mois  = calendarDates[0].getMonth() + 1;
                      const rule  = getAcompteRule(days);

                      return (
                        <div key={v.id} style={{ background: 'white', border: `1.5px solid #DDE3ED`, borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.15s, border-color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(27,58,107,0.12)'; e.currentTarget.style.borderColor = NAVY; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#DDE3ED'; }}>

                          {/* Photo */}
                          <div style={{ height: '90px', overflow: 'hidden', position: 'relative' }}>
                            <img src={getCarPhoto(v)} alt={v.marque}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                            {/* Season badge overlay */}
                            {[7,8].includes(mois) && (
                              <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '10px', background: '#FEE2E2', color: RED, padding: '2px 6px', borderRadius: '5px', fontWeight: '700' }}>+50%</span>
                            )}
                            {[6,9].includes(mois) && (
                              <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '10px', background: '#FEF3DC', color: '#92580A', padding: '2px 6px', borderRadius: '5px', fontWeight: '700' }}>+25%</span>
                            )}
                          </div>

                          {/* Body */}
                          <div style={{ padding: '10px 12px' }}>
                            <div style={{ color: NAVY, fontWeight: '700', fontSize: '11px', marginBottom: '2px' }}>{v.immatriculation}</div>
                            <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#1A2535', marginBottom: '6px' }}>{v.marque} {v.modele}</div>

                            {/* Specs row */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Users size={11} /> {v.nombre_places} pl.
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Gauge size={11} /> {(v.kilometrage||0).toLocaleString()} km
                              </span>
                            </div>

                            {/* Price */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ color: GREEN, fontWeight: '800', fontSize: '14px' }}>{prix.toFixed(0)} DT/j</span>
                              <span style={{ color: PURPLE, fontSize: '11.5px', fontWeight: '600' }}>{total} DT</span>
                            </div>

                            {/* Acompte min */}
                            <div style={{ fontSize: '10.5px', color: '#94A3B8', marginBottom: '10px' }}>
                              Acompte min. {rule.pct}% — {(parseFloat(total) * rule.pct / 100).toFixed(2)} DT
                            </div>

                            <button onClick={() => openReserveFromCalendar(v)}
                              style={{ width: '100%', padding: '8px', background: NAVY, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                              <PlusCircle size={14} /> Réserver
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  <MiniPagination
                    currentPage={vehiclePage}
                    totalPages={totalVehiclePages}
                    onPageChange={setVehiclePage}
                    totalItems={filteredVehicles.length}
                    perPage={VEHICLES_PER_PAGE}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Remplacement */}
      {showRemplacementModal && remplacementReservation && (
        <div className="modal-overlay" onClick={() => setShowRemplacementModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <h2 style={{ color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} /> Remplacement de véhicule
            </h2>
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ fontWeight: '700', color: RED, marginBottom: '6px' }}>Réservation #{remplacementReservation.id}</div>
              <div>Client: <strong>{clients.find(c => c.id === remplacementReservation.client)?.prenom} {clients.find(c => c.id === remplacementReservation.client)?.nom}</strong></div>
              <div>Véhicule: <strong>{vehicles.find(v => v.id === remplacementReservation.vehicle)?.marque} {vehicles.find(v => v.id === remplacementReservation.vehicle)?.modele}</strong></div>
              <div>Période: {remplacementReservation.date_debut} → {remplacementReservation.date_fin}</div>
            </div>
            <div className="form-group">
              <label>Raison du remplacement</label>
              <select id="raison_remplacement" defaultValue="Accident — véhicule indisponible">
                <option>Accident — véhicule indisponible</option>
                <option>Panne mécanique</option>
                <option>Maintenance urgente</option>
                <option>Autre</option>
              </select>
            </div>
            <label style={{ fontWeight: '700', fontSize: '13px', color: '#1A2535', display: 'block', marginBottom: '10px' }}>Choisir un véhicule de remplacement</label>
            {vehiculesRemplacement.length === 0 ? (
              <div style={{ color: RED, fontWeight: '600', padding: '14px', background: '#FEE2E2', borderRadius: '8px', textAlign: 'center', fontSize: '13px' }}>
                Aucun véhicule similaire disponible pour cette période
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {vehiculesRemplacement.map(v => (
                  <div key={v.id} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #DDE3ED', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={getCarPhoto(v)} alt={v.marque}
                        style={{ width: '50px', height: '36px', objectFit: 'cover', borderRadius: '5px' }}
                        onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{v.marque} {v.modele}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>{v.immatriculation}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '800', color: GREEN, fontSize: '13px' }}>{v.prix_journalier} DT/j</span>
                      <button onClick={() => confirmerRemplacement(v.id, document.getElementById('raison_remplacement').value)}
                        style={{ padding: '6px 12px', background: NAVY, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} /> Choisir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowRemplacementModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Réservation */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              {editingRes
                ? <><ChevronRight size={18} /> Modifier la Réservation</>
                : <><PlusCircle size={18} /> Nouvelle Réservation</>}
            </h2>

            {fromCalendar && form.vehicle && form.date_debut && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: NAVY, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} /> Dates pré-remplies depuis le calendrier</span>
                {form.montant_total && <strong style={{ color: GREEN, fontSize: '15px' }}>{form.montant_total} DT</strong>}
              </div>
            )}

            {saisonInfo && (
              <div style={{ background: saisonInfo.bg, color: saisonInfo.color, padding: '7px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', marginBottom: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {saisonInfo.label} <span style={{ opacity: 0.7 }}>({saisonInfo.pct})</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                <div className="form-group">
                  <label>Client <span style={{ color: RED }}>*</span></label>
                  <select value={form.client} onChange={e => setForm({...form, client: e.target.value})} required>
                    <option value="">Sélectionner un client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Véhicule <span style={{ color: RED }}>*</span></label>
                  {fromCalendar && selectedVehicle ? (
                    <div style={{ background: '#DCFCE7', border: `1.5px solid ${GREEN}`, borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13.5px' }}>{selectedVehicle.marque} {selectedVehicle.modele}</div>
                        <div style={{ fontSize: '11.5px', color: NAVY, marginTop: '1px' }}>{selectedVehicle.immatriculation}</div>
                      </div>
                      <div style={{ fontWeight: '800', color: GREEN, fontSize: '13px' }}>
                        {getPrixSaison(selectedVehicle, form.date_debut).toFixed(2)} DT/j
                      </div>
                      <input type="hidden" value={form.vehicle} />
                    </div>
                  ) : (
                    <select value={form.vehicle}
                      onChange={e => { const nv = e.target.value; setForm(f => ({...f, vehicle: nv})); calcTotal(form.date_debut, form.date_fin, nv); }} required>
                      <option value="">Sélectionner un véhicule</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.marque} {v.modele} — {v.immatriculation} ({v.prix_journalier} DT/j)</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Date début <span style={{ color: RED }}>*</span></label>
                  <input type="date" value={form.date_debut}
                    onChange={e => { const d = e.target.value; setForm(f => ({...f, date_debut: d})); calcTotal(d, form.date_fin, form.vehicle); }} required />
                </div>

                <div className="form-group">
                  <label>Date fin <span style={{ color: RED }}>*</span></label>
                  <input type="date" value={form.date_fin}
                    onChange={e => { const d = e.target.value; setForm(f => ({...f, date_fin: d})); calcTotal(form.date_debut, d, form.vehicle); }} required />
                </div>

                {form.montant_total && (
                  <div style={{ gridColumn: '1 / -1', background: NAVY, color: 'white', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', opacity: 0.8 }}>Montant total: </span>
                    <strong style={{ fontSize: '22px' }}>{form.montant_total} DT</strong>
                    <span style={{ fontSize: '13px', opacity: 0.75, marginLeft: '10px' }}>({formDays} jour{formDays > 1 ? 's' : ''})</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Montant total (DT)</label>
                  <input type="number" value={form.montant_total}
                    onChange={e => setForm({...form, montant_total: e.target.value})}
                    placeholder="Calculé automatiquement"
                    style={{ background: '#F0FFF4', color: GREEN, fontWeight: '700' }} />
                </div>

                <div className="form-group">
                  <label>
                    Acompte (DT) <span style={{ color: RED }}>*</span>
                    {form.montant_total && (
                      <span style={{ color: '#64748B', fontSize: '10.5px', marginLeft: '6px', fontWeight: '500', textTransform: 'none' }}>
                        min. {acompteMin} DT ({activeRule.pct}% / {activeRule.label})
                      </span>
                    )}
                  </label>
                  <input type="number" value={form.acompte}
                    onChange={e => setForm({...form, acompte: e.target.value})}
                    placeholder={`Minimum ${acompteMin} DT`}
                    min={acompteMin}
                    style={{
                      border: acompteInvalid ? `2px solid ${RED}` : acompteValid ? `2px solid ${GREEN}` : '1.5px solid #DDE3ED',
                      background: acompteInvalid ? '#FEE2E2' : acompteValid ? '#DCFCE7' : 'white',
                    }} required />
                  {acompteInvalid && (
                    <div style={{ color: RED, fontSize: '11.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> Minimum {acompteMin} DT ({activeRule.pct}%) requis
                    </div>
                  )}
                  {acompteValid && form.montant_total && (
                    <div style={{ color: GREEN, fontSize: '11.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> Restant: {(parseFloat(form.montant_total) - acompteVal).toFixed(2)} DT
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Caution (DT) <span style={{ color: RED }}>*</span>
                    <span style={{ background: '#FEF3DC', color: '#92580A', fontSize: '10px', padding: '1px 7px', borderRadius: '10px', fontWeight: '700' }}>Obligatoire</span>
                  </label>
                  <input type="number" value={form.caution}
                    onChange={e => setForm({...form, caution: e.target.value})}
                    placeholder="Ex: 500.00" min="0"
                    style={{
                      border: (!form.caution || parseFloat(form.caution) <= 0) ? `2px solid ${AMBER}` : `2px solid ${GREEN}`,
                      background: (!form.caution || parseFloat(form.caution) <= 0) ? '#FEF3DC' : '#DCFCE7',
                    }} required />
                  {(!form.caution || parseFloat(form.caution) <= 0) && (
                    <div style={{ color: '#92580A', fontSize: '11.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> La caution est obligatoire
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Statut</label>
                  <select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
                    <option value="en_attente">En attente</option>
                    <option value="confirmée">Confirmée</option>
                    <option value="terminée">Terminée</option>
                    <option value="annulée">Annulée</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    rows={3} placeholder="Notes supplémentaires..." style={{ resize: 'vertical' }} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary"
                  disabled={loading || acompteInvalid || !form.acompte || !form.caution || parseFloat(form.caution) <= 0}>
                  {loading ? 'Enregistrement...' : (editingRes ? 'Modifier' : 'Réserver')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNotifications && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default Reservations;





