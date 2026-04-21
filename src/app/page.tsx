import Link from "next/link";
import { DynamicMap } from "../components/DynamicMap";

// Pre-populated demo waypoints just to show how the map looks. This will be replaced with Firestore data soon.
const demoWaypoints = [
  { id: "1", title: "Ställplats Varberg", lat: 57.105, lng: 12.247 },
  { id: "2", title: "Falkenberg Camping", lat: 56.892, lng: 12.490 },
  { id: "3", title: "Getterön Naturreservat", lat: 57.119, lng: 12.222 },
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
            7 Vackra nätter i år
          </p>
        </div>
        <div style={{ fontSize: "36px" }}>🚐</div>
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

      {/* Floating Action Button (FAB) for Snabba Anteckningar */}
      <Link 
        href="/ny-logg" 
        className="fab" 
        aria-label="Skapa ny logg" 
        style={{ textDecoration: "none" }}
      >
        +
      </Link>
    </main>
  );
}
