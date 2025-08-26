import { TbReportAnalytics } from "react-icons/tb";
import StatsCard from "../../components/Chart/Stats";
import LineChart from "../../components/Chart/Line";
import { RecentEstimation } from "./RecentEstimation";
import { useProfile } from "../../hooks/useProfile";
import { useEstimations } from "../../hooks/useEstimation";
import { useEstimationMonthly } from "../../hooks/useDashboard";
import Skeleton from "../../components/Skeleton";

const Dashboard = () => {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: estimation } = useEstimations();
  const { data: monthly, isLoading: isLoadingMonthly } =
    useEstimationMonthly(12);

  if (isLoadingProfile || isLoadingMonthly) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Dashboard</h1>

        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-2">
          <div className="p-4 bg-white rounded-lg shadow">
            <Skeleton width="w-32" height="h-6" />
            <Skeleton width="w-20" height="h-4" className="mt-2" />
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <Skeleton width="w-40" height="h-6" />
            <Skeleton width="w-16" height="h-4" className="mt-2" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <Skeleton width="w-60" height="h-6" />
          <Skeleton width="w-full" height="h-40" className="mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-2">
        <StatsCard
          title="Welcome👋,"
          fontSizeTitle="font-[900] text-2xl"
          value={profile?.name || ""}
        />
        <StatsCard
          title="your estimation"
          fontSizeTitle="font-[900] text-lg"
          value={estimation?.pagination?.total || 0}
          icon={<TbReportAnalytics className="w-6 h-6 text-green-500" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 ">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-black">
            Total budget for all estimates per month
          </h2>
          <LineChart
            data={monthly?.series ?? []}
            labels={monthly?.labels ?? []}
            datasetLabel="Total (incl. PPN)"
          />
        </div>
      </div>

      <div className="mt-4">
        <h2 className="mb-4 text-lg font-semibold text-black">
          Recent Estimation
        </h2>
        <RecentEstimation />
      </div>
    </div>
  );
};

export default Dashboard;
