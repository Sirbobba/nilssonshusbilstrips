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
      {/* Header Panel overlapping the map */}
      <div
        className="glass-panel"
        style={{
          position: "absolute",
          top: "max(16px, var(--safe-top))",
          left: "16px",
          right: "16px",
          zIndex: 10,
          padding: "20px",
          borderRadius: "var(--border-radius-lg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Husbilslogg</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Rollis äventyr
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link
            href="/ny-logg"
            style={{ 
              textDecoration: "none",
              background: "var(--accent-color)",
              color: "white",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
              boxShadow: "0 4px 12px rgba(52, 199, 89, 0.3)",
            }}
          >
            +
          </Link>
          <div style={{ fontSize: "36px" }}>🚐</div>
        </div>
      </div>

      {/* Full height map background */}
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <DynamicMap
          center={[57.105, 12.247]}
          zoom={10}
          waypoints={demoWaypoints}
        />

        {/* Graident fade at the bottom to transition smoothly to edge */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "150px",
            background: "linear-gradient(to top, var(--bg-color) 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 2
          }}
        />
      </div>

    </main>
  );
}
