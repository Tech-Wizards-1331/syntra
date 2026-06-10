import React from "react";
import { 
  Shield, 
  Database, 
  QrCode, 
  Layers, 
  CreditCard, 
  LayoutGrid, 
  ArrowRight,
  ChevronRight,
  Laptop
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <Shield className="w-5 h-5 text-primary" />,
      title: "Role-Based Access",
      description: "Secure, tailored portals for admins, organizers, and hackers."
    },
    {
      icon: <Database className="w-5 h-5 text-primary" />,
      title: "Real-Time Sync",
      description: "Live data updates across all dashboards and leaderboards."
    },
    {
      icon: <Layers className="w-5 h-5 text-primary" />,
      title: "Smart Seating",
      description: "Auto-assign team tables with optimized spatial algorithms."
    },
    {
      icon: <CreditCard className="w-5 h-5 text-primary" />,
      title: "Integrated Payments",
      description: "Process registrations and ticket sales securely."
    },
    {
      icon: <QrCode className="w-5 h-5 text-primary" />,
      title: "QR Check-ins",
      description: "Scan attendees instantly for event entry and food tokens."
    },
    {
      icon: <LayoutGrid className="w-5 h-5 text-primary" />,
      title: "Unified Console",
      description: "Manage your entire hackathon lifecycle from one interface."
    }
  ];

  return (
    <div className="min-h-screen bg-canvas-parchment text-ink flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      


      {/* ─── Sub Nav Frosted (Apple Product Bar Sticky) ─── */}
      <header className="sticky top-0 h-[52px] bg-canvas-parchment/80 backdrop-blur-md border-b border-black/[0.08] flex items-center justify-between px-6 z-30 font-apple-tagline text-base text-ink">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">Syntra</span>
          <div className="flex items-center gap-5 text-sm font-normal">
            <span className="hidden sm:inline text-ink-muted hover:text-primary transition cursor-pointer">Overview</span>
            <span className="hidden sm:inline text-ink-muted hover:text-primary transition cursor-pointer">Features</span>
            <a 
              href="/login" 
              className="px-3.5 py-1.5 text-xs font-normal bg-primary text-white rounded-pill hover:bg-primary-focus transition apple-press-effect flex items-center gap-1"
            >
              Sign In <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT BLOCK: Alternating Tiles ─── */}
      <main className="flex-1 flex flex-col">
        
        {/* ─── Hero Product Tile (White) ─── */}
        <section className="bg-canvas border-b border-black/[0.08] py-20 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Tagline */}
            <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-3 block">
              The Premier Hackathon Platform
            </span>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl font-apple-hero text-ink mb-4 max-w-2xl leading-none">
              Supercharge your <br/>hackathons.
            </h1>

            {/* Paragraph Subcopy */}
            <p className="text-lg sm:text-xl text-ink-muted max-w-2xl mx-auto leading-relaxed mb-8">
              Everything you need to run your next hackathon.
            </p>

            {/* Two Action Blue Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
              <a 
                href="/admin" 
                className="px-5 py-2.5 bg-primary text-white rounded-pill hover:bg-primary-focus font-normal text-sm transition apple-press-effect flex items-center gap-1"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="/register" 
                className="text-primary hover:underline text-sm font-normal transition flex items-center gap-0.5"
              >
                Register as Participant <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Visual product render frame with shadow */}
            <div className="w-full max-w-3xl rounded-lg border border-black/[0.08] bg-canvas-pearl p-4 md:p-8 apple-shadow-product relative group">
              <div className="absolute top-3 left-4 flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <div className="mt-4 flex flex-col items-center justify-center py-10 md:py-20 text-ink-muted">
                <Laptop className="w-16 h-16 text-primary mb-4" />
                <span className="font-apple-display text-2xl text-ink mb-2">Unified Event Dashboard</span>
                <span className="text-sm text-ink-muted max-w-md">
                  Monitor registrations, scan QR tokens, and manage team pipelines with real-time event analytics.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Tile (Parchment) ─── */}
        <section className="bg-canvas-parchment border-b border-black/[0.08] py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-apple-display text-ink mb-3">
                Powerful Event Features
              </h2>
              <p className="text-base text-ink-muted max-w-lg mx-auto">
                Built for speed and scale. Manage thousands of participants with robust tools designed for organizers and hackers alike.
              </p>
            </div>

            {/* 3x2 Grid of Store Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  className="p-6 rounded-lg bg-canvas border border-black/[0.05] hover:border-black/[0.12] transition-all duration-300 flex flex-col gap-4"
                >
                  <div className="w-10 h-10 rounded-md bg-canvas-parchment border border-black/[0.04] flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[17px] text-ink mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Tech Stack Tile (Dark - Tile-1 Background) ─── */}
        <section className="bg-tile-1 text-white py-20 px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <span className="text-primary-dark font-semibold text-sm tracking-widest uppercase mb-3 block">
              Built for Performance
            </span>

            <h2 className="text-3xl sm:text-5xl font-apple-display text-white mb-4 leading-none">
              Flawless Execution. <br/>Zero Downtime.
            </h2>

            <p className="text-base sm:text-lg text-ink-muted max-w-xl mb-12">
              Powered by a modern, type-safe architecture ensuring your event runs smoothly from registration to closing ceremonies.
            </p>


          </div>
        </section>

      </main>

      {/* ─── Footer (Apple Low Density Parchment) ─── */}
      <footer className="bg-canvas-parchment text-ink-muted border-t border-black/[0.08] py-16 px-6 text-[12px] font-normal tracking-[-0.12px]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-xs">
            <span className="font-semibold text-ink">Syntra</span>
            <p className="leading-relaxed">
              The premier console for hackathon workflows, attendance, and teams.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16">
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-ink">Resources</span>
              <span className="hover:text-ink transition cursor-pointer">Help Center</span>
              <span className="hover:text-ink transition cursor-pointer">Organizer Guide</span>
              <span className="hover:text-ink transition cursor-pointer">Participant FAQ</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-ink">Legal</span>
              <span className="hover:text-ink transition cursor-pointer">Terms of Service</span>
              <span className="hover:text-ink transition cursor-pointer">Privacy Policy</span>
              <span className="hover:text-ink transition cursor-pointer">Cookie Policy</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-black/[0.05] flex flex-col sm:flex-row justify-between text-ink-muted gap-4">
          <p>&copy; {new Date().getFullYear()} Syntra. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-ink transition cursor-pointer">System Status</span>
            <span className="hover:text-ink transition cursor-pointer">Report Issues</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
