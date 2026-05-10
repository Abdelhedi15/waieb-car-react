import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Car, Users, CalendarDays,
  CreditCard, FileText, UserCog, LogOut,
  ChevronDown, PlusCircle, List, ShieldCheck, Bell,
} from 'lucide-react';
import api from '../api/axios';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const [reservationsOpen, setReservationsOpen] = useState(
    location.pathname.includes('/reservations')
  );
  const [pendingCount, setPendingCount] = useState(0);

  // ── Live badge — refresh every 10s
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get('/reservations/');
        setPendingCount(res.data.filter(r => r.statut === 'en_attente').length);
      } catch (_) {}
    };
    fetchPending();
    const iv = setInterval(fetchPending, 10000);
    return () => clearInterval(iv);
  }, []);

  const initials = user?.prenom && user?.nom
    ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase()
    : user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon-wrap">
          <Car size={20} color="#E8A020" strokeWidth={2.5} />
        </div>
        <div>
          <span className="logo-title">Waieb</span>
          <span className="logo-sub">Car&nbsp;Rent</span>
        </div>
      </div>

      {/* User card */}
      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.prenom} {user?.nom}</div>
          <div className="user-role">
            {isAdmin
              ? <><ShieldCheck size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Administrateur</>
              : <><UserCog size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Employé</>
            }
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">

        {isAdmin && (
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><LayoutDashboard size={17} /></span>
            Tableau de bord
          </NavLink>
        )}

        <NavLink to="/vehicles" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><Car size={17} /></span>
          Véhicules
        </NavLink>

        <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><Users size={17} /></span>
          Clients
        </NavLink>

        {/* ── Confirmations — with live badge */}
        <NavLink to="/confirmations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon" style={{ position: 'relative' }}>
            <Bell size={17} />
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#DC2626', color: 'white', borderRadius: '50%',
                width: '15px', height: '15px', fontSize: '8px', fontWeight: '800',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {pendingCount}
              </span>
            )}
          </span>
          <span style={{ flex: 1 }}>Confirmations</span>
          {pendingCount > 0 && (
            <span style={{
              background: '#DC2626', color: 'white', borderRadius: '10px',
              padding: '1px 7px', fontSize: '10px', fontWeight: '800',
            }}>
              {pendingCount}
            </span>
          )}
        </NavLink>

        {/* Reservations accordion */}
        <div>
          <button
            onClick={() => setReservationsOpen(!reservationsOpen)}
            className={`nav-link nav-accordion ${reservationsOpen ? 'accordion-open' : ''}`}
            style={{ width: '100%', border: 'none', cursor: 'pointer', background: reservationsOpen ? 'var(--sidebar-hover)' : 'none', textAlign: 'left' }}>
            <span className="nav-icon"><CalendarDays size={17} /></span>
            <span style={{ flex: 1 }}>Réservations</span>
            <ChevronDown size={15} style={{ transition: 'transform 0.2s', transform: reservationsOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }} />
          </button>
          {reservationsOpen && (
            <div className="nav-subitems">
              <NavLink to="/reservations" className={({ isActive }) => `nav-sub-link ${isActive ? 'active' : ''}`}>
                <PlusCircle size={13} /> Ajouter réservation
              </NavLink>
              <NavLink to="/reservations-list" className={({ isActive }) => `nav-sub-link ${isActive ? 'active' : ''}`}>
                <List size={13} /> Liste réservations
              </NavLink>
            </div>
          )}
        </div>

        <NavLink to="/payments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><CreditCard size={17} /></span>
          Paiements
        </NavLink>

        <NavLink to="/contracts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><FileText size={17} /></span>
          Contrats
        </NavLink>

        {isAdmin && (
          <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><UserCog size={17} /></span>
            Utilisateurs
          </NavLink>
        )}

      </nav>

      <button className="logout-btn" onClick={logout}>
        <LogOut size={15} />
        Déconnexion
      </button>

    </aside>
  );
};

export default Sidebar;