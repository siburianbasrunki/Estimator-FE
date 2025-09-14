import { BiChevronLeft, BiChevronRight, BiEdit, BiTrash } from "react-icons/bi";
import { IoDocument } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useEstimations, useDeleteEstimation } from "../../hooks/useEstimation";
import { formatDateTime } from "../../helper/date";
import EmptyState from "../../components/EmptyState";
import { useConfirm } from "../../components/ConfirmDialog";
import useDebounce from "../../hooks/useDebunce";
import Skeleton from "../../components/Skeleton";

export const EstimationView = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    data: estimation,
    isLoading,
    isFetching,
  } = useEstimations(page, limit, debouncedSearch);

  const { mutateAsync: deleteEstimation, isPending } = useDeleteEstimation();

  const showSkeleton = isLoading || isFetching;

  const isEmpty =
    !showSkeleton &&
    (!estimation?.data ||
      !Array.isArray(estimation.data) ||
      estimation.data.length === 0);

  const total = estimation?.pagination?.total ?? 0;
  const totalPages = estimation?.pagination?.totalPages ?? 1;

  const rangeText = useMemo(() => {
    if (!estimation?.data?.length) return "Showing 0 of 0 results";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `Showing ${start}–${end} of ${total} results`;
  }, [estimation?.data?.length, page, limit, total]);

  const onDelete = async (id: string, name?: string) => {
    const ok = await confirm({
      title: "Hapus Estimation?",
      description: `Estimation "${
        name || "-"
      }" akan dihapus secara permanen beserta semua itemnya. Lanjutkan?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      variant: "danger",
    });
    if (!ok) return;
    await deleteEstimation(id);
  };

  // Reset ke page 1 saat ganti search
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        Semua Rancangan Biaya
      </h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="w-full md:w-[380px]">
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 text-black placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="cari berdasarkan nama judul..."
              />
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 text-black rounded-md leading-5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => navigate("/estimation/create")}
              className="btn btn-success text-white"
            >
              + Tambah
            </button>
          </div>
        </div>

        {/* Loading (skeleton table) */}
        {showSkeleton && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Judul Project",
                      "Penanggung Jawab",
                      "Dibuat Pada",
                      "Dibuat Oleh",
                      "Status",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          i === 5 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton.Line width="w-56" height="h-4" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton.Line width="w-40" height="h-4" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton.Line width="w-32" height="h-4" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <Skeleton.Line width="w-32" height="h-4" />
                          <Skeleton.Line width="w-44" height="h-3" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton.Line width="w-20" height="h-5" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-end gap-3">
                          <Skeleton.Circle width="w-5" height="h-5" />
                          <Skeleton.Circle width="w-5" height="h-5" />
                          <Skeleton.Circle width="w-5" height="h-5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer skeleton */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <Skeleton.Line width="w-52" height="h-4" />
              <div className="flex items-center gap-2">
                <Skeleton.Line
                  width="w-8"
                  height="h-8"
                  className="rounded-md"
                />
                <Skeleton.Line width="w-24" height="h-4" />
                <Skeleton.Line
                  width="w-8"
                  height="h-8"
                  className="rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty */}
        {!showSkeleton && isEmpty && (
          <div className="p-4">
            <EmptyState
              title="Belum ada Estimation"
              description="Mulai dengan membuat estimation baru"
            />
          </div>
        )}

        {/* Table */}
        {!showSkeleton && !isEmpty && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Judul Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Penanggung Jawab
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dibuat Pada
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

                <tbody className="bg-white divide-y divide-gray-200">
                  {estimation?.data.map((item: any, idx: number) => {
                    const rowNumber = (page - 1) * limit + idx + 1;
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rowNumber}
                        </td>
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
                              {item.author?.name || "-"}
                            </p>
                            <p className="text-gray-500 text-sm">
                              {item.author?.email || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-400">
                            Submitted
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-3 justify-end">
                            <IoDocument
                              className="text-blue-600 h-5 w-5 cursor-pointer"
                              title="Detail"
                              onClick={() => navigate(`/estimation/${item.id}`)}
                            />
                            <BiEdit
                              className="text-green-600 h-5 w-5 cursor-pointer"
                              title="Edit"
                              onClick={() =>
                                navigate(`/estimation/update/${item.id}`, {
                                  state: { openStep: "step2" },
                                })
                              }
                            />
                            <BiTrash
                              className={`h-5 w-5 cursor-pointer ${
                                isPending ? "text-red-300" : "text-red-600"
                              }`}
                              title="Delete"
                              onClick={() =>
                                onDelete(item.id, item.projectName)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer & Pagination */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <p className="text-sm text-gray-700">{rangeText}</p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <BiChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  disabled={page >= (totalPages || 1)}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages || 1, p + 1))
                  }
                  className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <BiChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EstimationView;
