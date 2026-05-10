import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import {
  LayoutDashboard, Car, Tag, Users, CalendarCheck,
  Banknote, AlertTriangle, ChevronDown,
  TrendingUp, RotateCcw, CreditCard, UserCheck, X,
} from 'lucide-react';
import api from '../api/axios';

const NAVY   = '#1B3A6B';
const AMBER  = '#E8A020';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';

const Dashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [clients,      setClients]      = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [contracts,    setContracts]    = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedChart, setSelectedChart] = useState('activite');
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

  // ── All data logic kept exactly from original
  const monthlyData = months.map((m, i) => {
    const monthRes = reservations.filter(r => {
      const d = new Date(r.date_debut);
      return d.getFullYear() === currentYear && d.getMonth() === i;
    });
    const monthPay = payments.filter(p => {
      const d = new Date(p.date_paiement);
      return d.getFullYear() === currentYear && d.getMonth() === i && p.statut === 'payé';
    });
    return {
      mois: m,
      reservations: monthRes.length,
      revenus: parseFloat(monthPay.reduce((s, p) => s + parseFloat(p.montant), 0).toFixed(2)),
      accidents: monthRes.filter(r => r.a_accident).length,
      contrats: contracts.filter(ct => {
        const d = new Date(ct.date_contrat);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      }).length,
    };
  });

  const tauxOccupation = vehicles.map(v => ({
    name: `${v.marque} ${v.modele}`.substring(0, 12),
    reservations: reservations.filter(r => r.vehicle === v.id).length,
    accidents:    reservations.filter(r => r.vehicle === v.id && r.a_accident).length,
  }));

  const clientsFidelite = clients.map(c => ({
    name:         `${c.prenom} ${c.nom}`.substring(0, 14),
    reservations: reservations.filter(r => r.client === c.id).length,
    depense:      parseFloat(reservations.filter(r => r.client === c.id).reduce((s, r) => s + parseFloat(r.montant_total || 0), 0).toFixed(2)),
    accidents:    reservations.filter(r => r.client === c.id && r.a_accident).length,
  })).filter(c => c.reservations > 0).sort((a, b) => b.reservations - a.reservations).slice(0, 8);

  const totalRevenus   = payments.filter(p => p.statut === 'payé').reduce((s, p) => s + parseFloat(p.montant), 0);
  const totalAccidents = reservations.filter(r => r.a_accident).length;

  const vehiclesAVendre = vehicles.filter(v => {
    if (!v.created_at) return false;
    const diffMois = (new Date() - new Date(v.created_at)) / (1000 * 60 * 60 * 24 * 30);
    return diffMois >= 42;
  });

  // ── Chart options — Lucide icons replace emojis
  const chartOptions = [
    { value: 'activite',      label: 'Activité mensuelle',          desc: 'Réservations, contrats et accidents par mois',    icon: <TrendingUp    size={14} /> },
    { value: 'revenus',       label: 'Revenus mensuels',             desc: 'Montants encaissés par mois (DT)',                 icon: <Banknote      size={14} /> },
    { value: 'accidents',     label: 'Accidents par mois',           desc: "Nombre d'accidents déclarés par mois",            icon: <AlertTriangle size={14} /> },
    { value: 'occupation',    label: "Taux d'occupation véhicules",  desc: 'Réservations et accidents par véhicule',           icon: <Car           size={14} /> },
    { value: 'fidelite',      label: 'Fidélité clients',             desc: 'Nombre de réservations par client',                icon: <UserCheck     size={14} /> },
    { value: 'depenses',      label: 'Dépenses clients',             desc: 'Montants dépensés par client (DT)',                icon: <CreditCard    size={14} /> },
    { value: 'annulations',   label: 'Annulations clients',          desc: 'Réservations annulées par client',                 icon: <X             size={14} /> },
    { value: 'remplacements', label: 'Remplacements véhicules',      desc: 'Véhicules remplacés suite à incident par mois',    icon: <RotateCcw     size={14} /> },
  ];

  const selected = chartOptions.find(o => o.value === selectedChart);

  // ── Chart rendering — exact same logic, updated colors
  const gridProps = { strokeDasharray: '3 3', stroke: '#F0F2F5' };
  const axisTick  = { fontSize: 12, fill: '#64748B' };
  const tipStyle  = { borderRadius: '8px', border: '1px solid #DDE3ED', fontSize: '12px' };
  const legStyle  = { wrapperStyle: { fontSize: '12px' } };

  const renderChart = () => {
    switch (selectedChart) {
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

      case 'revenus':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="mois" tick={axisTick} />
              <YAxis tick={axisTick} />
              <Tooltip formatter={v => `${v} DT`} contentStyle={tipStyle} />
              <Bar dataKey="revenus" fill={GREEN} radius={[6,6,0,0]} name="Revenus (DT)" />
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

      case 'depenses':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={clientsFidelite} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisTick} angle={-20} textAnchor="end" />
              <YAxis tick={axisTick} />
              <Tooltip formatter={v => `${v} DT`} contentStyle={tipStyle} />
              <Bar dataKey="depense" fill={AMBER} radius={[6,6,0,0]} name="Dépenses (DT)" />
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
      {/* ── Title */}
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <LayoutDashboard size={22} color={NAVY} /> Tableau de Bord
      </h1>

      {/* ── Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Véhicules',    value: vehicles.length,                   color: NAVY,   bg: '#EFF4FB', icon: <Car size={19} />,            highlight: false },
          { label: 'À vendre',     value: vehiclesAVendre.length,            color: vehiclesAVendre.length > 0 ? RED : GREEN, bg: vehiclesAVendre.length > 0 ? '#FEE2E2' : '#DCFCE7', icon: <Tag size={19} />, highlight: vehiclesAVendre.length > 0 },
          { label: 'Clients',      value: clients.length,                    color: GREEN,  bg: '#DCFCE7', icon: <Users size={19} />,          highlight: false },
          { label: 'Réservations', value: reservations.length,               color: AMBER,  bg: '#FEF3DC', icon: <CalendarCheck size={19} />,  highlight: false },
          { label: 'Revenus',      value: `${totalRevenus.toFixed(0)} DT`,   color: PURPLE, bg: '#F3EEFF', icon: <Banknote size={19} />,       highlight: false },
          { label: 'Accidents',    value: totalAccidents,                    color: totalAccidents > 0 ? RED : GREEN, bg: totalAccidents > 0 ? '#FEE2E2' : '#DCFCE7', icon: <AlertTriangle size={19} />, highlight: totalAccidents > 0 },
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

      {/* ── À vendre alert */}
      {vehiclesAVendre.length > 0 && (
        <div style={{ background: '#FEF3DC', border: '1.5px solid #E8A020', borderRadius: '12px', padding: '14px 18px', marginBottom: '22px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Tag size={22} color={AMBER} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '800', color: '#92580A', fontSize: '14px', marginBottom: '8px' }}>
              {vehiclesAVendre.length} véhicule(s) recommandé(s) à la vente — Plus de 3 ans et demi en flotte
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {vehiclesAVendre.map(v => {
                const mois     = Math.round((new Date() - new Date(v.created_at)) / (1000 * 60 * 60 * 24 * 30));
                const ans      = Math.floor(mois / 12);
                const moisRest = mois % 12;
                return (
                  <div key={v.id} style={{ background: 'white', border: '1px solid #FCD34D', borderRadius: '8px', padding: '7px 12px' }}>
                    <div style={{ fontWeight: '700', color: '#92580A', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Car size={12} /> {v.marque} {v.modele}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      {v.immatriculation} — {ans} an{ans > 1 ? 's' : ''}{moisRest > 0 ? ` ${moisRest} mois` : ''} en flotte
                    </div>
                  </div>
                );
              })}
            </div>
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
              style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.28)', borderRadius: '9px', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '230px', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>{selected?.icon} {selected?.label}</span>
              <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
            </button>

            {dropdownOpen && (
              <>
                <div onClick={() => setDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', right: 0, top: '46px', zIndex: 11, background: 'white', borderRadius: '12px', minWidth: '290px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden', border: '1px solid #DDE3ED' }}>
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
                .map(v => ({ ...v, nbRes: reservations.filter(r => r.vehicle === v.id).length, nbAcc: reservations.filter(r => r.vehicle === v.id && r.a_accident).length, aVendre: vehiclesAVendre.some(x => x.id === v.id) }))
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
                          {v.aVendre && <span style={{ fontSize: '10px', background: '#FEF3DC', color: '#92580A', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>À VENDRE</span>}
                        </div>
                        <div style={{ background: '#F0F2F5', borderRadius: '4px', height: '5px', marginTop: '5px' }}>
                          <div style={{ width: `${(v.nbRes / maxRes) * 100}%`, height: '100%', background: v.aVendre ? AMBER : NAVY, borderRadius: '4px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
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