"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  UserPlus,
  Star,
  ClipboardList,
  GraduationCap,
  Edit,
  Check,
  BarChart3,
} from "lucide-react";
import {
  createEvaluationCriterion,
  updateEvaluationCriterion,
  deleteEvaluationCriterion,
  getEvaluationCriteria,
  assignFaculty,
  removeFaculty,
  getAssignedFaculty,
  getEvaluationReport,
} from "@/app/actions/faculty";

interface Criterion {
  id: number;
  name: string;
  description: string;
  max_score: number;
  display_order: number;
}

interface FacultyAssignment {
  id: number;
  is_active: boolean;
  assigned_at: Date;
  accounts_user: {
    id: number;
    email: string;
    full_name: string;
  };
}

interface EvaluationScore {
  id: number;
  score: number;
  comment: string;
  evaluation_criterion: { name: string; max_score: number };
  hackathon_faculty: {
    accounts_user: { full_name: string };
  };
}

interface TeamWithScores {
  id: number;
  name: string;
  accounts_user: { full_name: string };
  evaluation_score: EvaluationScore[];
}

interface EvaluationTabProps {
  hackathonId: number;
}

export default function EvaluationTab({ hackathonId }: EvaluationTabProps) {
  // ─── State ─────────────────────────────────────────────
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [faculty, setFaculty] = useState<FacultyAssignment[]>([]);
  const [report, setReport] = useState<{ criteria: Criterion[]; teams: TeamWithScores[] } | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Criteria form
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [criteriaForm, setCriteriaForm] = useState({ name: "", description: "", max_score: 10 });

  // Faculty assign form
  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [facultyForm, setFacultyForm] = useState({ email: "", name: "", defaultPassword: "" });

  // Sub-section toggle
  const [activeSection, setActiveSection] = useState<"criteria" | "faculty" | "report">("criteria");

  // ─── Data Loading ──────────────────────────────────────
  useEffect(() => {
    loadData();
  }, [hackathonId]);

  async function loadData() {
    setLoading(true);
    try {
      const [criteriaData, facultyData] = await Promise.all([
        getEvaluationCriteria(hackathonId),
        getAssignedFaculty(hackathonId),
      ]);
      setCriteria(criteriaData);
      setFaculty(facultyData);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load evaluation data");
    } finally {
      setLoading(false);
    }
  }

  async function loadReport() {
    setActionLoading("report");
    try {
      const data = await getEvaluationReport(hackathonId);
      setReport(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load report");
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Criteria Actions ─────────────────────────────────
  async function handleCreateCriterion(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading("criteria");
    setErrorMsg(null);
    try {
      await createEvaluationCriterion(hackathonId, {
        name: criteriaForm.name,
        description: criteriaForm.description,
        max_score: criteriaForm.max_score,
      });
      setCriteriaForm({ name: "", description: "", max_score: 10 });
      setShowCriteriaForm(false);
      setSuccessMsg("Criterion created!");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateCriterion(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCriterion) return;
    setActionLoading("criteria");
    setErrorMsg(null);
    try {
      await updateEvaluationCriterion(editingCriterion.id, {
        name: criteriaForm.name,
        description: criteriaForm.description,
        max_score: criteriaForm.max_score,
      });
      setEditingCriterion(null);
      setCriteriaForm({ name: "", description: "", max_score: 10 });
      setSuccessMsg("Criterion updated!");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteCriterion(id: number) {
    setActionLoading(`delete-${id}`);
    setErrorMsg(null);
    try {
      await deleteEvaluationCriterion(id);
      setSuccessMsg("Criterion deleted!");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  function startEditCriterion(c: Criterion) {
    setEditingCriterion(c);
    setCriteriaForm({ name: c.name, description: c.description, max_score: c.max_score });
    setShowCriteriaForm(false);
  }

  function cancelEdit() {
    setEditingCriterion(null);
    setCriteriaForm({ name: "", description: "", max_score: 10 });
  }

  // ─── Faculty Actions ──────────────────────────────────
  async function handleAssignFaculty(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading("faculty");
    setErrorMsg(null);
    try {
      await assignFaculty(hackathonId, {
        email: facultyForm.email,
        name: facultyForm.name,
        defaultPassword: facultyForm.defaultPassword,
      });
      setFacultyForm({ email: "", name: "", defaultPassword: "" });
      setShowFacultyForm(false);
      setSuccessMsg("Faculty assigned successfully! Account created if it didn't exist.");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveFaculty(assignmentId: number) {
    setActionLoading(`remove-${assignmentId}`);
    setErrorMsg(null);
    try {
      await removeFaculty(assignmentId);
      setSuccessMsg("Faculty removed!");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  // Auto-dismiss success message
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ─── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-3 text-sm text-ink-muted">Loading evaluation data…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-md bg-danger-light border border-danger/15 text-danger flex items-start gap-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-md bg-success-light border border-success/15 text-success flex items-center gap-3 text-sm">
          <Check className="w-4 h-4" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Sub-section Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-canvas border border-black/[0.06] w-fit">
        {[
          { key: "criteria" as const, label: "Evaluation Criteria", icon: ClipboardList },
          { key: "faculty" as const, label: "Assign Faculty", icon: GraduationCap },
          { key: "report" as const, label: "Score Report", icon: BarChart3 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveSection(key);
              if (key === "report" && !report) loadReport();
            }}
            className={`px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeSection === key
                ? "bg-canvas-parchment text-ink apple-shadow-overlay"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══ CRITERIA SECTION ═══ */}
      {activeSection === "criteria" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight">Evaluation Criteria</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Define the criteria on which faculty will evaluate teams
              </p>
            </div>
            {!showCriteriaForm && !editingCriterion && (
              <button
                onClick={() => setShowCriteriaForm(true)}
                className="px-4 py-2 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-focus transition flex items-center gap-2 cursor-pointer apple-press-effect"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Criterion
              </button>
            )}
          </div>

          {/* Create / Edit Form */}
          {(showCriteriaForm || editingCriterion) && (
            <form
              onSubmit={editingCriterion ? handleUpdateCriterion : handleCreateCriterion}
              className="p-5 rounded-xl bg-canvas border border-black/[0.06] flex flex-col gap-4 apple-shadow-card"
            >
              <h4 className="text-sm font-semibold">
                {editingCriterion ? "Edit Criterion" : "New Criterion"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">Name *</label>
                  <input
                    type="text"
                    required
                    value={criteriaForm.name}
                    onChange={(e) => setCriteriaForm({ ...criteriaForm, name: e.target.value })}
                    placeholder="e.g. Innovation"
                    className="px-3 py-2.5 rounded-md border border-black/[0.08] bg-canvas-pearl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={criteriaForm.description}
                    onChange={(e) => setCriteriaForm({ ...criteriaForm, description: e.target.value })}
                    placeholder="Brief description"
                    className="px-3 py-2.5 rounded-md border border-black/[0.08] bg-canvas-pearl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">Max Score *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={criteriaForm.max_score}
                    onChange={(e) => setCriteriaForm({ ...criteriaForm, max_score: Number(e.target.value) })}
                    className="px-3 py-2.5 rounded-md border border-black/[0.08] bg-canvas-pearl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={actionLoading === "criteria"}
                  className="px-5 py-2.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-focus transition flex items-center gap-2 cursor-pointer disabled:opacity-40 apple-press-effect"
                >
                  {actionLoading === "criteria" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : editingCriterion ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  {editingCriterion ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCriteriaForm(false);
                    cancelEdit();
                  }}
                  className="px-4 py-2.5 rounded-md bg-canvas-pearl border border-black/[0.08] text-xs text-ink-muted hover:text-ink transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Criteria List */}
          {criteria.length === 0 ? (
            <div className="py-12 text-center text-ink-muted text-sm border border-dashed border-black/[0.1] rounded-xl bg-canvas-pearl/50">
              <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
              No criteria defined yet. Add criteria for faculty to evaluate teams.
            </div>
          ) : (
            <div className="grid gap-3">
              {criteria.map((c, idx) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-canvas border border-black/[0.06] flex items-center justify-between apple-shadow-card hover:border-black/[0.1] transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{c.name}</h4>
                      {c.description && (
                        <p className="text-xs text-ink-muted mt-0.5">{c.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md bg-info/10 text-info text-[11px] font-semibold">
                      Max: {c.max_score}
                    </span>
                    <button
                      onClick={() => startEditCriterion(c)}
                      className="p-1.5 rounded-md hover:bg-canvas-pearl text-ink-muted hover:text-ink transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCriterion(c.id)}
                      disabled={actionLoading === `delete-${c.id}`}
                      className="p-1.5 rounded-md hover:bg-danger-light text-ink-muted hover:text-danger transition cursor-pointer disabled:opacity-40"
                      title="Delete"
                    >
                      {actionLoading === `delete-${c.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ FACULTY SECTION ═══ */}
      {activeSection === "faculty" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight">Assigned Faculty</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Assign faculty members to evaluate teams. If account doesn&apos;t exist, it will be auto-created.
              </p>
            </div>
            {!showFacultyForm && (
              <button
                onClick={() => setShowFacultyForm(true)}
                className="px-4 py-2 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-focus transition flex items-center gap-2 cursor-pointer apple-press-effect"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign Faculty
              </button>
            )}
          </div>

          {/* Assign Form */}
          {showFacultyForm && (
            <form
              onSubmit={handleAssignFaculty}
              className="p-5 rounded-xl bg-canvas border border-black/[0.06] flex flex-col gap-4 apple-shadow-card"
            >
              <h4 className="text-sm font-semibold">Assign New Faculty</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">Email *</label>
                  <input
                    type="email"
                    required
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    placeholder="faculty@college.edu"
                    className="px-3 py-2.5 rounded-md border border-black/[0.08] bg-canvas-pearl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={facultyForm.name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                    placeholder="Dr. Sharma"
                    className="px-3 py-2.5 rounded-md border border-black/[0.08] bg-canvas-pearl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">Default Password *</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={facultyForm.defaultPassword}
                    onChange={(e) => setFacultyForm({ ...facultyForm, defaultPassword: e.target.value })}
                    placeholder="FacultyPass123"
                    className="px-3 py-2.5 rounded-md border border-black/[0.08] bg-canvas-pearl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                  <p className="text-[10px] text-ink-muted">Faculty will use this password to login. Min 6 characters.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={actionLoading === "faculty"}
                  className="px-5 py-2.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-focus transition flex items-center gap-2 cursor-pointer disabled:opacity-40 apple-press-effect"
                >
                  {actionLoading === "faculty" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  Assign & Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFacultyForm(false);
                    setFacultyForm({ email: "", name: "", defaultPassword: "" });
                  }}
                  className="px-4 py-2.5 rounded-md bg-canvas-pearl border border-black/[0.08] text-xs text-ink-muted hover:text-ink transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Faculty List */}
          {faculty.length === 0 ? (
            <div className="py-12 text-center text-ink-muted text-sm border border-dashed border-black/[0.1] rounded-xl bg-canvas-pearl/50">
              <GraduationCap className="w-8 h-8 mx-auto mb-3 opacity-30" />
              No faculty assigned yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {faculty.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl bg-canvas border border-black/[0.06] flex items-center justify-between apple-shadow-card hover:border-black/[0.1] transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-info/20 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{f.accounts_user.full_name}</h4>
                      <p className="text-xs text-ink-muted">{f.accounts_user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFaculty(f.id)}
                    disabled={actionLoading === `remove-${f.id}`}
                    className="p-2 rounded-md hover:bg-danger-light text-ink-muted hover:text-danger transition cursor-pointer disabled:opacity-40"
                    title="Remove faculty"
                  >
                    {actionLoading === `remove-${f.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ REPORT SECTION ═══ */}
      {activeSection === "report" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight">Evaluation Scores Report</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                View aggregated scores from all assigned faculty
              </p>
            </div>
            <button
              onClick={loadReport}
              disabled={actionLoading === "report"}
              className="px-4 py-2 rounded-md bg-canvas-pearl border border-black/[0.08] text-xs font-medium hover:bg-canvas transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {actionLoading === "report" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BarChart3 className="w-3.5 h-3.5" />
              )}
              Refresh Report
            </button>
          </div>

          {actionLoading === "report" && !report && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-ink-muted">Loading report…</span>
            </div>
          )}

          {report && report.teams.length === 0 && (
            <div className="py-12 text-center text-ink-muted text-sm border border-dashed border-black/[0.1] rounded-xl bg-canvas-pearl/50">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-30" />
              No registered teams found. Evaluations will appear once faculty scores teams.
            </div>
          )}

          {report && report.teams.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-canvas-pearl border-b border-black/[0.06]">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Team</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Leader</th>
                    {report.criteria.map((c) => (
                      <th key={c.id} className="px-4 py-3 text-center text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                        {c.name}
                        <br />
                        <span className="text-[9px] text-ink-muted font-normal">/{c.max_score}</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-primary uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.teams.map((team) => {
                    const maxTotal = report.criteria.reduce((sum, c) => sum + c.max_score, 0);

                    // Aggregate scores per criterion (average across all faculty)
                    const scoresByCriterion: Record<number, { total: number; count: number }> = {};
                    for (const score of team.evaluation_score) {
                      const cName = score.evaluation_criterion.name;
                      const criterion = report.criteria.find((c) => c.name === cName);
                      if (criterion) {
                        if (!scoresByCriterion[criterion.id]) {
                          scoresByCriterion[criterion.id] = { total: 0, count: 0 };
                        }
                        scoresByCriterion[criterion.id].total += score.score;
                        scoresByCriterion[criterion.id].count += 1;
                      }
                    }

                    let totalAvg = 0;
                    const criterionAvgs: Record<number, number> = {};
                    for (const c of report.criteria) {
                      const entry = scoresByCriterion[c.id];
                      if (entry && entry.count > 0) {
                        const avg = Math.round((entry.total / entry.count) * 10) / 10;
                        criterionAvgs[c.id] = avg;
                        totalAvg += avg;
                      } else {
                        criterionAvgs[c.id] = 0;
                      }
                    }

                    return (
                      <tr key={team.id} className="border-b border-black/[0.04] hover:bg-canvas-pearl/50 transition">
                        <td className="px-4 py-3 font-medium">{team.name}</td>
                        <td className="px-4 py-3 text-ink-muted">{team.accounts_user.full_name}</td>
                        {report.criteria.map((c) => {
                          const avg = criterionAvgs[c.id] ?? 0;
                          const pct = c.max_score > 0 ? avg / c.max_score : 0;
                          return (
                            <td key={c.id} className="px-4 py-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                                  avg === 0
                                    ? "bg-canvas-pearl text-ink-muted"
                                    : pct >= 0.8
                                    ? "bg-success/10 text-success"
                                    : pct >= 0.5
                                    ? "bg-warning/10 text-warning"
                                    : "bg-danger/10 text-danger"
                                }`}
                              >
                                {avg > 0 ? avg : "—"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">
                            {Math.round(totalAvg * 10) / 10} / {maxTotal}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
