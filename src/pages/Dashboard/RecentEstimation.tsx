import EmptyState from "../../components/EmptyState";
import { useEstimations } from "../../hooks/useEstimation";

export const RecentEstimation = () => {
  const { data: estimation, isLoading } = useEstimations();
  const isEmpty =
    !isLoading &&
    (!estimation?.data ||
      !Array.isArray(estimation.data) ||
      estimation.data.length === 0);

  return (
    <div className="overflow-x-auto">
      {!isLoading && isEmpty && (
        <div>
          <EmptyState
            title="Belum ada Estimation"
          />
        </div>
      )}
      {!isLoading && !isEmpty && (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Title Project
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Project Owner
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Pembagunan Rumah Kepala Desa
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Basrunki Siburian
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                2023-05-15
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Completed
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};
