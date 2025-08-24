import EmptyState from "../../components/EmptyState";
import { useEstimations } from "../../hooks/useEstimation";

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  const styles =
    s === "completed"
      ? "bg-green-100 text-green-800"
      : s === "submitted"
      ? "bg-blue-100 text-blue-800"
      : s === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : s === "rejected"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles}`}
    >
      {status || "-"}
    </span>
  );
}

export const RecentEstimation = () => {
  const { data: estimation, isLoading } = useEstimations();

  const list = Array.isArray(estimation?.data)
    ? estimation!.data.slice(0, 5) 
    : [];

  const isEmpty = !isLoading && list.length === 0;

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toISOString().slice(0, 10) : "-"; 

  return (
    <div className="overflow-x-auto">
      {!isLoading && isEmpty && <EmptyState title="Belum ada Estimation" />}

      {!isLoading && !isEmpty && (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {list.map((e: any) => (
              <tr key={e.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {e.projectName || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {e.projectOwner || e.author?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(e.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isLoading && <div className="text-sm text-gray-500">Loading...</div>}
    </div>
  );
};
