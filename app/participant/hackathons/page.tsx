import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  Users,
  Clock,
  ChevronRight,
  Search,
  ChevronLeft,
} from "lucide-react";

export const metadata = {
  title: "Browse Hackathons | Syntra",
  description: "Browse open hackathons and register your team for upcoming events.",
};

interface HackathonListPageProps {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 12;

export default async function HackathonListPage({
  searchParams,
}: HackathonListPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const now = new Date();

  // Count total open hackathons for pagination
  const totalCount = await prisma.organizer_hackathon.count({
    where: {
      status: { in: ["registration", "registration_open", "published"] },
      registration_deadline: { gte: now },
    },
  });

  // Fetch paginated hackathons (mirrors Django's HackathonListView queryset)
  const hackathons = await prisma.organizer_hackathon.findMany({
    where: {
      status: { in: ["registration", "registration_open", "published"] },
      registration_deadline: { gte: now },
    },
    select: {
      id: true,
      name: true,
      description: true,
      start_date: true,
      end_date: true,
      registration_deadline: true,
      max_team_size: true,
      min_team_size: true,
      status: true,
      is_paid: true,
      fee_amount: true,
      _count: { select: { participant_team: true } },
    },
    orderBy: { start_date: "asc" },
    skip,
    take: PAGE_SIZE,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Check which hackathons the user already has a team for
  const userId = Number(session.user.id);
  const userEmail = session.user.email || "";
  const userTeams = await prisma.participant_team.findMany({
    where: {
      OR: [
        { leader_id: userId },
        { participant_teammember: { some: { email: userEmail } } },
      ],
    },
    select: { hackathon_id: true },
  });
  const joinedHackathonIds = new Set(userTeams.map((t) => t.hackathon_id));

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getDaysUntil(deadline: Date) {
    const diff = new Date(deadline).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-ink tracking-tight flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Open Hackathons
        </h2>
        <p className="text-xs text-ink-muted mt-1.5">
          Browse {totalCount} hackathon{totalCount !== 1 ? "s" : ""} currently open for registration.
        </p>
      </div>

      {/* Hackathon Grid */}
      {hackathons.length === 0 ? (
        <div className="text-center py-16 bg-canvas rounded-lg border border-dashed border-black/[0.12]">
          <div className="w-12 h-12 rounded-full bg-canvas-parchment flex items-center justify-center mx-auto mb-4 border border-black/[0.04]">
            <Calendar className="w-5 h-5 text-ink-muted" />
          </div>
          <h3 className="text-sm font-semibold text-ink mb-1">No Hackathons Available</h3>
          <p className="text-xs text-ink-muted">
            There are no hackathons open for registration right now. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {hackathons.map((h) => {
            const daysLeft = getDaysUntil(h.registration_deadline);
            const isJoined = joinedHackathonIds.has(h.id);

            return (
              <Link
                key={h.id}
                href={isJoined ? `/participant/dashboard?hackathonId=${h.id}` : `/participant/dashboard?hackathonId=${h.id}`}
                className="group p-6 rounded-lg bg-canvas border border-black/[0.06] hover:border-black/[0.15] transition-all duration-300 apple-shadow-overlay flex flex-col cursor-pointer"
              >
                {/* Status & Price badges */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-info-light border border-info/10 text-info uppercase tracking-wider">
                    Open
                  </span>
                  <div className="flex gap-2">
                    {h.is_paid && h.fee_amount && (
                      <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-warning-light border border-warning/10 text-warning">
                        ₹{Number(h.fee_amount)}
                      </span>
                    )}
                    {isJoined && (
                      <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-success-light border border-success/10 text-success">
                        Joined
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-ink mb-2 group-hover:text-primary transition-colors leading-snug">
                  {h.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-ink-muted leading-relaxed mb-4 line-clamp-2 flex-1">
                  {h.description || "No description provided."}
                </p>

                {/* Meta info */}
                <div className="space-y-2 pt-3 border-t border-black/[0.05]">
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <Calendar className="w-3.5 h-3.5 text-ink-muted/55" />
                    <span>{formatDate(h.start_date)} — {formatDate(h.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <Users className="w-3.5 h-3.5 text-ink-muted/55" />
                    <span>{h.min_team_size}–{h.max_team_size} members per team</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-ink-muted/55" />
                      <span className={daysLeft <= 3 ? "text-danger font-semibold" : "text-ink-muted"}>
                        {daysLeft <= 0 ? "Deadline today!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                      </span>
                    </div>
                    <span className="flex items-center gap-0.5 text-xs text-primary font-medium group-hover:underline">
                      {isJoined ? "View" : "Register"}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Link
            href={`/participant/hackathons?page=${page - 1}`}
            className={`p-2 rounded-md bg-canvas border border-black/[0.12] transition apple-press-effect ${
              page === 1 ? "pointer-events-none opacity-40" : "hover:bg-canvas-pearl"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="text-[12px] text-ink-muted">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/participant/hackathons?page=${page + 1}`}
            className={`p-2 rounded-md bg-canvas border border-black/[0.12] transition apple-press-effect ${
              page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-canvas-pearl"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </main>
  );
}
