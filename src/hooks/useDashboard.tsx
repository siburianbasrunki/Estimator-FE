import { useQuery } from "@tanstack/react-query";
import type { EstimationMonthlyPayload } from "../model/dasboard";
import DashboardService from "../service/dashboard";

export function useEstimationMonthly(months = 7) {
  return useQuery<EstimationMonthlyPayload>({
    queryKey: ["estimation-monthly", months],
    queryFn: () => DashboardService.fetchDashboardData(months),
    staleTime: 5 * 60 * 1000,
  });
}
