import { useState } from 'react';
import {
  X, CheckCircle, AlertTriangle, ClipboardList,
  ChevronRight, Send, Gauge, Fuel,
  Star, Car, FileText, Shield, Wrench,
  Droplets, Sparkles, FileCheck, Key, Radio,
  Minus, Printer,
} from 'lucide-react';

const NAVY   = '#1B3A6B';
const AMBER  = '#D97706';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';

// ✅ Lucide icons remplacent les emojis
const CHECKLIST_ITEMS = [
  { key: 'proprete_int',    icon: <Droplets size={15}/>,   label: 'Propreté intérieure',      group: 'état' },
  { key: 'proprete_ext',    icon: <Sparkles size={15}/>,   label: 'Propreté extérieure',      group: 'état' },
  { key: 'carburant',       icon: <Fuel size={15}/>,       label: 'Niveau carburant correct',  group: 'technique' },
  { key: 'cles',            icon: <Key size={15}/>,        label: 'Clés rendues',             group: 'documents' },
  { key: 'carte_grise',     icon: <FileCheck size={15}/>,  label: 'Carte grise rendue',       group: 'documents' },
  { key: 'assurance',       icon: <Shield size={15}/>,     label: 'Vignette assurance',       group: 'documents' },
  { key: 'roue_secours',    icon: <Wrench size={15}/>,     label: 'Roue de secours présente', group: 'technique' },
  { key: 'triangles',       icon: <AlertTriangle size={15}/>, label: 'Triangles de sécurité',    group: 'technique' },
  { key: 'cric',            icon: <Gauge size={15}/>,      label: 'Cric présent',             group: 'technique' },
  { key: 'vitre_ok',        icon: <Car size={15}/>,        label: 'Vitres intactes',          group: 'carrosserie' },
  { key: 'retroviseurs_ok', icon: <Star size={15}/>,       label: 'Rétroviseurs intacts',     group: 'carrosserie' },
  { key: 'phares_ok',       icon: <Radio size={15}/>,      label: 'Phares/feux fonctionnels', group: 'technique' },
];

const ETAT_OPTIONS = [
  { value: 'excellent', label: 'Excellent',       color: GREEN, bg: '#DCFCE7', icon: <Star size={18}/> },
  { value: 'bon',       label: 'Bon état',        color: NAVY,  bg: '#EFF4FB', icon: <CheckCircle size={18}/> },
  { value: 'defauts',   label: 'Défauts mineurs', color: AMBER, bg: '#FEF9C3', icon: <AlertTriangle size={18}/> },
  { value: 'dommages',  label: 'Dommages',        color: RED,   bg: '#FEE2E2', icon: <AlertTriangle size={18}/> },
];

const CAR_MARKS = {
  eraflure: { color: '#F59E0B', label: 'Éraflure', icon: <Minus size={12}/> },
  bosse:    { color: '#DC2626', label: 'Bosse',     icon: <AlertTriangle size={12}/> },
};

const CAR_ZONES = [
  { id: 'avant_gauche',   x: 18, y: 30, label: 'Avant G.' },
  { id: 'avant_centre',   x: 50, y: 22, label: 'Avant' },
  { id: 'avant_droit',    x: 82, y: 30, label: 'Avant D.' },
  { id: 'milieu_gauche',  x: 12, y: 50, label: 'Flanc G.' },
  { id: 'toit',           x: 50, y: 48, label: 'Toit' },
  { id: 'milieu_droit',   x: 88, y: 50, label: 'Flanc D.' },
  { id: 'arriere_gauche', x: 18, y: 70, label: 'Arrière G.' },
  { id: 'arriere_centre', x: 50, y: 78, label: 'Arrière' },
  { id: 'arriere_droit',  x: 82, y: 70, label: 'Arrière D.' },
];

const GROUP_LABELS = {
  état:        { label: 'État général',  icon: <Car size={12}/> },
  technique:   { label: 'Technique',     icon: <Wrench size={12}/> },
  carrosserie: { label: 'Carrosserie',   icon: <Shield size={12}/> },
  documents:   { label: 'Documents',     icon: <FileCheck size={12}/> },
};

const printRapport = ({ reservation, client, vehicle, checklist, marks, etatGeneral, notes, kilometrage, carburant, score }) => {
  const eraflures  = marks.filter(m => m.type === 'eraflure');
  const bosses     = marks.filter(m => m.type === 'bosse');
  const pbCheck    = CHECKLIST_ITEMS.filter(i => !checklist[i.key]);
  const okCheck    = CHECKLIST_ITEMS.filter(i =>  checklist[i.key]);
  const now        = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const scoreColor = score >= 80 ? '#16A34A' : score >= 60 ? '#D97706' : '#DC2626';
  const etatInfo   = ETAT_OPTIONS.find(o => o.value === etatGeneral);
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/><title>Rapport Inspection — ${vehicle?.immatriculation || ''}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1A2535}
@page{margin:15mm 12mm;size:A4}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
.header{background:#1B3A6B;color:white;padding:22px 30px;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:19px;font-weight:900}.header-right{text-align:right}
.badge{background:rgba(255,255,255,.18);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;display:inline-block;margin-bottom:4px}
.score-banner{background:linear-gradient(135deg,${scoreColor}22,white);border-bottom:3px solid ${scoreColor};padding:18px 30px;display:flex;align-items:center;gap:20px}
.score-num{font-size:52px;font-weight:900;color:${scoreColor};line-height:1}
.score-bar-wrap{flex:1;background:#F0F2F5;border-radius:8px;height:12px;overflow:hidden;margin-top:8px}
.score-bar{height:100%;width:${score}%;background:${scoreColor};border-radius:8px}
.body{padding:20px 30px}.section{margin-bottom:18px}
.section-title{font-size:11px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid #F1F5F9;padding-bottom:6px}
.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.info-box{background:#F8FAFC;border-radius:8px;padding:10px 12px;border:1px solid #E2E8F0}
.info-box .lbl{font-size:9.5px;color:#94A3B8;font-weight:700;text-transform:uppercase;margin-bottom:3px}
.info-box .val{font-size:13px;font-weight:800;color:#1A2535}
.checklist-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.check-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;font-size:11.5px;font-weight:600}
.check-ok{background:#F0FFF4;color:#166534;border:1px solid #86EFAC}
.check-ko{background:#FFF5F5;color:#DC2626;border:1px solid #FECACA}
.dot{width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;flex-shrink:0}
.dot-ok{background:#16A34A}.dot-ko{background:#DC2626}
.marks-list{display:flex;gap:8px;flex-wrap:wrap}
.mark-chip{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;border:1.5px solid}
.mark-eraflure{color:#F59E0B;border-color:#F59E0B;background:#FFFBEB}
.mark-bosse{color:#DC2626;border-color:#DC2626;background:#FFF5F5}
.notes-box{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:12px;color:#475569;line-height:1.6;white-space:pre-wrap}
.footer{margin-top:24px;border-top:2px solid #F1F5F9;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end}
.sig-box{text-align:center}.sig-line{border-top:1.5px solid #CBD5E1;width:160px;margin:40px auto 6px}
.sig-label{font-size:10px;color:#94A3B8;font-weight:600}
.footer-note{font-size:9.5px;color:#CBD5E1;text-align:right}
</style></head><body>
<div class="header">
  <div><h1>🚗 MTD Group — Waieb Car Rent</h1><p>Rapport d'Inspection de Retour · Document officiel</p></div>
  <div class="header-right"><div class="badge">Réservation #${reservation?.id || '—'}</div><div style="font-size:10px;opacity:.65">Généré le ${now}</div></div>
</div>
<div class="score-banner">
  <div><div class="score-num">${score}</div><div style="font-size:13px;color:#64748B;font-weight:600">Score de retour / 100</div></div>
  <div style="flex:1">
    <div style="font-size:14px;font-weight:800;color:${scoreColor};margin-bottom:4px">${score >= 80 ? '✅ Excellent retour' : score >= 60 ? '⚠️ Retour acceptable avec réserves' : '❌ Dommages à signaler'}</div>
    <div style="font-size:11px;color:#64748B;margin-bottom:6px">${eraflures.length} éraflure(s) · ${bosses.length} bosse(s) · Checklist: ${okCheck.length}/${CHECKLIST_ITEMS.length}</div>
    <div class="score-bar-wrap"><div class="score-bar"></div></div>
  </div>
  <div style="text-align:right"><span style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:800;background:${etatInfo?.bg};color:${etatInfo?.color}">${etatInfo?.label}</span></div>
</div>
<div class="body">
  <div class="section">
    <div class="section-title">🚗 Véhicule &amp; Réservation</div>
    <div class="info-grid">
      <div class="info-box"><div class="lbl">Véhicule</div><div class="val">${vehicle?.marque || ''} ${vehicle?.modele || ''}</div></div>
      <div class="info-box"><div class="lbl">Immatriculation</div><div class="val">${vehicle?.immatriculation || '—'}</div></div>
      <div class="info-box"><div class="lbl">Client</div><div class="val">${client?.prenom || ''} ${client?.nom || ''}</div></div>
      <div class="info-box"><div class="lbl">Période</div><div class="val">${reservation?.date_debut || '—'} → ${reservation?.date_fin || '—'}</div></div>
      <div class="info-box"><div class="lbl">Km retour</div><div class="val">${kilometrage ? parseInt(kilometrage).toLocaleString() + ' km' : '—'}</div></div>
      <div class="info-box"><div class="lbl">Carburant</div><div class="val">${carburant}%</div></div>
      <div class="info-box"><div class="lbl">État carrosserie</div><div class="val">${etatInfo?.label || '—'}</div></div>
      <div class="info-box"><div class="lbl">Score final</div><div class="val" style="color:${scoreColor}">${score}/100</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">✅ Checklist de retour (${okCheck.length}/${CHECKLIST_ITEMS.length})</div>
    <div class="checklist-grid">
      ${CHECKLIST_ITEMS.map(item => `<div class="check-item ${checklist[item.key] ? 'check-ok' : 'check-ko'}"><div class="dot ${checklist[item.key] ? 'dot-ok' : 'dot-ko'}">${checklist[item.key] ? '✓' : '✗'}</div>${item.label}</div>`).join('')}
    </div>
    ${pbCheck.length > 0 ? `<div style="margin-top:8px;background:#FEF9C3;border:1px solid #FDE68A;border-radius:8px;padding:8px 12px;font-size:11.5px;color:#92580A;font-weight:600">⚠️ Points à signaler : ${pbCheck.map(i => i.label).join(', ')}</div>` : ''}
  </div>
  <div class="section">
    <div class="section-title">🛡️ Dommages carrosserie</div>
    ${marks.length === 0
      ? '<div style="color:#16A34A;font-weight:700;font-size:12.5px;padding:8px 0">✅ Aucun dommage enregistré</div>'
      : `<div class="marks-list">${eraflures.map(m=>`<span class="mark-chip mark-eraflure">— Éraflure · ${m.label}</span>`).join('')}${bosses.map(m=>`<span class="mark-chip mark-bosse">● Bosse · ${m.label}</span>`).join('')}</div>`}
  </div>
  ${notes ? `<div class="section"><div class="section-title">📝 Notes &amp; observations</div><div class="notes-box">${notes}</div></div>` : ''}
  <div class="footer">
    <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Signature Agent / Employé</div></div>
    <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Signature Client</div></div>
    <div class="footer-note">Waieb Car Rent · MTD Group Sfax<br/>Document généré automatiquement</div>
  </div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) { win.document.write(html); win.document.close(); }
};

const RetourCheckModal = ({ reservation, client, vehicle, onClose, onConfirm }) => {
  const [step,        setStep]        = useState(1);
  const [checklist,   setChecklist]   = useState(Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, true])));
  const [markType,    setMarkType]    = useState('eraflure');
  const [marks,       setMarks]       = useState([]);
  const [etatGeneral, setEtatGeneral] = useState('bon');
  const [notes,       setNotes]       = useState('');
  const [kilometrage, setKilometrage] = useState('');
  const [carburant,   setCarburant]   = useState(100);
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);

  const nbPbChecklist = CHECKLIST_ITEMS.filter(i => !checklist[i.key]).length;
  const nbMarks       = marks.length;
  const score = Math.max(0, 100
    - nbPbChecklist * 8
    - nbMarks * 5
    - (etatGeneral === 'dommages' ? 30 : etatGeneral === 'defauts' ? 15 : 0)
  );
  const scoreColor = score >= 80 ? GREEN : score >= 60 ? AMBER : RED;

  const addMark = (zone) => {
    const existing = marks.find(m => m.zone === zone.id && m.type === markType);
    if (existing) setMarks(prev => prev.filter(m => !(m.zone === zone.id && m.type === markType)));
    else setMarks(prev => [...prev, { zone: zone.id, label: zone.label, type: markType }]);
  };

  // ✅ FIX CRITIQUE — reservation_id ajouté
  const handleSubmit = async () => {
    if (!kilometrage || isNaN(parseInt(kilometrage)) || parseInt(kilometrage) <= 0) {
      alert('⚠️ Veuillez saisir le kilométrage de retour (Étape 1 — champ obligatoire).');
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({
        reservation_id:          reservation?.id,         // ✅ FIX
        inspection_retour_faite: true,
        statut:                  'terminée',
        etat_retour:             etatGeneral,
        notes_retour:            notes,
        kilometrage_retour:      parseInt(kilometrage),
        carburant_retour:        carburant,
        score_retour:            score,
        eraflures_retour:        JSON.stringify(marks.filter(m => m.type === 'eraflure')),
        bosses_retour:           JSON.stringify(marks.filter(m => m.type === 'bosse')),
        checklist_retour:        JSON.stringify(checklist),
      });
      setDone(true);
    } catch (err) {
      alert('Erreur lors de la validation : ' + (err?.response?.data ? JSON.stringify(err.response.data) : err?.message || 'Erreur inconnue'));
    } finally { setSubmitting(false); }
  };

  const handlePrint = () =>
    printRapport({ reservation, client, vehicle, checklist, marks, etatGeneral, notes, kilometrage, carburant, score });

  const steps = ['Checklist', 'Carrosserie', 'Bilan'];

  if (done) {
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }} onClick={onClose}>
        <div style={{ background:'white', borderRadius:'20px', width:'100%', maxWidth:'500px', overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
          <div style={{ background:'linear-gradient(135deg,#16A34A,#15803D)', padding:'24px', color:'white', textAlign:'center' }}>
            <div style={{ marginBottom:'8px', display:'flex', justifyContent:'center' }}><CheckCircle size={52} color="white"/></div>
            <h2 style={{ margin:0, fontSize:'20px', fontWeight:'900' }}>Inspection validée !</h2>
            <p style={{ margin:'6px 0 0', opacity:.8, fontSize:'13px' }}>{vehicle?.marque} {vehicle?.modele} · {vehicle?.immatriculation}</p>
          </div>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ background: score >= 80 ? '#F0FFF4' : score >= 60 ? '#FFFBEB' : '#FFF5F5', border:`2px solid ${scoreColor}`, borderRadius:'14px', padding:'16px', textAlign:'center', marginBottom:'16px' }}>
              <div style={{ fontSize:'44px', fontWeight:'900', color:scoreColor, lineHeight:1 }}>{score}</div>
              <div style={{ fontSize:'12px', color:'#64748B', fontWeight:'600', marginTop:'4px' }}>Score de retour / 100</div>
              <div style={{ background:'#F0F2F5', borderRadius:'8px', height:'10px', marginTop:'10px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${score}%`, background:scoreColor, borderRadius:'8px' }}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'20px' }}>
              {[
                { icon:<ClipboardList size={16}/>, val:`${CHECKLIST_ITEMS.length - nbPbChecklist}/${CHECKLIST_ITEMS.length}`, label:'Checklist' },
                { icon:<Shield size={16}/>,        val:nbMarks,      label:'Dommages' },
                { icon:<Fuel size={16}/>,          val:`${carburant}%`, label:'Carburant' },
              ].map(s => (
                <div key={s.label} style={{ background:'#F8FAFC', borderRadius:'8px', padding:'10px', textAlign:'center', border:'1px solid #E2E8F0' }}>
                  <div style={{ color:NAVY, display:'flex', justifyContent:'center', marginBottom:'4px' }}>{s.icon}</div>
                  <div style={{ fontWeight:'800', fontSize:'14px', color:'#1A2535' }}>{s.val}</div>
                  <div style={{ fontSize:'10px', color:'#94A3B8', fontWeight:'600' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button onClick={handlePrint}
                style={{ width:'100%', padding:'13px', background:NAVY, color:'white', border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:'800', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                <Printer size={16}/> Imprimer le rapport d'inspection
              </button>
              <button onClick={onClose}
                style={{ width:'100%', padding:'11px', background:'#F8FAFC', color:'#64748B', border:'1.5px solid #DDE3ED', borderRadius:'12px', cursor:'pointer', fontWeight:'700', fontSize:'13px' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:'20px', width:'100%', maxWidth:'680px', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${NAVY} 0%,#2D5BA8 100%)`, padding:'18px 22px', color:'white', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'11px' }}>
              <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'12px', padding:'9px', display:'flex' }}>
                <ClipboardList size={20}/>
              </div>
              <div>
                <h2 style={{ margin:0, fontSize:'16px', fontWeight:'800', display:'flex', alignItems:'center', gap:'7px' }}>
                  <ClipboardList size={16}/> Inspection de Retour
                </h2>
                <div style={{ fontSize:'11px', opacity:.7, marginTop:'2px' }}>
                  #{reservation?.id} · {vehicle?.marque} {vehicle?.modele} ({vehicle?.immatriculation})
                </div>
                <div style={{ display:'flex', gap:'6px', marginTop:'6px', flexWrap:'wrap' }}>
                  <span style={{ background:'rgba(255,255,255,0.15)', padding:'2px 9px', borderRadius:'20px', fontSize:'10.5px', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px' }}>
                    <FileText size={10}/> {reservation?.date_debut} → {reservation?.date_fin}
                  </span>
                  <span style={{ background:'rgba(255,255,255,0.15)', padding:'2px 9px', borderRadius:'20px', fontSize:'10.5px', fontWeight:'600' }}>
                    👤 {client?.prenom} {client?.nom}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', padding:'7px', cursor:'pointer', color:'white', display:'flex' }}>
              <X size={17}/>
            </button>
          </div>
          {/* Steps */}
          <div style={{ display:'flex', gap:'5px', marginTop:'14px' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', flex:1 }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', gap:'6px', padding:'5px 10px', borderRadius:'20px', background: step === i+1 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)', border:`1.5px solid ${step === i+1 ? 'rgba(255,255,255,0.45)' : 'transparent'}` }}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'50%', flexShrink:0, background: step > i+1 ? AMBER : step === i+1 ? 'white' : 'rgba(255,255,255,0.25)', color: step === i+1 ? NAVY : 'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', fontSize:'10px' }}>
                    {step > i+1 ? <CheckCircle size={12} color="white"/> : i+1}
                  </div>
                  <span style={{ fontSize:'11.5px', fontWeight:'700', opacity: step === i+1 ? 1 : 0.55 }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div style={{ width:'8px', height:'2px', background:'rgba(255,255,255,0.18)', flexShrink:0 }}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>

          {/* STEP 1 — Checklist */}
          {step === 1 && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'13px', border: !kilometrage ? '2px solid #FECACA' : '2px solid #86EFAC' }}>
                  <label style={{ fontSize:'11.5px', fontWeight:'700', color:'#64748B', marginBottom:'5px', display:'flex', alignItems:'center', gap:'5px' }}>
                    <Gauge size={13}/> Kilométrage retour <span style={{ color:RED, fontWeight:'900' }}>*</span>
                  </label>
                  <input type="number" value={kilometrage} onChange={e => setKilometrage(e.target.value)}
                    placeholder={`Actuel: ${vehicle?.kilometrage || '—'} km`}
                    style={{ width:'100%', padding:'9px', border:`1.5px solid ${!kilometrage ? '#FECACA' : '#DDE3ED'}`, borderRadius:'8px', fontSize:'14px', fontWeight:'700', boxSizing:'border-box' }}/>
                  {!kilometrage && <div style={{ fontSize:'10.5px', color:RED, fontWeight:'600', marginTop:'4px', display:'flex', alignItems:'center', gap:'4px' }}><AlertTriangle size={11}/> Champ obligatoire</div>}
                </div>
                <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'13px', border:'1.5px solid #E2E8F0' }}>
                  <label style={{ fontSize:'11.5px', fontWeight:'700', color:'#64748B', marginBottom:'5px', display:'flex', alignItems:'center', gap:'5px' }}>
                    <Fuel size={13}/> Carburant — <span style={{ color: carburant < 25 ? RED : carburant < 50 ? AMBER : GREEN, fontWeight:'800' }}>{carburant}%</span>
                  </label>
                  <input type="range" min="0" max="100" step="5" value={carburant}
                    onChange={e => setCarburant(parseInt(e.target.value))}
                    style={{ width:'100%', accentColor: carburant < 25 ? RED : carburant < 50 ? AMBER : GREEN }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#94A3B8', marginTop:'2px' }}>
                    <span>Vide</span><span>¼</span><span>½</span><span>¾</span><span>Plein</span>
                  </div>
                </div>
              </div>

              {['état', 'technique', 'carrosserie', 'documents'].map(group => (
                <div key={group} style={{ marginBottom:'13px' }}>
                  <div style={{ fontSize:'10px', fontWeight:'800', color:'#94A3B8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px', display:'flex', alignItems:'center', gap:'5px' }}>
                    {GROUP_LABELS[group].icon} {GROUP_LABELS[group].label}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                    {CHECKLIST_ITEMS.filter(i => i.group === group).map(item => {
                      const ok = checklist[item.key];
                      return (
                        <div key={item.key}
                          onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', borderRadius:'9px', cursor:'pointer', border:`1.5px solid ${ok ? '#86EFAC' : '#FECACA'}`, background: ok ? '#F0FFF4' : '#FFF5F5', transition:'all 0.14s' }}>
                          <div style={{ color: ok ? GREEN : RED, flexShrink:0 }}>{item.icon}</div>
                          <span style={{ flex:1, fontSize:'11.5px', fontWeight:'600', color: ok ? '#166534' : RED }}>{item.label}</span>
                          <div style={{ width:'20px', height:'20px', borderRadius:'50%', flexShrink:0, background: ok ? GREEN : RED, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {ok ? <CheckCircle size={12} color="white"/> : <X size={12} color="white"/>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {nbPbChecklist > 0 && (
                <div style={{ background:'#FEF9C3', border:'1px solid #FDE68A', borderRadius:'9px', padding:'9px 12px', fontSize:'12px', color:'#92580A', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px', marginTop:'4px' }}>
                  <AlertTriangle size={13}/> {nbPbChecklist} point(s) à signaler
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Carrosserie */}
          {step === 2 && (
            <div>
              <div style={{ display:'flex', gap:'10px', marginBottom:'13px' }}>
                {Object.entries(CAR_MARKS).map(([type, cfg]) => (
                  <button key={type} onClick={() => setMarkType(type)}
                    style={{ flex:1, padding:'9px', borderRadius:'10px', cursor:'pointer', border:`2px solid ${markType === type ? cfg.color : '#DDE3ED'}`, background: markType === type ? cfg.color + '22' : 'white', color: markType === type ? cfg.color : '#64748B', fontWeight:'800', fontSize:'12.5px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>

              <div style={{ background:'#F8FAFC', borderRadius:'14px', padding:'13px', marginBottom:'13px', border:'1.5px dashed #DDE3ED' }}>
                <div style={{ fontSize:'11px', color:'#64748B', textAlign:'center', marginBottom:'9px', fontWeight:'600', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                  <Minus size={12}/> Cliquez sur une zone pour marquer · Recliquez pour effacer
                </div>
                <div style={{ position:'relative', maxWidth:'400px', margin:'0 auto' }}>
                  <svg viewBox="0 0 400 220" style={{ width:'100%', height:'auto' }}>
                    <rect x="40" y="80" width="320" height="110" rx="20" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2"/>
                    <path d="M 100 80 Q 120 30 200 25 Q 280 30 300 80 Z" fill="#94A3B8" stroke="#64748B" strokeWidth="2"/>
                    <path d="M 115 78 Q 130 42 200 38 Q 270 42 285 78 Z" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1.5"/>
                    <circle cx="110" cy="190" r="28" fill="#374151" stroke="#1F2937" strokeWidth="2"/>
                    <circle cx="110" cy="190" r="16" fill="#6B7280"/>
                    <circle cx="290" cy="190" r="28" fill="#374151" stroke="#1F2937" strokeWidth="2"/>
                    <circle cx="290" cy="190" r="16" fill="#6B7280"/>
                    <rect x="42" y="90" width="30" height="18" rx="6" fill="#FEF9C3" stroke="#FCD34D" strokeWidth="1.5"/>
                    <rect x="328" y="90" width="30" height="18" rx="6" fill="#FEF9C3" stroke="#FCD34D" strokeWidth="1.5"/>
                    <rect x="42" y="130" width="28" height="15" rx="5" fill="#FECACA" stroke="#F87171" strokeWidth="1.5"/>
                    <rect x="330" y="130" width="28" height="15" rx="5" fill="#FECACA" stroke="#F87171" strokeWidth="1.5"/>
                    {marks.map((m, i) => {
                      const zone = CAR_ZONES.find(z => z.id === m.zone);
                      if (!zone) return null;
                      const cx = (zone.x / 100) * 400;
                      const cy = (zone.y / 100) * 220;
                      const cfg = CAR_MARKS[m.type];
                      return (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r="13" fill={cfg.color} opacity="0.88" stroke="white" strokeWidth="2.5"/>
                          <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{m.type === 'eraflure' ? '—' : '●'}</text>
                        </g>
                      );
                    })}
                  </svg>
                  {CAR_ZONES.map(zone => {
                    const hasE = marks.find(m => m.zone === zone.id && m.type === 'eraflure');
                    const hasB = marks.find(m => m.zone === zone.id && m.type === 'bosse');
                    return (
                      <div key={zone.id} onClick={() => addMark(zone)} title={zone.label}
                        style={{ position:'absolute', left:`${zone.x}%`, top:`${zone.y}%`, transform:'translate(-50%,-50%)', width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:`2px dashed ${hasE ? '#F59E0B' : hasB ? RED : 'rgba(100,116,139,0.35)'}`, cursor:'pointer', zIndex:10 }}/>
                    );
                  })}
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:'18px', marginTop:'9px' }}>
                  {Object.entries(CAR_MARKS).map(([type, cfg]) => (
                    <span key={type} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:'700', color:cfg.color }}>
                      <span style={{ width:'11px', height:'11px', borderRadius:'50%', background:cfg.color, display:'inline-block' }}/>
                      {cfg.label} ({marks.filter(m => m.type === type).length})
                    </span>
                  ))}
                </div>
              </div>

              {marks.length > 0 && (
                <div style={{ background:'#FEF9C3', border:'1px solid #FDE68A', borderRadius:'9px', padding:'10px', marginBottom:'13px' }}>
                  <div style={{ fontSize:'11.5px', fontWeight:'800', color:'#92580A', marginBottom:'6px', display:'flex', alignItems:'center', gap:'5px' }}>
                    <AlertTriangle size={13}/> {marks.length} dommage(s) marqué(s)
                  </div>
                  <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                    {marks.map((m, i) => {
                      const cfg = CAR_MARKS[m.type];
                      return <span key={i} style={{ background:'white', border:`1.5px solid ${cfg.color}`, color:cfg.color, padding:'2px 9px', borderRadius:'20px', fontSize:'10.5px', fontWeight:'700', display:'flex', alignItems:'center', gap:'4px' }}>{cfg.icon} {m.label}</span>;
                    })}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize:'10.5px', fontWeight:'800', color:'#64748B', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px', display:'flex', alignItems:'center', gap:'5px' }}>
                  <Shield size={12}/> État général
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'7px' }}>
                  {ETAT_OPTIONS.map(opt => (
                    <div key={opt.value} onClick={() => setEtatGeneral(opt.value)}
                      style={{ textAlign:'center', padding:'11px 6px', borderRadius:'11px', cursor:'pointer', border:`2px solid ${etatGeneral === opt.value ? opt.color : '#DDE3ED'}`, background: etatGeneral === opt.value ? opt.bg : 'white', transition:'all 0.14s' }}>
                      <div style={{ color: etatGeneral === opt.value ? opt.color : '#94A3B8', display:'flex', justifyContent:'center', marginBottom:'4px' }}>{opt.icon}</div>
                      <div style={{ fontSize:'10.5px', fontWeight:'700', color: etatGeneral === opt.value ? opt.color : '#64748B' }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Bilan */}
          {step === 3 && (
            <div>
              <div style={{ background:`linear-gradient(135deg,${scoreColor}22,white)`, border:`2px solid ${scoreColor}`, borderRadius:'14px', padding:'16px', textAlign:'center', marginBottom:'16px' }}>
                <div style={{ fontSize:'52px', fontWeight:'900', color:scoreColor, lineHeight:1 }}>{score}</div>
                <div style={{ fontSize:'12.5px', fontWeight:'700', color:scoreColor, marginTop:'4px' }}>Score de Retour / 100</div>
                <div style={{ fontSize:'11px', color:'#64748B', marginTop:'3px' }}>
                  {score >= 80 ? '✅ Excellent retour' : score >= 60 ? '⚠️ Retour acceptable avec réserves' : '❌ Retour avec dommages — à signaler'}
                </div>
                <div style={{ background:'#F0F2F5', borderRadius:'8px', height:'10px', marginTop:'10px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${score}%`, background:scoreColor, borderRadius:'8px', transition:'width 0.5s' }}/>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'13px' }}>
                {[
                  { icon:<ClipboardList size={16}/>, label:'Checklist', value:`${CHECKLIST_ITEMS.length - nbPbChecklist}/${CHECKLIST_ITEMS.length}`, ok: nbPbChecklist === 0 },
                  { icon:<Shield size={16}/>,        label:'Dommages',  value: nbMarks, ok: nbMarks === 0 },
                  { icon:<Car size={16}/>,           label:'État',      value: ETAT_OPTIONS.find(o => o.value === etatGeneral)?.label, ok: etatGeneral === 'excellent' || etatGeneral === 'bon' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign:'center', padding:'12px', borderRadius:'11px', background: item.ok ? '#F0FFF4' : '#FFF5F5', border:`1.5px solid ${item.ok ? '#86EFAC' : '#FECACA'}` }}>
                    <div style={{ color: item.ok ? GREEN : RED, display:'flex', justifyContent:'center', marginBottom:'4px' }}>{item.icon}</div>
                    <div style={{ fontWeight:'800', fontSize:'14px', color: item.ok ? GREEN : RED }}>{item.value}</div>
                    <div style={{ fontSize:'10px', color:'#64748B', fontWeight:'600' }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {kilometrage && (
                <div style={{ background:'#EFF4FB', borderRadius:'9px', padding:'10px 13px', marginBottom:'11px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'12px', color:'#64748B', fontWeight:'600', display:'flex', alignItems:'center', gap:'5px' }}><Gauge size={13}/> Kilométrage retour</span>
                  <span style={{ fontWeight:'800', color:NAVY, fontSize:'14px' }}>{parseInt(kilometrage).toLocaleString()} km</span>
                </div>
              )}

              <div>
                <label style={{ fontSize:'11.5px', fontWeight:'700', color:'#64748B', display:'flex', alignItems:'center', gap:'5px', marginBottom:'6px' }}>
                  <FileText size={12}/> Notes & observations
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Décrivez l'état général, dommages observés..." rows={4}
                  style={{ width:'100%', padding:'10px', border:'1.5px solid #DDE3ED', borderRadius:'9px', fontSize:'12.5px', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }}/>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'13px 22px', borderTop:'1px solid #F0F2F5', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F8FAFC', flexShrink:0 }}>
          <div style={{ fontSize:'11.5px', color:'#64748B', fontWeight:'600', display:'flex', alignItems:'center', gap:'5px' }}>
            <span>Étape {step}/{steps.length}</span>
            {step === 1 && !kilometrage && <span style={{ color:RED, fontWeight:'700', display:'flex', alignItems:'center', gap:'3px' }}><AlertTriangle size={11}/> km obligatoire</span>}
            {step === 1 && nbPbChecklist > 0 && <span style={{ color:AMBER }}> · {nbPbChecklist} point(s)</span>}
            {step === 2 && nbMarks > 0 && <span style={{ color:RED }}> · {nbMarks} dommage(s)</span>}
            {step === 3 && <span style={{ color:scoreColor, fontWeight:'800' }}> · Score: {score}/100</span>}
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ padding:'8px 16px', background:'white', color:NAVY, border:`1.5px solid ${NAVY}`, borderRadius:'9px', cursor:'pointer', fontWeight:'700', fontSize:'12.5px', display:'flex', alignItems:'center', gap:'4px' }}>
                <ChevronRight size={14} style={{ transform:'rotate(180deg)' }}/> Retour
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)}
                style={{ padding:'8px 20px', background:NAVY, color:'white', border:'none', borderRadius:'9px', cursor:'pointer', fontWeight:'700', fontSize:'12.5px', display:'flex', alignItems:'center', gap:'4px' }}>
                Suivant <ChevronRight size={14}/>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding:'8px 20px', background:GREEN, color:'white', border:'none', borderRadius:'9px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight:'800', fontSize:'12.5px', display:'flex', alignItems:'center', gap:'4px', opacity: submitting ? 0.7 : 1 }}>
                <CheckCircle size={14}/> {submitting ? 'Enregistrement...' : "Valider l'inspection"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetourCheckModal;