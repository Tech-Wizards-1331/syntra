"use client";

import React, { useState, useTransition } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { saveParticipantProfile } from "@/app/actions/profile";
import { 
  User, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Eye, 
  EyeOff, 
  Search, 
  Plus, 
  X, 
  Check, 
  Loader2, 
  AlertCircle,
  Sparkles
} from "lucide-react";

interface ProfileFormProps {
  existingProfile: {
    college: string;
    semester: number;
    degree: string;
    visibility: boolean;
    skills: string[];
  } | null;
  preseededSkills: string[];
  userEmail: string;
  userName: string;
}

function ParticipantProfileForm({
  existingProfile,
  preseededSkills,
  userEmail,
  userName,
}: ProfileFormProps) {
  const { update } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [college, setCollege] = useState(existingProfile?.college || "");
  const [degree, setDegree] = useState(existingProfile?.degree || "");
  const [semester, setSemester] = useState(existingProfile?.semester || 1);
  const [visibility, setVisibility] = useState(existingProfile?.visibility !== false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(existingProfile?.skills || []);
  const [skillSearch, setSkillSearch] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Filter skills based on search term
  const filteredSkills = preseededSkills.filter(
    (skill) =>
      skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.includes(skill)
  );

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
      setSkillSearch("");
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = skillSearch.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
      setSkillSearch("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!college.trim()) {
      setError("College/University name is required.");
      return;
    }
    if (!degree.trim()) {
      setError("Degree/Field of study is required.");
      return;
    }
    if (selectedSkills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveParticipantProfile({
          college,
          semester,
          degree,
          visibility,
          skills: selectedSkills,
        });

        if (result.success) {
          setSuccess(true);
          
          // Dynamically update next-auth session token
          await update({
            isProfileComplete: true,
            profileId: result.profileId,
          });

          // Redirect to participant dashboard after a short delay
          setTimeout(() => {
            router.push("/participant/dashboard");
            router.refresh();
          }, 1000);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong while saving your profile.");
      }
    });
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900/40 border border-slate-800 rounded-3xl p-8 shadow-glass relative backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Complete Your Participant Profile</h2>
          <p className="text-sm text-slate-400">Provide your academic and tech stack details to get started.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User static info banner */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-900 flex flex-col sm:flex-row justify-between gap-3 text-sm text-slate-400">
          <div>
            <span className="text-slate-500 font-medium block">Name</span>
            <span className="text-slate-200 font-semibold">{userName}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Email Address</span>
            <span className="text-slate-200 font-semibold">{userEmail}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-sm">
            <Check className="w-5 h-5 shrink-0" />
            <span>Profile saved successfully! Redirecting to your dashboard...</span>
          </div>
        )}

        {/* College & Degree */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="college" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" /> College / University
            </label>
            <input
              id="college"
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. Stanford University"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 text-slate-100 transition placeholder-slate-600 outline-none"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="degree" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-500" /> Degree / Major
            </label>
            <input
              id="degree"
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. B.S. Computer Science"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 text-slate-100 transition placeholder-slate-600 outline-none"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Semester & Profile Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="semester" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" /> Current Semester
            </label>
            <select
              id="semester"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 text-slate-100 transition outline-none cursor-pointer"
              disabled={isPending}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num} className="bg-slate-950 text-slate-100">
                  Semester {num}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              {visibility ? <Eye className="w-4 h-4 text-slate-500" /> : <EyeOff className="w-4 h-4 text-slate-500" />} Profile Visibility
            </label>
            <div
              onClick={() => !isPending && setVisibility(!visibility)}
              className={`flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border transition cursor-pointer selection:bg-transparent ${
                visibility ? "border-teal-500/30 hover:border-teal-500/50" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200">
                  {visibility ? "Public Profile" : "Hidden Profile"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {visibility ? "Visible to teammates & organizers" : "Only organizers can see you"}
                </span>
              </div>
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition duration-300 flex items-center ${
                  visibility ? "bg-teal-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 shadow-md transform transition duration-300 ${
                    visibility ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills Tag Selector */}
        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-slate-300">Skills & Tech Stack</label>
          
          {/* Selected badges */}
          <div className="flex flex-wrap gap-2 min-h-[46px] p-3 rounded-xl bg-slate-950/60 border border-slate-900">
            {selectedSkills.length === 0 ? (
              <span className="text-xs text-slate-600 flex items-center self-center pl-1">
                No skills selected yet. Search or add below.
              </span>
            ) : (
              selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 border border-teal-500/20 text-teal-400 animate-fadeIn"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className="p-0.5 rounded-full hover:bg-teal-500/20 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Search/input area */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search skills (e.g. React, Python) or type custom tag..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 text-slate-100 transition placeholder-slate-600 outline-none"
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
            />
          </div>

          {/* Skill search dropdown suggestion */}
          {skillSearch.trim() && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
              {filteredSkills.length === 0 ? (
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-teal-500/5 border border-teal-500/10 text-teal-400 hover:bg-teal-500/10 text-xs font-semibold transition cursor-pointer"
                >
                  <span>Add custom skill: &quot;{skillSearch.trim()}&quot;</span>
                  <Plus className="w-4 h-4" />
                </button>
              ) : (
                filteredSkills.slice(0, 8).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-transparent hover:border-slate-800 text-left text-xs text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <span>{skill}</span>
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || success}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-450 hover:to-emerald-450 text-slate-950 font-bold tracking-wide transition shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <span>Save Profile &amp; Continue</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ProfileFormWrapper(props: ProfileFormProps) {
  return (
    <SessionProvider>
      <ParticipantProfileForm {...props} />
    </SessionProvider>
  );
}
