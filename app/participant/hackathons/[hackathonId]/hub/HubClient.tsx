"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  Clock,
  FileText,
  QrCode,
  MapPin,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { selectProblemStatement } from "@/app/actions/participantProblemStatements";

// ─── Types ──────────────────────────────────────────────────────────

interface HackathonData {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  status: string;
  max_team_size: number;
  min_team_size: number;
}

interface TeamMemberData {
  id: number;
  name: string;
  email: string;
  college: string;
  degree: string;
  semester: number | null;
  skills: string[];
}

interface TeamData {
  id: number;
  name: string;
  leader_id: number;
  is_registered: boolean;
  qr_token: string | null;
  invite_token: string | null;
  selected_problem_statement: {
    id: number;
    title: string;
    description: string;
    pdf_file: string | null;
  } | null;
  members: TeamMemberData[];
}

interface ProblemStatementData {
  id: number;
  title: string;
  description: string;
  pdf_file: string | null;
  max_teams_allowed: number;
  current_teams_count: number;
  is_full: boolean;
}

// ─── Component ──────────────────────────────────────────────────────

export default function HubClient({
  hackathon,
  team,
  isLeader,
  leaderName,
  problemStatements,
  teamSeating,
}: {
  hackathon: HackathonData;
  team: TeamData;
  isLeader: boolean;
  leaderName: string;
  problemStatements: ProblemStatementData[];
  teamSeating: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPsId, setSelectedPsId] = useState<number | null>(null);
  const [psModalOpen, setPsModalOpen] = useState(false);
  const [psModalData, setPsModalData] = useState<ProblemStatementData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAllMembers, setShowAllMembers] = useState(false);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const statusLabel = (() => {
    switch (hackathon.status) {
      case "registration":
      case "registration_open":
        return { text: "Registration Open", color: "bg-teal-500/10 border-teal-500/20 text-teal-400" };
      case "active":
        return { text: "Active", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
      case "completed":
        return { text: "Completed", color: "bg-slate-800 border-slate-700 text-slate-400" };
      default:
        return { text: hackathon.status, color: "bg-slate-800 border-slate-700 text-slate-400" };
    }
  })();

  const handleSelectPS = (ps: ProblemStatementData) => {
    if (!isLeader || team.selected_problem_statement || ps.is_full) return;
    setSelectedPsId(ps.id);
    setError(null);

    startTransition(async () => {
      try {
        await selectProblemStatement(team.id, ps.id);
        setSuccess("Problem statement selected successfully! This selection is permanent.");
        router.refresh();
      } catch (e: unknown) {
        setError((e as Error).message || "Failed to select problem statement");
      } finally {
        setSelectedPsId(null);
      }
    });
  };

  const displayedMembers = showAllMembers ? team.members : team.members.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* ── Hackathon Header ── */}
      <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{hackathon.name}</h2>
            <div className="flex items-center gap-3 flex-wrap text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                {formatDate(hackathon.start_date)} — {formatDate(hackathon.end_date)}
              </span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusLabel.color}`}>
            {statusLabel.text}
          </span>
        </div>
        {hackathon.description && (
          <p className="text-sm text-slate-400 leading-relaxed">{hackathon.description}</p>
        )}
      </div>

      {/* ── Team Info Card ── */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            Team: {team.name}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              team.is_registered
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}
          >
            {team.is_registered ? "Registered" : "Draft"}
          </span>
        </div>

        <div className="text-sm text-slate-400 mb-4">
          <span className="text-slate-500">Team Leader:</span>{" "}
          <span className="text-white font-medium">{leaderName}</span>
          <span className="mx-2 text-slate-700">·</span>
          <span>{team.members.length}/{hackathon.max_team_size} members</span>
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {displayedMembers.map((member, idx) => (
            <div
              key={member.id}
              className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">
                    {member.name}
                  </span>
                  {member.email === team.members.find((_, i) => i === 0)?.email && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-500/10 border border-teal-500/20 text-teal-400">
                      LEADER
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>{member.email}</span>
                  <span className="text-slate-700">·</span>
                  <span>{member.college || "N/A"}</span>
                  <span className="text-slate-700">·</span>
                  <span>Sem {member.semester || "?"}</span>
                </div>
                {member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {member.skills.map((s, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {team.members.length > 5 && (
          <button
            onClick={() => setShowAllMembers(!showAllMembers)}
            className="mt-3 text-xs text-teal-400 hover:text-teal-300 transition flex items-center gap-1 cursor-pointer"
          >
            {showAllMembers ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Show all {team.members.length} members
              </>
            )}
          </button>
        )}

        {/* Team Pass QR link */}
        {team.is_registered && team.qr_token && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <a
              href={`/participant/hackathons/${hackathon.id}/pass`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold hover:bg-teal-500/20 transition"
            >
              <QrCode className="w-4 h-4" />
              View Team Pass & QR Code
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* ── Problem Statement Selection ── */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-teal-400" />
          Problem Statements
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          {team.selected_problem_statement
            ? "Your team has locked in a problem statement. This selection is permanent."
            : isLeader
            ? "Browse available problem statements and select one for your team. Selection is permanent."
            : "Your team leader will select a problem statement for the team."}
        </p>

        {/* Already selected PS */}
        {team.selected_problem_statement && (
          <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                Selected & Locked
              </span>
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              {team.selected_problem_statement.title}
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              {team.selected_problem_statement.description}
            </p>
            {team.selected_problem_statement.pdf_file && (
              <a
                href={team.selected_problem_statement.pdf_file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-teal-400 hover:text-teal-300 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </a>
            )}
          </div>
        )}

        {/* PS Grid */}
        {problemStatements.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8 italic">
            No problem statements available yet for this hackathon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problemStatements.map((ps) => {
              const isSelected = team.selected_problem_statement?.id === ps.id;
              const canSelect =
                isLeader && !team.selected_problem_statement && !ps.is_full;
              const capacityPercent = Math.min(
                100,
                (ps.current_teams_count / ps.max_teams_allowed) * 100
              );

              return (
                <div
                  key={ps.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold text-white flex-1">
                      {ps.title}
                    </h4>
                    {isSelected && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Selected
                      </span>
                    )}
                    {ps.is_full && !isSelected && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        Full
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-3">
                    {ps.description}
                  </p>

                  {/* Capacity bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Capacity</span>
                      <span>
                        {ps.current_teams_count}/{ps.max_teams_allowed} teams
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          ps.is_full
                            ? "bg-red-500"
                            : capacityPercent > 70
                            ? "bg-amber-500"
                            : "bg-teal-500"
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ps.pdf_file && (
                      <a
                        href={ps.pdf_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setPsModalData(ps);
                        setPsModalOpen(true);
                      }}
                      className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      View Details
                    </button>

                    <div className="flex-1" />

                    {canSelect && (
                      <button
                        onClick={() => handleSelectPS(ps)}
                        disabled={isPending && selectedPsId === ps.id}
                        className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {isPending && selectedPsId === ps.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Select
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Seating Allocation ── */}
      {teamSeating && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-teal-400" />
            Seating Allocation
          </h3>

          <div className="space-y-3">
            {teamSeating.room ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500 w-20">Room:</span>
                <span className="text-white font-medium">
                  {String(teamSeating.room)}
                </span>
              </div>
            ) : null}
            {teamSeating.bench ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500 w-20">Bench:</span>
                <span className="text-white font-medium">
                  {String(teamSeating.bench)}
                </span>
              </div>
            ) : null}
            {teamSeating.row !== undefined ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500 w-20">Row:</span>
                <span className="text-white font-medium">
                  {String(teamSeating.row)}
                </span>
              </div>
            ) : null}

            {Array.isArray(teamSeating.members) ? (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Individual Assignments
                </h4>
                <div className="space-y-1">
                  {(teamSeating.members as Array<Record<string, unknown>>).map(
                    (m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-xs p-2 rounded-lg bg-slate-950/50"
                      >
                        <span className="text-white font-medium min-w-[120px]">
                          {String(m.name || `Member ${idx + 1}`)}
                        </span>
                        {m.seat ? (
                          <span className="text-slate-400">
                            Seat: {String(m.seat)}
                          </span>
                        ) : null}
                        {m.row !== undefined ? (
                          <span className="text-slate-400">
                            Row: {String(m.row)}
                          </span>
                        ) : null}
                        {m.bench ? (
                          <span className="text-slate-400">
                            Bench: {String(m.bench)}
                          </span>
                        ) : null}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── PS Detail Modal ── */}
      {psModalOpen && psModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setPsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-3 pr-8">
              {psModalData.title}
            </h3>

            {/* Capacity */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Team Capacity</span>
                <span>
                  {psModalData.current_teams_count}/{psModalData.max_teams_allowed}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    psModalData.is_full
                      ? "bg-red-500"
                      : psModalData.current_teams_count / psModalData.max_teams_allowed > 0.7
                      ? "bg-amber-500"
                      : "bg-teal-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (psModalData.current_teams_count / psModalData.max_teams_allowed) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
              {psModalData.description}
            </p>

            {/* PDF download */}
            {psModalData.pdf_file && (
              <a
                href={psModalData.pdf_file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium hover:bg-teal-500/20 transition mb-4"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            )}

            {/* Select button */}
            {isLeader && !team.selected_problem_statement && !psModalData.is_full && (
              <button
                onClick={() => {
                  handleSelectPS(psModalData);
                  setPsModalOpen(false);
                }}
                disabled={isPending}
                className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm hover:brightness-110 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Select This Problem Statement
              </button>
            )}

            {psModalData.is_full && (
              <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                This problem statement has reached its capacity limit.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
