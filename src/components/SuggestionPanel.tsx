"use client";

import { Suggestion } from "@/hooks/useAutoLogger";
import { X, Check, MapPin, Clock } from "lucide-react";

interface Props {
  suggestions: Suggestion[];
  onAccept: (suggestion: Suggestion) => void;
  onDecline: (id: string) => void;
  onClose: () => void;
}

export default function SuggestionPanel({ suggestions, onAccept, onDecline, onClose }: Props) {
  return (
    <div style={{
      position: "fixed",
      bottom: "110px",
      left: "24px",
      right: "24px",
      maxWidth: "400px",
      zIndex: 2000,
      background: "linear-gradient(160deg, #1c1f2e, #111827)",
      borderRadius: "20px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
      border: "1px solid rgba(255,255,255,0.1)",
      padding: "20px",
      animation: "slideUp 0.3s ease-out"
    }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }
      `}</style>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={18} className="text-accent" />
          Nya platsförslag ({suggestions.length})
        </h3>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto", scrollbarWidth: "none" }}>
        {suggestions.map(s => (
          <div key={s.id} style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "14px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ background: "rgba(52, 199, 89, 0.2)", padding: "10px", borderRadius: "12px" }}>
                <MapPin size={20} style={{ color: "var(--accent-color)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "15px", color: "#fff" }}>{s.spotName}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                  Ankomst: {s.arrivalTime}
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button 
                onClick={() => onAccept(s)}
                style={{
                  flex: 2,
                  background: "var(--accent-color)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Check size={16} /> Checka in
              </button>
              <button 
                onClick={() => onDecline(s.id)}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Avböj
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
