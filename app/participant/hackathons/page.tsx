import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Search,
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
    <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 animate-fade-in-up">
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2.5">
          <Search className="w-6 h-6 text-teal-400" />
          Open Hackathons
        </h2>
        <p className="text-xs text-slate-400">
          Browse {totalCount} hackathon{totalCount !== 1 ? "s" : ""} currently open for registration.
        </p>
      </div>

      {/* Hackathon Grid */}
      {hackathons.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-400 mb-2">
            No Hackathons Available
          </h3>
          <p className="text-xs text-slate-500">
            There are no hackathons open for registration right now. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {hackathons.map((h) => {
            const daysLeft = getDaysUntil(h.registration_deadline);
            const isJoined = joinedHackathonIds.has(h.id);

            return (
              <div
                key={h.id}
                className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-900/65 hover:border-slate-800 hover:bg-slate-900/70 transition-all duration-300 flex flex-col"
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400 uppercase tracking-wider">
                    Open
                  </span>
                  {h.is_paid && h.fee_amount && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      ₹{Number(h.fee_amount)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                  {h.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2 flex-1">
                  {h.description || "No description provided."}
                </p>

                {/* Meta info */}
                <div className="space-y-2 mb-5 pt-3 border-t border-slate-900/40">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>
                      {formatDate(h.start_date)} — {formatDate(h.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>
                      {h.min_team_size}–{h.max_team_size} members per team
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span
                      className={
                        daysLeft <= 3 ? "text-red-400 font-bold" : "text-slate-400"
                      }
                    >
                      {daysLeft <= 0
                        ? "Deadline today!"
                        : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left to register`}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {isJoined ? (
                  <Link
                    href={`/participant/dashboard?hackathonId=${h.id}`}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-450 text-xs font-bold text-center hover:bg-emerald-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Already Registered
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/participant/dashboard?hackathonId=${h.id}`}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-extrabold text-center hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_15px_rgba(20,184,166,0.15)]"
                  >
                    Register Now
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          {page > 1 && (
            <Link
              href={`/participant/hackathons?page=${page - 1}`}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
            >
              ← Previous
            </Link>
          )}
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/participant/hackathons?page=${page + 1}`}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
