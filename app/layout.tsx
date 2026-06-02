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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
