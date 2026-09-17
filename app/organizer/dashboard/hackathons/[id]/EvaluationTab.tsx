"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  UserPlus,
  ClipboardList,
  GraduationCap,
  Edit,
  Check,
  BarChart3,
  Users,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  UserCheck,
  Layers,
  ArrowRight,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  GitBranch,
  ExternalLink,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  createEvaluationCriterion,
  updateEvaluationCriterion,
  deleteEvaluationCriterion,
  getEvaluationCriteria,
  assignFaculty,
  removeFaculty,
  getAssignedFaculty,
  getEvaluationReport,
  getFacultyTeamAssignments,
  assignTeamsToFaculty,
  unassignTeamFromFaculty,
  unassignAllTeamsFromFaculty,
  autoDistributeTeams,
} from "@/app/actions/faculty";

interface Criterion {
  id: number;
  name: string;
  description: string;
  max_score: number;
  display_order: number;
}

type FacultyAssignment = Awaited<ReturnType<typeof getAssignedFaculty>>[number];

interface EvaluationScore {
  id: number;
  score: number;
  comment: string;
  evaluation_criterion: { name: string; max_score: number };
  hackathon_faculty: {
    accounts_user: { full_name: string; email?: string };
  };
}

interface TeamWithScores {
  id: number;
  name: string;
  github_link?: string | null;
  accounts_user: { full_name: string; email?: string };
  organizer_problemstatement?: { title: string } | null;
  evaluation_score: EvaluationScore[];
}

interface ProblemStatement {
  id: number;
  title: string;
  description: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
}

interface TeamData {
  id: number;
  name: string;
  github_link?: string | null;
  accounts_user: { id: number; full_name: string; email: string };
  organizer_problemstatement: { id: number; title: string } | null;
  participant_teammember: TeamMember[];
  hackathon_faculty_team?: {
    hackathon_faculty: {
      accounts_user: { id: number; full_name: string };
    };
  } | null;
}

interface AssignmentData {
  faculty: {
    id: number;
    accounts_user: { id: number; email: string; full_name: string };
  };
  problemStatements: ProblemStatement[];
  assignedToThisFaculty: TeamData[];
  availableTeams: TeamData[];
  assignedToOtherFaculty: TeamData[];
  totalTeamsCount: number;
}

interface EvaluationTabProps {
  hackathonId: number;
  hackathonName?: string;
}

export default function EvaluationTab({ hackathonId, hackathonName }: EvaluationTabProps) {
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

  // Team Assignment Modal State
  const [selectedFacultyForTeams, setSelectedFacultyForTeams] = useState<FacultyAssignment | null>(null);
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [loadingAssignmentModal, setLoadingAssignmentModal] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(new Set());
  const [selectedPsFilter, setSelectedPsFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentModalTab, setAssignmentModalTab] = useState<"available" | "assigned" | "other">("available");

  // Auto-distribute confirmation modal
  const [showAutoDistributeModal, setShowAutoDistributeModal] = useState(false);

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

  async function handleExportExcel() {
    let reportData = report;
    if (!reportData) {
      setActionLoading("exporting");
      try {
        reportData = await getEvaluationReport(hackathonId);
        setReport(reportData);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load report for export");
        setActionLoading(null);
        return;
      }
    }

    if (!reportData || reportData.teams.length === 0) {
      setErrorMsg("No team score data available to export");
      setActionLoading(null);
      return;
    }

    setActionLoading("exporting");
    try {
      const maxTotal = reportData.criteria.reduce((sum, c) => sum + c.max_score, 0);

      // Filter only teams who have submitted their GitHub repository link
      const validTeams = reportData.teams.filter(
        (t) => t.github_link === undefined || (t.github_link !== null && t.github_link.trim().length > 0)
      );

      if (validTeams.length === 0) {
        setErrorMsg("No teams with submitted GitHub repository links found to export");
        setActionLoading(null);
        return;
      }

      // Process teams and calculate criterion averages and totals
      const processedTeams = validTeams.map((team) => {
        const scoresByCriterion: Record<number, { total: number; count: number }> = {};
        for (const score of team.evaluation_score) {
          const cName = score.evaluation_criterion.name;
          const criterion = reportData.criteria.find((c) => c.name === cName);
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
        for (const c of reportData.criteria) {
          const entry = scoresByCriterion[c.id];
          if (entry && entry.count > 0) {
            const avg = Math.round((entry.total / entry.count) * 10) / 10;
            criterionAvgs[c.id] = avg;
            totalAvg += avg;
          } else {
            criterionAvgs[c.id] = 0;
          }
        }

        const roundedTotal = Math.round(totalAvg * 10) / 10;
        const percentage = maxTotal > 0 ? `${((roundedTotal / maxTotal) * 100).toFixed(1)}%` : "0%";

        return {
          team,
          criterionAvgs,
          totalScore: roundedTotal,
          percentage,
        };
      });

      // Sort by total score descending for ranking
      processedTeams.sort((a, b) => b.totalScore - a.totalScore);

      // Sheet 1: Score Summary
      const summaryHeaders = [
        "Rank",
        "Team Name",
        "Leader Name",
        "Leader Email",
        "Problem Statement",
        ...reportData.criteria.map((c) => `${c.name} (Max ${c.max_score})`),
        "Total Score",
        "Max Possible Score",
        "Percentage",
      ];

      const summaryRows = processedTeams.map((item, idx) => {
        const criterionValues = reportData.criteria.map((c) => item.criterionAvgs[c.id] || 0);
        return [
          idx + 1,
          item.team.name,
          item.team.accounts_user?.full_name || "—",
          item.team.accounts_user?.email || "—",
          item.team.organizer_problemstatement?.title || "Not Assigned",
          ...criterionValues,
          item.totalScore,
          maxTotal,
          item.percentage,
        ];
      });

      // Sheet 2: Detailed Faculty Evaluations
      const detailHeaders = [
        "Sr. No.",
        "Team Name",
        "Leader Name",
        "Problem Statement",
        "Faculty Evaluator",
        "Evaluator Email",
      ];

      const detailRows: (string | number)[][] = [];
      let detailSrNo = 1;
      for (const item of processedTeams) {
        if (item.team.evaluation_score && item.team.evaluation_score.length > 0) {
          const seenFaculty = new Set<string>();
          for (const score of item.team.evaluation_score) {
            const facultyName = score.hackathon_faculty?.accounts_user?.full_name || "Faculty";
            const facultyEmail = score.hackathon_faculty?.accounts_user?.email || "—";
            const facultyKey = `${facultyName}|${facultyEmail}`;
            if (!seenFaculty.has(facultyKey)) {
              seenFaculty.add(facultyKey);
              detailRows.push([
                detailSrNo++,
                item.team.name,
                item.team.accounts_user?.full_name || "—",
                item.team.organizer_problemstatement?.title || "Not Assigned",
                facultyName,
                facultyEmail,
              ]);
            }
          }
        } else {
          detailRows.push([
            detailSrNo++,
            item.team.name,
            item.team.accounts_user?.full_name || "—",
            item.team.organizer_problemstatement?.title || "Not Assigned",
            "Not Evaluated",
            "—",
          ]);
        }
      }

      // Create Workbook & Sheets
      const wb = XLSX.utils.book_new();

      const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
      wsSummary["!cols"] = summaryHeaders.map((header, colIdx) => {
        let maxLen = header.length;
        for (const row of summaryRows) {
          const cellVal = row[colIdx] != null ? String(row[colIdx]) : "";
          if (cellVal.length > maxLen) maxLen = cellVal.length;
        }
        return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
      });
      XLSX.utils.book_append_sheet(wb, wsSummary, "Score Summary");

      const wsDetails = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
      wsDetails["!cols"] = detailHeaders.map((header, colIdx) => {
        let maxLen = header.length;
        for (const row of detailRows) {
          const cellVal = row[colIdx] != null ? String(row[colIdx]) : "";
          if (cellVal.length > maxLen) maxLen = cellVal.length;
        }
        return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
      });
      XLSX.utils.book_append_sheet(wb, wsDetails, "Detailed Evaluations");

      const safeName = (hackathonName || "Hackathon").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `${safeName}_Score_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setSuccessMsg("Score report exported successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to export score report to Excel:", err);
      setErrorMsg(err.message || "Failed to export score report to Excel");
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Team Assignment Modal Actions ─────────────────────
  async function openTeamAssignmentModal(f: FacultyAssignment) {
    setSelectedFacultyForTeams(f);
    setSelectedTeamIds(new Set());
    setSelectedPsFilter("all");
    setSearchQuery("");
    setAssignmentModalTab("available");
    setLoadingAssignmentModal(true);
    try {
      const data = await getFacultyTeamAssignments(hackathonId, f.id);
      setAssignmentData(data as any);
      if (data.availableTeams.length === 0 && data.assignedToThisFaculty.length > 0) {
        setAssignmentModalTab("assigned");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load team assignment data");
      setSelectedFacultyForTeams(null);
    } finally {
      setLoadingAssignmentModal(false);
    }
  }

  async function refreshAssignmentModalData() {
    if (!selectedFacultyForTeams) return;
    try {
      const data = await getFacultyTeamAssignments(hackathonId, selectedFacultyForTeams.id);
      setAssignmentData(data as any);
      setSelectedTeamIds(new Set());
      await loadData(); // refresh faculty team counts in list
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to refresh assignment data");
    }
  }

  async function handleAssignSelectedTeams() {
    if (!selectedFacultyForTeams || selectedTeamIds.size === 0) return;
    setActionLoading("assigning-teams");
    setErrorMsg(null);
    try {
      await assignTeamsToFaculty(
        hackathonId,
        selectedFacultyForTeams.id,
        Array.from(selectedTeamIds)
      );
      setSuccessMsg(`Successfully assigned ${selectedTeamIds.size} team(s) to ${selectedFacultyForTeams.accounts_user.full_name}!`);
      await refreshAssignmentModalData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to assign teams");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnassignSingleTeam(teamId: number) {
    if (!selectedFacultyForTeams) return;
    setActionLoading(`unassign-${teamId}`);
    setErrorMsg(null);
    try {
      await unassignTeamFromFaculty(hackathonId, selectedFacultyForTeams.id, teamId);
      setSuccessMsg("Team unassigned successfully!");
      await refreshAssignmentModalData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to unassign team");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnassignAllTeams() {
    if (!selectedFacultyForTeams) return;
    if (!confirm(`Are you sure you want to unassign all teams from ${selectedFacultyForTeams.accounts_user.full_name}?`)) return;
    setActionLoading("unassign-all");
    setErrorMsg(null);
    try {
      await unassignAllTeamsFromFaculty(hackathonId, selectedFacultyForTeams.id);
      setSuccessMsg("All teams unassigned from this faculty member.");
      await refreshAssignmentModalData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to unassign all teams");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAutoDistribute() {
    setActionLoading("auto-distribute");
    setErrorMsg(null);
    try {
      const res = await autoDistributeTeams(hackathonId);
      setShowAutoDistributeModal(false);
      setSuccessMsg(res.message || "Teams distributed successfully!");
      await loadData();
      if (selectedFacultyForTeams) {
        await refreshAssignmentModalData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to auto-distribute teams");
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Filtered Teams in Modal ───────────────────────────
  const filteredAvailableTeams = useMemo(() => {
    if (!assignmentData) return [];
    return assignmentData.availableTeams.filter((team) => {
      // PS Filter
      if (selectedPsFilter === "none") {
        if (team.organizer_problemstatement) return false;
      } else if (selectedPsFilter !== "all") {
        if (team.organizer_problemstatement?.id !== Number(selectedPsFilter)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = team.name.toLowerCase().includes(q);
        const matchesLeader = team.accounts_user.full_name.toLowerCase().includes(q);
        const matchesEmail = team.accounts_user.email.toLowerCase().includes(q);
        const matchesPS = team.organizer_problemstatement?.title.toLowerCase().includes(q);
        return matchesName || matchesLeader || matchesEmail || matchesPS;
      }
      return true;
    });
  }, [assignmentData, selectedPsFilter, searchQuery]);

  const filteredAssignedTeams = useMemo(() => {
    if (!assignmentData) return [];
    return assignmentData.assignedToThisFaculty.filter((team) => {
      if (selectedPsFilter === "none") {
        if (team.organizer_problemstatement) return false;
      } else if (selectedPsFilter !== "all") {
        if (team.organizer_problemstatement?.id !== Number(selectedPsFilter)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = team.name.toLowerCase().includes(q);
        const matchesLeader = team.accounts_user.full_name.toLowerCase().includes(q);
        const matchesEmail = team.accounts_user.email.toLowerCase().includes(q);
        const matchesPS = team.organizer_problemstatement?.title.toLowerCase().includes(q);
        return matchesName || matchesLeader || matchesEmail || matchesPS;
      }
      return true;
    });
  }, [assignmentData, selectedPsFilter, searchQuery]);

  const filteredOtherTeams = useMemo(() => {
    if (!assignmentData) return [];
    return assignmentData.assignedToOtherFaculty.filter((team) => {
      if (selectedPsFilter === "none") {
        if (team.organizer_problemstatement) return false;
      } else if (selectedPsFilter !== "all") {
        if (team.organizer_problemstatement?.id !== Number(selectedPsFilter)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = team.name.toLowerCase().includes(q);
        const matchesLeader = team.accounts_user.full_name.toLowerCase().includes(q);
        const matchesFaculty = team.hackathon_faculty_team?.hackathon_faculty.accounts_user.full_name.toLowerCase().includes(q);
        return matchesName || matchesLeader || matchesFaculty;
      }
      return true;
    });
  }, [assignmentData, selectedPsFilter, searchQuery]);

  function toggleTeamSelection(teamId: number) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    if (filteredAvailableTeams.length === 0) return;
    const allSelected = filteredAvailableTeams.every((t) => selectedTeamIds.has(t.id));
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filteredAvailableTeams.forEach((t) => next.delete(t.id));
      } else {
        filteredAvailableTeams.forEach((t) => next.add(t.id));
      }
      return next;
    });
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

      {/* Sub-section Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-canvas border border-black/[0.06] w-full sm:w-fit overflow-x-auto no-scrollbar whitespace-nowrap flex-nowrap shrink-0">
        {[
          { key: "criteria" as const, label: "Evaluation Criteria", icon: ClipboardList },
          { key: "faculty" as const, label: "Assign Faculty & Teams", icon: GraduationCap },
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
                ? "bg-canvas-parchment text-ink apple-shadow-overlay font-semibold"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-tight">Assigned Faculty & Teams</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Click on any faculty member to assign or unassign specific teams filtered by Problem Statement.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {faculty.length > 0 && (
                <button
                  onClick={() => setShowAutoDistributeModal(true)}
                  className="px-3.5 py-2 rounded-md bg-canvas-pearl border border-black/[0.08] text-xs font-semibold text-ink hover:bg-canvas transition flex items-center gap-2 cursor-pointer apple-press-effect"
                  title="Distribute unassigned teams evenly across all faculty"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Auto-Distribute Teams</span>
                </button>
              )}
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
              No faculty assigned yet. Click &quot;Assign Faculty&quot; to get started.
            </div>
          ) : (
            <div className="grid gap-3">
              {faculty.map((f) => {
                const assignedCount = f._count?.hackathon_faculty_team ?? 0;
                return (
                  <div
                    key={f.id}
                    onClick={() => openTeamAssignmentModal(f)}
                    className="p-4 rounded-xl bg-canvas border border-black/[0.06] flex items-center justify-between apple-shadow-card hover:border-primary/40 hover:bg-canvas-pearl/30 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-info/20 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold group-hover:text-primary transition">{f.accounts_user.full_name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              assignedCount > 0
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-black/[0.04] text-ink-muted"
                            }`}
                          >
                            {assignedCount} {assignedCount === 1 ? "Team" : "Teams"} Assigned
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">{f.accounts_user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openTeamAssignmentModal(f)}
                        className="px-3 py-1.5 rounded-lg bg-canvas-pearl border border-black/[0.08] hover:bg-primary hover:text-white text-xs font-medium text-ink transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Manage Teams</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      </button>

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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ REPORT SECTION ═══ */}
      {activeSection === "report" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold tracking-tight">Evaluation Scores Report</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                View aggregated scores from all assigned faculty
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={actionLoading === "exporting" || actionLoading === "report"}
                className="px-4 py-2 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-focus transition flex items-center gap-2 cursor-pointer disabled:opacity-40 apple-press-effect"
                title="Export all score report details to Excel"
              >
                {actionLoading === "exporting" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>Export Excel</span>
              </button>
              <button
                type="button"
                onClick={loadReport}
                disabled={actionLoading === "report" || actionLoading === "exporting"}
                className="px-4 py-2 rounded-md bg-canvas-pearl border border-black/[0.08] text-xs font-medium hover:bg-canvas transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {actionLoading === "report" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BarChart3 className="w-3.5 h-3.5" />
                )}
                <span>Refresh Report</span>
              </button>
            </div>
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
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider min-w-[120px] whitespace-nowrap">Team</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider min-w-[120px] whitespace-nowrap">Leader</th>
                    {report.criteria.map((c) => (
                      <th key={c.id} className="px-4 py-3 text-center text-[11px] font-semibold text-ink-muted uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                        {c.name}
                        <br />
                        <span className="text-[9px] text-ink-muted font-normal">/{c.max_score}</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-primary uppercase tracking-wider min-w-[80px] whitespace-nowrap">
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
                        <td className="px-4 py-3 font-medium min-w-[120px] whitespace-nowrap">{team.name}</td>
                        <td className="px-4 py-3 text-ink-muted min-w-[120px] whitespace-nowrap">{team.accounts_user.full_name}</td>
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

      {/* ═══ TEAM ASSIGNMENT MODAL ═══ */}
      {selectedFacultyForTeams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-canvas border border-black/[0.08] w-full max-w-4xl rounded-2xl apple-shadow-card flex flex-col max-h-[92vh] overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/[0.06] flex items-center justify-between bg-canvas-pearl/60">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-ink">
                      Assign Teams to {selectedFacultyForTeams.accounts_user.full_name}
                    </h3>
                  </div>
                  <p className="text-xs text-ink-muted">{selectedFacultyForTeams.accounts_user.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedFacultyForTeams(null)}
                className="p-2 rounded-lg hover:bg-black/[0.05] text-ink-muted hover:text-ink transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Loading State */}
            {loadingAssignmentModal ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <p className="text-sm text-ink-muted">Loading teams and problem statements…</p>
              </div>
            ) : !assignmentData ? (
              <div className="py-16 text-center text-ink-muted text-sm">Failed to load assignment data.</div>
            ) : (
              <>
                {/* Stats Bar */}
                <div className="px-5 py-3 bg-canvas-parchment/50 border-b border-black/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-semibold">
                      {assignmentData.assignedToThisFaculty.length} Assigned to this Faculty
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-success/10 text-success font-semibold">
                      {assignmentData.availableTeams.length} Available (Unassigned)
                    </span>
                    {assignmentData.assignedToOtherFaculty.length > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-black/[0.05] text-ink-muted font-medium">
                        {assignmentData.assignedToOtherFaculty.length} Assigned to Other Faculty
                      </span>
                    )}
                  </div>
                  <div className="text-ink-muted flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-primary" />
                    <span>Teams with Submitted Repos: <strong className="text-ink">{assignmentData.totalTeamsCount}</strong></span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="p-4 border-b border-black/[0.06] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-canvas">
                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    {/* Problem Statement Filter */}
                    <div className="relative min-w-[220px] flex-1">
                      <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                      <select
                        value={selectedPsFilter}
                        onChange={(e) => setSelectedPsFilter(e.target.value)}
                        className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-black/[0.08] bg-canvas-pearl text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition appearance-none cursor-pointer"
                      >
                        <option value="all">All Problem Statements</option>
                        {assignmentData.problemStatements.map((ps) => {
                          const availableCountForPs = assignmentData.availableTeams.filter(
                            (t) => t.organizer_problemstatement?.id === ps.id
                          ).length;
                          return (
                            <option key={ps.id} value={ps.id}>
                              {ps.title} ({availableCountForPs} submitted available)
                            </option>
                          );
                        })}
                        <option value="none">No Problem Statement Selected</option>
                      </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search team, leader or repo…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-black/[0.08] bg-canvas-pearl text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-canvas-pearl rounded-lg border border-black/[0.06] shrink-0">
                    <button
                      onClick={() => setAssignmentModalTab("available")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                        assignmentModalTab === "available"
                          ? "bg-canvas text-ink apple-shadow-overlay font-semibold"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      Available ({filteredAvailableTeams.length})
                    </button>
                    <button
                      onClick={() => setAssignmentModalTab("assigned")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                        assignmentModalTab === "assigned"
                          ? "bg-canvas text-ink apple-shadow-overlay font-semibold"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      Assigned ({filteredAssignedTeams.length})
                    </button>
                    {filteredOtherTeams.length > 0 && (
                      <button
                        onClick={() => setAssignmentModalTab("other")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                          assignmentModalTab === "other"
                            ? "bg-canvas text-ink apple-shadow-overlay font-semibold"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        Others ({filteredOtherTeams.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Team List Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-2.5">
                  {/* TAB 1: AVAILABLE TEAMS */}
                  {assignmentModalTab === "available" && (
                    <>
                      {filteredAvailableTeams.length > 0 && (
                        <div className="flex items-center justify-between pb-2 border-b border-black/[0.04]">
                          <button
                            type="button"
                            onClick={toggleSelectAllFiltered}
                            className="flex items-center gap-2 text-xs font-medium text-ink hover:text-primary transition cursor-pointer select-none"
                          >
                            {filteredAvailableTeams.every((t) => selectedTeamIds.has(t.id)) ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4 text-ink-muted" />
                            )}
                            <span>
                              {filteredAvailableTeams.every((t) => selectedTeamIds.has(t.id))
                                ? "Deselect All Filtered"
                                : `Select All Filtered (${filteredAvailableTeams.length})`}
                            </span>
                          </button>

                          <span className="text-[11px] text-ink-muted">
                            {selectedTeamIds.size} team(s) selected
                          </span>
                        </div>
                      )}

                      {filteredAvailableTeams.length === 0 ? (
                        <div className="py-14 text-center text-ink-muted text-sm border border-dashed border-black/[0.08] rounded-xl bg-canvas-pearl/30 flex flex-col items-center justify-center gap-2">
                          <GitBranch className="w-8 h-8 opacity-30 text-ink-muted" />
                          <p className="font-medium text-ink">No available teams with submitted GitHub repos</p>
                          <p className="text-xs text-ink-muted max-w-md">
                            {searchQuery || selectedPsFilter !== "all"
                              ? "Try adjusting your search or problem statement filter."
                              : "Only teams who have submitted their GitHub repository link are shown for evaluation assignment. Either all submitted teams are already assigned, or no teams have submitted their GitHub repository yet."}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {filteredAvailableTeams.map((team) => {
                            const isSelected = selectedTeamIds.has(team.id);
                            return (
                              <div
                                key={team.id}
                                onClick={() => toggleTeamSelection(team.id)}
                                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 select-none ${
                                  isSelected
                                    ? "bg-primary/5 border-primary/40 apple-shadow-overlay ring-1 ring-primary/30"
                                    : "bg-canvas border-black/[0.06] hover:border-black/[0.12] hover:bg-canvas-pearl/40"
                                }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Square className="w-4 h-4 text-ink-muted/60" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h5 className="text-xs font-semibold text-ink truncate">{team.name}</h5>
                                    <span className="text-[10px] text-ink-muted shrink-0">
                                      {team.participant_teammember.length} {team.participant_teammember.length === 1 ? "member" : "members"}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                                    Leader: {team.accounts_user.full_name}
                                  </p>
                                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                    {team.organizer_problemstatement ? (
                                      <span className="px-2 py-0.5 rounded-md bg-info/10 text-info text-[10px] font-semibold truncate max-w-full">
                                        PS: {team.organizer_problemstatement.title}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md bg-warning/10 text-warning text-[10px] font-medium">
                                        No PS Chosen
                                      </span>
                                    )}
                                    {team.github_link && (
                                      <a
                                        href={team.github_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium hover:underline truncate max-w-full"
                                        title={team.github_link}
                                      >
                                        <GitBranch className="w-3 h-3 shrink-0" />
                                        <span className="truncate max-w-[140px]">Repo</span>
                                        <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 2: ASSIGNED TEAMS */}
                  {assignmentModalTab === "assigned" && (
                    <>
                      {assignmentData.assignedToThisFaculty.length > 0 && (
                        <div className="flex items-center justify-between pb-2 border-b border-black/[0.04]">
                          <span className="text-xs font-medium text-ink">
                            Currently Assigned ({filteredAssignedTeams.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleUnassignAllTeams}
                            disabled={actionLoading === "unassign-all"}
                            className="text-[11px] text-danger hover:underline font-medium cursor-pointer disabled:opacity-40"
                          >
                            Unassign All Teams
                          </button>
                        </div>
                      )}

                      {filteredAssignedTeams.length === 0 ? (
                        <div className="py-14 text-center text-ink-muted text-sm border border-dashed border-black/[0.08] rounded-xl bg-canvas-pearl/30">
                          <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="font-medium text-ink">No teams assigned to this faculty yet</p>
                          <p className="text-xs text-ink-muted mt-1">
                            Switch to the &quot;Available&quot; tab to select and assign submitted teams.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {filteredAssignedTeams.map((team) => (
                            <div
                              key={team.id}
                              className="p-3.5 rounded-xl border border-black/[0.06] bg-canvas flex items-start justify-between gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-semibold text-ink truncate">{team.name}</h5>
                                  <span className="px-1.5 py-0.5 rounded bg-success/10 text-success text-[10px] font-medium">
                                    Assigned
                                  </span>
                                </div>
                                <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                                  Leader: {team.accounts_user.full_name} ({team.accounts_user.email})
                                </p>
                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                  {team.organizer_problemstatement ? (
                                    <span className="px-2 py-0.5 rounded-md bg-info/10 text-info text-[10px] font-semibold truncate max-w-full">
                                      PS: {team.organizer_problemstatement.title}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-warning/10 text-warning text-[10px] font-medium">
                                      No PS Chosen
                                    </span>
                                  )}
                                  {team.github_link && (
                                    <a
                                      href={team.github_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium hover:underline truncate max-w-full"
                                      title={team.github_link}
                                    >
                                      <GitBranch className="w-3 h-3 shrink-0" />
                                      <span className="truncate max-w-[140px]">Repo</span>
                                      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleUnassignSingleTeam(team.id)}
                                disabled={actionLoading === `unassign-${team.id}`}
                                className="px-2.5 py-1.5 rounded-md bg-danger-light text-danger hover:bg-danger hover:text-white transition text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40 shrink-0"
                                title="Unassign team"
                              >
                                {actionLoading === `unassign-${team.id}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                <span>Unassign</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 3: TEAMS ASSIGNED TO OTHER FACULTY */}
                  {assignmentModalTab === "other" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {filteredOtherTeams.map((team) => (
                        <div
                          key={team.id}
                          className="p-3.5 rounded-xl border border-black/[0.06] bg-canvas flex items-start justify-between gap-3 opacity-80"
                        >
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-semibold text-ink truncate">{team.name}</h5>
                            <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                              Leader: {team.accounts_user.full_name}
                            </p>
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-black/[0.05] text-ink-muted text-[10px] font-medium">
                                Assigned to: {team.hackathon_faculty_team?.hackathon_faculty.accounts_user.full_name}
                              </span>
                              {team.organizer_problemstatement && (
                                <span className="px-2 py-0.5 rounded-md bg-info/10 text-info text-[10px] font-semibold truncate">
                                  PS: {team.organizer_problemstatement.title}
                                </span>
                              )}
                              {team.github_link && (
                                <a
                                  href={team.github_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium hover:underline truncate"
                                  title={team.github_link}
                                >
                                  <GitBranch className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[120px]">Repo</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                </a>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeamIds(new Set([team.id]));
                              setAssignmentModalTab("available");
                            }}
                            className="px-2.5 py-1.5 rounded-md bg-canvas-pearl border border-black/[0.08] hover:bg-primary hover:text-white transition text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0"
                            title="Reassign to this faculty"
                          >
                            <span>Reassign</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-black/[0.06] bg-canvas-pearl/60 flex items-center justify-between gap-3">
                  <div className="text-xs text-ink-muted">
                    {assignmentModalTab === "available" ? (
                      <span>
                        <strong className="text-ink">{selectedTeamIds.size}</strong> of{" "}
                        {filteredAvailableTeams.length} available teams selected
                      </span>
                    ) : (
                      <span>
                        Total teams assigned: <strong className="text-ink">{assignmentData.assignedToThisFaculty.length}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFacultyForTeams(null)}
                      className="px-4 py-2 rounded-lg bg-canvas border border-black/[0.08] text-xs font-medium text-ink-muted hover:text-ink transition cursor-pointer"
                    >
                      Close
                    </button>

                    {assignmentModalTab === "available" && (
                      <button
                        type="button"
                        onClick={handleAssignSelectedTeams}
                        disabled={selectedTeamIds.size === 0 || actionLoading === "assigning-teams"}
                        className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-focus transition flex items-center gap-2 cursor-pointer disabled:opacity-40 apple-press-effect"
                      >
                        {actionLoading === "assigning-teams" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Assign Selected Teams ({selectedTeamIds.size})</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ AUTO-DISTRIBUTE CONFIRMATION MODAL ═══ */}
      {showAutoDistributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-canvas border border-black/[0.08] w-full max-w-md rounded-2xl p-6 apple-shadow-card flex flex-col gap-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">Auto-Distribute Teams</h3>
                <p className="text-xs text-ink-muted">Evenly allocate unassigned teams to faculty</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas-pearl border border-black/[0.06] text-xs text-ink-muted flex flex-col gap-2">
              <p>
                This will automatically distribute all currently <strong className="text-ink">unassigned registered teams who have submitted their GitHub repository</strong> across all <strong className="text-ink">{faculty.length} active faculty members</strong> in a balanced round-robin manner.
              </p>
              <p className="text-ink text-[11px] font-medium">
                • Teams already assigned to faculty will <span className="underline">not</span> be modified.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowAutoDistributeModal(false)}
                className="px-4 py-2 rounded-lg bg-canvas-pearl border border-black/[0.08] text-xs font-medium text-ink-muted hover:text-ink transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAutoDistribute}
                disabled={actionLoading === "auto-distribute"}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-focus transition flex items-center gap-2 cursor-pointer disabled:opacity-40 apple-press-effect"
              >
                {actionLoading === "auto-distribute" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Distribute</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

