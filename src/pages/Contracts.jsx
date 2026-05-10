import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdDescription, MdPrint } from 'react-icons/md';
import api from '../api/axios';

const EMPTY_FORM = { reservation: '', date_contrat: '', contenu: '' };

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [ct, r, c, v] = await Promise.all([
        api.get('/contracts/'),
        api.get('/reservations/'),
        api.get('/clients/'),
        api.get('/vehicles/'),
      ]);
      setContracts(ct.data);
      setReservations(r.data);
      setClients(c.data);
      setVehicles(v.data);
    } catch (err) { console.error(err); }
  };

  const openAdd = () => {
    setEditingContract(null);
    setForm({ ...EMPTY_FORM, date_contrat: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (contract) => {
    setEditingContract(contract);
    setForm({
      reservation: contract.reservation,
      date_contrat: contract.date_contrat,
      contenu: contract.contenu || '',
    });
    setShowModal(true);
  };

  const openPrint = (contract) => {
    setSelectedContract(contract);
    setShowPrintModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingContract) {
        await api.put(`/contracts/${editingContract.id}/`, form);
      } else {
        await api.post('/contracts/', form);
      }
      fetchAll();
      setShowModal(false);
    } catch (err) {
      alert('Erreur: ' + JSON.stringify(err.response?.data));
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce contrat ?')) return;
    try {
      await api.delete(`/contracts/${id}/`);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const getReservationInfo = (id) => {
    const r = reservations.find(r => r.id === id);
    if (!r) return '—';
    const c = clients.find(c => c.id === r.client);
    const v = vehicles.find(v => v.id === r.vehicle);
    return {
      client: c ? `${c.prenom} ${c.nom}` : '—',
      cin: c?.cin || '—',
      telephone: c?.telephone || '—',
      permis: c?.permis_number || '—',
      adresse: c?.adresse || '—',
      vehicle: v ? `${v.marque} ${v.modele}` : '—',
      marque: v?.marque || '—',
      modele: v?.modele || '—',
      immatriculation: v?.immatriculation || '—',
      couleur: v?.couleur || '—',
      prix_journalier: v?.prix_journalier || '—',
      dates: `${r.date_debut} → ${r.date_fin}`,
      date_debut: r.date_debut,
      date_fin: r.date_fin,
      montant: r.montant_total,
      acompte: r.acompte || 0,
      jours: Math.max(1, Math.round((new Date(r.date_fin) - new Date(r.date_debut)) / (1000 * 60 * 60 * 24))),
    };
  };

  const autoGenerateContent = (reservationId) => {
    const info = getReservationInfo(parseInt(reservationId));
    if (info === '—') return '';
    const montantHT = info.montant ? (parseFloat(info.montant) / 1.19).toFixed(3) : '___________';
    const tva = info.montant ? (parseFloat(info.montant) - parseFloat(info.montant) / 1.19).toFixed(3) : '___________';

    return `╔══════════════════════════════════════════════════════════════╗
                    WAIEB CAR RENT
              CONTRAT DE LOCATION DE VÉHICULE
╚══════════════════════════════════════════════════════════════╝

N° Contrat: _______________        Date: ${new Date().toLocaleDateString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    IDENTITÉ DU LOCATAIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom et Prénom:             ${info.client}
Date et lieu de naissance: ___________________________________
Nationalité:               ___________________________________
Pièce d'identité (CIN):    ${info.cin}
Permis de conduire N°:     ${info.permis}    Du: ___________
Adresse:                   ${info.adresse}
Tél.:                      ${info.telephone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  CONDUCTEUR SUPPLÉMENTAIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom et Prénom:             ___________________________________
Date et lieu de naissance: ___________________________________
Nationalité:               ___________________________________
Pièce d'identité:          ___________________________________
Permis de conduire N°:     ___________________________________  Du: ___________
Adresse:                   ___________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         LE VÉHICULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Marque / Type:             ${info.marque} ${info.modele}
Matricule:                 ${info.immatriculation}
Couleur:                   ${info.couleur}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     DURÉE DE LA LOCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Livraison (Départ):  Date: ${info.date_debut}   Heure: _______   Lieu: _______
Retour:              Date: ${info.date_fin}   Heure: _______   Lieu: _______
Nombre de jours:     ${info.jours} jour(s)
Prolongation:        ___________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         FACTURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Durée de location:   ${info.jours} jour(s)
Prix par jour (HT):  ${info.prix_journalier} DT
Autre charge:        _______________
Total HT:            ${montantHT} DT
TVA 19%:             ${tva} DT
Droit de timbre:     1,000 DT
Total Facture:       ${info.montant} DT
Cautionnement:       _______________
Acompte versé:       ${info.acompte} DT
Reste à payer:       ${info.montant && info.acompte ? (parseFloat(info.montant) - parseFloat(info.acompte)).toFixed(2) : '___'} DT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     MODALITÉ DE PAIEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chèque: □         Carte de crédit: □         Espèces: □
N°: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                       ÉTAT DU VÉHICULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Km Départ:    _____________    Km Retour:    _____________
Carburant:    □ 0   □ 1/4   □ 1/2   □ 3/4   □ 1
Éraflures (=): _______________
Bosses (X):   _______________
Papier:  □    Route de secours: □    Auto-radio: □

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     CONDITIONS GÉNÉRALES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Article 1 - UTILISATION DU VÉHICULE:
- Restituer le véhicule dans l'état où il l'a reçu.
- Ne pas sous-louer ou prêter le véhicule à un tiers.
- Ne pas utiliser le véhicule pour le transport de marchandises.
- Ne pas transporter plus de personnes que le nombre de places autorisées.
- Ne pas quitter le territoire sans accord écrit préalable.

Article 2 - ASSURANCE:
Le véhicule est assuré pour les risques suivants:
1/ Pour une somme illimitée pour tous les dommages corporels.
2/ Contre l'incendie du véhicule.
3/ Contre le vol sous peine de déchéance.

Article 3 - ESSENCE NULLE:
L'essence est à la charge du locataire.

Article 4 - ENTRETIEN ET RÉPARATION:
L'usure mécanique normale est à la charge de Waieb Car Rent.
Toute réparation suite à une négligence sera à la charge du locataire.

Article 5 - ÉTAT LA VOITURE:
La voiture est livrée en parfait état de marche et de propreté.

Article 9 - CAUTION / PROLONGATION:
En cas de prolongation, le locataire doit payer le montant de location en sus.

Article 10 - RESPONSABILITÉ:
Le locataire demeure seul responsable des amendes et contraventions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SIGNATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

J'ai lu les informations et les conditions ci-dessus et je les accepte.

Nom et Signature de l'Agent:       Signature du Client:

_______________________________    _______________________________

Date: _________________________    Date: _________________________

                    ★ WAIEB CAR RENT ★`;
  };

  // ✅ Generate receipt/facture HTML for printing
  const generateReceiptHTML = (contract) => {
    const info = getReservationInfo(contract.reservation);
    if (info === '—') return '';
    const montantNum = parseFloat(info.montant) || 0;
    const montantHT = (montantNum / 1.19).toFixed(3);
    const tva = (montantNum - montantNum / 1.19).toFixed(3);
    const timbre = '1,000';
    const totalTTC = montantNum.toFixed(3);

    // Convert number to words (simplified)
    const toWords = (n) => {
      const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
      const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];
      if (n === 0) return 'zéro';
      if (n < 20) return units[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + units[n % 10] : '');
      if (n < 1000) return units[Math.floor(n / 100)] + ' cent' + (n % 100 ? ' ' + toWords(n % 100) : '');
      if (n < 10000) return units[Math.floor(n / 1000)] + ' mille' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
      return n.toString();
    };

    const montantEnLettres = toWords(Math.floor(montantNum)) + ' Dinars ET ' + Math.round((montantNum % 1) * 1000) + ' Millimes';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture - Waieb Car Rent</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #000; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .header h1 { font-size: 28px; font-weight: 900; letter-spacing: 3px; }
    .header h2 { font-size: 14px; font-weight: normal; }
    .header p { font-size: 11px; }
    .facture-info { display: flex; justify-content: space-between; margin: 16px 0; }
    .doit { font-size: 14px; }
    .doit strong { font-size: 18px; display: block; }
    .facture-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .facture-table th { background: #f0f0f0; border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px; }
    .facture-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
    .facture-table .designation { width: 50%; }
    .totaux-table { width: 100%; border-collapse: collapse; margin-top: 0; }
    .totaux-table td, .totaux-table th { border: 1px solid #000; padding: 6px 10px; font-size: 11px; text-align: center; }
    .montant-lettres { margin: 16px 0; font-size: 12px; font-style: italic; }
    .signature { display: flex; justify-content: flex-end; margin-top: 20px; }
    .signature-box { text-align: center; font-size: 11px; }
    .mode-reglement { margin: 10px 0; font-size: 12px; }
    .info-row { display: flex; gap: 20px; }
    .info-cell { border: 1px solid #000; padding: 4px 8px; font-size: 11px; flex: 1; text-align: center; }
    .info-cell strong { display: block; font-size: 10px; color: #555; }
    @media print {
      body { padding: 10px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>WAIEB CAR RENT</h1>
    <h2>LOCATION DE VÉHICULES</h2>
    <p>Tél: _______________ | Email: _______________ | Adresse: _______________</p>
  </div>

  <div class="facture-info">
    <div class="doit">
      <span>Doit :</span>
      <strong>${info.client}</strong>
      <div class="mode-reglement">
        <strong>MODE REGLEMENT</strong><br>
        Par chèque N° : _______________<br>
        Espèces: □ &nbsp;&nbsp; Carte: □ &nbsp;&nbsp; Virement: □
      </div>
    </div>
    <div style="text-align: right;">
      <div class="info-row" style="margin-bottom: 8px;">
        <div class="info-cell"><strong>FACTURE N°</strong>${contract.numero || '___'}</div>
      </div>
      <div class="info-row" style="margin-bottom: 8px;">
        <div class="info-cell"><strong>DATE</strong>${contract.date_contrat}</div>
        <div class="info-cell"><strong>CLIENT</strong>${info.client}</div>
        <div class="info-cell"><strong>PAGE</strong>1</div>
      </div>
      <div class="info-row">
        <div class="info-cell"><strong>ECHÉANCE</strong>___________</div>
        <div class="info-cell"><strong>CODE TVA CLIENT</strong>_______________</div>
      </div>
    </div>
  </div>

  <table class="facture-table">
    <thead>
      <tr>
        <th class="designation">Désignation</th>
        <th>Qté</th>
        <th>Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="height: 120px; vertical-align: top; padding: 10px;">
          Location de voiture de marque &nbsp;<strong>${info.marque}</strong><br>
          Immatriculée sous le Numéro &nbsp;<strong>${info.immatriculation}</strong><br>
          d'une période : <strong>${info.jours} JOURS</strong><br>
          Du &nbsp;<strong>${info.date_debut}</strong><br>
          Au &nbsp;<strong>${info.date_fin}</strong>
        </td>
        <td style="text-align: center; vertical-align: middle;">${info.jours} JOURS</td>
        <td style="text-align: right; vertical-align: middle;">${montantHT}</td>
      </tr>
      <tr><td style="height: 60px;"></td><td></td><td></td></tr>
    </tbody>
  </table>

  <table class="totaux-table">
    <thead>
      <tr>
        <th>BASES MT</th>
        <th>MT TVA</th>
        <th>%TVA</th>
        <th colspan="2">TOTAUX</th>
        <th>TAXE</th>
        <th>TIMBRE</th>
        <th>TOTAL TTC</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: right;">${montantHT}</td>
        <td style="text-align: right;">${tva}</td>
        <td style="text-align: center;">19,000</td>
        <td style="font-weight: bold;">H.T</td>
        <td style="text-align: right;">${montantHT}</td>
        <td style="text-align: center;">30,000</td>
        <td style="text-align: center;">${timbre}</td>
        <td style="text-align: right; font-weight: bold;">${totalTTC}</td>
      </tr>
      <tr>
        <td></td><td></td><td></td>
        <td style="font-weight: bold;">T.V.A</td>
        <td style="text-align: right;">${tva}</td>
        <td></td><td></td><td></td>
      </tr>
    </tbody>
  </table>

  <div class="montant-lettres">
    <strong>Arrêtée la présente facture à la somme de :</strong> &nbsp;
    <em>${montantEnLettres}</em>
  </div>

  <div class="signature">
    <div class="signature-box">
      <strong>SIGNATURE & CACHET</strong><br>
      WAIEB CAR RENT<br><br><br>
      _______________________
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="padding: 12px 32px; background: #1a56db; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: bold;">
      🖨️ Imprimer la Facture
    </button>
  </div>
</body>
</html>`;
  };

  const handlePrintContract = (contract) => {
    const info = getReservationInfo(contract.reservation);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat - ${info.client}</title>
  <style>
    body { font-family: 'Courier New', monospace; font-size: 11px; padding: 20px; white-space: pre-wrap; }
    @media print { button { display: none !important; } }
  </style>
</head>
<body>
  <div style="text-align:center; margin-bottom:20px;">
    <button onclick="window.print()" style="padding:10px 24px; background:#1a56db; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">🖨️ Imprimer le Contrat</button>
  </div>
  <pre>${contract.contenu}</pre>
</body>
</html>`);
    printWindow.document.close();
  };

  const handlePrintReceipt = (contract) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateReceiptHTML(contract));
    printWindow.document.close();
  };

  const filtered = contracts.filter(c => {
    const info = getReservationInfo(c.reservation);
    if (info === '—') return true;
    return `${info.client} ${info.vehicle}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <h1 className="page-title">Gestion des Contrats</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Contrats', value: contracts.length, color: '#805ad5' },
          { label: 'Ce mois', value: contracts.filter(c => new Date(c.date_contrat).getMonth() === new Date().getMonth()).length, color: '#1a56db' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <MdDescription style={{ fontSize: '40px', color: s.color }} />
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ color: '#888', fontSize: '13px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
          <input
            placeholder="Rechercher par client, véhicule..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '360px' }}
          />
          <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdAdd size={20} /> Nouveau contrat
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>N° Contrat</th>
              <th>Client</th>
              <th>Véhicule</th>
              <th>Période</th>
              <th>Date contrat</th>
              <th>Montant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Aucun contrat trouvé</td></tr>
            ) : filtered.map((c) => {
              const info = getReservationInfo(c.reservation);
              return (
                <tr key={c.id}>
                  <td><strong style={{ color: '#805ad5' }}>{c.numero || `#${c.id}`}</strong></td>
                  <td><strong>{info.client}</strong></td>
                  <td>{info.vehicle}</td>
                  <td><span style={{ fontSize: '13px', color: '#666' }}>{info.dates}</span></td>
                  <td>{c.date_contrat}</td>
                  <td><strong style={{ color: '#38a169' }}>{info.montant ? `${info.montant} DT` : '—'}</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={() => openEdit(c)}
                        style={{ padding: '6px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MdEdit /> Modifier
                      </button>
                      <button onClick={() => handlePrintContract(c)}
                        style={{ padding: '6px 10px', fontSize: '13px', background: '#805ad5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MdPrint /> Contrat
                      </button>
                      <button onClick={() => handlePrintReceipt(c)}
                        style={{ padding: '6px 10px', fontSize: '13px', background: '#38a169', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MdPrint /> Facture
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(c.id)}
                        style={{ padding: '6px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '700px' }}>
            <h2>{editingContract ? '✏️ Modifier le Contrat' : '➕ Nouveau Contrat'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Réservation *</label>
                  <select value={form.reservation}
                    onChange={e => {
                      const id = e.target.value;
                      setForm({...form, reservation: id, contenu: autoGenerateContent(id)});
                    }} required>
                    <option value="">Sélectionner une réservation</option>
                    {reservations.map(r => {
                      const info = getReservationInfo(r.id);
                      return <option key={r.id} value={r.id}>#{r.id} — {info.client} — {info.vehicle} ({info.dates})</option>;
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date du contrat *</label>
                  <input type="date" value={form.date_contrat} onChange={e => setForm({...form, date_contrat: e.target.value})} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Contenu du contrat</label>
                  <textarea
                    value={form.contenu}
                    onChange={e => setForm({...form, contenu: e.target.value})}
                    rows={14}
                    style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                    placeholder="Le contenu sera généré automatiquement..."
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : (editingContract ? 'Modifier' : 'Créer le contrat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;