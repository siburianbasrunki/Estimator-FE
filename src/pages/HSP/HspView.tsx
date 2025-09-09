import { useEffect, useMemo, useRef, useState } from "react";
import { BiEdit, BiPlus, BiTrash, BiUpload } from "react-icons/bi";
import {
  useCreateHspItem,
  useDeleteHspItem,
  useGetAllHsp,
  useGetCategoryJob,
  useImportHsp,
  useUpdateHspItem,
} from "../../hooks/useHsp";
import { IoDocument } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import { useNotify } from "../../components/Notify/notify";
import { useProfile } from "../../hooks/useProfile";

type ItemType = {
  kode: string;
  deskripsi: string;
  satuan: string;
  harga: number;
};

type HspDataMap = Record<string, ItemType[]>;

export const HspView = () => {
  const [search, setSearch] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const notify = useNotify();
  const { data: categories } = useGetCategoryJob();
  const createItem = useCreateHspItem();
  const updateItem = useUpdateHspItem();
  const deleteItem = useDeleteHspItem();

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<null | {
    kode: string;
    hspCategoryId: string;
    deskripsi: string;
    satuan: string;
  }>(null);
  const [openDelete, setOpenDelete] = useState<null | { kode: string }>(null);
  const {data: profile} = useProfile();
  console.log('profile', profile?.role);
  
  const { mutate: importHsp, isPending } = useImportHsp();
  const {
    data: allHsp,
    isLoading: isLoadingHsp,
    isError: isErrorHsp,
    error: hspError,
    refetch,
  } = useGetAllHsp();

  // Normalisasi data ke HspDataMap
  const hspData: HspDataMap = useMemo(() => {
    const raw = allHsp as unknown as
      | { data?: HspDataMap }
      | HspDataMap
      | undefined;
    if (!raw) return {};
    return (raw as any).data ?? (raw as HspDataMap);
  }, [allHsp]);

  // Filter pencarian
  const filteredData: HspDataMap = useMemo(() => {
    if (!hspData || Object.keys(hspData).length === 0) return {};
    if (!search.trim()) return hspData;

    const q = search.toLowerCase();
    return Object.entries(hspData).reduce((acc, [kategori, items]) => {
      const matchKategori = kategori.toLowerCase().includes(q);
      const filtered = items.filter(
        (item) =>
          matchKategori ||
          item.kode.toLowerCase().includes(q) ||
          item.deskripsi.toLowerCase().includes(q) ||
          item.satuan.toLowerCase().includes(q)
      );
      if (filtered.length > 0) acc[kategori] = filtered;
      return acc;
    }, {} as HspDataMap);
  }, [hspData, search]);

  // ===== Pagination =====
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // fixed 10/halaman (bisa kamu ubah kalau perlu)

  useEffect(() => {
    setPage(1);
  }, [search, Object.keys(filteredData).length]);

  const totalItems = useMemo(() => {
    return Object.values(filteredData || {}).reduce(
      (acc, items) => acc + items.length,
      0
    );
  }, [filteredData]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = (page - 1) * pageSize; // inklusif
  const endIdx = Math.min(totalItems, startIdx + pageSize); // eksklusif

  type Row =
    | { type: "header"; kategori: string }
    | { type: "item"; kategori: string; item: ItemType; globalIndex: number };

  const pageRows: Row[] = useMemo(() => {
    const rows: Row[] = [];
    let seen = 0;

    for (const [kategori, items] of Object.entries(filteredData || {})) {
      const catStart = seen;
      const catEnd = seen + items.length;

      const overlapStart = Math.max(startIdx, catStart);
      const overlapEnd = Math.min(endIdx, catEnd);

      if (overlapEnd > overlapStart) {
        rows.push({ type: "header", kategori });
        const fromIndex = overlapStart - catStart;
        const count = overlapEnd - overlapStart;
        const slice = items.slice(fromIndex, fromIndex + count);

        slice.forEach((item, i) => {
          rows.push({
            type: "item",
            kategori,
            item,
            globalIndex: overlapStart + i,
          });
        });
      }

      seen = catEnd;
    }

    return rows;
  }, [filteredData, startIdx, endIdx]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // ===== Import file =====
  const onClickImport = () => fileInputRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);

    const ext = file.name.toLowerCase().split(".").pop();
    if (!["xlsx", "csv"].includes(ext || "")) {
      notify("File harus .xlsx atau .csv", 'info');
      return;
    }

    importHsp(file, {
      onSuccess: (res) => {
        if (res.status === "success") {
          notify("Import sukses. Data akan dimuat ulang.", 'success');
          refetch();
        }
      },
    });
  };

  return (
    <div className="text-black">
      <h1 className="mb-6 text-2xl font-bold">HSP (Harga Satuan Pekerjaan)</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="w-full md:w-auto">
            <input
              type="text"
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 text-black placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Cari kategori / kode / deskripsi / satuan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setOpenCreate(true)}
              className="px-4 py-2 rounded-md text-sm text-white bg-green-400 hover:bg-green-500 cursor-pointer"
            >
              <BiPlus className="inline-block mr-1" />
              Tambah Item
            </button>

            <input
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              ref={fileInputRef}
              onChange={onFileChange}
            />
            <button
              onClick={onClickImport}
              disabled={isPending}
              className={`px-4 py-2 rounded-md text-sm text-white ${
                isPending
                  ? "bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >
              <BiUpload className="inline-block mr-1" />
              {isPending ? "Importing..." : "Import"}
            </button>

            {selectedFileName && (
              <div className="text-xs self-center">
                File: <span className="font-medium">{selectedFileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoadingHsp && (
          <>
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="w-full md:w-[380px]">
                <Skeleton.Line
                  width="w-full"
                  height="h-10"
                  className="rounded-md"
                />
              </div>
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                <Skeleton.Line
                  width="w-40"
                  height="h-10"
                  className="rounded-md"
                />
                <Skeleton.Line
                  width="w-36"
                  height="h-10"
                  className="rounded-md"
                />
                <Skeleton.Line width="w-48" height="h-5" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "No",
                      "Kode",
                      "Jenis Pekerjaan",
                      "Satuan",
                      "Harga",
                      "Aksi",
                    ].map((_, i) => (
                      <th
                        key={i}
                        className="px-6 py-3 text-left text-xs font-medium uppercase"
                      >
                        <Skeleton.Line width="w-20" height="h-4" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 2 })
                    .map((_, k) => (
                      <tr key={`kat-${k}`} className="bg-white">
                        <td colSpan={6} className="px-6 py-3 bg-gray-100">
                          <Skeleton.Line width="w-64" height="h-5" />
                        </td>
                      </tr>
                    ))
                    .concat(
                      Array.from({ length: 8 }).map((_, r) => (
                        <tr key={`row-${r}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton.Line width="w-6" height="h-4" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton.Line width="w-20" height="h-4" />
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-end gap-3">
                              <Skeleton.Circle width="w-5" height="h-5" />
                              <Skeleton.Circle width="w-5" height="h-5" />
                              <Skeleton.Circle width="w-5" height="h-5" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-white border-t border-gray-200" />
          </>
        )}

        {/* Error */}
        {isErrorHsp && (
          <div className="p-6 text-sm">
            Gagal memuat data HSP:{" "}
            {(hspError as Error)?.message || "unknown error"}
          </div>
        )}

        {/* Content */}
        {!isLoadingHsp && !isErrorHsp && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                      Kode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                      Jenis Pekerjaan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                      Satuan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {totalItems === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-center text-sm">
                        <div className="p-4">
                          <EmptyState
                            title="Belum ada Harga Satuan Pekerjaan"
                            description="Mulai dengan membuat HSP baru atau import dari file."
                          />
                        </div>
                      </td>
                    </tr>
                  )}

                  {pageRows.map((row) =>
                    row.type === "header" ? (
                      <tr key={`head-${row.kategori}`} className="bg-gray-100">
                        <td colSpan={6} className="px-6 py-3 font-bold">
                          {row.kategori}
                        </td>
                      </tr>
                    ) : (
                      <tr key={`${row.kategori}-${row.item.kode}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {row.globalIndex + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {row.item.kode}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {row.item.deskripsi}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {row.item.satuan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          Rp{" "}
                          {Number(row.item.harga || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <IoDocument
                            className="w-5 h-5 inline-block mr-2 cursor-pointer text-blue-600"
                            title="Lihat AHSP"
                            onClick={() =>
                              navigate(`/hsp/ahsp/${row.item.kode}`)
                            }
                          />
                          <BiEdit
                            className="w-5 h-5 inline-block mr-2 cursor-pointer text-green-600"
                            title="Edit item"
                            onClick={() =>
                              setOpenEdit({
                                kode: row.item.kode,
                                hspCategoryId:
                                  categories?.find(
                                    (c) => c.name === row.kategori
                                  )?.id ?? "",
                                deskripsi: row.item.deskripsi,
                                satuan: row.item.satuan,
                              })
                            }
                          />
                          <BiTrash
                            className="w-5 h-5 inline-block cursor-pointer text-red-600"
                            title="Hapus item"
                            onClick={() =>
                              setOpenDelete({ kode: row.item.kode })
                            }
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls (style yang kamu minta) */}
            <div className="px-4 py-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm">
                Page {page} of {totalPages}
              </div>
              <div className="inline-flex rounded-md shadow-sm" role="group">
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
                    (p) =>
                      Math.abs(p - page) <= 2 || p === 1 || p === totalPages
                  )
                  .reduce<number[]>((arr, p) => {
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
                          p === totalPages
                            ? "border-r rounded-r-md"
                            : "border-r"
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
          </>
        )}
      </div>

      {/* ===== Create Modal ===== */}
      {openCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow w-full max-w-lg text-black">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Tambah HSP Item</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kategori
                </label>
                <select
                  className="select select-bordered w-full text-black bg-white border-black"
                  defaultValue=""
                  id="create-cat"
                >
                  <option value="" disabled>
                    Pilih kategori
                  </option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kode</label>
                <input
                  id="create-kode"
                  className="input input-bordered w-full text-black bg-white border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Deskripsi
                </label>
                <input
                  id="create-desc"
                  className="input input-bordered w-full text-black bg-white border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Satuan</label>
                <input
                  id="create-satuan"
                  className="input input-bordered w-full text-black bg-white border-black"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setOpenCreate(false)}
              >
                Batal
              </button>
              <button
                className="btn btn-primary text-white"
                onClick={() => {
                  const hspCategoryId =
                    (document.getElementById("create-cat") as HTMLSelectElement)
                      ?.value || "";
                  const kode = (
                    document.getElementById("create-kode") as HTMLInputElement
                  )?.value.trim();
                  const deskripsi = (
                    document.getElementById("create-desc") as HTMLInputElement
                  )?.value.trim();
                  const satuan = (
                    document.getElementById("create-satuan") as HTMLInputElement
                  )?.value.trim();

                  if (!hspCategoryId || !kode || !deskripsi) {
                    notify("Kategori, Kode, dan Deskripsi wajib diisi", 'info');
                    return;
                  }

                  createItem.mutate(
                    { hspCategoryId, kode, deskripsi, satuan },
                    {
                      onSuccess: () => {
                        setOpenCreate(false);
                        refetch();
                      },
                    }
                  );
                }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit Modal ===== */}
      {openEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow w-full max-w-lg text-black">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Edit HSP Item</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kategori
                </label>
                <select
                  id="edit-cat"
                  defaultValue={openEdit.hspCategoryId}
                  className="select select-bordered w-full text-black bg-white border-black"
                >
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kode</label>
                <input
                  id="edit-kode"
                  defaultValue={openEdit.kode}
                  className="input input-bordered w-full text-black bg-white border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Deskripsi
                </label>
                <input
                  id="edit-desc"
                  defaultValue={openEdit.deskripsi}
                  className="input input-bordered w-full text-black bg-white border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Satuan</label>
                <input
                  id="edit-satuan"
                  defaultValue={openEdit.satuan}
                  className="input input-bordered w-full text-black bg-white border-black"
                />
              </div>
              <p className="text-xs">
                Harga tidak dapat diubah di sini. Sistem mempertahankan harga
                yang ada.
              </p>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setOpenEdit(null)}
              >
                Batal
              </button>
              <button
                className="btn btn-primary text-white"
                onClick={() => {
                  const hspCategoryId =
                    (document.getElementById("edit-cat") as HTMLSelectElement)
                      ?.value || "";
                  const kode = (
                    document.getElementById("edit-kode") as HTMLInputElement
                  )?.value.trim();
                  const deskripsi = (
                    document.getElementById("edit-desc") as HTMLInputElement
                  )?.value.trim();
                  const satuan = (
                    document.getElementById("edit-satuan") as HTMLInputElement
                  )?.value.trim();

                  if (!hspCategoryId || !kode || !deskripsi) {
                    notify("Kategori, Kode, dan Deskripsi wajib diisi" , 'info');
                    return;
                  }

                  updateItem.mutate(
                    {
                      kode: openEdit.kode,
                      payload: { hspCategoryId, kode, deskripsi, satuan },
                    },
                    {
                      onSuccess: () => {
                        setOpenEdit(null);
                        refetch();
                      },
                    }
                  );
                }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Modal ===== */}
      {openDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow w-full max-w-md text-black">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Hapus Item</h3>
            </div>
            <div className="p-4">
              <p className="text-sm">
                Yakin menghapus item{" "}
                <span className="font-semibold">{openDelete.kode}</span>?
              </p>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setOpenDelete(null)}
              >
                Batal
              </button>
              <button
                className="btn btn-error text-white"
                onClick={() => {
                  deleteItem.mutate(openDelete.kode, {
                    onSuccess: () => {
                      setOpenDelete(null);
                      refetch();
                    },
                  });
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
