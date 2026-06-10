import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syntra - Hackathon Management System",
  description: "A production-ready full-stack Next.js hackathon management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-canvas-parchment">
        {/* Apple Mesh Background - fixed behind everything */}
        <div className="fixed inset-0 z-[-1] apple-mesh-bg pointer-events-none" />
        
        {/* Main Application Container */}
        <div className="relative z-0 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
