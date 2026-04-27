"use client";

import { useState, useMemo } from "react";
import { X, Calendar, MapPin, Download, ChevronDown, Image as ImageIcon } from "lucide-react";
import { LogEntry } from "./Map";

interface Props {
  logs: LogEntry[];
  bikeRoutes?: any[];
  plannedBikeRoutes?: any[];
  onClose: () => void;
  onSelectEntry: (entry: LogEntry) => void;
  onSelectBikeRoute?: (route: any) => void;
}

export default function LogbookPanel({ logs, bikeRoutes = [], plannedBikeRoutes = [], onClose, onSelectEntry, onSelectBikeRoute }: Props) {
  const [activeTab, setActiveTab] = useState<"logs" | "bikes">("logs");
  const [filterYear, setFilterYear] = useState<string>("Alla år");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "photos">("newest");
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Extrahera unika år från loggarna
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    logs.forEach(l => {
      const year = l.ankomst?.split("-")[0];
      if (year) years.add(year);
    });
    return ["Alla år", ...Array.from(years).sort().reverse()];
  }, [logs]);

  // Filtrering och sortering
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (filterYear !== "Alla år") {
      result = result.filter(l => l.ankomst?.startsWith(filterYear));
    }

    result.sort((a, b) => {
      const dateA = new Date(a.ankomst).getTime();
      const dateB = new Date(b.ankomst).getTime();
      if (sortBy === "newest") return dateB - dateA;
      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "photos") return (b.photos?.length || 0) - (a.photos?.length || 0);
      return 0;
    });

    return result;
  }, [logs, filterYear, sortBy]);

  const exportToCSV = () => {
    const headers = ["Datum", "Plats", "Typ", "Kommentar", "Bilder (antal)"];
    const rows = filteredLogs.map(l => [
      l.ankomst,
      l.spotName,
      l.spotType,
      l.notes?.replace(/,/g, ";"),
      l.photos?.length || 0
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `husbilslogg_export_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomDropdown = ({ value, options, onSelect, isOpen, setIsOpen }: any) => (
    <div style={{ position: "relative" }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "10px 14px", borderRadius: "12px", 
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", 
          color: "#fff", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
        }}
      >
        {value} <ChevronDown size={14} style={{ opacity: 0.5, transform: isOpen ? "rotate(180deg)" : "" }} />
      </button>
      {isOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 11,
            minWidth: "160px", background: "#1f2937", borderRadius: "12px", 
            border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            overflow: "hidden", animation: "fadeIn 0.2s"
          }}>
            {options.map((opt: any) => {
              const labelText = typeof opt === "string" ? opt : opt.label;
              const val = typeof opt === "string" ? opt : opt.value;
              return (
                <div 
                  key={val} 
                  onClick={() => { onSelect(val); setIsOpen(false); }}
                  style={{ 
                    padding: "12px 16px", fontSize: "13px", color: "#fff",
                    background: (typeof value === "string" ? value : value.value) === val ? "rgba(255,255,255,0.1)" : "transparent",
                    cursor: "pointer"
                  }}
                  className="dropdown-item"
                >
                  {labelText}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 4000,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
    }} onClick={onClose}>
      
      <div 
        style={{
          width: "100%", maxWidth: "600px", maxHeight: "90vh",
          background: "linear-gradient(165deg, #1c1f2e, #111827)",
          borderRadius: "32px", border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", margin: 0 }}>
            Loggbok
          </h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <button 
            onClick={() => setActiveTab("logs")} 
            style={{flex: 1, padding: "16px", background: activeTab === "logs" ? "rgba(255,255,255,0.05)" : "transparent", color: activeTab === "logs" ? "#fff" : "rgba(255,255,255,0.5)", border: "none", borderBottom: activeTab === "logs" ? "2px solid var(--accent-color)" : "2px solid transparent", fontWeight: 600, cursor: "pointer"}}
          >
            🚐 Incheckningar ({filteredLogs.length})
          </button>
          <button 
            onClick={() => setActiveTab("bikes")} 
            style={{flex: 1, padding: "16px", background: activeTab === "bikes" ? "rgba(255,255,255,0.05)" : "transparent", color: activeTab === "bikes" ? "#fff" : "rgba(255,255,255,0.5)", border: "none", borderBottom: activeTab === "bikes" ? "2px solid var(--accent-color)" : "2px solid transparent", fontWeight: 600, cursor: "pointer"}}
          >
            🚲 Cykelturer ({bikeRoutes.length + plannedBikeRoutes.length})
          </button>
        </div>

        {activeTab === "logs" ? (
          <>
            {/* Toolbar */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <CustomDropdown 
            value={filterYear} 
            options={availableYears} 
            onSelect={setFilterYear} 
            isOpen={showYearDropdown} 
            setIsOpen={setShowYearDropdown} 
          />
          <CustomDropdown 
            value={sortBy === "newest" ? "Senaste först" : sortBy === "oldest" ? "Äldst först" : "Mest bilder"} 
            options={[
              { label: "Senaste först", value: "newest" },
              { label: "Äldst först", value: "oldest" },
              { label: "Mest bilder", value: "photos" }
            ]} 
            onSelect={setSortBy} 
            isOpen={showSortDropdown} 
            setIsOpen={setShowSortDropdown} 
          />

          <button 
            onClick={exportToCSV}
            style={{ 
              marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "12px", background: "var(--accent-color)", 
              border: "none", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer"
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }} className="hide-scrollbar">
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
              <Calendar size={48} style={{ marginBottom: "16px", opacity: 0.2 }} />
              <p>Här var det tomt...</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredLogs.map(log => (
                <div 
                  key={log.docId} 
                  onClick={() => onSelectEntry(log)}
                  style={{
                    padding: "20px", borderRadius: "24px", background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.2s"
                  }}
                  className="log-item-hover"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "12px" }}>
                    <div style={{ fontWeight: "800", color: "#fff", fontSize: "17px", lineHeight: "1.2", flex: 1 }}>{log.spotName}</div>
                    <div style={{ fontSize: "12px", color: "var(--accent-color)", fontWeight: "800", whiteSpace: "nowrap" }}>{log.ankomst}</div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    {log.photos && log.photos.length > 0 ? (
                      <div style={{ position: "relative" }}>
                        <img src={log.photos[0]} style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover" }} />
                        {log.photos.length > 1 && (
                          <div style={{ position: "absolute", bottom: "-4px", right: "-4px", background: "var(--accent-color)", color: "#fff", fontSize: "10px", padding: "2px 5px", borderRadius: "6px", fontWeight: "900" }}>
                            +{log.photos.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MapPin size={20} style={{ opacity: 0.3 }} />
                      </div>
                    )}
                    <div style={{ flex: 1, fontSize: "14px", color: "rgba(255,255,255,0.5)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.4" }}>
                      {log.notes || "Ingen kommentar."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }} className="hide-scrollbar">
            {bikeRoutes.length === 0 && plannedBikeRoutes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize: 48, marginBottom: "16px", opacity: 0.2 }}>🚲</div>
                <p>Inga cykelturer sparade ännu...</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Planerade Turer */}
                {plannedBikeRoutes.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", marginLeft: "4px" }}>
                      🗺️ Planerade Rutter
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {plannedBikeRoutes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(route => (
                        <div 
                          key={route.id} 
                          onClick={() => onSelectBikeRoute?.(route)}
                          style={{
                            padding: "16px", borderRadius: "20px", background: "rgba(168, 85, 247, 0.1)",
                            border: "1px solid rgba(168, 85, 247, 0.3)", cursor: "pointer", transition: "all 0.2s"
                          }}
                          className="log-item-hover"
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                            <div style={{ fontWeight: "800", color: "#fff", fontSize: "16px", flex: 1 }}>{route.name || "Planerad Rutt"}</div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEditBikeRoute?.(route); }}
                              style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", marginLeft: "8px" }}
                            >
                              ✏️ Redigera
                            </button>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                            <MapPin size={12} style={{ display: "inline", marginRight: 4, position: "relative", top: 2 }} />
                            {route.waypoints?.length || 0} waypoints • Klicka för att starta
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Genomförda Turer */}
                {bikeRoutes.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", marginLeft: "4px" }}>
                      ✅ Genomförda Turer
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {bikeRoutes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(route => (
                        <div 
                          key={route.id} 
                          onClick={() => onSelectBikeRoute?.(route)}
                          style={{
                            padding: "16px", borderRadius: "20px", background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.2s"
                          }}
                          className="log-item-hover"
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                            <div style={{ fontWeight: "800", color: "#fff", fontSize: "16px", flex: 1 }}>{route.spotName || "Cykeltur"}</div>
                            <div style={{ fontSize: "12px", color: "var(--accent-color)", fontWeight: "800", whiteSpace: "nowrap" }}>
                              {new Date(route.date).toLocaleDateString("sv-SE")}
                            </div>
                          </div>
                          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                            <MapPin size={12} style={{ display: "inline", marginRight: 4, position: "relative", top: 2 }} />
                            {route.coordinates?.length || 0} GPS-punkter sparade
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .log-item-hover:hover { background: rgba(255,255,255,0.08) !important; transform: scale(1.01); }
        .dropdown-item:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>
    </div>
  );
}
