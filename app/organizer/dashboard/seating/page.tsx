"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Armchair,
  AlertTriangle,
  Save,
  Zap,
  CheckCircle,
  Building2,
  Plus,
  Trash2,
  ChevronDown,
  LayoutGrid,
  Columns,
  Grid,
  Users,
} from "lucide-react";
import {
  getOrganizerHackathons,
  getSeatingContext,
  saveSeatingAllocation,
  performAllocation,
} from "@/app/actions/seating";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColumnConfig {
  id: string;
  bench_count: number;
  capacity: number;
}

interface RoomConfig {
  id: string;
  room_no: string;
  type: "configured" | "open";
  columns: ColumnConfig[];
  total_seats: number;
  seats_per_row: number;
}

interface TeamColor {
  bg: string;
  text: string;
  dot: string;
  border: string;
  seatBg: string;
  seatText: string;
}

// ─── Team Color Palette ───────────────────────────────────────────────────────

const TEAM_PALETTE: TeamColor[] = [
  { bg: "rgba(20,184,166,0.12)", text: "#2dd4bf", dot: "#14b8a6", border: "rgba(20,184,166,0.4)", seatBg: "rgba(20,184,166,0.25)", seatText: "#5eead4" },
  { bg: "rgba(99,102,241,0.12)", text: "#a5b4fc", dot: "#6366f1", border: "rgba(99,102,241,0.4)", seatBg: "rgba(99,102,241,0.25)", seatText: "#c7d2fe" },
  { bg: "rgba(245,158,11,0.12)", text: "#fcd34d", dot: "#f59e0b", border: "rgba(245,158,11,0.4)", seatBg: "rgba(245,158,11,0.25)", seatText: "#fde68a" },
  { bg: "rgba(236,72,153,0.12)", text: "#f9a8d4", dot: "#ec4899", border: "rgba(236,72,153,0.4)", seatBg: "rgba(236,72,153,0.25)", seatText: "#fbcfe8" },
  { bg: "rgba(34,197,94,0.12)", text: "#86efac", dot: "#22c55e", border: "rgba(34,197,94,0.4)", seatBg: "rgba(34,197,94,0.25)", seatText: "#bbf7d0" },
  { bg: "rgba(249,115,22,0.12)", text: "#fdba74", dot: "#f97316", border: "rgba(249,115,22,0.4)", seatBg: "rgba(249,115,22,0.25)", seatText: "#fed7aa" },
  { bg: "rgba(168,85,247,0.12)", text: "#d8b4fe", dot: "#a855f7", border: "rgba(168,85,247,0.4)", seatBg: "rgba(168,85,247,0.25)", seatText: "#e9d5ff" },
  { bg: "rgba(6,182,212,0.12)", text: "#67e8f9", dot: "#06b6d4", border: "rgba(6,182,212,0.4)", seatBg: "rgba(6,182,212,0.25)", seatText: "#a5f3fc" },
];

function teamColorMap(allocationResult: any): Record<string, TeamColor> {
  const map: Record<string, TeamColor> = {};
  if (!allocationResult?.teams) return map;
  allocationResult.teams.forEach((t: any, i: number) => {
    map[t.name] = TEAM_PALETTE[i % TEAM_PALETTE.length];
  });
  return map;
}

function getMemberInitials(memberName: string): string {
  return memberName
    .replace(/@.*$/, "")
    .split(/[\s._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join("");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newColumn(): ColumnConfig {
  return { id: crypto.randomUUID(), bench_count: 3, capacity: 4 };
}

function newRoom(): RoomConfig {
  return {
    id: crypto.randomUUID(),
    room_no: "",
    type: "configured",
    columns: [newColumn(), newColumn()],
    total_seats: 30,
    seats_per_row: 5,
  };
}

function roomsToJson(rooms: RoomConfig[], maxTeams?: number): string {
  const roomsList = rooms.map((r) => {
    if (r.type === "configured") {
      return {
        room_no: r.room_no || "Unnamed Room",
        type: "configured",
        columns: r.columns.map((c) => ({
          bench_count: c.bench_count,
          capacity: c.capacity,
        })),
      };
    } else {
      return {
        room_no: r.room_no || "Unnamed Room",
        type: "open",
        total_seats: r.total_seats,
        seats_per_row: r.seats_per_row,
      };
    }
  });

  if (maxTeams !== undefined && maxTeams !== null) {
    return JSON.stringify([
      { room_no: "METADATA", type: "metadata", max_teams: maxTeams },
      ...roomsList
    ]);
  }
  return JSON.stringify(roomsList);
}

function parseJsonToRooms(json: string): { rooms: RoomConfig[]; maxTeams?: number } {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return { rooms: [newRoom()] };
    const meta = parsed.find((el: any) => el.room_no === "METADATA" && el.type === "metadata");
    const maxTeams = meta?.max_teams;
    const roomsFiltered = parsed.filter((el: any) => !(el.room_no === "METADATA" && el.type === "metadata"));
    const rooms: RoomConfig[] = roomsFiltered.map((r: any) => ({
      id: crypto.randomUUID(),
      room_no: r.room_no || "",
      type: r.type === "open" ? "open" : "configured",
      columns: Array.isArray(r.columns)
        ? r.columns.map((c: any) => ({
            id: crypto.randomUUID(),
            bench_count: Number(c.bench_count) || 3,
            capacity: Number(c.capacity) || 4,
          }))
        : [newColumn()],
      total_seats: Number(r.total_seats) || 30,
      seats_per_row: Number(r.seats_per_row) || 5,
    }));
    return { rooms, maxTeams };
  } catch {
    return { rooms: [newRoom()] };
  }
}

const DEFAULT_ROOMS: RoomConfig[] = [
  {
    id: "default-1",
    room_no: "Room A",
    type: "configured",
    columns: [
      { id: "c1", bench_count: 5, capacity: 4 },
      { id: "c2", bench_count: 5, capacity: 4 },
    ],
    total_seats: 30,
    seats_per_row: 5,
  },
  {
    id: "default-2",
    room_no: "Main Hall",
    type: "open",
    columns: [],
    total_seats: 50,
    seats_per_row: 10,
  },
];

// ─── NumberStepper ────────────────────────────────────────────────────────────

function NumberStepper({
  label,
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{label}</span>
      <div className="flex items-center rounded-xl overflow-hidden border border-slate-700 bg-slate-950/60">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-150 text-lg leading-none flex-shrink-0 border-r border-slate-700"
        >
          −
        </button>
        <span className="flex-1 text-center text-sm font-bold text-white tabular-nums select-none py-1">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-150 text-lg leading-none flex-shrink-0 border-l border-slate-700"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── ColumnRow ────────────────────────────────────────────────────────────────

function ColumnRow({
  col,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  col: ColumnConfig;
  index: number;
  onUpdate: (patch: Partial<ColumnConfig>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-end gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
      <div className="pb-1.5 w-7 flex-shrink-0 text-center">
        <span className="text-[10px] font-mono font-bold text-slate-600">C{index + 1}</span>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3">
        <NumberStepper
          label="Benches"
          value={col.bench_count}
          min={1}
          max={20}
          onChange={(v) => onUpdate({ bench_count: v })}
        />
        <NumberStepper
          label="Seats / Bench"
          value={col.capacity}
          min={1}
          max={10}
          onChange={(v) => onUpdate({ capacity: v })}
        />
      </div>
      <div className="pb-0.5 flex-shrink-0">
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            title="Remove column"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>
    </div>
  );
}

// ─── RoomCard ─────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  room: RoomConfig;
  index: number;
  onUpdate: (patch: Partial<RoomConfig>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const addColumn = () => onUpdate({ columns: [...room.columns, newColumn()] });
  const updateColumn = (colId: string, patch: Partial<ColumnConfig>) =>
    onUpdate({ columns: room.columns.map((c) => (c.id === colId ? { ...c, ...patch } : c)) });
  const removeColumn = (colId: string) =>
    onUpdate({ columns: room.columns.filter((c) => c.id !== colId) });

  const totalSeats =
    room.type === "configured"
      ? room.columns.reduce((s, c) => s + c.bench_count * c.capacity, 0)
      : room.total_seats;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/70 overflow-hidden">
      {/* Row 1: icon + name + seats + delete */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-3.5 h-3.5 text-teal-400" />
        </div>
        <input
          type="text"
          value={room.room_no}
          onChange={(e) => onUpdate({ room_no: e.target.value })}
          placeholder={`Room ${index + 1}`}
          className="flex-1 bg-transparent text-sm font-bold text-white placeholder-slate-600 focus:outline-none min-w-0"
        />
        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 ml-1">{totalSeats} seats</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 flex-shrink-0"
            title="Remove room"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Row 2: type toggle */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">Type:</span>
        <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => onUpdate({ type: "configured" })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
              room.type === "configured"
                ? "bg-teal-500/20 border border-teal-500/30 text-teal-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Columns className="w-3 h-3" />
            Configured
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ type: "open" })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
              room.type === "open"
                ? "bg-teal-500/20 border border-teal-500/30 text-teal-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Grid className="w-3 h-3" />
            Open
          </button>
        </div>
      </div>

      <div className="border-t border-slate-800/60" />

      {/* Room Body */}
      <div className="p-4">
        {room.type === "configured" ? (
          <div className="flex flex-col gap-2.5">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Each column is an aisle of benches. Set bench count and seats per bench.
            </p>
            <div className="flex flex-col gap-2">
              {room.columns.map((col, i) => (
                <ColumnRow
                  key={col.id}
                  col={col}
                  index={i}
                  onUpdate={(patch) => updateColumn(col.id, patch)}
                  onRemove={() => removeColumn(col.id)}
                  canRemove={room.columns.length > 1}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addColumn}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:border-teal-500/40 hover:text-teal-400 hover:bg-teal-500/5 text-xs font-semibold transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Column
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Open seating — seats arranged in rows without bench groupings.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <NumberStepper
                label="Total Seats"
                value={room.total_seats}
                min={1}
                max={500}
                onChange={(v) => onUpdate({ total_seats: v })}
              />
              <NumberStepper
                label="Seats per Row"
                value={room.seats_per_row}
                min={1}
                max={20}
                onChange={(v) => onUpdate({ seats_per_row: v })}
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/50">
              <p className="text-[9px] text-slate-600 mb-2 uppercase tracking-widest font-bold">Preview</p>
              <div className="flex flex-col gap-1 max-h-24 overflow-hidden">
                {Array.from({
                  length: Math.min(Math.ceil(room.total_seats / room.seats_per_row), 6),
                }).map((_, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-0.5">
                    {Array.from({
                      length:
                        rowIdx === Math.ceil(room.total_seats / room.seats_per_row) - 1
                          ? room.total_seats % room.seats_per_row || room.seats_per_row
                          : room.seats_per_row,
                    }).map((_, j) => (
                      <div key={j} className="w-3 h-3 rounded-[3px] bg-slate-700" />
                    ))}
                  </div>
                ))}
                {Math.ceil(room.total_seats / room.seats_per_row) > 6 && (
                  <p className="text-[8px] text-slate-600 mt-0.5">
                    +{Math.ceil(room.total_seats / room.seats_per_row) - 6} more rows
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SeatingAllocationPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [rooms, setRooms] = useState<RoomConfig[]>(DEFAULT_ROOMS);
  const [maxTeamsLimit, setMaxTeamsLimit] = useState<number | null>(null);
  const [allocationResult, setAllocationResult] = useState<any | null>(null);
  const [hackathonName, setHackathonName] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const list = await getOrganizerHackathons();
        setHackathons(list);
        if (list.length > 0) setSelectedHackathonId(list[0].id);
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Failed to load hackathons." });
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedHackathonId) return;
    async function loadSeatingData() {
      setLoading(true);
      setMessage(null);
      try {
        const ctx = await getSeatingContext(selectedHackathonId as number);
        setHackathonName(ctx.hackathonName);
        const parsedData = ctx.roomConfiguration ? parseJsonToRooms(ctx.roomConfiguration) : { rooms: DEFAULT_ROOMS };
        setRooms(parsedData.rooms);
        setMaxTeamsLimit(parsedData.maxTeams ?? null);
        if (ctx.seatingAllocation) {
          try { setAllocationResult(JSON.parse(ctx.seatingAllocation)); } catch { setAllocationResult(null); }
        } else {
          setAllocationResult(null);
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Failed to load seating details." });
      } finally {
        setLoading(false);
      }
    }
    loadSeatingData();
  }, [selectedHackathonId]);

  const updateRoom = (roomId: string, patch: Partial<RoomConfig>) =>
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, ...patch } : r)));
  const removeRoom = (roomId: string) =>
    setRooms((prev) => prev.filter((r) => r.id !== roomId));

  const handleRunAllocation = async () => {
    if (!selectedHackathonId) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await performAllocation(selectedHackathonId as number, roomsToJson(rooms, maxTeamsLimit ?? undefined));
      setAllocationResult(result);
      setMessage({ type: "success", text: "Seating allocation simulated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Allocation simulation failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllocation = async () => {
    if (!selectedHackathonId || !allocationResult) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveSeatingAllocation(
        selectedHackathonId as number,
        roomsToJson(rooms, maxTeamsLimit ?? undefined),
        JSON.stringify(allocationResult)
      );
      setMessage({ type: "success", text: "Seating layout saved to database." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save allocation." });
    } finally {
      setSaving(false);
    }
  };

  const selectedHackathon = hackathons.find((h) => h.id === selectedHackathonId);
  const fillRate =
    allocationResult && allocationResult.stats.total_capacity > 0
      ? Math.round((allocationResult.stats.allocated / allocationResult.stats.total_capacity) * 100)
      : 0;
  const tColors = allocationResult ? teamColorMap(allocationResult) : {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900">
      {/* Ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-48 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative w-full border-b border-slate-800/60 z-20 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/organizer/dashboard"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all duration-200 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <span className="text-slate-950 font-black text-base tracking-tighter">S</span>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white leading-none">Seating Allocation</h1>
                <p className="text-[10px] text-teal-400 font-semibold tracking-widest uppercase mt-0.5">Organizer Console</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-sm font-semibold text-white transition-all duration-200 min-w-[180px] justify-between"
            >
              <span className="truncate max-w-[160px]">{selectedHackathon?.name || "Select Hackathon"}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                {hackathons.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => { setSelectedHackathonId(h.id); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 ${
                      h.id === selectedHackathonId ? "bg-teal-500/10 text-teal-400 font-semibold" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Toast */}
      {message && (
        <div className="relative z-10 max-w-screen-xl mx-auto w-full px-6 pt-4">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-medium ${
            message.type === "success" ? "bg-teal-500/10 border-teal-500/30 text-teal-300" : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}>
            {message.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto text-slate-500 hover:text-white transition-colors text-xl leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <main className="relative flex-1 max-w-screen-xl mx-auto w-full px-6 py-8 z-10 flex gap-6">

        {/* LEFT: Room Builder */}
        <aside className="w-[420px] flex-shrink-0 flex flex-col gap-4 self-start pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Room Configuration</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{rooms.length} room{rooms.length !== 1 ? "s" : ""} configured</p>
            </div>
            <button
              type="button"
              onClick={() => setRooms((prev) => [...prev, newRoom()])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-semibold hover:bg-teal-500/20 hover:border-teal-500/40 transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Room
            </button>
          </div>

          {/* Max Teams Limit Card */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-900/60 p-4 flex flex-col gap-3">
            <div>
              <h3 className="text-xs font-bold text-white">Registration Capacity</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Limit the total number of registered/paid teams allowed in the hackathon</p>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-2">
                <input
                  id="enable_limit"
                  type="checkbox"
                  checked={maxTeamsLimit !== null}
                  onChange={(e) => {
                    setMaxTeamsLimit(e.target.checked ? 10 : null);
                  }}
                  className="w-4 h-4 rounded border-slate-850 bg-slate-950 text-teal-500 focus:ring-teal-500 accent-teal-500 cursor-pointer"
                />
                <label htmlFor="enable_limit" className="text-xs text-slate-400 font-medium cursor-pointer select-none">
                  Enable limit
                </label>
              </div>
              {maxTeamsLimit !== null && (
                <NumberStepper
                  label="Max Teams"
                  value={maxTeamsLimit}
                  min={1}
                  max={1000}
                  onChange={(v) => setMaxTeamsLimit(v)}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {rooms.map((room, i) => (
              <RoomCard
                key={room.id}
                room={room}
                index={i}
                onUpdate={(patch) => updateRoom(room.id, patch)}
                onRemove={() => removeRoom(room.id)}
                canRemove={rooms.length > 1}
              />
            ))}
          </div>

          <button
            onClick={handleRunAllocation}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                Allocating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Allocation
              </>
            )}
          </button>

          {allocationResult && (
            <button
              onClick={handleSaveAllocation}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-teal-400 hover:text-teal-300 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Layout to DB"}
            </button>
          )}

          {/* Legend */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/70 p-4 flex flex-col gap-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Legend</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg border-2 border-slate-700 bg-slate-900 flex-shrink-0" />
                <span className="text-xs text-slate-400">Empty seat</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: "rgba(20,184,166,0.25)", border: "1.5px solid rgba(20,184,166,0.4)" }} />
                <span className="text-xs text-slate-400">Occupied — colored by team, shows initials</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg border border-amber-500/60 bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs text-slate-400">Mixed-team bench</span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT: Results */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Stats bar */}
          {allocationResult ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Allocated", value: `${allocationResult.stats.allocated}`, sub: `/ ${allocationResult.stats.total_members} members`, color: "text-teal-400" },
                { label: "Unallocated", value: `${allocationResult.stats.unallocated}`, sub: "members", color: "text-amber-400" },
                { label: "Fill Rate", value: `${fillRate}%`, sub: "of capacity", color: fillRate >= 80 ? "text-teal-400" : "text-amber-400" },
                { label: "Rooms Used", value: `${allocationResult.stats.rooms_used}`, sub: "active rooms", color: "text-slate-200" },
              ].map((stat) => (
                <div key={stat.label} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/70 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{stat.label}</span>
                  <span className={`text-3xl font-black ${stat.color}`}>{stat.value}</span>
                  <span className="text-[11px] text-slate-500">{stat.sub}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/70 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{hackathonName || "No hackathon selected"}</p>
                  <p className="text-xs text-slate-500">Configure rooms on the left, then run allocation</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium flex-shrink-0">
                No allocation yet
              </span>
            </div>
          )}

          {/* Seat Map */}
          {!allocationResult ? (
            <div className="flex-1 rounded-2xl bg-slate-900/40 border border-slate-800/60 border-dashed flex flex-col items-center justify-center text-center gap-5 py-24">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <Armchair className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">No Allocation Generated</h3>
                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                  Configure your rooms in the panel, then click{" "}
                  <span className="text-teal-400 font-semibold">Run Allocation</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">

              {/* Team color legend */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/70 flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 mr-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Teams</span>
                </div>
                {allocationResult.teams.map((t: any) => {
                  const c = tColors[t.name] ?? TEAM_PALETTE[0];
                  return (
                    <div
                      key={t.name}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
                      {t.name}
                    </div>
                  );
                })}
              </div>

              {/* Room cards */}
              {Object.entries(allocationResult.room_view).map(([roomName, roomData]: [string, any]) => (
                <div key={roomName} className="rounded-2xl bg-slate-900/60 border border-slate-800/70 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{roomName}</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{roomData.room_type} room</p>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                      {Object.keys(roomData.rows).length} rows
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-5">
                    {Object.entries(roomData.rows).map(([rowName, rowData]: [string, any]) => (
                      <div key={rowName} className="flex items-start gap-3">
                        {/* Row label */}
                        <div className="w-7 flex-shrink-0 pt-3 text-center">
                          <span className="text-[10px] font-mono font-bold text-slate-600">{rowName}</span>
                        </div>

                        {/* Benches */}
                        <div className="flex-1 flex flex-wrap gap-2">
                          {(rowData.benches as any[]).map((bench: any, idx: number) => {
                            const teamsOnBench: string[] = Array.from(new Set(bench.assigned.map((a: any) => a.team as string)));
                            const isMixed = teamsOnBench.length > 1;
                            const primaryTeam = bench.assigned.length > 0 ? teamsOnBench[0] : null;
                            const primaryColor = primaryTeam ? (tColors[primaryTeam] ?? TEAM_PALETTE[0]) : null;
                            const isEmpty = bench.assigned.length === 0;

                            return (
                              <div
                                key={idx}
                                className="rounded-xl overflow-hidden border transition-all duration-200"
                                style={{
                                  borderColor: isMixed
                                    ? "rgba(245,158,11,0.4)"
                                    : primaryColor
                                    ? primaryColor.border + "55"
                                    : "rgb(30 41 59)",
                                }}
                              >
                                {/* Bench header: bench # + team name badge + fill */}
                                <div
                                  className="px-2.5 py-1.5 flex items-center justify-between gap-2"
                                  style={{
                                    backgroundColor: isMixed
                                      ? "rgba(245,158,11,0.07)"
                                      : primaryColor
                                      ? primaryColor.bg
                                      : "rgb(2 6 23 / 0.6)",
                                  }}
                                >
                                  <span className="text-[9px] font-mono font-bold text-slate-600 flex-shrink-0">
                                    B{bench.bench}
                                  </span>

                                  <div className="flex-1 flex items-center gap-1 flex-wrap justify-center">
                                    {isEmpty ? (
                                      <span className="text-[9px] text-slate-700 font-medium italic">empty</span>
                                    ) : isMixed ? (
                                      teamsOnBench.map((tn) => {
                                        const tc = tColors[tn] ?? TEAM_PALETTE[0];
                                        return (
                                          <span
                                            key={tn}
                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                            style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                                          >
                                            {tn}
                                          </span>
                                        );
                                      })
                                    ) : primaryTeam && primaryColor ? (
                                      <span
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                        style={{ backgroundColor: primaryColor.bg, color: primaryColor.text, border: `1px solid ${primaryColor.border}` }}
                                      >
                                        {primaryTeam}
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {isMixed && <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
                                    <span className="text-[9px] text-slate-600 font-mono">
                                      {bench.assigned.length}/{bench.capacity}
                                    </span>
                                  </div>
                                </div>

                                {/* Seats */}
                                <div className="px-2 py-2 bg-slate-900/40 flex items-center gap-1.5">
                                  {Array.from({ length: bench.capacity }).map((_, seatIdx) => {
                                    const occupant = bench.assigned[seatIdx];
                                    const teamColor = occupant ? (tColors[occupant.team] ?? TEAM_PALETTE[0]) : null;
                                    const initials = occupant ? getMemberInitials(occupant.member) : "";

                                    return (
                                      <div
                                        key={seatIdx}
                                        title={occupant ? `${occupant.member}\n${occupant.team}` : "Empty seat"}
                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold cursor-help transition-all duration-200 hover:scale-110 hover:z-10 flex-shrink-0 relative"
                                        style={
                                          occupant && teamColor
                                            ? { backgroundColor: teamColor.seatBg, color: teamColor.seatText, border: `1.5px solid ${teamColor.border}` }
                                            : { backgroundColor: "rgb(15 23 42)", border: "1.5px solid rgb(30 41 59)", color: "rgb(71 85 105)" }
                                        }
                                      >
                                        {initials}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Unallocated warning */}
              {allocationResult.teams.some((t: any) => t.unallocated.length > 0) && (
                <div className="rounded-2xl bg-amber-500/5 border border-amber-500/30 overflow-hidden">
                  <div className="px-6 py-4 border-b border-amber-500/20 flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-amber-400 text-sm">
                      Unallocated Members ({allocationResult.teams.reduce((sum: number, t: any) => sum + t.unallocated.length, 0)})
                    </h3>
                  </div>
                  <div className="p-5 flex flex-col gap-2">
                    <p className="text-xs text-slate-400 mb-2">These participants could not be assigned due to capacity constraints.</p>
                    {allocationResult.teams
                      .filter((t: any) => t.unallocated.length > 0)
                      .map((t: any) => (
                        <div key={t.name} className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
                          <span className="font-semibold text-white">{t.name}</span>
                          <span className="text-slate-400 font-mono">{t.unallocated.join(", ")}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
