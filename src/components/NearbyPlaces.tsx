"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";

interface Place {
  id: number;
  tags: {
    name?: string;
    tourism?: string;
  };
  lat: number;
  lon: number;
  distance?: number;
}

interface Props {
  onSelectPlace: (placeName: string) => void;
  selectedPlace: string;
}

export default function NearbyPlaces({ onSelectPlace, selectedPlace }: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Helper to calculate distance in km between two coords
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchNearby = () => {
    setLoading(true);
    setError("");
    setHasSearched(true);

    if (!navigator.geolocation) {
      setError("Din enhet stöder inte GPS-sökning.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Overpass QL query: Look for camping/caravan sites within 20km (20000m)
          const query = `
            [out:json];
            (
              node["tourism"="camp_site"](around:20000,${latitude},${longitude});
              node["tourism"="caravan_site"](around:20000,${latitude},${longitude});
            );
            out;
          `;
          const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
          });
          const data = await response.json();
          
          if (data && data.elements) {
            // Filter elements that actually have a name, calculate distance, and sort
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const foundPlaces = data.elements
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter((e: any) => e.tags && e.tags.name)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((e: any) => ({
                ...e,
                distance: getDistance(latitude, longitude, e.lat, e.lon)
              }))
              .sort((a: Place, b: Place) => (a.distance || 0) - (b.distance || 0))
              .slice(0, 5); // Keep top 5 closest
              
            setPlaces(foundPlaces);
            if (foundPlaces.length === 0) {
              setError("Inga ställplatser eller campingar hittades inom 2 mil.");
            }
          }
        } catch (err) {
          console.error(err);
          setError("Kunde inte hämta platser. Kolla din anslutning.");
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        console.error(geoErr);
        setError("Vänligen tillåt platstjänster/GPS för att kunna hitta närmaste ställplats.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div style={{ padding: "16px", backgroundColor: "var(--surface-color)", borderRadius: "var(--border-radius-lg)", border: "1px solid var(--border-color)" }}>
      {/* Search Header */}
      {!hasSearched ? (
        <button 
          onClick={fetchNearby}
          className="btn-primary" 
          style={{ width: "100%", display: "flex", gap: "8px", backgroundColor: "var(--surface-color)", color: "var(--accent-color)", border: "1px solid var(--accent-color)" }}
        >
          <Navigation size={18} />
          Hitta närmaste ställplatser
        </button>
      ) : (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase" }}>
              📍 Närmaste valbara platser
            </span>
            {loading && <span style={{ fontSize: "12px", color: "var(--accent-color)" }}>Söker GPS...</span>}
          </div>
        </div>
      )}

      {/* Error / Feedback */}
      {error && <p style={{ fontSize: "14px", color: "var(--danger-color)", marginTop: "8px" }}>{error}</p>}

      {/* Custom Input if nothing matched or user wants to type manually */}
      <input
        type="text"
        className="form-input"
        placeholder="Gatuadress, ort eller camping..."
        value={selectedPlace}
        onChange={(e) => onSelectPlace(e.target.value)}
        style={{ marginTop: "8px", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "12px" }}
      />

      {/* Quick Select Buttons */}
      {!loading && places.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
          {places.map((place) => {
            const isSelected = selectedPlace === place.tags.name;
            return (
              <button
                key={place.id}
                onClick={() => onSelectPlace(place.tags.name || "")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  borderRadius: "12px",
                  border: isSelected ? "2px solid var(--accent-color)" : "1px solid var(--border-color)",
                  backgroundColor: isSelected ? "rgba(52, 199, 89, 0.05)" : "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div>
                  <div style={{ fontWeight: "600", fontSize: "15px", color: "var(--text-primary)" }}>
                    {place.tags.name}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {place.tags.tourism === "camp_site" ? "Camping" : "Ställplats"}
                  </div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--accent-color)" }}>
                  {place.distance ? place.distance.toFixed(1) : "?"} km
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
}
