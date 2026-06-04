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
  Sparkles 
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
    is_paid: false,
    fee_type: "team",
    fee_amount: "",
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

      const result = await createHackathon({
        ...formData,
        fee_amount: parsedFeeAmount,
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-slate-950 font-black text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Syntra</h1>
            <p className="text-[10px] text-teal-400 font-medium tracking-widest uppercase">Organizer Console</p>
          </div>
        </div>
        <Link
          href="/organizer/dashboard"
          className="p-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 transition flex items-center gap-2 text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      {/* Form Container */}
      <main className="relative flex-1 max-w-3xl mx-auto w-full px-6 py-12 z-10 flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarRange className="w-6 h-6 text-teal-400" />
            Create New Hackathon
          </h2>
          <p className="text-sm text-slate-450 mt-1">
            Configure dates, team sizes, and registration settings for your new event.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 text-sm animate-pulse-once">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold mb-0.5">Configuration Error</h5>
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
                placeholder="e.g. Syntra Hack 2026"
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
                placeholder="Briefly describe the theme, tracks, and details..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white resize-none"
              />
            </div>
          </div>

          {/* Card: Timelines */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">Timelines & Milestones</h3>

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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="registration_deadline" className="text-xs font-medium text-slate-400">
                Registration Deadline <span className="text-red-400">*</span>
              </label>
              <input
                id="registration_deadline"
                name="registration_deadline"
                type="datetime-local"
                required
                value={formData.registration_deadline}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none transition duration-300 text-sm text-white"
              />
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
            {loading ? "Creating..." : "Save and Publish"}
          </button>
        </form>
      </main>
    </div>
  );
}
