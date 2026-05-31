import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import {
  LayoutDashboard, Car, Tag, Users, CalendarCheck,
  Banknote, AlertTriangle, ChevronDown,
  TrendingUp, RotateCcw, CreditCard, UserCheck, X, Star,
} from 'lucide-react';
import api from '../api/axios';

const NAVY   = '#1B3A6B';
const AMBER  = '#E8A020';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';

// ── Helper: calculate age in years from annee field
// ── Helper: durée en flotte depuis date_acquisition UNIQUEMENT (Option B)
// Si date_acquisition est NULL → 0 (pas de fallback sur annee)
const getAge = (date_acquisition) => {
  if (!date_acquisition) return 0;
  const acq = new Date(date_acquisition);
  const now = new Date();
  return (now - acq) / (1000 * 60 * 60 * 24 * 365.25);
};

// ── Helper: month/year when a vehicle REACHES 3.5 years
// We assume purchase = Jan 1 of annee → reaches 3.5y = Jul of annee+3
const getVendreDate = (date_acquisition, annee) => {
  // Option B: 3.5 ans depuis date_acquisition
  if (date_acquisition) {
    const acq = new Date(date_acquisition);
    const vendreDate = new Date(acq.getTime() + 3.5 * 365.25 * 24 * 3600 * 1000);
    return {
      year: vendreDate.getFullYear(),
      month: vendreDate.getMonth(),
      label: `${['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][vendreDate.getMonth()]} ${vendreDate.getFullYear()}`
    };
  }
  // fallback annee
  if (!annee) return null;
  const yr = parseInt(annee) + 3;
  return { year: yr, month: 6, label: `Jul ${yr}` };
};

const Dashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [clients,      setClients]      = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [contracts,    setContracts]    = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedChart, setSelectedChart] = useState('depenses');
  const [dropdownOpen,  setDropdownOpen]  = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [r, c, v, ct, p] = await Promise.all([
        api.get('/reservations/'),
        api.get('/clients/'),
        api.get('/vehicles/'),
        api.get('/contracts/'),
        api.get('/payments/'),
      ]);
      setReservations(r.data);
      setClients(c.data);
      setVehicles(v.data);
      setContracts(ct.data);
      setPayments(p.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const currentYear = new Date().getFullYear();
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  // ── Véhicules à vendre: seuil 3.5 ans basé sur v.annee
  const vehiclesAVendre = vehicles
    .filter(v => getAge(v.date_acquisition) >= 3.5)
    .sort((a, b) => getAge(b.date_acquisition) - getAge(a.date_acquisition));

  // ── Graphique: nombre de véhicules atteignant 3.5 ans par mois (2023-2026)
  const vendreParMoisData = (() => {
    const map = {};
    vehicles.forEach(v => {
      const d = getVendreDate(v.date_acquisition, v.annee);
      if (!d) return;
      const key = `${d.year}-${String(d.month + 1).padStart(2,'0')}`;
      const label = `${months[d.month]} ${d.year}`;
      if (!map[key]) map[key] = { key, label, nb: 0, vehicules: [] };
      map[key].nb++;
      map[key].vehicules.push(`${v.marque} ${v.modele}`);
    });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  })();

  // ── Monthly activity
  const monthlyData = months.map((m, i) => {
    const monthRes = reservations.filter(r => {
      const d = new Date(r.date_debut);
      return d.getFullYear() === currentYear && d.getMonth() === i;
    });
    return {
      mois: m,
      reservations: monthRes.length,
      accidents: monthRes.filter(r => r.a_accident).length,
      contrats: contracts.filter(ct => {
        const d = new Date(ct.date_contrat);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      }).length,
    };
  });

  // ── Dépenses clients: real payments
  const clientsDepenses = clients.map(c => {
    const clientResIds = reservations.filter(r => r.client === c.id).map(r => r.id);
    const totalPaiements = payments
      .filter(p => clientResIds.includes(p.reservation))
      .reduce((s, p) => s + parseFloat(p.montant || 0), 0);
    const totalFallback = reservations
      .filter(r => r.client === c.id)
      .reduce((s, r) => s + parseFloat(r.montant_total || 0), 0);
    return {
      name:    `${c.prenom} ${c.nom}`.substring(0, 14),
      depense: parseFloat((totalPaiements > 0 ? totalPaiements : totalFallback).toFixed(2)),
      nbRes:   reservations.filter(r => r.client === c.id).length,
    };
  }).filter(c => c.depense > 0 || c.nbRes > 0)
    .sort((a, b) => b.depense - a.depense)
    .slice(0, 10);

  const clientsFidelite = clients.map(c => ({
    name:         `${c.prenom} ${c.nom}`.substring(0, 14),
    reservations: reservations.filter(r => r.client === c.id).length,
    depense:      parseFloat(reservations.filter(r => r.client === c.id).reduce((s, r) => s + parseFloat(r.montant_total || 0), 0).toFixed(2)),
    accidents:    reservations.filter(r => r.client === c.id && r.a_accident).length,
  })).filter(c => c.reservations > 0).sort((a, b) => b.reservations - a.reservations).slice(0, 8);

  // ── Points fidélité par mois
  const pointsFideliteData = months.map((m, i) => {
    const monthRes = reservations.filter(r => {
      const d = new Date(r.date_debut);
      return d.getFullYear() === currentYear && d.getMonth() === i;
    });
    const ptsGagnes = monthRes.filter(r => r.statut === 'confirmée' || r.statut === 'terminée').length * 100;
    const ptsEchanges = monthRes
      .filter(r => r.remise_fidelite && parseFloat(r.remise_fidelite) > 0)
      .reduce((s, r) => {
        const remise = parseFloat(r.remise_fidelite);
        if (remise >= 50) return s + 1000;
        if (remise >= 25) return s + 500;
        if (remise >= 10) return s + 200;
        return s;
      }, 0);
    return { mois: m, ptsGagnes, ptsEchanges };
  });

  const tauxOccupation = vehicles.map(v => ({
    name: `${v.marque} ${v.modele}`.substring(0, 12),
    reservations: reservations.filter(r => r.vehicle === v.id).length,
    accidents:    reservations.filter(r => r.vehicle === v.id && r.a_accident).length,
  }));

  const totalRevenus   = payments.filter(p => p.statut === 'payé').reduce((s, p) => s + parseFloat(p.montant), 0);
  const totalAccidents = reservations.filter(r => r.a_accident).length;

  // ── Custom tooltip for vendre chart
  const VendreTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const entry = vendreParMoisData.find(d => d.label === label);
    return (
      <div style={{ background: 'white', border: '1px solid #DDE3ED', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: '800', color: NAVY, marginBottom: '6px' }}>{label}</div>
        <div style={{ color: RED, fontWeight: '700', marginBottom: '4px' }}>🔴 {payload[0].value} véhicule(s) à vendre</div>
        {entry?.vehicules?.slice(0, 4).map((v, i) => (
          <div key={i} style={{ color: '#64748B', fontSize: '11px' }}>• {v}</div>
        ))}
        {entry?.vehicules?.length > 4 && <div style={{ color: '#94A3B8', fontSize: '11px' }}>+{entry.vehicules.length - 4} autres</div>}
      </div>
    );
  };

  const chartOptions = [
    { value: 'depenses',      label: 'Dépenses clients',             desc: 'Montants dépensés par client (DT)',               icon: <CreditCard    size={14} /> },
    { value: 'vendre_mois',   label: 'Véhicules à vendre par mois',  desc: 'Nb de véhicules atteignant 3.5 ans par mois',     icon: <Tag           size={14} /> },
    { value: 'activite',      label: 'Activité mensuelle',           desc: 'Réservations, contrats et accidents par mois',    icon: <TrendingUp    size={14} /> },
    { value: 'points_mois',   label: 'Points fidélité par mois',     desc: 'Points gagnés et échangés chaque mois',           icon: <Star          size={14} /> },
    { value: 'accidents',     label: 'Accidents par mois',           desc: "Nombre d'accidents déclarés par mois",            icon: <AlertTriangle size={14} /> },
    { value: 'occupation',    label: "Taux d'occupation véhicules",  desc: 'Réservations et accidents par véhicule',           icon: <Car           size={14} /> },
    { value: 'fidelite',      label: 'Fidélité clients',             desc: 'Nombre de réservations par client',               icon: <UserCheck     size={14} /> },
    { value: 'annulations',   label: 'Annulations clients',          desc: 'Réservations annulées par client',                icon: <X             size={14} /> },
    { value: 'remplacements', label: 'Remplacements véhicules',      desc: 'Véhicules remplacés suite à incident par mois',   icon: <RotateCcw     size={14} /> },
  ];

  const selected  = chartOptions.find(o => o.value === selectedChart);
  const gridProps = { strokeDasharray: '3 3', stroke: '#F0F2F5' };
  const axisTick  = { fontSize: 11, fill: '#64748B' };
  const tipStyle  = { borderRadius: '8px', border: '1px solid #DDE3ED', fontSize: '12px' };
  const legStyle  = { wrapperStyle: { fontSize: '12px' } };

  const renderChart = () => {
    switch (selectedChart) {

      case 'depenses':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={clientsDepenses} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisTick} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={axisTick} />
              <Tooltip formatter={v => `${v} DT`} contentStyle={tipStyle} />
              <Bar dataKey="depense" fill={AMBER} radius={[6,6,0,0]} name="Dépenses (DT)" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'vendre_mois':
        return (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={16} color={RED} />
                <span style={{ fontWeight: '800', color: RED, fontSize: '18px' }}>{vehiclesAVendre.length}</span>
                <span style={{ color: '#92580A', fontSize: '12px', fontWeight: '600' }}>véhicules dépassé 3.5 ans</span>
              </div>
              <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={16} color={GREEN} />
                <span style={{ fontWeight: '800', color: GREEN, fontSize: '18px' }}>{vehicles.length - vehiclesAVendre.length}</span>
                <span style={{ color: '#166534', fontSize: '12px', fontWeight: '600' }}>véhicules OK (&lt; 3.5 ans)</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vendreParMoisData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" tick={axisTick} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={axisTick} allowDecimals={false} label={{ value: 'Nb véhicules', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#64748B' } }} />
                <Tooltip content={<VendreTooltip />} />
                <Bar dataKey="nb" radius={[8,8,0,0]} name="Véhicules à vendre">
                  {vendreParMoisData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.key <= `${currentYear}-${String(new Date().getMonth()+1).padStart(2,'0')}` ? RED : AMBER}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '12px', height: '12px', background: RED, borderRadius: '3px', display: 'inline-block' }} /> Déjà dépassé (vendre maintenant)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '12px', height: '12px', background: AMBER, borderRadius: '3px', display: 'inline-block' }} /> À venir (préparer la vente)</span>
            </div>
          </div>
        );

      case 'activite':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="mois" tick={axisTick} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Legend {...legStyle} />
              <Line type="monotone" dataKey="reservations" stroke={NAVY}   strokeWidth={2.5} dot={{ r: 5 }} name="Réservations" />
              <Line type="monotone" dataKey="contrats"     stroke={PURPLE} strokeWidth={2.5} dot={{ r: 5 }} name="Contrats" />
              <Line type="monotone" dataKey="accidents"    stroke={RED}    strokeWidth={2.5} dot={{ r: 5 }} name="Accidents" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'points_mois':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={pointsFideliteData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="mois" tick={axisTick} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} formatter={v => `${v} pts`} />
              <Legend {...legStyle} />
              <Bar dataKey="ptsGagnes"   fill={GREEN}  radius={[6,6,0,0]} name="Points gagnés" />
              <Bar dataKey="ptsEchanges" fill={PURPLE} radius={[6,6,0,0]} name="Points échangés" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'accidents':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="mois" tick={axisTick} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="accidents" fill={RED} radius={[6,6,0,0]} name="Accidents" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'occupation':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={tauxOccupation} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisTick} angle={-20} textAnchor="end" />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Legend {...legStyle} />
              <Bar dataKey="reservations" fill={NAVY} radius={[6,6,0,0]} name="Réservations" />
              <Bar dataKey="accidents"    fill={RED}  radius={[6,6,0,0]} name="Accidents" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'fidelite':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={clientsFidelite} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisTick} angle={-20} textAnchor="end" />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Legend {...legStyle} />
              <Bar dataKey="reservations" fill={PURPLE} radius={[6,6,0,0]} name="Réservations" />
              <Bar dataKey="accidents"    fill={RED}    radius={[6,6,0,0]} name="Accidents" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'annulations': {
        const annulationsData = clients.map(c => ({
          name:        `${c.prenom} ${c.nom}`.substring(0, 14),
          annulations: reservations.filter(r => r.client === c.id && r.statut === 'annulée').length,
          total:       reservations.filter(r => r.client === c.id).length,
        })).filter(c => c.total > 0).sort((a, b) => b.annulations - a.annulations).slice(0, 8);
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={annulationsData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisTick} angle={-20} textAnchor="end" />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Legend {...legStyle} />
              <Bar dataKey="total"       fill={NAVY} radius={[6,6,0,0]} name="Total réservations" />
              <Bar dataKey="annulations" fill={RED}  radius={[6,6,0,0]} name="Annulations" />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'remplacements': {
        const remplacementsData = months.map((m, i) => ({
          mois: m,
          remplacements: reservations.filter(r => {
            const d = new Date(r.date_debut);
            return d.getFullYear() === currentYear && d.getMonth() === i &&
                   r.vehicule_remplace !== null && r.vehicule_remplace !== undefined;
          }).length,
        }));
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={remplacementsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="mois" tick={axisTick} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="remplacements" fill={PURPLE} radius={[6,6,0,0]} name="Remplacements" />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      default: return null;
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '14px', color: '#64748B' }}>
      <Car size={38} color="#DDE3ED" />
      Chargement du tableau de bord...
    </div>
  );

  return (
    <div>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <LayoutDashboard size={22} color={NAVY} /> Tableau de Bord
      </h1>

      {/* ── Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Véhicules',    value: vehicles.length,                 color: NAVY,   bg: '#EFF4FB', icon: <Car size={19} />,           highlight: false },
          { label: 'À vendre',     value: vehiclesAVendre.length,          color: vehiclesAVendre.length > 0 ? RED : GREEN, bg: vehiclesAVendre.length > 0 ? '#FEE2E2' : '#DCFCE7', icon: <Tag size={19} />, highlight: vehiclesAVendre.length > 0 },
          { label: 'Clients',      value: clients.length,                  color: GREEN,  bg: '#DCFCE7', icon: <Users size={19} />,         highlight: false },
          { label: 'Réservations', value: reservations.length,             color: AMBER,  bg: '#FEF3DC', icon: <CalendarCheck size={19} />, highlight: false },
          { label: 'Revenus',      value: `${totalRevenus.toFixed(0)} DT`, color: PURPLE, bg: '#F3EEFF', icon: <Banknote size={19} />,      highlight: false },
          { label: 'Accidents',    value: totalAccidents,                  color: totalAccidents > 0 ? RED : GREEN, bg: totalAccidents > 0 ? '#FEE2E2' : '#DCFCE7', icon: <AlertTriangle size={19} />, highlight: totalAccidents > 0 },
        ].map(s => (
          <div key={s.label} className="card" style={{
            textAlign: 'center', padding: '16px 8px', position: 'relative',
            border: s.highlight ? `1.5px solid ${RED}` : '1px solid #DDE3ED',
            background: s.highlight ? '#FFF5F5' : 'white',
          }}>
            {s.highlight && (
              <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: RED, color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>!</div>
            )}
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              {s.icon}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#64748B', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── À vendre alert — seuil 3.5 ans, 2 premiers + compteur */}
      {vehiclesAVendre.length > 0 && (
        <div style={{ background: '#FEF3DC', border: '1.5px solid #E8A020', borderRadius: '12px', padding: '14px 18px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Tag size={20} color={AMBER} />
            <span style={{ fontWeight: '800', color: '#92580A', fontSize: '14px' }}>
              🔴 {vehiclesAVendre.length} véhicule(s) ont dépassé 3.5 ans — À vendre
            </span>
            <button
              onClick={() => setSelectedChart('vendre_mois')}
              style={{ marginLeft: 'auto', padding: '5px 12px', background: RED, color: 'white', border: 'none', borderRadius: '7px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
              Voir graphique →
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {vehiclesAVendre.slice(0, 2).map(v => {
              const age = getAge(v.date_acquisition).toFixed(1);
              return (
                <div key={v.id} style={{ background: 'white', border: '1.5px solid #FCA5A5', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={18} color={RED} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#1A2535', fontSize: '13px' }}>{v.marque} {v.modele}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{v.immatriculation}</div>
                  </div>
                  <div style={{ textAlign: 'center', marginLeft: '4px' }}>
                    <div style={{ background: '#FEE2E2', color: RED, fontSize: '13px', fontWeight: '800', padding: '3px 10px', borderRadius: '6px' }}>{age} ans</div>
                    <div style={{ fontSize: '10px', color: RED, fontWeight: '700', marginTop: '2px' }}>🔴 VENDRE</div>
                  </div>
                </div>
              );
            })}
            {vehiclesAVendre.length > 2 && (
              <div style={{ background: '#FEF3DC', border: '1px solid #FCD34D', borderRadius: '8px', padding: '8px 14px', color: '#92580A', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} />
                +{vehiclesAVendre.length - 2} autres véhicules
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chart with dropdown */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '22px' }}>
        <div style={{ padding: '16px 22px', background: NAVY, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selected?.icon} {selected?.label}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: '12.5px', marginTop: '2px' }}>{selected?.desc}</div>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.28)', borderRadius: '9px', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>{selected?.icon} {selected?.label}</span>
              <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
            </button>
            {dropdownOpen && (
              <>
                <div onClick={() => setDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', right: 0, top: '46px', zIndex: 11, background: 'white', borderRadius: '12px', minWidth: '300px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden', border: '1px solid #DDE3ED' }}>
                  {chartOptions.map(opt => (
                    <div key={opt.value}
                      onClick={() => { setSelectedChart(opt.value); setDropdownOpen(false); }}
                      style={{ padding: '10px 16px', cursor: 'pointer', background: selectedChart === opt.value ? '#EFF4FB' : 'white', borderLeft: `3px solid ${selectedChart === opt.value ? NAVY : 'transparent'}`, transition: 'background 0.12s' }}
                      onMouseEnter={e => { if (selectedChart !== opt.value) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = selectedChart === opt.value ? '#EFF4FB' : 'white'; }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: selectedChart === opt.value ? NAVY : '#1A2535', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        {opt.icon} {opt.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ padding: '22px' }}>{renderChart()}</div>
      </div>

      {/* ── Top Véhicules + Top Clients */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ color: NAVY, marginBottom: '16px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car size={16} color={AMBER} /> Top Véhicules — Activité
          </h3>
          {vehicles.length === 0
            ? <p style={{ color: '#94A3B8', fontSize: '13px' }}>Aucun véhicule</p>
            : vehicles
                .map(v => ({
                  ...v,
                  nbRes:   reservations.filter(r => r.vehicle === v.id).length,
                  nbAcc:   reservations.filter(r => r.vehicle === v.id && r.a_accident).length,
                  aVendre: vehiclesAVendre.some(x => x.id === v.id),
                  age:     getAge(v.date_acquisition) > 0 ? getAge(v.date_acquisition).toFixed(1) : null,
                }))
                .sort((a, b) => b.nbRes - a.nbRes)
                .slice(0, 8)
                .map((v, i) => {
                  const maxRes = Math.max(...vehicles.map(x => reservations.filter(r => r.vehicle === x.id).length), 1);
                  return (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #F0F2F5' }}>
                      <span style={{ fontWeight: '800', color: '#94A3B8', width: '18px', fontSize: '12px', flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {v.marque} {v.modele}
                          {v.aVendre && <span style={{ fontSize: '10px', background: '#FEE2E2', color: RED, padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>🔴 VENDRE</span>}
                        </div>
                        <div style={{ background: '#F0F2F5', borderRadius: '4px', height: '5px', marginTop: '5px' }}>
                          <div style={{ width: `${(v.nbRes / maxRes) * 100}%`, height: '100%', background: v.aVendre ? RED : NAVY, borderRadius: '4px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                        {v.age && <span style={{ background: v.aVendre ? '#FEE2E2' : '#F8FAFC', color: v.aVendre ? RED : '#64748B', padding: '2px 6px', borderRadius: '5px', fontSize: '10px', fontWeight: '600' }}>{v.age}a</span>}
                        <span style={{ background: '#EFF4FB', color: NAVY, padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>{v.nbRes} rés.</span>
                        {v.nbAcc > 0 && (
                          <span style={{ background: '#FEE2E2', color: RED, padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={10} /> {v.nbAcc}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
          }
        </div>

        <div className="card">
          <h3 style={{ color: PURPLE, marginBottom: '16px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color={AMBER} /> Top Clients — Fidélité
          </h3>
          {clientsFidelite.length === 0
            ? <p style={{ color: '#94A3B8', fontSize: '13px' }}>Aucun client avec réservation</p>
            : clientsFidelite.map((c, i) => {
              const medalColors   = [AMBER, '#94A3B8', '#CD7F32'];
              const fideliteColor = c.reservations >= 5 ? PURPLE : c.reservations >= 3 ? NAVY : '#64748B';
              const fideliteLabel = c.reservations >= 5 ? 'VIP' : c.reservations >= 3 ? 'Fidèle' : 'Nouveau';
              const fideliteBg    = c.reservations >= 5 ? '#F3EEFF' : c.reservations >= 3 ? '#EFF4FB' : '#F8FAFC';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #F0F2F5' }}>
                  {i < 3
                    ? <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: medalColors[i] + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: medalColors[i] }}>{i + 1}</span>
                      </div>
                    : <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', width: '22px', textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                  }
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#EFF4FB', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', flexShrink: 0 }}>
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>{c.depense.toLocaleString('fr-TN')} DT dépensés</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ background: fideliteBg, color: fideliteColor, padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>{fideliteLabel}</span>
                    <span style={{ background: '#EFF4FB', color: NAVY, padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>{c.reservations} rés.</span>
                    {c.accidents > 0 && (
                      <span style={{ background: '#FEE2E2', color: RED, padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle size={10} /> {c.accidents}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;