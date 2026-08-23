/**
 * React Query hooks for the Leaderboard module.
 * Provides automated data fetching and caching for top point earners.
 */
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "@/api/client/errors";
import { queryKeys } from "@/api/client/query-keys";
import { leaderboardService } from "../services/leaderboard.service";
import type { LeaderboardEntry } from "../types";

/** GET /api/v1/leaderboard */
export function useLeaderboardQuery(
  limit: number = 10,
  options?: Omit<UseQueryOptions<LeaderboardEntry[], ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<LeaderboardEntry[], ApiError>({
    queryKey: queryKeys.leaderboard.get(limit),
    queryFn: () => leaderboardService.getLeaderboard(limit),
    staleTime: 30_000,
    ...options,
  });
}

