import { useState, useEffect, useCallback } from 'react';
import {
  List, RefreshCw, Search, SlidersHorizontal,
  User, Car, Banknote, CalendarDays, AlertTriangle,
  CheckCircle, Clock, XCircle, Flag, Phone, Mail,
  CreditCard, MapPin, Fuel, ChevronRight, Bell,
  CalendarCheck, ArrowRight, Plus, Send,
} from 'lucide-react';
import api from '../api/axios';
import Pagination from '../components/Pagination';

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
const IMMAT_PHOTOS = {'240TN5082':'https://i.ibb.co/FZmVWK6/vec1.jpg','259TN5651':'https://i.ibb.co/F4SbDBMM/vec2.jpg','243TN1422':'https://i.ibb.co/gbw2JtTH/vec3.jpg','236TN5648':'https://i.ibb.co/0RJ31jBB/vec4.jpg','234TN2126':'https://i.ibb.co/prkyKtjv/vec5.jpg','244TN7005':'https://i.ibb.co/P81vS80/vec6.jpg','251TN1694':'https://i.ibb.co/5WBKGTGL/vec7.jpg','252TN3310':'https://i.ibb.co/9kNtVZGB/vec8.png','253TN4421':'https://i.ibb.co/jvRzYcDB/vec9.png','254TN6632':'https://i.ibb.co/hxvysSY4/vec10.png','255TN7743':'https://i.ibb.co/dsfz2VnP/vec11.png','256TN8854':'https://i.ibb.co/35ccmkFY/vec12.jpg','257TN1301':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155233/vec13_jwhixy.jpg','258TN1402':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155237/vec14_emprhi.jpg','259TN1503':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec15_y7lazd.jpg','260TN1604':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec16_pkydhf.jpg','261TN1705':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec17_z2iw32.jpg','262TN1806':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec18_byuiqk.jpg','263TN1907':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec19_g9yvnw.jpg','264TN2008':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec20_kvsoqj.jpg','265TN2109':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec21_bjkcyt.jpg','266TN2210':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155236/vec22_gkpzax.jpg'};

const getCarPhoto = (v) => {
  if (IMMAT_PHOTOS[v?.immatriculation]) return IMMAT_PHOTOS[v?.immatriculation];
  if (v?.photo) {
    const p = String(v.photo);
    if (p.startsWith('http')) return p;
    return `https://web-production-e6e97.up.railway.app${p}`;
  }
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
  const pct      = solde.montant_total > 0 ? Math.min(100, (solde.total_paye / solde.montant_total) * 100) : 0;
  const isSolde  = solde.montant_restant <= 0;
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
          { label: 'RESTANT', value: isSolde ? 'Soldé' : `${solde.montant_restant} DT`,
            color: isSolde ? GREEN : AMBER, bg: isSolde ? '#DCFCE7' : '#FEF9C3', border: isSolde ? GREEN : AMBER },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '8px', padding: '8px', textAlign: 'center', border: s.border ? `1.5px solid ${s.border}` : 'none' }}>
            <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ fontWeight: '800', color: s.color, fontSize: '13px' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '4px', fontWeight: '600' }}>
          <span>Progression du paiement</span>
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
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto 4px',
                background: step.paid ? (i === steps.length - 1 ? GREEN : NAVY) : '#E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', fontWeight: '800' }}>
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

const AccidentModal = ({ reservation, client, vehicle, vehicles, onClose, onConfirm }) => {
  const [selectedVehicle, setSelectedVehicle]     = useState(null);
  const [newDateFin, setNewDateFin]                = useState(reservation.date_fin);
  const [availableVehicles, setAvailableVehicles]  = useState([]);
  const [loading, setLoading]                      = useState(true);
  const [step, setStep]                            = useState(1);

  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const res = await api.get(`/vehicles/available/?date_debut=${reservation.date_debut}&date_fin=${reservation.date_fin}`);
        const prixRef = parseFloat(vehicle?.prix_journalier || 0);
        const similaires = res.data.filter(v =>
          v.id !== reservation.vehicle &&
          parseFloat(v.prix_journalier) >= prixRef * 0.7 &&
          parseFloat(v.prix_journalier) <= prixRef * 1.3
        );
        setAvailableVehicles(similaires);
      } catch { setAvailableVehicles([]); }
      finally { setLoading(false); }
    };
    fetchAvailable();
  }, [reservation, vehicle]);

  const calcDays  = (d1, d2) => Math.max(1, Math.round((new Date(d2) - new Date(d1)) / 86400000));
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
              <div style={{ width: '26px', height: '26px', borderRadius: '50%',
                background: step > i ? NAVY : step === i+1 ? AMBER : '#E2E8F0',
                color: step >= i+1 ? 'white' : '#94A3B8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
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
              <div style={{ fontWeight: '700', color: RED, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} /> Réservation #{reservation.id}
              </div>
              <div style={{ color: '#7F1D1D' }}>Véhicule: <strong>{vehicle?.marque} {vehicle?.modele}</strong> ({vehicle?.immatriculation})</div>
              <div style={{ color: '#7F1D1D', marginTop: '4px' }}>Période: {reservation.date_debut} → {reservation.date_fin}</div>
              {reservation.accident_description && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.6)', borderRadius: '6px', color: '#991B1B', fontStyle: 'italic' }}>
                  "{reservation.accident_description}"
                </div>
              )}
            </div>
            {client && (
              <div style={{ background: '#F8FAFC', border: '1px solid #DDE3ED', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', color: NAVY, marginBottom: '10px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client à notifier</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#EFF4FB', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                    {client.prenom?.charAt(0)}{client.nom?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{client.prenom} {client.nom}</div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {client.telephone && <span style={{ fontSize: '12.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {client.telephone}</span>}
                      {client.email    && <span style={{ fontSize: '12.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {client.email}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ background: '#EFF4FB', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', color: NAVY, marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Bell size={13} /> Message à communiquer
              </div>
              <div style={{ fontSize: '13px', color: '#1A2535', lineHeight: '1.6', fontStyle: 'italic' }}>
                "Monsieur/Madame <strong>{client?.prenom} {client?.nom}</strong>, nous vous informons qu'un accident a été déclaré sur le véhicule <strong>{vehicle?.marque} {vehicle?.modele}</strong> ({vehicle?.immatriculation}) réservé pour votre location du <strong>{reservation.date_debut}</strong> au <strong>{reservation.date_fin}</strong>. Nous vous proposons un véhicule de remplacement similaire."
              </div>
            </div>
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
            <div style={{ background: '#F8FAFC', border: '1px solid #DDE3ED', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', color: NAVY, fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarDays size={14} /> Modifier la date de fin (optionnel)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date début</label>
                  <input type="date" value={reservation.date_debut} readOnly style={{ background: '#F0F2F5', color: '#94A3B8' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date fin</label>
                  <input type="date" value={newDateFin} min={reservation.date_debut}
                    onChange={e => setNewDateFin(e.target.value)}
                    style={{ border: newDateFin !== reservation.date_fin ? `2px solid ${AMBER}` : undefined }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>Durée</div>
                  <div style={{ fontWeight: '800', fontSize: '18px', color: NAVY }}>{newDays} jour{newDays > 1 ? 's' : ''}</div>
                  {extraDays > 0 && <div style={{ fontSize: '11px', color: AMBER, fontWeight: '700' }}>+{extraDays} jour(s)</div>}
                </div>
              </div>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>Recherche de véhicules similaires...</div>
            ) : availableVehicles.length === 0 ? (
              <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '10px', padding: '16px', textAlign: 'center', color: RED, fontWeight: '600', fontSize: '13px' }}>
                <AlertTriangle size={18} style={{ marginBottom: '6px' }} />
                <div>Aucun véhicule similaire disponible pour cette période.</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', marginBottom: '10px' }}>
                  {availableVehicles.length} véhicule(s) disponible(s) — prix ±30% du véhicule original
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {availableVehicles.map(v => {
                    const isSelected = selectedVehicle?.id === v.id;
                    const total = (newDays * parseFloat(v.prix_journalier)).toFixed(2);
                    return (
                      <div key={v.id} onClick={() => setSelectedVehicle(v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                          border: `2px solid ${isSelected ? NAVY : '#DDE3ED'}`, borderRadius: '10px',
                          cursor: 'pointer', background: isSelected ? '#EFF4FB' : 'white', transition: 'all 0.14s' }}>
                        <img src={getCarPhoto(v)} alt={v.marque}
                          style={{ width: '64px', height: '46px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                          onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px' }}>{v.marque} {v.modele}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{v.immatriculation} · {v.nombre_places} places · {v.carburant}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: '800', color: GREEN, fontSize: '14px' }}>{v.prix_journalier} DT/j</div>
                          <div style={{ fontSize: '11.5px', color: PURPLE, fontWeight: '600' }}>{newDays}j → {total} DT</div>
                        </div>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isSelected ? NAVY : '#DDE3ED'}`, background: isSelected ? NAVY : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {extraDays > 0 && selectedVehicle && (
              <div style={{ background: '#FEF3DC', border: '1px solid #E8A020', borderRadius: '8px', padding: '10px 14px', marginTop: '10px', fontSize: '13px', color: '#92580A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck size={15} />
                Prolongation de {extraDays} jour(s) → coût supplémentaire: <strong>{extraCost} DT</strong>
              </div>
            )}
            {selectedVehicle && vehicle && (
              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px', marginTop: '12px', border: '1px solid #DDE3ED' }}>
                <div style={{ fontWeight: '700', color: NAVY, fontSize: '12px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Car size={13} /> Comparaison véhicules
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: '8px', alignItems: 'center' }}>
                  <div style={{ background: '#FEE2E2', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: RED, fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Ancien véhicule</div>
                    <img src={getCarPhoto(vehicle)} alt="" style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#1A2535' }}>{vehicle.marque} {vehicle.modele}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{vehicle.immatriculation}</div>
                    <div style={{ fontWeight: '800', color: RED, fontSize: '15px', marginTop: '6px' }}>{vehicle.prix_journalier} DT/j</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '20px', color: '#94A3B8' }}>→</div>
                  <div style={{ background: '#DCFCE7', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: GREEN, fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Nouveau véhicule</div>
                    <img src={getCarPhoto(selectedVehicle)} alt="" style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#1A2535' }}>{selectedVehicle.marque} {selectedVehicle.modele}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{selectedVehicle.immatriculation}</div>
                    <div style={{ fontWeight: '800', color: GREEN, fontSize: '15px', marginTop: '6px' }}>{selectedVehicle.prix_journalier} DT/j</div>
                  </div>
                </div>
                {[
                  { label: 'Places',    old: `${vehicle.nombre_places} pl`,    nw: `${selectedVehicle.nombre_places} pl` },
                  { label: 'Carburant', old: vehicle.carburant || '—',          nw: selectedVehicle.carburant || '—' },
                  { label: 'Total',     old: `${(originalDays * parseFloat(vehicle.prix_journalier)).toFixed(0)} DT`, nw: `${(newDays * parseFloat(selectedVehicle.prix_journalier)).toFixed(0)} DT` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '6px', marginTop: '6px', fontSize: '12px', alignItems: 'center' }}>
                    <div style={{ background: '#FEE2E2', borderRadius: '6px', padding: '5px 8px', textAlign: 'center', color: RED, fontWeight: '600' }}>{row.old}</div>
                    <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '10px', fontWeight: '700' }}>{row.label}</div>
                    <div style={{ background: '#DCFCE7', borderRadius: '6px', padding: '5px 8px', textAlign: 'center', color: GREEN, fontWeight: '600' }}>{row.nw}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setStep(1)}>Retour</button>
              <button className="btn btn-primary" disabled={!selectedVehicle} onClick={() => setStep(3)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: selectedVehicle ? 1 : 0.5 }}>
                Confirmer le choix <ChevronRight size={15} />
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
                { label: 'Ancien véhicule',  value: `${vehicle?.marque} ${vehicle?.modele} (${vehicle?.immatriculation})`, color: RED },
                { label: 'Nouveau véhicule', value: `${selectedVehicle.marque} ${selectedVehicle.modele} (${selectedVehicle.immatriculation})`, color: GREEN },
                { label: 'Client',           value: `${client?.prenom} ${client?.nom}` },
                { label: 'Période',          value: `${reservation.date_debut} → ${newDateFin}` },
                { label: 'Durée',            value: `${newDays} jour(s)${extraDays > 0 ? ` (+${extraDays})` : ''}` },
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
                <div style={{ fontSize: '13px', color: NAVY }}>
                  Un email de notification sera envoyé automatiquement à <strong>{client.email}</strong>
                </div>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: AMBER, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Bell size={18} color="white" />
            <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: RED, color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
              {pendingReservations.length}
            </span>
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: '#1A2535' }}>📱 Nouvelles réservations — Application Mobile</div>
            <div style={{ fontSize: '12px', color: '#92580A' }}>{pendingReservations.length} demande(s) en attente de confirmation admin</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#92580A', fontWeight: '600' }}>
          <div style={{ width: '8px', height: '8px', background: AMBER, borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          Actualisation auto 10s
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
              <img src={getCarPhoto(vehicle)} alt={vehicle?.marque || ''} style={{ width: '60px', height: '44px', objectFit: 'cover', borderRadius: '8px' }} onError={e => { e.target.src = CAR_PHOTOS.default; }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <strong style={{ fontSize: '14px', color: NAVY }}>Rés. #{r.id}</strong>
                  <span style={{ background: '#FEF9C3', color: '#92580A', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>📱 Mobile</span>
                  <span style={{ background: '#FEF9C3', color: '#92580A', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>En attente</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A2535' }}>{vehicle ? `${vehicle.marque} ${vehicle.modele}` : '—'}</div>
                <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '14px', marginTop: '2px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={11} />{client ? `${client.prenom} ${client.nom}` : `Client #${r.client}`}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarDays size={11} /> {r.date_debut} → {r.date_fin} ({days}j)</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800', fontSize: '16px', color: GREEN }}>{r.montant_total} DT</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Acompte: {r.acompte} DT</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleAction(r.id, 'annulée')} disabled={!!isProcessing}
                  style={{ padding: '8px 14px', background: '#FEE2E2', color: RED, border: `1.5px solid ${RED}`, borderRadius: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', opacity: isProcessing ? 0.6 : 1 }}>
                  <XCircle size={14} />{isProcessing === 'annulée' ? '...' : 'Refuser'}
                </button>
                <button onClick={() => handleAction(r.id, 'confirmée')} disabled={!!isProcessing}
                  style={{ padding: '8px 14px', background: GREEN, color: 'white', border: 'none', borderRadius: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', opacity: isProcessing ? 0.6 : 1 }}>
                  <CheckCircle size={14} />{isProcessing === 'confirmée' ? '...' : 'Confirmer'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>
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
  // ✅ NEW: filtre accident
  const [filterAccident, setFilterAccident] = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [accidentModal,  setAccidentModal]  = useState(null);

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
        api.get('/reservations/'),
        api.get('/clients/'),
        api.get('/vehicles/'),
        api.get('/contracts/'),
      ]);
      setReservations(r.data);
      setClients(c.data);
      setVehicles(v.data);
      setContracts(ct.data);
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
    try {
      await api.patch(`/reservations/${id}/`, { statut: newStatut });
      await fetchAll();
    } catch (err) { console.error(err); }
  };

  const getClient   = id => clients.find(c => c.id === id);
  const getVehicle  = id => vehicles.find(v => v.id === id);
  const getContract = id => contracts.find(c => c.reservation === id);

  // ✅ Filtre avec accident
  const filtered = reservations
    .filter(r => {
      const cl = getClient(r.client);
      const ve = getVehicle(r.vehicle);
      const str = `${cl?.nom} ${cl?.prenom} ${cl?.cin} ${ve?.marque} ${ve?.modele} ${ve?.immatriculation}`.toLowerCase();
      const matchSearch   = str.includes(search.toLowerCase());
      const matchStatut   = filterStatut ? r.statut === filterStatut : true;
      const matchAccident = filterAccident ? r.a_accident === true : true;
      return matchSearch && matchStatut && matchAccident;
    })
    .sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut));

  const totalRestant  = Object.values(soldes).reduce((s, x) => s + Math.max(0, x.montant_restant || 0), 0);
  const totalEncaisse = Object.values(soldes).reduce((s, x) => s + (x.total_paye || 0), 0);
  const nbSoldes      = Object.values(soldes).filter(x => x.montant_restant <= 0).length;
  const nbAccidents   = reservations.filter(r => r.a_accident).length;
  const totalPages    = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated     = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = v => { setSearch(v); setCurrentPage(1); };
  const handleFilter = v => { setFilterStatut(v); setCurrentPage(1); };

  const handleConfirmReplacement = async (newVehicle, newDateFin, reservation, client) => {
    try {
      const days     = Math.max(1, Math.round((new Date(newDateFin) - new Date(reservation.date_debut)) / 86400000));
      const newTotal = (days * parseFloat(newVehicle.prix_journalier)).toFixed(2);
      const oldVeh   = getVehicle(reservation.vehicle);

      await api.patch(`/reservations/${reservation.id}/`, {
        vehicle:             newVehicle.id,
        date_fin:            newDateFin,
        vehicule_remplace:   reservation.vehicle,
        raison_remplacement: 'Accident — véhicule indisponible',
        montant_total:       newTotal,
      });

      if (client?.email) {
        try {
          await api.post('/vehicles/send-replacement-email/', {
            client_email:     client.email,
            client_nom:       client.nom,
            client_prenom:    client.prenom,
            ancien_vehicule:  `${oldVeh?.marque} ${oldVeh?.modele} (${oldVeh?.immatriculation})`,
            nouveau_vehicule: `${newVehicle.marque} ${newVehicle.modele} (${newVehicle.immatriculation})`,
            date_debut:       reservation.date_debut,
            date_fin:         newDateFin,
            reservation_id:   reservation.id,
            nouveau_total:    newTotal,
          });
        } catch (emailErr) {
          console.warn('Email non envoyé:', emailErr);
        }
      }

      await fetchAll();
      setAccidentModal(null);
    } catch (e) {
      alert('Erreur: ' + JSON.stringify(e.response?.data));
    }
  };

  return (
    <div>
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

      {/* ── Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total réservations', value: reservations.length,                color: NAVY,   bg: '#EFF4FB', icon: <List size={18} /> },
          { label: 'Total encaissé',     value: `${totalEncaisse.toFixed(2)} DT`,   color: GREEN,  bg: '#DCFCE7', icon: <Banknote size={18} /> },
          { label: 'Total restant',      value: `${totalRestant.toFixed(2)} DT`,    color: RED,    bg: '#FEE2E2', icon: <Clock size={18} /> },
          { label: 'Soldées',            value: `${nbSoldes}/${reservations.length}`,color: PURPLE, bg: '#F3EEFF', icon: <CheckCircle size={18} /> },
          // ✅ NEW: stat accidents
          { label: 'Accidents',          value: nbAccidents,                         color: RED,    bg: '#FEE2E2', icon: <AlertTriangle size={18} /> },
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

      <MobileNotifPanel
        pendingReservations={reservations.filter(r => r.statut === 'en_attente')}
        clients={clients}
        vehicles={vehicles}
        onAction={handleReservationAction}
      />

      {/* ── Search + Filters */}
      <div className="card" style={{ marginBottom: '16px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Rechercher par client, CIN, véhicule..." style={{ paddingLeft: '32px' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <SlidersHorizontal size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <select value={filterStatut} onChange={e => handleFilter(e.target.value)} style={{ paddingLeft: '30px', minWidth: '160px' }}>
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirmée">Confirmée</option>
              <option value="terminée">Terminée</option>
              <option value="annulée">Annulée</option>
            </select>
          </div>
          {/* ✅ NEW: Bouton filtre accident */}
          <button
            onClick={() => { setFilterAccident(!filterAccident); setCurrentPage(1); }}
            style={{
              padding: '8px 14px',
              background: filterAccident ? '#FEE2E2' : 'white',
              color: filterAccident ? RED : '#64748B',
              border: `1.5px solid ${filterAccident ? RED : '#DDE3ED'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
            <AlertTriangle size={14} />
            {filterAccident ? `⚠️ Accidents (${nbAccidents})` : 'Avec accident'}
          </button>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
            <strong style={{ color: '#1A2535' }}>{filtered.length}</strong> résultat(s)
          </div>
        </div>
      </div>

      {/* ── List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {paginated.map(r => {
          const client   = getClient(r.client);
          const vehicle  = getVehicle(r.vehicle);
          const contract = getContract(r.id);
          const solde    = soldes[r.id];
          const days     = Math.max(1, Math.round((new Date(r.date_fin) - new Date(r.date_debut)) / 86400000));
          const statut   = statutConfig[r.statut] || { bg: '#F1F5F9', color: '#64748B', label: r.statut, icon: null };
          const isSolde  = solde && solde.montant_restant <= 0;

          // ✅ FIX: bouton remplacement seulement si résa future ET non soldée
          const today = new Date(); today.setHours(0,0,0,0);
          const isReservationFuture = new Date(r.date_debut) >= today;
          const hasAccidentNoReplacement = r.a_accident && !r.vehicule_remplace && isReservationFuture && !isSolde;

          return (
            <div key={r.id} style={{ background: 'white', borderRadius: '14px', overflow: 'hidden',
              border: `1.5px solid ${isSolde ? '#86EFAC' : r.a_accident ? '#FECACA' : '#DDE3ED'}`,
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>

              <div style={{ padding: '12px 20px', borderBottom: '1px solid #F0F2F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
                background: isSolde ? '#F0FFF4' : r.statut === 'confirmée' ? '#EFF4FB' : r.statut === 'annulée' ? '#FFF5F5' : '#FFFBEB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ color: NAVY, fontSize: '15px' }}>Rés. #{r.id}</strong>
                  {contract && <span style={{ color: PURPLE, fontWeight: '700', fontSize: '12.5px', background: '#F3EEFF', padding: '2px 8px', borderRadius: '6px' }}>{contract.numero}</span>}
                  <span style={{ background: statut.bg, color: statut.color, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {statut.icon} {statut.label}
                  </span>
                  {r.a_accident && <span style={{ background: '#FEE2E2', color: RED, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> Accident</span>}
                  {r.vehicule_remplace && <span style={{ background: '#DCFCE7', color: GREEN, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Véhicule remplacé</span>}
                  {isSolde && <span style={{ background: '#DCFCE7', color: GREEN, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Soldé</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                <div style={{ padding: '16px 20px', borderRight: '1px solid #F0F2F5' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: NAVY, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><User size={12} /> Client</div>
                  {client ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF4FB', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                          {client.prenom?.charAt(0)}{client.nom?.charAt(0)}
                        </div>
                        <div style={{ fontWeight: '800', fontSize: '15px', color: '#1A2535' }}>{client.prenom} {client.nom}</div>
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

                <div style={{ padding: '16px 20px', borderRight: '1px solid #F0F2F5' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: GREEN, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><Car size={12} /> Véhicule</div>
                  {vehicle ? (
                    <>
                      <div style={{ borderRadius: '8px', overflow: 'hidden', height: '70px', marginBottom: '8px' }}>
                        <img src={getCarPhoto(vehicle)} alt={vehicle.marque} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = CAR_PHOTOS.default; }} />
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '6px', color: '#1A2535' }}>{vehicle.marque} {vehicle.modele}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ background: '#EFF4FB', padding: '1px 7px', borderRadius: '4px', color: NAVY, fontWeight: '700', fontSize: '11px' }}>{vehicle.immatriculation}</span>
                          {vehicle.couleur && <span style={{ fontSize: '12px', color: '#64748B' }}>{vehicle.couleur}</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: GREEN, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><Banknote size={12} /> {vehicle.prix_journalier} DT/jour</div>
                        <div style={{ fontSize: '12px', color: PURPLE, fontWeight: '600' }}>{days}j × {vehicle.prix_journalier} = {(parseFloat(vehicle.prix_journalier) * days).toFixed(2)} DT</div>
                      </div>
                    </>
                  ) : <span style={{ color: '#94A3B8', fontSize: '13px' }}>—</span>}
                </div>

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
          reservation={accidentModal.reservation}
          client={accidentModal.client}
          vehicle={accidentModal.vehicle}
          vehicles={vehicles}
          onClose={() => setAccidentModal(null)}
          onConfirm={handleConfirmReplacement}
        />
      )}
    </div>
  );
};

export default ReservationsList;