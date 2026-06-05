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
    <div className="pt-4 border-t border-slate-900 space-y-3">
      <h5 className="text-sm font-bold text-white">Create a Team for this Hackathon</h5>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={createTeamName}
          onChange={(e) => setCreateTeamName(e.target.value)}
          placeholder="Enter team name..."
          className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
        />
        <button
          onClick={handleCreateTeam}
          disabled={isPending || !createTeamName.trim()}
          className="btn-cta-shimmer px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm hover:brightness-110 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-[0_4px_15px_rgba(20,184,166,0.15)]"
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
