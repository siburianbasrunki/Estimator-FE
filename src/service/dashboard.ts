import { getEndpoints } from "../config/config";
import type { EstimationMonthlyPayload } from "../model/dasboard";

const DashboardService = {
  fetchDashboardData: async (months = 7): Promise<EstimationMonthlyPayload> => {
    const { dasboard } = getEndpoints(); 
    const url = new URL(`${dasboard}/estimation-monthly`);
    url.searchParams.set("months", String(months));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
};

export default DashboardService;
