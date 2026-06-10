"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTeam } from "@/app/actions/teams";
import { Loader2, Plus } from "lucide-react";
import ToastContainer, { ToastMessage } from "../../ToastContainer";

export default function CreateTeamForm({ hackathonId }: { hackathonId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createTeamName, setCreateTeamName] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: "success" | "error" | "warning") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  const handleCreateTeam = () => {
    if (!createTeamName.trim()) return;
    startTransition(async () => {
      try {
        const result = await createTeam(hackathonId, createTeamName);
        if (result.success && result.teamId) {
          addToast("Team created successfully! Redirecting...", "success");
          setTimeout(() => {
            router.push(`/participant/dashboard/register/${result.teamId}`);
            router.refresh();
          }, 1000);
        } else {
          addToast("Failed to create team.", "error");
        }
      } catch (e: any) {
        addToast(e.message || "Failed to create team", "error");
      }
    });
  };

  return (
    <div className="pt-4 border-t border-black/[0.06] space-y-3">
      <h5 className="text-sm font-semibold text-ink">Create a Team for this Hackathon</h5>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={createTeamName}
          onChange={(e) => setCreateTeamName(e.target.value)}
          placeholder="Enter team name..."
          className="flex-1 px-4 py-2.5 rounded-md bg-canvas-pearl border border-black/[0.08] text-ink text-sm placeholder-ink-muted/50 focus:outline-none focus:border-primary transition"
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

      <ToastContainer
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
