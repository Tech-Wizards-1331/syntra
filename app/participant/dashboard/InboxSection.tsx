"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  getIncomingInvites,
  acceptTeamInvite,
  declineTeamInvite,
  toggleRecruitingVisibility,
} from "@/app/actions/teamRequests";
import { Mail, Check, X, Loader2, EyeOff, Eye, Users, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import CustomModal from "./CustomModal";
import ToastContainer, { ToastMessage } from "./ToastContainer";

/**
 * Inbox & Recruiting section — matches Django's dashboard "Inbox & Recruiting" section.
 * Shows:
 * - Recruiting Profile visibility toggle
 * - Incoming team invites with Accept/Decline buttons
 */
export default function InboxSection({
  initialVisibility,
  hasTeam,
}: {
  initialVisibility: boolean;
  hasTeam: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState(initialVisibility);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [invites, setInvites] = useState<
    { id: number; teamName: string; hackathonName: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // UX Enhancements States
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
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

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const data = await getIncomingInvites();
      setInvites(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    const newVis = !visible;
    setTogglingVisibility(true);
    try {
      await toggleRecruitingVisibility(newVis);
      setVisible(newVis);
      if (!newVis) {
        setInvites([]); // Turning off clears pending invites (Django parity)
      }
    } catch { /* ignore */ } finally {
      setTogglingVisibility(false);
    }
  };

  const handleAccept = async (id: number, teamName: string) => {
    showConfirm(
      "Accept Invitation",
      `Are you sure you want to join team "${teamName}"?`,
      async () => {
        setProcessingId(id);
        try {
          await acceptTeamInvite(id);
          addToast(`Successfully joined team "${teamName}"!`, "success");
          setInvites((prev) => prev.filter((inv) => inv.id !== id));
          setTimeout(() => {
            router.refresh();
          }, 1000);
        } catch (e: any) {
          addToast(e.message || "Failed to accept invite.", "error");
        } finally {
          setProcessingId(null);
        }
      },
      "Join Team",
      "Cancel"
    );
  };

  const handleDecline = async (id: number, teamName: string) => {
    showConfirm(
      "Decline Invitation",
      `Are you sure you want to decline the invitation from team "${teamName}"?`,
      async () => {
        setProcessingId(id);
        try {
          await declineTeamInvite(id);
          addToast(`Declined invitation from team "${teamName}".`, "success");
          setInvites((prev) => prev.filter((inv) => inv.id !== id));
        } catch (e: any) {
          addToast(e.message || "Failed to decline invite.", "error");
        } finally {
          setProcessingId(null);
        }
      },
      "Decline",
      "Cancel"
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header with toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-teal-400" />
          Inbox & Recruiting
        </h2>
        <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800/40 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-[11px] font-bold text-white">Recruiting Profile</p>
            <p className="text-[10px] text-slate-400">
              {hasTeam ? "Disabled (Already in a team)" : "Let teams find you"}
            </p>
          </div>
          <button
            onClick={handleToggleVisibility}
            disabled={hasTeam || togglingVisibility}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              visible ? "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]" : "bg-slate-700"
            }`}
            aria-pressed={visible}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                visible ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      {!visible ? (
        <div className="rounded-xl border border-dashed border-slate-800/60 bg-slate-950/30 py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800/40 flex items-center justify-center mx-auto mb-3">
            <EyeOff className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-300">Your profile is hidden</p>
          <p className="text-xs text-slate-500 mt-1">
            Turn on visibility to allow Team Leaders to find you and send invitations.
          </p>
        </div>
      ) : loading ? (
        <div className="py-8 text-center">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
        </div>
      ) : invites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800/60 bg-slate-950/30 py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-teal-500/50" />
          </div>
          <p className="text-sm text-slate-400 font-medium">No pending team invitations.</p>
          <p className="text-xs text-slate-500 mt-1">Your profile is visible — teams can find and invite you.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invites.map((inv, idx) => (
            <div
              key={inv.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-800/40 bg-slate-950/30 hover:bg-slate-950/50 gap-3 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{inv.teamName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Hackathon: {inv.hackathonName}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleAccept(inv.id, inv.teamName)}
                  disabled={processingId === inv.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-xs font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3 h-3" />
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(inv.id, inv.teamName)}
                  disabled={processingId === inv.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-1.5"
                >
                  <X className="w-3 h-3" />
                  Decline
                </button>
              </div>
            </div>
          ))}
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
