import Link from "next/link";
import { DynamicMap } from "../components/DynamicMap";

// Pre-populated demo waypoints just to show how the map looks. This will be replaced with Firestore data soon.
const demoWaypoints = [
  { id: "1", title: "Ställplats Varberg", lat: 57.105, lng: 12.247, type: "caravan_site" },
  { id: "2", title: "Falkenberg Camping", lat: 56.892, lng: 12.490, type: "camp_site" },
  { id: "3", title: "Getterön Naturreservat", lat: 57.119, lng: 12.222, type: "nature_reserve" },
];

export default function Home() {
  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        className="glass-panel"
        style={{
          position: "absolute",
          top: "max(12px, var(--safe-top))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          padding: "6px",
          borderRadius: "40px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          minWidth: "120px"
        }}
      >
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          overflow: "hidden",
          border: "2px solid var(--accent-color)",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}>
          <img src="/husbil.jpg" style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="Husbilslogg" />
        </div>
        <div style={{ paddingRight: "16px" }}>
          <h1 style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "-0.2px", color: "#fff" }}>Husbilslogg</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "11px", marginTop: "-2px" }}>Rollis äventyr</p>
        </div>
      </div>

      {/* Full height map background */}
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <DynamicMap
          center={[57.105, 12.247]}
          zoom={10}
          waypoints={demoWaypoints}
        />

        {/* Subtil gradient fade i botten för att rama in knapparna */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "180px",
            background: "linear-gradient(to top, rgba(17, 24, 39, 0.8) 0%, rgba(17, 24, 39, 0.4) 40%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 2
          }}
        />
      </div>

    </main>
  );
}
