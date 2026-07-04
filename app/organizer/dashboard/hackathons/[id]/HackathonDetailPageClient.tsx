"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCloudinarySignature, toggleProblemStatementsRelease } from "@/app/actions/hackathons";
import {
  createProblemStatement,
  deleteProblemStatement,
  updateProblemStatement,
} from "@/app/actions/problemstatements";
import {
  createScanCategory,
  toggleScanCategoryStatus,
  deleteScanCategory,
} from "@/app/actions/scancategories";
import EvaluationTab from "./EvaluationTab";
import {
  Calendar,
  Users,
  CreditCard,
  Trash2,
  Plus,
  ExternalLink,
  FileText,
  Check,
  Loader2,
  X,
  Eye,
  EyeOff,
  Armchair,
  Edit,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  ChevronDown,
  MapPin,
  Hash,
} from "lucide-react";

interface ProblemStatement {
  id: number;
  title: string;
  description: string;
  pdf_file: string | null;
  max_teams_allowed: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ScanCategory {
  id: number;
  name: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  college: string;
  semester: number | null;
  degree: string;
}

interface TeamData {
  id: number;
  name: string;
  is_registered: boolean;
  is_qr_active: boolean;
  food_tokens_total: number;
  food_tokens_used: number;
  created_at: Date;
  selected_problem_statement_id: number | null;
  accounts_user: {
    id: number;
    full_name: string;
    email: string;
  };
  participant_teammember: TeamMember[];
  organizer_problemstatement: {
    id: number;
    title: string;
  } | null;
}

interface SeatAllocation {
  room: string;
  section: string;
  row: string;
  bench: number;
  seats: number[];
  members: string[];
}

interface TeamSeatingResult {
  name: string;
  seats: SeatAllocation[];
}

interface HackathonDetailPageClientProps {
  hackathon: {
    id: number;
    name: string;
    description: string | null;
    start_date: Date;
    end_date: Date;
    registration_deadline: Date;
    min_team_size: number;
    max_team_size: number;
    is_paid: boolean;
    fee_type: string | null;
    fee_amount: number | null;
    status: string;
    release_problems: boolean;
    room_configuration: string | null;
    seating_allocation: string | null;
    organizer_problemstatement: ProblemStatement[];
    organizer_scancategory: ScanCategory[];
    participant_team: TeamData[];
  };
}

export default function HackathonDetailPageClient({
  hackathon,
}: HackathonDetailPageClientProps) {
  const router = useRouter();
  
  // Extract max_teams limit from room_configuration metadata
  let maxTeamsLimit: number | null = null;
  if (hackathon.room_configuration) {
    try {
      const parsed = JSON.parse(hackathon.room_configuration);
      if (Array.isArray(parsed)) {
        const meta = parsed.find((el: any) => el.room_no === "METADATA" && el.type === "metadata");
        if (meta && typeof meta.max_teams === "number") {
          maxTeamsLimit = meta.max_teams;
        }
      }
    } catch (e) {
      console.error("Failed to parse room_configuration for max_teams in details view", e);
    }
  }

  // General Loading & Error states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "evaluation">("overview");

  // Teams tab states
  const [teamSearch, setTeamSearch] = useState("");
  const [teamStatusFilter, setTeamStatusFilter] = useState<"all" | "registered" | "draft">("all");
  const [teamPsFilter, setTeamPsFilter] = useState<number | "all">("all");
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);

  // Scan Category states
  const [newCategoryName, setNewCategoryName] = useState("");

  // Parse seating allocation to find a team's seat info
  const getTeamSeating = (teamName: string): SeatAllocation[] => {
    if (!hackathon.seating_allocation) return [];
    try {
      const parsed = JSON.parse(hackathon.seating_allocation);
      if (parsed?.teams && Array.isArray(parsed.teams)) {
        const match = parsed.teams.find((t: TeamSeatingResult) => t.name === teamName);
        return match?.seats || [];
      }
    } catch { /* ignore parse errors */ }
    return [];
  };

  const formatSeating = (teamName: string): string => {
    const seats = getTeamSeating(teamName);
    if (seats.length === 0) return "Unassigned";
    return seats.map(s => `${s.room} / ${s.row} / Bench ${s.bench}`).join(", ");
  };

  // Filter teams
  const filteredTeams = hackathon.participant_team.filter(team => {
    const q = teamSearch.toLowerCase();
    const matchesSearch = !q ||
      team.name.toLowerCase().includes(q) ||
      team.accounts_user.full_name.toLowerCase().includes(q) ||
      team.accounts_user.email.toLowerCase().includes(q) ||
      team.participant_teammember.some(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    const matchesStatus = teamStatusFilter === "all" ||
      (teamStatusFilter === "registered" && team.is_registered) ||
      (teamStatusFilter === "draft" && !team.is_registered);
    const matchesPs = teamPsFilter === "all" || team.selected_problem_statement_id === teamPsFilter;
    return matchesSearch && matchesStatus && matchesPs;
  });

  // Metrics
  const totalTeams = hackathon.participant_team.length;
  const registeredTeams = hackathon.participant_team.filter(t => t.is_registered).length;
  const totalParticipants = hackathon.participant_team.reduce((sum, t) => sum + t.participant_teammember.length, 0);
  const totalFoodUsed = hackathon.participant_team.reduce((sum, t) => sum + t.food_tokens_used, 0);
  const totalFoodIssued = hackathon.participant_team.reduce((sum, t) => sum + t.food_tokens_total, 0);

  // Problem Statement Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const [psForm, setPsForm] = useState({
    title: "",
    description: "",
    max_teams_allowed: 5,
    is_active: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Status Badge Styling Helper
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

  // PDF Validation and Upload helper
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setModalError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Client-side validation: Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setModalError("File size exceeds 10MB limit.");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    // Client-side verification: Magic Bytes
    try {
      const headerBytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      const header = Array.from(headerBytes)
        .map((b) => String.fromCharCode(b))
        .join("");

      if (header !== "%PDF") {
        setModalError("Invalid PDF header. Please select a valid PDF file.");
        setSelectedFile(null);
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
    } catch (err) {
      setModalError("Failed to verify the PDF file format.");
      setSelectedFile(null);
      e.target.value = "";
    }
  };

  // Upload to Cloudinary using Signed direct upload
  const uploadToCloudinary = (
    file: File,
    sig: { signature: string; timestamp: number; apiKey?: string; cloudName: string },
    onProgress: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/raw/upload`;

      xhr.open("POST", url, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.secure_url) {
              resolve(res.secure_url);
            } else {
              reject(new Error("Cloudinary response did not contain secure_url"));
            }
          } catch (err) {
            reject(new Error("Failed to parse Cloudinary response"));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(
              new Error(
                errRes.error?.message || `Upload failed with status ${xhr.status}`
              )
            );
          } catch (err) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during Cloudinary upload"));
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey || "");
      formData.append("timestamp", sig.timestamp.toString());
      formData.append("signature", sig.signature);
      formData.append("folder", "syntra_problem_statements");
      formData.append("format", "pdf");

      xhr.send(formData);
    });
  };

  // Submit new Problem Statement
  const handleAddProblemStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!psForm.title.trim() || !psForm.description.trim()) {
      setModalError("Title and description are required.");
      return;
    }

    setModalLoading(true);
    setModalError(null);
    setUploadProgress(0);
    setUploadStatus("Initializing upload parameters...");

    try {
      let pdfUrl: string | undefined = undefined;

      if (selectedFile) {
        setUploadStatus("Requesting upload signature...");
        const sig = await getCloudinarySignature();
        setUploadStatus("Uploading PDF directly to Cloudinary...");
        pdfUrl = await uploadToCloudinary(selectedFile, sig, (progress) => {
          setUploadProgress(progress);
        });
        setUploadStatus("PDF uploaded successfully! Saving statement...");
      }

      await createProblemStatement(hackathon.id, {
        title: psForm.title,
        description: psForm.description,
        pdf_url: pdfUrl,
        max_teams_allowed: Number(psForm.max_teams_allowed),
        is_active: psForm.is_active,
      });

      setPsForm({ title: "", description: "", max_teams_allowed: 5, is_active: true });
      setSelectedFile(null);
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setModalError(err.message || "Failed to create problem statement.");
    } finally {
      setModalLoading(false);
      setUploadProgress(null);
      setUploadStatus("");
    }
  };

  // Delete Problem Statement
  const handleDeleteProblemStatement = async (id: number) => {
    if (!confirm("Are you sure you want to delete this problem statement?")) return;
    setActionLoading(`delete-ps-${id}`);
    setErrorMsg(null);
    try {
      await deleteProblemStatement(id);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete problem statement.");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Problem Statement active status
  const handleToggleProblemStatement = async (ps: ProblemStatement) => {
    setActionLoading(`toggle-ps-${ps.id}`);
    setErrorMsg(null);
    try {
      await updateProblemStatement(ps.id, {
        title: ps.title,
        description: ps.description,
        max_teams_allowed: ps.max_teams_allowed,
        pdf_url: ps.pdf_file,
        is_active: !ps.is_active,
      });
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to toggle problem statement status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle problem statements release status to participants
  const handleToggleRelease = async () => {
    setActionLoading("toggle-release");
    setErrorMsg(null);
    try {
      await toggleProblemStatementsRelease(hackathon.id, !hackathon.release_problems);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to toggle problem statements release status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Create Scan Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setActionLoading("create-category");
    setErrorMsg(null);
    try {
      await createScanCategory(hackathon.id, newCategoryName);
      setNewCategoryName("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create scan category.");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Scan Category active status
  const handleToggleCategory = async (id: number, currentStatus: boolean) => {
    setActionLoading(`toggle-cat-${id}`);
    setErrorMsg(null);
    try {
      await toggleScanCategoryStatus(id, !currentStatus);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update scan category status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Scan Category
  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scan category? All associated scan records will be deleted.")) return;
    setActionLoading(`delete-cat-${id}`);
    setErrorMsg(null);
    try {
      await deleteScanCategory(id);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete scan category.");
    } finally {
      setActionLoading(null);
    }
  };

  const inputClass = "w-full p-2.5 rounded-md bg-canvas-pearl border border-black/[0.08] focus:border-primary focus:outline-none text-xs text-ink";

  return (
    <div className="flex flex-col gap-8">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-canvas-pearl border border-black/[0.06] w-full sm:w-fit overflow-x-auto no-scrollbar whitespace-nowrap flex-nowrap shrink-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
            activeTab === "overview"
              ? "bg-canvas text-ink apple-shadow-overlay"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Overview & Config
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-5 py-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === "teams"
              ? "bg-canvas text-ink apple-shadow-overlay"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Teams & Registrations
          {totalTeams > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary">
              {totalTeams}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("evaluation")}
          className={`px-5 py-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === "evaluation"
              ? "bg-canvas text-ink apple-shadow-overlay"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Faculty & Evaluation
        </button>
      </div>

      {/* ───── TEAMS TAB ───── */}
      {activeTab === "teams" && (
        <div className="flex flex-col gap-8 animate-fade-in">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-primary">Total Teams</span>
              <span className="text-2xl font-semibold text-ink tracking-tight">{totalTeams}</span>
            </div>
            <div className="p-5 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-success">Registered</span>
              <span className="text-2xl font-semibold text-ink tracking-tight">{registeredTeams}</span>
            </div>
            <div className="p-5 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-info">Participants</span>
              <span className="text-2xl font-semibold text-ink tracking-tight">{totalParticipants}</span>
            </div>
            <div className="p-5 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-warning">Food Tokens</span>
              <span className="text-2xl font-semibold text-ink tracking-tight">{totalFoodUsed} <span className="text-sm text-ink-muted font-normal">/ {totalFoodIssued}</span></span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search by team name, leader, or member..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-md bg-canvas-pearl border border-black/[0.08] focus:border-primary focus:outline-none text-xs text-ink"
              />
            </div>
            <div className="relative">
              <select
                value={teamStatusFilter}
                onChange={(e) => setTeamStatusFilter(e.target.value as "all" | "registered" | "draft")}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-md bg-canvas-pearl border border-black/[0.08] focus:border-primary focus:outline-none text-xs text-ink cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="registered">Registered</option>
                <option value="draft">Draft</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            </div>
            {hackathon.organizer_problemstatement.length > 0 && (
              <div className="relative">
                <select
                  value={teamPsFilter}
                  onChange={(e) => setTeamPsFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-md bg-canvas-pearl border border-black/[0.08] focus:border-primary focus:outline-none text-xs text-ink cursor-pointer"
                >
                  <option value="all">All Problems</option>
                  {hackathon.organizer_problemstatement.map(ps => (
                    <option key={ps.id} value={ps.id}>{ps.title}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              </div>
            )}
          </div>

          {/* Teams List */}
          {filteredTeams.length === 0 ? (
            <div className="p-10 rounded-lg bg-canvas border border-dashed border-black/[0.12] text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-canvas-parchment border border-black/[0.04] flex items-center justify-center text-ink-muted">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-ink font-semibold text-sm">{teamSearch || teamStatusFilter !== "all" || teamPsFilter !== "all" ? "No teams match your filters" : "No teams registered yet"}</p>
              <p className="text-xs text-ink-muted max-w-xs leading-relaxed">
                {teamSearch || teamStatusFilter !== "all" || teamPsFilter !== "all" ? "Try adjusting your search or filter criteria." : "Teams will appear here once participants register for this hackathon."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredTeams.map(team => {
                const seatingText = formatSeating(team.name);
                const isExpanded = expandedTeamId === team.id;
                return (
                  <div
                    key={team.id}
                    className={`rounded-lg bg-canvas border transition-all duration-300 overflow-hidden ${
                      team.is_registered
                        ? "border-black/[0.06] hover:border-black/[0.12] apple-shadow-overlay"
                        : "border-black/[0.04] opacity-75"
                    }`}
                  >
                    {/* Team Row Header */}
                    <button
                      onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                      className="w-full p-5 flex flex-col sm:flex-row sm:items-center gap-4 text-left cursor-pointer hover:bg-canvas-parchment/30 transition"
                    >
                      {/* Team Name + Status */}
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-ink text-base">{team.name}</h4>
                          {team.is_registered ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-pill bg-success-light border border-success/10 text-success">Registered</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-pill bg-canvas-parchment border border-black/[0.08] text-ink-muted">Draft</span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted">
                          Leader: <span className="font-medium text-ink">{team.accounts_user.full_name}</span> · {team.accounts_user.email}
                        </p>
                      </div>

                      {/* Problem Statement */}
                      <div className="hidden sm:flex flex-col gap-0.5 min-w-0 sm:w-40">
                        <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">Problem</span>
                        <span className="text-xs text-ink font-medium truncate">
                          {team.organizer_problemstatement?.title || "—"}
                        </span>
                      </div>

                      {/* Members Count */}
                      <div className="hidden sm:flex flex-col gap-0.5 sm:w-24">
                        <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">Members</span>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs text-ink font-medium">{team.participant_teammember.length}</span>
                        </div>
                      </div>

                      {/* Seating */}
                      <div className="hidden sm:flex flex-col gap-0.5 sm:w-44">
                        <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">Seating</span>
                        <div className="flex items-center gap-1.5">
                          <MapPin className={`w-3.5 h-3.5 ${seatingText === "Unassigned" ? "text-ink-muted" : "text-primary"}`} />
                          <span className={`text-xs font-medium truncate ${seatingText === "Unassigned" ? "text-ink-muted italic" : "text-ink"}`}>
                            {seatingText}
                          </span>
                        </div>
                      </div>

                      {/* Food Tokens */}
                      <div className="hidden sm:flex flex-col gap-0.5 sm:w-24">
                        <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">Food</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-canvas-pearl rounded-full border border-black/[0.04] overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: team.food_tokens_total > 0 ? `${Math.min(100, (team.food_tokens_used / team.food_tokens_total) * 100)}%` : "0%" }}
                            />
                          </div>
                          <span className="text-[10px] text-ink-muted font-medium whitespace-nowrap">{team.food_tokens_used}/{team.food_tokens_total}</span>
                        </div>
                      </div>

                      {/* Expand chevron */}
                      <ChevronDown className={`w-4 h-4 text-ink-muted transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-black/[0.06] animate-fade-in">
                        {/* Mobile Quick Summary Grid (Visible only on mobile screens) */}
                        <div className="grid grid-cols-2 gap-4 py-4 border-b border-black/[0.06] sm:hidden">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">Problem</span>
                            <span className="text-xs text-ink font-medium truncate">
                              {team.organizer_problemstatement?.title || "—"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">Members</span>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs text-ink font-medium">{team.participant_teammember.length}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">Seating</span>
                            <div className="flex items-center gap-1.5">
                              <MapPin className={`w-3.5 h-3.5 ${seatingText === "Unassigned" ? "text-ink-muted" : "text-primary"}`} />
                              <span className={`text-xs font-medium truncate ${seatingText === "Unassigned" ? "text-ink-muted italic" : "text-ink"}`}>
                                {seatingText}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">Food Tokens</span>
                            <span className="text-xs text-ink font-medium">
                              {team.food_tokens_used} / {team.food_tokens_total} used
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                          {/* Members List */}
                          <div className="flex flex-col gap-3">
                            <h5 className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" /> Team Members
                            </h5>
                            <div className="flex flex-col gap-2">
                              {team.participant_teammember.length === 0 ? (
                                <p className="text-xs text-ink-muted italic">No members added yet.</p>
                              ) : (
                                team.participant_teammember.map(member => (
                                  <div key={member.id} className="p-3 rounded-md bg-canvas-parchment/50 border border-black/[0.04] flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-semibold shrink-0">
                                        {member.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-ink truncate">{member.name}</p>
                                        <p className="text-[10px] text-ink-muted truncate">{member.email}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 ml-9 text-[10px] text-ink-muted">
                                      <span>{member.college}</span>
                                      <span>Sem {member.semester ?? "—"}</span>
                                      <span>{member.degree}</span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Seating Layout Visualization */}
                          <div className="flex flex-col gap-3">
                            <h5 className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" /> Seating Arrangement
                            </h5>
                            {(() => {
                              if (!hackathon.seating_allocation) {
                                return (
                                  <div className="p-5 rounded-md border border-dashed border-black/[0.08] text-center flex flex-col items-center gap-2">
                                    <Armchair className="w-6 h-6 text-ink-muted" />
                                    <p className="text-xs text-ink-muted italic">Seating not allocated yet.</p>
                                    <Link
                                      href={`/organizer/dashboard/seating?hackathonId=${hackathon.id}`}
                                      className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                                    >
                                      Go to Seating Console <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  </div>
                                );
                              }

                              let parsedAllocation: any = null;
                              try {
                                parsedAllocation = JSON.parse(hackathon.seating_allocation);
                              } catch { /* ignore */ }

                              if (!parsedAllocation?.room_view) {
                                return (
                                  <div className="p-4 rounded-md border border-dashed border-black/[0.08] text-center">
                                    <p className="text-xs text-ink-muted italic">Seating data unavailable.</p>
                                  </div>
                                );
                              }

                              const teamSeats = getTeamSeating(team.name);
                              const hasSeating = teamSeats.length > 0;

                              // Build a set of seat keys this team occupies for quick lookup
                              const teamSeatKeys = new Set<string>();
                              const teamBenchKeys = new Set<string>();
                              const teamRoomKeys = new Set<string>();
                              for (const s of teamSeats) {
                                teamRoomKeys.add(s.room);
                                teamBenchKeys.add(`${s.room}-${s.row}-${s.bench}`);
                                for (const seat of s.seats) {
                                  teamSeatKeys.add(`${s.room}-${s.row}-${s.bench}-${seat}`);
                                }
                              }

                              if (!hasSeating) {
                                return (
                                  <div className="p-5 rounded-md border border-dashed border-black/[0.08] text-center flex flex-col items-center gap-2">
                                    <Armchair className="w-6 h-6 text-ink-muted" />
                                    <p className="text-xs text-ink-muted italic">This team has no seats assigned.</p>
                                    <Link
                                      href={`/organizer/dashboard/seating?hackathonId=${hackathon.id}`}
                                      className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                                    >
                                      Go to Seating Console <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  </div>
                                );
                              }

                              const getMemberInitials = (name: string): string => {
                                return name
                                  .replace(/@.*$/, "")
                                  .split(/[\s._-]/)
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((w: string) => w[0].toUpperCase())
                                  .join("");
                              };

                              // Only show rooms where this team has seats
                              const relevantRooms = Object.entries(parsedAllocation.room_view as Record<string, any>)
                                .filter(([roomName]) => teamRoomKeys.has(roomName));

                              return (
                                <div className="flex flex-col gap-3">
                                  {/* Summary pill */}
                                  <div className="flex flex-wrap gap-2">
                                    {teamSeats.map((s, i) => (
                                      <span key={i} className="px-2.5 py-1 text-[10px] font-semibold rounded-pill bg-primary/10 text-primary border border-primary/20">
                                        {s.room} · {s.row} · B{s.bench} · {s.members.length} seat{s.members.length !== 1 ? "s" : ""}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Room layout cards */}
                                  {relevantRooms.map(([roomName, roomData]: [string, any]) => (
                                    <div key={roomName} className="rounded-lg border border-black/[0.06] overflow-hidden">
                                      {/* Room header */}
                                      <div className="px-4 py-2.5 border-b border-black/[0.06] bg-canvas-parchment/50 flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                                          <Hash className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div>
                                          <span className="text-xs font-semibold text-ink">{roomName}</span>
                                          <span className="text-[9px] text-ink-muted ml-2 uppercase tracking-widest">{roomData.room_type}</span>
                                        </div>
                                      </div>

                                      {/* Room grid */}
                                      <div className="p-4 flex flex-col gap-3">
                                        {Object.entries(roomData.rows as Record<string, any>).map(([rowName, rowData]: [string, any]) => (
                                          <div key={rowName} className="flex items-start gap-2.5">
                                            {/* Row label */}
                                            <div className="w-6 flex-shrink-0 pt-2.5 text-center">
                                              <span className="text-[9px] font-mono font-semibold text-ink-muted">{rowName}</span>
                                            </div>
                                            {/* Benches */}
                                            <div className="flex-1 flex flex-wrap gap-2">
                                              {(rowData.benches as any[]).map((bench: any, bIdx: number) => {
                                                const benchKey = `${roomName}-${rowName}-${bench.bench}`;
                                                const isTeamBench = teamBenchKeys.has(benchKey);

                                                return (
                                                  <div
                                                    key={bIdx}
                                                    className={`rounded-md overflow-hidden border transition-all duration-300 ${
                                                      isTeamBench
                                                        ? "border-primary/40 ring-1 ring-primary/20"
                                                        : "border-black/[0.06] opacity-40"
                                                    }`}
                                                  >
                                                    {/* Bench header */}
                                                    <div
                                                      className="px-2 py-1 flex items-center justify-between gap-2"
                                                      style={{
                                                        backgroundColor: isTeamBench ? "rgba(0,102,204,0.06)" : "rgba(0,0,0,0.02)",
                                                      }}
                                                    >
                                                      <span className="text-[8px] font-mono font-semibold text-ink-muted">B{bench.bench}</span>
                                                      <span className="text-[8px] text-ink-muted font-mono">{bench.assigned.length}/{bench.capacity}</span>
                                                    </div>
                                                    {/* Seats grid */}
                                                    <div className="px-1.5 py-1.5 bg-canvas flex items-center gap-1 flex-wrap">
                                                      {Array.from({ length: bench.capacity }).map((_, seatIdx) => {
                                                        const occupant = bench.assigned[seatIdx];
                                                        const seatKey = `${roomName}-${rowName}-${bench.bench}-${seatIdx + 1}`;
                                                        const isThisTeamSeat = occupant && occupant.team === team.name;
                                                        const initials = occupant ? getMemberInitials(occupant.member) : "";

                                                        return (
                                                          <div
                                                            key={seatIdx}
                                                            title={occupant ? `${occupant.member}\n${occupant.team}` : "Empty seat"}
                                                            className={`w-8 h-8 rounded-md flex items-center justify-center text-[9px] font-semibold cursor-help transition-all duration-200 flex-shrink-0 ${
                                                              isThisTeamSeat
                                                                ? "hover:scale-110 hover:z-10"
                                                                : ""
                                                            }`}
                                                            style={
                                                              isThisTeamSeat
                                                                ? {
                                                                    backgroundColor: "rgba(0,102,204,0.15)",
                                                                    color: "#004c99",
                                                                    border: "1.5px solid rgba(0,102,204,0.5)",
                                                                  }
                                                                : occupant
                                                                ? {
                                                                    backgroundColor: "rgba(0,0,0,0.04)",
                                                                    color: "rgba(0,0,0,0.25)",
                                                                    border: "1.5px solid rgba(0,0,0,0.06)",
                                                                  }
                                                                : {
                                                                    backgroundColor: "rgba(0,0,0,0.02)",
                                                                    border: "1.5px dashed rgba(0,0,0,0.08)",
                                                                    color: "rgba(0,0,0,0.12)",
                                                                  }
                                                            }
                                                          >
                                                            {isThisTeamSeat ? initials : occupant ? "·" : ""}
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Legend */}
                                  <div className="flex items-center gap-4 pt-1">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(0,102,204,0.15)", border: "1.5px solid rgba(0,102,204,0.5)" }} />
                                      <span className="text-[9px] text-ink-muted">This team</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.06)" }} />
                                      <span className="text-[9px] text-ink-muted">Other team</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(0,0,0,0.02)", border: "1.5px dashed rgba(0,0,0,0.08)" }} />
                                      <span className="text-[9px] text-ink-muted">Empty</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Additional info */}
                            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-black/[0.04]">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-ink-muted">Created</span>
                                <span className="text-ink font-medium">{new Date(team.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-ink-muted">QR Active</span>
                                <span className={`font-medium ${team.is_qr_active ? "text-success" : "text-ink-muted"}`}>
                                  {team.is_qr_active ? "Yes" : "No"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───── OVERVIEW TAB ───── */}
      {activeTab === "overview" && (
      <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column (Metadata + Problem Statements) */}
      <div className="flex-1 flex flex-col gap-8">
        
        {/* Error banner */}
        {errorMsg && (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger flex items-start gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold mb-0.5">Operation Failed</h5>
              <p>{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-ink-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hackathon Info Card */}
        <div className="p-8 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-ink tracking-tight">{hackathon.name}</h2>
                {getStatusBadge(hackathon.status)}
              </div>
              <p className="text-xs text-ink-muted mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Created on {new Date(hackathon.start_date).toLocaleDateString()}
              </p>
            </div>
            <Link
              href={`/organizer/dashboard/hackathons/${hackathon.id}/edit`}
              className="px-4 py-2 rounded-md bg-canvas-pearl border border-black/[0.08] hover:bg-canvas-parchment text-ink-muted hover:text-ink transition flex items-center gap-2 text-xs font-normal self-start"
            >
              <Edit className="w-4 h-4" />
              Edit details
            </Link>
          </div>

          {hackathon.description && (
            <p className="text-sm text-ink leading-relaxed bg-canvas-parchment p-4 rounded-md border border-black/[0.04]">
              {hackathon.description}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-black/[0.06]">
            {/* Timelines */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Timeline
              </h4>
              <div className="flex flex-col gap-1 text-xs">
                <div>
                  <span className="text-ink-muted block mb-0.5">Start Date</span>
                  <span className="text-ink font-medium">{new Date(hackathon.start_date).toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <span className="text-ink-muted block mb-0.5">End Date</span>
                  <span className="text-ink font-medium">{new Date(hackathon.end_date).toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <span className="text-ink-muted block mb-0.5">Reg. Deadline</span>
                  <span className="text-ink font-medium">{new Date(hackathon.registration_deadline).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Team Limits
              </h4>
              <div className="flex flex-col gap-2 text-xs text-ink font-medium">
                <div>
                  <span className="text-ink-muted block mb-0.5">Min Team Size</span>
                  <span>{hackathon.min_team_size} {hackathon.min_team_size === 1 ? "member" : "members"}</span>
                </div>
                <div>
                  <span className="text-ink-muted block mb-0.5">Max Team Size</span>
                  <span>{hackathon.max_team_size} {hackathon.max_team_size === 1 ? "member" : "members"}</span>
                </div>
                {maxTeamsLimit !== null && (
                  <div>
                    <span className="text-ink-muted block mb-0.5">Max Teams Limit</span>
                    <span>{maxTeamsLimit} teams</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Model */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Pricing
              </h4>
              <div className="flex flex-col gap-2 text-xs text-ink font-medium">
                <div>
                  <span className="text-ink-muted block mb-0.5">Type</span>
                  <span className={hackathon.is_paid ? "text-warning" : "text-success"}>
                    {hackathon.is_paid ? "Paid Entry" : "Free Entry"}
                  </span>
                </div>
                {hackathon.is_paid && (
                  <>
                    <div>
                      <span className="text-ink-muted block mb-0.5">Fee Model</span>
                      <span className="capitalize">{hackathon.fee_type} Wise</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block mb-0.5">Amount</span>
                      <span>INR {hackathon.fee_amount?.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Problem Statements Panel */}
        <div className="p-8 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-ink tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Problem Statements
            </h3>
            <div className="flex flex-wrap items-center gap-4.5 self-start sm:self-center">
              {/* Release Toggle Switch */}
              <div className="flex items-center gap-2.5 bg-canvas-parchment/60 border border-black/[0.04] px-3.5 py-2 rounded-md">
                <span className="text-[11px] font-semibold text-ink-muted">Release to Participants</span>
                <button
                  onClick={handleToggleRelease}
                  disabled={actionLoading !== null}
                  className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    hackathon.release_problems ? "bg-primary" : "bg-black/[0.12]"
                  }`}
                  aria-pressed={hackathon.release_problems}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      hackathon.release_problems ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-2 rounded-pill bg-primary text-white font-normal hover:bg-primary-focus transition flex items-center gap-1.5 text-xs cursor-pointer apple-press-effect"
              >
                <Plus className="w-4 h-4" />
                Add Problem
              </button>
            </div>
          </div>

          {hackathon.organizer_problemstatement.length === 0 ? (
            <div className="p-10 rounded-md border border-dashed border-black/[0.12] text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-canvas-parchment border border-black/[0.04] flex items-center justify-center text-ink-muted">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-ink font-semibold text-sm">No problem statements created</p>
                <p className="text-xs text-ink-muted max-w-xs mt-1 leading-relaxed">
                  Provide problem statements for participants to choose when signing up for the hackathon.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {hackathon.organizer_problemstatement.map((ps) => (
                <div
                  key={ps.id}
                  className={`p-5 rounded-md border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    ps.is_active
                      ? "bg-canvas-parchment/50 border-black/[0.06] hover:border-black/[0.12]"
                      : "bg-canvas-parchment/30 border-black/[0.04] opacity-60"
                  }`}
                >
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="font-semibold text-ink text-base">{ps.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-pill bg-canvas border border-black/[0.06] text-ink-muted font-semibold">
                        Limit: {ps.max_teams_allowed} teams
                      </span>
                      {!ps.is_active && (
                        <span className="text-[9px] px-2 py-0.5 rounded-pill bg-danger-light border border-danger/15 text-danger font-semibold uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">
                      {ps.description}
                    </p>
                    {ps.pdf_file && (
                      <a
                        href={ps.pdf_file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2 self-start font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View PDF Attachment
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleProblemStatement(ps)}
                      disabled={actionLoading !== null}
                      title={ps.is_active ? "Mark as Inactive" : "Mark as Active"}
                      className="p-2.5 rounded-md bg-canvas border border-black/[0.08] text-ink-muted hover:text-primary hover:bg-canvas-pearl transition disabled:opacity-40 cursor-pointer"
                    >
                      {actionLoading === `toggle-ps-${ps.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : ps.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteProblemStatement(ps.id)}
                      disabled={actionLoading !== null}
                      title="Delete problem statement"
                      className="p-2.5 rounded-md bg-canvas border border-black/[0.08] text-ink-muted hover:text-danger hover:bg-canvas-pearl transition disabled:opacity-40 cursor-pointer"
                    >
                      {actionLoading === `delete-ps-${ps.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin text-danger" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column (Scan Categories + Seating Quicklink) */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-8">
        
        {/* Seating Management Card */}
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-4">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">Physical Seating</h3>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Allocate table coordinates to participating teams using a seating algorithm.
            </p>
          </div>
          <Link
            href={`/organizer/dashboard/seating?hackathonId=${hackathon.id}`}
            className="w-full p-3 rounded-md bg-canvas-pearl border border-black/[0.08] hover:bg-canvas-parchment text-primary transition text-xs font-normal text-center flex items-center justify-center gap-2 cursor-pointer apple-press-effect"
          >
            Seating Console
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Scan Categories Panel */}
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-5">
          <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Scan Categories
          </h3>

          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. Lunch Day 1"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={actionLoading !== null}
              className="p-2.5 rounded-md bg-primary text-white font-normal hover:bg-primary-focus transition flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
            >
              {actionLoading === "create-category" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </form>

          {hackathon.organizer_scancategory.length === 0 ? (
            <p className="text-xs text-ink-muted italic text-center py-4">
              No scan categories defined.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {hackathon.organizer_scancategory.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-3 rounded-md bg-canvas-parchment border border-black/[0.04] flex items-center justify-between gap-3 text-xs ${
                    cat.is_active ? "" : "opacity-50"
                  }`}
                >
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="font-semibold text-ink leading-normal break-all">
                      {cat.name}
                    </span>
                    <span className="text-[9px] text-ink-muted">
                      Order: {cat.display_order}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                      disabled={actionLoading !== null}
                      title={cat.is_active ? "Disable QR scan" : "Enable QR scan"}
                      className={`p-1.5 rounded border transition cursor-pointer ${
                        cat.is_active
                          ? "border-success/25 bg-success-light text-success"
                          : "border-black/[0.08] bg-canvas text-ink-muted"
                      }`}
                    >
                      {actionLoading === `toggle-cat-${cat.id}` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      disabled={actionLoading !== null}
                      title="Delete category"
                      className="p-1.5 rounded border border-black/[0.08] bg-canvas text-ink-muted hover:text-danger transition cursor-pointer"
                    >
                      {actionLoading === `delete-cat-${cat.id}` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {/* Modal: Add Problem Statement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-lg bg-canvas border border-black/[0.08] apple-shadow-overlay overflow-hidden flex flex-col relative animate-scale-up">
            
            <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Add Problem Statement
              </h3>
              <button
                onClick={() => {
                  if (!modalLoading) {
                    setIsModalOpen(false);
                    setModalError(null);
                    setSelectedFile(null);
                  }
                }}
                disabled={modalLoading}
                className="p-1 text-ink-muted hover:text-ink rounded-md hover:bg-canvas-pearl transition disabled:opacity-40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3.5 rounded-md bg-danger-light border border-danger/15 text-danger flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-semibold">Error</h6>
                  <p className="mt-0.5">{modalError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddProblemStatement} className="p-6 flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-xs font-medium text-ink-muted">
                  Statement Title <span className="text-danger">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  placeholder="e.g. Realtime IoT Dashboard"
                  value={psForm.title}
                  onChange={(e) => setPsForm({ ...psForm, title: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-xs font-medium text-ink-muted">
                  Detailed Description <span className="text-danger">*</span>
                </label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  placeholder="Describe the problem, objectives, and evaluation guidelines..."
                  value={psForm.description}
                  onChange={(e) => setPsForm({ ...psForm, description: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="max_teams" className="text-xs font-medium text-ink-muted">
                    Max Teams Allowed <span className="text-danger">*</span>
                  </label>
                  <input
                    id="max_teams"
                    type="number"
                    required
                    min={1}
                    value={psForm.max_teams_allowed}
                    onChange={(e) =>
                      setPsForm({
                        ...psForm,
                        max_teams_allowed: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5 justify-end pb-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      id="ps_active"
                      type="checkbox"
                      checked={psForm.is_active}
                      onChange={(e) =>
                        setPsForm({ ...psForm, is_active: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-black/[0.15] bg-canvas-pearl text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <label
                      htmlFor="ps_active"
                      className="text-xs font-normal text-ink cursor-pointer select-none"
                    >
                      Enable statement immediately
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-black/[0.06]">
                <label className="text-xs font-medium text-ink-muted">
                  PDF Attachment (Optional, Max 10MB)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-ink-muted file:mr-3 file:py-2 file:px-4 file:rounded-md file:border file:border-black/[0.08] file:bg-canvas-pearl file:text-ink file:hover:bg-canvas-parchment file:cursor-pointer file:font-normal"
                />
                {selectedFile && (
                  <p className="text-[10px] text-success mt-1">
                    ✓ Validated: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Uploading progress states */}
              {uploadProgress !== null && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-primary font-semibold">{uploadStatus}</span>
                    <span className="text-ink-muted font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-canvas-pearl rounded-full h-1.5 border border-black/[0.06]">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full mt-4 py-3 rounded-pill bg-primary text-white font-normal hover:bg-primary-focus transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none apple-press-effect"
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving statement...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Statement
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───── EVALUATION TAB ───── */}
      {activeTab === "evaluation" && (
        <EvaluationTab hackathonId={hackathon.id} />
      )}
    </div>
  );
}
