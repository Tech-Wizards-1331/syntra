import React from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getHackathons } from "@/app/actions/hackathons";
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  CalendarRange, 
  Scan, 
  Settings,
  Plus,
  ArrowRight,
  Calendar,
  Layers,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Armchair
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrganizerDashboard({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const currentPage = Number(params.page || "1");
  const limit = 5;
  const offset = (currentPage - 1) * limit;

  let hackathonsData = { hackathons: [] as any[], totalCount: 0 };
  try {
    hackathonsData = await getHackathons({ limit, offset });
  } catch (error) {
    console.error("Failed to load hackathons:", error);
  }

  const { hackathons, totalCount } = hackathonsData;
  const totalPages = Math.ceil(totalCount / limit);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-800 border border-slate-700 text-slate-400">
            Draft
          </span>
        );
      case "registration":
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Registration
          </span>
        );
      case "active":
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            Active
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-800 border border-slate-700 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-slate-950 font-black text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Syntra</h1>
            <p className="text-[10px] text-teal-400 font-medium tracking-widest uppercase">Organizer Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Organizer
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 hover:text-red-400 transition duration-300 flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-10">
        {/* Welcome Section */}
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Organizer Workspace: {session?.user?.name || "Organizer"}
              </h2>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {session?.user?.email}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 hidden sm:inline" />
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-500" />
                  Organizer ID: {session?.user?.profileId || "None"}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/organizer/dashboard/hackathons/new"
            className="px-5 py-3 rounded-xl bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 active:scale-95 transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Hackathon
          </Link>
        </div>

        {/* Hackathons Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-teal-400" />
              Your Hackathons
            </h3>
            <span className="text-xs text-slate-400">
              Showing {hackathons.length} of {totalCount} events
            </span>
          </div>

          {hackathons.length === 0 ? (
            /* Glassmorphic Empty State */
            <div className="p-12 rounded-2xl bg-slate-900/30 border border-slate-900 border-dashed text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 border border-slate-800">
                <CalendarRange className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">No Hackathons created yet</p>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Get started by creating your first hackathon event to manage registrations, problem statements, and seating details.
                </p>
              </div>
              <Link
                href="/organizer/dashboard/hackathons/new"
                className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition"
              >
                Create Event Now
              </Link>
            </div>
          ) : (
            /* Hackathons List */
            <div className="flex flex-col gap-4">
              {hackathons.map((h) => (
                <div
                  key={h.id}
                  className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-teal-500/20 transition-all duration-350 shadow-glass flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-white">{h.name}</h4>
                      {getStatusBadge(h.status)}
                    </div>
                    {h.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {h.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        {new Date(h.start_date).toLocaleDateString()} - {new Date(h.end_date).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-800 hidden sm:inline" />
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-600" />
                        Team Size: {h.min_team_size}-{h.max_team_size}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-800 hidden sm:inline" />
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                        {h.is_paid ? `Paid (${h.fee_type === "team" ? "Team-wise" : "Participant-wise"})` : "Free"}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/organizer/scan?hackathonId=${h.id}`}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-teal-400 transition text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      Scan
                    </Link>
                    <Link
                      href={`/organizer/dashboard/seating?hackathonId=${h.id}`}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-teal-400 transition text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Armchair className="w-3.5 h-3.5" />
                      Seating
                    </Link>
                    <Link
                      href={`/organizer/dashboard/hackathons/${h.id}/edit`}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-teal-400 transition text-xs font-semibold"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/organizer/dashboard/hackathons/${h.id}`}
                      className="p-2.5 px-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition text-xs font-semibold flex items-center gap-1"
                    >
                      Details
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Link
                    href={`/organizer/dashboard?page=${currentPage - 1}`}
                    className={`p-2 rounded-lg bg-slate-900 border border-slate-800 transition ${
                      currentPage === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-850"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-450">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Link
                    href={`/organizer/dashboard?page=${currentPage + 1}`}
                    className={`p-2 rounded-lg bg-slate-900 border border-slate-800 transition ${
                      currentPage === totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-850"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between border-t border-slate-900 text-xs text-slate-500 gap-4 z-10">
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
