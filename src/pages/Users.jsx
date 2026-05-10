import { useState, useEffect } from 'react';
import {
  Users as UsersIcon, UserPlus, Pencil, Trash2,
  ShieldCheck, UserCheck, Eye, EyeOff,
  KeyRound, Search,
} from 'lucide-react';
import api from '../api/axios';

const NAVY   = '#1B3A6B';
const AMBER  = '#E8A020';
const GREEN  = '#16A34A';
const PURPLE = '#7C3AED';
const RED    = '#DC2626';

const EMPTY_FORM = {
  username: '', password: '', nom: '', prenom: '', email: '', role: 'employee',
};

const Users = () => {
  const [users,        setUsers]        = useState([]);
  const [showModal,    setShowModal]    = useState(false);
  const [editingUser,  setEditingUser]  = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [search,       setSearch]       = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const openAdd = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, password: '', nom: user.nom || '', prenom: user.prenom || '', email: user.email || '', role: user.role || 'employee' });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form };
      if (editingUser && !data.password) delete data.password;
      if (editingUser) await api.put(`/auth/users/${editingUser.id}/`, data);
      else             await api.post('/auth/users/', data);
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      alert('Erreur: ' + JSON.stringify(err.response?.data));
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try { await api.delete(`/auth/users/${id}/`); fetchUsers(); }
    catch (err) { console.error(err); }
  };

  const resetPassword = async (user) => {
    const newPass = prompt(`Nouveau mot de passe pour ${user.prenom} ${user.nom} :`);
    if (!newPass) return;
    try {
      await api.put(`/auth/users/${user.id}/`, { ...user, password: newPass });
      alert('Mot de passe modifié avec succès.');
    } catch (err) { alert('Erreur: ' + JSON.stringify(err.response?.data)); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || `${u.prenom} ${u.nom} ${u.username} ${u.email}`.toLowerCase().includes(q);
  });

  const admins    = users.filter(u => u.role === 'admin').length;
  const employees = users.filter(u => u.role === 'employee').length;

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UsersIcon size={22} color={NAVY} /> Gestion des Utilisateurs
        </h1>
        <button className="btn btn-primary" onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <UserPlus size={15} /> Ajouter un employé
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total utilisateurs', value: users.length,  color: NAVY,   bg: '#EFF4FB', icon: <UsersIcon size={20} /> },
          { label: 'Administrateurs',    value: admins,        color: PURPLE, bg: '#F3EEFF', icon: <ShieldCheck size={20} /> },
          { label: 'Employés',           value: employees,     color: GREEN,  bg: '#DCFCE7', icon: <UserCheck size={20} /> },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#64748B', fontSize: '12.5px', marginTop: '3px', fontWeight: '600' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Card header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F2F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ color: NAVY, fontWeight: '700', fontSize: '15px', margin: 0 }}>
            Liste des utilisateurs
          </h3>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              style={{ paddingLeft: '30px', fontSize: '13px' }} />
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ paddingLeft: '20px' }}>Utilisateur</th>
              <th>Username</th>
              <th>Email</th>
              <th>Rôle</th>
              <th style={{ paddingRight: '20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                <UsersIcon size={36} color="#DDE3ED" style={{ display: 'block', margin: '0 auto 10px' }} />
                Aucun utilisateur trouvé
              </td></tr>
            ) : filtered.map(u => {
              const isAdmin   = u.role === 'admin';
              const avatarBg  = isAdmin ? NAVY : GREEN;
              const roleCfg   = isAdmin
                ? { label: 'Administrateur', color: PURPLE, bg: '#F3EEFF', border: '#DDD6FE', icon: <ShieldCheck size={12} /> }
                : { label: 'Employé',         color: GREEN,  bg: '#DCFCE7', border: '#86EFAC', icon: <UserCheck size={12} /> };
              return (
                <tr key={u.id}>
                  <td style={{ paddingLeft: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: avatarBg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0, letterSpacing: '-0.5px' }}>
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#1A2535' }}>{u.prenom} {u.nom}</div>
                        {u.email && <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '1px' }}>{u.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ background: '#F1F5F9', padding: '3px 9px', borderRadius: '6px', fontSize: '12.5px', color: NAVY, fontWeight: '700' }}>
                      {u.username}
                    </code>
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748B' }}>{u.email || <span style={{ color: '#DDE3ED' }}>—</span>}</td>
                  <td>
                    <span style={{ padding: '4px 11px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.border}`, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {roleCfg.icon} {roleCfg.label}
                    </span>
                  </td>
                  <td style={{ paddingRight: '20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(u)}
                        style={{ padding: '6px 12px', background: NAVY, color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Pencil size={13} /> Modifier
                      </button>
                      <button onClick={() => resetPassword(u)}
                        style={{ padding: '6px 12px', background: '#FEF3DC', color: '#92580A', border: '1px solid #FCD34D', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <KeyRound size={13} /> MDP
                      </button>
                      {!isAdmin && (
                        <button onClick={() => handleDelete(u.id)}
                          style={{ padding: '6px 10px', background: '#FEE2E2', color: RED, border: '1px solid #FECACA', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                          <Trash2 size={13} /> Supprimer
                        </button>
                      )}
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              {editingUser
                ? <><Pencil size={17} /> Modifier l'utilisateur</>
                : <><UserPlus size={17} /> Nouvel employé</>}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                <div className="form-group">
                  <label>Prénom <span style={{ color: RED }}>*</span></label>
                  <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required placeholder="ex: Yassine" />
                </div>
                <div className="form-group">
                  <label>Nom <span style={{ color: RED }}>*</span></label>
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required placeholder="ex: Ben Hassen" />
                </div>
                <div className="form-group">
                  <label>Nom d'utilisateur <span style={{ color: RED }}>*</span></label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="ex: yassine" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ex: yassine@waieb.tn" />
                </div>

                {/* Password */}
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>
                    {editingUser ? 'Nouveau mot de passe (laisser vide = inchangé)' : <>Mot de passe <span style={{ color: RED }}>*</span></>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required={!editingUser}
                      placeholder={editingUser ? 'Laisser vide pour ne pas changer' : 'Mot de passe'}
                      style={{ paddingRight: '44px' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Rôle</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                    {[
                      { value: 'employee', label: 'Employé',        icon: <UserCheck size={16} />, color: GREEN,  bg: '#DCFCE7', border: '#86EFAC' },
                      { value: 'admin',    label: 'Administrateur', icon: <ShieldCheck size={16} />, color: PURPLE, bg: '#F3EEFF', border: '#DDD6FE' },
                    ].map(r => {
                      const active = form.role === r.value;
                      return (
                        <button key={r.value} type="button"
                          onClick={() => setForm({ ...form, role: r.value })}
                          style={{ padding: '11px 14px', border: `2px solid ${active ? r.color : '#DDE3ED'}`, borderRadius: '9px', cursor: 'pointer', background: active ? r.bg : 'white', color: active ? r.color : '#64748B', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.14s', justifyContent: 'center' }}>
                          {r.icon} {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : (editingUser ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;