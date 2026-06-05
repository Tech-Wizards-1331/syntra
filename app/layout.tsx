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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
