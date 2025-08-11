import { useState } from "react";
import { BiEdit, BiPlus, BiSave, BiTrash } from "react-icons/bi";
import Button from "../../components/Button";
import {
  DropdownTitle,
  DummyAHP,
  flattenToDropdown,
} from "../../stores/dummyAHP";
import { UnitList } from "../../stores/units";

interface TableRow {
  id: string;
  type: "title" | "item";
  title?: string;
  item?: {
    kode: string;
    deskripsi: string;
    volume: number;
    satuan: string;
    hargaSatuan: number;
    hargaTotal: number;
  };
  isEditing?: boolean;
}

export const CreateStepTwo = () => {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [manualTitle, setManualTitle] = useState<string>("");
  const [isAddingTitle, setIsAddingTitle] = useState<boolean>(false);
  const [isManualTitle, setIsManualTitle] = useState<boolean>(false);

  const DropdownPekerjaan = flattenToDropdown(DummyAHP);

  const handleSaveAllData = () => {
    const formattedData: any[] = [];
    let currentTitle: any = null;

    rows.forEach((row) => {
      if (row.type === "title") {
        if (currentTitle) {
          formattedData.push(currentTitle);
        }
        currentTitle = {
          title: row.title,
          items: [],
        };
      } else if (row.type === "item" && row.item && currentTitle) {
        currentTitle.items.push({
          kode: row.item.kode,
          nama: row.item.deskripsi,
          satuan: row.item.satuan,
          harga: row.item.hargaSatuan,
          volume: row.item.volume,
          hargaTotal: row.item.hargaTotal,
        });
      }
    });

    if (currentTitle) {
      formattedData.push(currentTitle);
    }

    console.log("All Data:", formattedData);
    alert("Data berhasil disimpan! Lihat console untuk detail.");
  };
  const getItemNumber = (rowId: string) => {
    let itemCount = 1;
    for (const row of rows) {
      if (row.id === rowId) break;
      if (row.type === "item") itemCount++;
      if (row.type === "title") itemCount = 1;
    }
    return itemCount;
  };

  const handleAddTitle = () => {
    if (isManualTitle && manualTitle.trim()) {
      const newRow: TableRow = {
        id: `title-${Date.now()}`,
        type: "title",
        title: manualTitle,
      };
      setRows([...rows, newRow]);
      setManualTitle("");
      setIsManualTitle(false);
      setIsAddingTitle(false);
    } else if (selectedTitle) {
      const newRow: TableRow = {
        id: `title-${Date.now()}`,
        type: "title",
        title: selectedTitle,
      };
      setRows([...rows, newRow]);
      setSelectedTitle("");
      setIsAddingTitle(false);
    }
  };

  const handleAddItem = (titleId: string) => {
    const titleRow = rows.find((row) => row.id === titleId);
    if (!titleRow) return;

    const newRow: TableRow = {
      id: `item-${Date.now()}`,
      type: "item",
      item: {
        kode: "",
        deskripsi: "",
        volume: 0,
        satuan: "",
        hargaSatuan: 0,
        hargaTotal: 0,
      },
      isEditing: true,
    };

    const titleIndex = rows.findIndex((row) => row.id === titleId);
    const newRows = [...rows];
    newRows.splice(titleIndex + 1, 0, newRow);
    setRows(newRows);
  };

  const handleSaveItem = (id: string, selectedItem: any) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            item: {
              kode: selectedItem.value,
              deskripsi: selectedItem.detail.deskripsi,
              volume: 1,
              satuan: selectedItem.detail.satuan,
              hargaSatuan: selectedItem.detail.harga,
              hargaTotal: selectedItem.detail.harga,
            },
            isEditing: false,
          };
        }
        return row;
      })
    );
  };

  const handleEditItem = (id: string) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return { ...row, isEditing: true };
        }
        return row;
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    const rowToDelete = rows.find((row) => row.id === id);

    if (rowToDelete?.type === "title") {
      const titleIndex = rows.findIndex((row) => row.id === id);
      let nextTitleIndex = -1;
      for (let i = titleIndex + 1; i < rows.length; i++) {
        if (rows[i].type === "title") {
          nextTitleIndex = i;
          break;
        }
      }

      const start = titleIndex;
      const end = nextTitleIndex === -1 ? rows.length : nextTitleIndex;

      const newRows = [...rows.slice(0, start), ...rows.slice(end)];
      setRows(newRows);
    } else {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setRows(
      rows.map((row) => {
        if (row.id === id && row.type === "item" && row.item) {
          const updatedItem = { ...row.item, [field]: value };
          if (field === "volume" || field === "hargaSatuan") {
            updatedItem.hargaTotal =
              updatedItem.volume * updatedItem.hargaSatuan;
          }
          return { ...row, item: updatedItem };
        }
        return row;
      })
    );
  };

  const calculateTotal = () => {
    return rows.reduce((total, row) => {
      if (row.type === "item" && row.item) {
        return total + row.item.hargaTotal;
      }
      return total;
    }, 0);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Create</h1>
      <div className="flex bg-white p-4 text-center rounded-lg shadow justify-center items-center ">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          Renovasi Rumah Kepala Desa
        </h1>
      </div>
      <div className="mt-2 bg-white p-4 text-center rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uraian Pekerjaan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satuan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Satuan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Tidak ada data. Tambahkan pekerjaan.
                  </td>
                </tr>
              )}

              {rows.map((row) => (
                <tr key={row.id}>
                  {row.type === "title" ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {String.fromCharCode(
                          65 +
                            rows
                              .filter((r) => r.type === "title")
                              .findIndex((r) => r.id === row.id)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.title}
                      </td>
                      <td colSpan={4}></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                        <button
                          onClick={() => handleAddItem(row.id)}
                          className="text-green-500 hover:text-green-700"
                        >
                          <BiPlus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <BiTrash className="w-5 h-5" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getItemNumber(row.id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.isEditing ? (
                          <select
                            className="border rounded p-1 w-full bg-white text-gray-800"
                            onChange={(e) => {
                              const selected = DropdownPekerjaan.find(
                                (item) => item.value === e.target.value
                              );
                              if (selected) {
                                handleSaveItem(row.id, selected);
                              }
                            }}
                          >
                            <option value="">Pilih Pekerjaan</option>
                            {DropdownPekerjaan.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          row.item?.deskripsi
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.isEditing ? (
                          <input
                            type="number"
                            className="border rounded p-1 w-20"
                            value={row.item?.volume || 0}
                            onChange={(e) =>
                              handleUpdateItem(
                                row.id,
                                "volume",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        ) : (
                          row.item?.volume
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.isEditing ? (
                          <select
                            className="border rounded p-1 w-24"
                            value={row.item?.satuan || ""}
                            onChange={(e) =>
                              handleUpdateItem(row.id, "satuan", e.target.value)
                            }
                          >
                            <option value="">Pilih Satuan</option>
                            {UnitList.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          UnitList.find((u) => u.value === row.item?.satuan)
                            ?.label || row.item?.satuan
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.isEditing ? (
                          <input
                            type="number"
                            className="border rounded p-1 w-32"
                            value={row.item?.hargaSatuan || 0}
                            onChange={(e) =>
                              handleUpdateItem(
                                row.id,
                                "hargaSatuan",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        ) : (
                          `Rp ${row.item?.hargaSatuan.toLocaleString("id-ID")}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rp {row.item?.hargaTotal.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                        {!row.isEditing ? (
                          <>
                            <button
                              onClick={() => handleEditItem(row.id)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <BiEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <BiTrash className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              handleSaveItem(row.id, {
                                value: row.item?.kode,
                                detail: {
                                  deskripsi: row.item?.deskripsi,
                                  satuan: row.item?.satuan,
                                  harga: row.item?.hargaSatuan,
                                },
                              })
                            }
                            className="text-green-500 hover:text-green-700"
                          >
                            <BiSave className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          {isAddingTitle ? (
            <div className="flex gap-2 items-center">
              {isManualTitle ? (
                <input
                  type="text"
                  className="border rounded p-2 flex-1 bg-white text-gray-800 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan judul manual"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              ) : (
                <select
                  className="border rounded p-2 flex-1 bg-white text-gray-800"
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                >
                  <option value="">Pilih Kategori Pekerjaan</option>
                  {DropdownTitle.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setIsManualTitle(!isManualTitle)}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"
              >
                {isManualTitle ? "Pilih dari Daftar" : "Input Manual"}
              </button>
              <button
                onClick={handleAddTitle}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                disabled={isManualTitle ? !manualTitle.trim() : !selectedTitle}
              >
                Tambah
              </button>
              <button
                onClick={() => {
                  setIsAddingTitle(false);
                  setIsManualTitle(false);
                  setSelectedTitle("");
                  setManualTitle("");
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTitle(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
            >
              Tambah Kategori Pekerjaan
            </button>
          )}
        </div>
      </div>

      <div className="rounded-md shadow-sm p-4 mt-4 bg-white">
        <p className="flex justify-end text-lg font-semibold text-black">
          Total Harga: Rp {calculateTotal().toLocaleString("id-ID")}
        </p>
        <div className="flex gap-2 ml-4 justify-end mt-3">
          <Button variant="default">Draft</Button>
          <Button variant="success" onClick={handleSaveAllData}>
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
};
