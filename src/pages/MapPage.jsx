import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const agencyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const carAvailableIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const carRentedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const AGENCY = { lat: 34.7312308, lng: 10.7664114, name: "Waieb Car Rent — Sfax", address: "Sfax, Tunisie" };

export default function MapPage() {
  const [vehicles, setVehicles] = useState([]);
  const [clientLocations, setClientLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous");
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const fetchVehicles = () => {
    api.get("/vehicles/").then(res => setVehicles(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  const fetchClientLocations = () => {
    api.get("/location/all/").then(res => {
      setClientLocations(res.data);
      setLastUpdate(new Date());
    }).catch(() => {});
  };

  useEffect(() => {
    fetchVehicles();
    fetchClientLocations();
    // Refresh client locations every 15 seconds
    intervalRef.current = setInterval(fetchClientLocations, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const available   = vehicles.filter(v => v.statut === "disponible");
  const rented      = vehicles.filter(v => v.statut === "loué" || v.statut === "loue");
  const maintenance = vehicles.filter(v => v.statut === "maintenance");

  const getOffset = (index, total) => {
    const angle = (2 * Math.PI * index) / Math.max(total, 1);
    const radius = 0.003;
    return { lat: AGENCY.lat + radius * Math.cos(angle), lng: AGENCY.lng + radius * Math.sin(angle) };
  };

  const filteredVehicles = vehicles.filter(v => {
    if (filter === "tous") return true;
    if (filter === "disponible") return v.statut === "disponible";
    if (filter === "loué") return v.statut === "loué" || v.statut === "loue";
    if (filter === "maintenance") return v.statut === "maintenance";
    return true;
  });

  const timeSince = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `il y a ${diff}s`;
    if (diff < 3600) return `il y a ${Math.floor(diff/60)}min`;
    return `il y a ${Math.floor(diff/3600)}h`;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", background: "white", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1B3A6B", margin: 0 }}>🗺️ Carte & Localisation</h1>
            <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Véhicules + positions clients en temps réel</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {clientLocations.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FEF3C7", padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "#D97706", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706", display: "inline-block", animation: "pulse 2s infinite" }}></span>
                {clientLocations.length} client(s) en direct
              </div>
            )}
            {lastUpdate && (
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                Mis à jour : {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <button onClick={fetchClientLocations} style={{ padding: "6px 12px", background: "#1B3A6B", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              🔄 Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 12, padding: "12px 24px", background: "white", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
        {[
          { label: "Tous véhicules", count: vehicles.length, color: "#1B3A6B", filter: "tous" },
          { label: "Disponibles", count: available.length, color: "#16a34a", filter: "disponible" },
          { label: "Loués", count: rented.length, color: "#dc2626", filter: "loué" },
          { label: "Maintenance", count: maintenance.length, color: "#d97706", filter: "maintenance" },
        ].map(s => (
          <button key={s.filter} onClick={() => setFilter(s.filter)} style={{
            padding: "8px 16px", borderRadius: 8, border: `2px solid ${filter === s.filter ? s.color : "#e2e8f0"}`,
            background: filter === s.filter ? s.color : "white", color: filter === s.filter ? "white" : s.color,
            fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ background: "rgba(255,255,255,0.3)", color: "white", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{s.count}</span>
            {s.label}
          </button>
        ))}
        {/* Client locations indicator */}
        {clientLocations.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#FFF7ED", border: "2px solid #FED7AA", borderRadius: 8 }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <span style={{ fontSize: 13, color: "#D97706", fontWeight: 600 }}>{clientLocations.length} client(s) GPS actif</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>Chargement...</div>
        ) : (
          <MapContainer center={[AGENCY.lat, AGENCY.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <Circle center={[AGENCY.lat, AGENCY.lng]} radius={200} pathOptions={{ color: "#1B3A6B", fillColor: "#1B3A6B", fillOpacity: 0.08 }} />

            {/* Agency marker */}
            <Marker position={[AGENCY.lat, AGENCY.lng]} icon={agencyIcon}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, color: "#1B3A6B", fontSize: 14, marginBottom: 4 }}>🏢 {AGENCY.name}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{AGENCY.address}</div>
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "#f0f9ff", borderRadius: 6, fontSize: 12 }}>📞 Lun-Sam 8h-19h</div>
                </div>
              </Popup>
            </Marker>

            {/* Client GPS markers */}
            {clientLocations.map(c => (
              <Marker key={`client-${c.client_id}`} position={[c.latitude, c.longitude]} icon={clientIcon}>
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#D97706", marginBottom: 4 }}>
                      📍 {c.client_name}
                    </div>
                    {c.telephone && <div style={{ color: "#64748b", fontSize: 12 }}>📞 {c.telephone}</div>}
                    <div style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0" }}>
                      {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
                    </div>
                    <div style={{ fontSize: 11, color: "#D97706" }}>🕐 {timeSince(c.updated_at)}</div>
                    <div style={{ marginTop: 8, padding: "4px 8px", background: "#FEF3C7", borderRadius: 6, fontSize: 11, color: "#D97706", fontWeight: 600 }}>
                      Client en déplacement
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Vehicle markers */}
            {filteredVehicles.map((v, i) => {
              const pos = getOffset(i, filteredVehicles.length);
              const icon = v.statut === "disponible" ? carAvailableIcon : carRentedIcon;
              const statusColor = v.statut === "disponible" ? "#16a34a" : v.statut === "loué" || v.statut === "loue" ? "#dc2626" : "#d97706";
              const statusLabel = v.statut === "disponible" ? "✅ Disponible" : v.statut === "loué" || v.statut === "loue" ? "🔴 Loué" : "🔧 Maintenance";
              return (
                <Marker key={v.id} position={[pos.lat, pos.lng]} icon={icon}>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      {v.photo && <img src={v.photo} alt={v.marque} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1B3A6B" }}>🚗 {v.marque} {v.modele}</div>
                      <div style={{ color: "#64748b", fontSize: 12, margin: "2px 0" }}>{v.immatriculation}</div>
                      <div style={{ display: "inline-block", padding: "3px 8px", borderRadius: 20, background: statusColor + "20", color: statusColor, fontSize: 11, fontWeight: 600, margin: "4px 0" }}>{statusLabel}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1B3A6B", marginTop: 4 }}>{v.prix_journalier} DT/jour</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div style={{ padding: "10px 24px", background: "white", borderTop: "1px solid #e2e8f0", display: "flex", gap: 20, fontSize: 12, color: "#64748b" }}>
        <span>🔵 Agence</span>
        <span>🟢 Disponible</span>
        <span>🔴 Loué</span>
        <span>🟡 Maintenance</span>
        <span>🟠 Client GPS</span>
      </div>
    </div>
  );
}