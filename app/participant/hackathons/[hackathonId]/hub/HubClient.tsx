"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
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
  release_problems: boolean;
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
        return { text: "Registration Open", color: "bg-info-light border-info/10 text-info" };
      case "active":
        return { text: "Active", color: "bg-success-light border-success/10 text-success" };
      case "completed":
        return { text: "Completed", color: "bg-canvas-parchment border-black/[0.08] text-ink-muted" };
      default:
        return { text: hackathon.status, color: "bg-canvas-parchment border-black/[0.08] text-ink-muted" };
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
    <div className="flex flex-col gap-6">
      {/* Messages */}
      {error && (
        <div className="p-4 rounded-md bg-danger-light border border-danger/10 text-danger text-xs flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-md bg-success-light border border-success/10 text-success text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* ── Hackathon Header Card (White) ── */}
      <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-lg font-semibold text-ink leading-tight mb-1">{hackathon.name}</h2>
            <div className="flex items-center gap-3 flex-wrap text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {formatDate(hackathon.start_date)} — {formatDate(hackathon.end_date)}
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-pill text-[11px] font-semibold border ${statusLabel.color} shrink-0 self-start sm:self-auto`}>
            {statusLabel.text}
          </span>
        </div>
        {hackathon.description && (
          <p className="text-xs text-ink-muted leading-relaxed mt-3 pt-3 border-t border-black/[0.04]">
            {hackathon.description}
          </p>
        )}
      </div>

      {/* ── Team Info Card (White) ── */}
      <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay">
        <div className="flex items-center justify-between mb-3 border-b border-black/[0.05] pb-3">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-primary" />
            Team: {team.name}
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-pill text-[11px] font-semibold border ${
              team.is_registered
                ? "bg-success-light border-success/10 text-success"
                : "bg-warning-light border-warning/10 text-warning"
            }`}
          >
            {team.is_registered ? "Registered" : "Draft"}
          </span>
        </div>

        <div className="text-xs text-ink-muted mb-4">
          <span>Team Leader:</span>{" "}
          <span className="text-ink font-semibold">{leaderName}</span>
          <span className="mx-2 text-black/[0.12]">·</span>
          <span>{team.members.length}/{hackathon.max_team_size} members</span>
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {displayedMembers.map((member) => (
            <div
              key={member.id}
              className="p-3.5 rounded-md bg-canvas-parchment/30 border border-black/[0.04] flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-ink truncate">
                    {member.name}
                  </span>
                  {member.email === team.members[0]?.email && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/10 border border-primary/20 text-primary">
                      LEADER
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-ink-muted">
                  <span>{member.email}</span>
                  <span className="text-black/[0.12]">•</span>
                  <span>{member.college || "N/A"}</span>
                  <span className="text-black/[0.12]">•</span>
                  <span>Sem {member.semester || "?"}</span>
                </div>
                {member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.skills.map((s, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded-pill bg-canvas-pearl border border-black/[0.06] text-ink-muted text-[10px]"
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
            className="mt-3 text-xs text-primary hover:underline transition flex items-center gap-1 cursor-pointer font-medium"
          >
            {showAllMembers ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Show all {team.members.length} members
              </>
            )}
          </button>
        )}

        {/* Team Pass QR link */}
        {team.is_registered && team.qr_token && (
          <div className="mt-4 pt-4 border-t border-black/[0.06] flex">
            <Link
              href={`/participant/hackathons/${hackathon.id}/pass`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-canvas-pearl border border-black/[0.08] hover:bg-canvas-parchment text-ink text-xs font-normal transition apple-press-effect"
            >
              <QrCode className="w-4 h-4 text-ink-muted" />
              <span>View Team Pass & QR Code</span>
              <ExternalLink className="w-3 h-3 text-ink-muted" />
            </Link>
          </div>
        )}
      </div>

      {/* ── Problem Statement Selection (White) ── */}
      <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-1">
          <FileText className="w-4.5 h-4.5 text-primary" />
          Problem Statements
        </h3>
        <p className="text-xs text-ink-muted mb-4">
          {team.selected_problem_statement
            ? "Your team has locked in a problem statement. This selection is permanent."
            : isLeader
            ? "Browse available problem statements and select one for your team. Selection is permanent."
            : "Your team leader will select a problem statement for the team."}
        </p>

        {/* Already selected PS */}
        {team.selected_problem_statement && (
          <div className="p-4 rounded-md bg-success-light border border-success/15 mb-4 text-success">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-success" />
              <span>Selected & Locked</span>
            </div>
            <h4 className="text-sm font-semibold text-ink mb-1.5">
              {team.selected_problem_statement.title}
            </h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              {team.selected_problem_statement.description}
            </p>
            {team.selected_problem_statement.pdf_file && (
              <a
                href={team.selected_problem_statement.pdf_file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline font-normal"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </a>
            )}
          </div>
        )}

        {/* PS Grid */}
        {!hackathon.release_problems && !team.selected_problem_statement ? (
          <p className="text-xs text-ink-muted text-center py-8 italic bg-canvas-parchment/20 border border-dashed border-black/[0.08] rounded-md">
            Problem statements will be released soon.
          </p>
        ) : problemStatements.length === 0 ? (
          <p className="text-xs text-ink-muted text-center py-8 italic bg-canvas-parchment/20 border border-dashed border-black/[0.08] rounded-md">
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
                  className={`p-4 rounded-md border transition-all ${
                    isSelected
                      ? "bg-success-light/30 border-success/20"
                      : "bg-canvas-parchment/20 border-black/[0.05] hover:border-black/[0.12]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-semibold text-ink flex-1 leading-snug">
                      {ps.title}
                    </h4>
                    {isSelected && (
                      <span className="shrink-0 px-2 py-0.5 rounded-pill text-[9px] font-semibold bg-success-light border border-success/15 text-success">
                        Selected
                      </span>
                    )}
                    {ps.is_full && !isSelected && (
                      <span className="shrink-0 px-2 py-0.5 rounded-pill text-[9px] font-semibold bg-danger-light border border-danger/15 text-danger">
                        Full
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-ink-muted leading-relaxed mb-3 line-clamp-3">
                    {ps.description}
                  </p>

                  {/* Capacity bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[9px] text-ink-muted mb-1">
                      <span>Capacity</span>
                      <span>
                        {ps.current_teams_count}/{ps.max_teams_allowed} teams
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-canvas-parchment overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          ps.is_full
                            ? "bg-danger"
                            : capacityPercent > 70
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {ps.pdf_file && (
                      <a
                        href={ps.pdf_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 transition"
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
                      className="text-xs text-ink-muted hover:text-ink transition cursor-pointer"
                    >
                      View Details
                    </button>

                    <div className="flex-1" />

                    {canSelect && (
                      <button
                        onClick={() => handleSelectPS(ps)}
                        disabled={isPending && selectedPsId === ps.id}
                        className="px-3 py-1.5 rounded-pill bg-primary hover:bg-primary-focus text-white text-xs font-normal transition cursor-pointer disabled:opacity-50 flex items-center gap-1 apple-press-effect"
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

      {/* ── Seating Allocation (White) ── */}
      {teamSeating && (
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4 border-b border-black/[0.05] pb-3">
            <MapPin className="w-4.5 h-4.5 text-primary" />
            Seating Allocation
          </h3>

          <div className="space-y-2.5">
            {teamSeating.room ? (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-ink-muted w-20">Room:</span>
                <span className="text-ink font-semibold">
                  {String(teamSeating.room)}
                </span>
              </div>
            ) : null}
            {teamSeating.bench ? (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-ink-muted w-20">Bench:</span>
                <span className="text-ink font-semibold">
                  {String(teamSeating.bench)}
                </span>
              </div>
            ) : null}
            {teamSeating.row !== undefined ? (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-ink-muted w-20">Row:</span>
                <span className="text-ink font-semibold">
                  {String(teamSeating.row)}
                </span>
              </div>
            ) : null}

            {Array.isArray(teamSeating.members) ? (
              <div className="mt-4 pt-4 border-t border-black/[0.06]">
                <h4 className="text-[10px] font-semibold text-ink-muted mb-2.5 uppercase tracking-wider">
                  Individual Assignments
                </h4>
                <div className="space-y-1.5">
                  {(teamSeating.members as Array<Record<string, unknown>>).map(
                    (m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-xs p-2.5 rounded-md bg-canvas-parchment/30 border border-black/[0.04] text-ink-muted"
                      >
                        <span className="text-ink font-semibold min-w-[120px]">
                          {String(m.name || `Member ${idx + 1}`)}
                        </span>
                        {m.seat ? (
                          <span>
                            Seat: {String(m.seat)}
                          </span>
                        ) : null}
                        {m.row !== undefined ? (
                          <span>
                            Row: {String(m.row)}
                          </span>
                        ) : null}
                        {m.bench ? (
                          <span>
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
            className="absolute inset-0 bg-tile-black/30 backdrop-blur-sm animate-backdrop-in"
            onClick={() => setPsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-lg bg-canvas border border-black/[0.08] shadow-overlay p-6 max-h-[80vh] overflow-y-auto z-10">
            <button
              onClick={() => setPsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-canvas-pearl transition cursor-pointer border border-black/[0.12]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-ink mb-3 pr-8">
              {psModalData.title}
            </h3>

            {/* Capacity */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-ink-muted mb-1">
                <span>Team Capacity</span>
                <span>
                  {psModalData.current_teams_count}/{psModalData.max_teams_allowed}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-canvas-parchment overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    psModalData.is_full
                      ? "bg-danger"
                      : psModalData.current_teams_count / psModalData.max_teams_allowed > 0.7
                      ? "bg-warning"
                      : "bg-primary"
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
            <p className="text-xs text-ink-muted leading-relaxed mb-4 whitespace-pre-wrap">
              {psModalData.description}
            </p>

            {/* PDF download */}
            {psModalData.pdf_file && (
              <a
                href={psModalData.pdf_file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-canvas-pearl border border-black/[0.08] hover:bg-canvas-parchment text-ink text-xs font-normal transition mb-4"
              >
                <Download className="w-4 h-4 text-ink-muted" />
                <span>Download PDF</span>
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
                className="w-full mt-2 py-2.5 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 apple-press-effect shadow-sm"
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
              <div className="mt-2 p-3 rounded-md bg-danger-light border border-danger/20 text-danger text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-danger" />
                This problem statement has reached its capacity limit.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
