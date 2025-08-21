import { useEffect, useMemo, useState } from "react";
import { BiPlus, BiTrash, BiX } from "react-icons/bi";

export type VolumeDetailRow = {
  id: string;
  uraian: string;
  jenis: "penjumlahan" | "pengurangan";
  panjang: number; // meter
  lebar: number; // meter
  tinggi: number; // meter
  jumlah: number; // unit
  volume: number; // m3 (computed)
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** ===== UI row state (string for inputs) ===== */
type RowUI = {
  id: string;
  uraian: string;
  jenis: "penjumlahan" | "pengurangan";
  panjang: string;
  lebar: string;
  tinggi: string;
  jumlah: string;
  volume: number; // computed preview (no sign)
};

const toNum = (v: string | number | undefined) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null || v.trim() === "") return 0;
  // Replace comma with dot if user accidentally uses locale comma
  const s = v.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function computeRowVolumeUI(r: RowUI) {
  const p = toNum(r.panjang);
  const l = toNum(r.lebar);
  const t = toNum(r.tinggi);
  const j = toNum(r.jumlah);
  const vol = p * l * t * j;
  return Number.isFinite(vol) ? vol : 0;
}

export default function VolModal({
  open,
  onClose,
  onSave,
  initialRows = [],
  itemLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (rows: VolumeDetailRow[], totalVolume: number) => void;
  initialRows?: VolumeDetailRow[];
  itemLabel?: string;
}) {
  const [rows, setRows] = useState<RowUI[]>([]);

  useEffect(() => {
    if (open) {
      const norm: RowUI[] = (initialRows || []).map((r) => ({
        id: r.id,
        uraian: r.uraian ?? "",
        jenis: r.jenis ?? "penjumlahan",
        panjang: r.panjang === 0 || r.panjang == null ? "" : String(r.panjang),
        lebar: r.lebar === 0 || r.lebar == null ? "" : String(r.lebar),
        tinggi: r.tinggi === 0 || r.tinggi == null ? "" : String(r.tinggi),
        jumlah: r.jumlah === 0 || r.jumlah == null ? "1" : String(r.jumlah),
        volume: r.volume ?? 0,
      }));
      setRows(norm.length ? norm : []);
    }
  }, [open, initialRows]);

  const totalVolume = useMemo(() => {
    return rows.reduce((acc, r) => {
      const sign = r.jenis === "pengurangan" ? -1 : 1;
      return acc + sign * computeRowVolumeUI(r);
    }, 0);
  }, [rows]);

  const addRow = () => {
    const blank: RowUI = {
      id: uid(),
      uraian: "",
      jenis: "penjumlahan",
      panjang: "",
      lebar: "",
      tinggi: "",
      jumlah: "1",
      volume: 0,
    };
    setRows((prev) => [...prev, blank]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = <K extends keyof RowUI>(
    id: string,
    key: K,
    value: RowUI[K]
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next: RowUI = { ...r, [key]: value } as RowUI;
        next.volume = computeRowVolumeUI(next);
        return next;
      })
    );
  };

  const handleSave = () => {
    const out: VolumeDetailRow[] = rows.map((r) => ({
      id: r.id,
      uraian: r.uraian,
      jenis: r.jenis,
      panjang: toNum(r.panjang),
      lebar: toNum(r.lebar),
      tinggi: toNum(r.tinggi),
      jumlah: toNum(r.jumlah),
      volume: Number(computeRowVolumeUI(r).toFixed(2)),
    }));
    onSave(out, Number(totalVolume.toFixed(2)));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
      <div className="bg-white w-[95vw] max-w-5xl rounded-xl shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Detail Perhitungan Volume
            </h3>
            {itemLabel ? (
              <p className="text-xs text-gray-500">
                Item:{" "}
                <span className="font-medium text-gray-700">{itemLabel}</span>
              </p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm text-gray-600"
            aria-label="Tutup"
            title="Tutup"
          >
            <BiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="table min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-xs font-semibold text-gray-600">No</th>
                  <th className="text-xs font-semibold text-gray-600">
                    Uraian
                  </th>
                  <th className="text-xs font-semibold text-gray-600">Jenis</th>
                  <th className="text-xs font-semibold text-gray-600">
                    Panjang (M)
                  </th>
                  <th className="text-xs font-semibold text-gray-600">
                    Lebar (M)
                  </th>
                  <th className="text-xs font-semibold text-gray-600">
                    Tinggi (M)
                  </th>
                  <th className="text-xs font-semibold text-gray-600">
                    Jumlah
                  </th>
                  <th className="text-xs font-semibold text-gray-600">
                    Volume (M³)
                  </th>
                  <th className="text-xs font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-6 text-sm text-gray-500"
                    >
                      Belum ada uraian. Klik{" "}
                      <span className="font-semibold">+ Tambah Uraian</span>{" "}
                      untuk menambahkan.
                    </td>
                  </tr>
                ) : null}

                {rows.map((r, idx) => (
                  <tr key={r.id}>
                    <td className="text-sm text-gray-500">{idx + 1}</td>
                    <td>
                      <input
                        className="input input-bordered input-sm w-56 text-black bg-white border-black"
                        placeholder="cth: Pintu"
                        value={r.uraian}
                        onChange={(e) =>
                          updateRow(r.id, "uraian", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="select select-bordered select-sm w-40 text-black bg-white border-black"
                        value={r.jenis}
                        onChange={(e) =>
                          updateRow(
                            r.id,
                            "jenis",
                            e.target.value as RowUI["jenis"]
                          )
                        }
                      >
                        <option value="penjumlahan">Penjumlahan</option>
                        <option value="pengurangan">Pengurangan</option>
                      </select>
                    </td>

                    {/* Panjang */}
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={0}
                        className="input input-bordered input-sm w-28 text-black bg-white border-black"
                        value={r.panjang}
                        onChange={(e) =>
                          updateRow(r.id, "panjang", e.target.value)
                        }
                      />
                    </td>

                    {/* Lebar */}
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={0}
                        className="input input-bordered input-sm w-28 text-black bg-white border-black"
                        value={r.lebar}
                        onChange={(e) =>
                          updateRow(r.id, "lebar", e.target.value)
                        }
                      />
                    </td>

                    {/* Tinggi */}
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={0}
                        className="input input-bordered input-sm w-28 text-black bg-white border-black"
                        value={r.tinggi}
                        onChange={(e) =>
                          updateRow(r.id, "tinggi", e.target.value)
                        }
                      />
                    </td>

                    {/* Jumlah */}
                    <td>
                      <input
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min={0}
                        className="input input-bordered input-sm w-24 text-black bg-white border-black"
                        value={r.jumlah}
                        onChange={(e) =>
                          updateRow(r.id, "jumlah", e.target.value)
                        }
                      />
                    </td>

                    <td className="text-sm font-semibold text-black">
                      {computeRowVolumeUI(r).toFixed(2)}
                    </td>
                    <td>
                      <button
                        onClick={() => removeRow(r.id)}
                        className="btn btn-ghost btn-xs text-red-600"
                        title="Hapus baris"
                      >
                        <BiTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {rows.length > 0 && (
                <tfoot className="text-black">
                  <tr className="bg-gray-50">
                    <td
                      colSpan={7}
                      className="text-right text-sm font-medium text-gray-700"
                    >
                      Total Volume
                    </td>
                    <td className="text-sm font-bold">
                      {totalVolume.toFixed(2)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="flex items-center justify-between mt-3">
            <button onClick={addRow} className="btn btn-success btn-sm">
              <BiPlus className="mr-1" /> Tambah Uraian
            </button>
            <div className="text-sm text-black">
              <span className="text-gray-600 mr-2">Total Volume:</span>
              <span className="font-bold">{totalVolume.toFixed(2)} m³</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex gap-2 justify-end">
          <button className="btn btn-neutral" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary text-white" onClick={handleSave}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
