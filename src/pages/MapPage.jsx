import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
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
  iconSize: [30, 46], iconAnchor: [15, 46], popupAnchor: [1, -40],
});

const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [30, 46], iconAnchor: [15, 46], popupAnchor: [1, -40],
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

const AGENCY = { lat: 34.7312308, lng: 10.7664114 };

// Auto-fit map to show all markers
function AutoFit({ clientLocations }) {
  const map = useMap();
  useEffect(() => {
    if (clientLocations.length === 0) return;
    const bounds = L.latLngBounds([
      [AGENCY.lat, AGENCY.lng],
      ...clientLocations.map(c => [c.latitude, c.longitude])
    ]);
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [clientLocations, map]);
  return null;
}

const NAVY = "#1B3A6B";

export default function MapPage() {
  const [vehicles, setVehicles] = useState([]);
  const [clientLocations, setClientLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous");
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const fetchVehicles = () => {
    api.get("/vehicles/").then(r => setVehicles(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  const fetchClientLocations = () => {
    api.get("/location/all/").then(r => {
      setClientLocations(r.data);
      setLastUpdate(new Date());
    }).catch(() => {});
  };

  useEffect(() => {
    fetchVehicles();
    fetchClientLocations();
    intervalRef.current = setInterval(fetchClientLocations, 10000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const timeSince = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff/60)}min`;
    return `${Math.floor(diff/3600)}h`;
  };

  const available   = vehicles.filter(v => v.statut === "disponible");
  const rented      = vehicles.filter(v => v.statut === "loué" || v.statut === "loue");
  const maintenance = vehicles.filter(v => v.statut === "maintenance");

  const filteredVehicles = vehicles.filter(v => {
    if (filter === "tous") return true;
    if (filter === "disponible") return v.statut === "disponible";
    if (filter === "loué") return v.statut === "loué" || v.statut === "loue";
    if (filter === "maintenance") return v.statut === "maintenance";
    return true;
  });

  // Place vehicles around agency
  const getOffset = (index, total) => {
    const angle = (2 * Math.PI * index) / Math.max(total, 1);
    return {
      lat: AGENCY.lat + 0.002 * Math.cos(angle),
      lng: AGENCY.lng + 0.002 * Math.sin(angle),
    };
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", background: "white", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>🗺️ Carte & Localisation</h1>
            <p style={{ color: "#64748b", fontSize: 12, margin: "3px 0 0" }}>Positions clients GPS + véhicules en temps réel</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {clientLocations.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FEF3C7", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#D97706", fontWeight: 700, border: "1px solid #FDE68A" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706", display: "inline-block" }}></span>
                {clientLocations.length} client(s) en direct
              </div>
            )}
            {lastUpdate && <span style={{ fontSize: 11, color: "#94A3B8" }}>Actualisé {lastUpdate.toLocaleTimeString()}</span>}
            <button onClick={() => { fetchClientLocations(); fetchVehicles(); }}
              style={{ padding: "7px 14px", background: NAVY, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              🔄 Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Stats + filters */}
      <div style={{ display: "flex", gap: 10, padding: "10px 24px", background: "white", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", alignItems: "center" }}>
        {[
          { label: "Tous", count: vehicles.length, color: NAVY, filter: "tous" },
          { label: "Disponibles", count: available.length, color: "#16a34a", filter: "disponible" },
          { label: "Loués", count: rented.length, color: "#dc2626", filter: "loué" },
          { label: "Maintenance", count: maintenance.length, color: "#d97706", filter: "maintenance" },
        ].map(s => (
          <button key={s.filter} onClick={() => setFilter(s.filter)} style={{
            padding: "7px 14px", borderRadius: 8,
            border: `2px solid ${filter === s.filter ? s.color : "#e2e8f0"}`,
            background: filter === s.filter ? s.color : "white",
            color: filter === s.filter ? "white" : s.color,
            fontWeight: 600, fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ background: "rgba(255,255,255,0.3)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{s.count}</span>
            {s.label}
          </button>
        ))}

        {clientLocations.length > 0 && (
          <div style={{ marginLeft: "auto", padding: "7px 14px", background: "#FFF7ED", border: "2px solid #FED7AA", borderRadius: 8, fontSize: 12, color: "#D97706", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            📍 {clientLocations.length} client(s) GPS actif
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", fontSize: 16 }}>
            🗺️ Chargement de la carte...
          </div>
        ) : (
          <MapContainer center={[AGENCY.lat, AGENCY.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Auto-fit when clients found */}
            <AutoFit clientLocations={clientLocations} />

            {/* Agency circle */}
            <Circle center={[AGENCY.lat, AGENCY.lng]} radius={150}
              pathOptions={{ color: NAVY, fillColor: NAVY, fillOpacity: 0.08 }} />

            {/* Agency marker */}
            <Marker position={[AGENCY.lat, AGENCY.lng]} icon={agencyIcon}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 4 }}>🏢 Waieb Car Rent</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>Rue Taher Sfar, Sfax</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>📞 Lun-Sam 8h-19h</div>
                </div>
              </Popup>
            </Marker>

            {/* CLIENT GPS MARKERS — real positions */}
            {clientLocations.map(c => (
              <Marker key={`client-${c.client_id}`} position={[c.latitude, c.longitude]} icon={clientIcon}>
                <Popup>
                  <div style={{ minWidth: 210 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#D97706", marginBottom: 6 }}>
                      📍 {c.client_name}
                    </div>
                    {c.telephone && (
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>📞 {c.telephone}</div>
                    )}
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>
                      Lat: {Number(c.latitude).toFixed(5)}<br/>
                      Lng: {Number(c.longitude).toFixed(5)}
                    </div>
                    <div style={{ fontSize: 11, color: "#D97706", marginBottom: 8 }}>
                      🕐 Mis à jour il y a {timeSince(c.updated_at)}
                    </div>
                    <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noreferrer"
                      style={{ display: "block", textAlign: "center", padding: "6px 12px", background: NAVY, color: "white", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                      📍 Ouvrir dans Google Maps
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Vehicle markers around agency */}
            {filteredVehicles.map((v, i) => {
              const pos = getOffset(i, filteredVehicles.length);
              const icon = v.statut === "disponible" ? carAvailableIcon : carRentedIcon;
              const statusColor = v.statut === "disponible" ? "#16a34a" : v.statut === "loué" || v.statut === "loue" ? "#dc2626" : "#d97706";
              const statusLabel = v.statut === "disponible" ? "✅ Disponible" : v.statut === "loué" || v.statut === "loue" ? "🔴 Loué" : "🔧 Maintenance";
              return (
                <Marker key={v.id} position={[pos.lat, pos.lng]} icon={icon}>
                  <Popup>
                    <div style={{ minWidth: 190 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>🚗 {v.marque} {v.modele}</div>
                      <div style={{ color: "#64748b", fontSize: 12, margin: "3px 0" }}>{v.immatriculation}</div>
                      <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: statusColor + "20", color: statusColor, fontSize: 11, fontWeight: 600 }}>{statusLabel}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginTop: 6 }}>{v.prix_journalier} DT/jour</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div style={{ padding: "8px 24px", background: "white", borderTop: "1px solid #e2e8f0", display: "flex", gap: 20, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
        <span>🔵 Agence</span>
        <span>🟢 Disponible</span>
        <span>🔴 Loué</span>
        <span>🟡 Maintenance</span>
        <span style={{ color: "#D97706", fontWeight: 600 }}>🟠 Client GPS (temps réel)</span>
        <span style={{ marginLeft: "auto", color: "#94A3B8" }}>Refresh auto: 10s</span>
      </div>
    </div>
  );
}