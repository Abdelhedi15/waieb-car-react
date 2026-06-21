import { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Eye, Pencil, Search,
  Banknote, Clock, CheckCircle, SlidersHorizontal,
  Building2, User, Hash, Calendar, ArrowRight,
  Wallet, Smartphone, FileCheck, Shuffle, Bell, ShieldCheck,
} from 'lucide-react';
import api from '../api/axios';
import Pagination from '../components/Pagination';

const NAVY   = '#1B3A6B';
const AMBER  = '#E8A020';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM = {
  reservation: '', montant: '', montant_especes: '0',
  montant_virement: '0', banque_virement: '',
  date_paiement: '', mode_paiement: 'espèces', statut: 'en_attente',
  num_compte: '', agence_banque: '', num_caisse: '',
  nom_verseur: '', ref_operation: '', date_operation: '',
  piece_identite_verseur: '', num_carte: '',
};

const MODES = [
  { value: 'espèces',  label: 'Espèces',  icon: <Wallet size={15} />,     color: GREEN,  bg: '#DCFCE7', border: '#86EFAC' },
  { value: 'chèque',   label: 'Chèque',   icon: <FileCheck size={15} />,  color: NAVY,   bg: '#EFF4FB', border: '#BFDBFE' },
  { value: 'virement', label: 'Virement', icon: <Building2 size={15} />,  color: AMBER,  bg: '#FEF3DC', border: '#FCD34D' },
  { value: 'carte',    label: 'Carte',    icon: <Smartphone size={15} />, color: PURPLE, bg: '#F3EEFF', border: '#C4B5FD' },
  { value: 'mixte',    label: 'Mixte',    icon: <Shuffle size={15} />,    color: RED,    bg: '#FEE2E2', border: '#FECACA' },
];

// ── Algorithme de Luhn (validation carte bancaire) ──────────────────
const luhnCheck = (num) => {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (isEven) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

const formatCardNum = (val) =>
  val.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();

const Payments = () => {
  const [payments,        setPayments]        = useState([]);
  const [reservations,    setReservations]    = useState([]);
  const [clients,         setClients]         = useState([]);
  const [contracts,       setContracts]       = useState([]);
  const [showModal,       setShowModal]       = useState(false);
  const [showDetail,      setShowDetail]      = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editingPayment,  setEditingPayment]  = useState(null);
  const [form,            setForm]            = useState(EMPTY_FORM);
  const [loading,         setLoading]         = useState(false);
  const [search,          setSearch]          = useState('');
  const [filterStatut,    setFilterStatut]    = useState('');
  const [soldeInfo,       setSoldeInfo]       = useState(null);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [luhnValid,       setLuhnValid]       = useState(null);   // null | true | false
  const [alerteJ1Loading, setAlerteJ1Loading] = useState(false);
  const [alerteJ1Result,  setAlerteJ1Result]  = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [p, r, c, ct] = await Promise.all([
        api.get('/payments/'),
        api.get('/reservations/'),
        api.get('/clients/'),
        api.get('/contracts/'),
      ]);
      setPayments(p.data);
      setReservations(r.data);
      setClients(c.data);
      setContracts(ct.data);
    } catch (err) { console.error(err); }
  };

  // ── Alerte J-1 ──────────────────────────────────────────────────────
  const lancerAlerteJ1 = async () => {
    setAlerteJ1Loading(true);
    setAlerteJ1Result(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/reservations/check-payments/`,
        { method: 'GET' }
      );
      const data = await res.json();
      setAlerteJ1Result(data);
    } catch (err) {
      setAlerteJ1Result({ error: 'Erreur connexion: ' + err.message });
    } finally {
      setAlerteJ1Loading(false);
    }
  };

  const getClientFromRes = (resId) => {
    const r = reservations.find(r => r.id === parseInt(resId));
    return r ? clients.find(c => c.id === r.client) : null;
  };
  const getContractFromRes = (resId) =>
    contracts.find(ct => ct.reservation === parseInt(resId));

  const openAdd = () => {
    setEditingPayment(null);
    setForm({ ...EMPTY_FORM, date_paiement: new Date().toISOString().split('T')[0] });
    setSoldeInfo(null);
    setLuhnValid(null);
    setShowModal(true);
  };
  const openEdit = (p) => {
    setEditingPayment(p);
    setForm({
      reservation: p.reservation, montant: p.montant,
      montant_especes: p.montant_especes || '0',
      montant_virement: p.montant_virement || '0',
      banque_virement: p.banque_virement || '',
      date_paiement: p.date_paiement,
      mode_paiement: p.mode_paiement || 'espèces',
      statut: p.statut,
      num_compte: p.num_compte || '',
      agence_banque: p.agence_banque || '',
      num_caisse: p.num_caisse || '',
      nom_verseur: p.nom_verseur || '',
      ref_operation: p.ref_operation || '',
      date_operation: p.date_operation || '',
      piece_identite_verseur: p.piece_identite_verseur || '',
      num_carte: '',
    });
    setSoldeInfo(null);
    setLuhnValid(null);
    setShowModal(true);
  };

  const handleResChange = async (id) => {
    setForm(f => ({ ...f, reservation: id }));
    if (id) {
      try {
        const s = await api.get(`/payments/solde/${id}/`);
        setSoldeInfo(s.data);
      } catch { setSoldeInfo(null); }
    } else { setSoldeInfo(null); }
  };

  const handleCardNum = (val) => {
    const formatted = formatCardNum(val);
    setForm(f => ({ ...f, num_carte: formatted }));
    const digits = val.replace(/\D/g, '');
    if (digits.length >= 13) setLuhnValid(luhnCheck(digits));
    else setLuhnValid(null);
  };

  const getTotal = (f = form) => {
    const m = f.mode_paiement;
    if (['espèces', 'carte', 'chèque'].includes(m)) return parseFloat(f.montant_especes) || 0;
    if (m === 'virement') return parseFloat(f.montant_virement) || 0;
    if (m === 'mixte')
      return (parseFloat(f.montant_especes) || 0) + (parseFloat(f.montant_virement) || 0);
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation Luhn pour carte
    if (form.mode_paiement === 'carte' && form.num_carte) {
      if (!luhnCheck(form.num_carte.replace(/\s/g, ''))) {
        alert('❌ Numéro de carte invalide (échec validation Luhn)');
        return;
      }
    }
    setLoading(true);
    try {
      const total = getTotal();
      let autoStatut = form.statut;
      if (soldeInfo && total > 0) {
        const current   = editingPayment ? parseFloat(editingPayment.montant) : 0;
        const available = soldeInfo.montant_restant + current;
        if (total > available) {
          alert(`❌ Montant dépasse le restant!\nMaximum autorisé: ${available.toFixed(2)} DT`);
          setLoading(false); return;
        }
        if (available - total <= 0) autoStatut = 'payé';
      }
      const data = {
        ...form,
        montant: total > 0 ? total : form.montant,
        statut: autoStatut,
        num_carte: undefined, // on n'enregistre PAS le numéro de carte (sécurité)
      };
      if (editingPayment) await api.put(`/payments/${editingPayment.id}/`, data);
      else await api.post('/payments/', data);
      fetchAll();
      setShowModal(false);
    } catch (err) {
      alert('Erreur: ' + JSON.stringify(err.response?.data));
    } finally { setLoading(false); }
  };

  const getResLabel = (id) => {
    const r = reservations.find(r => r.id === id);
    if (!r) return '—';
    const c = clients.find(c => c.id === r.client);
    return c ? `#${id} — ${c.prenom} ${c.nom}` : `#${id}`;
  };

  const totalPaye    = payments.filter(p => p.statut === 'payé').reduce((s, p) => s + parseFloat(p.montant), 0);
  const totalAttente = payments.filter(p => p.statut === 'en_attente').reduce((s, p) => s + parseFloat(p.montant), 0);

  const filtered = payments.filter(p => {
    const info = getResLabel(p.reservation).toLowerCase();
    return info.includes(search.toLowerCase()) && (filterStatut ? p.statut === filterStatut : true);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = v => { setSearch(v);       setCurrentPage(1); };
  const handleFilter = v => { setFilterStatut(v); setCurrentPage(1); };

  const currentTotal = getTotal();
  const selectedMode = MODES.find(m => m.value === form.mode_paiement);
  const restantApres = soldeInfo ? Math.max(0, soldeInfo.montant_restant - currentTotal) : null;
  const willBeSolde  = restantApres !== null && restantApres <= 0;

  const statutBadge = (s) => {
    const map = {
      payé:       { color: GREEN,  bg: '#DCFCE7', label: 'Payé' },
      en_attente: { color: AMBER,  bg: '#FEF3DC', label: 'En attente' },
      remboursé:  { color: NAVY,   bg: '#EFF4FB', label: 'Remboursé' },
    };
    const cfg = map[s] || { color: '#64748B', bg: '#F1F5F9', label: s };
    return (
      <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px',
        borderRadius: '10px', fontSize: '11.5px', fontWeight: '700' }}>
        {cfg.label}
      </span>
    );
  };

  const VirementForm = ({ isMixte = false }) => (
    <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D',
      borderRadius: '12px', padding: '16px', marginTop: isMixte ? '12px' : '0' }}>
      <div style={{ fontWeight: '800', color: '#92580A', fontSize: '13.5px',
        marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Building2 size={15} /> Virement Bancaire — Détails
      </div>
      <div style={{ background: 'white', borderRadius: '8px', padding: '12px',
        marginBottom: '10px', border: '1px solid #DDE3ED' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#94A3B8',
          marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.6px',
          display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Building2 size={11} /> Informations Agence
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Banque *',      field: 'banque_virement', placeholder: 'ex: BIAT, STB, BNA...' },
            { label: 'Agence',        field: 'agence_banque',   placeholder: 'ex: Agence Sakiet Ezzit' },
            { label: 'N° Caisse',     field: 'num_caisse',      placeholder: 'ex: 1152' },
            { label: 'N° Compte bénéficiaire', field: 'num_compte', placeholder: 'ex: C520034418/TND' },
          ].map(f => (
            <div key={f.field}>
              <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600',
                display: 'block', marginBottom: '4px' }}>{f.label}</label>
              <input value={form[f.field]}
                onChange={e => setForm(x => ({ ...x, [f.field]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ border: '1px solid #FCD34D', fontSize: '13px' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '8px', padding: '12px',
        marginBottom: '10px', border: '1px solid #DDE3ED' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#94A3B8',
          marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.6px',
          display: 'flex', alignItems: 'center', gap: '5px' }}>
          <User size={11} /> Informations Verseur
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600',
              display: 'block', marginBottom: '4px' }}>Nom du verseur</label>
            <input value={form.nom_verseur}
              onChange={e => setForm(x => ({ ...x, nom_verseur: e.target.value }))}
              placeholder="ex: Mme NEIFAR..."
              style={{ border: '1px solid #FCD34D', fontSize: '13px' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600',
              display: 'block', marginBottom: '4px' }}>Pièce d'identité</label>
            <input value={form.piece_identite_verseur}
              onChange={e => setForm(x => ({ ...x, piece_identite_verseur: e.target.value }))}
              placeholder="CIN / Passeport"
              style={{ border: '1px solid #FCD34D', fontSize: '13px' }} />
          </div>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '8px', padding: '12px',
        border: '1px solid #DDE3ED' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#94A3B8',
          marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.6px',
          display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Banknote size={11} /> Détails Versement
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: AMBER, fontWeight: '700',
              display: 'block', marginBottom: '4px' }}>Montant (DT) *</label>
            <input type="text" inputMode="decimal"
              value={form.montant_virement === '0' ? '' : form.montant_virement}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9.]/g, '');
                setForm(f => ({ ...f, montant_virement: v || '0' }));
              }}
              placeholder="ex: 1000.000"
              style={{ border: `2px solid ${AMBER}`, fontSize: '14px', fontWeight: '700' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600',
              display: 'block', marginBottom: '4px' }}>Date opération</label>
            <input type="date" value={form.date_operation}
              onChange={e => setForm(f => ({ ...f, date_operation: e.target.value }))}
              style={{ border: '1px solid #FCD34D', fontSize: '13px' }} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '600',
              display: 'block', marginBottom: '4px' }}>Libellé / Référence</label>
            <input value={form.ref_operation}
              onChange={e => setForm(f => ({ ...f, ref_operation: e.target.value }))}
              placeholder="ex: Versement TND — Location véhicule"
              style={{ border: '1px solid #FCD34D', fontSize: '13px' }} />
          </div>
        </div>
        {form.montant_virement && parseFloat(form.montant_virement) > 0 && (
          <div style={{ marginTop: '12px', background: '#FFFBEB', borderRadius: '8px',
            padding: '12px', fontFamily: 'monospace', fontSize: '11.5px',
            borderLeft: `3px solid ${AMBER}`, lineHeight: 1.8 }}>
            <div style={{ fontWeight: '700', color: AMBER, marginBottom: '6px',
              fontFamily: 'sans-serif', fontSize: '11px', textTransform: 'uppercase' }}>
              Aperçu reçu
            </div>
            {form.banque_virement && <div>Banque : {form.banque_virement}</div>}
            {form.agence_banque   && <div>Agence : {form.agence_banque}</div>}
            {form.num_caisse      && <div>N° Caisse : {form.num_caisse}</div>}
            {form.num_compte      && <div>N° Compte : {form.num_compte}</div>}
            {form.nom_verseur     && <div>Verseur : {form.nom_verseur}</div>}
            <div style={{ borderTop: `1px dashed ${AMBER}`, marginTop: '6px', paddingTop: '6px' }}>
              <div>Devise : TND</div>
              <div>Montant : <strong>{parseFloat(form.montant_virement).toFixed(3)} TND</strong></div>
              {form.ref_operation  && <div>Libellé : {form.ref_operation}</div>}
              {form.date_operation && <div>Date op. : {form.date_operation}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Title + boutons ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex',
          alignItems: 'center', gap: '10px' }}>
          <CreditCard size={22} color={NAVY} /> Gestion des Paiements
        </h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* ── Bouton Alerte J-1 ── */}
          <button
            onClick={lancerAlerteJ1}
            disabled={alerteJ1Loading}
            style={{ display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', background: alerteJ1Loading ? '#94A3B8' : AMBER,
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: alerteJ1Loading ? 'not-allowed' : 'pointer',
              fontWeight: '700', fontSize: '13px', boxShadow: '0 2px 8px #E8A02040' }}>
            <Bell size={15} />
            {alerteJ1Loading ? 'Envoi...' : 'Alertes J-1'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Plus size={16} /> Nouveau paiement
          </button>
        </div>
      </div>

      {/* ── Résultat Alerte J-1 ─────────────────────────────────────── */}
      {alerteJ1Result && (
        <div style={{ marginBottom: '16px', padding: '14px 18px',
          background: alerteJ1Result.error ? '#FEE2E2' : '#DCFCE7',
          border: `1.5px solid ${alerteJ1Result.error ? '#FECACA' : '#86EFAC'}`,
          borderRadius: '10px', display: 'flex', alignItems: 'flex-start',
          gap: '12px', position: 'relative' }}>
          <Bell size={18} color={alerteJ1Result.error ? RED : GREEN} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            {alerteJ1Result.error ? (
              <div style={{ color: RED, fontWeight: '700' }}>{alerteJ1Result.error}</div>
            ) : (
              <>
                <div style={{ color: GREEN, fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>
                  ✅ Alertes J-1 exécutées — {alerteJ1Result.date}
                </div>
                <div style={{ color: '#166534', fontSize: '13px' }}>
                  📧 <strong>{alerteJ1Result.emails_j1}</strong> email(s) de rappel envoyé(s)
                  &nbsp;·&nbsp;
                  🔄 <strong>{alerteJ1Result.annulations}</strong> réservation(s) auto-annulée(s)
                </div>
                {alerteJ1Result.details?.emails_j1?.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#166534' }}>
                    {alerteJ1Result.details.emails_j1.map(e => (
                      <span key={e.reservation} style={{ background: '#BBF7D0',
                        padding: '2px 8px', borderRadius: '6px', marginRight: '6px' }}>
                        Rés. #{e.reservation} — {e.montant_restant} DT
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <button onClick={() => setAlerteJ1Result(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: '#94A3B8', fontSize: '16px', padding: '0 4px' }}>✕</button>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total paiements', value: payments.length,         suffix: '',    color: NAVY,  bg: '#EFF4FB', icon: <CreditCard size={18} /> },
          { label: 'Total encaissé',  value: totalPaye.toFixed(2),    suffix: ' DT', color: GREEN, bg: '#DCFCE7', icon: <CheckCircle size={18} /> },
          { label: 'En attente',      value: totalAttente.toFixed(2), suffix: ' DT', color: AMBER, bg: '#FEF3DC', icon: <Clock size={18} /> },
        ].map(s => (
          <div key={s.label} className="card"
            style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px',
              background: s.bg, color: s.color, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: s.color, lineHeight: 1 }}>
                {s.value}{s.suffix}
              </div>
              <div style={{ color: '#64748B', fontSize: '12px', marginTop: '3px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F2F5',
          display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px',
              top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher par client, réservation..."
              style={{ paddingLeft: '32px' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <SlidersHorizontal size={13} color="#94A3B8" style={{ position: 'absolute',
              left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <select value={filterStatut} onChange={e => handleFilter(e.target.value)}
              style={{ paddingLeft: '30px', minWidth: '150px' }}>
              <option value="">Tous les statuts</option>
              <option value="payé">Payé</option>
              <option value="en_attente">En attente</option>
              <option value="remboursé">Remboursé</option>
            </select>
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748B' }}>
            <strong style={{ color: '#1A2535' }}>{filtered.length}</strong> paiement(s)
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ paddingLeft: '20px' }}>N° Paiement</th>
              <th>N° Contrat</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Mode</th>
              <th>Date</th>
              <th>Statut</th>
              <th style={{ paddingRight: '20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                <CreditCard size={36} color="#DDE3ED"
                  style={{ marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
                Aucun paiement trouvé
              </td></tr>
            ) : paginated.map(p => {
              const client   = getClientFromRes(p.reservation);
              const contract = getContractFromRes(p.reservation);
              const mode     = MODES.find(m => m.value === p.mode_paiement);
              return (
                <tr key={p.id}>
                  <td style={{ paddingLeft: '20px' }}>
                    <strong style={{ color: RED, fontFamily: 'monospace' }}>
                      P{String(p.id).padStart(4,'0')}
                    </strong>
                  </td>
                  <td>
                    {contract
                      ? <span style={{ color: PURPLE, fontWeight: '700', background: '#F3EEFF',
                          padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>
                          {contract.numero}
                        </span>
                      : <span style={{ color: '#94A3B8' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {client && (
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%',
                          background: '#EFF4FB', color: NAVY, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontWeight: '800', fontSize: '11px', flexShrink: 0 }}>
                          {client.prenom?.charAt(0)}{client.nom?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>
                          {client ? `${client.prenom} ${client.nom}` : '—'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                          Rés. #{p.reservation}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><strong style={{ color: GREEN, fontSize: '14px' }}>{p.montant} DT</strong></td>
                  <td>
                    {mode
                      ? <span style={{ background: mode.bg, color: mode.color,
                          padding: '3px 10px', borderRadius: '8px', fontSize: '12px',
                          fontWeight: '700', border: `1px solid ${mode.border}`,
                          display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          {mode.icon} {mode.label}
                        </span>
                      : <span style={{ color: '#94A3B8' }}>{p.mode_paiement || '—'}</span>}
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748B',
                    display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {p.date_paiement}
                  </td>
                  <td>{statutBadge(p.statut)}</td>
                  <td style={{ paddingRight: '20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setSelectedPayment(p); setShowDetail(true); }}
                        style={{ padding: '6px 10px', background: '#EFF4FB', color: NAVY,
                          border: '1px solid #DDE3ED', borderRadius: '7px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontSize: '12px', fontWeight: '600' }}>
                        <Eye size={13} />
                      </button>
                      <button onClick={() => openEdit(p)}
                        style={{ padding: '6px 10px', background: NAVY, color: 'white',
                          border: 'none', borderRadius: '7px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontSize: '12px', fontWeight: '600' }}>
                        <Pencil size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ padding: '0 20px 16px' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages}
            onPageChange={setCurrentPage} totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────── */}
      {showDetail && selectedPayment && (() => {
        const client   = getClientFromRes(selectedPayment.reservation);
        const contract = getContractFromRes(selectedPayment.reservation);
        const mode     = MODES.find(m => m.value === selectedPayment.mode_paiement);
        const isVir    = ['virement','mixte'].includes(selectedPayment.mode_paiement);
        return (
          <div className="modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <h2 style={{ color: NAVY, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} /> P{String(selectedPayment.id).padStart(4,'0')}
              </h2>
              {mode && (
                <div style={{ background: mode.bg, border: `1.5px solid ${mode.border}`,
                  borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  color: mode.color, fontWeight: '700', fontSize: '14px' }}>
                  {mode.icon} {mode.label}
                </div>
              )}
              <div style={{ background: '#F8FAFC', borderRadius: '10px',
                padding: '14px', marginBottom: '14px' }}>
                {[
                  { label: 'N° Contrat',     value: contract?.numero || '—', color: PURPLE },
                  { label: 'Client',         value: client ? `${client.prenom} ${client.nom}` : '—' },
                  { label: 'CIN',            value: client?.cin || '—', mono: true },
                  { label: 'Date paiement',  value: selectedPayment.date_paiement },
                  { label: 'Montant',        value: `${selectedPayment.montant} DT`, color: GREEN },
                  { label: 'Statut',         value: selectedPayment.statut },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid #F0F2F5', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>{row.label}</span>
                    <strong style={{ color: row.color || '#1A2535',
                      fontFamily: row.mono ? 'monospace' : 'inherit' }}>
                      {row.value}
                    </strong>
                  </div>
                ))}
              </div>
              {isVir && (selectedPayment.banque_virement || selectedPayment.nom_verseur) && (
                <div style={{ background: '#FFFBEB', borderRadius: '10px',
                  padding: '14px', border: `1px solid #FCD34D` }}>
                  <div style={{ fontWeight: '800', color: '#92580A', marginBottom: '10px',
                    fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} /> Reçu Virement Bancaire
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px',
                    lineHeight: 1.9, color: '#1A2535' }}>
                    {selectedPayment.banque_virement && <div>Banque : <strong>{selectedPayment.banque_virement}</strong></div>}
                    {selectedPayment.agence_banque   && <div>Agence : {selectedPayment.agence_banque}</div>}
                    {selectedPayment.num_caisse      && <div>N° Caisse : {selectedPayment.num_caisse}</div>}
                    {selectedPayment.num_compte      && <div>N° Compte : {selectedPayment.num_compte}</div>}
                    {selectedPayment.nom_verseur     && <div>Verseur : {selectedPayment.nom_verseur}</div>}
                    {selectedPayment.piece_identite_verseur && <div>Pièce identité : {selectedPayment.piece_identite_verseur}</div>}
                    <div style={{ borderTop: `1px dashed ${AMBER}`, marginTop: '8px', paddingTop: '8px' }}>
                      <div>Devise : TND</div>
                      <div>Montant : <strong>{parseFloat(selectedPayment.montant_virement || selectedPayment.montant).toFixed(3)} TND</strong></div>
                      {selectedPayment.ref_operation  && <div>Libellé : {selectedPayment.ref_operation}</div>}
                      {selectedPayment.date_operation && <div>Date op. : {selectedPayment.date_operation}</div>}
                    </div>
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowDetail(false)}>Fermer</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add/Edit Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              {editingPayment
                ? <><Pencil size={17} /> Modifier le Paiement</>
                : <><Plus size={17} /> Nouveau Paiement</>}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Réservation */}
              <div className="form-group">
                <label>Réservation *</label>
                <select value={form.reservation}
                  onChange={e => handleResChange(e.target.value)} required>
                  <option value="">Sélectionner une réservation</option>
                  {reservations.map(r => (
                    <option key={r.id} value={r.id}>
                      {getResLabel(r.id)} — {r.date_debut} → {r.date_fin}
                    </option>
                  ))}
                </select>
              </div>

              {/* Solde info */}
              {soldeInfo && (
                <div style={{ marginBottom: '16px' }}>
                  {/* Explication visuelle du processus */}
                  <div style={{ background: '#EFF4FB', borderRadius: '10px',
                    padding: '12px 14px', marginBottom: '10px',
                    border: '1px solid #BFDBFE', fontSize: '12.5px', color: '#1B3A6B' }}>
                    <strong>ℹ️ Processus de paiement :</strong><br/>
                    L'acompte ({soldeInfo.acompte} DT) a été payé à la réservation.
                    Ce paiement concerne le <strong>montant restant</strong> ({soldeInfo.montant_restant} DT).
                    Un email de rappel est envoyé automatiquement la veille du retour.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                    gap: '8px', marginBottom: '8px' }}>
                    {[
                      { label: 'Total',   value: `${soldeInfo.montant_total} DT`, color: NAVY,  bg: '#EFF4FB' },
                      { label: 'Acompte payé', value: `${soldeInfo.acompte} DT`, color: AMBER, bg: '#FEF3DC' },
                      { label: 'Restant à payer',
                        value: soldeInfo.montant_restant > 0
                          ? `${soldeInfo.montant_restant} DT` : '✅ Soldé',
                        color: soldeInfo.montant_restant > 0 ? RED : GREEN,
                        bg: soldeInfo.montant_restant > 0 ? '#FEF9C3' : '#DCFCE7',
                        border: soldeInfo.montant_restant > 0 ? AMBER : GREEN },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, borderRadius: '8px',
                        padding: '10px', textAlign: 'center',
                        border: s.border ? `1.5px solid ${s.border}` : 'none' }}>
                        <div style={{ fontSize: '10.5px', color: '#64748B',
                          fontWeight: '600', marginBottom: '3px' }}>{s.label}</div>
                        <div style={{ fontWeight: '800', color: s.color, fontSize: '14px' }}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#F0F2F5', borderRadius: '4px',
                    height: '7px', overflow: 'hidden' }}>
                    <div style={{
                      background: soldeInfo.montant_restant <= 0 ? GREEN : NAVY,
                      height: '100%',
                      width: `${Math.min(100, soldeInfo.montant_total > 0
                        ? (soldeInfo.total_paye / soldeInfo.montant_total) * 100 : 0)}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8',
                    textAlign: 'right', marginTop: '3px' }}>
                    {soldeInfo.montant_total > 0
                      ? ((soldeInfo.total_paye / soldeInfo.montant_total) * 100).toFixed(0)
                      : 0}% payé
                  </div>
                </div>
              )}

              {/* Mode buttons */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                  display: 'block', marginBottom: '8px' }}>Mode de paiement</label>
                <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                  {MODES.map(m => {
                    const active = form.mode_paiement === m.value;
                    return (
                      <button key={m.value} type="button"
                        onClick={() => setForm(f => ({
                          ...f, mode_paiement: m.value,
                          montant_especes: '0', montant_virement: '0',
                          banque_virement: '', num_compte: '', agence_banque: '',
                          num_caisse: '', nom_verseur: '', ref_operation: '',
                          date_operation: '', piece_identite_verseur: '', num_carte: '',
                        }))}
                        style={{ padding: '8px 14px',
                          border: `2px solid ${active ? m.color : '#DDE3ED'}`,
                          borderRadius: '8px', cursor: 'pointer', fontWeight: '700',
                          fontSize: '12.5px',
                          background: active ? m.color : 'white',
                          color: active ? 'white' : '#64748B',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          transition: 'all 0.14s',
                          boxShadow: active ? `0 3px 10px ${m.color}40` : 'none' }}>
                        {m.icon} {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Espèces */}
              {form.mode_paiement === 'espèces' && (
                <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC',
                  borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                  <label style={{ fontWeight: '700', color: '#166534', fontSize: '12.5px',
                    display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <Wallet size={14} /> Montant (DT) *
                  </label>
                  <input type="text" inputMode="decimal"
                    value={form.montant_especes === '0' ? '' : form.montant_especes}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9.]/g,'');
                      setForm(f => ({ ...f, montant_especes: v || '0' }));
                    }}
                    placeholder="ex: 150.00"
                    style={{ border: '2px solid #86EFAC' }} />
                </div>
              )}

              {/* Carte + Luhn */}
              {form.mode_paiement === 'carte' && (
                <div style={{ background: '#F3EEFF', border: '1.5px solid #C4B5FD',
                  borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontWeight: '700', color: PURPLE, fontSize: '12.5px',
                        display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <Smartphone size={14} /> Montant (DT) *
                      </label>
                      <input type="text" inputMode="decimal"
                        value={form.montant_especes === '0' ? '' : form.montant_especes}
                        onChange={e => {
                          const v = e.target.value.replace(/[^0-9.]/g,'');
                          setForm(f => ({ ...f, montant_especes: v || '0' }));
                        }}
                        placeholder="ex: 150.00"
                        style={{ border: '2px solid #C4B5FD' }} />
                    </div>
                    <div>
                      <label style={{ fontWeight: '700', color: PURPLE, fontSize: '12.5px',
                        display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <ShieldCheck size={14} /> N° Carte (Luhn)
                      </label>
                      <input type="text" inputMode="numeric"
                        value={form.num_carte}
                        onChange={e => handleCardNum(e.target.value)}
                        placeholder="**** **** **** ****"
                        maxLength={19}
                        style={{
                          border: `2px solid ${
                            luhnValid === null ? '#C4B5FD'
                            : luhnValid ? GREEN : RED
                          }`,
                          fontFamily: 'monospace', letterSpacing: '2px'
                        }} />
                      {/* Indicateur Luhn */}
                      {luhnValid !== null && (
                        <div style={{ marginTop: '5px', fontSize: '11.5px', fontWeight: '700',
                          color: luhnValid ? GREEN : RED,
                          display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {luhnValid
                            ? <><CheckCircle size={12} /> Carte valide (Luhn ✓)</>
                            : <>✕ Numéro invalide (Luhn ✗)</>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#7C3AED',
                    background: '#EDE9FE', padding: '8px 12px', borderRadius: '6px' }}>
                    🔒 Le numéro de carte n'est pas enregistré — validation Luhn uniquement
                  </div>
                </div>
              )}

              {/* Chèque */}
              {form.mode_paiement === 'chèque' && (
                <div style={{ background: '#EFF4FB', border: '1.5px solid #BFDBFE',
                  borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontWeight: '700', color: NAVY, fontSize: '12.5px',
                        display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <FileCheck size={14} /> Montant (DT) *
                      </label>
                      <input type="text" inputMode="decimal"
                        value={form.montant_especes === '0' ? '' : form.montant_especes}
                        onChange={e => {
                          const v = e.target.value.replace(/[^0-9.]/g,'');
                          setForm(f => ({ ...f, montant_especes: v || '0' }));
                        }}
                        placeholder="ex: 150.00"
                        style={{ border: '2px solid #BFDBFE' }} />
                    </div>
                    <div>
                      <label style={{ fontWeight: '700', color: NAVY, fontSize: '12.5px',
                        marginBottom: '6px', display: 'block' }}>N° Chèque / Banque</label>
                      <input value={form.banque_virement}
                        onChange={e => setForm(f => ({ ...f, banque_virement: e.target.value }))}
                        placeholder="ex: 001234 — BNA"
                        style={{ border: '2px solid #BFDBFE' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Virement */}
              {form.mode_paiement === 'virement' && (
                <div style={{ marginBottom: '14px' }}><VirementForm /></div>
              )}

              {/* Mixte */}
              {form.mode_paiement === 'mixte' && (
                <div style={{ background: '#FEE2E2', border: '1.5px solid #FECACA',
                  borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#DCFCE7', padding: '10px', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#166534', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <Wallet size={13} /> Espèces (DT)
                      </label>
                      <input type="text" inputMode="decimal"
                        value={form.montant_especes === '0' ? '' : form.montant_especes}
                        onChange={e => {
                          const v = e.target.value.replace(/[^0-9.]/g,'');
                          setForm(f => ({ ...f, montant_especes: v || '0' }));
                        }}
                        placeholder="0.00" />
                    </div>
                    <div style={{ background: '#FEF3DC', padding: '10px', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#92580A', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <Building2 size={13} /> Virement (DT)
                      </label>
                      <input type="text" inputMode="decimal"
                        value={form.montant_virement === '0' ? '' : form.montant_virement}
                        onChange={e => {
                          const v = e.target.value.replace(/[^0-9.]/g,'');
                          setForm(f => ({ ...f, montant_virement: v || '0' }));
                        }}
                        placeholder="0.00" />
                    </div>
                  </div>
                  {parseFloat(form.montant_virement) > 0 && <VirementForm isMixte />}
                </div>
              )}

              {/* Date + statut */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Date de paiement *</label>
                  <input type="date" value={form.date_paiement}
                    onChange={e => setForm(f => ({ ...f, date_paiement: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select value={form.statut}
                    onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                    <option value="en_attente">En attente</option>
                    <option value="payé">Payé</option>
                    <option value="remboursé">Remboursé</option>
                  </select>
                </div>
              </div>

              {/* Total preview */}
              {currentTotal > 0 && (
                <div style={{ background: willBeSolde ? GREEN : (selectedMode?.color || NAVY),
                  color: 'white', borderRadius: '10px', padding: '13px 16px',
                  textAlign: 'center', marginBottom: willBeSolde ? '8px' : '0' }}>
                  <span style={{ fontSize: '13px', opacity: 0.85 }}>Ce paiement: </span>
                  <strong style={{ fontSize: '21px' }}>{currentTotal.toFixed(2)} DT</strong>
                  {soldeInfo && (
                    <span style={{ fontSize: '13px', opacity: 0.85, marginLeft: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '5px', marginTop: '3px' }}>
                      Restant après <ArrowRight size={13} />
                      <strong>{restantApres?.toFixed(2)} DT</strong>
                    </span>
                  )}
                </div>
              )}
              {willBeSolde && (
                <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC',
                  borderRadius: '8px', padding: '10px', textAlign: 'center',
                  color: '#166534', fontWeight: '700', fontSize: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <CheckCircle size={15} /> Ce paiement soldra complètement la réservation !
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-outline"
                  onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : editingPayment ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;