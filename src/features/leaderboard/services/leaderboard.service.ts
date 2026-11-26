/**
 * Type-safe service functions for the Leaderboard module.
 * Communicates with the backend /api/v1/leaderboard endpoint.
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { LeaderboardEntry, LeaderboardResponse } from "../types";

const { leaderboard: leaderboardEndpoint } = API_ENDPOINTS;

/**
 * GET /api/v1/leaderboard — retrieves top-ranked employees by points directly
 * from the canonical backend database, ensuring real and consistent points across
 * both Admin and Employee panels.
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const res = await http.get<LeaderboardResponse | LeaderboardEntry[]>(
    leaderboardEndpoint.get,
    { params: { limit } },
  );

  let rawList: LeaderboardEntry[] = [];
  if (res && typeof res === "object" && "leaderboard" in res) {
    rawList = (res as LeaderboardResponse).leaderboard;
  } else if (Array.isArray(res)) {
    rawList = res;
  }

  // Ensure numerical points and clean sorting by real database points
  const sorted = [...rawList]
    .map((entry) => ({
      ...entry,
      points: typeof entry.points === "number" ? entry.points : Number(entry.points) || 0,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      const bTasks = (b.completedTasks ?? b.completedTasksCount ?? 0) as number;
      const aTasks = (a.completedTasks ?? a.completedTasksCount ?? 0) as number;
      return bTasks - aTasks;
    });

  // Re-assign accurate ranks based on real points
  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export const leaderboardService = {
  getLeaderboard,
};
