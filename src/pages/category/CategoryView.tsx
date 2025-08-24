import { useState } from "react";
import {
  useCreateCategory,
  useDeleteCategory,
  useGetCategoryJob,
  useUpdateCategory,
} from "../../hooks/useHsp";
import { BiEdit, BiPlus, BiTrash } from "react-icons/bi";
import toast from "react-hot-toast";

export const CategoryView = () => {
  const { data: categories, isLoading: isLoadingCategories } =
    useGetCategoryJob();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<null | { id: string; name: string }>(
    null
  );
  const [openDelete, setOpenDelete] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [search, setSearch] = useState("");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Category Jobs</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="w-full md:w-auto flex items-center justify-between gap-4">
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
            <button
              onClick={() => setOpenCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <BiPlus className="w-5 h-5" />
              Tambah Kategori
            </button>
          </div>
        </div>

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
                Total Items
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories?.map((category, index) => {
              return (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {isLoadingCategories ? "Loading..." : category.name ?? "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isLoadingCategories
                      ? "Loading..."
                      : category?._count?.items ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    <div className="flex gap-3 justify-end">
                      <BiEdit
                        className="w-5 h-5 text-amber-600 cursor-pointer"
                        title="Edit"
                        onClick={() =>
                          setOpenEdit({ id: category.id, name: category.name })
                        }
                      />
                      <BiTrash
                        className="w-5 h-5 text-red-600 cursor-pointer"
                        title="Delete"
                        onClick={() =>
                          setOpenDelete({
                            id: category.id,
                            name: category.name,
                          })
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {categories?.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-center text-gray-500 text-sm"
                >
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {openCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-lg shadow w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Tambah Kategori</h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium mb-1">
                Nama Kategori
              </label>
              <input
                id="cat-create-name"
                className="input input-bordered w-full text-black bg-white border-black"
              />
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
                  const name = (
                    document.getElementById(
                      "cat-create-name"
                    ) as HTMLInputElement
                  )?.value.trim();
                  if (!name) {
                    toast.error("Nama wajib diisi");
                    return;
                  }
                  createCat.mutate(name, {
                    onSuccess: () => setOpenCreate(false),
                  });
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
          <div className="bg-white rounded-lg shadow w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Edit Kategori</h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium mb-1">
                Nama Kategori
              </label>
              <input
                id="cat-edit-name"
                defaultValue={openEdit.name}
                className="input input-bordered w-full text-black bg-white border-black"
              />
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
                  const name = (
                    document.getElementById("cat-edit-name") as HTMLInputElement
                  )?.value.trim();
                  if (!name) {
                    toast.error("Nama wajib diisi");
                    return;
                  }
                  updateCat.mutate(
                    { id: openEdit.id, name },
                    { onSuccess: () => setOpenEdit(null) }
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
              <h3 className="text-lg font-semibold">Hapus Kategori?</h3>
            </div>
            <div className="p-4">
              <p className="text-sm">
                Yakin menghapus kategori{" "}
                <span className="font-semibold">{openDelete.name}</span>?
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
                  deleteCat.mutate(openDelete.id, {
                    onSuccess: () => setOpenDelete(null),
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
