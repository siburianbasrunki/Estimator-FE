import { useMemo, useRef, useState } from "react";
import {
  BiChevronLeft,
  BiChevronRight,
  BiEdit,
  BiPlus,
  BiTrash,
  BiUpload,
} from "react-icons/bi";
import {
  useCreateHspItem,
  useDeleteHspItem,
  useGetAllHsp,
  useGetCategoryJob,
  useImportHsp,
  useUpdateHspItem,
} from "../../hooks/useHsp";
import toast from "react-hot-toast";
import { IoDocument } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

type ItemType = {
  kode: string;
  deskripsi: string;
  satuan: string;
  harga: number;
};

type HspDataMap = Record<string, ItemType[]>;

export const flattenToDropdown = (data: HspDataMap) => {
  return Object.values(data).flatMap((category) =>
    category.map((item) => ({
      kode: item.kode,
      label: `${item.deskripsi} - Rp${item.harga.toLocaleString("id-ID")}/${
        item.satuan
      }`,
      value: item.kode,
      detail: item,
    }))
  );
};

export const HspView = () => {
  const [search, setSearch] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
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

  const { mutate: importHsp, isPending } = useImportHsp();
  const {
    data: allHsp,
    isLoading: isLoadingHsp,
    isError: isErrorHsp,
    error: hspError,
    refetch,
  } = useGetAllHsp();

  const hspData: HspDataMap = useMemo(() => {
    const raw = allHsp as unknown as
      | { data?: HspDataMap }
      | HspDataMap
      | undefined;
    if (!raw) return {};
    return (raw.data ?? raw) as HspDataMap;
  }, [allHsp]);

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

  const onClickImport = () => fileInputRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);

    const ext = file.name.toLowerCase().split(".").pop();
    if (!["xlsx", "csv"].includes(ext || "")) {
      toast.error("File harus .xlsx atau .csv");
      return;
    }

    importHsp(file, {
      onSuccess: (res) => {
        if (res.status === "success") {
          const errors = res.summary?.errors || [];
          if (errors.length) console.warn("Import warnings:", errors);
          toast.success("Import sukses. Data akan dimuat ulang.");
          refetch();
        }
      },
    });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        HSP (Harga Satuan Pekerjaan)
      </h1>

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
                placeholder="Cari kategori / kode / deskripsi / satuan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setOpenCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none"
            >
              <BiPlus className="w-5 h-5" />
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
              className={`inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isPending ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none`}
            >
              <BiUpload className="w-5 h-5" />
              {isPending ? "Importing..." : "Import"}
            </button>
            {selectedFileName && (
              <div className="text-xs text-gray-600 self-center">
                File: <span className="font-medium">{selectedFileName}</span>
              </div>
            )}
          </div>
        </div>

        {isLoadingHsp && (
          <div className="p-6 text-sm text-gray-600">Memuat data HSP...</div>
        )}
        {isErrorHsp && (
          <div className="p-6 text-sm text-red-600">
            Gagal memuat data HSP:{" "}
            {(hspError as Error)?.message || "unknown error"}
          </div>
        )}

        {!isLoadingHsp && !isErrorHsp && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenis Pekerjaan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satuan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(filteredData).length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-6 text-center text-sm text-gray-500"
                      >
                        Tidak ada data yang cocok.
                      </td>
                    </tr>
                  )}

                  {Object.entries(filteredData).map(([kategori, items]) => {
                    return [
                      <tr key={`${kategori}-header`} className="bg-gray-100">
                        <td
                          colSpan={6}
                          className="px-6 py-3 font-bold text-gray-700"
                        >
                          {kategori}
                        </td>
                      </tr>,
                      ...items.map((item, index) => (
                        <tr key={`${kategori}-${item.kode}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.kode}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.deskripsi}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.satuan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rp {Number(item.harga || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-3 justify-end">
                            <IoDocument
                              className="w-5 h-5 text-blue-600 cursor-pointer"
                              onClick={() => navigate(`/hsp/ahsp/${item.kode}`)}
                              title="Lihat AHSP"
                            />
                            <BiEdit
                              className="w-5 h-5 text-amber-600 cursor-pointer"
                              title="Edit item"
                              onClick={() =>
                                setOpenEdit({
                                  kode: item.kode,
                                  hspCategoryId:
                                    categories?.find((c) => c.name === kategori)
                                      ?.id ?? "",
                                  deskripsi: item.deskripsi,
                                  satuan: item.satuan,
                                })
                              }
                            />
                            <BiTrash
                              className="w-5 h-5 text-red-600 cursor-pointer"
                              title="Hapus item"
                              onClick={() => setOpenDelete({ kode: item.kode })}
                            />
                          </td>
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <p className="text-sm text-gray-700">
                  Total kategori:{" "}
                  <span className="font-medium">
                    {Object.keys(hspData || {}).length}
                  </span>
                </p>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <span className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-400">
                    <BiChevronLeft className="w-5 h-5" />
                  </span>
                  <span className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-400">
                    <BiChevronRight className="w-5 h-5" />
                  </span>
                </nav>
              </div>
            </div>
          </>
        )}
      </div>
      {openCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-lg shadow w-full max-w-lg">
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
                    toast.error("Kategori, Kode, dan Deskripsi wajib diisi");
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
      {openEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-lg shadow w-full max-w-lg">
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
              <p className="text-xs text-gray-500">
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
                    toast.error("Kategori, Kode, dan Deskripsi wajib diisi");
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
      {openDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-lg shadow w-full max-w-md">
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
