import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import api from '../api/axios';

const EMPTY_FORM = {
  reservation: '', date_avance: '',
  montant_especes: '0', montant_cheque: '0',
  numero_cheque: '', banque_cheque: '',
  montant_cheque2: '0', numero_cheque2: '',
  banque_cheque2: '', montant_virement: '0',
  banque_virement: ''
};

const Avances = () => {
  const [avances, setAvances] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAvance, setEditingAvance] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [showCheque, setShowCheque] = useState(false);
  const [showCheque2, setShowCheque2] = useState(false);
  const [showEspeces, setShowEspeces] = useState(false);
  const [showVirement, setShowVirement] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [a, r, c, ct] = await Promise.all([
        api.get('/payments/avances/'),
        api.get('/reservations/'),
        api.get('/clients/'),
        api.get('/contracts/'),
      ]);
      setAvances(a.data);
      setReservations(r.data);
      setClients(c.data);
      setContracts(ct.data);
    } catch (err) { console.error(err); }
  };

  const openAdd = () => {
    setEditingAvance(null);
    setForm({ ...EMPTY_FORM, date_avance: new Date().toISOString().split('T')[0] });
    setShowCheque(false); setShowCheque2(false);
    setShowEspeces(false); setShowVirement(false);
    setShowModal(true);
  };

  const openEdit = (avance) => {
    setEditingAvance(avance);
    setForm({
      reservation: avance.reservation,
      date_avance: avance.date_avance,
      montant_especes: avance.montant_especes || '0',
      montant_cheque: avance.montant_cheque || '0',
      numero_cheque: avance.numero_cheque || '',
      banque_cheque: avance.banque_cheque || '',
      montant_cheque2: avance.montant_cheque2 || '0',
      numero_cheque2: avance.numero_cheque2 || '',
      banque_cheque2: avance.banque_cheque2 || '',
      montant_virement: avance.montant_virement || '0',
      banque_virement: avance.banque_virement || '',
    });
    setShowCheque(parseFloat(avance.montant_cheque) > 0);
    setShowCheque2(parseFloat(avance.montant_cheque2) > 0);
    setShowEspeces(parseFloat(avance.montant_especes) > 0);
    setShowVirement(parseFloat(avance.montant_virement) > 0);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newTotal = (parseFloat(form.montant_especes) || 0) +
                       (parseFloat(form.montant_cheque) || 0) +
                       (parseFloat(form.montant_cheque2) || 0) +
                       (parseFloat(form.montant_virement) || 0);

      // Check if avance exceeds remaining amount
      if (form.reservation) {
        const solde = await api.get(`/payments/solde/${form.reservation}/`);
        const montantRestant = solde.data.montant_restant;
        const currentAvance = editingAvance ?
          avances.find(a => a.id === editingAvance.id) : null;
        const currentTotal = currentAvance ?
          (parseFloat(currentAvance.montant_especes) || 0) +
          (parseFloat(currentAvance.montant_cheque) || 0) +
          (parseFloat(currentAvance.montant_cheque2) || 0) +
          (parseFloat(currentAvance.montant_virement) || 0) : 0;
        const available = montantRestant + currentTotal;
        if (newTotal > available) {
          alert(`❌ Montant dépasse le restant! Maximum autorisé: ${available.toFixed(2)} DT`);
          setLoading(false);
          return;
        }
      }

      if (editingAvance) {
        await api.put(`/payments/avances/${editingAvance.id}/`, form);
      } else {
        await api.post('/payments/avances/', form);
      }
      fetchAll();
      setShowModal(false);
    } catch (err) {
      alert('Erreur: ' + JSON.stringify(err.response?.data));
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette avance ?')) return;
    try {
      await api.delete(`/payments/avances/${id}/`);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const getClientFromReservation = (reservationId) => {
    const r = reservations.find(r => r.id === parseInt(reservationId));
    if (!r) return null;
    return clients.find(c => c.id === r.client);
  };

  const getContractFromReservation = (reservationId) => {
    return contracts.find(ct => ct.reservation === parseInt(reservationId));
  };

  const getMontantTotal = (a) => {
    return (parseFloat(a.montant_especes) || 0) +
           (parseFloat(a.montant_cheque) || 0) +
           (parseFloat(a.montant_cheque2) || 0) +
           (parseFloat(a.montant_virement) || 0);
  };

  return (
    <div>
      <h1 className="page-title">Gestion des Avances</h1>

      <div className="card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#805ad5' }}>{avances.length}</div>
        <div style={{ color: '#888' }}>Total avances enregistrées</div>
        <div style={{ marginLeft: 'auto', fontSize: '24px', fontWeight: '700', color: '#38a169' }}>
          {avances.reduce((sum, a) => sum + getMontantTotal(a), 0).toFixed(2)} DT
        </div>
        <div style={{ color: '#888' }}>Total encaissé</div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdAdd size={20} /> Ajouter une avance
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>N° Contrat</th>
              <th>Client</th>
              <th>Date</th>
              <th>Espèces</th>
              <th>Chèque</th>
              <th>Virement</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {avances.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Aucune avance trouvée</td></tr>
            ) : avances.map((a, i) => {
              const client = getClientFromReservation(a.reservation);
              const contract = getContractFromReservation(a.reservation);
              return (
                <tr key={a.id}>
                  <td><strong style={{ color: '#38a169' }}>V{String(a.id).padStart(4, '0')}</strong></td>
                  <td><strong style={{ color: '#805ad5' }}>{contract?.numero || '—'}</strong></td>
                  <td>{client ? `${client.prenom} ${client.nom}` : '—'}</td>
                  <td>{a.date_avance}</td>
                  <td>{parseFloat(a.montant_especes) > 0 ? `${a.montant_especes} DT` : '—'}</td>
                  <td>{parseFloat(a.montant_cheque) > 0 ? `${a.montant_cheque} DT` : '—'}</td>
                  <td>{parseFloat(a.montant_virement) > 0 ? `${a.montant_virement} DT` : '—'}</td>
                  <td><strong style={{ color: '#38a169' }}>{getMontantTotal(a).toFixed(2)} DT</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-primary" onClick={() => openEdit(a)}
                        style={{ padding: '6px 10px', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                        <MdEdit />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(a.id)}
                        style={{ padding: '6px 10px', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
            <h2>{editingAvance ? `✏️ Modifier l'Avance - V${String(editingAvance.id).padStart(4,'0')}` : '➕ Ajouter une Avance'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Réservation / Contrat *</label>
                  <select value={form.reservation} onChange={e => setForm({...form, reservation: e.target.value})} required>
                    <option value="">Sélectionner</option>
                    {reservations.map(r => {
                      const c = clients.find(c => c.id === r.client);
                      const ct = contracts.find(ct => ct.reservation === r.id);
                      return <option key={r.id} value={r.id}>
                        {ct ? ct.numero : `Rés. #${r.id}`} — {c ? `${c.prenom} ${c.nom}` : ''}
                      </option>;
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={form.date_avance} onChange={e => setForm({...form, date_avance: e.target.value})} required />
                </div>
              </div>

              {/* Payment method buttons */}
              <div style={{ margin: '16px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowEspeces(!showEspeces)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: `2px solid ${showEspeces ? '#38a169' : '#e2e8f0'}`, background: showEspeces ? '#f0fff4' : 'white', cursor: 'pointer', fontWeight: '600', color: showEspeces ? '#38a169' : '#666' }}>
                  💵 {showEspeces ? '✓' : '+'} Espèce
                </button>
                <button type="button" onClick={() => setShowCheque(!showCheque)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: `2px solid ${showCheque ? '#1a56db' : '#e2e8f0'}`, background: showCheque ? '#ebf4ff' : 'white', cursor: 'pointer', fontWeight: '600', color: showCheque ? '#1a56db' : '#666' }}>
                  📄 {showCheque ? '✓' : '+'} Chèque
                </button>
                <button type="button" onClick={() => setShowCheque2(!showCheque2)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: `2px solid ${showCheque2 ? '#805ad5' : '#e2e8f0'}`, background: showCheque2 ? '#faf5ff' : 'white', cursor: 'pointer', fontWeight: '600', color: showCheque2 ? '#805ad5' : '#666' }}>
                  📄 {showCheque2 ? '✓' : '+'} Chèque 2
                </button>
                <button type="button" onClick={() => setShowVirement(!showVirement)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: `2px solid ${showVirement ? '#d69e2e' : '#e2e8f0'}`, background: showVirement ? '#fffff0' : 'white', cursor: 'pointer', fontWeight: '600', color: showVirement ? '#d69e2e' : '#666' }}>
                  🏦 {showVirement ? '✓' : '+'} Virement
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {showEspeces && (
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: '#f0fff4', padding: '16px', borderRadius: '8px', border: '1px solid #9ae6b4' }}>
                    <label>💵 Montant Espèces (DT)</label>
                    <input type="number" value={form.montant_especes} onChange={e => setForm({...form, montant_especes: e.target.value})} min="0" step="0.01" />
                  </div>
                )}
                {showCheque && (
                  <div style={{ gridColumn: '1 / -1', background: '#ebf4ff', padding: '16px', borderRadius: '8px', border: '1px solid #90cdf4', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>📄 Montant Chèque (DT)</label>
                      <input type="number" value={form.montant_cheque} onChange={e => setForm({...form, montant_cheque: e.target.value})} min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>N° Chèque</label>
                      <input value={form.numero_cheque} onChange={e => setForm({...form, numero_cheque: e.target.value})} placeholder="ex: 001234" />
                    </div>
                    <div className="form-group">
                      <label>Banque</label>
                      <input value={form.banque_cheque} onChange={e => setForm({...form, banque_cheque: e.target.value})} placeholder="ex: STB" />
                    </div>
                  </div>
                )}
                {showCheque2 && (
                  <div style={{ gridColumn: '1 / -1', background: '#faf5ff', padding: '16px', borderRadius: '8px', border: '1px solid #d6bcfa', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>📄 Montant Chèque 2 (DT)</label>
                      <input type="number" value={form.montant_cheque2} onChange={e => setForm({...form, montant_cheque2: e.target.value})} min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>N° Chèque 2</label>
                      <input value={form.numero_cheque2} onChange={e => setForm({...form, numero_cheque2: e.target.value})} placeholder="ex: 005678" />
                    </div>
                    <div className="form-group">
                      <label>Banque</label>
                      <input value={form.banque_cheque2} onChange={e => setForm({...form, banque_cheque2: e.target.value})} placeholder="ex: Zitouna" />
                    </div>
                  </div>
                )}
                {showVirement && (
                  <div style={{ gridColumn: '1 / -1', background: '#fffff0', padding: '16px', borderRadius: '8px', border: '1px solid #faf089', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>🏦 Montant Virement (DT)</label>
                      <input type="number" value={form.montant_virement} onChange={e => setForm({...form, montant_virement: e.target.value})} min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>Banque Virement</label>
                      <input value={form.banque_virement} onChange={e => setForm({...form, banque_virement: e.target.value})} placeholder="ex: Banque Zitouna" />
                    </div>
                  </div>
                )}
              </div>

              {/* Total preview */}
              <div style={{ background: '#1a56db', color: 'white', borderRadius: '8px', padding: '16px', textAlign: 'center', margin: '16px 0' }}>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Montant Total Avance</div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>
                  {((parseFloat(form.montant_especes) || 0) + (parseFloat(form.montant_cheque) || 0) + (parseFloat(form.montant_cheque2) || 0) + (parseFloat(form.montant_virement) || 0)).toFixed(2)} DT
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : (editingAvance ? 'Modifier' : '+ Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Avances;