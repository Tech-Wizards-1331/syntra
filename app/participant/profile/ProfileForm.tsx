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

          // Hard redirect ensures the browser sends the updated JWT cookie
          // (router.push does a soft navigation that may use the stale cookie)
          setTimeout(() => {
            window.location.href = "/participant/dashboard";
          }, 1000);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong while saving your profile.");
      }
    });
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">Complete Your Participant Profile</h2>
          <p className="text-xs text-ink-muted">Provide your academic and tech stack details to get started.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User static info banner */}
        <div className="p-4 rounded-md bg-canvas-parchment border border-black/[0.06] flex flex-col sm:flex-row justify-between gap-3 text-sm text-ink-muted">
          <div>
            <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider block">Name</span>
            <span className="text-ink font-semibold text-sm">{userName}</span>
          </div>
          <div>
            <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider block">Email Address</span>
            <span className="text-ink font-semibold text-sm">{userEmail}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 flex items-center gap-3 text-danger text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-md bg-success-light border border-success/15 flex items-center gap-3 text-success text-xs font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile saved successfully! Redirecting to your dashboard...</span>
          </div>
        )}

        {/* College & Degree */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="college" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> College / University
            </label>
            <input
              id="college"
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. Stanford University"
              className="py-3 px-4 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="degree" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> Degree / Major
            </label>
            <input
              id="degree"
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. B.S. Computer Science"
              className="py-3 px-4 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Semester & Profile Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="semester" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Current Semester
            </label>
            <select
              id="semester"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="py-3 px-4 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink transition cursor-pointer text-sm"
              disabled={isPending}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  Semester {num}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
              {visibility ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} Profile Visibility
            </label>
            <div
              onClick={() => !isPending && setVisibility(!visibility)}
              className={`flex items-center justify-between p-3.5 rounded-md bg-canvas-pearl border transition cursor-pointer selection:bg-transparent ${
                visibility ? "border-primary/30 hover:border-primary/50" : "border-black/[0.08] hover:border-black/[0.15]"
              }`}
            >
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-ink">
                  {visibility ? "Public Profile" : "Hidden Profile"}
                </span>
                <span className="text-[10px] text-ink-muted">
                  {visibility ? "Visible to teammates & organizers" : "Only organizers can see you"}
                </span>
              </div>
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition duration-300 flex items-center ${
                  visibility ? "bg-primary" : "bg-black/[0.12]"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition duration-300 ${
                    visibility ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills Tag Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase">Skills & Tech Stack</label>
          
          {/* Selected badges */}
          <div className="flex flex-wrap gap-2 min-h-[46px] p-3 rounded-md bg-canvas-pearl border border-black/[0.08]">
            {selectedSkills.length === 0 ? (
              <span className="text-xs text-ink-muted/60 flex items-center self-center pl-1">
                No skills selected yet. Search or add below.
              </span>
            ) : (
              selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium bg-primary/10 border border-primary/15 text-primary animate-fade-in-up"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className="p-0.5 rounded-full hover:bg-primary/20 hover:text-primary transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Search/input area */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-ink-muted/50" />
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search skills (e.g. React, Python) or type custom tag..."
              className="w-full pl-10 pr-4 py-3 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm"
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
            <div className="p-2 rounded-md bg-canvas border border-black/[0.08] max-h-48 overflow-y-auto flex flex-col gap-1 apple-shadow-overlay">
              {filteredSkills.length === 0 ? (
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-md bg-primary/5 border border-primary/10 text-primary hover:bg-primary/10 text-xs font-medium transition cursor-pointer"
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
                    className="flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-canvas-parchment border border-transparent hover:border-black/[0.04] text-left text-xs text-ink-muted hover:text-ink transition cursor-pointer"
                  >
                    <span>{skill}</span>
                    <Plus className="w-3.5 h-3.5 text-ink-muted/50" />
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
          className="w-full py-3 rounded-pill bg-primary hover:bg-primary-focus text-white font-normal text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer apple-press-effect"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <span>Save Profile & Continue</span>
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
