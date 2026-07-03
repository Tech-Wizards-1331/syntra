"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitEvaluations } from "@/app/actions/faculty";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Star,
  Loader2,
  Check,
  AlertCircle,
  X,
  MessageSquare,
  ClipboardList,
  Search,
} from "lucide-react";

interface Criterion {
  id: number;
  name: string;
  description: string;
  max_score: number;
  display_order: number;
}

interface EvaluationScore {
  id: number;
  score: number;
  comment: string;
  criterion_id: number;
  team_id: number;
  hackathon_faculty_id: number;
}

interface TeamMember {
  name: string;
  email: string;
}

interface Team {
  id: number;
  name: string;
  accounts_user: { full_name: string; email: string };
  participant_teammember: TeamMember[];
  organizer_problemstatement: { id: number; title: string } | null;
  evaluation_score: EvaluationScore[];
}

interface HackathonData {
  id: number;
  name: string;
  status: string;
  evaluation_criterion: Criterion[];
  participant_team: Team[];
}

interface FacultyEvaluationClientProps {
  hackathon: HackathonData;
  hackathonFacultyId: number;
}

export default function FacultyEvaluationClient({
  hackathon,
  hackathonFacultyId,
}: FacultyEvaluationClientProps) {
  const router = useRouter();
  const criteria = hackathon.evaluation_criterion;
  const teams = hackathon.participant_team;

  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [teamScores, setTeamScores] = useState<
    Record<number, Record<number, { score: number; comment: string }>>
  >({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize scores from existing data
  useEffect(() => {
    const initialScores: typeof teamScores = {};
    for (const team of teams) {
      initialScores[team.id] = {};
      for (const c of criteria) {
        const existing = team.evaluation_score.find(
          (s) => s.criterion_id === c.id && s.hackathon_faculty_id === hackathonFacultyId
        );
        initialScores[team.id][c.id] = {
          score: existing?.score ?? 0,
          comment: existing?.comment ?? "",
        };
      }
    }
    setTeamScores(initialScores);
  }, [teams, criteria, hackathonFacultyId]);

  function updateScore(teamId: number, criterionId: number, score: number) {
    setTeamScores((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [criterionId]: {
          ...prev[teamId]?.[criterionId],
          score,
        },
      },
    }));
  }

  function updateComment(teamId: number, criterionId: number, comment: string) {
    setTeamScores((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [criterionId]: {
          ...prev[teamId]?.[criterionId],
          comment,
        },
      },
    }));
  }

  async function handleSubmit(teamId: number) {
    setActionLoading(`submit-${teamId}`);
    setErrorMsg(null);
    try {
      const scores = criteria.map((c) => ({
        criterionId: c.id,
        score: teamScores[teamId]?.[c.id]?.score ?? 0,
        comment: teamScores[teamId]?.[c.id]?.comment ?? "",
      }));

      await submitEvaluations(hackathonFacultyId, teamId, scores);
      setSuccessMsg(`Scores submitted for team "${teams.find((t) => t.id === teamId)?.name}"`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  // Calculate team total
  function getTeamTotal(teamId: number): { score: number; max: number } {
    let score = 0;
    let max = 0;
    for (const c of criteria) {
      score += teamScores[teamId]?.[c.id]?.score ?? 0;
      max += c.max_score;
    }
    return { score, max };
  }

  // Check if team has been scored
  function isTeamScored(team: Team): boolean {
    return team.evaluation_score.some(
      (s) => s.hackathon_faculty_id === hackathonFacultyId
    );
  }

  // Auto-dismiss success
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.accounts_user.full_name.toLowerCase().includes(q) ||
      t.participant_teammember.some(
        (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Hackathon Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{hackathon.name}</h2>
          <p className="text-sm text-ink-muted mt-1">
            {criteria.length} criteria · {teams.length} teams to evaluate
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            hackathon.status === "active"
              ? "bg-success-light text-success border border-success/10"
              : "bg-canvas-pearl text-ink-muted border border-black/[0.08]"
          }`}
        >
          {hackathon.status}
        </span>
      </div>

      {/* Criteria Overview */}
      {criteria.length === 0 ? (
        <div className="py-12 text-center text-ink-muted border border-dashed border-black/[0.1] rounded-xl bg-canvas-pearl/50">
          <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No evaluation criteria have been set by the organizer yet.</p>
        </div>
      ) : (
        <>
          {/* Criteria chips */}
          <div className="flex flex-wrap gap-2">
            {criteria.map((c) => (
              <div
                key={c.id}
                className="px-3 py-1.5 rounded-lg bg-canvas border border-black/[0.06] text-xs flex items-center gap-2"
              >
                <Star className="w-3 h-3 text-warning" />
                <span className="font-medium">{c.name}</span>
                <span className="text-ink-muted">/ {c.max_score}</span>
              </div>
            ))}
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 rounded-md bg-danger-light border border-danger/15 text-danger flex items-start gap-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="flex-1">{errorMsg}</p>
              <button onClick={() => setErrorMsg(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-md bg-success-light border border-success/15 text-success flex items-center gap-3 text-sm">
              <Check className="w-4 h-4" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2.5 rounded-md border border-black/[0.08] bg-canvas text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Teams List */}
          <div className="flex flex-col gap-3">
            {filteredTeams.map((team) => {
              const isExpanded = expandedTeamId === team.id;
              const { score: totalScore, max: totalMax } = getTeamTotal(team.id);
              const scored = isTeamScored(team);

              return (
                <div
                  key={team.id}
                  className={`rounded-xl bg-canvas border transition-all duration-200 ${
                    isExpanded
                      ? "border-primary/30 apple-shadow-overlay"
                      : "border-black/[0.06] apple-shadow-card hover:border-black/[0.1]"
                  }`}
                >
                  {/* Team Header (clickable) */}
                  <button
                    onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                    className="w-full p-4 flex items-center justify-between cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          scored
                            ? "bg-success/10"
                            : "bg-canvas-pearl"
                        }`}
                      >
                        {scored ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : (
                          <Users className="w-5 h-5 text-ink-muted" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{team.name}</h4>
                        <p className="text-xs text-ink-muted">
                          Led by {team.accounts_user.full_name} · {team.participant_teammember.length} members
                          {team.organizer_problemstatement && (
                            <> · PS: {team.organizer_problemstatement.title}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {scored && (
                        <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">
                          {totalScore}/{totalMax}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-ink-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-ink-muted" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Scoring Area */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-0 flex flex-col gap-4 border-t border-black/[0.04]">
                      {/* Team Members */}
                      <div className="flex flex-wrap gap-2 pt-3">
                        {team.participant_teammember.map((m, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-canvas-pearl border border-black/[0.06] text-[11px]"
                          >
                            {m.name}
                            <span className="text-ink-muted ml-1">({m.email})</span>
                          </span>
                        ))}
                      </div>

                      {/* Scoring Grid */}
                      <div className="grid gap-4">
                        {criteria.map((c) => {
                          const currentScore = teamScores[team.id]?.[c.id]?.score ?? 0;
                          const currentComment = teamScores[team.id]?.[c.id]?.comment ?? "";

                          return (
                            <div
                              key={c.id}
                              className="p-4 rounded-lg bg-canvas-pearl/60 border border-black/[0.04] flex flex-col gap-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="text-sm font-semibold">{c.name}</h5>
                                  {c.description && (
                                    <p className="text-[11px] text-ink-muted mt-0.5">{c.description}</p>
                                  )}
                                </div>
                                <span className="text-xs text-ink-muted font-medium">
                                  {currentScore} / {c.max_score}
                                </span>
                              </div>

                              {/* Score Slider */}
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={0}
                                  max={c.max_score}
                                  value={currentScore}
                                  onChange={(e) => updateScore(team.id, c.id, Number(e.target.value))}
                                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary"
                                  style={{
                                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${
                                      (currentScore / c.max_score) * 100
                                    }%, #e5e7eb ${(currentScore / c.max_score) * 100}%, #e5e7eb 100%)`,
                                  }}
                                />
                                <input
                                  type="number"
                                  min={0}
                                  max={c.max_score}
                                  value={currentScore}
                                  onChange={(e) => {
                                    const v = Math.min(c.max_score, Math.max(0, Number(e.target.value)));
                                    updateScore(team.id, c.id, v);
                                  }}
                                  className="w-16 px-2 py-1.5 rounded-md border border-black/[0.08] bg-canvas text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>

                              {/* Comment */}
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-ink-muted mt-2 shrink-0" />
                                <input
                                  type="text"
                                  value={currentComment}
                                  onChange={(e) => updateComment(team.id, c.id, e.target.value)}
                                  placeholder="Optional comment..."
                                  className="flex-1 px-3 py-2 rounded-md border border-black/[0.08] bg-canvas text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Submit */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-sm">
                          <span className="text-ink-muted">Total:</span>{" "}
                          <span className="font-bold text-primary">
                            {totalScore} / {totalMax}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSubmit(team.id)}
                          disabled={actionLoading === `submit-${team.id}`}
                          className="px-6 py-2.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-focus transition flex items-center gap-2 cursor-pointer disabled:opacity-40 apple-press-effect"
                        >
                          {actionLoading === `submit-${team.id}` ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Submitting…
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              {scored ? "Update Scores" : "Submit Scores"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTeams.length === 0 && (
              <div className="py-12 text-center text-ink-muted text-sm border border-dashed border-black/[0.1] rounded-xl bg-canvas-pearl/50">
                {searchQuery
                  ? "No teams match your search."
                  : "No registered teams found for this hackathon."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
