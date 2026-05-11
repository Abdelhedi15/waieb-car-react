import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";

// Fix Leaflet default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons
const agencyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const carAvailableIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const carRentedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Agency location — Sfax
const AGENCY = {
  lat: 34.7312308,
  lng: 10.7664114,
  name: "Waieb Car Rent — Sfax",
  address: "Sfax, Tunisie",
};

export default function MapPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous");

  useEffect(() => {
    api.get("/vehicles/")
      .then((res) => setVehicles(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const available = vehicles.filter((v) => v.statut === "disponible");
  const rented = vehicles.filter((v) => v.statut === "loué");
  const maintenance = vehicles.filter((v) => v.statut === "maintenance");

  // Spread vehicles around agency with small offset
  const getOffset = (index, total) => {
    const angle = (2 * Math.PI * index) / Math.max(total, 1);
    const radius = 0.003;
    return {
      lat: AGENCY.lat + radius * Math.cos(angle),
      lng: AGENCY.lng + radius * Math.sin(angle),
    };
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === "tous") return true;
    if (filter === "disponible") return v.statut === "disponible";
    if (filter === "loué") return v.statut === "loué";
    if (filter === "maintenance") return v.statut === "maintenance";
    return true;
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        background: "white",
        borderBottom: "1px solid #e2e8f0",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1B3A6B", margin: 0 }}>
          🗺️ Carte & Localisation
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Localisation de l'agence et des véhicules
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex",
        gap: 12,
        padding: "12px 24px",
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        flexWrap: "wrap",
      }}>
        {[
          { label: "Total", count: vehicles.length, color: "#1B3A6B", filter: "tous" },
          { label: "Disponibles", count: available.length, color: "#16a34a", filter: "disponible" },
          { label: "Loués", count: rented.length, color: "#dc2626", filter: "loué" },
          { label: "Maintenance", count: maintenance.length, color: "#d97706", filter: "maintenance" },
        ].map((s) => (
          <button
            key={s.filter}
            onClick={() => setFilter(s.filter)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `2px solid ${filter === s.filter ? s.color : "#e2e8f0"}`,
              background: filter === s.filter ? s.color : "white",
              color: filter === s.filter ? "white" : s.color,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{
              background: filter === s.filter ? "rgba(255,255,255,0.3)" : s.color,
              color: filter === s.filter ? "white" : "white",
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
            }}>{s.count}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#64748b",
          }}>
            Chargement de la carte...
          </div>
        ) : (
          <MapContainer
            center={[AGENCY.lat, AGENCY.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Agency radius circle */}
            <Circle
              center={[AGENCY.lat, AGENCY.lng]}
              radius={200}
              pathOptions={{ color: "#1B3A6B", fillColor: "#1B3A6B", fillOpacity: 0.08 }}
            />

            {/* Agency marker */}
            <Marker position={[AGENCY.lat, AGENCY.lng]} icon={agencyIcon}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, color: "#1B3A6B", fontSize: 14, marginBottom: 4 }}>
                    🏢 {AGENCY.name}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{AGENCY.address}</div>
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "#f0f9ff", borderRadius: 6, fontSize: 12 }}>
                    📞 Appelez-nous pour réserver
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Vehicle markers */}
            {filteredVehicles.map((v, i) => {
              const pos = getOffset(i, filteredVehicles.length);
              const icon = v.statut === "disponible" ? carAvailableIcon : carRentedIcon;
              const statusColor = v.statut === "disponible" ? "#16a34a" : v.statut === "loué" ? "#dc2626" : "#d97706";
              const statusLabel = v.statut === "disponible" ? "✅ Disponible" : v.statut === "loué" ? "🔴 Loué" : "🔧 Maintenance";

              return (
                <Marker key={v.id} position={[pos.lat, pos.lng]} icon={icon}>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      {v.photo && (
                        <img
                          src={v.photo}
                          alt={v.marque}
                          style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 8 }}
                        />
                      )}
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1B3A6B" }}>
                        🚗 {v.marque} {v.modele}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12, margin: "2px 0" }}>
                        {v.immatriculation}
                      </div>
                      <div style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 20,
                        background: statusColor + "20",
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: 600,
                        margin: "4px 0",
                      }}>
                        {statusLabel}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1B3A6B", marginTop: 4 }}>
                        {v.prix_journalier} DT/jour
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div style={{
        padding: "10px 24px",
        background: "white",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        gap: 20,
        fontSize: 12,
        color: "#64748b",
      }}>
        <span>🔵 Agence</span>
        <span>🟢 Disponible</span>
        <span>🔴 Loué</span>
        <span>🟡 Maintenance</span>
      </div>
    </div>
  );
}