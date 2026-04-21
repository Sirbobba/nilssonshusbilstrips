"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { addDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Leaflet icon fix ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function emojiIcon(emoji: string, size = 30) {
  return L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));transition:transform 0.15s">${emoji}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const campIcon    = emojiIcon("⛺", 30);
const caravanIcon = emojiIcon("🚐", 30);
const natureIcon  = emojiIcon("🌲", 28);
const meIcon = L.divIcon({
  html: `
    <style>
      .me-icon-wrap {
        opacity: 0.92;
        pointer-events: none;
        animation: gpsPulse 2.5s ease-in-out infinite;
      }
      @keyframes gpsPulse {
        0%,100% { box-shadow: 0 0 0 5px rgba(37,99,235,0.3), 0 4px 14px rgba(0,0,0,0.5); }
        50%      { box-shadow: 0 0 0 12px rgba(37,99,235,0.1), 0 4px 14px rgba(0,0,0,0.5); }
      }
    </style>
    <div class="me-icon-wrap" style="
      width: 72px; height: 72px; border-radius: 50%;
      border: 3px solid #2563eb;
      box-shadow: 0 0 0 5px rgba(52,199,89,0.25), 0 4px 14px rgba(0,0,0,0.5);
      overflow: hidden;
      background: #A18C6F;
      display:flex; align-items:center; justify-content:center;
    ">
      <img src="/husbil.jpg"
        style="width:100%;height:100%;object-fit:contain;display:block;padding:4px;box-sizing:border-box;"
        alt="Vår position"
      />
    </div>
  `,
  className: "",
  iconSize:   [72, 72],
  iconAnchor: [36, 36],
  popupAnchor:[0, -40],
});

// Besökt-ikoner med grön bock-badge
function emojiIconVisited(emoji: string, size = 30) {
  return L.divIcon({
    html: `
      <div style="position:relative;display:inline-block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
        <div style="font-size:${size}px;line-height:1">${emoji}</div>
        <div style="position:absolute;top:-5px;right:-6px;background:#34c759;border-radius:50%;width:14px;height:14px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:900;line-height:1">✓</div>
      </div>`,
    className: "",
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}
const visitedCampIcon    = emojiIconVisited("⛺",  30);
const visitedCaravanIcon = emojiIconVisited("🚐", 30);
const visitedNatureIcon  = emojiIconVisited("🌲", 28);

// ─── Thunderforest tile styles ────────────────────────────────────────────────
const TF_KEY = process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY;

type MapStyle = { id: string; label: string; url: string; group: string };

const MAP_STYLES: MapStyle[] = [
  { id: "outdoors",        label: "🚗 Utomhus",         url: `https://api.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${TF_KEY}`,   group: "Thunderforest" },
  { id: "cycle",           label: "🚴 Cykel",            url: `https://api.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${TF_KEY}`,      group: "Thunderforest" },
  { id: "landscape",       label: "🗺️ Landskap",         url: `https://api.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=${TF_KEY}`,  group: "Thunderforest" },
  { id: "atlas",           label: "📍 Atlas",            url: `https://api.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${TF_KEY}`,      group: "Thunderforest" },
  { id: "stadia-smooth",   label: "☀️ Ljus (Stadia)",   url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png",         group: "Stadia" },
  { id: "stadia-dark",     label: "🌙 Mörk (Stadia)",   url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png",    group: "Stadia" },
  { id: "stadia-outdoors", label: "🏕️ Natur (Stadia)",  url: "https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}.png",              group: "Stadia" },
  { id: "stadia-terrain",  label: "⛰️ Terräng (Stadia)",url: "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png",        group: "Stadia" },
];

// ─── Types ───────────────────────────────────────────────────────────────────
export interface OsmSpot {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  type: "camp_site" | "caravan_site";
}

interface LogEntry {
  docId:     string;
  spotId:    string;
  spotName:  string;
  ankomst:   string;
  avresa:    string;
  notes:     string;
  photos:    string[];
}

interface UnifiedSpot {
  id: string;
  lat: number;
  lon: number;
  name: string;
  type: "camp_site" | "caravan_site" | "nature_reserve";
  category?: string;
  website?: string;
  description?: string;
  wikipedia?: string;
  originalTags?: Record<string, string>;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  waypoints?: Array<{ id: string; lat: number; lng: number; title: string }>;
}

// ─── Tooltip helper ───────────────────────────────────────────────────────────
function spotDisplayName(tags: Record<string, string>, type: OsmSpot["type"]) {
  return tags.name
    ?? tags.operator
    ?? tags.description
    ?? [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ")
    ?? (type === "caravan_site" ? "Ställplats" : "Camping");
}

// ─── Check-In Modal ───────────────────────────────────────────────────────────
function CheckInModal({
  spot,
  previousVisits,
  onClose,
}: {
  spot: UnifiedSpot;
  previousVisits: LogEntry[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"checkin" | "history">(previousVisits.length > 0 ? "history" : "checkin");
  const today = new Date().toISOString().split("T")[0];
  const [ankomst, setAnkomst] = useState(today);
  const [avresa, setAvresa]   = useState(today);
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const name      = spot.name;
  const typeLabel = spot.type === "caravan_site" ? "🚐 Ställplats" : spot.type === "camp_site" ? "⛺ Camping" : "🌲 Naturreservat";

  const handleSave = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, "loggs"), {
        spotId:    spot.id,
        spotName:  name,
        spotType:  spot.type,
        lat:       spot.lat,
        lon:       spot.lon,
        ankomst,
        avresa,
        notes,
        photos:    [],
        createdAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(onClose, 1400);
    } catch (e) {
      console.error("Firestore error:", e);
      setSaving(false);
    }
  };

   // Stäng på Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 env(safe-area-inset-bottom,0)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity:0 } to { transform: translateY(0); opacity:1 } }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        .checkin-input {
          width: 100%; padding: 10px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15);
          color: #fff; font-size: 15px; outline: none; box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .checkin-input:focus { border-color: var(--accent-color, #34c759); }
        .checkin-input::placeholder { color: rgba(255,255,255,0.35); }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 520,
        background: "linear-gradient(160deg, #1c1f2e, #111827)",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        overflow: "hidden",
      }}>
        {/* Drag handle */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>

        <div style={{ padding: "16px 24px 28px" }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{typeLabel}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{name}</div>
              {(spot.originalTags?.["addr:city"] || spot.category) && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
                  {spot.originalTags?.["addr:city"] ? `📍 ${spot.originalTags["addr:city"]}` : spot.category}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
              borderRadius: "50%", width: 32, height: 32, fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>✕</button>
          </div>

          {/* Info-rad */}
          {(spot.originalTags?.website || spot.originalTags?.phone || spot.originalTags?.fee || spot.website || spot.wikipedia || spot.description) && (
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16, padding:"10px 14px", borderRadius:12, background:"rgba(255,255,255,0.05)" }}>
              {spot.originalTags?.fee     && <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>💰 {spot.originalTags.fee === "yes" ? "Kostar" : spot.originalTags.fee === "no" ? "Gratis" : spot.originalTags.fee}</span>}
              {spot.originalTags?.capacity && <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>🔢 {spot.originalTags.capacity} platser</span>}
              {spot.originalTags?.phone   && <a href={`tel:${spot.originalTags.phone}`} style={{ fontSize:12, color:"var(--accent-color,#34c759)" }}>📞 {spot.originalTags.phone}</a>}
              {(spot.originalTags?.website || spot.website) && <a href={spot.originalTags?.website || spot.website} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"var(--accent-color,#34c759)" }}>🔗 Hemsida</a>}
              {spot.wikipedia && (
                <a href={`https://sv.wikipedia.org/wiki/${spot.wikipedia.replace("sv:", "")}`} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"var(--accent-color,#34c759)" }}>
                  📖 Wikipedia
                </a>
              )}
              {spot.description && (
                <div style={{ width: "100%", fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic", marginTop: 4 }}>
                  &quot;{spot.description}&quot;
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", gap:6, marginBottom:20 }}>
            {(["checkin", "history"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1, padding:"8px", borderRadius:10, border:"none", cursor:"pointer",
                fontSize:13, fontWeight:600,
                background: tab === t ? "rgba(255,255,255,0.12)" : "transparent",
                color: tab === t ? "#fff" : "rgba(255,255,255,0.4)",
                transition:"all 0.2s",
                position:"relative",
              }}>
                {t === "checkin" ? "✏️ Ny incheckning" : `🗓️ Historik${previousVisits.length > 0 ? ` (${previousVisits.length})` : ""}`}
                {tab === t && <div style={{ position:"absolute", bottom:0, left:"20%", right:"20%", height:2, borderRadius:1, background:"var(--accent-color,#34c759)" }} />}
              </button>
            ))}
          </div>

          {/* Tab: Ny incheckning */}
          {tab === "checkin" && (<>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={{ display:"block", fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>Ankomst</label>
                <input type="date" className="checkin-input" lang="sv-SE" value={ankomst} onChange={e => setAnkomst(e.target.value)} style={{ colorScheme:"dark" }} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>Avresa</label>
                <input type="date" className="checkin-input" lang="sv-SE" value={avresa} min={ankomst} onChange={e => setAvresa(e.target.value)} style={{ colorScheme:"dark" }} />
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>Anteckningar</label>
              <textarea className="checkin-input" placeholder="Vad hände? Väder, mat, upplevelser…" rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ resize:"vertical", fontFamily:"inherit" }} />
            </div>
            <div style={{ marginBottom:16, padding:"12px", borderRadius:12, border:"1.5px dashed rgba(255,255,255,0.12)", textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>
              📷 Bilduppladdning — kommer snart
            </div>
            <button onClick={handleSave} disabled={saving || saved} style={{
              width:"100%", padding:"14px", borderRadius:14, border:"none",
              cursor: saving || saved ? "default" : "pointer", fontSize:16, fontWeight:700,
              background: saved ? "rgba(52,199,89,0.3)" : saving ? "rgba(255,255,255,0.1)" : "var(--accent-color,#34c759)",
              color: saved ? "#34c759" : "#fff", transition:"all 0.3s ease",
              boxShadow: saved ? "none" : "0 4px 20px rgba(52,199,89,0.35)",
            }}>
              {saved ? "✅ Incheckad!" : saving ? "Sparar…" : "Checka in här 🏁"}
            </button>
          </>)}

          {/* Tab: Historik */}
          {tab === "history" && (
            <div style={{ maxHeight:280, overflowY:"auto", scrollbarWidth:"none" }}>
              {previousVisits.length === 0 ? (
                <div style={{ textAlign:"center", color:"rgba(255,255,255,0.35)", padding:"24px 0", fontSize:14 }}>
                  Inga tidigare besök
                </div>
              ) : (
                previousVisits
                  .sort((a,b) => b.ankomst.localeCompare(a.ankomst))
                  .map((v, i) => (
                    <div key={v.docId ?? i} style={{
                      padding:"12px 14px", borderRadius:12, marginBottom:8,
                      background:"rgba(255,255,255,0.05)",
                      borderLeft:"3px solid var(--accent-color,#34c759)",
                    }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#fff", marginBottom:4 }}>
                        📅 {v.ankomst} → {v.avresa}
                      </div>
                      {v.notes && <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{v.notes}</div>}
                      {!v.notes && <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontStyle:"italic" }}>Inga anteckningar</div>}
                    </div>
                  ))
              )}
              <button onClick={() => setTab("checkin")} style={{
                width:"100%", marginTop:8, padding:"12px", borderRadius:12, border:"none",
                cursor:"pointer", fontSize:14, fontWeight:600,
                background:"rgba(52,199,89,0.15)", color:"#34c759", transition:"all 0.2s",
              }}>
                + Lägg till nytt besök
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ChangeView ───────────────────────────────────────────────────────────────
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

// ─── Användarens position ─────────────────────────────────────────────────────
function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    locationfound(e) { setPosition(e.latlng); map.flyTo(e.latlng, map.getZoom()); },
  });
  useEffect(() => { map.locate(); }, [map]);
  return position === null ? null : (
    <Marker position={position} icon={meIcon} zIndexOffset={-500}>
      <Popup>Här är du just nu! 📍</Popup>
    </Marker>
  );
}

// ─── CampingLayer ─────────────────────────────────────────────────────────────
function CampingLayer({
  enabled,
  visitedSpots,
  onSpotClick,
}: {
  enabled: boolean;
  visitedSpots: Record<string, LogEntry[]>;
  onSpotClick: (spot: UnifiedSpot) => void;
}) {
  const map = useMap();
  const [spots, setSpots]   = useState<OsmSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const seenIdsRef  = useRef<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const fetchingRef = useRef(false);

  const fetchSpots = useCallback(async () => {
    if (!enabled || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    const b    = map.getBounds();
    const bbox = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`;
    const query = `[out:json][timeout:25];(
      node["tourism"="camp_site"](${bbox});
      node["tourism"="caravan_site"](${bbox});
      way["tourism"="camp_site"](${bbox});
      way["tourism"="caravan_site"](${bbox});
    );out center 100;`;

    try {
      const res  = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newSpots: OsmSpot[] = data.elements
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((el: any) => !seenIdsRef.current.has(el.id))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((el: any) => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          return { id: el.id, lat, lon, tags: el.tags ?? {}, type: el.tags?.tourism as OsmSpot["type"] };
        })
        .filter((s: OsmSpot) => s.lat && s.lon);

      if (newSpots.length > 0) {
        newSpots.forEach(s => seenIdsRef.current.add(s.id));
        setSpots(prev => [...prev, ...newSpots]);
      }
    } catch (e) {
      console.error("Overpass API error:", e);
    }

    fetchingRef.current = false;
    setLoading(false);
  }, [map, enabled]);

  // Hämta när lagret aktiveras
  useEffect(() => {
    if (enabled) fetchSpots();
  }, [enabled, fetchSpots]);

  // Debounced fetch vid panorering
  useMapEvents({
    moveend: () => {
      if (!enabled) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchSpots, 700);
    },
  });

  if (!enabled) return null;

  return (
    <>
      {loading && (
        <div style={{
          position: "absolute", bottom: 56, left: 12,
          zIndex: 2000, background: "rgba(0,0,0,0.65)",
          color: "#fff", padding: "5px 12px", borderRadius: 20, fontSize: 12,
          backdropFilter: "blur(4px)",
        }}>
          ⏳ Laddar platser…
        </div>
      )}
      {spots.map(spot => {
        const name    = spotDisplayName(spot.tags, spot.type);
        const visits  = visitedSpots[String(spot.id)] ?? [];
        const visited = visits.length > 0;
        const icon    = spot.type === "caravan_site"
          ? (visited ? visitedCaravanIcon : caravanIcon)
          : (visited ? visitedCampIcon   : campIcon);
        
        // Konvertera till UnifiedSpot för modalen
        const unified: UnifiedSpot = {
          id: String(spot.id),
          lat: spot.lat,
          lon: spot.lon,
          name,
          type: spot.type,
          originalTags: spot.tags
        };

        return (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lon]}
            icon={icon}
            eventHandlers={{
              mouseover: e => e.target.openPopup(),
              mouseout:  e => e.target.closePopup(),
              click:     () => onSpotClick(unified),
            }}
          >
            <Popup>
              <div style={{ minWidth: 140, fontFamily: "system-ui, sans-serif" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                  {spot.type === "caravan_site" ? "🚐 Ställplats" : "⛺ Camping"}
                </div>
                {visited && (
                  <div style={{ fontSize: 11, color: "#34c759", marginBottom: 4 }}>
                    ✓ Besökt {visits.length} gång{visits.length > 1 ? "er" : ""}
                  </div>
                )}
                {spot.tags.fee      && <div style={{ fontSize: 12 }}>💰 {spot.tags.fee === "yes" ? "Kostar" : spot.tags.fee === "no" ? "Gratis" : spot.tags.fee}</div>}
                {spot.tags.capacity && <div style={{ fontSize: 12 }}>🔢 {spot.tags.capacity} platser</div>}
                <div style={{ marginTop: 8, fontSize: 12, color: "#34c759", fontWeight: 600 }}>
                  {visited ? "Se historik / checka in →" : "Klicka för att checka in →"}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// ─── NaturLayer ───────────────────────────────────────────────────────────────
function NaturLayer({
  enabled,
  visitedSpots,
  onSpotClick,
}: {
  enabled: boolean;
  visitedSpots: Record<string, LogEntry[]>;
  onSpotClick: (spot: UnifiedSpot) => void;
}) {
  const map = useMap();
  const [spots, setSpots] = useState<UnifiedSpot[]>([]);
  const seenIdsRef  = useRef<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const fetchingRef = useRef(false);

  const fetchNatur = useCallback(async () => {
    if (!enabled || fetchingRef.current) return;
    fetchingRef.current = true;

    const b = map.getBounds();
    const bbox = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`;
    const query = `[out:json][timeout:25];(
      node["leisure"="nature_reserve"](${bbox});
      way["leisure"="nature_reserve"](${bbox});
      relation["leisure"="nature_reserve"](${bbox});
    );out center 80;`;

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newSpots: UnifiedSpot[] = (data.elements ?? []).flatMap((el: any) => {
        const id = String(el.id);
        if (seenIdsRef.current.has(id)) return [];
        seenIdsRef.current.add(id);

        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (!lat || !lon) return [];

        return [{
          id, lat, lon,
          name:        el.tags?.name        ?? "Naturreservat",
          category:    el.tags?.operator    ?? "Skyddat område",
          description: el.tags?.description ?? el.tags?.note,
          website:     el.tags?.website,
          wikipedia:   el.tags?.wikipedia,
        }];
      });

      if (newSpots.length > 0) {
        setSpots(prev => [...prev, ...newSpots]);
      }
    } catch (e) {
      console.error("Overpass Natur API:", e);
    }
    fetchingRef.current = false;
  }, [map, enabled]);

  useEffect(() => { if (enabled) fetchNatur(); }, [enabled, fetchNatur]);

  useMapEvents({
    moveend: () => {
      if (!enabled) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchNatur, 700);
    },
  });

  if (!enabled) return null;

  return (
    <>
      {spots.map(spot => {
        const visits = visitedSpots[spot.id] ?? [];
        const visited = visits.length > 0;

        return (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lon]}
            icon={visited ? visitedNatureIcon : natureIcon}
            eventHandlers={{
              mouseover: e => e.target.openPopup(),
              mouseout:  e => e.target.closePopup(),
              click:     () => onSpotClick(spot),
            }}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>🌲 {spot.name}</div>
                <div style={{ fontSize: 11, color: "#666" }}>{spot.category}</div>
                {visited && (
                  <div style={{ fontSize: 11, color: "#34c759", marginTop: 4 }}>
                    ✓ Besökt {visits.length} gång{visits.length > 1 ? "er" : ""}
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 12, color: "#34c759", fontWeight: 600 }}>
                  Klicka för info & check-in →
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}


// ─── ToggleBtn (utanför Map för att undvika React re-render-problem) ─────────
function ToggleBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{
      display: "block", width: "100%", padding: "6px 12px",
      borderRadius: "20px", border: "none", cursor: "pointer",
      fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)", marginBottom: "4px",
      background: active ? "#f59e0b" : "rgba(30,30,40,0.85)",
      color: "#fff", backdropFilter: "blur(8px)", transition: "all 0.2s ease",
    }}>{label}</button>
  );
}

// ─── Huvud-komponent ──────────────────────────────────────────────────────────
export default function Map({ center = [57.70887, 11.97456], zoom = 6, waypoints = [] }: MapProps = {} as MapProps) {
  const [activeStyle,  setActiveStyle]  = useState(MAP_STYLES[0]);
  const [showCamping,  setShowCamping]  = useState(false);
  const [showNatur,    setShowNatur]    = useState(false);
  const [checkinSpot,  setCheckinSpot]  = useState<UnifiedSpot | null>(null);
  const [visitedSpots, setVisitedSpots] = useState<Record<string, LogEntry[]>>({});

  // Realtidslyssnare på Firestore — bygg upp visitedSpots index
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "loggs"), (snap) => {
      const idx: Record<string, LogEntry[]> = {};
      snap.docs.forEach(doc => {
        const d = { ...doc.data(), docId: doc.id } as LogEntry;
        if (!idx[d.spotId]) idx[d.spotId] = [];
        idx[d.spotId].push(d);
      });
      setVisitedSpots(idx);
    });
    return () => unsub();
  }, []);

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "inherit", overflow: "hidden", position: "relative" }}>

      {/* ── Karttyps- & lagerväljare ── */}
      <div style={{
        position: "absolute", bottom: "24px", right: "12px", zIndex: 1000,
        display: "flex", flexDirection: "column", gap: "4px",
        maxHeight: "calc(100% - 48px)", overflowY: "auto",
        paddingRight: "2px", scrollbarWidth: "none",
      }}>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textAlign: "center", paddingBottom: "2px", letterSpacing: "0.05em" }}>Lager</div>
        <ToggleBtn active={showCamping} onClick={() => setShowCamping(v => !v)} label="🏕️ Campingar" />
        <ToggleBtn active={showNatur}   onClick={() => setShowNatur(v => !v)}   label="🌲 Naturreservat" />

        {["Thunderforest", "Stadia"].map((group, gi) => (
          <div key={group}>
            <div style={{
              borderTop: gi > 0 ? "1px solid rgba(255,255,255,0.15)" : undefined,
              fontSize: "10px", color: "rgba(255,255,255,0.4)",
              textAlign: "center", padding: "4px 0 2px", letterSpacing: "0.05em",
            }}>{group}</div>
            {MAP_STYLES.filter(s => s.group === group).map(style => (
              <button key={style.id} onClick={() => setActiveStyle(style)} style={{
                display: "block", width: "100%", padding: "6px 12px",
                borderRadius: "20px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)", marginBottom: "4px",
                background: activeStyle.id === style.id ? "var(--accent-color, #34c759)" : "rgba(30,30,40,0.85)",
                color: activeStyle.id === style.id ? "#fff" : "rgba(255,255,255,0.8)",
                backdropFilter: "blur(8px)", transition: "all 0.2s ease",
              }}>{style.label}</button>
            ))}
          </div>
        ))}
      </div>

      {/* ── Karta ── */}
      <MapContainer center={center} zoom={zoom} zoomControl={false}
        style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          key={activeStyle.id}
          attribution='&copy; <a href="https://www.thunderforest.com">Thunderforest</a> / <a href="https://stadiamaps.com">Stadia</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={activeStyle.url}
        />
        <LocationMarker />
        <CampingLayer enabled={showCamping} visitedSpots={visitedSpots} onSpotClick={setCheckinSpot} />
        <NaturLayer   enabled={showNatur}   visitedSpots={visitedSpots} onSpotClick={setCheckinSpot} />
        {waypoints.map(wp => (
          <Marker key={wp.id} position={[wp.lat, wp.lng]}>
            <Popup>{wp.title}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Check-In Modal (utanför kartan) ── */}
      {checkinSpot && (
        <CheckInModal
          spot={checkinSpot}
          previousVisits={visitedSpots[String(checkinSpot.id)] ?? []}
          onClose={() => setCheckinSpot(null)}
        />
      )}
    </div>
  );
}
