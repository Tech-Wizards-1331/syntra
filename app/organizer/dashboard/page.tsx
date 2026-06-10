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
  Plus,
  ArrowRight,
  Calendar,
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

  // Status Badge Helper using premium Apple desaturated tones
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-pill bg-canvas-parchment border border-black/[0.08] text-ink-muted">
            Draft
          </span>
        );
      case "registration":
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-pill bg-info-light border border-info/10 text-info">
            Registration
          </span>
        );
      case "active":
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-pill bg-success-light border border-success/10 text-success">
            Active
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-pill bg-canvas-pearl border border-black/[0.08] text-ink-muted">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-pill bg-canvas-parchment border border-black/[0.08] text-ink-muted">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-canvas-parchment text-ink flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      
      {/* ─── Global Nav (Apple Thin Black Bar) ─── */}
      <nav className="h-11 bg-tile-black text-white flex items-center justify-between px-6 z-40 relative text-[12px] font-normal tracking-[-0.12px]">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold tracking-tight text-white flex items-center gap-1.5 cursor-pointer">
               <span className="font-bold tracking-tight">Syntra</span>
            </span>
            <span className="text-ink-muted hover:text-white transition cursor-pointer">Organizer Workspace</span>
          </div>
          <div className="flex items-center gap-4 text-ink-muted">
            <span>Server: Active</span>
          </div>
        </div>
      </nav>

      {/* ─── Header ─── */}
      <header className="sticky top-0 h-[52px] bg-canvas-parchment/80 backdrop-blur-md border-b border-black/[0.08] flex items-center justify-between px-6 z-30">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-ink">Organizer Console</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-success-light border border-success/15 text-success">
              Authorized
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-canvas border border-black/[0.12] hover:bg-canvas-pearl hover:text-danger text-xs font-normal transition apple-press-effect flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        
        {/* Welcome Configurator Card */}
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <Link href="/organizer/profile" className="flex items-center gap-4 group/profile cursor-pointer hover:opacity-85 transition-opacity">
            <div className="w-12 h-12 rounded-md bg-canvas-parchment border border-black/[0.04] flex items-center justify-center text-primary group-hover/profile:border-primary/35 transition-colors">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink leading-tight group-hover/profile:text-primary transition-colors">
                Console: {session?.user?.name || "Organizer"}
              </h2>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted mt-1.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-ink-muted/60" />
                  {session?.user?.email}
                </span>
                <span className="w-1 h-1 rounded-full bg-black/[0.12] hidden sm:inline" />
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-ink-muted/60" />
                  ID: {session?.user?.profileId || "None"}
                </span>
              </div>
            </div>
          </Link>
          <Link
            href="/organizer/dashboard/hackathons/new"
            className="px-4 py-2 rounded-pill bg-primary text-white font-normal hover:bg-primary-focus text-sm transition apple-press-effect flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Hackathon
          </Link>
        </div>

        {/* Hackathons List Container */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
            <h3 className="text-[17px] font-semibold text-ink flex items-center gap-2">
              <CalendarRange className="w-4.5 h-4.5 text-primary" />
              Your Events
            </h3>
            <span className="text-[12px] text-ink-muted">
              {hackathons.length} of {totalCount} events listed
            </span>
          </div>

          {hackathons.length === 0 ? (
            /* Apple-Style Empty State */
            <div className="p-12 rounded-lg bg-canvas border border-dashed border-black/[0.12] text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-canvas-parchment flex items-center justify-center text-ink-muted border border-black/[0.04]">
                <CalendarRange className="w-5 h-5 text-ink-muted" />
              </div>
              <div>
                <p className="text-ink font-semibold text-sm mb-1">No Hackathons created yet</p>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  Get started by creating your first hackathon event to manage team registrations, problem statements, and seating arrangements.
                </p>
              </div>
              <Link
                href="/organizer/dashboard/hackathons/new"
                className="px-4 py-2 text-xs font-normal rounded-pill bg-primary text-white hover:bg-primary-focus transition apple-press-effect"
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
                  className="p-6 rounded-lg bg-canvas border border-black/[0.06] hover:border-black/[0.15] transition-all duration-300 apple-shadow-overlay flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <Link 
                    href={`/organizer/dashboard/hackathons/${h.id}`}
                    className="flex-1 flex flex-col gap-2.5 group/card cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-semibold text-ink leading-tight group-hover/card:text-primary transition-colors">{h.name}</h4>
                      {getStatusBadge(h.status)}
                    </div>
                    {h.description && (
                      <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                        {h.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-ink-muted mt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-ink-muted/55" />
                        {new Date(h.start_date).toLocaleDateString()} - {new Date(h.end_date).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-black/[0.12] hidden sm:inline" />
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-ink-muted/55" />
                        Team Size: {h.min_team_size}-{h.max_team_size}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-black/[0.12] hidden sm:inline" />
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-ink-muted/55" />
                        {h.is_paid ? `Paid (${h.fee_type === "team" ? "Team-wise" : "Participant"}-wise)` : "Free"}
                      </span>
                    </div>
                  </Link>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/organizer/scan?hackathonId=${h.id}`}
                      className="px-3 py-1.5 rounded-md bg-canvas-pearl border border-black/[0.08] hover:bg-canvas-parchment text-ink text-xs font-normal transition apple-press-effect flex items-center gap-1.5"
                    >
                      <Scan className="w-3.5 h-3.5 text-ink-muted" />
                      Scan
                    </Link>
                    <Link
                      href={`/organizer/dashboard/seating?hackathonId=${h.id}`}
                      className="px-3 py-1.5 rounded-md bg-canvas-pearl border border-black/[0.08] hover:bg-canvas-parchment text-ink text-xs font-normal transition apple-press-effect flex items-center gap-1.5"
                    >
                      <Armchair className="w-3.5 h-3.5 text-ink-muted" />
                      Seating
                    </Link>
                    <Link
                      href={`/organizer/dashboard/hackathons/${h.id}/edit`}
                      className="px-3 py-1.5 rounded-md bg-canvas-pearl border border-black/[0.08] hover:bg-canvas-parchment text-ink text-xs font-normal transition apple-press-effect"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/organizer/dashboard/hackathons/${h.id}`}
                      className="px-4 py-1.5 rounded-pill bg-primary text-white hover:bg-primary-focus text-xs font-normal transition apple-press-effect flex items-center gap-1"
                    >
                      Details
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Link
                    href={`/organizer/dashboard?page=${currentPage - 1}`}
                    className={`p-2 rounded-md bg-canvas border border-black/[0.12] transition apple-press-effect ${
                      currentPage === 1 ? "pointer-events-none opacity-40" : "hover:bg-canvas-pearl"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                  <span className="text-[12px] text-ink-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Link
                    href={`/organizer/dashboard?page=${currentPage + 1}`}
                    className={`p-2 rounded-md bg-canvas border border-black/[0.12] transition apple-press-effect ${
                      currentPage === totalPages ? "pointer-events-none opacity-40" : "hover:bg-canvas-pearl"
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
      <footer className="bg-canvas-parchment text-ink-muted border-t border-black/[0.08] py-8 px-6 text-[12px] font-normal mt-auto">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Syntra. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-ink transition cursor-pointer">Security</span>
            <span className="hover:text-ink transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-ink transition cursor-pointer">API Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
