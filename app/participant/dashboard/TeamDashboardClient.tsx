"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  searchUsersToRegister,
  submitTeamRegistration,
  deleteTeam,
  joinTeamByToken,
  renameTeam,
} from "@/app/actions/teams";
import {
  searchParticipantsForInvite,
  sendTeamInvite,
  cancelTeamInvite,
  getPendingSentInvites,
} from "@/app/actions/teamRequests";
import {
  Users,
  Plus,
  Search,
  Trash2,
  Check,
  X,
  Loader2,
  Mail,
  GraduationCap,
  Pencil,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  AlertTriangle,
  Send,
  Clock,
  ExternalLink,
  Trophy,
} from "lucide-react";
import CustomModal from "./CustomModal";
import ToastContainer, { ToastMessage } from "./ToastContainer";

// ─── Types ──────────────────────────────────────────────────────────

interface TeamMember {
  id: number;
  name: string;
  email: string;
  college: string;
  degree: string;
  semester: number | null;
  participant_teammember_skills: {
    participant_skill: { name: string };
  }[];
}

interface TeamData {
  id: number;
  name: string;
  leader_id: number;
  invite_token: string | null;
  qr_token: string | null;
  is_registered: boolean;
  organizer_hackathon: {
    id: number;
    name: string;
    max_team_size: number;
    min_team_size: number;
    status: string;
    is_paid: boolean;
    fee_amount: any;
    fee_type: string | null;
  };
  participant_teammember: TeamMember[];
}

interface Hackathon {
  id: number;
  name: string;
  description: string | null;
  start_date: Date;
  registration_deadline: Date;
  max_team_size: number;
  min_team_size: number;
  status: string;
}

interface UserTeam {
  id: number;
  name: string;
  hackathonId: number;
  isLeader: boolean;
  isRegistered?: boolean;
  hackathonName?: string;
  hasQr?: boolean;
}

// ─── Helper Functions ───────────────────────────────────────────────

function parseDegreeAndRole(degreeString: string) {
  if (!degreeString) return { degree: "", role: "" };
  const match = degreeString.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return {
      degree: match[1],
      role: match[2],
    };
  }
  return {
    degree: degreeString,
    role: "",
  };
}

function getMissingFields(member: TeamMember) {
  const missing: string[] = [];
  if (!member.college?.trim()) missing.push("College");
  if (member.semester === null || member.semester === undefined) missing.push("Semester");
  const parsed = parseDegreeAndRole(member.degree || "");
  if (!parsed.degree?.trim()) missing.push("Degree");
  return missing.join(", ");
}

function getRoleBadgeStyles(role: string) {
  const normalized = role.toLowerCase();
  if (normalized.includes("lead") || normalized.includes("leader") || normalized.includes("manager")) {
    return "bg-purple-50 border-purple-200 text-purple-700";
  }
  if (
    normalized.includes("developer") ||
    normalized.includes("coder") ||
    normalized.includes("programmer") ||
    normalized.includes("frontend") ||
    normalized.includes("backend") ||
    normalized.includes("fullstack") ||
    normalized.includes("dev")
  ) {
    return "bg-blue-50 border-blue-200 text-blue-700";
  }
  if (
    normalized.includes("designer") ||
    normalized.includes("ux") ||
    normalized.includes("ui") ||
    normalized.includes("product")
  ) {
    return "bg-pink-50 border-pink-200 text-pink-700";
  }
  return "bg-canvas-parchment border-black/[0.08] text-ink-muted";
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-indigo-100 text-indigo-700",
];

// ─── Form Input Component (module-level to prevent remount on parent re-render) ─

function FormInput({
  label,
  required,
  ...inputProps
}: {
  label: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[11px] text-ink-muted mb-1.5 font-semibold uppercase tracking-wider">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <input
        {...inputProps}
        className="w-full px-4 py-2.5 rounded-md bg-canvas-pearl border border-black/[0.08] text-ink text-sm placeholder-ink-muted/50 focus:outline-none focus:border-primary transition"
      />
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export default function TeamDashboardClient({
  userId,
  team,
  hackathons,
  selectedHackathonId,
  userTeams,
  isHackathonFull = false,
}: {
  userId: number;
  team: TeamData | null;
  hackathons: Hackathon[];
  selectedHackathonId: number | null;
  userTeams: UserTeam[];
  isHackathonFull?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UX Enhancements States
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: "confirm" | "alert";
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    title: "",
    message: "",
    type: "alert",
    onConfirm: () => {},
  });

  const addToast = (message: string, type: "success" | "error" | "warning") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    setModalConfig({
      title,
      message,
      type: "confirm",
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setModalOpen(false);
      },
    });
    setModalOpen(true);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    addToast("Invite token copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Invite System State (Django parity) ───
  const [pendingInvites, setPendingInvites] = useState<
    { id: number; receiverName: string; receiverEmail: string; createdAt: string }[]
  >([]);
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [inviteSearchResults, setInviteSearchResults] = useState<
    { userId: number; name: string; email: string; college: string; degree: string; semester: number; skills: string[] }[]
  >([]);
  const [inviteSearching, setInviteSearching] = useState(false);
  const [inviteSending, setInviteSending] = useState<number | null>(null);
  const [inviteCanceling, setInviteCanceling] = useState<number | null>(null);

  const isLeader = team ? team.leader_id === userId : false;

  // Load pending sent invites for the team leader
  const loadPendingInvites = useCallback(async () => {
    if (!team || team.leader_id !== userId || team.is_registered) return;
    try {
      const invites = await getPendingSentInvites(team.id);
      setPendingInvites(invites);
    } catch { /* ignore */ }
  }, [team?.id, team?.is_registered, team?.leader_id, userId]);

  useEffect(() => {
    loadPendingInvites();
  }, [loadPendingInvites]);

  // Search participants by skill for inviting
  const handleInviteSearch = async () => {
    if (!team) return;
    setInviteSearching(true);
    try {
      const results = await searchParticipantsForInvite(
        team.organizer_hackathon.id,
        inviteSearchQuery
      );
      setInviteSearchResults(results);
    } catch (e: any) {
      addToast(e.message || "Search failed.", "error");
    } finally {
      setInviteSearching(false);
    }
  };

  // Send invite to a participant
  const handleSendInvite = async (receiverUserId: number) => {
    if (!team) return;
    setInviteSending(receiverUserId);
    try {
      await sendTeamInvite(team.id, receiverUserId);
      // Remove from search results
      setInviteSearchResults((prev) => prev.filter((r) => r.userId !== receiverUserId));
      // Reload pending invites
      await loadPendingInvites();
      addToast("Invitation sent successfully!", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to send invite.", "error");
    } finally {
      setInviteSending(null);
    }
  };

  // Cancel a pending invite
  const handleCancelInvite = async (requestId: number) => {
    setInviteCanceling(requestId);
    try {
      await cancelTeamInvite(requestId);
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== requestId));
      addToast("Invitation cancelled successfully.", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to cancel invite.", "error");
    } finally {
      setInviteCanceling(null);
    }
  };

  // Create team state
  const [createTeamName, setCreateTeamName] = useState("");

  // Join team by token state (Django parity: JoinTeamAPIView)
  const [joinToken, setJoinToken] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Rename team state (Django parity: save_team POST)
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  // Form states for adding/editing members
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberCollege, setMemberCollege] = useState("");
  const [memberDegree, setMemberDegree] = useState("");
  const [memberSemester, setMemberSemester] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberSkills, setMemberSkills] = useState("");

  // Search autocomplete state
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const memberCount = team ? team.participant_teammember.length : 0;
  const selectedHackathon = hackathons.find((h) => h.id === selectedHackathonId);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const resetForm = () => {
    setMemberName("");
    setMemberEmail("");
    setMemberCollege("");
    setMemberDegree("");
    setMemberSemester("");
    setMemberRole("");
    setMemberSkills("");
    setEditingMemberId(null);
    setUserQuery("");
    setSearchResults([]);
  };

  const handleCreateTeam = () => {
    if (!selectedHackathonId || !createTeamName.trim()) return;
    clearMessages();
    startTransition(async () => {
      try {
        const result = await createTeam(selectedHackathonId, createTeamName);
        addToast("Team created successfully in Draft mode!", "success");
        setCreateTeamName("");
        router.refresh();
      } catch (e: any) {
        addToast(e.message || "Failed to create team", "error");
      }
    });
  };

  // Join Team by Token handler (Django parity: JoinTeamAPIView)
  const handleJoinByToken = async () => {
    if (!joinToken.trim()) return;
    clearMessages();
    setIsJoining(true);
    try {
      await joinTeamByToken(joinToken);
      addToast("Successfully joined the team!", "success");
      setJoinToken("");
      router.refresh();
    } catch (e: any) {
      addToast(e.message || "Failed to join team", "error");
    } finally {
      setIsJoining(false);
    }
  };

  // Rename Team handler (Django parity: save_team)
  const handleRenameTeam = async () => {
    if (!team || !newTeamName.trim()) return;
    clearMessages();
    startTransition(async () => {
      try {
        await renameTeam(team.id, newTeamName);
        addToast("Team renamed successfully!", "success");
        setIsRenaming(false);
        setNewTeamName("");
        router.refresh();
      } catch (e: any) {
        addToast(e.message || "Failed to rename team", "error");
      }
    });
  };

  const handleSearchUsers = (q: string) => {
    setUserQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    startTransition(async () => {
      try {
        const results = await searchUsersToRegister(q);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
      }
    });
  };

  const handleSelectUser = (user: any) => {
    setMemberName(user.name);
    setMemberEmail(user.email);
    setMemberCollege(user.college);
    setMemberDegree(user.degree);
    setMemberSemester(user.semester ? String(user.semester) : "");
    setMemberSkills(user.skills.join(", "));
    setSearchResults([]);
    setUserQuery("");
  };

  const handleAddMember = () => {
    if (!team) return;
    clearMessages();
    startTransition(async () => {
      try {
        await addTeamMember(team.id, {
          name: memberName,
          email: memberEmail,
          college: memberCollege,
          degree: memberDegree,
          semester: Number(memberSemester),
          role: memberRole,
          skills: memberSkills.split(",").map((s) => s.trim()).filter(Boolean),
        });
        addToast("Teammate added successfully!", "success");
        setShowAddModal(false);
        resetForm();
        router.refresh();
      } catch (e: any) {
        addToast(e.message || "Failed to add member", "error");
      }
    });
  };

  const handleEditClick = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setMemberName(member.name);
    setMemberEmail(member.email);
    setMemberCollege(member.college);
    const parsed = parseDegreeAndRole(member.degree);
    setMemberDegree(parsed.degree);
    setMemberRole(parsed.role);
    setMemberSemester(member.semester ? String(member.semester) : "");
    setMemberSkills(member.participant_teammember_skills.map((s) => s.participant_skill.name).join(", "));
    setShowEditModal(true);
  };

  const handleUpdateMember = () => {
    if (!team || !editingMemberId) return;
    clearMessages();
    startTransition(async () => {
      try {
        await updateTeamMember(team.id, editingMemberId, {
          name: memberName,
          email: memberEmail,
          college: memberCollege,
          degree: memberDegree,
          semester: Number(memberSemester),
          role: memberRole,
          skills: memberSkills.split(",").map((s) => s.trim()).filter(Boolean),
        });
        addToast("Teammate updated successfully!", "success");
        setShowEditModal(false);
        resetForm();
        router.refresh();
      } catch (e: any) {
        addToast(e.message || "Failed to update member", "error");
      }
    });
  };

  const handleRemoveMember = (memberId: number, memberName: string) => {
    showConfirm(
      "Remove Teammate",
      `Are you sure you want to remove ${memberName} from the team?`,
      () => {
        clearMessages();
        startTransition(async () => {
          try {
            await removeTeamMember(memberId);
            addToast(`${memberName} removed from team.`, "success");
            router.refresh();
          } catch (e: any) {
            addToast(e.message || "Failed to remove member", "error");
          }
        });
      },
      "Remove",
      "Cancel"
    );
  };

  // Registration handler matching Django's complete_registration view:
  // - Free hackathon: register directly via server action
  // - Paid hackathon: create order, redirect to checkout page (matches Django's redirect('payment-checkout', pk=payment.id))
  const handleSubmitRegistration = async () => {
    if (!team) return;
    clearMessages();

    if (team.organizer_hackathon.is_paid) {
      // Paid: create order then redirect to checkout page (same as Django)
      startTransition(async () => {
        try {
          const response = await fetch("/api/payment/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId: team.id }),
          });
          const orderData = await response.json();
          if (!response.ok) {
            throw new Error(orderData.error || "Order creation failed.");
          }
          // Redirect to dedicated checkout page (matches Django's redirect('payment-checkout', pk=payment.id))
          router.push(`/participant/checkout/${orderData.payment_id}`);
        } catch (e: any) {
          addToast(e.message || "Failed to initiate payment.", "error");
        }
      });
    } else {
      // Free: register directly (matches Django's complete_registration for non-paid hackathons)
      startTransition(async () => {
        try {
          await submitTeamRegistration(team.id);
          addToast("Team registration submitted successfully!", "success");
          router.refresh();
        } catch (e: any) {
          addToast(e.message || "Failed to submit registration", "error");
        }
      });
    }
  };

  const handleDisbandTeam = () => {
    if (!team) return;
    showConfirm(
      "Disband Team",
      "Are you sure you want to disband your team? This action is permanent and cannot be undone.",
      () => {
        clearMessages();
        startTransition(async () => {
          try {
            await deleteTeam(team.id);
            addToast("Team disbanded successfully.", "success");
            setTimeout(() => {
              router.push("/participant/dashboard");
              router.refresh();
            }, 1000);
          } catch (e: any) {
            addToast(e.message || "Failed to disband team", "error");
          }
        });
      },
      "Disband",
      "Cancel"
    );
  };


  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {!team ? (
        /* ─── Unregistered State ─── */
        <div className="grid grid-cols-1 gap-6">
          {selectedHackathon ? (
            /* Hackathon Selection & Details when explicitly registering */
            <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay">
              <h3 className="font-semibold text-ink mb-4 flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Team Registration
              </h3>

              <div className="p-5 rounded-md bg-canvas-parchment border border-black/[0.06] space-y-4">
                <div>
                  <h4 className="font-semibold text-ink text-base mb-1">{selectedHackathon.name}</h4>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {selectedHackathon.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-black/[0.06]">
                  <div className="flex items-center gap-3 p-3 rounded-md bg-canvas border border-black/[0.04]">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-muted uppercase font-semibold">Starts On</p>
                      <p className="text-xs text-ink font-semibold">
                        {new Date(selectedHackathon.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-md bg-canvas border border-black/[0.04]">
                    <div className="w-9 h-9 rounded-md bg-warning-light flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-muted uppercase font-semibold">Deadline</p>
                      <p className="text-xs text-warning font-semibold">
                        {new Date(selectedHackathon.registration_deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-md bg-canvas border border-black/[0.04]">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-muted uppercase font-semibold">Team Size</p>
                      <p className="text-xs text-ink font-semibold">
                        {selectedHackathon.min_team_size} - {selectedHackathon.max_team_size} members
                      </p>
                    </div>
                  </div>
                </div>

                {/* Create Team Form directly inside expanded details */}
                <div className="pt-4 border-t border-black/[0.06] space-y-3">
                  <h5 className="text-sm font-semibold text-ink">Create a Team for this Hackathon</h5>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={createTeamName}
                      onChange={(e) => setCreateTeamName(e.target.value)}
                      placeholder="Enter team name..."
                      className="flex-1 px-4 py-2.5 rounded-md bg-canvas border border-black/[0.08] text-ink text-sm placeholder-ink-muted/50 focus:outline-none focus:border-primary transition"
                    />
                    <button
                      onClick={handleCreateTeam}
                      disabled={isPending || !createTeamName.trim()}
                      className="px-5 py-2.5 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 apple-press-effect"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Create Team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Welcome / Empty State when visiting dashboard home without active hackathon query */
            <div className="p-10 rounded-lg bg-canvas border border-black/[0.06] text-center animate-scale-in apple-shadow-overlay">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-ink mb-2">No Active Registrations</h3>
              <p className="text-sm text-ink-muted max-w-md mx-auto mb-6">
                You are not currently registered in a team for any active hackathon. Explore upcoming events and create a new team to get started.
              </p>
              <button
                onClick={() => router.push("/participant/hackathons")}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus transition cursor-pointer apple-press-effect"
              >
                Browse Open Hackathons
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ─── Registered State / Draft Workspace ─── */
        <div className="flex flex-col gap-6">
          {/* Draft Mode Warning Banner */}
          {!team.is_registered && (
            <div className="p-4 rounded-md bg-warning-light border border-warning/15 text-warning flex items-start gap-3 animate-fade-in-up">
              <div className="w-9 h-9 rounded-md bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink mb-0.5">Registration Draft State</h4>
                <p className="text-xs text-warning leading-relaxed">
                  Your team registration details are currently saved as a draft. Click the <strong>Complete Registration</strong> button below to lock details, complete registration, and generate your check-in QR code.
                </p>
              </div>
            </div>
          )}

          {/* Team Info Card */}
          <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up stagger-1">
            <div>
              {isRenaming && isLeader && !team.is_registered ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRenameTeam()}
                    placeholder="New team name..."
                    className="px-3.5 py-2 rounded-md bg-canvas-pearl border border-black/[0.08] text-ink text-sm focus:outline-none focus:border-primary transition"
                    autoFocus
                  />
                  <button
                    onClick={handleRenameTeam}
                    disabled={isPending || !newTeamName.trim()}
                    className="px-3.5 py-2 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-focus transition cursor-pointer disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setIsRenaming(false); setNewTeamName(""); }}
                    className="px-3.5 py-2 rounded-md bg-canvas-parchment border border-black/[0.06] text-ink-muted text-xs font-medium hover:text-ink transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h3 className="text-xl font-semibold text-ink flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {team.name}
                  {isLeader && !team.is_registered && (
                    <button
                      onClick={() => { setIsRenaming(true); setNewTeamName(team.name); }}
                      className="p-1.5 rounded-md text-ink-muted hover:text-primary hover:bg-primary/5 transition cursor-pointer"
                      title="Rename team"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </h3>
              )}
              <p className="text-sm text-ink-muted mt-1">
                {team.organizer_hackathon.name} · {memberCount}/{team.organizer_hackathon.max_team_size} members
              </p>
            </div>
            <div className="flex items-center gap-2">
              {team.is_registered && (
                <a
                  href={`/participant/hackathons/${team.organizer_hackathon.id}/hub`}
                  className="px-3.5 py-1.5 rounded-pill text-xs font-medium bg-primary/10 border border-primary/15 text-primary hover:bg-primary/15 transition flex items-center gap-1.5"
                >
                  <Trophy className="w-3 h-3" />
                  Open Hub
                </a>
              )}
              <span
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-semibold border ${
                  team.is_registered
                    ? "bg-success-light border-success/15 text-success"
                    : "bg-warning-light border-warning/15 text-warning"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  team.is_registered ? "bg-success" : "bg-warning animate-pulse-dot"
                }`} />
                {team.is_registered ? "Registered" : "Draft Status"}
              </span>
            </div>
          </div>

          {/* Member List */}
          <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay space-y-4 animate-fade-in-up stagger-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-ink flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-primary" />
                Teammates
                <span className="text-[10px] font-semibold text-ink-muted ml-1">({memberCount})</span>
              </h3>
              {isLeader && !team.is_registered && memberCount < team.organizer_hackathon.max_team_size && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-pill bg-primary text-white font-normal text-xs hover:bg-primary-focus transition flex items-center gap-1.5 cursor-pointer apple-press-effect"
                >
                  <Plus className="w-3.5 h-3.5" /> Recruit Member
                </button>
              )}
            </div>

            <div className="space-y-3">
              {team.participant_teammember.map((member, idx) => {
                const isMemberLeader = idx === 0;
                const parsed = parseDegreeAndRole(member.degree);
                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-md bg-canvas-parchment/50 border border-black/[0.06] flex items-center justify-between gap-4 group hover:border-black/[0.12] transition-all duration-300 animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
                    style={{ borderLeft: `3px solid ${isMemberLeader ? '#0066cc' : parsed.role ? '#8b5cf6' : 'rgba(0,0,0,0.06)'}` }}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-lg ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-sm font-semibold shrink-0`}>
                        {getInitials(member.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-ink truncate">{member.name}</p>
                          {isMemberLeader && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-primary/10 border border-primary/15 text-primary">
                              LEADER
                            </span>
                          )}
                          {parsed.role && (
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold border ${getRoleBadgeStyles(parsed.role)}`}>
                              {parsed.role}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-ink-muted">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-ink-muted/50" /> <span className="break-all">{member.email}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-ink-muted/50" /> {member.college || "No College"} (Sem {member.semester || "?"})
                          </span>
                          <span>{parsed.degree || "No Degree"}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {getMissingFields(member) ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-danger-light text-danger border border-danger/15">
                              Incomplete — Missing: {getMissingFields(member)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-success-light text-success border border-success/15">
                              <Check className="w-3 h-3" /> Profile Complete
                            </span>
                          )}
                        </div>
                        {member.participant_teammember_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {member.participant_teammember_skills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-pill text-[10px] font-medium bg-primary/5 border border-primary/10 text-primary/70 hover:border-primary/25 hover:text-primary transition-colors"
                              >
                                {s.participant_skill.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member Controls (Draft leader only, and cannot delete self) */}
                    {isLeader && !team.is_registered && (
                      <div className="flex gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEditClick(member)}
                          className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-canvas-parchment transition cursor-pointer"
                          title="Edit member details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!isMemberLeader && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            className="p-2 rounded-md text-ink-muted hover:text-danger hover:bg-danger-light transition cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ─── Pending Invites Sent (Django parity: pending_sent_invites) ─── */}
            {isLeader && !team.is_registered && pendingInvites.length > 0 && (
              <div className="pt-4 border-t border-black/[0.06]">
                <h4 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  Pending Invites Sent
                </h4>
                <div className="space-y-2">
                  {pendingInvites.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-md border border-black/[0.06] bg-canvas-parchment/30 flex justify-between items-center gap-3 animate-fade-in-up"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate">{inv.receiverName}</p>
                        <p className="text-xs text-ink-muted truncate">{inv.receiverEmail}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-pill bg-warning-light border border-warning/15 text-warning flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-warning animate-pulse-dot" />
                          Pending
                        </span>
                        <button
                          onClick={() => handleCancelInvite(inv.id)}
                          disabled={inviteCanceling === inv.id}
                          className="px-3 py-1.5 bg-danger-light hover:bg-danger/10 border border-danger/15 text-danger text-xs font-semibold rounded-md transition cursor-pointer disabled:opacity-50"
                        >
                          {inviteCanceling === inv.id ? "..." : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Search & Invite Members (Django parity: ParticipantDiscoveryAPIView) ─── */}
            {isLeader && !team.is_registered && (
              <div className="pt-4 border-t border-black/[0.06]">
                <h4 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  Search & Invite Members
                </h4>
                <p className="text-[11px] text-ink-muted mb-3">Find registered participants who are open for recruiting and invite them to your team.</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={inviteSearchQuery}
                    onChange={(e) => setInviteSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInviteSearch()}
                    placeholder="Search by skills (e.g. Python, React, UI)..."
                    className="flex-1 bg-canvas-pearl border border-black/[0.08] rounded-md px-4 py-2.5 text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:border-primary transition"
                  />
                  <button
                    onClick={handleInviteSearch}
                    disabled={inviteSearching}
                    className="px-4 py-2.5 bg-primary hover:bg-primary-focus text-white font-normal rounded-md text-sm transition shrink-0 cursor-pointer disabled:opacity-60 flex items-center gap-1.5 apple-press-effect"
                  >
                    {inviteSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Search
                  </button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {inviteSearchResults.length > 0 ? (
                    inviteSearchResults.map((p, idx) => (
                      <div
                        key={p.userId}
                        className={`p-3.5 rounded-md border border-black/[0.06] bg-canvas-parchment/30 hover:bg-canvas-parchment/60 flex justify-between items-center gap-3 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-md ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-xs font-semibold shrink-0`}>
                            {getInitials(p.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                            <p className="text-xs text-ink-muted truncate mt-0.5">
                              {p.college || "No college"} · {p.degree || ""} · Sem {p.semester || "N/A"}
                            </p>
                            {p.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.skills.map((s, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded-pill text-[10px] bg-primary/5 text-primary/70 border border-primary/10">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendInvite(p.userId)}
                          disabled={inviteSending === p.userId}
                          className="px-3.5 py-2 bg-primary/10 hover:bg-primary hover:text-white border border-primary/15 text-primary text-xs font-semibold rounded-md transition shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 apple-press-effect"
                        >
                          {inviteSending === p.userId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Invite
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-ink-muted italic text-center py-6">
                      Enter a skill or click Search to find available participants.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ─── Submission Section (Django parity: save_draft + complete_registration) ─── */}
            {isLeader && !team.is_registered && (
              <div className="pt-4 border-t border-black/[0.06] flex flex-col gap-4">
                {isHackathonFull && (
                  <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger flex items-start gap-3 text-sm animate-fade-in-up">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-semibold mb-0.5">Registration Limit Reached</h5>
                      <p>This hackathon has reached its maximum allowed team registrations. You cannot complete registration for your team.</p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-ink-muted leading-relaxed">
                  Requires <strong>{team.organizer_hackathon.min_team_size} to {team.organizer_hackathon.max_team_size}</strong> members. Currently: <strong className="text-ink">{memberCount}</strong>.
                </p>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  {/* Save Draft & Exit */}
                  <button
                    onClick={() => {
                      setSuccess("Draft saved. You can continue later.");
                      router.push("/participant/dashboard");
                    }}
                    className="px-5 py-2.5 rounded-pill border border-black/[0.12] hover:border-black/[0.2] hover:bg-canvas-parchment text-ink-muted font-normal text-sm transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none apple-press-effect"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Save Draft & Exit
                  </button>
                  <button
                    onClick={handleDisbandTeam}
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-pill border border-danger/15 bg-danger-light text-danger font-normal text-sm hover:bg-danger/10 hover:border-danger/25 disabled:opacity-30 transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none apple-press-effect"
                  >
                    Disband Team
                  </button>
                  <button
                    onClick={handleSubmitRegistration}
                    disabled={
                      isPending ||
                      memberCount < team.organizer_hackathon.min_team_size ||
                      memberCount > team.organizer_hackathon.max_team_size ||
                      isHackathonFull
                    }
                    className="px-6 py-2.5 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer justify-center flex-1 sm:flex-none apple-press-effect"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isHackathonFull ? "Hackathon Registration Full" : "Complete Registration"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Add Teammate Modal Overlay ─── */}
      {showAddModal && team && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-tile-black/20 backdrop-blur-sm animate-backdrop-in" onClick={() => { setShowAddModal(false); resetForm(); }} />
          <div className="relative w-full max-w-lg bg-canvas border border-black/[0.08] rounded-lg p-6 apple-shadow-overlay max-h-[90vh] overflow-y-auto animate-modal-in">
            <button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-canvas-parchment transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-ink mb-1.5 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Add Team Member
            </h3>
            <p className="text-xs text-ink-muted mb-5">
              Enter the academic and profile details of your team member below.
            </p>

            <div className="space-y-4">
              {/* Teammate Form Fields */}
              <div className="grid grid-cols-1 gap-3.5">
                <FormInput label="Name" required type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="e.g. John Doe" />
                <FormInput label="Email Address" required type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="e.g. teammate@gmail.com" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormInput label="College" required type="text" value={memberCollege} onChange={(e) => setMemberCollege(e.target.value)} />
                  <FormInput label="Degree" required type="text" value={memberDegree} onChange={(e) => setMemberDegree(e.target.value)} placeholder="e.g. B.Tech" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormInput label="Semester" required type="number" value={memberSemester} onChange={(e) => setMemberSemester(e.target.value)} />
                  <FormInput label="Role in Team" type="text" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} placeholder="e.g. Frontend Developer" />
                </div>
                <FormInput label="Skills (Comma-separated)" type="text" value={memberSkills} onChange={(e) => setMemberSkills(e.target.value)} placeholder="e.g. React, Tailwind, Next.js" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-black/[0.06]">
                <button
                  onClick={handleAddMember}
                  disabled={isPending || !memberName.trim() || !memberEmail.trim() || !memberCollege.trim() || !memberDegree.trim() || !memberSemester.trim()}
                  className="flex-1 py-2.5 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-1.5 apple-press-effect"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Teammate
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-pill bg-canvas-parchment border border-black/[0.06] text-ink-muted font-normal text-sm hover:text-ink hover:bg-canvas-pearl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Teammate Modal Overlay ─── */}
      {showEditModal && team && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-tile-black/20 backdrop-blur-sm animate-backdrop-in" onClick={() => { setShowEditModal(false); resetForm(); }} />
          <div className="relative w-full max-w-lg bg-canvas border border-black/[0.08] rounded-lg p-6 apple-shadow-overlay max-h-[90vh] overflow-y-auto animate-modal-in">
            <button
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-canvas-parchment transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-ink mb-1.5 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Team Member Details
            </h3>
            <p className="text-xs text-ink-muted mb-5">
              Update participant academic details, team role, and associated skills tags.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3.5">
                <FormInput label="Name" required type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
                <div>
                  <label className="block text-[11px] text-ink-muted mb-1.5 font-semibold uppercase tracking-wider">Email Address <span className="text-ink-muted/50">(Locked)</span></label>
                  <input
                    type="email"
                    value={memberEmail}
                    disabled
                    className="w-full px-4 py-2.5 rounded-md bg-canvas-parchment border border-black/[0.06] text-ink-muted text-sm cursor-not-allowed"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormInput label="College" required type="text" value={memberCollege} onChange={(e) => setMemberCollege(e.target.value)} />
                  <FormInput label="Degree" required type="text" value={memberDegree} onChange={(e) => setMemberDegree(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormInput label="Semester" required type="number" value={memberSemester} onChange={(e) => setMemberSemester(e.target.value)} />
                  <FormInput label="Role in Team" type="text" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} placeholder="e.g. Lead Developer" />
                </div>
                <FormInput label="Skills (Comma-separated)" type="text" value={memberSkills} onChange={(e) => setMemberSkills(e.target.value)} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-black/[0.06]">
                <button
                  onClick={handleUpdateMember}
                  disabled={isPending || !memberName.trim() || !memberCollege.trim() || !memberDegree.trim() || !memberSemester.trim()}
                  className="flex-1 py-2.5 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-1.5 apple-press-effect"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-pill bg-canvas-parchment border border-black/[0.06] text-ink-muted font-normal text-sm hover:text-ink hover:bg-canvas-pearl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalOpen(false)}
      />

      <ToastContainer
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}