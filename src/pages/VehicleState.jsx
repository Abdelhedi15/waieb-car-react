import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Car, CheckCircle, XCircle, AlertTriangle,
  Save, FileText, Calendar, ChevronRight,
  Droplets, Sparkles, FileCheck, Shield, Wrench,
  Key, Radio, Eye, Minus,
} from 'lucide-react';
import api from '../api/axios';

const NAVY  = '#1B3A6B';
const GREEN = '#16A34A';
const RED   = '#DC2626';
const AMBER = '#D97706';

const VehicleState = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const [vehicle, setVehicle] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [activeTab, setActiveTab] = useState('avant');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [drawMode, setDrawMode] = useState('eraflure');

  const defaultEtat = {
    eraflures: [], bosses: [],
    propre_interieur: true, propre_exterieur: true,
    papier_carte_grise: true, papier_assurance: true,
    route_secours: true, cles: true, autoradio: true,
    notes: ''
  };

  const [etatAvant, setEtatAvant] = useState({ ...defaultEtat });
  const [etatApres, setEtatApres] = useState({ ...defaultEtat, a_accident: false, accident_description: '' });

  useEffect(() => { fetchData(); }, [vehicleId]);

  const fetchData = async () => {
    try {
      const [v, r] = await Promise.all([
        api.get(`/vehicles/${vehicleId}/`),
        api.get('/reservations/'),
      ]);
      setVehicle(v.data);
      setReservations(r.data.filter(res => res.vehicle === parseInt(vehicleId)));
    } catch (err) { console.error(err); }
  };

  const loadReservationState = (res) => {
    setSelectedReservation(res);
    try {
      setEtatAvant({
        eraflures: res.etat_avant_eraflures ? JSON.parse(res.etat_avant_eraflures) : [],
        bosses: res.etat_avant_bosses ? JSON.parse(res.etat_avant_bosses) : [],
        propre_interieur: res.etat_avant_propre ?? true,
        propre_exterieur: true, papier_carte_grise: true,
        papier_assurance: true, route_secours: true, cles: true, autoradio: true,
        notes: res.etat_avant_notes || ''
      });
    } catch { setEtatAvant({ ...defaultEtat }); }
    try {
      setEtatApres({
        eraflures: res.etat_apres_eraflures ? JSON.parse(res.etat_apres_eraflures) : [],
        bosses: res.etat_apres_bosses ? JSON.parse(res.etat_apres_bosses) : [],
        propre_interieur: res.etat_apres_propre ?? true,
        propre_exterieur: true, papier_carte_grise: true,
        papier_assurance: true, route_secours: true, cles: true, autoradio: true,
        a_accident: res.a_accident || false,
        accident_description: res.accident_description || '',
        notes: res.etat_apres_notes || ''
      });
    } catch { setEtatApres({ ...defaultEtat, a_accident: false, accident_description: '' }); }
  };

  const handleSvgClick = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width * 300).toFixed(1));
    const y = parseFloat(((e.clientY - rect.top) / rect.height * 180).toFixed(1));
    const point = { x, y, id: Date.now() };
    const setter = activeTab === 'avant' ? setEtatAvant : setEtatApres;
    setter(prev => ({ ...prev, [drawMode === 'eraflure' ? 'eraflures' : 'bosses']: [...prev[drawMode === 'eraflure' ? 'eraflures' : 'bosses'], point] }));
  };

  const removePoint = (type, id) => {
    const setter = activeTab === 'avant' ? setEtatAvant : setEtatApres;
    setter(prev => ({ ...prev, [type]: prev[type].filter(p => p.id !== id) }));
  };

  const handleSave = async () => {
    if (!selectedReservation) return;
    setLoading(true);
    try {
      await api.patch(`/reservations/${selectedReservation.id}/state/`, {
        etat_avant_eraflures: JSON.stringify(etatAvant.eraflures),
        etat_avant_bosses: JSON.stringify(etatAvant.bosses),
        etat_avant_propre: etatAvant.propre_interieur,
        etat_avant_notes: etatAvant.notes,
        etat_apres_eraflures: JSON.stringify(etatApres.eraflures),
        etat_apres_bosses: JSON.stringify(etatApres.bosses),
        etat_apres_propre: etatApres.propre_interieur,
        etat_apres_notes: etatApres.notes,
        a_accident: etatApres.a_accident,
        accident_description: etatApres.accident_description,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchData();
      const updated = await api.get('/reservations/');
      const updatedRes = updated.data.find(r => r.id === selectedReservation.id);
      if (updatedRes) loadReservationState(updatedRes);
    } catch (err) {
      alert('Erreur: ' + JSON.stringify(err.response?.data));
    } finally { setLoading(false); }
  };

  const currentEtat = activeTab === 'avant' ? etatAvant : etatApres;
  const setCurrentEtat = activeTab === 'avant' ? setEtatAvant : setEtatApres;
  const problems = ['propre_interieur','propre_exterieur','papier_carte_grise','papier_assurance','route_secours','cles','autoradio'].filter(k => !currentEtat[k]).length;

  // ✅ Checklist items avec Lucide icons
  const CHECKLIST = [
    { field: 'propre_interieur',   label: 'Propreté intérieure',      icon: <Droplets size={16}/>     },
    { field: 'propre_exterieur',   label: 'Propreté extérieure',      icon: <Sparkles size={16}/>     },
    { field: 'papier_carte_grise', label: 'Carte grise',              icon: <FileCheck size={16}/>    },
    { field: 'papier_assurance',   label: 'Assurance',                icon: <Shield size={16}/>       },
    { field: 'route_secours',      label: 'Roue de secours',          icon: <Wrench size={16}/>       },
    { field: 'cles',               label: 'Clés',                     icon: <Key size={16}/>          },
    { field: 'autoradio',          label: 'Auto-radio',               icon: <Radio size={16}/>        },
  ];

  const statutStyle = (s) => {
    const map = {
      confirmée:  { bg: '#DCFCE7', color: GREEN },
      terminée:   { bg: '#DBEAFE', color: NAVY },
      en_attente: { bg: '#FEF9C3', color: '#92580A' },
      annulée:    { bg: '#FEE2E2', color: RED },
    };
    return map[s] || { bg: '#F1F5F9', color: '#64748B' };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/vehicles')}
          style={{ padding: '9px 16px', background: '#EFF4FB', border: '1.5px solid #DDE3ED', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: NAVY, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={15} /> Retour
        </button>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} color={NAVY} />
            Rapport État — {vehicle ? `${vehicle.marque} ${vehicle.modele}` : '...'}
          </h1>
          {vehicle && (
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#EFF4FB', color: NAVY, padding: '2px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '12px' }}>{vehicle.immatriculation}</span>
              <span>{vehicle.marque} {vehicle.modele} · {vehicle.annee}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        {/* Left — Reservations list */}
        <div className="card" style={{ padding: '16px', height: 'fit-content' }}>
          <h3 style={{ color: NAVY, marginBottom: '14px', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Réservations ({reservations.length})
          </h3>
          {reservations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px' }}>
              <Car size={32} color="#DDE3ED" style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
              Aucune réservation
            </div>
          ) : reservations.map(res => {
            const isSelected = selectedReservation?.id === res.id;
            const st = statutStyle(res.statut);
            const hasAvant = res.etat_avant_eraflures || res.etat_avant_bosses;
            const hasApres = res.etat_apres_eraflures || res.etat_apres_bosses;
            return (
              <div key={res.id} onClick={() => loadReservationState(res)}
                style={{ padding: '12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.15s', background: isSelected ? '#EFF4FB' : '#F8FAFC', border: `2px solid ${isSelected ? NAVY : '#DDE3ED'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '14px', color: NAVY }}>Rés. #{res.id}</strong>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {res.a_accident && <span style={{ background: '#FEE2E2', color: RED, padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', display:'flex', alignItems:'center', gap:'2px' }}><AlertTriangle size={9}/> Acc</span>}
                    {hasAvant && <span style={{ fontSize: '10px', background: '#DCFCE7', color: GREEN, padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>AV✓</span>}
                    {hasApres && <span style={{ fontSize: '10px', background: '#F3EEFF', color: '#7C3AED', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>AP✓</span>}
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={10} /> {res.date_debut} → {res.date_fin}
                </div>
                <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                  {res.statut}
                </span>
                {isSelected && <ChevronRight size={14} color={NAVY} style={{ float: 'right', marginTop: '-18px' }} />}
              </div>
            );
          })}
        </div>

        {/* Right */}
        <div>
          {!selectedReservation ? (
            <div className="card" style={{ textAlign: 'center', padding: '80px 20px' }}>
              <Car size={64} color="#DDE3ED" style={{ margin: '0 auto 16px', display: 'block' }} />
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1A2535', marginBottom: '8px' }}>Sélectionnez une réservation</div>
              <div style={{ color: '#64748B', fontSize: '13px' }}>Choisissez une réservation à gauche pour remplir l'état du véhicule</div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #DDE3ED' }}>
                {[
                  { id: 'avant', label: 'État AVANT location', color: GREEN, icon: <Eye size={15}/> },
                  { id: 'apres', label: 'État APRÈS retour',   color: RED,   icon: <CheckCircle size={15}/> },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', background: activeTab === tab.id ? tab.color : '#F8FAFC', color: activeTab === tab.id ? 'white' : '#64748B', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* SVG diagram */}
                <div className="card" style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: NAVY, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Car size={13} /> Schéma véhicule — Cliquez pour marquer
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {[
                      { mode: 'eraflure', label: 'Éraflure', icon: <Minus size={14}/>, color: AMBER },
                      { mode: 'bosse',    label: 'Bosse',    icon: <AlertTriangle size={14}/>, color: RED },
                    ].map(m => (
                      <button key={m.mode} onClick={() => setDrawMode(m.mode)}
                        style={{ flex: 1, padding: '8px', border: `2px solid ${drawMode === m.mode ? m.color : '#DDE3ED'}`, borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', background: drawMode === m.mode ? m.color : 'white', color: drawMode === m.mode ? 'white' : '#64748B', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ position: 'relative', cursor: 'crosshair' }}>
                    <svg ref={svgRef} viewBox="0 0 300 180" onClick={handleSvgClick}
                      style={{ width: '100%', border: '1.5px solid #DDE3ED', borderRadius: '10px', background: '#F8FAFC' }}>
                      <rect x="30" y="70" width="240" height="80" rx="10" fill="#dde1e7" stroke="#adb5bd" strokeWidth="2"/>
                      <path d="M80 70 Q90 30 120 25 L180 25 Q210 30 220 70Z" fill="#c1c9d4" stroke="#adb5bd" strokeWidth="2"/>
                      <path d="M220 70 Q215 35 185 28 L185 70Z" fill="#a8d8ea" stroke="#adb5bd" strokeWidth="1" opacity="0.7"/>
                      <path d="M80 70 Q85 35 115 28 L115 70Z" fill="#a8d8ea" stroke="#adb5bd" strokeWidth="1" opacity="0.7"/>
                      <rect x="120" y="28" width="60" height="40" rx="3" fill="#a8d8ea" stroke="#adb5bd" strokeWidth="1" opacity="0.7"/>
                      <circle cx="80" cy="150" r="22" fill="#495057" stroke="#212529" strokeWidth="2"/>
                      <circle cx="80" cy="150" r="12" fill="#868e96"/>
                      <circle cx="220" cy="150" r="22" fill="#495057" stroke="#212529" strokeWidth="2"/>
                      <circle cx="220" cy="150" r="12" fill="#868e96"/>
                      <rect x="258" y="80" width="15" height="20" rx="3" fill="#ffd43b" stroke="#adb5bd" strokeWidth="1"/>
                      <rect x="27" y="80" width="15" height="20" rx="3" fill="#ff6b6b" stroke="#adb5bd" strokeWidth="1"/>
                      <line x1="150" y1="70" x2="150" y2="148" stroke="#adb5bd" strokeWidth="1.5" strokeDasharray="4"/>
                      <text x="80" y="173" textAnchor="middle" fontSize="9" fill="#666">AR</text>
                      <text x="220" y="173" textAnchor="middle" fontSize="9" fill="#666">AV</text>
                      {currentEtat.eraflures.map(p => (
                        <g key={p.id} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); removePoint('eraflures', p.id); }}>
                          <line x1={p.x-10} y1={p.y} x2={p.x+10} y2={p.y} stroke={AMBER} strokeWidth="3" strokeLinecap="round"/>
                          <circle cx={p.x} cy={p.y} r="8" fill={AMBER} opacity="0.25"/>
                        </g>
                      ))}
                      {currentEtat.bosses.map(p => (
                        <g key={p.id} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); removePoint('bosses', p.id); }}>
                          <circle cx={p.x} cy={p.y} r="10" fill={RED} opacity="0.75" stroke="#c53030" strokeWidth="2"/>
                          <text x={p.x} y={p.y+4} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">B</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', textAlign: 'center' }}>
                    Cliquez pour ajouter • Cliquez sur un marqueur pour supprimer
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <span style={{ color: AMBER, fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Minus size={12}/> Éraflure ({currentEtat.eraflures.length})</span>
                    <span style={{ color: RED, fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12}/> Bosse ({currentEtat.bosses.length})</span>
                  </div>
                  {(currentEtat.eraflures.length > 0 || currentEtat.bosses.length > 0) && (
                    <button onClick={() => setCurrentEtat(prev => ({ ...prev, eraflures: [], bosses: [] }))}
                      style={{ marginTop: '8px', padding: '6px 14px', background: '#FEE2E2', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', color: RED, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <XCircle size={13}/> Tout effacer
                    </button>
                  )}
                </div>

                {/* Checklist avec Lucide icons */}
                <div className="card" style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: NAVY, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={13} /> Checklist — {activeTab === 'avant' ? 'Départ' : 'Retour'}
                  </h3>

                  {CHECKLIST.map(item => {
                    const val = currentEtat[item.field];
                    return (
                      <div key={item.field}
                        onClick={() => setCurrentEtat(prev => ({ ...prev, [item.field]: !prev[item.field] }))}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', cursor: 'pointer', background: val ? '#F0FFF4' : '#FFF5F5', border: `1.5px solid ${val ? '#86EFAC' : '#FECACA'}`, marginBottom: '8px', transition: 'all 0.15s', userSelect: 'none' }}>
                        <div style={{ color: val ? GREEN : RED, display: 'flex', flexShrink: 0 }}>{item.icon}</div>
                        <span style={{ flex: 1, fontWeight: '600', fontSize: '13px', color: '#1A2535' }}>{item.label}</span>
                        <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: val ? GREEN : RED, color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {val ? <><CheckCircle size={11}/> OK</> : <><XCircle size={11}/> Manquant</>}
                        </span>
                      </div>
                    );
                  })}

                  {activeTab === 'apres' && (
                    <div style={{ marginTop: '12px', padding: '14px', background: '#FFF5F5', borderRadius: '10px', border: `2px solid ${RED}` }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', color: RED, fontSize: '13px' }}>
                        <input type="checkbox" checked={etatApres.a_accident} onChange={e => setEtatApres(prev => ({ ...prev, a_accident: e.target.checked }))} style={{ width: '17px', height: '17px' }} />
                        <AlertTriangle size={15}/> Accident déclaré
                      </label>
                      {etatApres.a_accident && (
                        <textarea value={etatApres.accident_description} onChange={e => setEtatApres(prev => ({ ...prev, accident_description: e.target.value }))}
                          placeholder="Description de l'accident..." rows={3}
                          style={{ width: '100%', marginTop: '10px', padding: '8px', borderRadius: '8px', border: `1px solid ${RED}`, fontSize: '13px', resize: 'vertical' }} />
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontWeight: '700', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <FileText size={12}/> Notes libres
                    </label>
                    <textarea value={currentEtat.notes} onChange={e => setCurrentEtat(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observations supplémentaires..." rows={3}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #DDE3ED', fontSize: '13px', resize: 'vertical' }} />
                  </div>

                  <div style={{ marginTop: '14px', padding: '12px 14px', background: problems === 0 ? '#F0FFF4' : '#FFF5F5', borderRadius: '10px', border: `1.5px solid ${problems === 0 ? '#86EFAC' : '#FECACA'}`, fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {problems === 0
                      ? <><CheckCircle size={15} color={GREEN}/><span style={{ color: GREEN }}>Tout OK — {currentEtat.eraflures.length} éraflure(s) · {currentEtat.bosses.length} bosse(s)</span></>
                      : <><AlertTriangle size={15} color={RED}/><span style={{ color: RED }}>{problems} problème(s) · {currentEtat.eraflures.length} éraflure(s) · {currentEtat.bosses.length} bosse(s)</span></>
                    }
                  </div>
                </div>
              </div>

              {/* Save */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                {saved && (
                  <span style={{ color: GREEN, fontWeight: '700', fontSize: '14px', background: '#F0FFF4', padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #86EFAC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={15}/> Sauvegardé avec succès!
                  </span>
                )}
                <button onClick={handleSave} disabled={loading}
                  style={{ padding: '12px 32px', background: loading ? '#94A3B8' : NAVY, color: 'white', border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16}/> {loading ? 'Enregistrement...' : "Sauvegarder l'état"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleState;