"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { bulkImportTeams, BulkTeamInput, BulkImportResult } from "@/app/actions/bulkImportTeams";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  hackathonName: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  onImportComplete?: () => void;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  hackathonId,
  hackathonName,
  minTeamSize = 1,
  maxTeamSize = 4,
  onImportComplete,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedTeams, setParsedTeams] = useState<BulkTeamInput[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [defaultPassword, setDefaultPassword] = useState("Syntra@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // ─── Generate & Download Sample Template ───────────────────────────
  const handleDownloadTemplate = () => {
    const sampleHeaders = [
      "Sr No",
      "Team Name",
      "Category (Software/Hardware)",
      "Team Leader Name",
      "Team Leader Enrollment Number",
      "Team Leader Semester",
      "Team Leader Email",
      "Team Leader Gender",
      "Member 2 Name",
      "Member 2 Enrollment Number",
      "Member 2 Semester",
      "Member 2 Gender",
      "Member 3 Name",
      "Member 3 Enrollment Number",
      "Member 3 Semester",
      "Member 3 Gender",
      "Member 4 Name",
      "Member 4 Enrollment Number",
      "Member 4 Semester",
      "Member 4 Gender",
    ];

    const sampleRows = [
      [
        1,
        "Code Crafters",
        "Software",
        "Aarav Patel",
        "210200107001",
        6,
        "aarav.patel@example.com",
        "Male",
        "Bhavya Shah",
        "210200107002",
        6,
        "Male",
        "Chirag Soni",
        "210200107003",
        6,
        "Male",
        "Diya Mehta",
        "210200107004",
        6,
        "Female",
      ],
      [
        2,
        "Neural Ninjas",
        "Hardware",
        "Isha Sharma",
        "220200108001",
        4,
        "isha.sharma@example.com",
        "Female",
        "Karan Verma",
        "220200108002",
        4,
        "Male",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]);

    // Auto-fit column widths
    const colWidths = sampleHeaders.map((header) => ({
      wch: Math.max(header.length + 4, 18),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teams");

    XLSX.writeFile(wb, `${hackathonName.replace(/\s+/g, "_")}_Team_Template.xlsx`);
  };

  // ─── Parse Uploaded Excel/CSV File ─────────────────────────────────
  const parseFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setParseErrors([]);
    setImportResult(null);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setParseErrors(["The uploaded spreadsheet has no sheets."]);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

      if (rawJson.length === 0) {
        setParseErrors(["The spreadsheet is empty. Please add rows to import."]);
        return;
      }

      const teams: BulkTeamInput[] = [];
      const errors: string[] = [];

      rawJson.forEach((row, idx) => {
        const rowNum = idx + 2; // +1 for 0-index, +1 for header row

        // Clean & match keys loosely (ignores punctuation, case, whitespace)
        const normalize = (str: string) =>
          str.toLowerCase().replace(/[^a-z0-9]/g, "");

        const getField = (possibleKeys: string[], exactOnly: boolean = false) => {
          const normKeys = possibleKeys.map(normalize);
          for (const rowKey of Object.keys(row)) {
            const normRowKey = normalize(rowKey);
            if (normKeys.some((nk) => normRowKey === nk)) {
              return String(row[rowKey]).trim();
            }
          }
          if (exactOnly) return "";
          for (const rowKey of Object.keys(row)) {
            const normRowKey = normalize(rowKey);
            if (normKeys.some((nk) => normRowKey === nk || normRowKey.includes(nk))) {
              return String(row[rowKey]).trim();
            }
          }
          return "";
        };

        const teamName = getField([
          "teamname",
          "team",
          "team_name",
          "nameofteam",
          "projectteam",
        ]);
        const category = getField([
          "category",
          "categorysoftwarehardware",
          "categorysoftwearhardwear",
          "domain",
          "track",
        ]);
        const leaderName = getField([
          "teamleadername",
          "leadername",
          "leader",
          "teamleader",
          "nameofleader",
        ]);
        const leaderEnrollment = getField([
          "teamleaderenrollmentnumber",
          "teamleaderenrollment",
          "leaderenrollmentnumber",
          "leaderenrollment",
          "enrollmentnumber",
          "enrollment",
          "leaderenroll",
        ]);
        const leaderEmail = getField([
          "teamleaderemail",
          "leaderemail",
          "email",
          "emailid",
          "teamleaderemailaddress",
        ]).toLowerCase();
        const rawLeaderSem = getField([
          "teamleadersemester",
          "leadersemester",
          "teamleadersem",
          "leadersem",
          "semester",
          "semister",
          "sem",
        ]);
        const leaderGender = getField([
          "teamleadergender",
          "leadergender",
          "gender",
        ]);
        const college =
          getField(["college", "collegename", "university", "institute"], true) || "";

        if (!teamName && !leaderName && !leaderEmail) {
          // Empty row, ignore
          return;
        }

        if (!teamName) {
          errors.push(`Row ${rowNum}: Team Name is required.`);
          return;
        }
        if (!leaderName) {
          errors.push(`Row ${rowNum} (${teamName}): Leader Name is required.`);
          return;
        }
        if (!leaderEmail || !leaderEmail.includes("@")) {
          errors.push(
            `Row ${rowNum} (${teamName}): Valid Leader Email is required.`
          );
          return;
        }

        const leaderSemester = rawLeaderSem
          ? parseInt(rawLeaderSem.replace(/[^0-9]/g, ""), 10) || 1
          : 1;

        const leaderDegree =
          getField(["degree", "branch", "department", "stream", "leaderdegree"], true) || "";

        // Parse additional members (Member 2, Member 3, Member 4, Other Members...)
        const members: BulkTeamInput["members"] = [];

        // Check slots 2 to 10
        for (let m = 2; m <= 10; m++) {
          const mName = getField([
            `member${m}name`,
            `othermember${m}name`,
            `teammember${m}name`,
            `member${m}`,
            `othermember${m}`,
            m === 2 ? "othermembername" : `othermembername${m}`,
            m === 2 ? "membername" : `membername${m}`,
          ]);

          const mEnroll = getField([
            `member${m}enrollmentnumber`,
            `member${m}enrollment`,
            `othermember${m}enrollment`,
            `othermember${m}enrollmentnumber`,
            m === 2 ? "enrollmentnumber" : `enrollmentnumber${m}`,
            m === 2 ? "enrollment" : `enrollment${m}`,
          ]);

          const mSemRaw = getField([
            `member${m}semester`,
            `member${m}semister`,
            `member${m}sem`,
            `othermember${m}semester`,
            `othermember${m}semister`,
            m === 2 ? "semister" : `semister${m}`,
            m === 2 ? "semester" : `semester${m}`,
          ]);

          const mGender = getField([
            `member${m}gender`,
            `othermember${m}gender`,
            m === 2 ? "gender" : `gender${m}`,
          ]);

          const mEmailRaw = getField([
            `member${m}email`,
            `othermember${m}email`,
            `member${m}emailid`,
          ]).toLowerCase();

          if (mName && mName.trim() !== "") {
            const cleanMName = mName.trim();
            const mSem = mSemRaw
              ? parseInt(mSemRaw.replace(/[^0-9]/g, ""), 10) || leaderSemester
              : leaderSemester;

            // If member email is provided use it, otherwise use enrollment number or empty
            const memberEmail =
              mEmailRaw && mEmailRaw.includes("@")
                ? mEmailRaw.trim()
                : mEnroll
                ? mEnroll.trim()
                : "";

            const mDegree =
              getField([`member${m}degree`, `othermember${m}degree`, "degree", "branch"], true) || "";

            members.push({
              name: cleanMName,
              email: memberEmail,
              college: college,
              semester: mSem,
              degree: mDegree,
            });
          }
        }

        teams.push({
          teamName: teamName,
          leaderName: leaderName,
          leaderEmail: leaderEmail,
          college: college,
          semester: leaderSemester,
          degree: leaderDegree,
          members,
        });
      });

      setParsedTeams(teams);
      setParseErrors(errors);
    } catch (err: any) {
      console.error("Excel parse error:", err);
      setParseErrors([
        `Failed to parse file: ${err.message || "Invalid Excel format."}`,
      ]);
    }
  };

  // ─── Drag & Drop Handlers ──────────────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFile(e.target.files[0]);
    }
  };

  // ─── Submit Bulk Import ────────────────────────────────────────────
  const handleStartImport = async () => {
    if (parsedTeams.length === 0) return;
    setIsProcessing(true);

    try {
      const result = await bulkImportTeams(hackathonId, parsedTeams, defaultPassword);
      setImportResult(result);
      if (result.success && onImportComplete) {
        onImportComplete();
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        totalTeams: parsedTeams.length,
        importedCount: 0,
        skippedCount: parsedTeams.length,
        errors: [err.message || "An unexpected error occurred during import."],
        importedTeams: [],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedTeams([]);
    setParseErrors([]);
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-canvas w-full max-w-3xl rounded-2xl border border-black/[0.08] apple-shadow-modal flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between bg-canvas-parchment/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">Bulk Register Teams via Excel</h3>
              <p className="text-xs text-ink-muted">
                Import teams, auto-create participant accounts, and dispatch login credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-black/[0.04] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Result View */}
          {importResult ? (
            <div className="flex flex-col gap-4">
              <div
                className={`p-5 rounded-xl border flex items-start gap-3.5 ${
                  importResult.importedCount > 0
                    ? "bg-success-light/60 border-success/20 text-success-dark"
                    : "bg-danger-light/60 border-danger/20 text-danger"
                }`}
              >
                {importResult.importedCount > 0 ? (
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-success" />
                ) : (
                  <AlertCircle className="w-6 h-6 shrink-0 text-danger" />
                )}
                <div className="flex flex-col gap-1">
                  <h4 className="font-semibold text-sm">
                    {importResult.importedCount > 0
                      ? `Successfully imported ${importResult.importedCount} team(s)!`
                      : "No teams were imported"}
                  </h4>
                  <p className="text-xs opacity-90">
                    {importResult.importedCount > 0 &&
                      `Automated welcome emails with temporary credentials (${defaultPassword}) have been sent to team leaders.`}
                    {importResult.skippedCount > 0 &&
                      ` (${importResult.skippedCount} team(s) skipped due to errors or duplicates).`}
                  </p>
                </div>
              </div>

              {/* Error list if any */}
              {importResult.errors.length > 0 && (
                <div className="p-4 rounded-xl bg-canvas-parchment border border-black/[0.06] flex flex-col gap-2">
                  <span className="text-xs font-semibold text-danger flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Issues / Skipped Rows:
                  </span>
                  <div className="max-h-40 overflow-y-auto flex flex-col gap-1 text-[11px] text-ink-muted font-mono">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="p-1.5 rounded bg-canvas border border-black/[0.04]">
                        • {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Imported teams list */}
              {importResult.importedTeams.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink">Imported Teams</span>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-black/[0.06] divide-y divide-black/[0.04]">
                    {importResult.importedTeams.map((t, i) => (
                      <div key={i} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-ink">{t.teamName}</span>
                          <span className="text-ink-muted ml-2">({t.leaderEmail})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                          {t.membersCount} member{t.membersCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Top Action Bar: Template Download & Notice */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-ink">
                    Need the right Excel format? Download our pre-configured template.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary-hover transition text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample Template (.xlsx)
                </button>
              </div>

              {/* File Upload Dropzone */}
              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-black/[0.12] hover:border-primary/50 hover:bg-canvas-parchment/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-canvas-parchment border border-black/[0.06] flex items-center justify-center text-primary">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      Drag and drop your Excel file here, or <span className="text-primary underline">browse</span>
                    </p>
                    <p className="text-[11px] text-ink-muted mt-1">
                      Supports .xlsx, .xls, and .csv files
                    </p>
                  </div>
                </div>
              ) : (
                /* File Selected & Preview */
                <div className="flex flex-col gap-4">
                  {/* File Info Bar */}
                  <div className="p-3.5 rounded-xl bg-canvas-parchment/60 border border-black/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-ink truncate">{file.name}</span>
                      <span className="text-[10px] text-ink-muted shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB · {parsedTeams.length} teams detected)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-danger hover:underline cursor-pointer"
                    >
                      Change file
                    </button>
                  </div>

                  {/* Default Password Setting */}
                  <div className="p-4 rounded-xl bg-canvas border border-black/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        Default Temporary Password
                      </label>
                      <p className="text-[11px] text-ink-muted">
                        Assigned to newly created accounts and emailed to team leaders.
                      </p>
                    </div>
                    <div className="relative w-full sm:w-56">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={defaultPassword}
                        onChange={(e) => setDefaultPassword(e.target.value)}
                        placeholder="e.g. Syntra@2026"
                        className="w-full pl-3 pr-8 py-1.5 rounded-md bg-canvas-pearl border border-black/[0.08] focus:border-primary focus:outline-none text-xs text-ink font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Parse Errors / Warnings if any */}
                  {parseErrors.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-warning-light/60 border border-warning/20 flex flex-col gap-1 text-warning-dark">
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Parsing Warnings ({parseErrors.length})
                      </span>
                      <div className="max-h-24 overflow-y-auto text-[11px] font-mono flex flex-col gap-0.5">
                        {parseErrors.map((err, idx) => (
                          <div key={idx}>• {err}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parsed Teams Preview Table */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">
                        Preview Teams ({parsedTeams.length})
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        Min: {minTeamSize} · Max: {maxTeamSize} members
                      </span>
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-black/[0.06] overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-canvas-parchment/80 border-b border-black/[0.06] text-ink-muted uppercase text-[10px] sticky top-0">
                          <tr>
                            <th className="p-2.5 font-semibold">#</th>
                            <th className="p-2.5 font-semibold">Team Name</th>
                            <th className="p-2.5 font-semibold">Leader</th>
                            <th className="p-2.5 font-semibold">College</th>
                            <th className="p-2.5 font-semibold text-center">Members</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04]">
                          {parsedTeams.map((t, i) => (
                            <tr key={i} className="hover:bg-canvas-parchment/30">
                              <td className="p-2.5 text-ink-muted text-[11px] font-mono">{i + 1}</td>
                              <td className="p-2.5 font-semibold text-ink">{t.teamName}</td>
                              <td className="p-2.5">
                                <div className="text-ink font-medium">{t.leaderName}</div>
                                <div className="text-[10px] text-ink-muted">{t.leaderEmail}</div>
                              </td>
                              <td className="p-2.5 text-ink-muted text-[11px] truncate max-w-[140px]">
                                {t.college}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                                  {1 + (t.members?.length || 0)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-black/[0.06] bg-canvas-parchment/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-medium text-ink-muted hover:text-ink cursor-pointer transition"
          >
            {importResult ? "Done" : "Cancel"}
          </button>

          {!importResult && file && parsedTeams.length > 0 && (
            <button
              type="button"
              onClick={handleStartImport}
              disabled={isProcessing || parsedTeams.length === 0}
              className="px-5 py-2 rounded-full bg-primary text-white hover:bg-primary-hover transition text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Importing & Sending Emails...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Import {parsedTeams.length} Team{parsedTeams.length !== 1 ? "s" : ""}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
