import {  useState } from "react";
import { useGetItemJob } from "../../hooks/useHsp";
import Skeleton from "../../components/Skeleton";

export const ItemJobsView = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const take = 10; // minimal 10 baris
  const skip = (page - 1) * take;

  const { data, isLoading, isError, error, isFetching } = useGetItemJob({
    q: search.trim() || undefined,
    skip,
    take,
    orderBy: "kode",
    orderDir: "asc",
  });

  const rows = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / take));

  // untuk nomor urut tabel
  const startNo = skip + 1;

  const ToolbarSkeleton = () => (
    <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div className="w-full md:w-[380px]">
        <Skeleton.Line width="w-full" height="h-10" className="rounded-md" />
      </div>
    </div>
  );

  const TableSkeleton = () => (
    <tbody className="bg-white divide-y divide-gray-200">
      {Array.from({ length: take }).map((_, i) => (
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

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1); // reset ke halaman 1 setiap ganti kata kunci
  };

  const goToPage = (p: number) => {
    const safe = Math.min(Math.max(1, p), totalPages);
    setPage(safe);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Item Jobs</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Toolbar */}
        {isLoading && !data ? (
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
                  placeholder="Cari kode / deskripsi / satuan / kategori…"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {isFetching
                ? "Memuat…"
                : `Showing ${total ? skip + 1 : 0}–${Math.min(
                    skip + take,
                    total
                  )} of ${total}`}
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
          {isLoading && !data ? (
            <TableSkeleton />
          ) : (
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((item, idx) => (
                <tr key={`${item.id}-${idx}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {startNo + idx}
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
              {!isLoading && rows.length === 0 && (
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

        {/* Pagination controls */}
        <div className="px-4 py-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-black">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="inline-flex rounded-md shadow-sm " role="group">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md disabled:opacity-50 cursor-pointer"
            >
              Prev
            </button>
            {Array.from({ length: totalPages })
              .map((_, i) => i + 1)
              .filter(
                (p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages
              )
              .reduce<number[]>((arr, p, _, ) => {
                if (arr.length === 0) return [p];
                const prev = arr[arr.length - 1];
                if (p - prev > 1) arr.push(-1);
                arr.push(p);
                return arr;
              }, [])
              .map((p, i) =>
                p === -1 ? (
                  <span
                    key={`gap-${i}`}
                    className="px-3 py-2 text-sm border-t border-b border-gray-300 select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`px-3 py-2 text-sm font-medium border-t border-b border-gray-300 cursor-pointer hover:bg-gray-100 ${
                      p === totalPages ? "border-r rounded-r-md" : "border-r"
                    } ${p === page ? "bg-gray-100" : ""}`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-r-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
