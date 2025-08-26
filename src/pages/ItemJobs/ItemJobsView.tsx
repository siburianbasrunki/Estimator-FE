import { useMemo, useState } from "react";
import { useGetItemJob } from "../../hooks/useHsp";
import Skeleton from "../../components/Skeleton";

export const ItemJobsView = () => {
  const [search, setSearch] = useState("");

  const {
    data: itemJob,
    isLoading,
    isError,
    error,
  } = useGetItemJob() as {
    data?: Array<{
      category: { name: string };
      kode: string;
      deskripsi: string;
      satuan: string;
      harga: number;
    }>;
    isLoading?: boolean;
    isError?: boolean;
    error?: unknown;
  };

  const filtered = useMemo(() => {
    const list = itemJob ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (it) =>
        it.category?.name?.toLowerCase().includes(q) ||
        it.kode?.toLowerCase().includes(q) ||
        it.deskripsi?.toLowerCase().includes(q) ||
        it.satuan?.toLowerCase().includes(q)
    );
  }, [itemJob, search]);

  const ToolbarSkeleton = () => (
    <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div className="w-full md:w-[380px]">
        <Skeleton.Line width="w-full" height="h-10" className="rounded-md" />
      </div>
    </div>
  );

  const TableSkeleton = () => (
    <tbody className="bg-white divide-y divide-gray-200">
      {Array.from({ length: 10 }).map((_, i) => (
        <tr key={i}>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton.Line width="w-6" height="h-4" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton.Line width="w-40" height="h-4" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton.Line width="w-24" height="h-4" />
          </td>
          <td className="px-6 py-4">
            <Skeleton.Line width="w-80" height="h-4" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton.Line width="w-16" height="h-4" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton.Line width="w-28" height="h-4" />
          </td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Item Jobs</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Toolbar */}
        {isLoading ? (
          <ToolbarSkeleton />
        ) : (
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="p-4 text-sm text-red-600">
            Gagal memuat data: {(error as any)?.message || "unknown error"}
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deskripsi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satuan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga
              </th>
            </tr>
          </thead>

          {/* Loading skeleton rows */}
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((item, index) => (
                <tr key={`${item.category?.name}-${item.kode}-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.category?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.kode}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                    {item.deskripsi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.satuan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(item.harga || 0).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}

              {/* Empty state */}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-gray-500 text-sm"
                  >
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};
