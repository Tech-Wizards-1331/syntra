"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCloudinarySignature } from "@/app/actions/hackathons";
import {
  createProblemStatement,
  deleteProblemStatement,
  updateProblemStatement,
} from "@/app/actions/problemstatements";
import {
  createScanCategory,
  toggleScanCategoryStatus,
  deleteScanCategory,
} from "@/app/actions/scancategories";
import {
  Calendar,
  Users,
  CreditCard,
  Trash2,
  Plus,
  ExternalLink,
  FileText,
  Check,
  Loader2,
  X,
  Eye,
  EyeOff,
  Armchair,
  Edit,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface ProblemStatement {
  id: number;
  title: string;
  description: string;
  pdf_file: string | null;
  max_teams_allowed: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ScanCategory {
  id: number;
  name: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
}

interface HackathonDetailPageClientProps {
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
    organizer_problemstatement: ProblemStatement[];
    organizer_scancategory: ScanCategory[];
  };
}

export default function HackathonDetailPageClient({
  hackathon,
}: HackathonDetailPageClientProps) {
  const router = useRouter();

  // General Loading & Error states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Scan Category states
  const [newCategoryName, setNewCategoryName] = useState("");

  // Problem Statement Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const [psForm, setPsForm] = useState({
    title: "",
    description: "",
    max_teams_allowed: 5,
    is_active: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Status Badge Styling Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            Draft
          </span>
        );
      case "registration":
        return (
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Registration
          </span>
        );
      case "active":
        return (
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            Active
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-800 border border-slate-700 text-slate-400">
            {status}
          </span>
        );
    }
  };

  // PDF Validation and Upload helper
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setModalError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Client-side validation: Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setModalError("File size exceeds 10MB limit.");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    // Client-side verification: Magic Bytes
    try {
      const headerBytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      const header = Array.from(headerBytes)
        .map((b) => String.fromCharCode(b))
        .join("");

      if (header !== "%PDF") {
        setModalError("Invalid PDF header. Please select a valid PDF file.");
        setSelectedFile(null);
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
    } catch (err) {
      setModalError("Failed to verify the PDF file format.");
      setSelectedFile(null);
      e.target.value = "";
    }
  };

  // Upload to Cloudinary using Signed direct upload
  const uploadToCloudinary = (
    file: File,
    sig: { signature: string; timestamp: number; apiKey?: string; cloudName: string },
    onProgress: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/raw/upload`;

      xhr.open("POST", url, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.secure_url) {
              resolve(res.secure_url);
            } else {
              reject(new Error("Cloudinary response did not contain secure_url"));
            }
          } catch (err) {
            reject(new Error("Failed to parse Cloudinary response"));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(
              new Error(
                errRes.error?.message || `Upload failed with status ${xhr.status}`
              )
            );
          } catch (err) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during Cloudinary upload"));
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey || "");
      formData.append("timestamp", sig.timestamp.toString());
      formData.append("signature", sig.signature);
      formData.append("folder", "syntra_problem_statements");
      formData.append("format", "pdf");

      xhr.send(formData);
    });
  };

  // Submit new Problem Statement
  const handleAddProblemStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!psForm.title.trim() || !psForm.description.trim()) {
      setModalError("Title and description are required.");
      return;
    }

    setModalLoading(true);
    setModalError(null);
    setUploadProgress(0);
    setUploadStatus("Initializing upload parameters...");

    try {
      let pdfUrl: string | undefined = undefined;

      if (selectedFile) {
        setUploadStatus("Requesting upload signature...");
        // 1. Fetch Cloudinary signature from server action
        const sig = await getCloudinarySignature();

        setUploadStatus("Uploading PDF directly to Cloudinary...");
        // 2. Upload file directly to Cloudinary
        pdfUrl = await uploadToCloudinary(selectedFile, sig, (progress) => {
          setUploadProgress(progress);
        });
        setUploadStatus("PDF uploaded successfully! Saving statement...");
      }

      // 3. Create problem statement via server action
      await createProblemStatement(hackathon.id, {
        title: psForm.title,
        description: psForm.description,
        pdf_url: pdfUrl,
        max_teams_allowed: Number(psForm.max_teams_allowed),
        is_active: psForm.is_active,
      });

      // Reset form states
      setPsForm({
        title: "",
        description: "",
        max_teams_allowed: 5,
        is_active: true,
      });
      setSelectedFile(null);
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setModalError(err.message || "Failed to create problem statement.");
    } finally {
      setModalLoading(false);
      setUploadProgress(null);
      setUploadStatus("");
    }
  };

  // Delete Problem Statement
  const handleDeleteProblemStatement = async (id: number) => {
    if (!confirm("Are you sure you want to delete this problem statement?")) return;
    setActionLoading(`delete-ps-${id}`);
    setErrorMsg(null);
    try {
      await deleteProblemStatement(id);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete problem statement.");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Problem Statement active status
  const handleToggleProblemStatement = async (ps: ProblemStatement) => {
    setActionLoading(`toggle-ps-${ps.id}`);
    setErrorMsg(null);
    try {
      await updateProblemStatement(ps.id, {
        title: ps.title,
        description: ps.description,
        max_teams_allowed: ps.max_teams_allowed,
        pdf_url: ps.pdf_file,
        is_active: !ps.is_active,
      });
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to toggle problem statement status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Create Scan Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setActionLoading("create-category");
    setErrorMsg(null);
    try {
      await createScanCategory(hackathon.id, newCategoryName);
      setNewCategoryName("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create scan category.");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Scan Category active status
  const handleToggleCategory = async (id: number, currentStatus: boolean) => {
    setActionLoading(`toggle-cat-${id}`);
    setErrorMsg(null);
    try {
      await toggleScanCategoryStatus(id, !currentStatus);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update scan category status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Scan Category
  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scan category? All associated scan records will be deleted.")) return;
    setActionLoading(`delete-cat-${id}`);
    setErrorMsg(null);
    try {
      await deleteScanCategory(id);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete scan category.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column (Metadata + Problem Statements) */}
      <div className="flex-1 flex flex-col gap-8">
        
        {/* Error banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold mb-0.5">Operation Failed</h5>
              <p>{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hackathon Info Card */}
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-white tracking-tight">{hackathon.name}</h2>
                {getStatusBadge(hackathon.status)}
              </div>
              <p className="text-xs text-slate-450 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                Created on {new Date(hackathon.start_date).toLocaleDateString()}
              </p>
            </div>
            <Link
              href={`/organizer/dashboard/hackathons/${hackathon.id}/edit`}
              className="p-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-350 hover:text-white transition flex items-center gap-2 text-xs font-semibold self-start"
            >
              <Edit className="w-4 h-4" />
              Edit details
            </Link>
          </div>

          {hackathon.description && (
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-900/50">
              {hackathon.description}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-900">
            {/* Timelines */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Timeline
              </h4>
              <div className="flex flex-col gap-1 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Start Date</span>
                  <span className="text-slate-200 font-medium">{new Date(hackathon.start_date).toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-500 block mb-0.5">End Date</span>
                  <span className="text-slate-200 font-medium">{new Date(hackathon.end_date).toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-500 block mb-0.5">Reg. Deadline</span>
                  <span className="text-slate-200 font-medium">{new Date(hackathon.registration_deadline).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Team Size */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Team Limits
              </h4>
              <div className="flex flex-col gap-2 text-xs text-slate-200 font-medium">
                <div>
                  <span className="text-slate-500 block mb-0.5">Min Team Size</span>
                  <span>{hackathon.min_team_size} {hackathon.min_team_size === 1 ? "member" : "members"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Max Team Size</span>
                  <span>{hackathon.max_team_size} {hackathon.max_team_size === 1 ? "member" : "members"}</span>
                </div>
              </div>
            </div>

            {/* Pricing Model */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Pricing
              </h4>
              <div className="flex flex-col gap-2 text-xs text-slate-200 font-medium">
                <div>
                  <span className="text-slate-500 block mb-0.5">Type</span>
                  <span className={hackathon.is_paid ? "text-yellow-400" : "text-emerald-400"}>
                    {hackathon.is_paid ? "Paid Entry" : "Free Entry"}
                  </span>
                </div>
                {hackathon.is_paid && (
                  <>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Fee Model</span>
                      <span className="capitalize">{hackathon.fee_type} Wise</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Amount</span>
                      <span>INR {hackathon.fee_amount?.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Problem Statements Panel */}
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              Problem Statements
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 px-3.5 rounded-xl bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 active:scale-95 transition flex items-center gap-1.5 text-xs shadow-md shadow-teal-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Problem
            </button>
          </div>

          {hackathon.organizer_problemstatement.length === 0 ? (
            <div className="p-10 rounded-xl border border-slate-900 border-dashed text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900 flex items-center justify-center text-slate-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-300 font-semibold text-sm">No problem statements created</p>
                <p className="text-xs text-slate-550 max-w-xs mt-1 leading-relaxed">
                  Provide problem statements for participants to choose when signing up for the hackathon.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {hackathon.organizer_problemstatement.map((ps) => (
                <div
                  key={ps.id}
                  className={`p-5 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    ps.is_active
                      ? "bg-slate-950/40 border-slate-900 hover:border-slate-800"
                      : "bg-slate-950/20 border-slate-900/50 opacity-60"
                  }`}
                >
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="font-bold text-white text-base">{ps.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-semibold">
                        Limit: {ps.max_teams_allowed} teams
                      </span>
                      {!ps.is_active && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {ps.description}
                    </p>
                    {ps.pdf_file && (
                      <a
                        href={ps.pdf_file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-350 hover:underline mt-2 self-start font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View PDF Attachment
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleProblemStatement(ps)}
                      disabled={actionLoading !== null}
                      title={ps.is_active ? "Mark as Inactive" : "Mark as Active"}
                      className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-850 text-slate-450 hover:text-teal-400 hover:bg-slate-900 transition disabled:opacity-40 cursor-pointer"
                    >
                      {actionLoading === `toggle-ps-${ps.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                      ) : ps.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteProblemStatement(ps.id)}
                      disabled={actionLoading !== null}
                      title="Delete problem statement"
                      className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-850 text-slate-450 hover:text-red-400 hover:bg-slate-900 transition disabled:opacity-40 cursor-pointer"
                    >
                      {actionLoading === `delete-ps-${ps.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column (Scan Categories + Seating Quicklink) */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-8">
        
        {/* Seating Management Card */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Physical Seating</h3>
            <p className="text-xs text-slate-450 mt-1 leading-relaxed">
              Allocate table coordinates to participating teams using a seating algorithm.
            </p>
          </div>
          <Link
            href={`/organizer/dashboard/seating?hackathonId=${hackathon.id}`}
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-teal-400 hover:text-teal-350 transition text-xs font-semibold text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            Seating Console
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Scan Categories Panel */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col gap-5">
          <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
            Scan Categories
          </h3>

          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. Lunch Day 1"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 p-2.5 rounded-lg bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none text-xs text-white"
            />
            <button
              type="submit"
              disabled={actionLoading !== null}
              className="p-2.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
            >
              {actionLoading === "create-category" ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </form>

          {hackathon.organizer_scancategory.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">
              No scan categories defined.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {hackathon.organizer_scancategory.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-3 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-between gap-3 text-xs ${
                    cat.is_active ? "" : "opacity-50"
                  }`}
                >
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="font-semibold text-white leading-normal break-all">
                      {cat.name}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      Order: {cat.display_order}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                      disabled={actionLoading !== null}
                      title={cat.is_active ? "Disable QR scan" : "Enable QR scan"}
                      className={`p-1.5 rounded border transition cursor-pointer ${
                        cat.is_active
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-800 bg-slate-900 text-slate-500"
                      }`}
                    >
                      {actionLoading === `toggle-cat-${cat.id}` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      disabled={actionLoading !== null}
                      title="Delete category"
                      className="p-1.5 rounded border border-slate-800 bg-slate-900 text-slate-450 hover:text-red-400 transition cursor-pointer"
                    >
                      {actionLoading === `delete-cat-${cat.id}` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Problem Statement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-glass overflow-hidden flex flex-col relative animate-scale-up">
            
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                Add Problem Statement
              </h3>
              <button
                onClick={() => {
                  if (!modalLoading) {
                    setIsModalOpen(false);
                    setModalError(null);
                    setSelectedFile(null);
                  }
                }}
                disabled={modalLoading}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-bold">Error</h6>
                  <p className="mt-0.5">{modalError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddProblemStatement} className="p-6 flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-xs font-semibold text-slate-400">
                  Statement Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  placeholder="e.g. Realtime IoT Dashboard"
                  value={psForm.title}
                  onChange={(e) => setPsForm({ ...psForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none text-xs text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-xs font-semibold text-slate-400">
                  Detailed Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  placeholder="Describe the problem, objectives, and evaluation guidelines..."
                  value={psForm.description}
                  onChange={(e) => setPsForm({ ...psForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none text-xs text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="max_teams" className="text-xs font-semibold text-slate-400">
                    Max Teams Allowed <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="max_teams"
                    type="number"
                    required
                    min={1}
                    value={psForm.max_teams_allowed}
                    onChange={(e) =>
                      setPsForm({
                        ...psForm,
                        max_teams_allowed: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5 justify-end pb-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      id="ps_active"
                      type="checkbox"
                      checked={psForm.is_active}
                      onChange={(e) =>
                        setPsForm({ ...psForm, is_active: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-850 bg-slate-950 text-teal-500 focus:ring-teal-500 accent-teal-500 cursor-pointer"
                    />
                    <label
                      htmlFor="ps_active"
                      className="text-xs font-medium text-slate-350 cursor-pointer select-none"
                    >
                      Enable statement immediately
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-850/60">
                <label className="text-xs font-semibold text-slate-400">
                  PDF Attachment (Optional, Max 10MB)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-800 file:bg-slate-950 file:text-slate-300 file:hover:bg-slate-900 file:cursor-pointer file:font-semibold"
                />
                {selectedFile && (
                  <p className="text-[10px] text-emerald-400 mt-1">
                    ✓ Validated: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Uploading progress states */}
              {uploadProgress !== null && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-teal-400 font-semibold">{uploadStatus}</span>
                    <span className="text-slate-400 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-900">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full mt-4 p-3 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    Saving statement...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Statement
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
