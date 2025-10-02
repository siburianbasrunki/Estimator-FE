// src/pages/estimation/VolumeModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BiPlus, BiTrash, BiX } from "react-icons/bi";

/* ===================== Types ===================== */
export type ExtraCol = {
  id: string;
  name: string; // nama kolom custom
  value: number; // diserialisasi per-baris saat save
};

export type VolumeDetailRow = {
  id: string;
  uraian: string;
  jenis: "penjumlahan" | "pengurangan";
  panjang: number;
  lebar: number;
  tinggi: number;
  jumlah: number;
  extras?: ExtraCol[];
  volume: number; // computed
};

type RowUI = {
  id: string;
  uraian: string;
  jenis: "penjumlahan" | "pengurangan";
  panjang: string;
  lebar: string;
  tinggi: string;
  jumlah: string;
  extraValues: Record<string, string>;
  volume: number; // preview (no sign)
};

/* ===================== Utils ===================== */
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toNum = (v: string | number | undefined) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null || String(v).trim() === "") return 0;
  const s = String(v).replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const isNeg = (v: string) => toNum(v) < 0;

function computeRowVolumeUI(r: RowUI, extraCols: { id: string }[]) {
  const p = toNum(r.panjang);
  const l = toNum(r.lebar);
  const t = toNum(r.tinggi);
  const j = toNum(r.jumlah);
  const extrasProduct = extraCols.reduce((acc, c) => {
    const raw = r.extraValues?.[c.id] ?? "";
    return acc * toNum(raw);
  }, 1);
  const vol = p * l * t * j * extrasProduct;
  return Number.isFinite(vol) ? vol : 0;
}

/* ===================== InputCell (TOP-LEVEL) ===================== */
/** Dipindah ke top-level + React.memo agar tidak re-mount saat parent re-render */
type InputCellProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
  invalid?: boolean;
  width?: string;
  type?: "decimal" | "numeric";
};

export const InputCell = React.memo(function InputCell({
  value,
  onChange,
  placeholder,
  unit,
  invalid,
  width = "w-28",
  type = "decimal",
}: InputCellProps) {
  return (
    <div className={`relative ${width}`}>
      <input
        type="text"
        inputMode={type} // "decimal" | "numeric"
        className={`input input-bordered input-sm w-full pr-10 text-black bg-white ${
          invalid
            ? "border-red-500 focus:border-red-500 focus:outline-red-500"
            : "border-gray-300"
        }`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          const cleaned =
            type === "decimal"
              ? v.replace(/[^\d.,]/g, "")
              : v.replace(/\D/g, "");
          onChange(cleaned);
        }}
      />
      {unit ? (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-500 select-none">
          {unit}
        </span>
      ) : null}
    </div>
  );
});

/* ===================== Modal Component ===================== */
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
  const [extraCols, setExtraCols] = useState<{ id: string; name: string }[]>(
    []
  );
  const [rows, setRows] = useState<RowUI[]>([]);
  const initFPRef = useRef<string>("");

  // Normalize dari initialRows -> extraCols & rows UI
  useEffect(() => {
    if (!open) return;

    const colMap = new Map<string, string>();
    (initialRows || []).forEach((r) => {
      (r.extras || []).forEach((ex) => {
        const id = ex.id || `${ex.name}`;
        if (!colMap.has(id)) colMap.set(id, ex.name);
      });
    });

    const initialExtraCols =
      colMap.size > 0
        ? Array.from(colMap.entries()).map(([id, name]) => ({ id, name }))
        : [];

    setExtraCols(initialExtraCols);

    const norm: RowUI[] = (initialRows || []).map((r) => {
      const extrasRecord: Record<string, string> = {};
      (r.extras || []).forEach((ex) => {
        const exId = ex.id || `${ex.name}`;
        extrasRecord[exId] =
          ex.value === 0 || ex.value == null ? "" : String(ex.value);
      });

      initialExtraCols.forEach((col) => {
        if (!(col.id in extrasRecord)) extrasRecord[col.id] = "";
      });

      const draft: RowUI = {
        id: r.id || uid(),
        uraian: r.uraian ?? "",
        jenis: r.jenis ?? "penjumlahan",
        panjang: r.panjang === 0 || r.panjang == null ? "" : String(r.panjang),
        lebar: r.lebar === 0 || r.lebar == null ? "" : String(r.lebar),
        tinggi: r.tinggi === 0 || r.tinggi == null ? "" : String(r.tinggi),
        jumlah: r.jumlah === 0 || r.jumlah == null ? "1" : String(r.jumlah),
        extraValues: extrasRecord,
        volume: 0,
      };
      draft.volume = computeRowVolumeUI(draft, initialExtraCols);
      return draft;
    });

    // Fingerprint untuk hindari reset bila initialRows tidak berubah
    const fp = JSON.stringify(
      (initialRows || []).map((r) => ({
        id: r.id,
        extrasLen: r.extras?.length ?? 0,
      }))
    );
    if (fp === initFPRef.current) return;
    initFPRef.current = fp;
    setRows(norm.length ? norm : []);
  }, [open, initialRows]);

  const totalVolume = useMemo(() => {
    return rows.reduce((acc, r) => {
      const sign = r.jenis === "pengurangan" ? -1 : 1;
      return acc + sign * computeRowVolumeUI(r, extraCols);
    }, 0);
  }, [rows, extraCols]);

  const recalcRow = (row: RowUI): RowUI => {
    const next = { ...row };
    next.volume = computeRowVolumeUI(next, extraCols);
    return next;
  };

  const addRow = () => {
    const extraValues: Record<string, string> = {};
    extraCols.forEach((c) => (extraValues[c.id] = ""));
    const blank: RowUI = {
      id: uid(),
      uraian: "",
      jenis: "penjumlahan",
      panjang: "",
      lebar: "",
      tinggi: "",
      jumlah: "1",
      extraValues,
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
        const next = { ...r, [key]: value } as RowUI;
        return recalcRow(next);
      })
    );
  };

  // ====== Extra Columns (global) handlers ======
  const addExtraCol = () => {
    const id = uid();
    const newCol = { id, name: "Kolom Baru" };
    setExtraCols((prev) => [...prev, newCol]);
    setRows((prev) =>
      prev.map((r) => {
        const extraValues = { ...(r.extraValues || {}) };
        extraValues[id] = "";
        return recalcRow({ ...r, extraValues });
      })
    );
  };

  const updateExtraColName = (colId: string, name: string) => {
    setExtraCols((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, name } : c))
    );
  };

  const removeExtraCol = (colId: string) => {
    setExtraCols((prev) => prev.filter((c) => c.id !== colId));
    setRows((prev) =>
      prev.map((r) => {
        const { [colId]: _, ...rest } = r.extraValues || {};
        return recalcRow({ ...r, extraValues: rest });
      })
    );
  };

  const updateExtraValueOnRow = (
    rowId: string,
    colId: string,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const extraValues = { ...(r.extraValues || {}), [colId]: value };
        return recalcRow({ ...r, extraValues });
      })
    );
  };

  const handleSave = () => {
    const out: VolumeDetailRow[] = rows.map((r) => {
      const extrasArr: ExtraCol[] = extraCols.map((col) => ({
        id: col.id,
        name: col.name,
        value: toNum(r.extraValues?.[col.id]),
      }));
      const raw = computeRowVolumeUI(r, extraCols);
      return {
        id: r.id,
        uraian: r.uraian,
        jenis: r.jenis,
        panjang: toNum(r.panjang),
        lebar: toNum(r.lebar),
        tinggi: toNum(r.tinggi),
        jumlah: toNum(r.jumlah),
        extras: extrasArr,
        volume: Number(raw.toFixed(2)),
      };
    });
    onSave(out, Number(totalVolume.toFixed(2)));
    onClose();
  };

  if (!open) return null;

  const dynamicColCount = 6 + extraCols.length + 3;

  // ================= PORTAL CONTENT =================
  const modalNode = (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/45 p-2 sm:p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-white">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
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
            className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-900"
            aria-label="Tutup"
            title="Tutup"
          >
            <BiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="relative overflow-auto border border-gray-200 rounded-xl">
            {/* Sticky total (bottom) */}
            {rows.length > 0 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent h-8 z-10" />
            )}

            <table className="table min-w-[1100px]">
              <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                <tr>
                  <th className="text-[11px] font-semibold text-gray-600">
                    No
                  </th>
                  <th className="text-[11px] font-semibold text-gray-600">
                    Uraian
                  </th>
                  <th className="text-[11px] font-semibold text-gray-600">
                    Jenis
                  </th>
                  <th className="text-[11px] font-semibold text-gray-600">
                    Panjang (M)
                  </th>
                  <th className="text-[11px] font-semibold text-gray-600">
                    Lebar (M)
                  </th>
                  <th className="text-[11px] font-semibold text-gray-600">
                    Tinggi (M)
                  </th>

                  {/* Dynamic Extra Columns AFTER Tinggi */}
                  {extraCols.map((col) => (
                    <th
                      key={col.id}
                      className="text-[11px] font-semibold text-gray-600"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          className="input input-bordered input-xs w-40 text-black bg-white border-gray-300"
                          value={col.name}
                          onChange={(e) =>
                            updateExtraColName(col.id, e.target.value)
                          }
                          title="Ubah nama kolom"
                        />
                        <button
                          onClick={() => removeExtraCol(col.id)}
                          className="btn btn-ghost btn-xs text-red-600 hover:text-red-700"
                          title="Hapus kolom ini untuk semua baris"
                        >
                          <BiTrash />
                        </button>
                      </div>
                    </th>
                  ))}

                  <th className="text-[11px] font-semibold text-gray-600">
                    Jumlah
                  </th>
                  <th className="text-[11px] font-semibold text-gray-600">
                    Volume (M³)
                  </th>
                  <th className="text-[11px] font-semibold text-gray-600 text-center">
                    Aksi
                  </th>
                </tr>

                {/* Tools row (add column) */}
                <tr className="bg-white">
                  <th colSpan={6} />
                  <th colSpan={Math.max(extraCols.length, 1)} className="py-2">
                    <button
                      onClick={addExtraCol}
                      className="btn btn-success btn-xs"
                    >
                      <BiPlus className="mr-1" /> Tambah Kolom
                    </button>
                  </th>
                  <th colSpan={3} />
                </tr>
              </thead>

              <tbody className="bg-white [&>tr:nth-child(even)]:bg-gray-50">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={dynamicColCount}
                      className="text-center py-8 text-sm text-gray-500"
                    >
                      Belum ada uraian. Klik{" "}
                      <button
                        onClick={addRow}
                        className="link link-primary font-semibold"
                      >
                        + Tambah Uraian
                      </button>{" "}
                      untuk menambahkan.
                    </td>
                  </tr>
                ) : null}

                {rows.map((r, idx) => (
                  <tr key={r.id} className="group hover:bg-indigo-50/40">
                    <td className="text-xs text-gray-500 align-top py-3">
                      {idx + 1}
                    </td>

                    {/* Uraian */}
                    <td className="py-2 align-top">
                      <input
                        className="input input-bordered input-sm w-56 text-black bg-white border-gray-300"
                        placeholder="cth: Pintu"
                        value={r.uraian}
                        onChange={(e) =>
                          updateRow(r.id, "uraian", e.target.value)
                        }
                      />
                    </td>

                    {/* Jenis */}
                    <td className="py-2 align-top">
                      <select
                        className="select select-bordered select-sm w-40 text-black bg-white border-gray-300"
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
                    <td className="py-2 align-top">
                      <InputCell
                        value={r.panjang}
                        onChange={(v) => updateRow(r.id, "panjang", v)}
                        unit="m"
                        invalid={isNeg(r.panjang)}
                      />
                    </td>

                    {/* Lebar */}
                    <td className="py-2 align-top">
                      <InputCell
                        value={r.lebar}
                        onChange={(v) => updateRow(r.id, "lebar", v)}
                        unit="m"
                        invalid={isNeg(r.lebar)}
                      />
                    </td>

                    {/* Tinggi */}
                    <td className="py-2 align-top">
                      <InputCell
                        value={r.tinggi}
                        onChange={(v) => updateRow(r.id, "tinggi", v)}
                        unit="m"
                        invalid={isNeg(r.tinggi)}
                      />
                    </td>

                    {/* Extra Columns */}
                    {extraCols.map((col) => (
                      <td key={col.id} className="py-2 align-top">
                        <InputCell
                          value={r.extraValues?.[col.id] ?? ""}
                          onChange={(v) =>
                            updateExtraValueOnRow(r.id, col.id, v)
                          }
                          unit=""
                          invalid={isNeg(r.extraValues?.[col.id] ?? "")}
                        />
                      </td>
                    ))}

                    {/* Jumlah */}
                    <td className="py-2 align-top">
                      <InputCell
                        value={r.jumlah}
                        onChange={(v) => updateRow(r.id, "jumlah", v)}
                        type="numeric"
                        width="w-24"
                        unit=""
                        invalid={isNeg(r.jumlah)}
                      />
                    </td>

                    {/* Volume */}
                    <td className="py-2 align-top">
                      <div className="px-2 py-1 rounded-md bg-gray-100 text-gray-900 text-sm font-semibold w-28 text-right">
                        {computeRowVolumeUI(r, extraCols).toFixed(2)}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-2 align-top">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex justify-center">
                        <button
                          onClick={() => removeRow(r.id)}
                          className="btn btn-ghost btn-xs text-red-600 hover:text-red-700"
                          title="Hapus baris"
                        >
                          <BiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {rows.length > 0 && (
                <tfoot className="sticky bottom-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                  <tr className="border-t border-gray-200">
                    <td
                      colSpan={6 + extraCols.length}
                      className="text-right text-sm font-medium text-gray-700 py-3 pr-4"
                    >
                      Total Volume
                    </td>
                    <td className="py-3">
                      <div className="px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-sm font-bold w-28 text-right">
                        {totalVolume.toFixed(2)}
                      </div>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Bottom action */}
          <div className="flex items-center justify-between mt-4">
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
        <div className="px-5 py-4 border-t border-gray-200 flex gap-2 justify-end bg-white">
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

  return createPortal(modalNode, document.body);
}
