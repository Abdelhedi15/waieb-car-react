import { useState, useEffect, useCallback } from 'react';
import {
  Bell, CheckCircle, XCircle, Clock, Car,
  User, CalendarDays, Banknote, Phone, Mail,
  MapPin, RefreshCw, ArrowRight, AlertTriangle,
  CreditCard, Smartphone,
} from 'lucide-react';
import api from '../api/axios';

const NAVY  = '#1B3A6B';
const AMBER = '#E8A020';
const GREEN = '#16A34A';
const RED   = '#DC2626';

// ✅ Photos par immatriculation
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

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=70';

// ✅ Priorité : photo Django → IMMAT_PHOTOS par immatriculation → défaut
const getPhoto = (v) => {
  if (!v) return DEFAULT_PHOTO;
  if (v.photo) return `https://web-production-e6e97.up.railway.app${v.photo}`;
  return IMMAT_PHOTOS[v.immatriculation] || DEFAULT_PHOTO;
};

const Confirmations = () => {
  const [reservations, setReservations] = useState([]);
  const [clients,      setClients]      = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [processing,   setProcessing]   = useState({});
  const [filter,       setFilter]       = useState('all');
  const [lastRefresh,  setLastRefresh]  = useState(new Date());

  const fetchAll = useCallback(async () => {
    try {
      const [r, c, v] = await Promise.all([
        api.get('/reservations/'),
        api.get('/clients/'),
        api.get('/vehicles/'),
      ]);
      setReservations(r.data);
      setClients(c.data);
      setVehicles(v.data);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 10000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const pending = reservations.filter(r => r.statut === 'en_attente');
  const rdvPending = pending.filter(r =>
    r.notes?.toLowerCase().includes('rdv') || r.notes?.toLowerCase().includes('espèces')
  );
  const directPending = pending.filter(r =>
    !r.notes?.toLowerCase().includes('rdv') && !r.notes?.toLowerCase().includes('espèces')
  );

  const displayed = filter === 'rdv' ? rdvPending
    : filter === 'reservation' ? directPending
    : pending;

  const handleAction = async (id, statut) => {
    setProcessing(p => ({ ...p, [id]: statut }));
    try {
      await api.patch(`/reservations/${id}/`, { statut });
      await fetchAll();
    } catch (e) { console.error(e); }
    finally { setProcessing(p => { const n = {...p}; delete n[id]; return n; }); }
  };

  const getClient  = id => clients.find(c => c.id === id);
  const getVehicle = id => vehicles.find(v => v.id === id);
  const days = (d1, d2) => Math.max(1, Math.round((new Date(d2) - new Date(d1)) / 86400000));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <RefreshCw size={32} color={NAVY} className="spin" style={{ marginBottom: 12 }} />
        <div style={{ color: '#64748B', fontWeight: '600' }}>Chargement...</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={22} color={NAVY} />
          Confirmations & Rendez-vous
          {pending.length > 0 && (
            <span style={{ background: RED, color: 'white', borderRadius: '20px', padding: '2px 12px', fontSize: '13px', fontWeight: '800' }}>
              {pending.length}
            </span>
          )}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            Mis à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
          </span>
          <button onClick={fetchAll}
            style={{ padding: '8px 16px', background: NAVY, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'En attente total',    value: pending.length,       color: AMBER,     bg: '#FEF3DC', icon: <Clock size={18} />,        action: () => setFilter('all') },
          { label: 'Réservations mobile', value: directPending.length, color: NAVY,      bg: '#EFF4FB', icon: <Smartphone size={18} />,    action: () => setFilter('reservation') },
          { label: 'RDV Espèces',         value: rdvPending.length,    color: '#7C3AED', bg: '#F3EEFF', icon: <CalendarDays size={18} />,  action: () => setFilter('rdv') },
        ].map(s => (
          <div key={s.label} onClick={s.action}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', cursor: 'pointer',
              border: `2px solid ${filter !== 'all' && s.label.toLowerCase().includes(filter) ? s.color : 'transparent'}`,
              transition: 'all 0.15s' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px', fontWeight: '600' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        {[
          { key: 'all',         label: `Tous (${pending.length})` },
          { key: 'reservation', label: `📱 Mobile (${directPending.length})` },
          { key: 'rdv',         label: `📅 RDV Espèces (${rdvPending.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{
              padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '13px',
              background: filter === t.key ? NAVY : 'white',
              color: filter === t.key ? 'white' : '#64748B',
              border: `1.5px solid ${filter === t.key ? NAVY : '#DDE3ED'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {displayed.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CheckCircle size={52} color="#86EFAC" style={{ margin: '0 auto 16px', display: 'block' }} />
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#1A2535', marginBottom: '8px' }}>
            Aucune demande en attente
          </div>
          <div style={{ color: '#64748B', fontSize: '13px' }}>
            Toutes les réservations ont été traitées. ✅
          </div>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayed.map(r => {
          const client  = getClient(r.client);
          const vehicle = getVehicle(r.vehicle);
          const d       = days(r.date_debut, r.date_fin);
          const isRdv   = r.notes?.toLowerCase().includes('rdv') || r.notes?.toLowerCase().includes('espèces');
          const proc    = processing[r.id];

          return (
            <div key={r.id} style={{
              background: 'white', borderRadius: '16px', overflow: 'hidden',
              border: `2px solid ${isRdv ? '#C4B5FD' : '#FCD34D'}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              {/* Card header */}
              <div style={{
                padding: '12px 20px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
                background: isRdv ? '#F5F3FF' : '#FFFBEB',
                borderBottom: `1px solid ${isRdv ? '#DDD6FE' : '#FEF08A'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ color: NAVY, fontSize: '15px' }}>Rés. #{r.id}</strong>
                  <span style={{
                    background: isRdv ? '#EDE9FE' : '#FEF9C3',
                    color: isRdv ? '#7C3AED' : '#92580A',
                    padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700',
                  }}>
                    {isRdv ? '📅 RDV Espèces' : '📱 Réservation Mobile'}
                  </span>
                  <span style={{ background: '#FEF9C3', color: '#92580A', padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> En attente
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
                  <CalendarDays size={13} />
                  {r.date_debut} <ArrowRight size={12} /> {r.date_fin}
                  <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#1A2535' }}>
                    {d}j
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>

                {/* Client */}
                <div style={{ padding: '16px 20px', borderRight: '1px solid #F0F2F5' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: NAVY, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={12} /> Client
                  </div>
                  {client ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF4FB', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                          {client.prenom?.charAt(0)}{client.nom?.charAt(0)}
                        </div>
                        <div style={{ fontWeight: '800', fontSize: '15px' }}>{client.prenom} {client.nom}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px', color: '#64748B' }}>
                        {client.cin && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CreditCard size={11} /> CIN: <strong style={{ color: '#1A2535' }}>{client.cin}</strong>
                          </span>
                        )}
                        {client.telephone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={11} /> {client.telephone}
                          </span>
                        )}
                        {client.email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Mail size={11} /> {client.email}
                          </span>
                        )}
                        {client.adresse && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={11} /> {client.adresse}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>Client #<strong>{r.client}</strong></span>
                  )}
                </div>

                {/* Vehicle */}
                <div style={{ padding: '16px 20px', borderRight: '1px solid #F0F2F5' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: GREEN, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Car size={12} /> Véhicule
                  </div>
                  {vehicle ? (
                    <>
                      <div style={{ borderRadius: '8px', overflow: 'hidden', height: '70px', marginBottom: '8px' }}>
                        <img
                          src={getPhoto(vehicle)}
                          alt={`${vehicle.marque} ${vehicle.modele}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.src = DEFAULT_PHOTO; }}
                        />
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: '#1A2535' }}>{vehicle.marque} {vehicle.modele}</div>
                      <div style={{ fontSize: '12px', color: NAVY, fontWeight: '600', marginTop: '2px' }}>{vehicle.immatriculation}</div>
                      <div style={{ fontSize: '13px', color: GREEN, fontWeight: '700', marginTop: '4px' }}>{vehicle.prix_journalier} DT/j</div>
                    </>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>Véhicule #<strong>{r.vehicle}</strong></span>
                  )}
                </div>

                {/* Financial + Actions */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: '800', color: AMBER, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Banknote size={12} /> Financier
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                      {[
                        { label: 'TOTAL',   value: `${r.montant_total} DT`, color: NAVY,  bg: '#EFF4FB' },
                        { label: 'ACOMPTE', value: `${r.acompte} DT`,       color: AMBER, bg: '#FEF3DC' },
                      ].map(s => (
                        <div key={s.label} style={{ background: s.bg, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: '700', marginBottom: '2px' }}>{s.label}</div>
                          <div style={{ fontWeight: '800', color: s.color, fontSize: '13px' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {r.notes && (
                      <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: '#64748B', marginBottom: '10px' }}>
                        📝 {r.notes}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => handleAction(r.id, 'confirmée')} disabled={!!proc}
                      style={{
                        padding: '10px', background: proc === 'confirmée' ? '#86EFAC' : GREEN,
                        color: 'white', border: 'none', borderRadius: '10px',
                        cursor: proc ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        opacity: proc ? 0.7 : 1, transition: 'all 0.15s',
                      }}>
                      <CheckCircle size={15} />
                      {proc === 'confirmée' ? 'Confirmation...' : '✅ Confirmer'}
                    </button>
                    <button onClick={() => handleAction(r.id, 'annulée')} disabled={!!proc}
                      style={{
                        padding: '10px', background: 'white', color: RED,
                        border: `2px solid ${RED}`, borderRadius: '10px',
                        cursor: proc ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        opacity: proc ? 0.7 : 1, transition: 'all 0.15s',
                      }}>
                      <XCircle size={15} />
                      {proc === 'annulée' ? 'Annulation...' : '❌ Refuser'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recently handled */}
      {reservations.filter(r => ['confirmée','annulée'].includes(r.statut)).length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#64748B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> Récemment traitées
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '12px' }}>
            {reservations
              .filter(r => ['confirmée','annulée'].includes(r.statut))
              .slice(0, 6)
              .map(r => {
                const client  = getClient(r.client);
                const vehicle = getVehicle(r.vehicle);
                const isOk    = r.statut === 'confirmée';
                return (
                  <div key={r.id} style={{
                    background: 'white', borderRadius: '12px', padding: '14px 16px',
                    border: `1.5px solid ${isOk ? '#86EFAC' : '#FECACA'}`,
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isOk ? '#DCFCE7' : '#FEE2E2', color: isOk ? GREEN : RED, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isOk ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#1A2535' }}>
                        {client ? `${client.prenom} ${client.nom}` : `Client #${r.client}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {vehicle ? `${vehicle.marque} ${vehicle.modele}` : '—'} · {r.date_debut}
                      </div>
                    </div>
                    <span style={{ background: isOk ? '#DCFCE7' : '#FEE2E2', color: isOk ? GREEN : RED, padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
                      {isOk ? 'Confirmée' : 'Annulée'}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Confirmations;