import type { Metadata, Viewport } from "next";
import "./globals.css";

// Globalt: hindrar Next.js från att förrendera sidor/routes under bygget.
// Krävs för att Firebase-nycklarna inte finns tillgängliga vid byggtid — bara i körtid.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nilssons Husbilslogg",
  description: "Resedagbok och snabba anteckningar för våra husbilsäventyr",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Husbilslogg",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv-SE">
      <body>
        {children}
      </body>
    </html>
  );
}
