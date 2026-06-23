import { useState, useEffect, useCallback } from 'react';
import {
  List, RefreshCw, Search, SlidersHorizontal,
  User, Car, Banknote, CalendarDays, AlertTriangle,
  CheckCircle, Clock, XCircle, Flag, Phone, Mail,
  CreditCard, ChevronRight, Bell,
  CalendarCheck, ArrowRight, Send, ClipboardList,
} from 'lucide-react';
import api from '../api/axios';
import Pagination from '../components/Pagination';
import RetourCheckModal from './RetourCheckModal';

const NAVY   = '#1B3A6B';
const AMBER  = '#E8A020';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';

const ITEMS_PER_PAGE = 6;

const CAR_PHOTOS = {
  renault: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=300&q=70',
  peugeot: 'https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=300&q=70',
  volkswagen: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=300&q=70',
  toyota: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=300&q=70',
  hyundai: 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=300&q=70',
  dacia: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=300&q=70',
  kia: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=300&q=70',
  seat: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300&q=70',
  ford: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=300&q=70',
  skoda: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=300&q=70',
  default: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=70',
};
const IMMAT_PHOTOS = {'240TN5082':'https://i.ibb.co/FZmVWK6/vec1.jpg','259TN5651':'https://i.ibb.co/F4SbDBMM/vec2.jpg','243TN1422':'https://i.ibb.co/gbw2JtTH/vec3.jpg','236TN5648':'https://i.ibb.co/0RJ31jBB/vec4.jpg','234TN2126':'https://i.ibb.co/prkyKtjv/vec5.jpg','244TN7005':'https://i.ibb.co/P81vS80/vec6.jpg','251TN1694':'https://i.ibb.co/5WBKGTGL/vec7.jpg','252TN3310':'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80','253TN4421':'https://i.ibb.co/jvRzYcDB/vec9.png','254TN6632':'https://i.ibb.co/hxvysSY4/vec10.png','255TN7743':'https://i.ibb.co/dsfz2VnP/vec11.png','256TN8854':'https://i.ibb.co/35ccmkFY/vec12.jpg','257TN1301':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155233/vec13_jwhixy.jpg','258TN1402':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155237/vec14_emprhi.jpg','259TN1503':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec15_y7lazd.jpg','260TN1604':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec16_pkydhf.jpg','261TN1705':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec17_z2iw32.jpg','262TN1806':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec18_byuiqk.jpg','263TN1907':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec19_g9yvnw.jpg','264TN2008':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec20_kvsoqj.jpg','265TN2109':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec21_bjkcyt.jpg','266TN2210':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155236/vec22_gkpzax.jpg'};

const getCarPhoto = (v) => {
  if (IMMAT_PHOTOS[v?.immatriculation]) return IMMAT_PHOTOS[v?.immatriculation];
  if (v?.photo) { const p = String(v.photo); if (p.startsWith('http')) return p; return `https://web-production-e6e97.up.railway.app${p}`; }
  return CAR_PHOTOS[(v?.marque||'').toLowerCase()] || CAR_PHOTOS.default;
};

const statutConfig = {
  en_attente: { bg: '#FEF9C3', color: '#92580A', label: 'En attente',  icon: <Clock size={12} /> },
  confirmée:  { bg: '#DCFCE7', color: '#166534', label: 'Confirmée',   icon: <CheckCircle size={12} /> },
  terminée:   { bg: '#DBEAFE', color: NAVY,       label: 'Terminée',   icon: <Flag size={12} /> },
  annulée:    { bg: '#FEE2E2', color: RED,         label: 'Annulée',   icon: <XCircle size={12} /> },
};

const PaymentBar = ({ solde, reservation }) => {
  if (!solde) return (
    <div style={{ fontSize: '13px', color: '#64748B' }}>
      <div>Total: <strong style={{ color: NAVY }}>{reservation.montant_total || '—'} DT</strong></div>
      <div style={{ marginTop: '4px' }}>Acompte: <strong style={{ color: AMBER }}>{reservation.acompte || '—'} DT</strong></div>
    </div>
  );
  const pct     = solde.montant_total > 0 ? Math.min(100, (solde.total_paye / solde.montant_total) * 100) : 0;
  const isSolde = solde.montant_restant <= 0;
  const barColor = isSolde ? GREEN : pct > 60 ? NAVY : AMBER;
  const steps = [
    { label: 'Acompte',   paid: parseFloat(solde.acompte) > 0,         amount: parseFloat(solde.acompte) > 0 ? `${solde.acompte} DT` : null },
    { label: 'Paiements', paid: parseFloat(solde.total_paiements) > 0, amount: parseFloat(solde.total_paiements) > 0 ? `${solde.total_paiements} DT` : null },
    { label: 'Soldé',     paid: isSolde,                                amount: null },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '12px' }}>
        {[
          { label: 'TOTAL',   value: `${solde.montant_total} DT`, color: NAVY,  bg: '#EFF4FB' },
          { label: 'ACOMPTE', value: `${solde.acompte} DT`,       color: AMBER, bg: '#FEF3DC' },
          { label: 'RESTANT', value: isSolde ? 'Soldé' : `${solde.montant_restant} DT`, color: isSolde ? GREEN : AMBER, bg: isSolde ? '#DCFCE7' : '#FEF9C3', border: isSolde ? GREEN : AMBER },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '8px', padding: '8px', textAlign: 'center', border: s.border ? `1.5px solid ${s.border}` : 'none' }}>
            <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ fontWeight: '800', color: s.color, fontSize: '13px' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '4px', fontWeight: '600' }}>
          <span>Progression</span>
          <span style={{ fontWeight: '800', color: barColor }}>{pct.toFixed(0)}%</span>
        </div>
        <div style={{ background: '#F0F2F5', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
          <div style={{ background: barColor, height: '100%', width: `${pct}%`, borderRadius: '6px', transition: 'width 0.5s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto 4px', background: step.paid ? (i === steps.length - 1 ? GREEN : NAVY) : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', fontWeight: '800' }}>
                {step.paid ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: '10.5px', color: step.paid ? '#1A2535' : '#94A3B8', fontWeight: '700' }}>{step.label}</div>
              {step.amount && <div style={{ fontSize: '10.5px', color: NAVY, fontWeight: '700', marginTop: '1px' }}>{step.amount}</div>}
            </div>
            {i < steps.length - 1 && <div style={{ height: '2px', width: '20px', flexShrink: 0, background: step.paid ? NAVY : '#E2E8F0', marginBottom: '18px' }} />}
          </div>
        ))}
      </div>
    </div>
  );
};

const RetourAlertBanner = ({ reservations, clients, vehicles, onOpen }) => {
  if (!reservations || reservations.length === 0) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  return (
    <div style={{
      background: 'linear-gradient(135deg, #4C1D95 0%, #5B21B6 50%, #6D28D9 100%)',
      borderRadius: '16px', padding: '16px 20px', marginBottom: '22px',
      boxShadow: '0 8px 32px rgba(109,40,217,0.3)',
      position: 'relative', overflow: 'hidden',
      animation: 'slideIn 0.4s ease-out',
    }}>
      <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <ClipboardList size={22} color="white" />
            <span style={{ position: 'absolute', top: '-7px', right: '-7px', background: '#EF4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
              {reservations.length}
            </span>
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: 'white' }}>🔍 Inspection de Retour requise</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              {reservations.length} réservation(s) arrivant à échéance — inspection obligatoire
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: '600' }}>
          <div style={{ width: '8px', height: '8px', background: '#A78BFA', borderRadius: '50%' }}/>
          À compléter avant clôture
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {reservations.map(r => {
          const client  = clients?.find(c => c.id === r.client);
          const vehicle = vehicles?.find(v => v.id === r.vehicle);
          const fin     = new Date(r.date_fin); fin.setHours(0,0,0,0);
          const isToday = fin.getTime() === today.getTime();
          return (
            <div key={r.id} style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
              borderRadius: '12px', padding: '12px 16px',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '16px',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img src={getCarPhoto(vehicle)} alt="" style={{ width: '54px', height: '40px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '800', color: 'white', fontSize: '14px' }}>Rés. #{r.id}</span>
                    <span style={{ background: isToday ? '#EF4444' : '#F59E0B', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                      {isToday ? '🔴 Aujourd\'hui' : '🟡 Demain'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>🚗 {vehicle ? `${vehicle.marque} ${vehicle.modele}` : '—'} ({vehicle?.immatriculation})</span>
                    <span>👤 {client ? `${client.prenom} ${client.nom}` : '—'}</span>
                    <span>📅 Fin: {r.date_fin}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => onOpen(r)}
                style={{
                  padding: '10px 18px', background: 'white', color: PURPLE,
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                  whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <ClipboardList size={14} /> Inspecter
              </button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

const AccidentModal = ({ reservation, client, vehicle, vehicles, onClose, onConfirm }) => {
  const [selectedVehicle, setSelectedVehicle]    = useState(null);
  const [newDateFin, setNewDateFin]               = useState(reservation.date_fin);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [step, setStep]                           = useState(1);

  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const res = await api.get(`/vehicles/available/?date_debut=${reservation.date_debut}&date_fin=${reservation.date_fin}`);
        const prixRef = parseFloat(vehicle?.prix_journalier || 0);
        const similaires = res.data.filter(v => v.id !== reservation.vehicle && parseFloat(v.prix_journalier) >= prixRef * 0.7 && parseFloat(v.prix_journalier) <= prixRef * 1.3);
        setAvailableVehicles(similaires);
      } catch { setAvailableVehicles([]); }
      finally { setLoading(false); }
    };
    fetchAvailable();
  }, [reservation, vehicle]);

  const calcDays = (d1, d2) => Math.max(1, Math.round((new Date(d2) - new Date(d1)) / 86400000));
  const originalDays = calcDays(reservation.date_debut, reservation.date_fin);
  const newDays      = calcDays(reservation.date_debut, newDateFin);
  const extraDays    = Math.max(0, newDays - originalDays);
  const extraCost    = extraDays > 0 && selectedVehicle ? (extraDays * parseFloat(selectedVehicle.prix_journalier)).toFixed(2) : '0.00';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          {['Notification client', 'Choix véhicule', 'Confirmation'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: step > i ? NAVY : step === i+1 ? AMBER : '#E2E8F0', color: step >= i+1 ? 'white' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: step === i+1 ? NAVY : '#94A3B8', flex: 1 }}>{s}</span>
              {i < 2 && <ChevronRight size={14} color="#DDE3ED" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 style={{ color: RED, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={20} /> Accident déclaré — Notifier le client
            </h2>
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ fontWeight: '700', color: RED, marginBottom: '8px' }}><AlertTriangle size={14} style={{ verticalAlign: 'middle' }} /> Réservation #{reservation.id}</div>
              <div style={{ color: '#7F1D1D' }}>Véhicule: <strong>{vehicle?.marque} {vehicle?.modele}</strong> ({vehicle?.immatriculation})</div>
              <div style={{ color: '#7F1D1D', marginTop: '4px' }}>Période: {reservation.date_debut} → {reservation.date_fin}</div>
            </div>
            {client && (
              <div style={{ background: '#F8FAFC', border: '1px solid #DDE3ED', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', color: NAVY, marginBottom: '10px', fontSize: '13px' }}>Client à notifier</div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{client.prenom} {client.nom}</div>
                {client.telephone && <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}><Phone size={12} style={{ verticalAlign: 'middle' }} /> {client.telephone}</div>}
                {client.email    && <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}><Mail size={12} style={{ verticalAlign: 'middle' }} /> {client.email}</div>}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={onClose}>Fermer</button>
              <button className="btn btn-primary" onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Proposer un remplacement <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ color: NAVY, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Car size={20} /> Choisir un véhicule de remplacement
            </h2>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date fin</label>
              <input type="date" value={newDateFin} min={reservation.date_debut} onChange={e => setNewDateFin(e.target.value)} />
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>Recherche...</div>
            ) : availableVehicles.length === 0 ? (
              <div style={{ background: '#FEE2E2', borderRadius: '10px', padding: '16px', textAlign: 'center', color: RED, fontWeight: '600', fontSize: '13px' }}>
                Aucun véhicule similaire disponible.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {availableVehicles.map(v => {
                  const isSelected = selectedVehicle?.id === v.id;
                  return (
                    <div key={v.id} onClick={() => setSelectedVehicle(v)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: `2px solid ${isSelected ? NAVY : '#DDE3ED'}`, borderRadius: '10px', cursor: 'pointer', background: isSelected ? '#EFF4FB' : 'white' }}>
                      <img src={getCarPhoto(v)} alt={v.marque} style={{ width: '64px', height: '46px', objectFit: 'cover', borderRadius: '6px' }} onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{v.marque} {v.modele}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{v.immatriculation}</div>
                      </div>
                      <div style={{ fontWeight: '800', color: GREEN }}>{v.prix_journalier} DT/j</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setStep(1)}>Retour</button>
              <button className="btn btn-primary" disabled={!selectedVehicle} onClick={() => setStep(3)} style={{ opacity: selectedVehicle ? 1 : 0.5 }}>
                Confirmer <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}

        {step === 3 && selectedVehicle && (
          <>
            <h2 style={{ color: GREEN, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CheckCircle size={20} /> Confirmer le remplacement
            </h2>
            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              {[
                { label: 'Nouveau véhicule', value: `${selectedVehicle.marque} ${selectedVehicle.modele} (${selectedVehicle.immatriculation})`, color: GREEN },
                { label: 'Client',           value: `${client?.prenom} ${client?.nom}` },
                { label: 'Période',          value: `${reservation.date_debut} → ${newDateFin}` },
                { label: 'Nouveau total',    value: `${(newDays * parseFloat(selectedVehicle.prix_journalier)).toFixed(2)} DT`, color: NAVY },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0F2F5', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>{row.label}</span>
                  <strong style={{ color: row.color || '#1A2535' }}>{row.value}</strong>
                </div>
              ))}
            </div>
            {client?.email && (
              <div style={{ background: '#EFF4FB', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Send size={16} color={NAVY} />
                <div style={{ fontSize: '13px', color: NAVY }}>Email envoyé à <strong>{client.email}</strong></div>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setStep(2)}>Retour</button>
              <button className="btn btn-primary" style={{ background: GREEN, display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => onConfirm(selectedVehicle, newDateFin, reservation, client)}>
                <CheckCircle size={15} /> Confirmer & Envoyer email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MobileNotifPanel = ({ pendingReservations, clients, vehicles, onAction }) => {
  const [processing, setProcessing] = useState({});
  if (pendingReservations.length === 0) return null;
  const handleAction = async (id, action) => {
    setProcessing(p => ({ ...p, [id]: action }));
    await onAction(id, action);
    setProcessing(p => { const n = { ...p }; delete n[id]; return n; });
  };
  return (
    <div style={{ background: '#FEF3DC', border: `2px solid ${AMBER}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ width: '36px', height: '36px', background: AMBER, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Bell size={18} color="white" />
          <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: RED, color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
            {pendingReservations.length}
          </span>
        </div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '14px', color: '#1A2535' }}>📱 Nouvelles réservations — Application Mobile</div>
          <div style={{ fontSize: '12px', color: '#92580A' }}>{pendingReservations.length} demande(s) en attente</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {pendingReservations.map(r => {
          const client  = clients.find(c => c.id === r.client);
          const vehicle = vehicles.find(v => v.id === r.vehicle);
          const days    = Math.max(1, Math.round((new Date(r.date_fin) - new Date(r.date_debut)) / 86400000));
          const isProcessing = processing[r.id];
          return (
            <div key={r.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', border: '1.5px solid #FCD34D', display: 'grid', gridTemplateColumns: '60px 1fr auto auto', alignItems: 'center', gap: '14px' }}>
              <img src={getCarPhoto(vehicle)} alt="" style={{ width: '60px', height: '44px', objectFit: 'cover', borderRadius: '8px' }} onError={e => { e.target.src = CAR_PHOTOS.default; }} />
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '14px', color: NAVY }}>Rés. #{r.id}</strong>
                  <span style={{ background: '#FEF9C3', color: '#92580A', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>📱 Mobile</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{vehicle ? `${vehicle.marque} ${vehicle.modele}` : '—'}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  <span><User size={11} style={{ verticalAlign: 'middle' }} /> {client ? `${client.prenom} ${client.nom}` : `#${r.client}`}</span>
                  <span style={{ marginLeft: '12px' }}><CalendarDays size={11} style={{ verticalAlign: 'middle' }} /> {r.date_debut} → {r.date_fin} ({days}j)</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800', fontSize: '16px', color: GREEN }}>{r.montant_total} DT</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Acompte: {r.acompte} DT</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleAction(r.id, 'annulée')} disabled={!!isProcessing}
                  style={{ padding: '8px 14px', background: '#FEE2E2', color: RED, border: `1.5px solid ${RED}`, borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', opacity: isProcessing ? 0.6 : 1 }}>
                  <XCircle size={14} />{isProcessing === 'annulée' ? '...' : 'Refuser'}
                </button>
                <button onClick={() => handleAction(r.id, 'confirmée')} disabled={!!isProcessing}
                  style={{ padding: '8px 14px', background: GREEN, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', opacity: isProcessing ? 0.6 : 1 }}>
                  <CheckCircle size={14} />{isProcessing === 'confirmée' ? '...' : 'Confirmer'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReservationsList = () => {
  const [reservations,   setReservations]   = useState([]);
  const [clients,        setClients]        = useState([]);
  const [vehicles,       setVehicles]       = useState([]);
  const [contracts,      setContracts]      = useState([]);
  const [soldes,         setSoldes]         = useState({});
  const [search,         setSearch]         = useState('');
  const [filterStatut,   setFilterStatut]   = useState('');
  const [filterAccident, setFilterAccident] = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [accidentModal,  setAccidentModal]  = useState(null);
  const [retourModal,    setRetourModal]    = useState(null);

  const fetchSoldes = async (list) => {
    const map = {};
    await Promise.all(list.map(async r => {
      try { const res = await api.get(`/payments/solde/${r.id}/`); map[r.id] = res.data; } catch {}
    }));
    setSoldes(map);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [r, c, v, ct] = await Promise.all([
        api.get('/reservations/'), api.get('/clients/'),
        api.get('/vehicles/'),    api.get('/contracts/'),
      ]);
      setReservations(r.data); setClients(c.data);
      setVehicles(v.data);     setContracts(ct.data);
      await fetchSoldes(r.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  const handleReservationAction = async (id, newStatut) => {
    try { await api.patch(`/reservations/${id}/`, { statut: newStatut }); await fetchAll(); }
    catch (err) { console.error(err); }
  };

  const getReservationsAInspecter = () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const demain = new Date(today); demain.setDate(today.getDate() + 1);
    return reservations.filter(r => {
      if (r.statut !== 'confirmée') return false;
      if (r.inspection_retour_faite) return false;
      const fin = new Date(r.date_fin); fin.setHours(0,0,0,0);
      return fin >= today && fin <= demain;
    });
  };

  // ✅ FIX — handleRetourConfirm : vehicle update ne bloque plus la sauvegarde
  const handleRetourConfirm = async (data) => {
    try {
      // ÉTAPE 1 — Sauvegarde inspection + passe réservation en terminée
      await api.patch(`/reservations/${data.reservation_id}/`, {
        inspection_retour_faite: true,
        statut:                  'terminée',
        etat_retour:             data.etat_retour,
        notes_retour:            data.notes_retour,
        score_retour:            data.score_retour,
        kilometrage_retour:      data.kilometrage_retour,
        carburant_retour:        data.carburant_retour,
        eraflures_retour:        data.eraflures_retour,
        bosses_retour:           data.bosses_retour,
      });

      // ÉTAPE 2 — Mise à jour véhicule (séparée — ne bloque PAS si erreur 404)
      try {
        const newEtat = data.etat_retour === 'dommages' ? 'dommages'
                      : data.etat_retour === 'defauts'  ? 'defauts'
                      : 'excellent';
        await api.patch(`/vehicles/${retourModal.vehicle.id}/`, {
          statut:           'disponible',
          etat_carrosserie: newEtat,
          ...(data.kilometrage_retour
            ? { kilometrage: data.kilometrage_retour } : {}),
        });
      } catch (vehicleErr) {
        // Vehicle update ignoré — inspection quand même sauvegardée ✅
        console.warn('[Retour] Vehicle update skipped:',
          vehicleErr?.response?.status, vehicleErr?.message);
      }

      await fetchAll();
      setRetourModal(null);
    } catch (e) {
      alert('Erreur lors de l\'enregistrement: '
        + JSON.stringify(e.response?.data));
    }
  };

  const getClient   = id => clients.find(c => c.id === id);
  const getVehicle  = id => vehicles.find(v => v.id === id);
  const getContract = id => contracts.find(c => c.reservation === id);

  // ✅ FIX SORT — Aujourd'hui en premier, futur proche, puis passé
  const filtered = reservations
    .filter(r => {
      const cl = getClient(r.client);
      const ve = getVehicle(r.vehicle);
      const str = `${cl?.nom} ${cl?.prenom} ${cl?.cin} ${ve?.marque} ${ve?.modele} ${ve?.immatriculation}`.toLowerCase();
      return str.includes(search.toLowerCase())
        && (filterStatut   ? r.statut === filterStatut : true)
        && (filterAccident ? r.a_accident === true     : true);
    })
    .sort((a, b) => {
      const today    = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

      const debutA = new Date(a.date_debut), finA = new Date(a.date_fin);
      const debutB = new Date(b.date_debut), finB = new Date(b.date_fin);

      // 1 — Active AUJOURD'HUI en premier
      const activeA = debutA <= today && finA >= today;
      const activeB = debutB <= today && finB >= today;
      if (activeA && !activeB) return -1;
      if (!activeA && activeB) return 1;

      // 2 — Se termine aujourd'hui ou demain (inspection urgente)
      const urgentA = finA >= today && finA <= tomorrow;
      const urgentB = finB >= today && finB <= tomorrow;
      if (urgentA && !urgentB) return -1;
      if (!urgentA && urgentB) return 1;

      // 3 — Futur proche : ascendant (le plus tôt en premier)
      if (debutA >= today && debutB >= today) return debutA - debutB;

      // 4 — Passé récent : descendant (le plus récent en premier)
      if (debutA < today && debutB < today) return debutB - debutA;

      // 5 — Futur avant passé
      if (debutA >= today && debutB < today) return -1;
      if (debutA < today  && debutB >= today) return 1;

      return 0;
    });

  const totalRestant  = Object.values(soldes).reduce((s, x) => s + Math.max(0, x.montant_restant || 0), 0);
  const totalEncaisse = Object.values(soldes).reduce((s, x) => s + (x.total_paye || 0), 0);
  const nbSoldes      = Object.values(soldes).filter(x => x.montant_restant <= 0).length;
  const nbAccidents   = reservations.filter(r => r.a_accident).length;
  const aInspecter    = getReservationsAInspecter();
  const totalPages    = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated     = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleConfirmReplacement = async (newVehicle, newDateFin, reservation, client) => {
    try {
      const days     = Math.max(1, Math.round((new Date(newDateFin) - new Date(reservation.date_debut)) / 86400000));
      const newTotal = (days * parseFloat(newVehicle.prix_journalier)).toFixed(2);
      const oldVeh   = getVehicle(reservation.vehicle);
      const acomptePct = days <= 3 ? 0.20 : days <= 7 ? 0.30 : days <= 14 ? 0.40 : 0.50;
      const newAcompte = (parseFloat(newTotal) * acomptePct).toFixed(2);
      await api.patch(`/reservations/${reservation.id}/`, {
        vehicle: newVehicle.id, date_fin: newDateFin,
        vehicule_remplace: reservation.vehicle, raison_remplacement: 'Accident — véhicule indisponible',
        montant_total: newTotal, acompte: newAcompte,
      });
      if (client?.email) {
        try {
          await api.post('/vehicles/send-replacement-email/', {
            client_email: client.email, client_nom: client.nom, client_prenom: client.prenom,
            ancien_vehicule: `${oldVeh?.marque} ${oldVeh?.modele} (${oldVeh?.immatriculation})`,
            nouveau_vehicule: `${newVehicle.marque} ${newVehicle.modele} (${newVehicle.immatriculation})`,
            date_debut: reservation.date_debut, date_fin: newDateFin,
            reservation_id: reservation.id, nouveau_total: newTotal,
          });
        } catch (emailErr) { console.warn('Email non envoyé:', emailErr); }
      }
      await fetchAll();
      setAccidentModal(null);
    } catch (e) { alert('Erreur: ' + JSON.stringify(e.response?.data)); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <List size={22} color={NAVY} /> Liste des Réservations
        </h1>
        <button onClick={handleRefresh} disabled={refreshing}
          style={{ padding: '9px 18px', background: NAVY, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total réservations', value: reservations.length,                 color: NAVY,   bg: '#EFF4FB', icon: <List size={18} /> },
          { label: 'Total encaissé',     value: `${totalEncaisse.toFixed(2)} DT`,    color: GREEN,  bg: '#DCFCE7', icon: <Banknote size={18} /> },
          { label: 'Total restant',      value: `${totalRestant.toFixed(2)} DT`,     color: RED,    bg: '#FEE2E2', icon: <Clock size={18} /> },
          { label: 'Soldées',            value: `${nbSoldes}/${reservations.length}`,color: PURPLE, bg: '#F3EEFF', icon: <CheckCircle size={18} /> },
          { label: 'Accidents',          value: nbAccidents,                          color: RED,    bg: '#FEE2E2', icon: <AlertTriangle size={18} /> },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#64748B', fontSize: '11.5px', marginTop: '3px', fontWeight: '600' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* RetourCheck Banner */}
      <RetourAlertBanner
        reservations={aInspecter}
        clients={clients}
        vehicles={vehicles}
        onOpen={(r) => setRetourModal({ reservation: r, client: getClient(r.client), vehicle: getVehicle(r.vehicle) })}
      />

      {/* Mobile notif panel */}
      <MobileNotifPanel
        pendingReservations={reservations.filter(r => r.statut === 'en_attente')}
        clients={clients} vehicles={vehicles}
        onAction={handleReservationAction}
      />

      {/* Search + Filters */}
      <div className="card" style={{ marginBottom: '16px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Rechercher par client, CIN, véhicule..." style={{ paddingLeft: '32px' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <SlidersHorizontal size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setCurrentPage(1); }} style={{ paddingLeft: '30px', minWidth: '160px' }}>
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirmée">Confirmée</option>
              <option value="terminée">Terminée</option>
              <option value="annulée">Annulée</option>
            </select>
          </div>
          <button onClick={() => { setFilterAccident(!filterAccident); setCurrentPage(1); }}
            style={{ padding: '8px 14px', background: filterAccident ? '#FEE2E2' : 'white', color: filterAccident ? RED : '#64748B', border: `1.5px solid ${filterAccident ? RED : '#DDE3ED'}`, borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} />
            {filterAccident ? `Accidents (${nbAccidents})` : 'Avec accident'}
          </button>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
            <strong style={{ color: '#1A2535' }}>{filtered.length}</strong> résultat(s)
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {paginated.map(r => {
          const client   = getClient(r.client);
          const vehicle  = getVehicle(r.vehicle);
          const contract = getContract(r.id);
          const solde    = soldes[r.id];
          const days     = Math.max(1, Math.round((new Date(r.date_fin) - new Date(r.date_debut)) / 86400000));
          const statut   = statutConfig[r.statut] || { bg: '#F1F5F9', color: '#64748B', label: r.statut, icon: null };
          const isSolde  = solde && solde.montant_restant <= 0;

          const today = new Date(); today.setHours(0,0,0,0);
          const dateFin = new Date(r.date_fin); dateFin.setHours(0,0,0,0);
          const demain  = new Date(today); demain.setDate(today.getDate() + 1);

          const isFinAujourdhui = dateFin.getTime() === today.getTime();
          const isFinDemain     = dateFin.getTime() === demain.getTime();
          const needsRetour     = (isFinAujourdhui || isFinDemain) && r.statut === 'confirmée' && !r.inspection_retour_faite;
          const hasAccidentNoReplacement = r.a_accident && !r.vehicule_remplace && new Date(r.date_debut) >= today && !isSolde;

          return (
            <div key={r.id} style={{
              background: 'white', borderRadius: '14px', overflow: 'hidden',
              border: `1.5px solid ${needsRetour ? PURPLE : isSolde ? '#86EFAC' : r.a_accident ? '#FECACA' : '#DDE3ED'}`,
              boxShadow: needsRetour ? '0 0 0 3px rgba(124,58,237,0.12)' : '0 1px 6px rgba(0,0,0,0.05)',
            }}>
              <div style={{
                padding: '12px 20px', borderBottom: '1px solid #F0F2F5',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
                background: needsRetour ? '#FAF5FF' : isSolde ? '#F0FFF4' : r.statut === 'confirmée' ? '#EFF4FB' : r.statut === 'annulée' ? '#FFF5F5' : '#FFFBEB',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ color: NAVY, fontSize: '15px' }}>Rés. #{r.id}</strong>
                  {contract && <span style={{ color: PURPLE, fontWeight: '700', fontSize: '12.5px', background: '#F3EEFF', padding: '2px 8px', borderRadius: '6px' }}>{contract.numero}</span>}
                  <span style={{ background: statut.bg, color: statut.color, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {statut.icon} {statut.label}
                  </span>
                  {r.a_accident && <span style={{ background: '#FEE2E2', color: RED, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> Accident</span>}
                  {r.vehicule_remplace && <span style={{ background: '#DCFCE7', color: GREEN, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}><CheckCircle size={12} style={{ verticalAlign: 'middle' }} /> Remplacé</span>}
                  {isSolde && <span style={{ background: '#DCFCE7', color: GREEN, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Soldé</span>}
                  {r.inspection_retour_faite && (
                    <span style={{ background: '#EDE9FE', color: PURPLE, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ClipboardList size={12} /> Inspecté {r.score_retour !== undefined ? `· ${r.score_retour}/100` : ''}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {needsRetour && (
                    <button onClick={() => setRetourModal({ reservation: r, client, vehicle })}
                      style={{
                        padding: '7px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: '800', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px',
                        background: `linear-gradient(135deg, ${PURPLE}, #5B21B6)`,
                        color: 'white', boxShadow: '0 3px 10px rgba(124,58,237,0.3)',
                        animation: isFinAujourdhui ? 'pulse 2s infinite' : 'none',
                      }}>
                      <ClipboardList size={14} />
                      {isFinAujourdhui ? '🔴 Inspecter maintenant' : '🟡 Inspecter demain'}
                    </button>
                  )}
                  {hasAccidentNoReplacement && (
                    <button onClick={() => setAccidentModal({ reservation: r, client, vehicle })}
                      style={{ padding: '6px 12px', background: RED, color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Bell size={13} /> Notifier & Remplacer
                    </button>
                  )}
                  <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarDays size={13} />
                    {r.date_debut} <ArrowRight size={12} /> {r.date_fin}
                    <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#1A2535' }}>{days} j</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr' }}>
                {/* Client */}
                <div style={{ padding: '16px 20px', borderRight: '1px solid #F0F2F5' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: NAVY, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><User size={12} /> Client</div>
                  {client ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF4FB', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                          {client.prenom?.charAt(0)}{client.nom?.charAt(0)}
                        </div>
                        <div style={{ fontWeight: '800', fontSize: '15px' }}>{client.prenom} {client.nom}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {client.cin && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ background: '#EFF4FB', padding: '1px 7px', borderRadius: '4px', color: NAVY, fontWeight: '700', fontSize: '11px' }}>CIN</span><span style={{ fontWeight: '700', color: '#1A2535', fontSize: '13px' }}>{client.cin}</span></div>}
                        {client.telephone && <div style={{ fontSize: '12.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={11} /> {client.telephone}</div>}
                        {client.permis_number && <div style={{ fontSize: '12.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}><CreditCard size={11} /> Permis: <strong>{client.permis_number}</strong></div>}
                        {client.email && <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={11} /> {client.email}</div>}
                      </div>
                    </>
                  ) : <span style={{ color: '#94A3B8', fontSize: '13px' }}>—</span>}
                </div>

                {/* Véhicule */}
                <div style={{ padding: '16px 20px', borderRight: '1px solid #F0F2F5' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: GREEN, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><Car size={12} /> Véhicule</div>
                  {vehicle ? (
                    <>
                      <div style={{ borderRadius: '8px', overflow: 'hidden', height: '70px', marginBottom: '8px' }}>
                        <img src={getCarPhoto(vehicle)} alt={vehicle.marque} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '6px' }}>{vehicle.marque} {vehicle.modele}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ background: '#EFF4FB', padding: '1px 7px', borderRadius: '4px', color: NAVY, fontWeight: '700', fontSize: '11px' }}>{vehicle.immatriculation}</span>
                          {vehicle.couleur && <span style={{ fontSize: '12px', color: '#64748B' }}>{vehicle.couleur}</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: GREEN, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><Banknote size={12} /> {vehicle.prix_journalier} DT/jour</div>
                        <div style={{ fontSize: '12px', color: PURPLE, fontWeight: '600' }}>{days}j × {vehicle.prix_journalier} = {(parseFloat(vehicle.prix_journalier) * days).toFixed(2)} DT</div>
                      </div>
                    </>
                  ) : <span style={{ color: '#94A3B8', fontSize: '13px' }}>—</span>}
                </div>

                {/* Finances */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: AMBER, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><Banknote size={12} /> Situation Financière</div>
                  <PaymentBar solde={solde} reservation={r} />
                </div>
              </div>

              {(r.notes || r.accident_description || r.caution) && (
                <div style={{ padding: '10px 20px', background: '#F8FAFC', borderTop: '1px solid #F0F2F5', display: 'flex', gap: '16px', fontSize: '12.5px', flexWrap: 'wrap' }}>
                  {r.caution && <span style={{ color: PURPLE, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><Banknote size={12} /> Caution: {r.caution} DT</span>}
                  {r.notes && <span style={{ color: '#64748B' }}>{r.notes}</span>}
                  {r.accident_description && <span style={{ color: RED, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> {r.accident_description}</span>}
                </div>
              )}

              {r.inspection_retour_faite && r.etat_retour && (
                <div style={{ padding: '10px 20px', background: '#FAF5FF', borderTop: '1px solid #E9D5FF', display: 'flex', gap: '16px', fontSize: '12.5px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ color: PURPLE, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><ClipboardList size={12} /> Inspection effectuée</span>
                  <span style={{ color: PURPLE }}>État: <strong>{r.etat_retour}</strong></span>
                  {r.score_retour !== undefined && <span style={{ color: r.score_retour >= 80 ? GREEN : r.score_retour >= 60 ? AMBER : RED, fontWeight: '700' }}>Score: {r.score_retour}/100</span>}
                  {r.notes_retour && <span style={{ color: '#64748B', fontStyle: 'italic' }}>"{r.notes_retour}"</span>}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '50px', color: '#94A3B8' }}>
            <List size={44} color="#DDE3ED" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: '15px', fontWeight: '600' }}>Aucune réservation trouvée</div>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="card" style={{ marginTop: '18px' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      )}

      {accidentModal && (
        <AccidentModal
          reservation={accidentModal.reservation} client={accidentModal.client}
          vehicle={accidentModal.vehicle} vehicles={vehicles}
          onClose={() => setAccidentModal(null)} onConfirm={handleConfirmReplacement}
        />
      )}

      {retourModal && (
        <RetourCheckModal
          reservation={retourModal.reservation} client={retourModal.client}
          vehicle={retourModal.vehicle}
          onClose={() => setRetourModal(null)} onConfirm={handleRetourConfirm}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{box-shadow:0 3px 10px rgba(124,58,237,0.3)} 50%{box-shadow:0 3px 20px rgba(124,58,237,0.6)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};

export default ReservationsList;