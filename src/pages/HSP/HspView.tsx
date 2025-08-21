import { useMemo, useRef, useState } from "react";
import { BiChevronLeft, BiChevronRight, BiUpload } from "react-icons/bi";
import { useGetAllHsp, useImportHsp } from "../../hooks/useHsp";
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <IoDocument
                              className="w-5 h-5 text-blue-600 cursor-pointer"
                              onClick={() => navigate(`/hsp/ahsp/${item.kode}`)}
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
    </div>
  );
};
