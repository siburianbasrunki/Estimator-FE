import { useEffect, useMemo, useState } from "react";
import {
  useCreateSource,
  useDeleteSource,
  useGetSources,
  useUpdateSource,
} from "../../hooks/useHookFlagSource";
import { useNotify } from "../../components/Notify/notify";
import { BiEdit, BiTrash } from "react-icons/bi";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";

// debounce kecil untuk search
function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

type EditingSource = {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
};

export default function SourceManagement() {
  const notify = useNotify();

  const { data, isLoading, isError, refetch } = useGetSources(true);
  const createMut = useCreateSource();
  const updateMut = useUpdateSource();
  const deleteMut = useDeleteSource();

  // search
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 250);

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter(
      (it) =>
        it.code.toLowerCase().includes(s) || it.label.toLowerCase().includes(s)
    );
  }, [data, q]);

  // modal states
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<EditingSource | null>(null);
  const [openDelete, setOpenDelete] = useState<EditingSource | null>(null);

  // form states (create)
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");

  // actions
  const handleCreate = () => {
    const code = newCode.trim();
    const label = newLabel.trim();
    if (!code || !label) {
      notify("Code dan Label wajib diisi", "info");
      return;
    }
    createMut.mutate(
      { code, label },
      {
        onSuccess: () => {
          notify("Sumber dibuat", "success");
          setOpenCreate(false);
          setNewCode("");
          setNewLabel("");
          refetch();
        },
        onError: (e: any) =>
          notify(e?.message || "Gagal membuat sumber", "error"),
      }
    );
  };

  const handleUpdate = () => {
    if (!openEdit) return;
    const payload = {
      code: openEdit.code.trim(),
      label: openEdit.label.trim(),
      isActive: openEdit.isActive,
    };
    if (!payload.code || !payload.label) {
      notify("Code dan Label wajib diisi", "info");
      return;
    }
    updateMut.mutate(
      { id: openEdit.id, payload },
      {
        onSuccess: () => {
          notify("Sumber diperbarui", "success");
          setOpenEdit(null);
          refetch();
        },
        onError: (e: any) =>
          notify(e?.message || "Gagal memperbarui sumber", "error"),
      }
    );
  };

  const handleDelete = () => {
    if (!openDelete) return;
    deleteMut.mutate(openDelete.id, {
      onSuccess: () => {
        notify("Sumber dihapus", "success");
        setOpenDelete(null);
        refetch();
      },
      onError: (e: any) =>
        notify(e?.message || "Gagal menghapus sumber", "error"),
    });
  };

  // ===== Skeletons (match UserView style)
  const ToolbarSkeleton = () => (
    <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div className="w-full md:w-auto flex items-center justify-between gap-4">
        <Skeleton.Line width="w-80" height="h-10" className="rounded-md" />
        <Skeleton.Line width="w-28" height="h-10" className="rounded-md" />
      </div>
    </div>
  );

  const TableSkeleton = () => (
    <tbody className="bg-white divide-y divide-gray-200">
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i}>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton.Line width="w-6" height="h-4" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton.Line width="w-24" height="h-4" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton.Line width="w-40" height="h-4" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton.Line width="w-20" height="h-4" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right">
            <div className="flex justify-end gap-2">
              <Skeleton.Line width="w-14" height="h-8" className="rounded-md" />
              <Skeleton.Line width="w-16" height="h-8" className="rounded-md" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Sumber</h1>

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

            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-400 hover:bg-green-500 focus:outline-none"
                onClick={() => setOpenCreate(true)}
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>

            {isLoading ? (
              <TableSkeleton />
            ) : isError ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-sm text-red-600">
                    Gagal memuat data
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length > 0 ? (
                  filtered.map((s, i) => (
                    <tr key={s.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {s.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {s.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {s.isActive ? "Aktif" : "Nonaktif"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <BiEdit
                            className="text-green-600 w-5 h-5 cursor-pointer transition hover:text-green-800"
                            onClick={() =>
                              setOpenEdit({
                                id: s.id,
                                code: s.code,
                                label: s.label,
                                isActive: s.isActive,
                              })
                            }
                            title="Edit"
                          />
                          <BiTrash
                            className="text-red-600 w-5 h-5 cursor-pointer transition hover:text-red-800"
                            onClick={() =>
                              setOpenDelete({
                                id: s.id,
                                code: s.code,
                                label: s.label,
                                isActive: s.isActive,
                              })
                            }
                            title="Hapus"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      <EmptyState
                        title={
                          q.trim()
                            ? `Tidak ada hasil untuk “${q}”`
                            : "Belum ada Sumber"
                        }
                        description={
                          q.trim()
                            ? "Coba kata kunci lain."
                            : "Mulai dengan membuat Sumber baru."
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* ===== Modal Create ===== */}
      {openCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-lg shadow w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Tambah Sumber</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm mb-1">Code (unik)</label>
                <input
                  className="input input-bordered w-full bg-white border-gray-300"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="mis: UUD"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Label</label>
                <input
                  className="input input-bordered w-full bg-white border-gray-300"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="mis: UUD"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                className="inline-flex items-center px-4 py-2 rounded-md border text-sm"
                onClick={() => setOpenCreate(false)}
              >
                Batal
              </button>
              <button
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 ${
                  createMut.isPending ? "opacity-60 cursor-not-allowed" : ""
                }`}
                onClick={handleCreate}
              >
                {createMut.isPending ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal Edit ===== */}
      {openEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-lg shadow w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Edit Sumber</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm mb-1">Code (unik)</label>
                <input
                  className="input input-bordered w-full bg-white border-gray-300"
                  value={openEdit.code}
                  onChange={(e) =>
                    setOpenEdit({ ...openEdit, code: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Label</label>
                <input
                  className="input input-bordered w-full bg-white border-gray-300"
                  value={openEdit.label}
                  onChange={(e) =>
                    setOpenEdit({ ...openEdit, label: e.target.value })
                  }
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-black" >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm bg-black border-gray-300 "
                  checked={openEdit.isActive}
                  onChange={(e) =>
                    setOpenEdit({ ...openEdit, isActive: e.target.checked })
                  }
                />
                Aktif
              </label>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                className="inline-flex items-center px-4 py-2 rounded-md border text-sm"
                onClick={() => setOpenEdit(null)}
              >
                Batal
              </button>
              <button
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 ${
                  updateMut.isPending ? "opacity-60 cursor-not-allowed" : ""
                }`}
                onClick={handleUpdate}
              >
                {updateMut.isPending ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal Delete ===== */}
      {openDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-lg shadow w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-red-600">
                Hapus Sumber
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm">
                Yakin menghapus sumber{" "}
                <span className="font-semibold">
                  {openDelete.code} — {openDelete.label}
                </span>
                ?
              </p>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                className="inline-flex items-center px-4 py-2 rounded-md border text-sm"
                onClick={() => setOpenDelete(null)}
              >
                Batal
              </button>
              <button
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700 ${
                  deleteMut.isPending ? "opacity-60 cursor-not-allowed" : ""
                }`}
                onClick={handleDelete}
              >
                {deleteMut.isPending ? "Menghapus…" : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
