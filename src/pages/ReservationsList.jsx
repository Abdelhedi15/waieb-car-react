import { useState, useEffect, useCallback } from 'react';
import {
  List, RefreshCw, Search, SlidersHorizontal,
  User, Car, Banknote, CalendarDays, AlertTriangle,
  CheckCircle, Clock, XCircle, Flag, Phone, Mail,
  CreditCard, ChevronRight, Bell, ArrowRight, Send,
  ClipboardList, TrendingUp, Shield,
} from 'lucide-react';
import api from '../api/axios';
import Pagination from '../components/Pagination';
import RetourCheckModal from './RetourCheckModal';

const NAVY = '#1B3A6B';
const GRAY = '#64748B';
const GREEN = '#16A34A';
const RED = '#DC2626';
const AMBER = '#D97706';
const PURPLE = '#7C3AED';

const ITEMS_PER_PAGE = 6;

const CAR_PHOTOS = {
  renault:'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=300&q=70',
  peugeot:'https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=300&q=70',
  volkswagen:'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=300&q=70',
  toyota:'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=300&q=70',
  hyundai:'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=300&q=70',
  dacia:'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=300&q=70',
  kia:'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=300&q=70',
  default:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=70',
};
const IMMAT={'240TN5082':'https://i.ibb.co/FZmVWK6/vec1.jpg','259TN5651':'https://i.ibb.co/F4SbDBMM/vec2.jpg','243TN1422':'https://i.ibb.co/gbw2JtTH/vec3.jpg','236TN5648':'https://i.ibb.co/0RJ31jBB/vec4.jpg','234TN2126':'https://i.ibb.co/prkyKtjv/vec5.jpg','244TN7005':'https://i.ibb.co/P81vS80/vec6.jpg','251TN1694':'https://i.ibb.co/5WBKGTGL/vec7.jpg','252TN3310':'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80','253TN4421':'https://i.ibb.co/jvRzYcDB/vec9.png','254TN6632':'https://i.ibb.co/hxvysSY4/vec10.png','255TN7743':'https://i.ibb.co/dsfz2VnP/vec11.png','256TN8854':'https://i.ibb.co/35ccmkFY/vec12.jpg','257TN1301':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155233/vec13_jwhixy.jpg','258TN1402':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155237/vec14_emprhi.jpg','259TN1503':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec15_y7lazd.jpg','260TN1604':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec16_pkydhf.jpg','261TN1705':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec17_z2iw32.jpg','262TN1806':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155234/vec18_byuiqk.jpg','263TN1907':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec19_g9yvnw.jpg','264TN2008':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec20_kvsoqj.jpg','265TN2109':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155235/vec21_bjkcyt.jpg','266TN2210':'https://res.cloudinary.com/dmv2bu8n7/image/upload/v1780155236/vec22_gkpzax.jpg'};

const getCarPhoto=(v)=>{
  if(IMMAT[v?.immatriculation]) return IMMAT[v?.immatriculation];
  if(v?.photo){const p=String(v.photo);if(p.startsWith('http'))return p;return `https://web-production-e6e97.up.railway.app${p}`;}
  return CAR_PHOTOS[(v?.marque||'').toLowerCase()]||CAR_PHOTOS.default;
};

const statutCfg={
  en_attente:{bg:'#FEF9C3',color:'#92400E',label:'En attente', icon:<Clock size={11}/>},
  confirmée: {bg:'#DCFCE7',color:'#166534',label:'Confirmée',  icon:<CheckCircle size={11}/>},
  terminée:  {bg:'#DBEAFE',color:NAVY,     label:'Terminée',   icon:<Flag size={11}/>},
  annulée:   {bg:'#FEE2E2',color:RED,      label:'Annulée',    icon:<XCircle size={11}/>},
};

const detectDoublons=(reservations)=>{
  const actives=reservations.filter(r=>['confirmée','en_attente'].includes(r.statut));
  const ids=new Set();
  for(let i=0;i<actives.length;i++){
    for(let j=i+1;j<actives.length;j++){
      const a=actives[i],b=actives[j];
      if(a.vehicle!==b.vehicle) continue;
      if(new Date(a.date_debut)<=new Date(b.date_fin)&&new Date(b.date_debut)<=new Date(a.date_fin)){
        ids.add(a.id);ids.add(b.id);
      }
    }
  }
  return ids;
};

// ── Payment bar component
const PayBar=({solde,reservation})=>{
  if(!solde) return(
    <div style={{fontSize:'13px',color:GRAY}}>
      <div>Total: <strong style={{color:NAVY}}>{reservation.montant_total||'—'} DT</strong></div>
      <div style={{marginTop:'3px'}}>Acompte: <strong style={{color:AMBER}}>{reservation.acompte||'—'} DT</strong></div>
    </div>
  );
  const pct=solde.montant_total>0?Math.min(100,(solde.total_paye/solde.montant_total)*100):0;
  const isSolde=solde.montant_restant<=0;
  const barColor=isSolde?GREEN:pct>60?NAVY:AMBER;
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',marginBottom:'10px'}}>
        {[
          {label:'TOTAL',  value:`${solde.montant_total} DT`,color:NAVY, bg:'#F8FAFC'},
          {label:'ACOMPTE',value:`${solde.acompte} DT`,     color:AMBER,bg:'#FFFBEB'},
          {label:'RESTANT',value:isSolde?'Soldé':`${solde.montant_restant} DT`,color:isSolde?GREEN:AMBER,bg:isSolde?'#F0FFF4':'#FFFBEB'},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:'6px',padding:'7px 8px',textAlign:'center',border:`1px solid ${s.bg==='#F0FFF4'?'#86EFAC':s.bg==='#FFFBEB'?'#FDE68A':'#E2E8F0'}`}}>
            <div style={{fontSize:'9px',color:'#94A3B8',fontWeight:'700',letterSpacing:'0.5px',marginBottom:'2px'}}>{s.label}</div>
            <div style={{fontWeight:'700',color:s.color,fontSize:'12px'}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:'8px'}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:GRAY,marginBottom:'3px',fontWeight:'600'}}>
          <span>Progression</span>
          <span style={{fontWeight:'700',color:barColor}}>{pct.toFixed(0)}%</span>
        </div>
        <div style={{background:'#F1F5F9',borderRadius:'4px',height:'6px',overflow:'hidden'}}>
          <div style={{background:barColor,height:'100%',width:`${pct}%`,borderRadius:'4px',transition:'width 0.4s'}}/>
        </div>
      </div>
      <div style={{display:'flex',gap:'6px',fontSize:'11px'}}>
        <span style={{display:'flex',alignItems:'center',gap:'4px',color:parseFloat(solde.acompte)>0?NAVY:GRAY}}>
          {parseFloat(solde.acompte)>0?<CheckCircle size={12} color={NAVY}/>:<Clock size={12} color={GRAY}/>}
          Acompte {parseFloat(solde.acompte)>0?`${solde.acompte} DT`:'—'}
        </span>
        <ChevronRight size={12} color="#CBD5E1"/>
        <span style={{display:'flex',alignItems:'center',gap:'4px',color:parseFloat(solde.total_paiements)>0?NAVY:GRAY}}>
          {parseFloat(solde.total_paiements)>0?<CheckCircle size={12} color={NAVY}/>:<Clock size={12} color={GRAY}/>}
          Paiements {parseFloat(solde.total_paiements)>0?`${solde.total_paiements} DT`:'—'}
        </span>
        <ChevronRight size={12} color="#CBD5E1"/>
        <span style={{display:'flex',alignItems:'center',gap:'4px',color:isSolde?GREEN:GRAY}}>
          {isSolde?<CheckCircle size={12} color={GREEN}/>:<Clock size={12} color={GRAY}/>}
          {isSolde?'Soldé':'En attente'}
        </span>
      </div>
    </div>
  );
};

// ── Inspection banner
const InspectionBanner=({reservations,clients,vehicles,onOpen})=>{
  if(!reservations||reservations.length===0) return null;
  return(
    <div style={{background:'white',border:'1px solid #E2E8F0',borderLeft:`4px solid ${PURPLE}`,borderRadius:'10px',padding:'14px 18px',marginBottom:'16px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
        <ClipboardList size={18} color={PURPLE}/>
        <div style={{flex:1}}>
          <span style={{fontWeight:'700',color:'#0F172A',fontSize:'14px'}}>
            {reservations.length} retour{reservations.length>1?'s':''} à inspecter aujourd'hui
          </span>
          <span style={{marginLeft:'8px',fontSize:'11px',color:GRAY}}>Inspection obligatoire avant clôture</span>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
        {reservations.map(r=>{
          const cl=clients?.find(c=>c.id===r.client);
          const vh=vehicles?.find(v=>v.id===r.vehicle);
          return(
            <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#FAFAFA',border:'1px solid #F1F5F9',borderRadius:'8px',padding:'10px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <img src={getCarPhoto(vh)} alt="" style={{width:'48px',height:'36px',objectFit:'cover',borderRadius:'6px'}} onError={e=>{e.target.src=CAR_PHOTOS.default;}}/>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{fontWeight:'700',color:'#0F172A',fontSize:'13px'}}>Rés. #{r.id}</span>
                    <span style={{background:'#FEE2E2',color:RED,padding:'1px 7px',borderRadius:'4px',fontSize:'10px',fontWeight:'700'}}>AUJOURD'HUI</span>
                  </div>
                  <div style={{fontSize:'11.5px',color:GRAY,marginTop:'2px'}}>
                    {vh?`${vh.marque} ${vh.modele} (${vh.immatriculation})`:'—'} · {cl?`${cl.prenom} ${cl.nom}`:'—'}
                  </div>
                </div>
              </div>
              <button onClick={()=>onOpen(r)}
                style={{padding:'7px 16px',background:PURPLE,color:'white',border:'none',borderRadius:'7px',cursor:'pointer',fontWeight:'700',fontSize:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
                <ClipboardList size={13}/> Inspecter
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Mobile pending panel
const MobilePanel=({pending,clients,vehicles,onAction})=>{
  const [proc,setProc]=useState({});
  if(pending.length===0) return null;
  const handle=async(id,action)=>{setProc(p=>({...p,[id]:action}));await onAction(id,action);setProc(p=>{const n={...p};delete n[id];return n;});};
  return(
    <div style={{background:'white',border:'1px solid #E2E8F0',borderLeft:`4px solid ${AMBER}`,borderRadius:'10px',padding:'14px 18px',marginBottom:'16px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
        <Bell size={18} color={AMBER}/>
        <span style={{fontWeight:'700',color:'#0F172A',fontSize:'14px'}}>{pending.length} demande{pending.length>1?'s':''} mobile en attente</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {pending.map(r=>{
          const cl=clients.find(c=>c.id===r.client);
          const vh=vehicles.find(v=>v.id===r.vehicle);
          const days=Math.max(1,Math.round((new Date(r.date_fin)-new Date(r.date_debut))/86400000));
          const ip=proc[r.id];
          return(
            <div key={r.id} style={{display:'grid',gridTemplateColumns:'44px 1fr auto auto',alignItems:'center',gap:'12px',background:'#FAFAFA',border:'1px solid #F1F5F9',borderRadius:'8px',padding:'10px 14px'}}>
              <img src={getCarPhoto(vh)} alt="" style={{width:'44px',height:'34px',objectFit:'cover',borderRadius:'6px'}} onError={e=>{e.target.src=CAR_PHOTOS.default;}}/>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'2px'}}>
                  <strong style={{fontSize:'13px',color:NAVY}}>Rés. #{r.id}</strong>
                  <span style={{background:'#FEF9C3',color:'#92400E',padding:'1px 6px',borderRadius:'4px',fontSize:'10px',fontWeight:'700'}}>Mobile</span>
                </div>
                <div style={{fontSize:'12px',color:GRAY}}>{vh?`${vh.marque} ${vh.modele}`:'—'} · {cl?`${cl.prenom} ${cl.nom}`:`#${r.client}`} · {days}j</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:'700',fontSize:'14px',color:GREEN}}>{r.montant_total} DT</div>
                <div style={{fontSize:'10px',color:GRAY}}>Acompte: {r.acompte} DT</div>
              </div>
              <div style={{display:'flex',gap:'6px'}}>
                <button onClick={()=>handle(r.id,'annulée')} disabled={!!ip} style={{padding:'6px 12px',background:'#FFF5F5',color:RED,border:`1px solid ${RED}`,borderRadius:'6px',cursor:'pointer',fontWeight:'700',fontSize:'12px',opacity:ip?0.6:1}}>
                  <XCircle size={13}/>
                </button>
                <button onClick={()=>handle(r.id,'confirmée')} disabled={!!ip} style={{padding:'6px 12px',background:GREEN,color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'700',fontSize:'12px',opacity:ip?0.6:1}}>
                  <CheckCircle size={13}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Accident modal (minimal)
const AccidentModal=({reservation,client,vehicle,vehicles,onClose,onConfirm})=>{
  const [sel,setSel]=useState(null);
  const [newFin,setNewFin]=useState(reservation.date_fin);
  const [avail,setAvail]=useState([]);
  const [loading,setLoading]=useState(true);
  const [step,setStep]=useState(1);
  useEffect(()=>{
    (async()=>{
      try{const r=await api.get(`/vehicles/available/?date_debut=${reservation.date_debut}&date_fin=${reservation.date_fin}`);const pRef=parseFloat(vehicle?.prix_journalier||0);setAvail(r.data.filter(v=>v.id!==reservation.vehicle&&parseFloat(v.prix_journalier)>=pRef*0.7&&parseFloat(v.prix_journalier)<=pRef*1.3));}
      catch{setAvail([]);}finally{setLoading(false);}
    })();
  },[reservation,vehicle]);
  const days=Math.max(1,Math.round((new Date(newFin)-new Date(reservation.date_debut))/86400000));
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:'600px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'20px'}}>
          {['Notification','Remplacement','Confirmation'].map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:'6px',flex:1}}>
              <div style={{width:'24px',height:'24px',borderRadius:'50%',background:step>i?NAVY:step===i+1?'#E2E8F0':'#F1F5F9',color:step>i?'white':GRAY,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'11px',flexShrink:0}}>{step>i+1?'✓':i+1}</div>
              <span style={{fontSize:'11px',fontWeight:'600',color:step===i+1?NAVY:GRAY,flex:1}}>{s}</span>
              {i<2&&<ChevronRight size={13} color="#CBD5E1"/>}
            </div>
          ))}
        </div>
        {step===1&&(
          <>
            <div style={{background:'#FFF5F5',border:'1px solid #FECACA',borderRadius:'8px',padding:'14px',marginBottom:'16px'}}>
              <div style={{fontWeight:'700',color:RED,fontSize:'13px',marginBottom:'6px',display:'flex',alignItems:'center',gap:'6px'}}><AlertTriangle size={14}/> Accident — Rés. #{reservation.id}</div>
              <div style={{fontSize:'13px',color:GRAY}}>{vehicle?.marque} {vehicle?.modele} · {reservation.date_debut} → {reservation.date_fin}</div>
            </div>
            {client&&<div style={{background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:'8px',padding:'14px',marginBottom:'16px'}}>
              <div style={{fontWeight:'700',fontSize:'14px',color:'#0F172A',marginBottom:'8px'}}>{client.prenom} {client.nom}</div>
              {client.telephone&&<div style={{fontSize:'12.5px',color:GRAY,display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}><Phone size={12}/>{client.telephone}</div>}
              {client.email&&<div style={{fontSize:'12.5px',color:GRAY,display:'flex',alignItems:'center',gap:'6px'}}><Mail size={12}/>{client.email}</div>}
            </div>}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={onClose}>Fermer</button>
              <button className="btn btn-primary" onClick={()=>setStep(2)} style={{display:'flex',alignItems:'center',gap:'6px'}}>Proposer remplacement <ChevronRight size={14}/></button>
            </div>
          </>
        )}
        {step===2&&(
          <>
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'11px',color:GRAY,fontWeight:'600',display:'block',marginBottom:'4px'}}>Nouvelle date fin</label>
              <input type="date" value={newFin} min={reservation.date_debut} onChange={e=>setNewFin(e.target.value)}/>
            </div>
            {loading?<div style={{textAlign:'center',padding:'24px',color:GRAY}}>Recherche...</div>
            :avail.length===0?<div style={{background:'#FFF5F5',borderRadius:'8px',padding:'14px',textAlign:'center',color:RED,fontWeight:'600',fontSize:'13px'}}>Aucun véhicule similaire disponible.</div>
            :<div style={{display:'flex',flexDirection:'column',gap:'7px',maxHeight:'200px',overflowY:'auto'}}>
              {avail.map(v=>{const isSel=sel?.id===v.id;return(
                <div key={v.id} onClick={()=>setSel(v)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 14px',border:`1.5px solid ${isSel?NAVY:'#E2E8F0'}`,borderRadius:'8px',cursor:'pointer',background:isSel?'#F8FAFC':'white'}}>
                  <img src={getCarPhoto(v)} alt="" style={{width:'56px',height:'40px',objectFit:'cover',borderRadius:'6px'}} onError={e=>{e.target.src=CAR_PHOTOS.default;}}/>
                  <div style={{flex:1}}><div style={{fontWeight:'600',fontSize:'13px'}}>{v.marque} {v.modele}</div><div style={{fontSize:'12px',color:GRAY}}>{v.immatriculation}</div></div>
                  <span style={{fontWeight:'700',color:GREEN,fontSize:'13px'}}>{v.prix_journalier} DT/j</span>
                </div>
              );})}
            </div>}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={()=>setStep(1)}>Retour</button>
              <button className="btn btn-primary" disabled={!sel} onClick={()=>setStep(3)} style={{opacity:sel?1:0.5}}>Confirmer <ChevronRight size={14}/></button>
            </div>
          </>
        )}
        {step===3&&sel&&(
          <>
            <div style={{background:'#F8FAFC',borderRadius:'8px',padding:'14px',marginBottom:'16px'}}>
              {[{l:'Nouveau véhicule',v:`${sel.marque} ${sel.modele} (${sel.immatriculation})`},{l:'Client',v:`${client?.prenom} ${client?.nom}`},{l:'Période',v:`${reservation.date_debut} → ${newFin}`},{l:'Nouveau total',v:`${(days*parseFloat(sel.prix_journalier)).toFixed(2)} DT`}].map(row=>(
                <div key={row.l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F1F5F9',fontSize:'13px'}}>
                  <span style={{color:GRAY}}>{row.l}</span><strong style={{color:'#0F172A'}}>{row.v}</strong>
                </div>
              ))}
            </div>
            {client?.email&&<div style={{background:'#F0FFF4',border:'1px solid #86EFAC',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px',fontSize:'12.5px',color:GREEN}}><Send size={14}/>Email envoyé à <strong>{client.email}</strong></div>}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={()=>setStep(2)}>Retour</button>
              <button className="btn btn-primary" style={{background:GREEN,display:'flex',alignItems:'center',gap:'6px'}} onClick={()=>onConfirm(sel,newFin,reservation,client)}><CheckCircle size={14}/> Confirmer</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function ReservationsList(){
  const [reservations,setReservations]=useState([]);
  const [clients,setClients]=useState([]);
  const [vehicles,setVehicles]=useState([]);
  const [contracts,setContracts]=useState([]);
  const [soldes,setSoldes]=useState({});
  const [search,setSearch]=useState('');
  const [filterStatut,setFilterStatut]=useState('');
  const [filterAccident,setFilterAccident]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [page,setPage]=useState(1);
  const [accidentModal,setAccidentModal]=useState(null);
  const [retourModal,setRetourModal]=useState(null);

  const fetchSoldes=async(list)=>{
    const map={};
    await Promise.all(list.map(async r=>{try{const res=await api.get(`/payments/solde/${r.id}/`);map[r.id]=res.data;}catch{}}));
    setSoldes(map);
  };

  const fetchAll=useCallback(async()=>{
    try{
      const [r,c,v,ct]=await Promise.all([api.get('/reservations/'),api.get('/clients/'),api.get('/vehicles/'),api.get('/contracts/')]);
      setReservations(r.data);setClients(c.data);setVehicles(v.data);setContracts(ct.data);
      await fetchSoldes(r.data);
    }catch(e){console.error(e);}
  },[]);

  useEffect(()=>{fetchAll();const i=setInterval(fetchAll,10000);return()=>clearInterval(i);},[fetchAll]);

  const handleRefresh=async()=>{setRefreshing(true);await fetchAll();setRefreshing(false);};
  const handleAction=async(id,s)=>{try{await api.patch(`/reservations/${id}/`,{statut:s});await fetchAll();}catch(e){console.error(e);}};

  const today=new Date();today.setHours(0,0,0,0);

  const aInspecter=reservations.filter(r=>{
    if(r.statut!=='confirmée'||r.inspection_retour_faite) return false;
    const f=new Date(r.date_fin);f.setHours(0,0,0,0);
    return f.getTime()===today.getTime();
  });

  const handleRetourConfirm=async(data)=>{
    try{
      await api.patch(`/reservations/${data.reservation_id}/`,{inspection_retour_faite:true,statut:'terminée',etat_retour:data.etat_retour,notes_retour:data.notes_retour,score_retour:data.score_retour,kilometrage_retour:data.kilometrage_retour,carburant_retour:data.carburant_retour,eraflures_retour:data.eraflures_retour,bosses_retour:data.bosses_retour});
      try{await api.patch(`/vehicles/${retourModal.vehicle.id}/`,{statut:'disponible',etat_carrosserie:data.etat_retour==='dommages'?'dommages':data.etat_retour==='defauts'?'defauts':'excellent',...(data.kilometrage_retour?{kilometrage:data.kilometrage_retour}:{})});}
      catch(e){console.warn('[retour] vehicle skip',e?.response?.status);}
      await fetchAll();setRetourModal(null);
    }catch(e){alert('Erreur: '+JSON.stringify(e.response?.data));}
  };

  const getClient=id=>clients.find(c=>c.id===id);
  const getVehicle=id=>vehicles.find(v=>v.id===id);
  const getContract=id=>contracts.find(c=>c.reservation===id);
  const doublonIds=detectDoublons(reservations);

  const filtered=reservations.filter(r=>{
    const cl=getClient(r.client),ve=getVehicle(r.vehicle);
    const str=`${cl?.nom} ${cl?.prenom} ${cl?.cin} ${ve?.marque} ${ve?.modele} ${ve?.immatriculation}`.toLowerCase();
    return str.includes(search.toLowerCase())&&(filterStatut?r.statut===filterStatut:true)&&(filterAccident?r.a_accident===true:true);
  }).sort((a,b)=>{
    const finA=new Date(a.date_fin);finA.setHours(0,0,0,0);
    const finB=new Date(b.date_fin);finB.setHours(0,0,0,0);
    const debutA=new Date(a.date_debut);const debutB=new Date(b.date_debut);
    const urgA=finA.getTime()===today.getTime()&&a.statut==='confirmée'&&!a.inspection_retour_faite;
    const urgB=finB.getTime()===today.getTime()&&b.statut==='confirmée'&&!b.inspection_retour_faite;
    if(urgA&&!urgB) return -1;if(!urgA&&urgB) return 1;
    const doubA=doublonIds.has(a.id),doubB=doublonIds.has(b.id);
    if(doubA&&!doubB) return -1;if(!doubA&&doubB) return 1;
    const actA=debutA<=today&&finA>=today,actB=debutB<=today&&finB>=today;
    if(actA&&!actB) return -1;if(!actA&&actB) return 1;
    return b.id-a.id;
  });

  const totalRestant=Object.values(soldes).reduce((s,x)=>s+Math.max(0,x.montant_restant||0),0);
  const totalEncaisse=Object.values(soldes).reduce((s,x)=>s+(x.total_paye||0),0);
  const nbSoldes=Object.values(soldes).filter(x=>x.montant_restant<=0).length;
  const nbAcc=reservations.filter(r=>r.a_accident).length;
  const totalPages=Math.ceil(filtered.length/ITEMS_PER_PAGE);
  const paginated=filtered.slice((page-1)*ITEMS_PER_PAGE,page*ITEMS_PER_PAGE);

  const handleConfirmReplacement=async(newVeh,newFin,res,cl)=>{
    try{
      const days=Math.max(1,Math.round((new Date(newFin)-new Date(res.date_debut))/86400000));
      const total=(days*parseFloat(newVeh.prix_journalier)).toFixed(2);
      const acomptePct=days<=3?0.20:days<=7?0.30:days<=14?0.40:0.50;
      await api.patch(`/reservations/${res.id}/`,{vehicle:newVeh.id,date_fin:newFin,vehicule_remplace:res.vehicle,raison_remplacement:'Accident',montant_total:total,acompte:(parseFloat(total)*acomptePct).toFixed(2)});
      if(cl?.email){try{const oldVeh=getVehicle(res.vehicle);await api.post('/vehicles/send-replacement-email/',{client_email:cl.email,client_nom:cl.nom,client_prenom:cl.prenom,ancien_vehicule:`${oldVeh?.marque} ${oldVeh?.modele}`,nouveau_vehicule:`${newVeh.marque} ${newVeh.modele}`,date_debut:res.date_debut,date_fin:newFin,reservation_id:res.id,nouveau_total:total});}catch{}}
      await fetchAll();setAccidentModal(null);
    }catch(e){alert('Erreur: '+JSON.stringify(e.response?.data));}
  };

  return(
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h1 style={{margin:0,fontSize:'22px',fontWeight:'800',color:'#0F172A',display:'flex',alignItems:'center',gap:'10px'}}>
          <List size={22} color={NAVY}/> Liste des Réservations
        </h1>
        <button onClick={handleRefresh} disabled={refreshing}
          style={{padding:'8px 16px',background:NAVY,color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}>
          <RefreshCw size={14} style={{animation:refreshing?'spin 1s linear infinite':'none'}}/> {refreshing?'Actualisation...':'Actualiser'}
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'20px'}}>
        {[
          {label:'Total',           value:reservations.length,            color:NAVY,  bg:'#F8FAFC', icon:<List size={17}/>,        border:NAVY},
          {label:'Total encaissé',  value:`${totalEncaisse.toFixed(0)} DT`,color:GREEN,bg:'#F0FFF4', icon:<TrendingUp size={17}/>,  border:GREEN},
          {label:'Total restant',   value:`${totalRestant.toFixed(0)} DT`, color:AMBER,bg:'#FFFBEB', icon:<Clock size={17}/>,       border:AMBER},
          {label:'Soldées',         value:`${nbSoldes}/${reservations.length}`,color:NAVY,bg:'#F8FAFC',icon:<CheckCircle size={17}/>,border:NAVY},
          {label:'Avec accidents',  value:nbAcc,                           color:nbAcc>0?RED:GREEN,bg:nbAcc>0?'#FFF5F5':'#F0FFF4',icon:<AlertTriangle size={17}/>,border:nbAcc>0?RED:GREEN},
        ].map(s=>(
          <div key={s.label} style={{background:'white',borderRadius:'10px',padding:'14px 16px',border:'1px solid #E2E8F0',borderLeft:`3px solid ${s.border}`,display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'36px',height:'36px',borderRadius:'8px',background:s.bg,color:s.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{s.icon}</div>
            <div>
              <div style={{fontSize:'18px',fontWeight:'800',color:'#0F172A',lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:'11px',color:GRAY,marginTop:'3px',fontWeight:'600'}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Doublon alert */}
      {doublonIds.size>0&&(
        <div style={{background:'white',border:'1px solid #E2E8F0',borderLeft:`4px solid ${AMBER}`,borderRadius:'10px',padding:'12px 18px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'12px'}}>
          <AlertTriangle size={17} color={AMBER}/>
          <div>
            <span style={{fontWeight:'700',fontSize:'13px',color:'#0F172A'}}>{doublonIds.size} réservation(s) en conflit détectée(s)</span>
            <span style={{marginLeft:'8px',fontSize:'12px',color:GRAY}}>Même véhicule réservé sur des dates qui se chevauchent</span>
          </div>
        </div>
      )}

      {/* Inspection banner */}
      <InspectionBanner reservations={aInspecter} clients={clients} vehicles={vehicles}
        onOpen={r=>setRetourModal({reservation:r,client:getClient(r.client),vehicle:getVehicle(r.vehicle)})}/>

      {/* Mobile panel */}
      <MobilePanel pending={reservations.filter(r=>r.statut==='en_attente')} clients={clients} vehicles={vehicles} onAction={handleAction}/>

      {/* Filters */}
      <div style={{background:'white',borderRadius:'10px',border:'1px solid #E2E8F0',padding:'12px 16px',marginBottom:'14px',display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:1,minWidth:'220px'}}>
          <Search size={14} color="#94A3B8" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Rechercher par client, CIN, véhicule..." style={{paddingLeft:'32px',width:'100%'}}/>
        </div>
        <div style={{position:'relative'}}>
          <SlidersHorizontal size={13} color="#94A3B8" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <select value={filterStatut} onChange={e=>{setFilterStatut(e.target.value);setPage(1);}} style={{paddingLeft:'30px',minWidth:'160px'}}>
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="confirmée">Confirmée</option>
            <option value="terminée">Terminée</option>
            <option value="annulée">Annulée</option>
          </select>
        </div>
        <button onClick={()=>{setFilterAccident(!filterAccident);setPage(1);}}
          style={{padding:'7px 14px',background:filterAccident?'#FFF5F5':'white',color:filterAccident?RED:GRAY,border:`1px solid ${filterAccident?RED:'#E2E8F0'}`,borderRadius:'7px',cursor:'pointer',fontWeight:'600',fontSize:'12.5px',display:'flex',alignItems:'center',gap:'6px'}}>
          <AlertTriangle size={13}/> Accidents {filterAccident&&`(${nbAcc})`}
        </button>
        <span style={{fontSize:'12.5px',color:GRAY,fontWeight:'600'}}>
          <strong style={{color:'#0F172A'}}>{filtered.length}</strong> résultat(s)
        </span>
      </div>

      {/* List */}
      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
        {paginated.map(r=>{
          const cl=getClient(r.client),vh=getVehicle(r.vehicle),ct=getContract(r.id),solde=soldes[r.id];
          const days=Math.max(1,Math.round((new Date(r.date_fin)-new Date(r.date_debut))/86400000));
          const st=statutCfg[r.statut]||{bg:'#F1F5F9',color:GRAY,label:r.statut,icon:null};
          const isSolde=solde&&solde.montant_restant<=0;
          const isDoublon=doublonIds.has(r.id);
          const dateFin=new Date(r.date_fin);dateFin.setHours(0,0,0,0);
          const isToday=dateFin.getTime()===today.getTime();
          const needsRetour=isToday&&r.statut==='confirmée'&&!r.inspection_retour_faite;
          const hasAccident=r.a_accident&&!r.vehicule_remplace&&new Date(r.date_debut)>=today&&!isSolde;

          const borderColor=needsRetour?PURPLE:isDoublon?AMBER:r.a_accident?RED:isSolde?'#86EFAC':'#E2E8F0';
          const headerBg=needsRetour?'#FAF5FF':isDoublon?'#FFFBEB':r.statut==='confirmée'?'#F8FAFC':r.statut==='annulée'?'#FFF5F5':'white';

          return(
            <div key={r.id} style={{background:'white',borderRadius:'10px',overflow:'hidden',border:`1px solid ${borderColor}`,borderLeft:`3px solid ${borderColor}`,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
              {/* Card header */}
              <div style={{padding:'10px 16px',background:headerBg,borderBottom:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                  <span style={{fontWeight:'700',color:NAVY,fontSize:'14px'}}>Rés. #{r.id}</span>
                  {ct&&<span style={{color:PURPLE,fontWeight:'600',fontSize:'11.5px',background:'#F3EEFF',padding:'1px 8px',borderRadius:'4px'}}>{ct.numero}</span>}
                  <span style={{background:st.bg,color:st.color,padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',display:'flex',alignItems:'center',gap:'3px'}}>{st.icon} {st.label}</span>
                  {isDoublon&&<span style={{background:'#FEF9C3',color:AMBER,padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',display:'flex',alignItems:'center',gap:'3px'}}><AlertTriangle size={10}/> Doublon</span>}
                  {r.a_accident&&<span style={{background:'#FFF5F5',color:RED,padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',display:'flex',alignItems:'center',gap:'3px'}}><AlertTriangle size={10}/> Accident</span>}
                  {r.vehicule_remplace&&<span style={{background:'#F0FFF4',color:GREEN,padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',display:'flex',alignItems:'center',gap:'3px'}}><CheckCircle size={10}/> Remplacé</span>}
                  {isSolde&&<span style={{background:'#F0FFF4',color:GREEN,padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',display:'flex',alignItems:'center',gap:'3px'}}><CheckCircle size={10}/> Soldé</span>}
                  {r.inspection_retour_faite&&<span style={{background:'#F3EEFF',color:PURPLE,padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',display:'flex',alignItems:'center',gap:'3px'}}><Shield size={10}/> Inspecté</span>}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                  {needsRetour&&(
                    <button onClick={()=>setRetourModal({reservation:r,client:cl,vehicle:vh})}
                      style={{padding:'6px 14px',background:PURPLE,color:'white',border:'none',borderRadius:'7px',cursor:'pointer',fontWeight:'700',fontSize:'12px',display:'flex',alignItems:'center',gap:'5px'}}>
                      <ClipboardList size={13}/> Inspecter maintenant
                    </button>
                  )}
                  {isDoublon&&(
                    <button onClick={async()=>{if(!window.confirm(`Annuler la réservation #${r.id} (doublon) ?`))return;await handleAction(r.id,'annulée');}}
                      style={{padding:'6px 14px',background:'#FFF5F5',color:RED,border:`1px solid ${RED}`,borderRadius:'7px',cursor:'pointer',fontWeight:'700',fontSize:'12px',display:'flex',alignItems:'center',gap:'5px'}}>
                      <XCircle size={13}/> Annuler doublon
                    </button>
                  )}
                  {hasAccident&&(
                    <button onClick={()=>setAccidentModal({reservation:r,client:cl,vehicle:vh})}
                      style={{padding:'6px 14px',background:RED,color:'white',border:'none',borderRadius:'7px',cursor:'pointer',fontWeight:'700',fontSize:'12px',display:'flex',alignItems:'center',gap:'5px'}}>
                      <Bell size={13}/> Notifier & Remplacer
                    </button>
                  )}
                  <div style={{fontSize:'12px',color:GRAY,display:'flex',alignItems:'center',gap:'5px'}}>
                    <CalendarDays size={13}/>
                    {r.date_debut} <ArrowRight size={11}/> {r.date_fin}
                    <span style={{background:'#F1F5F9',padding:'1px 7px',borderRadius:'5px',fontWeight:'700',color:'#0F172A',fontSize:'11px'}}>{days}j</span>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1.3fr'}}>
                {/* Client */}
                <div style={{padding:'14px 16px',borderRight:'1px solid #F1F5F9'}}>
                  <div style={{fontSize:'10px',fontWeight:'700',color:GRAY,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'5px'}}><User size={11}/> Client</div>
                  {cl?(
                    <>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                        <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#EFF4FB',color:NAVY,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'11px',flexShrink:0}}>{cl.prenom?.charAt(0)}{cl.nom?.charAt(0)}</div>
                        <span style={{fontWeight:'700',fontSize:'14px',color:'#0F172A'}}>{cl.prenom} {cl.nom}</span>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                        {cl.cin&&<div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px'}}><CreditCard size={11} color={GRAY}/><span style={{color:GRAY}}>CIN:</span><strong style={{color:'#0F172A'}}>{cl.cin}</strong></div>}
                        {cl.telephone&&<div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:GRAY}}><Phone size={11}/>{cl.telephone}</div>}
                        {cl.permis_number&&<div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:GRAY}}><Shield size={11}/>{cl.permis_number}</div>}
                        {cl.email&&<div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11.5px',color:'#94A3B8'}}><Mail size={11}/>{cl.email}</div>}
                      </div>
                    </>
                  ):<span style={{color:'#94A3B8',fontSize:'13px'}}>—</span>}
                </div>

                {/* Véhicule */}
                <div style={{padding:'14px 16px',borderRight:'1px solid #F1F5F9'}}>
                  <div style={{fontSize:'10px',fontWeight:'700',color:GRAY,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'5px'}}><Car size={11}/> Véhicule</div>
                  {vh?(
                    <>
                      <div style={{borderRadius:'7px',overflow:'hidden',height:'62px',marginBottom:'8px',background:'#F8FAFC'}}>
                        <img src={getCarPhoto(vh)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.src=CAR_PHOTOS.default;}}/>
                      </div>
                      <div style={{fontWeight:'700',fontSize:'13px',color:'#0F172A',marginBottom:'5px'}}>{vh.marque} {vh.modele}</div>
                      <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px'}}>
                          <span style={{background:'#EFF4FB',color:NAVY,padding:'1px 7px',borderRadius:'4px',fontWeight:'700',fontSize:'11px'}}>{vh.immatriculation}</span>
                          {vh.couleur&&<span style={{color:GRAY}}>{vh.couleur}</span>}
                        </div>
                        <div style={{fontSize:'12.5px',color:GREEN,fontWeight:'600',display:'flex',alignItems:'center',gap:'4px'}}><Banknote size={11}/>{vh.prix_journalier} DT/j</div>
                        <div style={{fontSize:'11.5px',color:GRAY}}>{days}j × {vh.prix_journalier} = <strong style={{color:'#0F172A'}}>{(parseFloat(vh.prix_journalier)*days).toFixed(2)} DT</strong></div>
                      </div>
                    </>
                  ):<span style={{color:'#94A3B8',fontSize:'13px'}}>—</span>}
                </div>

                {/* Finances */}
                <div style={{padding:'14px 16px'}}>
                  <div style={{fontSize:'10px',fontWeight:'700',color:GRAY,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'5px'}}><Banknote size={11}/> Situation Financière</div>
                  <PayBar solde={solde} reservation={r}/>
                </div>
              </div>

              {/* Footer notes */}
              {(r.notes||r.accident_description||r.caution)&&(
                <div style={{padding:'8px 16px',background:'#FAFAFA',borderTop:'1px solid #F1F5F9',display:'flex',gap:'14px',fontSize:'12px',flexWrap:'wrap'}}>
                  {r.caution&&<span style={{color:GRAY,display:'flex',alignItems:'center',gap:'4px'}}><Banknote size={11}/>Caution: {r.caution} DT</span>}
                  {r.notes&&<span style={{color:GRAY}}>{r.notes}</span>}
                  {r.accident_description&&<span style={{color:RED,display:'flex',alignItems:'center',gap:'4px'}}><AlertTriangle size={11}/>{r.accident_description}</span>}
                </div>
              )}
              {r.inspection_retour_faite&&r.etat_retour&&(
                <div style={{padding:'8px 16px',background:'#FAF5FF',borderTop:'1px solid #EDE9FE',display:'flex',gap:'14px',fontSize:'12px',flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{color:PURPLE,fontWeight:'600',display:'flex',alignItems:'center',gap:'4px'}}><ClipboardList size={11}/>Inspecté</span>
                  <span style={{color:GRAY}}>État: <strong style={{color:'#0F172A'}}>{r.etat_retour}</strong></span>
                  {r.score_retour!=null&&<span style={{color:r.score_retour>=80?GREEN:r.score_retour>=60?AMBER:RED,fontWeight:'700'}}>Score: {r.score_retour}/100</span>}
                  {r.notes_retour&&<span style={{color:GRAY,fontStyle:'italic'}}>"{r.notes_retour}"</span>}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length===0&&(
          <div style={{background:'white',borderRadius:'10px',border:'1px solid #E2E8F0',textAlign:'center',padding:'48px',color:'#94A3B8'}}>
            <List size={40} color="#E2E8F0" style={{margin:'0 auto 12px'}}/>
            <div style={{fontSize:'14px',fontWeight:'600'}}>Aucune réservation trouvée</div>
          </div>
        )}
      </div>

      {filtered.length>0&&(
        <div style={{background:'white',borderRadius:'10px',border:'1px solid #E2E8F0',marginTop:'14px',padding:'4px'}}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE}/>
        </div>
      )}

      {accidentModal&&<AccidentModal reservation={accidentModal.reservation} client={accidentModal.client} vehicle={accidentModal.vehicle} vehicles={vehicles} onClose={()=>setAccidentModal(null)} onConfirm={handleConfirmReplacement}/>}
      {retourModal&&<RetourCheckModal reservation={retourModal.reservation} client={retourModal.client} vehicle={retourModal.vehicle} onClose={()=>setRetourModal(null)} onConfirm={handleRetourConfirm}/>}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}