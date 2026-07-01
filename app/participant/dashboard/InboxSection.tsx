"use client";

import React, { useState, useEffect } from "react";
import {
  getIncomingInvites,
  acceptTeamInvite,
  declineTeamInvite,
} from "@/app/actions/teamRequests";
import { Mail, Check, X, Loader2, EyeOff, Eye, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import CustomModal from "./CustomModal";
import ToastContainer, { ToastMessage } from "./ToastContainer";

/**
 * Inbox & Recruiting section — matches Django's dashboard "Inbox & Recruiting" section.
 *
 * Visibility is AUTO-MANAGED by team status:
 * - hasTeam = true  → profile hidden, no invites shown
 * - hasTeam = false → profile visible, incoming invites shown
 *
 * Users cannot manually toggle visibility.
 */
export default function InboxSection({ hasTeam }: { hasTeam: boolean }) {
  const router = useRouter();
  const [invites, setInvites] = useState<
    { id: number; teamName: string; hackathonName: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(!hasTeam); // only load invites if visible
  const [processingId, setProcessingId] = useState<number | null>(null);

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
    if (!hasTeam) {
      loadInvites();
    }
  }, [hasTeam]);

  const loadInvites = async () => {
    try {
      const data = await getIncomingInvites();
      setInvites(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
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
        } catch (e: unknown) {
          addToast(
            e instanceof Error ? e.message : "Failed to accept invite.",
            "error"
          );
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
        } catch (e: unknown) {
          addToast(
            e instanceof Error ? e.message : "Failed to decline invite.",
            "error"
          );
        } finally {
          setProcessingId(null);
        }
      },
      "Decline",
      "Cancel"
    );
  };

  return (
    <div>
      {/* Header with auto-managed status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          Inbox &amp; Recruiting
        </h2>

        {/* Read-only status indicator — auto-set by team membership */}
        <div className="flex items-center gap-2.5 bg-canvas-parchment border border-black/[0.06] rounded-md px-3.5 py-2">
          {hasTeam ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-ink">Profile Hidden</p>
                <p className="text-[10px] text-ink-muted">You&apos;re in a team</p>
              </div>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-ink">Profile Visible</p>
                <p className="text-[10px] text-ink-muted">Teams can find you</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {hasTeam ? (
        /* User is in a team — recruiting is off */
        <div className="rounded-md border border-dashed border-black/[0.12] bg-canvas-parchment/50 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-canvas-parchment flex items-center justify-center mx-auto mb-3 border border-black/[0.04]">
            <EyeOff className="w-5 h-5 text-ink-muted" />
          </div>
          <p className="text-sm font-medium text-ink">Recruiting is off</p>
          <p className="text-xs text-ink-muted mt-1">
            Your profile is hidden while you&apos;re in a team.
          </p>
        </div>
      ) : loading ? (
        <div className="py-8 text-center">
          <Loader2 className="w-5 h-5 text-ink-muted animate-spin mx-auto" />
        </div>
      ) : invites.length === 0 ? (
        /* Visible, no pending invites */
        <div className="rounded-md border border-dashed border-black/[0.12] bg-canvas-parchment/50 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 border border-primary/10">
            <Eye className="w-5 h-5 text-primary/50" />
          </div>
          <p className="text-sm text-ink-muted font-medium">No pending team invitations.</p>
          <p className="text-xs text-ink-muted mt-1">
            Your profile is visible — teams can find and invite you.
          </p>
        </div>
      ) : (
        /* Invite list */
        <div className="space-y-2">
          {invites.map((inv, idx) => (
            <div
              key={inv.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md border border-black/[0.06] bg-canvas-parchment/30 hover:bg-canvas-parchment/60 gap-3 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{inv.teamName}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Hackathon: {inv.hackathonName}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleAccept(inv.id, inv.teamName)}
                  disabled={processingId === inv.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-success-light hover:bg-success/10 border border-success/15 text-success text-xs font-semibold rounded-md transition-all apple-press-effect cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3 h-3" />
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(inv.id, inv.teamName)}
                  disabled={processingId === inv.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-danger-light hover:bg-danger/10 border border-danger/15 text-danger text-xs font-semibold rounded-md transition-all apple-press-effect cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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
