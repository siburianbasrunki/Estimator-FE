import { BiChevronLeft, BiChevronRight, BiEdit, BiTrash } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useEstimations } from "../../hooks/useEstimation";
import { formatDateTime } from "../../helper/date";
import { IoDocument } from "react-icons/io5";
import EmptyState from "../../components/EmptyState";

export const EstimationView = () => {
  const navigate = useNavigate();
  const { data: estimation, isLoading } = useEstimations();

  const isEmpty =
    !isLoading &&
    (!estimation?.data ||
      !Array.isArray(estimation.data) ||
      estimation.data.length === 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">All Estimation</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 text-black placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search..."
              />
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="date"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 text-black rounded-md leading-5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <button
              onClick={() => navigate("/estimation/create")}
              className="btn btn-success text-white"
            >
              Create
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="skeleton h-[400px] w-full bg-gray-50"></div>
        )}

        {!isLoading && isEmpty && (
          <div className="p-4">
            <EmptyState
              title="Belum ada Estimation"
              description="Mulai dengan membuat estimation baru"
            />
          </div>
        )}

        {/* Table */}
        {!isLoading && !isEmpty && (
          <>
            <div className="overflow-x-auto">
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
                      Dibuat Oleh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>

                {estimation?.data.map((item) => (
                  <tbody
                    key={item.id}
                    className="bg-white divide-y divide-gray-200"
                  >
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.projectName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.projectOwner || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(item.createdAt) || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <p className="font-bold text-gray-700 text-sm">
                            {item.author.name || "-"}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {item.author.email || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-400">
                          Submitted
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <IoDocument
                            className="text-blue-600 h-5 w-5 cursor-pointer"
                            onClick={() => navigate(`/estimation/${item.id}`)}
                          />
                          <BiTrash className="text-red-600 h-5 w-5 cursor-pointer" />
                          <BiEdit
                            className="text-blue-600 h-5 w-5 cursor-pointer"
                            onClick={() =>
                              navigate(`/estimation/update/${item.id}`)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                ))}
              </table>
            </div>

            {/* Pagination (tetap sama) */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <a
                  href="#"
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </a>
                <a
                  href="#"
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </a>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {estimation?.pagination.total}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {estimation?.pagination.limit}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {estimation?.pagination.total}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <a
                      href="#"
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Previous</span>
                      <BiChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </a>
                    <a
                      href="#"
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Next</span>
                      <BiChevronRight className="w-5 h-5" aria-hidden="true" />
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
