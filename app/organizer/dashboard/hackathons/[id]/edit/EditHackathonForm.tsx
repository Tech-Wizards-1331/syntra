"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHackathon } from "@/app/actions/hackathons";
import { 
  CalendarRange, 
  AlertCircle, 
  Save, 
  Sparkles,
  Lock
} from "lucide-react";

interface EditHackathonFormProps {
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
    room_configuration: string | null;
  };
}

function formatDateTimeLocal(dateVal: Date | string) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditHackathonForm({ hackathon }: EditHackathonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to extract max_teams from existing room_configuration
  let initialMaxTeams: string | number = "";
  if (hackathon.room_configuration) {
    try {
      const parsed = JSON.parse(hackathon.room_configuration);
      if (Array.isArray(parsed)) {
        const meta = parsed.find((el: any) => el.room_no === "METADATA" && el.type === "metadata");
        if (meta && typeof meta.max_teams === "number") {
          initialMaxTeams = meta.max_teams;
        }
      }
    } catch (e) {
      console.error("Failed to parse room_configuration for max_teams initial state", e);
    }
  }

  const [formData, setFormData] = useState({
    name: hackathon.name,
    description: hackathon.description || "",
    start_date: formatDateTimeLocal(hackathon.start_date),
    end_date: formatDateTimeLocal(hackathon.end_date),
    registration_deadline: formatDateTimeLocal(hackathon.registration_deadline),
    min_team_size: hackathon.min_team_size,
    max_team_size: hackathon.max_team_size,
    max_teams: initialMaxTeams,
    is_paid: hackathon.is_paid,
    fee_type: hackathon.fee_type || "team",
    fee_amount: hackathon.fee_amount !== null ? String(hackathon.fee_amount) : "",
    status: hackathon.status,
  });

  const isLocked = hackathon.status === "active" || hackathon.status === "completed";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNumberChange = (name: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: val === "" ? "" : Number(val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name.trim()) throw new Error("Hackathon name is required");
      if (!formData.start_date) throw new Error("Start date is required");
      if (!formData.end_date) throw new Error("End date is required");
      if (!formData.registration_deadline) throw new Error("Registration deadline is required");

      const parsedFeeAmount = formData.is_paid ? Number(formData.fee_amount) : null;
      const parsedMaxTeams = formData.max_teams !== "" ? Number(formData.max_teams) : null;

      const result = await updateHackathon(hackathon.id, {
        ...formData,
        fee_amount: parsedFeeAmount,
        max_teams: parsedMaxTeams,
      });

      if (result.success) {
        router.push(`/organizer/dashboard/hackathons/${hackathon.id}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update hackathon");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 rounded-md bg-canvas-pearl border border-black/[0.08] focus:border-primary focus:outline-none transition text-sm text-ink";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink tracking-tight flex items-center gap-2.5">
          <CalendarRange className="w-6 h-6 text-primary" />
          Edit Hackathon: {hackathon.name}
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          Update the event parameters, pricing, and phase status.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold mb-0.5">Update Failed</h5>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Card: Basic Info */}
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-5">
          <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Basic Information
          </h3>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-medium text-ink-muted">
              Hackathon Name <span className="text-danger">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-medium text-ink-muted">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Card: Status & Phase Transitions */}
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-5">
          <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Lifecycle & Phase
          </h3>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-xs font-medium text-ink-muted">
              Current Hackathon Phase
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="draft">Draft (Setup mode)</option>
              <option value="registration">Registration (Accepting teams)</option>
              <option value="active">Active (Ongoing hackathon)</option>
              <option value="completed">Completed (Evaluation & results)</option>
            </select>
            <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
              Valid transitions are: Draft ⇄ Registration → Active → Completed. You cannot go backwards once active or completed.
            </p>
          </div>
        </div>

        {/* Card: Timelines */}
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-5">
          <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider">Timelines</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="start_date" className="text-xs font-medium text-ink-muted">
                Start Date & Time <span className="text-danger">*</span>
              </label>
              <input
                id="start_date"
                name="start_date"
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="end_date" className="text-xs font-medium text-ink-muted">
                End Date & Time <span className="text-danger">*</span>
              </label>
              <input
                id="end_date"
                name="end_date"
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label htmlFor="registration_deadline" className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
              Registration Deadline <span className="text-danger">*</span>
              {isLocked && <Lock className="w-3 h-3 text-warning" />}
            </label>
            <input
              id="registration_deadline"
              name="registration_deadline"
              type="datetime-local"
              required
              disabled={isLocked}
              value={formData.registration_deadline}
              onChange={handleChange}
              className={`${inputClass} ${
                isLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            {isLocked && (
              <p className="text-[10px] text-warning mt-1">
                Locked: The registration deadline cannot be changed once the event is Active or Completed.
              </p>
            )}
          </div>
        </div>

        {/* Card: Team Sizes & Pricing */}
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-5">
          <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider">Parameters & Pricing</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="min_team_size" className="text-xs font-medium text-ink-muted">
                Min Team Size <span className="text-danger">*</span>
              </label>
              <input
                id="min_team_size"
                name="min_team_size"
                type="number"
                required
                min={1}
                value={formData.min_team_size}
                onChange={(e) => handleNumberChange("min_team_size", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="max_team_size" className="text-xs font-medium text-ink-muted">
                Max Team Size <span className="text-danger">*</span>
              </label>
              <input
                id="max_team_size"
                name="max_team_size"
                type="number"
                required
                min={1}
                value={formData.max_team_size}
                onChange={(e) => handleNumberChange("max_team_size", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="max_teams" className="text-xs font-medium text-ink-muted">
                Max Teams Limit
              </label>
              <input
                id="max_teams"
                name="max_teams"
                type="number"
                min={1}
                placeholder="e.g. 100 (Optional)"
                value={formData.max_teams}
                onChange={(e) => handleNumberChange("max_teams", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2 border-t border-black/[0.06]">
            <input
              id="is_paid"
              name="is_paid"
              type="checkbox"
              checked={formData.is_paid}
              onChange={handleChange}
              className="w-4 h-4 rounded border-black/[0.15] bg-canvas-pearl text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <label htmlFor="is_paid" className="text-sm font-normal text-ink cursor-pointer select-none">
              Require payment registration fee
            </label>
          </div>

          {formData.is_paid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fee_type" className="text-xs font-medium text-ink-muted">
                  Fee Model <span className="text-danger">*</span>
                </label>
                <select
                  id="fee_type"
                  name="fee_type"
                  value={formData.fee_type}
                  onChange={handleChange}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="team">Team Wise</option>
                  <option value="participant">Participant Wise</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="fee_amount" className="text-xs font-medium text-ink-muted">
                  Fee Amount (INR) <span className="text-danger">*</span>
                </label>
                <input
                  id="fee_amount"
                  name="fee_amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.fee_amount}
                  onChange={handleChange}
                  placeholder="e.g. 500.00"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-pill bg-primary text-white font-normal hover:bg-primary-focus transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none apple-press-effect"
        >
          <Save className="w-5 h-5" />
          {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
