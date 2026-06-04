import { prisma } from "@/lib/prisma";

export interface TeamAllocationInput {
  name: string;
  members: string[]; // List of names or emails
}

export interface RoomColumnConfig {
  bench_count: number;
  capacity: number;
}

export interface RoomConfig {
  room_no: string;
  type?: "open" | "configured";
  total_seats?: number;
  seats_per_row?: number;
  columns?: RoomColumnConfig[];
}

export interface BenchSlot {
  room: string;
  room_type: string;
  section: string;
  row: string;
  row_number: number;
  bench: number;
  seat_number?: number;
  capacity: number;
  assigned: Array<{ member: string; team: string }>;
}

export interface SeatAllocation {
  room: string;
  section: string;
  row: string;
  bench: number;
  seats: number[];
  members: string[];
}

export interface TeamAllocationResult {
  name: string;
  members: string[];
  member_count: number;
  seats: SeatAllocation[];
  proximity_score: number;
  unallocated: string[];
}

export function buildBenchList(roomsConfig: RoomConfig[]): BenchSlot[] {
  const benches: BenchSlot[] = [];
  for (const room of roomsConfig) {
    const roomNo = room.room_no;
    const roomType = room.type || "configured";

    if (roomType === "open") {
      const totalSeats = Number(room.total_seats || 0);
      const seatsPerRow = Math.max(1, Number(room.seats_per_row || 20));
      let rowNumber = 1;
      for (let i = 1; i <= totalSeats; i++) {
        const col = ((i - 1) % seatsPerRow) + 1;
        if (i > 1 && col === 1) {
          rowNumber += 1;
        }
        benches.push({
          room: roomNo,
          room_type: "open",
          section: "Open Seating",
          row: `R${rowNumber}`,
          row_number: rowNumber,
          bench: col,
          seat_number: i,
          capacity: 1,
          assigned: [],
        });
      }
    } else {
      let colNum = 1;
      for (const col of room.columns || []) {
        const benchCount = Number(col.bench_count || 1);
        const capacity = Number(col.capacity || 1);
        for (let benchPos = 1; benchPos <= benchCount; benchPos++) {
          benches.push({
            room: roomNo,
            room_type: "configured",
            section: roomNo,
            row: `R${benchPos}`,
            row_number: benchPos,
            bench: colNum,
            capacity: capacity,
            assigned: [],
          });
        }
        colNum += 1;
      }
    }
  }
  return benches;
}

export function allocate(teams: TeamAllocationInput[], roomsConfig: RoomConfig[]) {
  const benches = buildBenchList(roomsConfig);
  const totalCapacity = benches.reduce((sum, b) => sum + b.capacity, 0);
  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);

  const pools = teams
    .map((t) => ({ name: t.name, members: [...t.members], idx: 0 }))
    .sort((a, b) => b.members.length - a.members.length);

  const remaining = (p: { members: any[]; idx: number }) => p.members.length - p.idx;

  // Group benches by room
  const roomToBenches: Record<string, BenchSlot[]> = {};
  for (const b of benches) {
    if (!roomToBenches[b.room]) {
      roomToBenches[b.room] = [];
    }
    roomToBenches[b.room].push(b);
  }

  // Ensure benches are ordered by row then bench
  for (const r of Object.keys(roomToBenches)) {
    roomToBenches[r].sort((a, b) => {
      if (a.row_number !== b.row_number) {
        return a.row_number - b.row_number;
      }
      return a.bench - b.bench;
    });
  }

  // Pre-calculate room capacities
  const roomFreeSpace: Record<string, number> = {};
  for (const [r, bs] of Object.entries(roomToBenches)) {
    roomFreeSpace[r] = bs.reduce((sum, b) => sum + b.capacity, 0);
  }

  const seatLists: Record<string, SeatAllocation[]> = {};
  for (const p of pools) {
    seatLists[p.name] = [];
  }

  for (const pool of pools) {
    let rem = remaining(pool);
    if (rem <= 0) continue;

    // 1. Layout-Aware Room Selection (Strict "Same Team, Same Room")
    let bestRoomScore = -1;
    let targetRoom: string | null = null;

    for (const [rNo, rBenches] of Object.entries(roomToBenches)) {
      if (roomFreeSpace[rNo] < rem) continue;

      // Calculate Max Contiguous Empty Block in this room
      let maxBlock = 0;
      const rows: Record<number, BenchSlot[]> = {};
      for (const b of rBenches) {
        const rn = b.row_number;
        if (!rows[rn]) rows[rn] = [];
        rows[rn].push(b);
      }

      for (const rn of Object.keys(rows).map(Number)) {
        const rowBs = [...rows[rn]].sort((a, b) => a.bench - b.bench);
        let curB = 0;
        let lastC = -1;
        for (const b of rowBs) {
          if (b.assigned.length === 0) {
            if (lastC === -1 || b.bench === lastC + 1) {
              curB += b.capacity;
            } else {
              maxBlock = Math.max(maxBlock, curB);
              curB = b.capacity;
            }
            lastC = b.bench;
          } else {
            maxBlock = Math.max(maxBlock, curB);
            curB = 0;
            lastC = -1;
          }
        }
        maxBlock = Math.max(maxBlock, curB);
      }

      // Scoring logic
      let score = 0;
      if (maxBlock >= rem) {
        score = 10000 - roomFreeSpace[rNo];
      } else {
        score = maxBlock;
      }

      if (score > bestRoomScore) {
        bestRoomScore = score;
        targetRoom = rNo;
      }
    }

    // Fallback
    if (!targetRoom) {
      const roomsWithSpace = Object.keys(roomFreeSpace).filter((r) => roomFreeSpace[r] > 0);
      if (roomsWithSpace.length === 0) continue;
      targetRoom = roomsWithSpace.reduce((a, b) => (roomFreeSpace[a] > roomFreeSpace[b] ? a : b));
    }

    if (!targetRoom) continue;
    const roomKey = targetRoom;
    let lastBench: BenchSlot | null = null;
    while (remaining(pool) > 0 && roomFreeSpace[roomKey] > 0) {
      const currRem = remaining(pool);
      let bestBench: BenchSlot | null = null;

      const isClean = (b: BenchSlot) =>
        b.assigned.length === 0 || b.assigned.every((a) => a.team === pool.name);

      const benchesInRoom = roomToBenches[roomKey] || [];

      if (!lastBench) {
        // --- INITIAL BENCH SELECTION ---
        // 1. Priority: Single EMPTY bench that fits the entire team
        for (const bench of benchesInRoom) {
          const free = bench.capacity - bench.assigned.length;
          if (bench.assigned.length === 0 && free >= currRem) {
            if (!bestBench || free < (bestBench.capacity - bestBench.assigned.length)) {
              bestBench = bench;
            }
          }
        }

        // 2. Priority: Any EMPTY bench
        if (!bestBench) {
          const emptyBenches = benchesInRoom.filter((b) => b.assigned.length === 0);
          if (emptyBenches.length > 0) {
            bestBench = emptyBenches.reduce((a, b) => (b.capacity > a.capacity ? b : a));
          }
        }

        // 3. Fallback: Any bench with space
        if (!bestBench) {
          const possible = benchesInRoom.filter(
            (b) => b.capacity - b.assigned.length > 0
          );
          if (possible.length > 0) {
            bestBench = possible.reduce((a, b) =>
              b.capacity - b.assigned.length > a.capacity - a.assigned.length ? b : a
            );
          }
        }
      } else {
        // --- SUBSEQUENT BENCH SELECTION (Strict Adjacency + Mixed Penalty) ---
        const rowNum: number = lastBench.row_number;
        const benchNum: number = lastBench.bench;

        // 1. Priority: Adjacent Column (Same Row, Side-by-Side)
        const adjCol: BenchSlot[] = benchesInRoom.filter(
          (b: BenchSlot) =>
            b.row_number === rowNum &&
            Math.abs(b.bench - benchNum) === 1 &&
            b.capacity - b.assigned.length > 0
        );
        if (adjCol.length > 0) {
          const cleanAdj: BenchSlot[] = adjCol.filter((b: BenchSlot) => isClean(b));
          bestBench =
            cleanAdj.length > 0
              ? cleanAdj.reduce((a: BenchSlot, b: BenchSlot) => (b.capacity - b.assigned.length > a.capacity - a.assigned.length ? b : a))
              : adjCol.reduce((a: BenchSlot, b: BenchSlot) => (b.capacity - b.assigned.length > a.capacity - a.assigned.length ? b : a));
        }

        // 2. Priority: Same Row (Any Column, Closest First)
        if (!bestBench) {
          const sameRow: BenchSlot[] = benchesInRoom.filter(
            (b: BenchSlot) => b.row_number === rowNum && b.capacity - b.assigned.length > 0
          );
          if (sameRow.length > 0) {
            const cleanRow: BenchSlot[] = sameRow.filter((b: BenchSlot) => isClean(b));
            const candidates: BenchSlot[] = cleanRow.length > 0 ? cleanRow : sameRow;
            bestBench = candidates.reduce((a: BenchSlot, b: BenchSlot) =>
              Math.abs(b.bench - benchNum) < Math.abs(a.bench - benchNum) ? b : a
            );
          }
        }

        // 3. Priority: Back-to-Back (Adjacent Row, Same Column)
        if (!bestBench) {
          const backToBack: BenchSlot[] = benchesInRoom.filter(
            (b: BenchSlot) =>
              Math.abs(b.row_number - rowNum) === 1 &&
              b.bench === benchNum &&
              b.capacity - b.assigned.length > 0
          );
          if (backToBack.length > 0) {
            const cleanBack: BenchSlot[] = backToBack.filter((b: BenchSlot) => isClean(b));
            const candidates: BenchSlot[] = cleanBack.length > 0 ? cleanBack : backToBack;
            bestBench = candidates.reduce((a: BenchSlot, b: BenchSlot) =>
              b.capacity - b.assigned.length > a.capacity - a.assigned.length ? b : a
            );
          }
        }

        // 4. Priority: Adjacent Row (Any Column, Closest First)
        if (!bestBench) {
          const adjRow: BenchSlot[] = benchesInRoom.filter(
            (b: BenchSlot) => Math.abs(b.row_number - rowNum) === 1 && b.capacity - b.assigned.length > 0
          );
          if (adjRow.length > 0) {
            const cleanAdjRow: BenchSlot[] = adjRow.filter((b: BenchSlot) => isClean(b));
            const candidates: BenchSlot[] = cleanAdjRow.length > 0 ? cleanAdjRow : adjRow;
            bestBench = candidates.reduce((a: BenchSlot, b: BenchSlot) =>
              Math.abs(b.bench - benchNum) < Math.abs(a.bench - benchNum) ? b : a
            );
          }
        }

        // 5. Priority: Any CLEAN bench that fits the WHOLE remainder
        if (!bestBench) {
          for (const bench of benchesInRoom) {
            const free = bench.capacity - bench.assigned.length;
            if (isClean(bench) && free >= currRem) {
              if (!bestBench || free < (bestBench.capacity - bestBench.assigned.length)) {
                bestBench = bench;
              }
            }
          }
        }

        // 6. Fallback: Any available bench in the room
        if (!bestBench) {
          const possible: BenchSlot[] = benchesInRoom.filter(
            (b: BenchSlot) => b.capacity - b.assigned.length > 0
          );
          if (possible.length > 0) {
            const cleanPossible: BenchSlot[] = possible.filter((b: BenchSlot) => isClean(b));
            bestBench =
              cleanPossible.length > 0
                ? cleanPossible.reduce((a: BenchSlot, b: BenchSlot) => (b.capacity - b.assigned.length > a.capacity - a.assigned.length ? b : a))
                : possible.reduce((a: BenchSlot, b: BenchSlot) => (b.capacity - b.assigned.length > a.capacity - a.assigned.length ? b : a));
          }
        }
      }

      if (!bestBench) break;

      const take = Math.min(currRem, bestBench.capacity - bestBench.assigned.length);
      const chunk = pool.members.slice(pool.idx, pool.idx + take);
      pool.idx += take;
      roomFreeSpace[roomKey] -= take;
      lastBench = bestBench;

      for (const m of chunk) {
        bestBench.assigned.push({ member: m, team: pool.name });
      }

      const startSeat = bestBench.assigned.length - take + 1;
      const seats: number[] = [];
      for (let s = startSeat; s <= bestBench.assigned.length; s++) {
        seats.push(s);
      }

      seatLists[pool.name].push({
        room: bestBench.room,
        section: bestBench.section,
        row: bestBench.row,
        bench: bestBench.bench,
        seats,
        members: chunk,
      });
    }
  }

  const teamResults: TeamAllocationResult[] = [];
  for (const t of pools) {
    const seats = seatLists[t.name] || [];
    let score = 0;
    if (seats.length > 0) {
      const rooms = new Set(seats.map((s) => s.room));
      const rows = new Set(seats.map((s) => `${s.room}-${s.row}`));
      const benchIds = new Set(seats.map((s) => `${s.room}-${s.row}-${s.bench}`));
      score = 100 - (rooms.size - 1) * 50 - (rows.size - 1) * 10 - (benchIds.size - 1) * 2;
      score = Math.max(0, score);
    }

    teamResults.push({
      name: t.name,
      members: t.members,
      member_count: t.members.length,
      seats,
      proximity_score: score,
      unallocated: t.members.slice(t.idx),
    });
  }

  const roomView: Record<string, { room_type: string; rows: Record<string, { section: string; benches: any[] }> }> = {};
  for (const b of benches) {
    const room = b.room;
    const row = b.row;
    if (!roomView[room]) {
      roomView[room] = { room_type: b.room_type, rows: {} };
    }
    if (!roomView[room].rows[row]) {
      roomView[room].rows[row] = { section: b.section, benches: [] };
    }

    const benchEntry: any = {
      bench: b.bench,
      capacity: b.capacity,
      assigned: b.assigned,
      is_full: b.assigned.length >= b.capacity,
      is_empty: b.assigned.length === 0,
    };
    if (b.room_type === "open") {
      benchEntry["seat_number"] = b.seat_number;
    }
    roomView[room].rows[row].benches.push(benchEntry);
  }

  const unallocatedTotal = teamResults.reduce((sum, t) => sum + t.unallocated.length, 0);

  return {
    teams: teamResults,
    room_view: roomView,
    stats: {
      total_teams: teams.length,
      total_members: totalMembers,
      total_capacity: totalCapacity,
      allocated: totalMembers - unallocatedTotal,
      unallocated: unallocatedTotal,
      rooms_used: Object.keys(roomView).length,
    },
  };
}

export async function getTeamsForAllocation(hackathonId: number): Promise<TeamAllocationInput[]> {
  const teams = await prisma.participant_team.findMany({
    where: { hackathon_id: hackathonId },
    include: {
      accounts_user: true, // leader
      participant_teammember: true, // guest members
    },
  });

  const finalTeams: TeamAllocationInput[] = [];

  for (const team of teams) {
    const members: string[] = [];
    if (team.accounts_user) {
      members.push(team.accounts_user.email);
    }
    for (const m of team.participant_teammember) {
      members.push(m.name || m.email);
    }

    if (members.length > 0) {
      finalTeams.push({
        name: team.name,
        members,
      });
    }
  }

  return finalTeams;
}
