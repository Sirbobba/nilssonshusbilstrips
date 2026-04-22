"use client";

import { useEffect, useRef, useState } from "react";

// Helper for distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export interface Suggestion {
  id: string;
  spotName: string;
  spotId: string;
  lat: number;
  lon: number;
  type: string;
  arrivalTime: string;
  timestamp: number;
}

export function useAutoLogger() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const lastPosRef = useRef<{ lat: number; lon: number; time: number } | null>(null);
  const lastFetchRef = useRef<number>(0);
  
  // Load suggestions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("checkin_suggestions");
    if (saved) {
      try {
        setSuggestions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse suggestions", e);
      }
    }
  }, []);

  // Save suggestions to localStorage when they change
  useEffect(() => {
    localStorage.setItem("checkin_suggestions", JSON.stringify(suggestions));
  }, [suggestions]);

  useEffect(() => {
    // Timer för att räkna upp tiden även om GPS:en inte skickar nya signaler (viktigt för test!)
    const tickInterval = setInterval(() => {
      if (lastPosRef.current) {
        const now = Date.now();
        const timeStillSeconds = (now - lastPosRef.current.time) / 1000;
        
        // Tyst räknare i bakgrunden

        if (timeStillSeconds >= 1200) { // 20 minuter
          checkForSpots(lastPosRef.current.lat, lastPosRef.current.lon, lastPosRef.current.time);
        }
      }
    }, 1000);

    const checkForSpots = async (lat: number, lon: number, startTime: number) => {
      // Spärr: Fråga inte oftare än var 30:e sekund totalt
      const now = Date.now();
      if (now - lastFetchRef.current < 30000) return;
      
      // Kolla om vi redan har ett förslag här för att inte dubbel-posta
      const alreadySuggested = suggestions.some(s => getDistance(lat, lon, s.lat, s.lon) < 200);
      if (alreadySuggested) return;

      // 1. Skapa Fricamping-förslaget direkt (behöver ingen internet-sökning)
      const wildSuggestion: Suggestion = {
        id: `sug_wild_${Date.now()}`,
        spotName: "Fricamping (här)",
        spotId: "wild_camping",
        lat: lat,
        lon: lon,
        type: "wild_camping",
        arrivalTime: new Date(startTime).toISOString().split('T')[0],
        timestamp: Date.now()
      };

      setSuggestions(prev => [wildSuggestion, ...prev].slice(0, 5));

      // 2. Försök hämta officiella platser i bakgrunden
      try {
        const queryStr = `[out:json];(node["tourism"~"camp_site|caravan_site"](around:500,${lat},${lon});node["leisure"="marina"](around:500,${lat},${lon}););out;`;
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: queryStr
        });
        
        if (res.ok) {
          const data = await res.json();
          const spots = data.elements || [];
          if (spots.length > 0) {
            const officialSuggestions = spots.slice(0, 2).map((spot: any) => ({
              id: `sug_${spot.id}_${Date.now()}`,
              spotName: spot.tags.name || "Okänd plats",
              spotId: String(spot.id),
              lat: spot.lat || spot.center?.lat,
              lon: spot.lon || spot.center?.lon,
              type: spot.tags.tourism || spot.tags.leisure,
              arrivalTime: new Date(startTime).toISOString().split('T')[0],
              timestamp: Date.now()
            }));
            setSuggestions(prev => [...prev, ...officialSuggestions].slice(0, 6));
          }
        }
        lastFetchRef.current = now;
      } catch (e) {
        console.log("AutoLogger: Kart-servern svarade inte, men Fricamping är tillgängligt.");
      }
        
      // Reset timer för denna position så den slutar räkna upp
      if (lastPosRef.current) {
        lastPosRef.current.time = Date.now();
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        const now = Date.now();

        if (accuracy > 250) return; // Lite mer generös än 150 för mobil

        if (!lastPosRef.current) {
          lastPosRef.current = { lat, lon, time: now };
          return;
        }

        const dist = getDistance(lat, lon, lastPosRef.current.lat, lastPosRef.current.lon);
        if (dist > 100) {
          console.log(`AutoLogger: Förflyttning upptäckt (${dist.toFixed(0)}m), återställer timer.`);
          lastPosRef.current = { lat, lon, time: now };
        }
      },
      (err) => console.error("AutoLogger Geolocation error", err),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(tickInterval);
    };
  }, [suggestions]);

  const removeSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  return { suggestions, removeSuggestion };
}
