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

  const [formData, setFormData] = useState({
    name: hackathon.name,
    description: hackathon.description || "",
    start_date: formatDateTimeLocal(hackathon.start_date),
    end_date: formatDateTimeLocal(hackathon.end_date),
    registration_deadline: formatDateTimeLocal(hackathon.registration_deadline),
    min_team_size: hackathon.min_team_size,
    max_team_size: hackathon.max_team_size,
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

      const result = await updateHackathon(hackathon.id, {
        ...formData,
        fee_amount: parsedFeeAmount,
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <CalendarRange className="w-6 h-6 text-teal-400" />
          Edit Hackathon: {hackathon.name}
        </h2>
        <p className="text-sm text-slate-450 mt-1">
          Update the event parameters, pricing, and phase status.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold mb-0.5">Update Failed</h5>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Card: Basic Info */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col gap-5">
          <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Basic Information
          </h3>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-medium text-slate-400">
              Hackathon Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-medium text-slate-400">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white resize-none"
            />
          </div>
        </div>

        {/* Card: Status & Phase Transitions */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col gap-5">
          <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
            Lifecycle & Phase
          </h3>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-xs font-medium text-slate-400">
              Current Hackathon Phase
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white cursor-pointer"
            >
              <option value="draft">Draft (Setup mode)</option>
              <option value="registration">Registration (Accepting teams)</option>
              <option value="active">Active (Ongoing hackathon)</option>
              <option value="completed">Completed (Evaluation & results)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Valid transitions are: Draft ⇄ Registration → Active → Completed. You cannot go backwards once active or completed.
            </p>
          </div>
        </div>

        {/* Card: Timelines */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col gap-5">
          <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">Timelines</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="start_date" className="text-xs font-medium text-slate-400">
                Start Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                id="start_date"
                name="start_date"
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="end_date" className="text-xs font-medium text-slate-400">
                End Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                id="end_date"
                name="end_date"
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label htmlFor="registration_deadline" className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              Registration Deadline <span className="text-red-400">*</span>
              {isLocked && <Lock className="w-3 h-3 text-yellow-500" />}
            </label>
            <input
              id="registration_deadline"
              name="registration_deadline"
              type="datetime-local"
              required
              disabled={isLocked}
              value={formData.registration_deadline}
              onChange={handleChange}
              className={`w-full p-3 rounded-xl bg-slate-950 border focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white ${
                isLocked ? "border-slate-850/40 text-slate-500 cursor-not-allowed bg-slate-950/20" : "border-slate-850"
              }`}
            />
            {isLocked && (
              <p className="text-[10px] text-yellow-500/80 mt-1">
                Locked: The registration deadline cannot be changed once the event is Active or Completed.
              </p>
            )}
          </div>
        </div>

        {/* Card: Team Sizes & Pricing */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col gap-5">
          <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">Parameters & Pricing</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="min_team_size" className="text-xs font-medium text-slate-400">
                Min Team Size <span className="text-red-400">*</span>
              </label>
              <input
                id="min_team_size"
                name="min_team_size"
                type="number"
                required
                min={1}
                value={formData.min_team_size}
                onChange={(e) => handleNumberChange("min_team_size", e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="max_team_size" className="text-xs font-medium text-slate-400">
                Max Team Size <span className="text-red-400">*</span>
              </label>
              <input
                id="max_team_size"
                name="max_team_size"
                type="number"
                required
                min={1}
                value={formData.max_team_size}
                onChange={(e) => handleNumberChange("max_team_size", e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2 border-t border-slate-850">
            <input
              id="is_paid"
              name="is_paid"
              type="checkbox"
              checked={formData.is_paid}
              onChange={handleChange}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-teal-500 accent-teal-500 cursor-pointer"
            />
            <label htmlFor="is_paid" className="text-sm font-medium text-slate-350 cursor-pointer select-none">
              Require payment registration fee
            </label>
          </div>

          {formData.is_paid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fee_type" className="text-xs font-medium text-slate-400">
                  Fee Model <span className="text-red-400">*</span>
                </label>
                <select
                  id="fee_type"
                  name="fee_type"
                  value={formData.fee_type}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white cursor-pointer"
                >
                  <option value="team">Team Wise</option>
                  <option value="participant">Participant Wise</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="fee_amount" className="text-xs font-medium text-slate-400">
                  Fee Amount (INR) <span className="text-red-400">*</span>
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
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full p-4 rounded-2xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-teal-500/10"
        >
          <Save className="w-5 h-5" />
          {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
