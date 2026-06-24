import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import {
  LayoutDashboard, Car, Tag, Users, CalendarCheck,
  Banknote, AlertTriangle, ChevronDown, ChevronRight,
  TrendingUp, RotateCcw, UserCheck, X, Star, ClipboardList,
  Wrench, Shield, Eye, Activity,
} from 'lucide-react';
import api from '../api/axios';

const NAVY   = '#1B3A6B';
const AMBER  = '#D97706';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';

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

  // ✅ AUJOURD'HUI SEULEMENT
  const aInspecter = reservations.filter(r=>{
    if(r.statut!=='confirmée'||r.inspection_retour_faite) return false;
    const f=new Date(r.date_fin);f.setHours(0,0,0,0);
    return f.getTime()===today.getTime();
  });

  const totalRevenus   = payments.filter(p=>p.statut==='payé').reduce((s,p)=>s+parseFloat(p.montant),0);
  const totalAccidents = reservations.filter(r=>hasDamage(r)).length;
  const nbConfirmees   = reservations.filter(r=>r.statut==='confirmée').length;

  const monthlyData = MONTHS.map((m,i)=>{
    const mr = reservations.filter(r=>{const d=new Date(r.date_debut);return d.getFullYear()===yr&&d.getMonth()===i;});
    return {
      mois:m, reservations:mr.length,
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
    {v:'activite',  label:'Activité mensuelle',     icon:<Activity size={14}/>,     desc:'Réservations, contrats, inspections et dommages'},
    {v:'depenses',  label:'Revenus par client',      icon:<Banknote size={14}/>,     desc:'Montants encaissés par client (DT)'},
    {v:'occupation',label:'Occupation véhicules',    icon:<Car size={14}/>,          desc:'Nombre de réservations par véhicule'},
    {v:'fidelite',  label:'Fidélité clients',        icon:<UserCheck size={14}/>,    desc:'Réservations par client'},
    {v:'accidents', label:'Dommages par mois',       icon:<AlertTriangle size={14}/>,desc:'Accidents et dommages déclarés'},
    {v:'vendre',    label:'Véhicules à renouveler',  icon:<Tag size={14}/>,          desc:'Véhicules atteignant 3.5 ans par mois'},
    {v:'annulations',label:'Annulations clients',    icon:<X size={14}/>,            desc:'Réservations annulées par client'},
    {v:'remplacements',label:'Remplacements',        icon:<RotateCcw size={14}/>,    desc:'Remplacements suite à incident'},
  ];
  const sel=charts.find(c=>c.v===chart)||charts[0];

  const renderChart=()=>{
    switch(chart){
      case 'activite': return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthlyData} margin={{top:10,right:20,left:0,bottom:0}}>
            <CartesianGrid {...G}/><XAxis dataKey="mois" tick={T}/><YAxis tick={T} allowDecimals={false}/>
            <Tooltip contentStyle={C}/><Legend wrapperStyle={{fontSize:'12px'}}/>
            <Line type="monotone" dataKey="reservations" stroke={NAVY}   strokeWidth={2.5} dot={{r:4}} name="Réservations"/>
            <Line type="monotone" dataKey="contrats"     stroke={PURPLE} strokeWidth={2.5} dot={{r:4}} name="Contrats"/>
            <Line type="monotone" dataKey="inspections"  stroke={GREEN}  strokeWidth={2.5} dot={{r:4}} name="Inspections"/>
            <Line type="monotone" dataKey="accidents"    stroke={RED}    strokeWidth={2.5} dot={{r:4}} name="Dommages" strokeDasharray="5 5"/>
          </LineChart>
        </ResponsiveContainer>
      );
      case 'depenses': return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={clientsDepenses} margin={{top:10,right:20,left:0,bottom:50}}>
            <CartesianGrid {...G}/><XAxis dataKey="name" tick={T} angle={-30} textAnchor="end" interval={0}/>
            <YAxis tick={T}/><Tooltip formatter={v=>`${v} DT`} contentStyle={C}/>
            <Bar dataKey="depense" radius={[5,5,0,0]} name="Dépenses (DT)">
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
            <Bar dataKey="reservations" fill={NAVY}  radius={[5,5,0,0]} name="Réservations"/>
            <Bar dataKey="accidents"    fill={RED}   radius={[5,5,0,0]} name="Dommages"/>
          </BarChart>
        </ResponsiveContainer>
      );
      case 'fidelite': return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={clientsFidelite} margin={{top:10,right:20,left:0,bottom:50}}>
            <CartesianGrid {...G}/><XAxis dataKey="name" tick={T} angle={-30} textAnchor="end" interval={0}/>
            <YAxis tick={T} allowDecimals={false}/><Tooltip contentStyle={C}/><Legend wrapperStyle={{fontSize:'12px'}}/>
            <Bar dataKey="reservations" fill={PURPLE} radius={[5,5,0,0]} name="Réservations"/>
            <Bar dataKey="accidents"    fill={RED}    radius={[5,5,0,0]} name="Dommages"/>
          </BarChart>
        </ResponsiveContainer>
      );
      case 'accidents': return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlyData} margin={{top:10,right:20,left:0,bottom:0}}>
            <CartesianGrid {...G}/><XAxis dataKey="mois" tick={T}/><YAxis tick={T} allowDecimals={false}/>
            <Tooltip contentStyle={C}/>
            <Bar dataKey="accidents" fill={RED} radius={[5,5,0,0]} name="Dommages"/>
          </BarChart>
        </ResponsiveContainer>
      );
      case 'vendre': return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={vendreData} margin={{top:10,right:20,left:0,bottom:50}}>
            <CartesianGrid {...G}/><XAxis dataKey="label" tick={T} angle={-30} textAnchor="end" interval={0}/>
            <YAxis tick={T} allowDecimals={false}/><Tooltip contentStyle={C}/>
            <Bar dataKey="nb" fill={AMBER} radius={[5,5,0,0]} name="À renouveler"/>
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
              <Bar dataKey="total"       fill={NAVY} radius={[5,5,0,0]} name="Total"/>
              <Bar dataKey="annulations" fill={RED}  radius={[5,5,0,0]} name="Annulations"/>
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
              <Bar dataKey="remplacements" fill={PURPLE} radius={[5,5,0,0]} name="Remplacements"/>
            </BarChart>
          </ResponsiveContainer>
        );
      }
      default: return null;
    }
  };

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:'16px',color:'#64748B'}}>
      <Car size={40} color="#E2E8F0"/>
      <span style={{fontSize:'14px',fontWeight:'600'}}>Chargement...</span>
    </div>
  );

  // ── STAT CARDS CONFIG — chaque card a son identité visuelle
  const statCards = [
    {
      label:'Véhicules actifs',
      value: activeVeh.length,
      sub: `${vehicles.length} total parc`,
      icon: <Car size={26}/>,
      color: NAVY,
      bg: 'linear-gradient(135deg, #1B3A6B 0%, #2D5A9E 100%)',
      textColor: 'white',
      alert: false,
    },
    {
      label:'À renouveler',
      value: aVendre.length,
      sub: 'Dépassé 3.5 ans',
      icon: <Tag size={26}/>,
      color: aVendre.length > 0 ? RED : GREEN,
      bg: aVendre.length > 0
        ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
        : 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
      textColor: 'white',
      alert: aVendre.length > 0,
      alertLabel: aVendre.length > 0 ? '⚠' : '✓',
    },
    {
      label:'Clients',
      value: clients.length,
      sub: 'Enregistrés',
      icon: <Users size={26}/>,
      color: PURPLE,
      bg: 'linear-gradient(135deg, #7C3AED 0%, #9F67FF 100%)',
      textColor: 'white',
      alert: false,
    },
    {
      label:'Réservations',
      value: reservations.length,
      sub: `${nbConfirmees} confirmées`,
      icon: <CalendarCheck size={26}/>,
      color: '#0891B2',
      bg: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
      textColor: 'white',
      alert: false,
    },
    {
      label:'Revenus encaissés',
      value: `${totalRevenus.toFixed(0)} DT`,
      sub: 'Paiements reçus',
      icon: <Banknote size={26}/>,
      color: GREEN,
      bg: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
      textColor: 'white',
      alert: false,
    },
    {
      label:'Dommages déclarés',
      value: totalAccidents,
      sub: totalAccidents > 0 ? 'À surveiller' : 'Aucun dommage',
      icon: <Shield size={26}/>,
      color: totalAccidents > 0 ? RED : GREEN,
      bg: totalAccidents > 0
        ? 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)'
        : 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
      textColor: 'white',
      alert: totalAccidents > 0,
    },
    {
      label:'À inspecter',
      value: aInspecter.length,
      sub: "Aujourd'hui",
      icon: <ClipboardList size={26}/>,
      color: aInspecter.length > 0 ? '#7C3AED' : GREEN,
      bg: aInspecter.length > 0
        ? 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)'
        : 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
      textColor: 'white',
      alert: aInspecter.length > 0,
      alertLabel: aInspecter.length > 0 ? 'URGENT' : null,
      clickable: aInspecter.length > 0,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px'}}>
        <h1 style={{margin:0,fontSize:'24px',fontWeight:'800',color:'#0F172A',display:'flex',alignItems:'center',gap:'10px'}}>
          <LayoutDashboard size={24} color={NAVY}/> Tableau de Bord
        </h1>
        <div style={{fontSize:'13px',color:'#64748B',background:'#F8FAFC',padding:'8px 16px',borderRadius:'10px',border:'1px solid #E2E8F0',fontWeight:'600'}}>
          {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </div>
      </div>

      {/* ── STAT CARDS — design distinctif par carte */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'12px',marginBottom:'28px'}}>
        {statCards.map((s,i)=>(
          <div key={i}
            onClick={() => s.clickable && setChart('inspections')}
            style={{
              background: s.bg,
              borderRadius:'16px',
              padding:'18px 14px',
              position:'relative',
              cursor: s.clickable ? 'pointer' : 'default',
              boxShadow: s.alert
                ? `0 8px 24px ${s.color}40`
                : '0 4px 12px rgba(0,0,0,0.08)',
              transition:'transform 0.15s, box-shadow 0.15s',
              overflow:'hidden',
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 12px 28px ${s.color}50`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=s.alert?`0 8px 24px ${s.color}40`:'0 4px 12px rgba(0,0,0,0.08)';}}
          >
            {/* Background decoration */}
            <div style={{position:'absolute',top:'-15px',right:'-15px',width:'70px',height:'70px',borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
            <div style={{position:'absolute',bottom:'-20px',left:'-10px',width:'50px',height:'50px',borderRadius:'50%',background:'rgba(255,255,255,0.07)'}}/>

            {/* Alert badge */}
            {s.alertLabel && (
              <div style={{position:'absolute',top:'10px',right:'10px',background:'rgba(255,255,255,0.25)',color:'white',borderRadius:'6px',fontSize:'9.5px',padding:'2px 7px',fontWeight:'900',letterSpacing:'0.5px'}}>
                {s.alertLabel}
              </div>
            )}

            {/* Icon */}
            <div style={{color:'rgba(255,255,255,0.85)',marginBottom:'12px',display:'flex'}}>
              {s.icon}
            </div>

            {/* Value */}
            <div style={{fontSize:'28px',fontWeight:'900',color:'white',lineHeight:1,marginBottom:'4px',letterSpacing:'-0.5px'}}>
              {s.value}
            </div>

            {/* Label */}
            <div style={{fontSize:'12px',fontWeight:'700',color:'rgba(255,255,255,0.9)',marginBottom:'2px'}}>
              {s.label}
            </div>

            {/* Sub */}
            <div style={{fontSize:'10.5px',color:'rgba(255,255,255,0.65)',fontWeight:'500'}}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── ALERTS — plus grandes et distinctes */}
      <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'24px'}}>

        {/* Inspection urgente */}
        {aInspecter.length > 0 && (
          <div style={{
            background:'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
            borderRadius:'16px', padding:'20px 24px',
            boxShadow:'0 8px 32px rgba(109,40,217,0.35)',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'16px'}}>
              <div style={{width:'52px',height:'52px',background:'rgba(255,255,255,0.18)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative'}}>
                <ClipboardList size={26} color="white"/>
                <div style={{position:'absolute',top:'-8px',right:'-8px',background:RED,color:'white',borderRadius:'50%',width:'22px',height:'22px',fontSize:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'900'}}>
                  {aInspecter.length}
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:'900',fontSize:'17px',color:'white',marginBottom:'3px'}}>
                  🔴 {aInspecter.length} inspection{aInspecter.length>1?'s':''} à effectuer aujourd'hui
                </div>
                <div style={{fontSize:'13px',color:'rgba(255,255,255,0.72)'}}>
                  Ces réservations se terminent ce jour — inspection obligatoire avant clôture
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              {aInspecter.map(r=>{
                const cl=clients.find(c=>c.id===r.client);
                const vh=vehicles.find(v=>v.id===r.vehicle);
                return (
                  <div key={r.id} style={{background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',borderRadius:'10px',padding:'10px 16px',color:'white',fontSize:'13px',fontWeight:'600',border:'1px solid rgba(255,255,255,0.25)',display:'flex',alignItems:'center',gap:'10px'}}>
                    <Car size={16} color="rgba(255,255,255,0.8)"/>
                    <span><strong>Rés. #{r.id}</strong></span>
                    <span style={{color:'rgba(255,255,255,0.75)'}}>·</span>
                    <span>{vh?.marque} {vh?.modele}</span>
                    <span style={{color:'rgba(255,255,255,0.75)'}}>·</span>
                    <span style={{color:'rgba(255,255,255,0.75)'}}>{cl?.prenom} {cl?.nom}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* À renouveler */}
        {aVendre.length > 0 && (
          <div style={{
            background:'linear-gradient(135deg, #92400E 0%, #D97706 100%)',
            borderRadius:'16px', padding:'20px 24px',
            boxShadow:'0 8px 24px rgba(217,119,6,0.3)',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'14px'}}>
              <div style={{width:'52px',height:'52px',background:'rgba(255,255,255,0.18)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Tag size={26} color="white"/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:'900',fontSize:'17px',color:'white',marginBottom:'3px'}}>
                  🔶 {aVendre.length} véhicule{aVendre.length>1?'s':''} à renouveler
                </div>
                <div style={{fontSize:'13px',color:'rgba(255,255,255,0.75)'}}>
                  Dépassé 3.5 ans d'acquisition
                </div>
              </div>
              <button onClick={()=>setChart('vendre')}
                style={{padding:'9px 18px',background:'rgba(255,255,255,0.22)',color:'white',border:'1.5px solid rgba(255,255,255,0.4)',borderRadius:'10px',cursor:'pointer',fontWeight:'700',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
                Voir <ChevronRight size={15}/>
              </button>
            </div>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              {aVendre.slice(0,4).map(v=>(
                <div key={v.id} style={{background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',borderRadius:'10px',padding:'10px 16px',color:'white',fontSize:'13px',fontWeight:'600',border:'1px solid rgba(255,255,255,0.25)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <Car size={16} color="rgba(255,255,255,0.8)"/>
                  <span><strong>{v.marque} {v.modele}</strong></span>
                  <span style={{color:'rgba(255,255,255,0.7)',fontSize:'12px'}}>{v.immatriculation}</span>
                  <span style={{background:'rgba(255,255,255,0.25)',padding:'2px 8px',borderRadius:'6px',fontSize:'11px',fontWeight:'800'}}>{getAge(v.date_acquisition).toFixed(1)}a</span>
                </div>
              ))}
              {aVendre.length>4&&<div style={{background:'rgba(255,255,255,0.12)',borderRadius:'10px',padding:'10px 16px',color:'rgba(255,255,255,0.8)',fontSize:'13px',fontWeight:'600',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',gap:'6px'}}><Tag size={14}/>+{aVendre.length-4} autres</div>}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{background:'white',borderRadius:'16px',border:'1px solid #E2E8F0',overflow:'hidden',marginBottom:'24px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
        <div style={{padding:'18px 24px',background:'linear-gradient(135deg, #1B3A6B 0%, #2D5A9E 100%)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'40px',height:'40px',background:'rgba(255,255,255,0.15)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',color:'white'}}>
              {sel.icon}
            </div>
            <div>
              <div style={{fontWeight:'800',fontSize:'15px',color:'white'}}>{sel.label}</div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>{sel.desc}</div>
            </div>
          </div>
          <div style={{position:'relative'}}>
            <button onClick={()=>setOpen(!open)}
              style={{padding:'9px 16px',background:'rgba(255,255,255,0.12)',border:'1.5px solid rgba(255,255,255,0.3)',borderRadius:'10px',color:'white',cursor:'pointer',fontWeight:'600',fontSize:'13px',display:'flex',alignItems:'center',gap:'8px',minWidth:'220px',justifyContent:'space-between'}}>
              <span style={{display:'flex',alignItems:'center',gap:'7px'}}>{sel.icon}{sel.label}</span>
              <ChevronDown size={14} style={{transform:open?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
            </button>
            {open&&(
              <>
                <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:10}}/>
                <div style={{position:'absolute',right:0,top:'46px',zIndex:11,background:'white',borderRadius:'12px',minWidth:'280px',boxShadow:'0 8px 32px rgba(0,0,0,0.15)',overflow:'hidden',border:'1px solid #E2E8F0'}}>
                  {charts.map(opt=>(
                    <div key={opt.v} onClick={()=>{setChart(opt.v);setOpen(false);}}
                      style={{padding:'11px 16px',cursor:'pointer',background:chart===opt.v?'#EFF4FB':'white',borderLeft:`3px solid ${chart===opt.v?NAVY:'transparent'}`,display:'flex',alignItems:'center',gap:'10px'}}
                      onMouseEnter={e=>{if(chart!==opt.v)e.currentTarget.style.background='#F8FAFC';}}
                      onMouseLeave={e=>{e.currentTarget.style.background=chart===opt.v?'#EFF4FB':'white';}}>
                      <div style={{color:chart===opt.v?NAVY:'#64748B',display:'flex'}}>{opt.icon}</div>
                      <div>
                        <div style={{fontWeight:'700',fontSize:'13px',color:chart===opt.v?NAVY:'#0F172A'}}>{opt.label}</div>
                        <div style={{fontSize:'11px',color:'#94A3B8',marginTop:'1px'}}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{padding:'24px'}}>{renderChart()}</div>
      </div>

      {/* Top Véhicules + Top Clients */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
        <div style={{background:'white',borderRadius:'16px',border:'1px solid #E2E8F0',padding:'20px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px',paddingBottom:'14px',borderBottom:'2px solid #F1F5F9'}}>
            <div style={{width:'38px',height:'38px',background:'linear-gradient(135deg,#1B3A6B,#2D5A9E)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center'}}><Car size={18} color="white"/></div>
            <h3 style={{margin:0,fontSize:'15px',fontWeight:'800',color:'#0F172A'}}>Top Véhicules par activité</h3>
          </div>
          {vehicles.length===0 ? <p style={{color:'#94A3B8',fontSize:'13px'}}>Aucun véhicule</p>
          : vehicles.map(v=>({
              ...v,
              nbRes:reservations.filter(r=>r.vehicle===v.id).length,
              nbAcc:reservations.filter(r=>r.vehicle===v.id&&hasDamage(r)).length,
              isOld:aVendre.some(x=>x.id===v.id),
            })).sort((a,b)=>b.nbRes-a.nbRes).slice(0,7).map((v,i)=>{
              const maxRes=Math.max(...vehicles.map(x=>reservations.filter(r=>r.vehicle===x.id).length),1);
              return (
                <div key={v.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #F8FAFC'}}>
                  <div style={{width:'28px',height:'28px',borderRadius:'8px',background:i<3?'linear-gradient(135deg,#1B3A6B,#2D5A9E)':'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:'12px',fontWeight:'800',color:i<3?'white':'#94A3B8'}}>{i+1}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
                      <span style={{fontWeight:'700',fontSize:'13px',color:'#0F172A'}}>{v.marque} {v.modele}</span>
                      {v.isOld&&<span style={{fontSize:'10px',background:'#FEF3DC',color:AMBER,padding:'1px 6px',borderRadius:'4px',fontWeight:'700'}}>Renouveler</span>}
                    </div>
                    <div style={{background:'#F1F5F9',borderRadius:'4px',height:'5px'}}>
                      <div style={{width:`${(v.nbRes/maxRes)*100}%`,height:'100%',background:v.isOld?AMBER:NAVY,borderRadius:'4px'}}/>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                    <span style={{fontSize:'12px',fontWeight:'700',color:NAVY,background:'#EFF4FB',padding:'3px 9px',borderRadius:'7px'}}>{v.nbRes} rés.</span>
                    {v.nbAcc>0&&<span style={{fontSize:'12px',fontWeight:'700',color:RED,background:'#FFF5F5',padding:'3px 9px',borderRadius:'7px',display:'flex',alignItems:'center',gap:'3px'}}><AlertTriangle size={11}/>{v.nbAcc}</span>}
                  </div>
                </div>
              );
            })
          }
        </div>

        <div style={{background:'white',borderRadius:'16px',border:'1px solid #E2E8F0',padding:'20px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px',paddingBottom:'14px',borderBottom:'2px solid #F1F5F9'}}>
            <div style={{width:'38px',height:'38px',background:'linear-gradient(135deg,#7C3AED,#9F67FF)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center'}}><Users size={18} color="white"/></div>
            <h3 style={{margin:0,fontSize:'15px',fontWeight:'800',color:'#0F172A'}}>Top Clients par fidélité</h3>
          </div>
          {clientsFidelite.length===0 ? <p style={{color:'#94A3B8',fontSize:'13px'}}>Aucun client</p>
          : clientsFidelite.map((c,i)=>{
              const tier=c.reservations>=5?{label:'VIP',color:PURPLE,bg:'#F3EEFF'}:c.reservations>=3?{label:'Régulier',color:GREEN,bg:'#F0FFF4'}:{label:'Nouveau',color:'#64748B',bg:'#F8FAFC'};
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #F8FAFC'}}>
                  <div style={{width:'28px',height:'28px',borderRadius:'8px',background:i<3?'linear-gradient(135deg,#7C3AED,#9F67FF)':'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:'12px',fontWeight:'800',color:i<3?'white':'#94A3B8'}}>{i+1}</span>
                  </div>
                  <div style={{width:'34px',height:'34px',borderRadius:'50%',background:'#EFF4FB',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'11px',color:NAVY,flexShrink:0}}>
                    {c.name.substring(0,2).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:'700',fontSize:'13px',color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                    <div style={{fontSize:'11.5px',color:'#64748B',marginTop:'1px'}}>{c.depense.toLocaleString('fr-TN')} DT</div>
                  </div>
                  <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                    <span style={{background:tier.bg,color:tier.color,padding:'2px 8px',borderRadius:'7px',fontSize:'11px',fontWeight:'700'}}>{tier.label}</span>
                    <span style={{background:'#EFF4FB',color:NAVY,padding:'3px 9px',borderRadius:'7px',fontSize:'12px',fontWeight:'700'}}>{c.reservations}</span>
                    {c.accidents>0&&<span style={{background:'#FFF5F5',color:RED,padding:'3px 9px',borderRadius:'7px',fontSize:'12px',fontWeight:'700',display:'flex',alignItems:'center',gap:'3px'}}><AlertTriangle size={11}/>{c.accidents}</span>}
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