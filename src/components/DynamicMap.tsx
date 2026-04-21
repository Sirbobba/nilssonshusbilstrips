"use client";

import dynamic from "next/dynamic";

export const DynamicMap = dynamic(() => import("./Map").then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div 
      style={{ 
        height: "100%", width: "100%", display: "flex", 
        alignItems: "center", justifyContent: "center", 
        backgroundColor: "var(--surface-color)", color: "var(--text-secondary)",
        borderRadius: "inherit"
      }}
    >
      Laddar karta...
    </div>
  ),
});
