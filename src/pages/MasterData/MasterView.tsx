import React from "react";
import type { MasterItem, MasterType } from "../../model/master";
import {
  useCreateMaster,
  useDeleteMaster,
  useListMaster,
  useUpdateMaster,
} from "../../hooks/useMaster";
import { MasterForm } from "./MasterForm";
import { formatIDR } from "../../helper/rupiah";
import { BiEdit, BiTrash, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import Skeleton from "../../components/Skeleton";

const LABEL: Record<MasterType, string> = {
  LABOR: "Upah / Tenaga",
  MATERIAL: "Bahan",
  EQUIPMENT: "Peralatan",
  OTHER: "Lain-lain",
};

type Props = { type: MasterType };

export const MasterView: React.FC<Props> = ({ type }) => {
  const [q, setQ] = React.useState("");
  const [orderBy, setOrderBy] = React.useState<"code" | "name" | "price">(
    "code"
  );
  const [orderDir, setOrderDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const list = useListMaster(type, { q, page, pageSize, orderBy, orderDir });
  const createMut = useCreateMaster(type);
  const updateMut = useUpdateMaster(type);
  const deleteMut = useDeleteMaster(type);

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<MasterItem | null>(null);

  const total = list.data?.pagination.total || 0;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  const onCreate = async (payload: any) => {
    await createMut.mutateAsync(payload);
    setOpenCreate(false);
  };
  const onUpdate = async (payload: any, opts?: { recompute?: boolean }) => {
    if (!editing) return;
    await updateMut.mutateAsync({
      id: editing.id,
      payload,
      recompute: !!opts?.recompute,
    });
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    const ok = confirm("Yakin hapus item ini?");
    if (!ok) return;
    try {
      await deleteMut.mutateAsync({ id });
    } catch (e: any) {
      alert(e.message || "Gagal menghapus");
    }
  };

  const isLoading = list.isLoading || list.isFetching;

  /* ========== Skeletons ========== */
  const ToolbarSkeleton = () => (
    <div className="rounded-xl border border-gray-200 bg-white/70 p-3 backdrop-blur">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Skeleton.Line width="w-20" height="h-3" className="mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton.Line width="w-28" height="h-10" className="rounded-md" />
            <Skeleton.Line width="w-28" height="h-10" className="rounded-md" />
          </div>
        </div>
        <div>
          <Skeleton.Line width="w-24" height="h-3" className="mb-2" />
          <Skeleton.Line width="w-24" height="h-10" className="rounded-md" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Skeleton.Line width="w-72" height="h-10" className="rounded-md" />
          <Skeleton.Line width="w-16" height="h-10" className="rounded-md" />
        </div>
      </div>
    </div>
  );

  const TableSkeletonRows: React.FC<{ cols: number }> = ({ cols }) => (
    <tbody className="bg-white divide-y divide-gray-200">
      {Array.from({ length: 8 }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-6 py-4">
              <Skeleton.Line
                width={c === cols - 1 ? "w-16" : "w-40"}
                height="h-4"
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{LABEL[type]}</h1>
          <p className="text-sm text-gray-600">
            Kelola master data {LABEL[type].toLowerCase()} untuk dipakai di
            AHSP.
          </p>
        </div>
        <button
          onClick={() => setOpenCreate(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          + Tambah
        </button>
      </div>

      {/* Toolbar (filters) – pakai skeleton saat loading */}
      {isLoading ? (
        <ToolbarSkeleton />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white/70 p-3 backdrop-blur">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Urutkan
              </label>
              <div className="mt-1 flex items-center gap-2">
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={orderBy}
                  onChange={(e) => {
                    setOrderBy(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="code">Kode</option>
                  <option value="name">Nama</option>
                  <option value="price">Harga</option>
                </select>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={orderDir}
                  onChange={(e) => {
                    setOrderDir(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="asc">Naik</option>
                  <option value="desc">Turun</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">
                Baris / halaman
              </label>
              <select
                className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <input
                className="w-72 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Cari: kode / nama / satuan"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
              {q && (
                <button
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table — samakan UI dengan Estimation */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satuan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga
              </th>
              {type === "LABOR" && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    /Jam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    /Hari
                  </th>
                </>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keterangan
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>

          {/* Loading skeleton rows */}
          {isLoading ? (
            <TableSkeletonRows cols={type === "LABOR" ? 8 : 6} />
          ) : (
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Empty */}
              {(list.data?.data?.length || 0) === 0 && (
                <tr>
                  <td
                    colSpan={type === "LABOR" ? 8 : 6}
                    className="px-6 py-6 text-center text-gray-500 text-sm"
                  >
                    Tidak ada data
                  </td>
                </tr>
              )}

              {/* Rows */}
              {list.data?.data?.map((it) => (
                <tr key={it.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {it.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {it.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {it.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatIDR(it.price)}
                  </td>

                  {type === "LABOR" && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {it.hourlyRate != null ? formatIDR(it.hourlyRate) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {it.dailyRate != null ? formatIDR(it.dailyRate) : "-"}
                      </td>
                    </>
                  )}

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {it.notes ?? "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-3 justify-end">
                      <BiEdit
                        className="w-5 h-5 text-amber-600 cursor-pointer"
                        title="Edit"
                        onClick={() => setEditing(it)}
                      />
                      <BiTrash
                        className="w-5 h-5 text-red-600 cursor-pointer"
                        title="Hapus"
                        onClick={() => onDelete(it.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* Footer & Pagination – Estimation-like */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <div className="px-4 py-3 flex items-center justify-between">
            <Skeleton.Line width="w-64" height="h-4" />
            <div className="flex items-center gap-2">
              <Skeleton.Line
                width="w-10"
                height="h-10"
                className="rounded-md"
              />
              <Skeleton.Line width="w-24" height="h-4" />
              <Skeleton.Line
                width="w-10"
                height="h-10"
                className="rounded-md"
              />
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <p className="text-sm text-gray-700">
              Menampilkan{" "}
              <span className="font-medium">
                {startIdx}–{endIdx}
              </span>{" "}
              dari <span className="font-medium">{total}</span> data
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || list.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <BiChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {lastPage}
              </span>
              <button
                disabled={page >= lastPage || list.isFetching}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <BiChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 text-lg font-semibold text-black">
              Tambah {LABEL[type]}
            </div>
            <MasterForm
              mode="create"
              type={type}
              onCancel={() => setOpenCreate(false)}
              onSubmit={onCreate}
            />
          </div>
        </div>
      )}

      {/* Edit */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 text-lg font-semibold text-black">
              Edit {LABEL[type]}
            </div>
            <MasterForm
              mode="edit"
              type={type}
              initial={editing}
              onCancel={() => setEditing(null)}
              onSubmit={onUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};
