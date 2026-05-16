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

const AGENCY = { lat: 34.7312308, lng: 10.7664114 };
const NAVY = "#1B3A6B";

function AutoFit({ clientLocations }) {
  const map = useMap();
  useEffect(() => {
    if (clientLocations.length === 0) return;
    const bounds = L.latLngBounds([
      [AGENCY.lat, AGENCY.lng],
      ...clientLocations.map(c => [c.latitude, c.longitude])
    ]);
    map.fitBounds(bounds, { padding: [80, 80] });
  }, [clientLocations.length]);
  return null;
}

export default function MapPage() {
  const [clientLocations, setClientLocations] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClientLocations = () => {
    api.get("/location/all/").then(r => {
      setClientLocations(r.data);
      setLastUpdate(new Date());
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchClientLocations();
    const t = setInterval(fetchClientLocations, 10000);
    return () => clearInterval(t);
  }, []);

  const timeSince = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", background: "white", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>🗺️ Carte GPS — Suivi Clients</h1>
            <p style={{ color: "#64748b", fontSize: 12, margin: "3px 0 0" }}>
              Positions GPS réelles des clients en temps réel
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {clientLocations.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FEF3C7", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#D97706", fontWeight: 700, border: "1px solid #FDE68A" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706", display: "inline-block" }}></span>
                {clientLocations.length} client(s) en direct
              </div>
            ) : (
              <div style={{ padding: "6px 14px", background: "#F1F5F9", borderRadius: 20, fontSize: 12, color: "#94A3B8" }}>
                Aucun client GPS actif
              </div>
            )}
            {lastUpdate && <span style={{ fontSize: 11, color: "#94A3B8" }}>Actualisé {lastUpdate.toLocaleTimeString()}</span>}
            <button onClick={fetchClientLocations}
              style={{ padding: "7px 14px", background: NAVY, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              🔄 Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Client list */}
      {clientLocations.length > 0 && (
        <div style={{ padding: "10px 24px", background: "#FFFBEB", borderBottom: "1px solid #FDE68A", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {clientLocations.map(c => (
            <div key={c.client_id} style={{ display: "flex", alignItems: "center", gap: 8, background: "white", padding: "6px 12px", borderRadius: 8, border: "1px solid #FDE68A", fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706", display: "inline-block" }}></span>
              <strong style={{ color: NAVY }}>{c.client_name}</strong>
              {c.telephone && <span style={{ color: "#64748b" }}>📞 {c.telephone}</span>}
              <span style={{ color: "#94A3B8" }}>il y a {timeSince(c.updated_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer center={[AGENCY.lat, AGENCY.lng]} zoom={8} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <AutoFit clientLocations={clientLocations} />

          {/* Agency */}
          <Circle center={[AGENCY.lat, AGENCY.lng]} radius={150}
            pathOptions={{ color: NAVY, fillColor: NAVY, fillOpacity: 0.1 }} />
          <Marker position={[AGENCY.lat, AGENCY.lng]} icon={agencyIcon}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 4 }}>🏢 Waieb Car Rent</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>Rue Taher Sfar, Sfax</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>📞 Lun-Sam 8h-19h</div>
              </div>
            </Popup>
          </Marker>

          {/* Real client GPS positions only */}
          {clientLocations.map(c => (
            <Marker key={`client-${c.client_id}`} position={[c.latitude, c.longitude]} icon={clientIcon}>
              <Popup>
                <div style={{ minWidth: 220 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#D97706", marginBottom: 8 }}>
                    📍 {c.client_name}
                  </div>
                  {c.telephone && (
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>📞 {c.telephone}</div>
                  )}
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4, fontFamily: "monospace" }}>
                    {Number(c.latitude).toFixed(6)}, {Number(c.longitude).toFixed(6)}
                  </div>
                  <div style={{ fontSize: 11, color: "#D97706", marginBottom: 10 }}>
                    🕐 Mis à jour il y a {timeSince(c.updated_at)}
                  </div>
                  <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                    target="_blank" rel="noreferrer"
                    style={{ display: "block", textAlign: "center", padding: "8px", background: NAVY, color: "white", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                    📍 Voir sur Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Overlay when no clients */}
        {!loading && clientLocations.length === 0 && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,0.95)", padding: "24px 32px", borderRadius: 12, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 1000 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <div style={{ fontWeight: 700, color: NAVY, fontSize: 16, marginBottom: 6 }}>Aucun client GPS actif</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>Les clients doivent activer le partage GPS dans l'application mobile</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ padding: "8px 24px", background: "white", borderTop: "1px solid #e2e8f0", display: "flex", gap: 20, fontSize: 12, color: "#64748b", alignItems: "center" }}>
        <span>🔵 Agence Sfax</span>
        <span style={{ color: "#D97706", fontWeight: 600 }}>🟠 Client GPS (position réelle)</span>
        <span style={{ marginLeft: "auto", color: "#94A3B8" }}>Actualisation automatique : 10s</span>
      </div>
    </div>
  );
}