# 🚐 Nilssons Husbilslogg

En intelligent och visuell loggbok för husbilsäventyr. Byggd för att fungera sömlöst på mobilen under resans gång.

## ✨ Nyckelfunktioner

- **🗺️ Interaktiv Karta:** Visar campingar, ställplatser, gästhamnar och naturreservat via OpenStreetMap och Overpass API.
- **⏰ Smart Auto-Logger:** Känner automatiskt av när ni stannat på en plats i mer än 20 minuter och föreslår en incheckning (inklusive "Fricamping"-läge).
- **📸 Bilduppladdning:** Ladda upp foton direkt från kameran. Inkluderar smart klient-komprimering för att spara lagringsutrymme i molnet.
- **🔗 Google Photos-stöd:** Länka hela album (perfekt för 360-bilder och systemkamerafoton).
- **🚙 Waze-integration:** Starta navigering till valfri plats med ett enda klick direkt till Waze.
- **📱 PWA-redo:** Installera som en app på hemskärmen för en snabb och ren upplevelse utan adressfält.

## 🛠️ Teknikstack

- **Frontend:** Next.js 14, React, Leaflet (Karta), Lucide Icons.
- **Backend:** Firebase Firestore (Logg-data), Firebase Storage (Bilder).
- **API:** Overpass API (Kartdata i realtid).
- **Stil:** Vanilla CSS med modern "Glassmorphism" design.

## 🚀 Kom igång lokalt

1. Klona repot.
2. Installera beroenden: `npm install`
3. Skapa en `.env.local` med dina Firebase-uppgifter:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   ```
4. Kör dev-servern: `npm run dev`

## 📂 Struktur

- `/src/components/Map.tsx` - Huvudkomponenten för kartan och incheckningslogiken.
- `/src/hooks/useAutoLogger.ts` - Den intelligenta platsdetekteringen.
- `/src/lib/firebase.ts` - Konfiguration för databas och lagring.

---
*Skapad med ❤️ för Nilssons äventyr på vägarna.*
