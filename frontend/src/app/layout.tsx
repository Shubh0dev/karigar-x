import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { Toast } from "@/components/ui/Toast";
import { DemoProvider } from "@/context/DemoContext";

export const metadata: Metadata = {
  title: "KARIGAR X - Digital Artisan Assistant",
  description: "AI-powered digital business manager for marginalized artisans.",
  keywords: [
    "KARIGAR X",
    "SIH 2026",
    "Artisans",
    "AI Market Linkage",
    "Smart Cataloging",
    "XGBoost Pricing Engine",
  ],
  manifest: "/manifest.json",
  themeColor: "#c2410c",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KARIGAR X",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className="antialiased selection:bg-amber-200 selection:text-amber-900">
        <DemoProvider>
          <div className="min-h-screen max-w-md mx-auto bg-artisan-sand border-x border-amber-900/10 shadow-2xl relative flex flex-col pb-20">
            <Header />
            <Toast />
            <main className="flex-1 px-4 py-4">{children}</main>
            <BottomNav />
          </div>
        </DemoProvider>
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
