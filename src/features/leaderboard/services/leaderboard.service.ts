/**
 * Type-safe service functions for the Leaderboard module.
 * Communicates with the backend /api/v1/leaderboard endpoint.
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { LeaderboardEntry, LeaderboardResponse } from "../types";

const { leaderboard: leaderboardEndpoint } = API_ENDPOINTS;

/** GET /api/v1/leaderboard — retrieves top-ranked employees by points. */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const res = await http.get<LeaderboardResponse | LeaderboardEntry[]>(
    leaderboardEndpoint.get,
    { params: { limit } },
  );
  if (res && typeof res === "object" && "leaderboard" in res) {
    return (res as LeaderboardResponse).leaderboard;
  }
  return Array.isArray(res) ? res : [];
}

export const leaderboardService = {
  getLeaderboard,
};

