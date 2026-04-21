"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NearbyPlaces from "../../components/NearbyPlaces";

export default function NyLoggPage() {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [locationName, setLocationName] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages((prev) => [...prev, ...filesArray]);
    }
  };

  const handleSave = async () => {
    if (!note && images.length === 0) return;
    
    setIsSaving(true);
    // TODO: Spara till Firestore och ladda upp bilder via /api/upload
    
    // Simulera sparande
    setTimeout(() => {
      setIsSaving(false);
      router.push("/");
    }, 1500);
  };

  return (
    <main style={{ padding: "16px", minHeight: "100vh", paddingBottom: "100px" }}>
      <header className="flex items-center" style={{ marginBottom: "24px", paddingTop: "8px" }}>
        <button 
          onClick={() => router.back()} 
          style={{ 
            background: "none", border: "none", fontSize: "16px", 
            color: "var(--accent-color)", padding: "8px", cursor: "pointer",
            fontWeight: "500" 
          }}
        >
          Avbryt
        </button>
        <h1 style={{ flex: 1, textAlign: "center", fontSize: "18px", fontWeight: "600" }}>Ny anteckning</h1>
        <button 
          onClick={handleSave} 
          disabled={isSaving || (!note && images.length === 0)}
          style={{ 
            background: "none", border: "none", fontSize: "16px", 
            color: "var(--accent-color)", padding: "8px", cursor: "pointer",
            fontWeight: "bold",
            opacity: isSaving || (!note && images.length === 0) ? 0.5 : 1
          }}
        >
          {isSaving ? "Sparar..." : "Spara"}
        </button>
      </header>

      <section className="flex flex-col gap-4">
        {/* Smarta Platser via GPS */}
        <NearbyPlaces 
          selectedPlace={locationName} 
          onSelectPlace={setLocationName} 
        />

        {/* Text */}
        <textarea
          className="form-input"
          placeholder="Vad händer just nu?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ border: "none", paddingLeft: 0, paddingRight: 0, backgroundColor: "transparent", fontSize: "18px" }}
          autoFocus
        />

        {/* Bilder-förhandsvisning */}
        {images.length > 0 && (
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginTop: "16px" }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: "relative", minWidth: "120px", height: "120px", borderRadius: "12px", overflow: "hidden" }}>
                <img 
                  src={URL.createObjectURL(img)} 
                  alt="Preview" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
                <button 
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  style={{ 
                    position: "absolute", top: "4px", right: "4px", 
                    background: "rgba(0,0,0,0.5)", color: "white", 
                    border: "none", borderRadius: "50%", width: "24px", height: "24px",
                    display: "flex", justifyContent: "center", alignItems: "center"
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bildväljare (triggar iOS bibliotek & HEIC nativt) */}
        <div style={{ marginTop: "16px" }}>
          <label 
            htmlFor="image-upload" 
            className="btn-primary" 
            style={{ 
              display: "inline-flex", 
              backgroundColor: "var(--surface-color)", 
              color: "var(--accent-color)", 
              border: "1px solid var(--border-color)",
              padding: "12px 20px"
            }}
          >
            📷 Lägg till bilder
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>
      </section>
    </main>
  );
}
