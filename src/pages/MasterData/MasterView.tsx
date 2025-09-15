import React, { useEffect } from "react";
import type { MasterItem, MasterType } from "../../model/master";
import {
  useCreateMaster,
  useDeleteMasterByCode,
  useListMaster,
  useUpdateMasterByCode,
  useImportMaster,
} from "../../hooks/useMaster";
import { MasterForm } from "./MasterForm";
import { formatIDR } from "../../helper/rupiah";
import {
  BiEdit,
  BiTrash,
  BiChevronLeft,
  BiChevronRight,
  BiUpload,
  BiDownload,
} from "react-icons/bi";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import useDebunce from "../../hooks/useDebunce";
import { useProfile } from "../../hooks/useProfile";
import FileTemplateUpah from "../../assets/templateFile/templateUpah.xlsx";
import FileTemplateBahan from "../../assets/templateFile/templateBahan.xlsx";

const LABEL: Record<MasterType, string> = {
  LABOR: "Upah / Tenaga",
  MATERIAL: "Bahan",
  EQUIPMENT: "Peralatan",
  OTHER: "Lain-lain",
};

type Props = { type: MasterType };

export const MasterView: React.FC<Props> = ({ type }) => {
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebunce(q, 400);

  const [orderBy, setOrderBy] = React.useState<"code" | "name" | "price">(
    "code"
  );
  const [orderDir, setOrderDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const templateHref =
    type === "LABOR"
      ? FileTemplateUpah
      : type === "MATERIAL"
      ? FileTemplateBahan
      : undefined;

  const templateFileName =
    type === "LABOR"
      ? "template-upah.xlsx"
      : type === "MATERIAL"
      ? "template-bahan.xlsx"
      : "template.xlsx";
  const list = useListMaster(type, {
    q: debouncedQ,
    page,
    pageSize,
    orderBy,
    orderDir,
  });

  const createMut = useCreateMaster(type);
  const updateByCodeMut = useUpdateMasterByCode(type);
  const deleteByCodeMut = useDeleteMasterByCode(type);
  const importMut = useImportMaster(type);
  const profile = useProfile();
  const isAdmin = profile?.data?.role === "ADMIN";

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<MasterItem | null>(null);
  const [openImport, setOpenImport] = React.useState(false);

  // opsi import
  const [file, setFile] = React.useState<File | null>(null);
  const [useHargaFile, setUseHargaFile] = React.useState(true);
  const [lockExistingPrice, setLockExistingPrice] = React.useState(true);
  const [preferDaily, setPreferDaily] = React.useState(true); // hanya LABOR
  const [importResult, setImportResult] = React.useState<any>(null);

  const total = list.data?.pagination.total || 0;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  const onCreate = async (payload: any) => {
    await createMut.mutateAsync(payload);
    setOpenCreate(false);
  };

  const onUpdate = async (payload: any) => {
    if (!editing) return;
    await updateByCodeMut.mutateAsync({ code: editing.code, payload });
    setEditing(null);
  };

  const onDelete = async (code: string) => {
    const ok = confirm("Yakin hapus item ini?");
    if (!ok) return;
    try {
      await deleteByCodeMut.mutateAsync({ code });
    } catch (e: any) {
      alert(e.message || "Gagal menghapus");
    }
  };

  const doImport = async () => {
    if (!file) {
      alert("Pilih file .xlsx/.csv terlebih dahulu");
      return;
    }
    const res = await importMut.mutateAsync({
      file,
      useHargaFile,
      lockExistingPrice,
      preferDaily,
    });
    setImportResult(res?.summary);
  };

  const resetImport = () => {
    setFile(null);
    setUseHargaFile(true);
    setLockExistingPrice(true);
    setPreferDaily(true);
    setImportResult(null);
  };

  // Loading flags: bedakan load pertama vs refetch ringan
  const initialLoading = list.isLoading && !list.data;
  const refetching = list.isFetching && !!list.data;

  // Reset ke page 1 hanya setelah nilai yang SUDAH di-debounce berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              {(type === "MATERIAL" || type === "LABOR") && (
                <>
                  <button
                    onClick={() => {
                      resetImport();
                      setOpenImport(true);
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span className="inline-flex items-center gap-2">
                      <BiUpload className="w-4 h-4" /> Import
                    </span>
                  </button>

                  {templateHref && (
                    <a
                      href={templateHref}
                      download={templateFileName}
                      className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2"
                    >
                      <span className="inline-flex items-center gap-2">
                        <BiDownload className="w-4 h-4" /> Template
                      </span>
                    </a>
                  )}
                </>
              )}
            </>
          )}

          <button
            onClick={() => setOpenCreate(true)}
            className="rounded-lg bg-green-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            + Tambah
          </button>
        </div>
      </div>

      {/* Toolbar (filters) */}
      {initialLoading ? (
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
                onChange={(e) => setQ(e.target.value)} // jangan reset page di sini
              />
              {refetching && (
                <span className="text-xs text-gray-500">Mencari…</span>
              )}
              {q && !refetching && (
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

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No.
              </th>
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

          {initialLoading ? (
            <TableSkeletonRows cols={type === "LABOR" ? 8 : 6} />
          ) : (
            <tbody className="bg-white divide-y divide-gray-200">
              {(list.data?.data?.length || 0) === 0 && (
                <tr>
                  <td
                    colSpan={type === "LABOR" ? 8 : 6}
                    className="px-6 py-6 text-center text-gray-500 text-sm"
                  >
                    <EmptyState
                      title="Belum ada data"
                      description="Mulai dengan membuat data baru"
                    />
                  </td>
                </tr>
              )}

              {list.data?.data?.map((it) => (
                <tr key={it.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {list.data?.data.indexOf(it) + 1 + (page - 1) * pageSize}
                  </td>
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
                        className="w-5 h-5 text-green-600 cursor-pointer"
                        title="Edit"
                        onClick={() => setEditing(it)}
                      />
                      <BiTrash
                        className="w-5 h-5 text-red-600 cursor-pointer"
                        title="Hapus"
                        onClick={() => onDelete(it.code)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* Footer & Pagination */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {initialLoading ? (
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

      {/* Import Modal */}
      {openImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 text-lg font-semibold text-black">
              Import {LABEL[type]} (.xlsx / .csv)
            </div>

            <div className="space-y-4">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm text-black"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-black">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useHargaFile}
                    onChange={(e) => setUseHargaFile(e.target.checked)}
                  />
                  Gunakan harga dari file
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={lockExistingPrice}
                    onChange={(e) => setLockExistingPrice(e.target.checked)}
                  />
                  Kunci harga yang sudah ada
                </label>
                {type === "LABOR" && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={preferDaily}
                      onChange={(e) => setPreferDaily(e.target.checked)}
                    />
                    Prioritaskan harga /Hari (jika ada)
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setOpenImport(false);
                    resetImport();
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  disabled={importMut.isPending}
                  onClick={doImport}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {importMut.isPending ? "Mengimpor..." : "Import"}
                </button>
              </div>

              {/* Hasil Import */}
              {importResult && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
                  <div className="font-semibold mb-2">Ringkasan</div>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>
                      created (GLOBAL): {importResult.counts.created_global}
                    </li>
                    <li>
                      updated (GLOBAL): {importResult.counts.updated_global}
                    </li>
                    <li>created (USER): {importResult.counts.created_user}</li>
                    <li>updated (USER): {importResult.counts.updated_user}</li>
                    <li>
                      updated user price:{" "}
                      {importResult.counts.updated_user_price}
                    </li>
                  </ul>

                  {Array.isArray(importResult.errors) &&
                    importResult.errors.length > 0 && (
                      <>
                        <div className="font-semibold mt-3">Errors</div>
                        <div className="max-h-48 overflow-auto rounded border bg-white">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-3 py-2 text-left">
                                  Kunci/Kode
                                </th>
                                <th className="px-3 py-2 text-left">Alasan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importResult.errors.map((e: any, i: number) => (
                                <tr key={i} className="border-t">
                                  <td className="px-3 py-2">
                                    {e.key || e.code || "-"}
                                  </td>
                                  <td className="px-3 py-2">{e.reason}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
