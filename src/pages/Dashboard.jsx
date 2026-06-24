import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import {
  LayoutDashboard, Car, Tag, Users, CalendarCheck, Banknote,
  AlertTriangle, ChevronDown, TrendingUp, RotateCcw, UserCheck,
  X, Star, ClipboardList, CheckCircle, ChevronRight,
} from 'lucide-react';
import api from '../api/axios';

const NAVY = '#1B3A6B';
const GRAY = '#64748B';
const GREEN = '#16A34A';
const RED = '#DC2626';
const AMBER = '#D97706';

const getAge = (d) => !d ? 0 : (new Date() - new Date(d)) / (1000*60*60*24*365.25);
const getVendreLabel = (d) => {
  if (!d) return null;
  const v = new Date(new Date(d).getTime() + 3.5*365.25*24*3600*1000);
  return { key:`${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}`, label:`${['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][v.getMonth()]} ${v.getFullYear()}` };
};
const hasDamage = (r) => r.a_accident || r.etat_retour === 'dommages';
const SOLD = ['vendu','a_vendre'];
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function Dashboard() {
  const [reservations,setReservations]=useState([]);
  const [clients,setClients]=useState([]);
  const [vehicles,setVehicles]=useState([]);
  const [contracts,setContracts]=useState([]);
  const [payments,setPayments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [chart,setChart]=useState('activite');
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    (async()=>{
      try {
        const [r,c,v,ct,p] = await Promise.all([
          api.get('/reservations/'),api.get('/clients/'),
          api.get('/vehicles/'),api.get('/contracts/'),api.get('/payments/'),
        ]);
        setReservations(r.data);setClients(c.data);setVehicles(v.data);
        setContracts(ct.data);setPayments(p.data);
      } catch(e){console.error(e);}
      finally{setLoading(false);}
    })();
  },[]);

  const yr = new Date().getFullYear();
  const mo = new Date().getMonth();
  const today = new Date(); today.setHours(0,0,0,0);

  const activeVeh = vehicles.filter(v=>!SOLD.includes(v.statut));
  const aVendre   = activeVeh.filter(v=>getAge(v.date_acquisition)>=3.5);
  const aInspecter = reservations.filter(r=>{
    if(r.statut!=='confirmée'||r.inspection_retour_faite) return false;
    const f=new Date(r.date_fin);f.setHours(0,0,0,0);
    return f.getTime()===today.getTime();
  });

  const totalRevenus   = payments.filter(p=>p.statut==='payé').reduce((s,p)=>s+parseFloat(p.montant),0);
  const totalAccidents = reservations.filter(r=>hasDamage(r)).length;

  const monthlyData = MONTHS.map((m,i)=>{
    const mr = reservations.filter(r=>{const d=new Date(r.date_debut);return d.getFullYear()===yr&&d.getMonth()===i;});
    return {
      mois:m,
      reservations:mr.length,
      accidents:mr.filter(r=>hasDamage(r)).length,
      inspections:mr.filter(r=>r.inspection_retour_faite).length,
      contrats:contracts.filter(ct=>{const d=new Date(ct.date_contrat);return d.getFullYear()===yr&&d.getMonth()===i;}).length,
    };
  });

  const clientsDepenses = clients.map(c=>{
    const ids=reservations.filter(r=>r.client===c.id).map(r=>r.id);
    const paid=payments.filter(p=>ids.includes(p.reservation)).reduce((s,p)=>s+parseFloat(p.montant||0),0);
    const fallback=reservations.filter(r=>r.client===c.id).reduce((s,r)=>s+parseFloat(r.montant_total||0),0);
    return {name:`${c.prenom} ${c.nom}`.substring(0,16),depense:parseFloat((paid>0?paid:fallback).toFixed(2))};
  }).filter(c=>c.depense>0).sort((a,b)=>b.depense-a.depense).slice(0,10);

  const clientsFidelite = clients.map(c=>({
    name:`${c.prenom} ${c.nom}`.substring(0,16),
    reservations:reservations.filter(r=>r.client===c.id).length,
    depense:parseFloat(reservations.filter(r=>r.client===c.id).reduce((s,r)=>s+parseFloat(r.montant_total||0),0).toFixed(2)),
    accidents:reservations.filter(r=>r.client===c.id&&hasDamage(r)).length,
  })).filter(c=>c.reservations>0).sort((a,b)=>b.reservations-a.reservations).slice(0,8);

  const vendreData = (()=>{
    const map={};
    activeVeh.forEach(v=>{
      const d=getVendreLabel(v.date_acquisition);
      if(!d) return;
      if(!map[d.key]) map[d.key]={key:d.key,label:d.label,nb:0};
      map[d.key].nb++;
    });
    return Object.values(map).sort((a,b)=>a.key.localeCompare(b.key));
  })();

  const tauxOccupation = activeVeh.map(v=>({
    name:`${v.marque} ${v.modele}`.substring(0,14),
    reservations:reservations.filter(r=>r.vehicle===v.id).length,
    accidents:reservations.filter(r=>r.vehicle===v.id&&hasDamage(r)).length,
  })).sort((a,b)=>b.reservations-a.reservations).slice(0,12);

  const G={strokeDasharray:'3 3',stroke:'#F1F5F9'};
  const T={fontSize:11,fill:'#94A3B8'};
  const C={borderRadius:'8px',border:'1px solid #E2E8F0',fontSize:'12px',background:'white'};

  const charts=[
    {v:'activite',  label:'Activité mensuelle',     icon:<TrendingUp size={14}/>,   desc:'Réservations, contrats, inspections et dommages'},
    {v:'depenses',  label:'Revenus par client',      icon:<Banknote size={14}/>,     desc:'Montants encaissés par client (DT)'},
    {v:'occupation',label:"Occupation véhicules",    icon:<Car size={14}/>,          desc:'Nombre de réservations par véhicule'},
    {v:'fidelite',  label:'Fidélité clients',        icon:<UserCheck size={14}/>,    desc:'Réservations par client'},
    {v:'accidents', label:'Dommages par mois',       icon:<AlertTriangle size={14}/>,desc:'Accidents et dommages déclarés'},
    {v:'vendre',    label:'Véhicules à renouveler',  icon:<Tag size={14}/>,          desc:'Véhicules atteignant 3.5 ans par mois'},
    {v:'annulations',label:'Annulations clients',    icon:<X size={14}/>,            desc:'Réservations annulées par client'},
    {v:'remplacements',label:'Remplacements véhicules',icon:<RotateCcw size={14}/>,  desc:'Remplacements suite à incident'},
  ];
  const sel=charts.find(c=>c.v===chart)||charts[0];

  const renderChart=()=>{
    const bar=(data,key,color,name,extra=[])=>(
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{top:10,right:20,left:0,bottom:50}}>
          <CartesianGrid {...G}/><XAxis dataKey="name" tick={T} angle={-30} textAnchor="end" interval={0}/>
          <YAxis tick={T}/><Tooltip contentStyle={C}/>
          {extra.map((e,i)=><Bar key={i} dataKey={e.k} fill={e.c} radius={[4,4,0,0]} name={e.n}/>)}
          <Bar dataKey={key} fill={color} radius={[4,4,0,0]} name={name}/>
        </BarChart>
      </ResponsiveContainer>
    );
    switch(chart){
      case 'activite': return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthlyData} margin={{top:10,right:20,left:0,bottom:0}}>
            <CartesianGrid {...G}/><XAxis dataKey="mois" tick={T}/><YAxis tick={T} allowDecimals={false}/>
            <Tooltip contentStyle={C}/><Legend wrapperStyle={{fontSize:'12px'}}/>
            <Line type="monotone" dataKey="reservations" stroke={NAVY}   strokeWidth={2} dot={{r:4}} name="Réservations"/>
            <Line type="monotone" dataKey="contrats"     stroke={GRAY}   strokeWidth={2} dot={{r:4}} name="Contrats"/>
            <Line type="monotone" dataKey="inspections"  stroke={GREEN}  strokeWidth={2} dot={{r:4}} name="Inspections"/>
            <Line type="monotone" dataKey="accidents"    stroke={RED}    strokeWidth={2} dot={{r:4}} name="Dommages" strokeDasharray="5 5"/>
          </LineChart>
        </ResponsiveContainer>
      );
      case 'depenses': return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={clientsDepenses} margin={{top:10,right:20,left:0,bottom:50}}>
            <CartesianGrid {...G}/><XAxis dataKey="name" tick={T} angle={-30} textAnchor="end" interval={0}/>
            <YAxis tick={T}/><Tooltip formatter={v=>`${v} DT`} contentStyle={C}/>
            <Bar dataKey="depense" radius={[4,4,0,0]} name="Dépenses (DT)">
              {clientsDepenses.map((_,i)=><Cell key={i} fill={i===0?NAVY:i===1?'#2D5A9E':i===2?'#4472BE':'#6B8FD4'}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
      case 'occupation': return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={tauxOccupation} margin={{top:10,right:20,left:0,bottom:50}}>
            <CartesianGrid {...G}/><XAxis dataKey="name" tick={T} angle={-30} textAnchor="end" interval={0}/>
            <YAxis tick={T} allowDecimals={false}/><Tooltip contentStyle={C}/><Legend wrapperStyle={{fontSize:'12px'}}/>
            <Bar dataKey="reservations" fill={NAVY}  radius={[4,4,0,0]} name="Réservations"/>
            <Bar dataKey="accidents"    fill={RED}   radius={[4,4,0,0]} name="Dommages"/>
          </BarChart>
        </ResponsiveContainer>
      );
      case 'fidelite': return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={clientsFidelite} margin={{top:10,right:20,left:0,bottom:50}}>
            <CartesianGrid {...G}/><XAxis dataKey="name" tick={T} angle={-30} textAnchor="end" interval={0}/>
            <YAxis tick={T} allowDecimals={false}/><Tooltip contentStyle={C}/><Legend wrapperStyle={{fontSize:'12px'}}/>
            <Bar dataKey="reservations" fill={NAVY} radius={[4,4,0,0]} name="Réservations"/>
            <Bar dataKey="accidents"    fill={RED}  radius={[4,4,0,0]} name="Dommages"/>
          </BarChart>
        </ResponsiveContainer>
      );
      case 'accidents': return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlyData} margin={{top:10,right:20,left:0,bottom:0}}>
            <CartesianGrid {...G}/><XAxis dataKey="mois" tick={T}/><YAxis tick={T} allowDecimals={false}/>
            <Tooltip contentStyle={C}/>
            <Bar dataKey="accidents" fill={RED} radius={[4,4,0,0]} name="Dommages & Accidents"/>
          </BarChart>
        </ResponsiveContainer>
      );
      case 'vendre': return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={vendreData} margin={{top:10,right:20,left:0,bottom:50}}>
            <CartesianGrid {...G}/><XAxis dataKey="label" tick={T} angle={-30} textAnchor="end" interval={0}/>
            <YAxis tick={T} allowDecimals={false}/><Tooltip contentStyle={C}/>
            <Bar dataKey="nb" fill={AMBER} radius={[4,4,0,0]} name="Véhicules à renouveler"/>
          </BarChart>
        </ResponsiveContainer>
      );
      case 'annulations': {
        const data=clients.map(c=>({
          name:`${c.prenom} ${c.nom}`.substring(0,16),
          annulations:reservations.filter(r=>r.client===c.id&&r.statut==='annulée').length,
          total:reservations.filter(r=>r.client===c.id).length,
        })).filter(c=>c.total>0).sort((a,b)=>b.annulations-a.annulations).slice(0,8);
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{top:10,right:20,left:0,bottom:50}}>
              <CartesianGrid {...G}/><XAxis dataKey="name" tick={T} angle={-30} textAnchor="end" interval={0}/>
              <YAxis tick={T} allowDecimals={false}/><Tooltip contentStyle={C}/><Legend wrapperStyle={{fontSize:'12px'}}/>
              <Bar dataKey="total"       fill={NAVY} radius={[4,4,0,0]} name="Total"/>
              <Bar dataKey="annulations" fill={RED}  radius={[4,4,0,0]} name="Annulations"/>
            </BarChart>
          </ResponsiveContainer>
        );
      }
      case 'remplacements': {
        const data=MONTHS.map((m,i)=>({
          mois:m,
          remplacements:reservations.filter(r=>{
            const d=new Date(r.date_debut);
            return d.getFullYear()===yr&&d.getMonth()===i&&r.vehicule_remplace!=null;
          }).length,
        }));
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{top:10,right:20,left:0,bottom:0}}>
              <CartesianGrid {...G}/><XAxis dataKey="mois" tick={T}/><YAxis tick={T} allowDecimals={false}/>
              <Tooltip contentStyle={C}/>
              <Bar dataKey="remplacements" fill={GRAY} radius={[4,4,0,0]} name="Remplacements"/>
            </BarChart>
          </ResponsiveContainer>
        );
      }
      default: return null;
    }
  };

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:'16px',color:GRAY}}>
      <Car size={40} color="#E2E8F0"/>
      <span style={{fontSize:'14px',fontWeight:'600'}}>Chargement...</span>
    </div>
  );

  const stats=[
    {label:'Véhicules actifs', value:activeVeh.length,         icon:<Car size={18}/>,           color:NAVY,  sub:`${vehicles.length} total`},
    {label:'À renouveler',     value:aVendre.length,           icon:<Tag size={18}/>,           color:aVendre.length>0?RED:GREEN, sub:aVendre.length>0?'Dépassé 3.5 ans':'Tous OK'},
    {label:'Clients',          value:clients.length,           icon:<Users size={18}/>,         color:NAVY,  sub:'Enregistrés'},
    {label:'Réservations',     value:reservations.length,      icon:<CalendarCheck size={18}/>, color:NAVY,  sub:`${reservations.filter(r=>r.statut==='confirmée').length} confirmées`},
    {label:'Revenus encaissés',value:`${totalRevenus.toFixed(0)} DT`,icon:<Banknote size={18}/>,color:GREEN,sub:'Paiements reçus'},
    {label:'Dommages déclarés',value:totalAccidents,           icon:<AlertTriangle size={18}/>, color:totalAccidents>0?RED:GREEN, sub:totalAccidents>0?'À surveiller':'Aucun dommage'},
    {label:'À inspecter',      value:aInspecter.length,        icon:<ClipboardList size={18}/>, color:aInspecter.length>0?RED:GREEN, sub:"Aujourd'hui"},
  ];

  return (
    <div style={{maxWidth:'1400px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px'}}>
        <h1 style={{margin:0,fontSize:'22px',fontWeight:'800',color:'#0F172A',display:'flex',alignItems:'center',gap:'10px'}}>
          <LayoutDashboard size={22} color={NAVY}/> Tableau de Bord
        </h1>
        <div style={{fontSize:'12px',color:GRAY,background:'#F8FAFC',padding:'6px 14px',borderRadius:'8px',border:'1px solid #E2E8F0',fontWeight:'600'}}>
          {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </div>
      </div>

      {/* Stats cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'12px',marginBottom:'24px'}}>
        {stats.map(s=>(
          <div key={s.label} style={{
            background:'white',borderRadius:'12px',padding:'16px 14px',
            border:`1px solid ${s.value>0&&(s.label==='À renouveler'||s.label==='Dommages déclarés'||s.label==='À inspecter')&&s.color===RED?'#FECACA':'#E2E8F0'}`,
            borderLeft:`3px solid ${s.color}`,
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
              <div style={{width:'34px',height:'34px',borderRadius:'8px',background:`${s.color}12`,display:'flex',alignItems:'center',justifyContent:'center',color:s.color}}>
                {s.icon}
              </div>
              {s.label==='À inspecter'&&aInspecter.length>0&&(
                <span style={{background:'#FEE2E2',color:RED,borderRadius:'20px',fontSize:'10px',padding:'2px 7px',fontWeight:'800'}}>URGENT</span>
              )}
            </div>
            <div style={{fontSize:'22px',fontWeight:'800',color:'#0F172A',lineHeight:1,marginBottom:'4px'}}>{s.value}</div>
            <div style={{fontSize:'11px',fontWeight:'700',color:GRAY}}>{s.label}</div>
            <div style={{fontSize:'10px',color:'#94A3B8',marginTop:'2px'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerts section */}
      <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'24px'}}>
        {/* Inspection alert */}
        {aInspecter.length>0&&(
          <div style={{background:'white',border:'1px solid #E2E8F0',borderLeft:`4px solid ${RED}`,borderRadius:'10px',padding:'14px 18px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px'}}>
              <ClipboardList size={18} color={RED}/>
              <div style={{flex:1}}>
                <span style={{fontWeight:'700',color:'#0F172A',fontSize:'14px'}}>
                  {aInspecter.length} inspection{aInspecter.length>1?'s':''} à effectuer aujourd'hui
                </span>
                <span style={{marginLeft:'8px',fontSize:'11px',color:GRAY}}>Ces réservations se terminent ce jour</span>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {aInspecter.map(r=>{
                const cl=clients.find(c=>c.id===r.client);
                const vh=vehicles.find(v=>v.id===r.vehicle);
                return (
                  <div key={r.id} style={{background:'#FFF5F5',border:'1px solid #FECACA',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
                    <Car size={13} color={RED}/>
                    <span style={{fontWeight:'700',color:'#0F172A'}}>Rés. #{r.id}</span>
                    <span style={{color:GRAY}}>{vh?.marque} {vh?.modele}</span>
                    <span style={{color:GRAY}}>·</span>
                    <span style={{color:GRAY}}>{cl?.prenom} {cl?.nom}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* À vendre alert */}
        {aVendre.length>0&&(
          <div style={{background:'white',border:'1px solid #E2E8F0',borderLeft:`4px solid ${AMBER}`,borderRadius:'10px',padding:'14px 18px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px'}}>
              <Tag size={18} color={AMBER}/>
              <div style={{flex:1}}>
                <span style={{fontWeight:'700',color:'#0F172A',fontSize:'14px'}}>
                  {aVendre.length} véhicule{aVendre.length>1?'s':''} à renouveler
                </span>
                <span style={{marginLeft:'8px',fontSize:'11px',color:GRAY}}>Dépassé 3.5 ans d'acquisition</span>
              </div>
              <button onClick={()=>setChart('vendre')} style={{padding:'5px 12px',background:NAVY,color:'white',border:'none',borderRadius:'6px',fontSize:'11px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px'}}>
                Voir <ChevronRight size={12}/>
              </button>
            </div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {aVendre.slice(0,4).map(v=>(
                <div key={v.id} style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
                  <Car size={13} color={AMBER}/>
                  <span style={{fontWeight:'700',color:'#0F172A'}}>{v.marque} {v.modele}</span>
                  <span style={{color:GRAY,fontSize:'11px'}}>{v.immatriculation}</span>
                  <span style={{background:'#FEF9C3',color:AMBER,fontSize:'10px',fontWeight:'800',padding:'1px 6px',borderRadius:'4px'}}>{getAge(v.date_acquisition).toFixed(1)}a</span>
                </div>
              ))}
              {aVendre.length>4&&<div style={{background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',color:GRAY,fontWeight:'600'}}>+{aVendre.length-4} autres</div>}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{background:'white',borderRadius:'12px',border:'1px solid #E2E8F0',overflow:'hidden',marginBottom:'24px'}}>
        {/* Chart header */}
        <div style={{padding:'16px 20px',borderBottom:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'34px',height:'34px',background:`${NAVY}12`,borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:NAVY}}>
              {sel.icon}
            </div>
            <div>
              <div style={{fontWeight:'700',fontSize:'14px',color:'#0F172A'}}>{sel.label}</div>
              <div style={{fontSize:'11px',color:GRAY,marginTop:'1px'}}>{sel.desc}</div>
            </div>
          </div>
          <div style={{position:'relative'}}>
            <button onClick={()=>setOpen(!open)}
              style={{padding:'8px 14px',background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:'8px',cursor:'pointer',fontWeight:'600',fontSize:'13px',color:'#0F172A',display:'flex',alignItems:'center',gap:'8px',minWidth:'220px',justifyContent:'space-between'}}>
              <span style={{display:'flex',alignItems:'center',gap:'7px',color:GRAY}}>{sel.icon}{sel.label}</span>
              <ChevronDown size={14} color={GRAY} style={{transform:open?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
            </button>
            {open&&(
              <>
                <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:10}}/>
                <div style={{position:'absolute',right:0,top:'42px',zIndex:11,background:'white',borderRadius:'10px',minWidth:'280px',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',overflow:'hidden',border:'1px solid #E2E8F0'}}>
                  {charts.map(opt=>(
                    <div key={opt.v} onClick={()=>{setChart(opt.v);setOpen(false);}}
                      style={{padding:'10px 16px',cursor:'pointer',background:chart===opt.v?'#F8FAFC':'white',borderLeft:`2px solid ${chart===opt.v?NAVY:'transparent'}`,display:'flex',alignItems:'center',gap:'10px'}}
                      onMouseEnter={e=>{if(chart!==opt.v)e.currentTarget.style.background='#F8FAFC';}}
                      onMouseLeave={e=>{e.currentTarget.style.background=chart===opt.v?'#F8FAFC':'white';}}>
                      <div style={{color:chart===opt.v?NAVY:GRAY,display:'flex',alignItems:'center'}}>{opt.icon}</div>
                      <div>
                        <div style={{fontWeight:'600',fontSize:'13px',color:chart===opt.v?NAVY:'#0F172A'}}>{opt.label}</div>
                        <div style={{fontSize:'11px',color:'#94A3B8',marginTop:'1px'}}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{padding:'20px'}}>{renderChart()}</div>
      </div>

      {/* Top Véhicules + Top Clients */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
        {/* Top Véhicules */}
        <div style={{background:'white',borderRadius:'12px',border:'1px solid #E2E8F0',padding:'20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid #F1F5F9'}}>
            <Car size={16} color={NAVY}/>
            <h3 style={{margin:0,fontSize:'14px',fontWeight:'700',color:'#0F172A'}}>Top Véhicules par activité</h3>
          </div>
          {vehicles.length===0
            ? <p style={{color:'#94A3B8',fontSize:'13px'}}>Aucun véhicule</p>
            : vehicles.map(v=>({
                ...v,
                nbRes:reservations.filter(r=>r.vehicle===v.id).length,
                nbAcc:reservations.filter(r=>r.vehicle===v.id&&hasDamage(r)).length,
                isOld:aVendre.some(x=>x.id===v.id),
              })).sort((a,b)=>b.nbRes-a.nbRes).slice(0,7).map((v,i)=>{
                const maxRes=Math.max(...vehicles.map(x=>reservations.filter(r=>r.vehicle===x.id).length),1);
                return (
                  <div key={v.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'9px 0',borderBottom:'1px solid #F8FAFC'}}>
                    <span style={{width:'20px',fontSize:'12px',fontWeight:'700',color:'#CBD5E1',textAlign:'center',flexShrink:0}}>{i+1}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
                        <span style={{fontWeight:'600',fontSize:'13px',color:'#0F172A'}}>{v.marque} {v.modele}</span>
                        {v.isOld&&<span style={{fontSize:'10px',background:'#FEF3DC',color:AMBER,padding:'1px 6px',borderRadius:'4px',fontWeight:'700',flexShrink:0}}>Renouveler</span>}
                      </div>
                      <div style={{background:'#F1F5F9',borderRadius:'3px',height:'4px'}}>
                        <div style={{width:`${(v.nbRes/maxRes)*100}%`,height:'100%',background:v.isOld?AMBER:NAVY,borderRadius:'3px'}}/>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                      <span style={{fontSize:'12px',fontWeight:'600',color:NAVY,background:'#EFF4FB',padding:'2px 8px',borderRadius:'6px'}}>{v.nbRes} rés.</span>
                      {v.nbAcc>0&&<span style={{fontSize:'12px',fontWeight:'600',color:RED,background:'#FFF5F5',padding:'2px 8px',borderRadius:'6px',display:'flex',alignItems:'center',gap:'3px'}}><AlertTriangle size={10}/>{v.nbAcc}</span>}
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Top Clients */}
        <div style={{background:'white',borderRadius:'12px',border:'1px solid #E2E8F0',padding:'20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid #F1F5F9'}}>
            <Users size={16} color={NAVY}/>
            <h3 style={{margin:0,fontSize:'14px',fontWeight:'700',color:'#0F172A'}}>Top Clients par fidélité</h3>
          </div>
          {clientsFidelite.length===0
            ? <p style={{color:'#94A3B8',fontSize:'13px'}}>Aucun client</p>
            : clientsFidelite.map((c,i)=>{
              const tier=c.reservations>=5?{label:'VIP',color:NAVY,bg:'#EFF4FB'}:c.reservations>=3?{label:'Régulier',color:GREEN,bg:'#F0FFF4'}:{label:'Nouveau',color:GRAY,bg:'#F8FAFC'};
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'9px 0',borderBottom:'1px solid #F8FAFC'}}>
                  <span style={{width:'20px',fontSize:'12px',fontWeight:'700',color:i<3?NAVY:'#CBD5E1',textAlign:'center',flexShrink:0}}>{i+1}</span>
                  <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'11px',color:NAVY,flexShrink:0}}>
                    {c.name.substring(0,2).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:'600',fontSize:'13px',color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                    <div style={{fontSize:'11px',color:GRAY,marginTop:'1px'}}>{c.depense.toLocaleString('fr-TN')} DT dépensés</div>
                  </div>
                  <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                    <span style={{fontSize:'11px',fontWeight:'600',color:tier.color,background:tier.bg,padding:'2px 8px',borderRadius:'6px'}}>{tier.label}</span>
                    <span style={{fontSize:'12px',fontWeight:'600',color:NAVY,background:'#EFF4FB',padding:'2px 8px',borderRadius:'6px'}}>{c.reservations}</span>
                    {c.accidents>0&&<span style={{fontSize:'11px',color:RED,background:'#FFF5F5',padding:'2px 7px',borderRadius:'6px',display:'flex',alignItems:'center',gap:'3px'}}><AlertTriangle size={10}/>{c.accidents}</span>}
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}