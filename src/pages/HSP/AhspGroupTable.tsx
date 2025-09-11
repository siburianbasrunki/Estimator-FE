// src/components/hsp/AhspGroupTable.tsx
import React from "react";
import type { AhspComponentModel, GroupKey } from "../../model/hsp";
import { GROUP_LABEL, GROUP_TITLE } from "../../constans/ahsp";
import { fmtIDRPlain, formatIDR } from "../../helper/rupiah";

type DirtyState = Record<
  string,
  { coefficient?: string; priceOverride?: string }
>;

type Props = {
  groupKey: GroupKey;
  items: AhspComponentModel[];
  subtotal: number;
  dirty: DirtyState;
  onCoefChange: (id: string, v: string) => void;
  onPriceOverrideChange: (id: string, v: string) => void;
  computeSubtotal: (
    comp: AhspComponentModel,
    coefStr: string,
    priceOverrideStr: string
  ) => number;
  onSaveRow: (comp: AhspComponentModel) => Promise<void>;
  onRemoveRow: (id: string) => Promise<void>;
  onAddClick: () => void;
  isUpdatingRow: boolean;
};

const AhspGroupTable: React.FC<Props> = ({
  groupKey,
  items,
  subtotal,
  dirty,
  onCoefChange,
  onPriceOverrideChange,
  computeSubtotal,
  onSaveRow,
  onRemoveRow,
  onAddClick,
  isUpdatingRow,
}) => {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-black">
            {GROUP_LABEL[groupKey]}. {GROUP_TITLE[groupKey]}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Jumlah {GROUP_TITLE[groupKey]}:{" "}
              <span className="font-semibold">
                {fmtIDRPlain(subtotal || 0)}
              </span>
            </div>
            <button
              onClick={onAddClick}
              className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + Tambah
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-600">
              <th className="sticky left-0 z-[1] border-b px-3 py-2 font-medium bg-gray-50">
                No
              </th>
              <th className="sticky left-[48px] z-[1] border-b px-3 py-2 font-medium bg-gray-50">
                Uraian
              </th>
              <th className="border-b px-3 py-2 font-medium">Kode</th>
              <th className="border-b px-3 py-2 font-medium">Satuan</th>
              <th className="border-b px-3 py-2 font-medium">Koefisien</th>
              <th className="border-b px-3 py-2 font-medium">
                Harga Satuan (Rp.)
              </th>
              <th className="border-b px-3 py-2 font-medium">
                Jumlah Harga (Rp.)
              </th>
              <th className="border-b px-3 py-2 font-medium w-[140px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  Tidak ada komponen.
                </td>
              </tr>
            )}
            {items.map((it, idx) => {
              const patch = dirty[it.id] || {};
              const coefStr = patch.coefficient ?? String(it.coefficient);
              const priceOverrideStr =
                patch.priceOverride !== undefined
                  ? patch.priceOverride
                  : it.priceOverride == null
                  ? ""
                  : String(it.priceOverride);

              const masterPrice =
                it.masterItem?.price ?? it.unitPriceSnapshot ?? 0;

              const subtotalRow = computeSubtotal(
                it,
                coefStr,
                priceOverrideStr
              );
              const isRowDirty = dirty[it.id] !== undefined;

              return (
                <tr key={it.id} className="text-sm hover:bg-gray-50 text-black">
                  <td className="sticky left-0 z-[1] border-t px-3 py-2 bg-white text-black">
                    {idx + 1}
                  </td>
                  <td className="sticky left-[48px] z-[1] border-t px-3 py-2 bg-white text-black">
                    <div className="font-medium text-black">
                      {it.nameSnapshot || it.masterItem?.name}
                    </div>
                    {/* <div className="text-xs text-gray-500">
                      (snapshot: {it.unitSnapshot} @{" "}
                      {fmtIDRPlain(it.unitPriceSnapshot)})
                    </div> */}
                  </td>
                  <td className="border-t px-3 py-2 text-black">
                    {it.masterItem?.code || "-"}
                  </td>
                  <td className="border-t px-3 py-2">
                    {it.unitSnapshot || it.masterItem?.unit || "-"}
                  </td>
                  <td className="border-t px-3 py-2">
                    <input
                      className="w-24 rounded-md border px-2 py-1 text-right"
                      value={coefStr}
                      onChange={(e) => onCoefChange(it.id, e.target.value)}
                      placeholder="0.0000"
                      inputMode="decimal"
                    />
                  </td>
                  <td className="border-t px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        className="w-32 rounded-md border px-2 py-1 text-right"
                        value={priceOverrideStr}
                        onChange={(e) =>
                          onPriceOverrideChange(it.id, e.target.value)
                        }
                        placeholder={fmtIDRPlain(masterPrice)}
                        inputMode="decimal"
                      />
                      <span className="whitespace-nowrap text-xs text-gray-500">
                        (master: {fmtIDRPlain(masterPrice)})
                      </span>
                    </div>
                  </td>
                  <td className="border-t px-3 py-2 font-medium">
                    {formatIDR(subtotalRow)}
                  </td>
                  <td className="border-t px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        disabled={!isRowDirty || isUpdatingRow}
                        onClick={() => onSaveRow(it)}
                        className={`rounded-md px-3 py-1 text-sm font-medium ${
                          isRowDirty
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => onRemoveRow(it.id)}
                        className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 text-sm">
              <td colSpan={6} className="px-3 py-2 text-right font-medium">
                JUMLAH {GROUP_TITLE[groupKey]}
              </td>
              <td className="px-3 py-2 font-semibold">
                {fmtIDRPlain(subtotal || 0)}
              </td>
              <td className="px-3 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AhspGroupTable;
