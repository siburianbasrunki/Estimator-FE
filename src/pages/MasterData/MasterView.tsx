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

const LABEL: Record<MasterType, string> = {
  LABOR: "Upah / Tenaga",
  MATERIAL: "Bahan",
  EQUIPMENT: "Peralatan",
  OTHER: "Lain-lain",
};

type Props = { type: MasterType };

/* Small pagination helper */
const usePageWindow = (page: number, last: number, span = 5) => {
  const half = Math.floor(span / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(last, start + span - 1);
  start = Math.max(1, Math.min(start, end - span + 1));
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

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
  const windowPages = usePageWindow(page, lastPage, 7);

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

  return (
    <div className="space-y-6">
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

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead className=" top-0 z-10 bg-gray-50">
            <tr className="text-left text-sm text-gray-600">
              <th className="px-4 py-3 font-medium">Kode</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Satuan</th>
              <th className="px-4 py-3 font-medium">Harga</th>
              {type === "LABOR" && (
                <>
                  <th className="px-4 py-3 font-medium">/Jam</th>
                  <th className="px-4 py-3 font-medium">/Hari</th>
                </>
              )}
              <th className="px-4 py-3 font-medium">Keterangan</th>
              <th className="w-[120px] px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr>
                <td
                  colSpan={type === "LABOR" ? 7 : 5}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Memuat…
                </td>
              </tr>
            )}

            {!list.isLoading && (list.data?.data?.length || 0) === 0 && (
              <tr>
                <td
                  colSpan={type === "LABOR" ? 7 : 5}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Tidak ada data
                </td>
              </tr>
            )}

            {list.data?.data?.map((it) => (
              <tr key={it.id} className="rounded-xl bg-white  ">
                <td className="rounded-l-xl px-4 py-3 text-sm text-black">
                  {it.code}
                </td>
                <td className="px-4 py-3 text-sm text-black">{it.name}</td>
                <td className="px-4 py-3 text-sm text-black">{it.unit}</td>
                <td className="px-4 py-3 text-sm text-black">
                  {formatIDR(it.price)}
                </td>

                {type === "LABOR" && (
                  <>
                    <td className="px-4 py-3 text-sm text-black">
                      {it.hourlyRate != null ? formatIDR(it.hourlyRate) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {it.dailyRate != null ? formatIDR(it.dailyRate) : "-"}
                    </td>
                  </>
                )}

                <td className="px-4 py-3 text-sm text-black">
                  {it.notes ?? "-"}
                </td>
                <td className="rounded-r-xl px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(it)}
                      className="cursor-pointer  rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 transition hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(it.id)}
                      className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">
          Menampilkan{" "}
          <span className="font-medium text-black">
            {startIdx}-{endIdx}
          </span>{" "}
          dari <span className="font-medium text-black">{total}</span> data
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={page <= 1 || list.isFetching}
            onClick={() => setPage(1)}
          >
            «
          </button>
          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={page <= 1 || list.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>

          {windowPages[0] > 1 && (
            <span className="px-1 text-sm text-gray-500">…</span>
          )}
          {windowPages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={
                p === page
                  ? "rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              }
              disabled={list.isFetching}
            >
              {p}
            </button>
          ))}
          {windowPages[windowPages.length - 1] < lastPage && (
            <span className="px-1 text-sm text-gray-500">…</span>
          )}

          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={page >= lastPage || list.isFetching}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            ›
          </button>
          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={page >= lastPage || list.isFetching}
            onClick={() => setPage(lastPage)}
          >
            »
          </button>
        </div>
      </div>

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
