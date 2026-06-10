import { describe, it, expect } from "vitest";
import { buildBenchList, allocate, RoomConfig, TeamAllocationInput } from "../lib/services/seating";

describe("Seating Allocation Service", () => {
  describe("buildBenchList", () => {
    it("should build benches for configured room layout", () => {
      const config: RoomConfig[] = [
        {
          room_no: "Room 101",
          type: "configured",
          columns: [
            { bench_count: 2, capacity: 4 }, // Col 1: 2 benches of 4 seats each
          ],
        },
      ];

      const benches = buildBenchList(config);
      expect(benches).toHaveLength(2);
      expect(benches[0]).toEqual(
        expect.objectContaining({
          room: "Room 101",
          room_type: "configured",
          row: "R1",
          row_number: 1,
          bench: 1,
          capacity: 4,
          assigned: [],
        })
      );
      expect(benches[1]).toEqual(
        expect.objectContaining({
          row: "R2",
          row_number: 2,
          bench: 1,
          capacity: 4,
        })
      );
    });

    it("should build benches for open seating room layout", () => {
      const config: RoomConfig[] = [
        {
          room_no: "Auditorium",
          type: "open",
          total_seats: 5,
          seats_per_row: 3,
        },
      ];

      const benches = buildBenchList(config);
      expect(benches).toHaveLength(5);
      expect(benches[0]).toEqual(
        expect.objectContaining({
          room: "Auditorium",
          room_type: "open",
          row: "R1",
          row_number: 1,
          bench: 1,
          seat_number: 1,
          capacity: 1,
        })
      );
      // Row 2 starts after 3 seats
      expect(benches[3]).toEqual(
        expect.objectContaining({
          row: "R2",
          row_number: 2,
          bench: 1,
          seat_number: 4,
          capacity: 1,
        })
      );
    });
  });

  describe("allocate", () => {
    it("should allocate teams to benches in the same room if space permits", () => {
      const roomConfig: RoomConfig[] = [
        {
          room_no: "Lab A",
          type: "configured",
          columns: [
            { bench_count: 3, capacity: 2 },
          ],
        },
      ];

      const teams: TeamAllocationInput[] = [
        {
          name: "Team Alpha",
          members: ["alpha1@example.com", "alpha2@example.com"],
        },
        {
          name: "Team Beta",
          members: ["beta1@example.com"],
        },
      ];

      const result = allocate(teams, roomConfig);
      
      // Verification of total stats
      expect(result.stats.total_teams).toBe(2);
      expect(result.stats.total_members).toBe(3);
      expect(result.stats.allocated).toBe(3);
      expect(result.stats.unallocated).toBe(0);

      // Check Team Alpha allocation (should fit exactly on a single bench)
      const alphaAlloc = result.teams.find((t) => t.name === "Team Alpha");
      expect(alphaAlloc).toBeDefined();
      expect(alphaAlloc?.unallocated).toHaveLength(0);
      expect(alphaAlloc?.seats).toHaveLength(1);
      expect(alphaAlloc?.seats[0].seats).toEqual([1, 2]);

      // Check Team Beta allocation
      const betaAlloc = result.teams.find((t) => t.name === "Team Beta");
      expect(betaAlloc).toBeDefined();
      expect(betaAlloc?.seats).toHaveLength(1);
    });

    it("should calculate correct proximity score", () => {
      const roomConfig: RoomConfig[] = [
        {
          room_no: "Lab A",
          type: "configured",
          columns: [
            { bench_count: 5, capacity: 2 },
          ],
        },
      ];

      // A team of 3 members will take 2 benches in the same room and same row or adjacent rows
      const teams: TeamAllocationInput[] = [
        {
          name: "Giant Team",
          members: ["m1", "m2", "m3"],
        },
      ];

      const result = allocate(teams, roomConfig);
      const giantTeam = result.teams.find((t) => t.name === "Giant Team");
      expect(giantTeam).toBeDefined();
      
      // Proximity score formula: max(0, 100 - (rooms-1)*50 - (rows-1)*10 - (benches-1)*2)
      // Since it's in 1 room, 2 rows, and 2 benches:
      // score = 100 - 0 - (2-1)*10 - (2-1)*2 = 100 - 10 - 2 = 88
      expect(giantTeam?.proximity_score).toBe(88);
    });
  });
});
