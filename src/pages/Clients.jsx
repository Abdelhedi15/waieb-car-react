import { useState, useEffect } from 'react';
import {
  Users, UserPlus, Pencil, Trash2, Search,
  Phone, Mail, MapPin, CreditCard, Star,
  Crown, UserCheck, SlidersHorizontal,
} from 'lucide-react';
import api from '../api/axios';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM = {
  nom:'', prenom:'', cin:'', email:'', telephone:'',
  adresse:'', permis_number:'', date_naissance:'', note:'',
};

const Clients = () => {
  const [clients,      setClients]      = useState([]);
  const [reservations, setReservations] = useState([]);
  const [showModal,    setShowModal]    = useState(false);
  const [editingCli,   setEditingCli]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [levelFilter,  setLevelFilter]  = useState('all');
  const [currentPage,  setCurrentPage]  = useState(1);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [c, r] = await Promise.all([api.get('/clients/'), api.get('/reservations/')]);
      setClients(c.data);
      setReservations(r.data);
    } catch (err) { console.error(err); }
  };

  const getLevel = (id) => {
    const count = reservations.filter(r => r.client === id).length;
    if (count >= 5) return { label: 'VIP',    color: '#7C3AED', bg: '#F3EEFF', icon: <Crown size={12} />, count };
    if (count >= 3) return { label: 'Fidèle', color: '#1B3A6B', bg: '#EFF4FB', icon: <Star  size={12} />, count };
    return              { label: 'Nouveau', color: '#64748B', bg: '#F8FAFC', icon: <UserCheck size={12} />, count };
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || [c.nom,c.prenom,c.cin,c.email,c.telephone].some(f => (f||'').toLowerCase().includes(q));
    const level = getLevel(c.id);
    const matchLevel = levelFilter === 'all' || level.label.toLowerCase() === levelFilter;
    return matchSearch && matchLevel;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE);

  const handleSearch = (v) => { setSearch(v); setCurrentPage(1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCli) await api.put(`/clients/${editingCli.id}/`, form);
      else            await api.post('/clients/', form);
      fetchAll();
      setShowModal(false);
    } catch (err) {
      alert('Erreur: ' + JSON.stringify(err.response?.data));
    } finally { setLoading(false); }
  };

  const openEdit = (c) => { setEditingCli(c); setForm({...EMPTY_FORM,...c}); setShowModal(true); };
  const openAdd  = ()  => { setEditingCli(null); setForm(EMPTY_FORM); setShowModal(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    try { await api.delete(`/clients/${id}/`); fetchAll(); }
    catch (err) { alert('Erreur: ' + JSON.stringify(err.response?.data)); }
  };

  const NAVY = '#1B3A6B';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={22} color={NAVY} /> Gestion des Clients
        </h1>
        <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <UserPlus size={15} /> Ajouter un client
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total',    value: clients.length, color: NAVY,      bg: '#EFF4FB', icon: <Users size={18} /> },
          { label: 'VIP',      value: clients.filter(c => getLevel(c.id).label === 'VIP').length,    color: '#7C3AED', bg: '#F3EEFF', icon: <Crown size={18} /> },
          { label: 'Fidèles',  value: clients.filter(c => getLevel(c.id).label === 'Fidèle').length, color: NAVY,      bg: '#EFF4FB', icon: <Star size={18} /> },
          { label: 'Nouveaux', value: clients.filter(c => getLevel(c.id).label === 'Nouveau').length,color: '#64748B', bg: '#F8FAFC', icon: <UserCheck size={18} /> },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher par nom, CIN, email, téléphone..."
            style={{ paddingLeft: '34px' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <SlidersHorizontal size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setCurrentPage(1); }}
            style={{ paddingLeft: '30px', minWidth: '150px' }}>
            <option value="all">Tous les niveaux</option>
            <option value="vip">VIP (≥5)</option>
            <option value="fidèle">Fidèle (≥3)</option>
            <option value="nouveau">Nouveau</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>CIN</th>
              <th>Contact</th>
              <th>Permis</th>
              <th>Niveau</th>
              <th>Locations</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>Aucun client trouvé</td></tr>
            ) : paginated.map(c => {
              const level = getLevel(c.id);
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF4FB', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                        {c.prenom?.charAt(0)}{c.nom?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13.5px' }}>{c.prenom} {c.nom}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={10} /> {c.adresse || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px', color: '#64748B' }}>{c.cin}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}><Phone size={11} color="#64748B" /> {c.telephone}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8' }}><Mail size={11} /> {c.email || '—'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '12.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CreditCard size={12} /> {c.permis_number || '—'}
                  </td>
                  <td>
                    <span style={{ background: level.bg, color: level.color, padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {level.icon} {level.label}
                    </span>
                  </td>
                  <td>
                    <span style={{ background: '#EFF4FB', color: NAVY, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}>
                      {level.count}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(c)} style={{ padding: '6px 12px', background: NAVY, color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Pencil size={12} /> Modifier
                      </button>
                      <button onClick={() => handleDelete(c.id)} style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ padding: '0 20px 16px' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingCli ? <><Pencil size={17} /> Modifier le client</> : <><UserPlus size={17} /> Nouveau client</>}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group"><label>Prénom *</label><input value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} required /></div>
                <div className="form-group"><label>Nom *</label><input value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} required /></div>
                <div className="form-group"><label>CIN *</label><input value={form.cin} onChange={e=>setForm({...form,cin:e.target.value})} required /></div>
                <div className="form-group"><label>Téléphone</label><input value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
                <div className="form-group"><label>Date naissance</label><input type="date" value={form.date_naissance} onChange={e=>setForm({...form,date_naissance:e.target.value})} /></div>
                <div className="form-group"><label>N° Permis</label><input value={form.permis_number} onChange={e=>setForm({...form,permis_number:e.target.value})} /></div>
                <div className="form-group" style={{gridColumn:'1/-1'}}><label>Adresse</label><input value={form.adresse} onChange={e=>setForm({...form,adresse:e.target.value})} /></div>
                <div className="form-group" style={{gridColumn:'1/-1'}}><label>Note</label><textarea rows={2} value={form.note} onChange={e=>setForm({...form,note:e.target.value})} style={{resize:'vertical'}} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Enregistrement...' : (editingCli ? 'Modifier' : 'Ajouter')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;