import React from "react";
import { 
  Shield, 
  Database, 
  QrCode, 
  Layers, 
  CreditCard, 
  LayoutGrid, 
  CheckCircle2, 
  ArrowRight 
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <Shield className="w-6 h-6 text-teal-400" />,
      title: "Auth.js Integration",
      description: "Secure session-based auth with legacy PBKDF2/MD5 hashing compatibility."
    },
    {
      icon: <Database className="w-6 h-6 text-teal-400" />,
      title: "Prisma ORM",
      description: "Type-safe database client mapped directly from Supabase/PostgreSQL schema."
    },
    {
      icon: <Layers className="w-6 h-6 text-teal-400" />,
      title: "Seating Allocation",
      description: "Greedy seating allocation logic ported to Node.js/TypeScript services."
    },
    {
      icon: <CreditCard className="w-6 h-6 text-teal-400" />,
      title: "Payment Webhooks",
      description: "Secure payments backend with Razorpay integration and signature verification."
    },
    {
      icon: <QrCode className="w-6 h-6 text-teal-400" />,
      title: "QR Attendance",
      description: "Real-time ticket scanner interface and attendance logs."
    },
    {
      icon: <LayoutGrid className="w-6 h-6 text-teal-400" />,
      title: "Admin Dashboard",
      description: "Unified admin interface replacing default Django administrative controls."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-900">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-slate-950 font-black text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Syntra</h1>
            <p className="text-[10px] text-teal-400 font-medium tracking-widest uppercase">NextJS Core</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Migration Mode
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center">
        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400 mb-6 hover:border-slate-700 transition duration-300">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          Migrating from Django/DRF to Next.js 15
        </div>

        {/* Title */}
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight mb-6">
          System Migration &amp; <br />
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-yellow-300 bg-clip-text text-transparent">
            Database Introspection
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Syntra is a hackathon management system that streamlines event organization, participant registration, seating allocations, payments, and real-time QR attendance check-ins.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left mb-16">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-teal-500/30 hover:bg-slate-900 transition duration-300 flex flex-col gap-4 shadow-glass hover:shadow-teal-500/5 group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-slate-800 transition duration-300">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-white mb-1 group-hover:text-teal-400 transition duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a 
            href="/admin" 
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-bold hover:opacity-90 shadow-lg shadow-teal-500/10 flex items-center gap-2 group transition duration-300"
          >
            Enter Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition duration-300" />
          </a>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="px-8 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 font-semibold text-slate-300 transition duration-300"
          >
            View Documentation
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between border-t border-slate-900 text-xs text-slate-500 gap-4">
        <p>&copy; {new Date().getFullYear()} Syntra next-gen framework migration.</p>
        <div className="flex gap-6">
          <span className="hover:text-slate-400 cursor-pointer">Security</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-400 cursor-pointer">API Status</span>
        </div>
      </footer>
    </div>
  );
}
