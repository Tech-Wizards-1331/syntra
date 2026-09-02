"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createHackathon } from "@/app/actions/hackathons";
import { 
  ChevronLeft, 
  CalendarRange, 
  AlertCircle, 
  Save, 
  Sparkles,
  Scan
} from "lucide-react";

export default function NewHackathonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    min_team_size: 1,
    max_team_size: 4,
    max_teams: "" as string | number,
    is_paid: false,
    fee_type: "team",
    fee_amount: "",
    allow_scan: true,
    status: "draft",
  });

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

      const result = await createHackathon({
        ...formData,
        fee_amount: parsedFeeAmount,
        max_teams: parsedMaxTeams,
      });

      if (result.success) {
        router.push("/organizer/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create hackathon");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 rounded-md bg-canvas-pearl border border-black/[0.08] focus:border-primary focus:outline-none transition text-sm text-ink";

  return (
    <div className="min-h-screen bg-canvas-parchment text-ink flex flex-col font-sans relative selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-black/[0.06] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-tile-black flex items-center justify-center">
            <span className="text-white font-semibold text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Syntra</h1>
            <p className="text-[10px] text-primary font-medium tracking-widest uppercase">Organizer Console</p>
          </div>
        </div>
        <Link
          href="/organizer/dashboard"
          className="px-4 py-2 rounded-md bg-canvas border border-black/[0.08] hover:bg-canvas-pearl transition flex items-center gap-2 text-xs font-normal"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      {/* Form Container */}
      <main className="relative flex-1 max-w-3xl mx-auto w-full px-6 py-12 z-10 flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-ink tracking-tight flex items-center gap-2.5">
            <CalendarRange className="w-6 h-6 text-primary" />
            Create New Hackathon
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            Configure dates, team sizes, and registration settings for your new event.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold mb-0.5">Configuration Error</h5>
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
                placeholder="e.g. Syntra Hack 2026"
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
                placeholder="Briefly describe the theme, tracks, and details..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Card: Timelines */}
          <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-5">
            <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider">Timelines & Milestones</h3>

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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="registration_deadline" className="text-xs font-medium text-ink-muted">
                Registration Deadline <span className="text-danger">*</span>
              </label>
              <input
                id="registration_deadline"
                name="registration_deadline"
                type="datetime-local"
                required
                value={formData.registration_deadline}
                onChange={handleChange}
                className={inputClass}
              />
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

          {/* Card: Features & Modules */}
          <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-5">
            <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <Scan className="w-4 h-4" /> Feature & Module Settings
            </h3>

            <div className="flex items-start gap-3 py-1">
              <input
                id="allow_scan"
                name="allow_scan"
                type="checkbox"
                checked={formData.allow_scan}
                onChange={handleChange}
                className="w-4 h-4 mt-0.5 rounded border-black/[0.15] bg-canvas-pearl text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <div className="flex flex-col gap-0.5">
                <label htmlFor="allow_scan" className="text-sm font-semibold text-ink cursor-pointer select-none">
                  Enable Scan Feature & Participant Check-In Pass
                </label>
                <p className="text-xs text-ink-muted leading-relaxed">
                  If enabled, organizers can scan participant QR passes and participants can view their check-in pass. If disabled, the scan and check-in pass buttons will remain visible but unclickable.
                </p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-pill bg-primary text-white font-normal hover:bg-primary-focus transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none apple-press-effect"
          >
            <Save className="w-5 h-5" />
            {loading ? "Creating..." : "Save and Publish"}
          </button>
        </form>
      </main>
    </div>
  );
}
