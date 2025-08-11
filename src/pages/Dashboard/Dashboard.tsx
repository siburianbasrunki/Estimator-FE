import { useQuery } from "@tanstack/react-query";
import { TbReportAnalytics } from "react-icons/tb";
import StatsCard from "../../components/Chart/Stats";
import LineChart from "../../components/Chart/Line";
import { RecentEstimation } from "./RecentEstimation";

const fetchDashboardData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    revenue: 89542,
    orders: 367,
    stats: [65, 59, 80, 81, 56, 55, 40],
  };
};

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Welcome👋,"
          fontSizeTitle="font-[900] text-2xl"
          value="Basrunki Siburian"
        />
        <StatsCard
          title="All Estimation"
          fontSizeTitle="font-[900] text-lg"
          value="20"
          icon={<TbReportAnalytics className="w-6 h-6 text-green-500" />}
        />
        <StatsCard
          title="Draft"
          fontSizeTitle="font-[900] text-lg"
          value="10"
          icon={<TbReportAnalytics className="w-6 h-6 text-blue-500" />}
        />
        <StatsCard
          title="Submitted"
          fontSizeTitle="font-[900] text-lg"
          value="10"
          icon={<TbReportAnalytics className="w-6 h-6 text-purple-500" />}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 ">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-black">
            Total budget for all estimates per month
          </h2>
          <LineChart data={data?.stats || []} />
        </div>
      </div>
      <div className="mt-4">
        <h2 className="mb-4 text-lg font-semibold text-black">Recent Estimation</h2>
        <RecentEstimation />
      </div>
    </div>
  );
};

export default Dashboard;
