// src/pages/hsp/AhspView.tsx
import React, { useMemo, useState } from "react";
import type {
  AhspComponentModel,
  AhspDetailModel,
  GroupKey,
} from "../../model/hsp";
import {
  useHspDetail,
  useRecomputeHsp,
  useUpdateAhspComponent,
  useUpdateAhspOverhead,
  useDeleteAhspComponent,
} from "../../hooks/useHsp";
import { useNotify } from "../../components/Notify/notify";
import { GROUP_LABEL, GROUP_ORDER, GROUP_TITLE } from "../../constans/ahsp";
import { fmtIDRWithSymbol, parseNumber, sum } from "../../helper/rupiah";
import AhspGroupTable from "./AhspGroupTable";
import AddComponentModal from "./AddAhspModal";
import { useConfirm } from "../../components/ConfirmDialog";
import { BiChevronRight } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../../components/BackButton";
import Skeleton from "../../components/Skeleton";

export const AhspView: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const confirm = useConfirm();
  const { data, isLoading, isError, error, refetch } = useHspDetail();
  const recomputeMut = useRecomputeHsp();
  const updateCompMut = useUpdateAhspComponent();
  const updateOverheadMut = useUpdateAhspOverhead();
  const deleteMut = useDeleteAhspComponent();

  const [overheadEdit, setOverheadEdit] = useState<string>("");
  const [dirty, setDirty] = useState<
    Record<string, { coefficient?: string; priceOverride?: string }>
  >({});
  const [addOpen, setAddOpen] = useState<{
    open: boolean;
    group: GroupKey | null;
  }>({ open: false, group: null });
  const [firstGroup, setFirstGroup] = useState<GroupKey>("LABOR");

  // === Hapus OTHER: gunakan urutan grup tanpa OTHER ===
  const ORDER_NO_OTHER = useMemo(
    () => GROUP_ORDER.filter((g) => g !== ("OTHER" as GroupKey)) as GroupKey[],
    []
  );

  React.useEffect(() => {
    if (data?.recipe)
      setOverheadEdit(String(data.recipe.overheadPercent ?? 10));
  }, [data?.recipe?.overheadPercent]);

  const hasDirty = useMemo(
    () =>
      Object.keys(dirty).some(
        (k) =>
          dirty[k].coefficient !== undefined ||
          dirty[k].priceOverride !== undefined
      ),
    [dirty]
  );

  const view = useMemo<AhspDetailModel | null>(() => {
    if (!data) return null;
    const d: AhspDetailModel = JSON.parse(JSON.stringify(data));
    if (!d.recipe) return d;

    const oh = parseFloat(overheadEdit);
    const overheadPercent = isFinite(oh) ? oh : d.recipe.overheadPercent;
    let A = 0,
      B = 0,
      C = 0;
    const nextGroups: any = {};

    // === Loop hanya LABOR, MATERIAL, EQUIPMENT ===
    for (const g of ORDER_NO_OTHER) {
      const grp = d.recipe.groups[g];
      const items = grp?.items || [];
      const nextItems = items.map((it: AhspComponentModel) => {
        const patch = dirty[it.id] || {};
        const newCoef =
          patch.coefficient !== undefined
            ? parseNumber(patch.coefficient)
            : it.coefficient;
        const newPO =
          patch.priceOverride !== undefined
            ? patch.priceOverride.trim() === ""
              ? null
              : parseNumber(patch.priceOverride)
            : it.priceOverride;
        const basePrice =
          newPO ?? it.masterItem?.price ?? it.unitPriceSnapshot ?? 0;
        return {
          ...it,
          coefficient: newCoef,
          priceOverride: newPO,
          effectiveUnitPrice: basePrice,
          subtotal: newCoef * basePrice,
        };
      });
      const subtotal = sum(nextItems.map((x) => x.subtotal || 0));
      nextGroups[g] = {
        key: g,
        label: GROUP_LABEL[g],
        subtotal,
        items: nextItems,
      };
      if (g === "LABOR") A = subtotal;
      if (g === "MATERIAL") B = subtotal;
      if (g === "EQUIPMENT") C = subtotal;
    }

    const D = A + B + C;
    const E = D * (overheadPercent / 100);
    const F = D + E;

    return {
      ...d,
      recipe: {
        ...d.recipe,
        overheadPercent,
        groups: nextGroups,
        computed: { A, B, C, D, E, F },
      },
    };
  }, [data, dirty, overheadEdit, ORDER_NO_OTHER]);

  const onCoefChange = (id: string, v: string) =>
    setDirty((p) => ({ ...p, [id]: { ...(p[id] || {}), coefficient: v } }));

  const onPriceOverrideChange = (id: string, v: string) =>
    setDirty((p) => ({ ...p, [id]: { ...(p[id] || {}), priceOverride: v } }));

  const computeSubtotal = (
    it: AhspComponentModel,
    coefStr: string,
    priceOverrideStr: string
  ) => {
    const basePrice =
      (priceOverrideStr?.toString().trim() !== ""
        ? parseNumber(priceOverrideStr)
        : it.priceOverride ?? undefined) ??
      it.masterItem?.price ??
      it.unitPriceSnapshot ??
      0;
    return parseNumber(coefStr) * basePrice;
  };

  const saveRow = async (comp: AhspComponentModel) => {
    try {
      const patch = dirty[comp.id];
      if (!patch) return;
      const payload: any = {};
      if (patch.coefficient !== undefined)
        payload.coefficient = parseNumber(patch.coefficient);
      if (patch.priceOverride !== undefined)
        payload.priceOverride =
          patch.priceOverride.trim() === ""
            ? null
            : parseNumber(patch.priceOverride);
      await updateCompMut.mutateAsync({ componentId: comp.id, ...payload });
      setDirty((prev) => {
        const n = { ...prev };
        delete n[comp.id];
        return n;
      });
      notify("Perubahan baris disimpan", "success");
    } catch (e: any) {
      notify(e?.message || "Gagal menyimpan baris", "error");
    }
  };

  const saveAll = async () => {
    try {
      const ids = Object.keys(dirty);
      for (const id of ids) {
        const p = dirty[id];
        const payload: any = {};
        if (p.coefficient !== undefined)
          payload.coefficient = parseNumber(p.coefficient);
        if (p.priceOverride !== undefined)
          payload.priceOverride =
            p.priceOverride.trim() === "" ? null : parseNumber(p.priceOverride);
        await updateCompMut.mutateAsync({ componentId: id, ...payload });
      }
      setDirty({});
      notify("Semua perubahan disimpan", "success");
    } catch (e: any) {
      notify(e?.message || "Gagal menyimpan semua perubahan", "error");
    }
  };

  const saveOverhead = async () => {
    try {
      if (!view?.recipe || !view?.kode) return;
      const oh = parseFloat(overheadEdit);
      const overheadPercent = isFinite(oh) ? oh : view.recipe.overheadPercent;
      await updateOverheadMut.mutateAsync({ code: view.kode, overheadPercent });
      notify("Overhead & profit diperbarui", "success");
    } catch (e: any) {
      notify(e?.message || "Gagal memperbarui overhead", "error");
    }
  };

  const recompute = async () => {
    try {
      if (!view?.id) return;
      await recomputeMut.mutateAsync({ itemId: view.id });
      await refetch();
      notify("Recompute & sync harga berhasil", "success");
    } catch (e: any) {
      notify(e?.message || "Gagal melakukan recompute", "error");
    }
  };

  const removeRow = async (compId: string) => {
    const ok = await confirm({
      title: "Hapus Komponen?",
      description: "Tindakan ini tidak dapat dibatalkan. Lanjutkan?",
      confirmText: "Hapus",
      cancelText: "Batal",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await deleteMut.mutateAsync({ componentId: compId });
      await refetch();
      notify("Komponen dihapus", "success");
    } catch (e: any) {
      notify(e?.message || "Gagal menghapus komponen", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w mx-auto p-4 space-y-6 text-black">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <Skeleton.Line width="w-24" height="h-9" className="rounded-lg" />
          <Skeleton.Line width="w-72" height="h-7" />
        </div>

        {/* header info */}
        <div className="flex items-center gap-2">
          <Skeleton.Line width="w-20" height="h-7" />
          <BiChevronRight className="text-gray-300 h-6 w-6" />
          <Skeleton.Line width="w-80" height="h-6" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
              <Skeleton.Line width="w-24" height="h-4" className="mb-2" />
              <Skeleton.Line width="w-40" height="h-6" />
              <Skeleton.Line width="w-28" height="h-3" className="mt-1" />
            </div>
          ))}
        </div>

        {Array.from({ length: 2 }).map((_, box) => (
          <div
            key={box}
            className="rounded-xl border bg-white p-4 shadow-sm space-y-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton.Line width="w-48" height="h-5" />
              <Skeleton.Line width="w-24" height="h-8" className="rounded-md" />
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    {[
                      "Kode",
                      "Deskripsi",
                      "Koefisien",
                      "Satuan",
                      "Harga",
                      "Subtotal",
                      "Aksi",
                    ].map((_, i) => (
                      <th key={i}>
                        <Skeleton.Line width="w-20" height="h-4" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((__, r) => (
                    <tr key={r}>
                      <td>
                        <Skeleton.Line width="w-16" height="h-4" />
                      </td>
                      <td>
                        <Skeleton.Line width="w-64" height="h-4" />
                      </td>
                      <td>
                        <Skeleton.Line width="w-16" height="h-4" />
                      </td>
                      <td>
                        <Skeleton.Line width="w-14" height="h-4" />
                      </td>
                      <td>
                        <Skeleton.Line width="w-24" height="h-4" />
                      </td>
                      <td>
                        <Skeleton.Line width="w-24" height="h-4" />
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Skeleton.Circle width="w-6" height="h-6" />
                          <Skeleton.Circle width="w-6" height="h-6" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}></td>
                    <td>
                      <Skeleton.Line width="w-28" height="h-5" />
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}

        {/* bottom summary & actions */}
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-gray-50 p-3">
                <Skeleton.Line width="w-44" height="h-4" className="mb-2" />
                <Skeleton.Line width="w-40" height="h-6" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Skeleton.Line width="w-56" height="h-10" className="rounded-md" />
            <Skeleton.Line width="w-56" height="h-10" className="rounded-md" />
            <div className="ml-auto">
              <Skeleton.Line width="w-56" height="h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !view)
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-black">AHSP VIEW</h1>
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {(error as any)?.message || "Data tidak ditemukan"}
        </div>
      </div>
    );

  const { recipe } = view;

  return (
    <div className="space-y-6">
      <BackButton
        className="
    fixed z-10
    left-4 top-20 
    md:left-[calc(16rem+1rem)]  
  "
        onClick={() => navigate("/hsp")}
        title="Kembali"
      />
      <div className="flex items-center mt-15">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">AHSP</h1>
        <BiChevronRight className="text-black h-6 w-6" />
        <p className="text-lg text-gray-600 font-semibold">
          <span className="font-semibold">{view.kode}</span> — {view.deskripsi}{" "}
          ({view.satuan})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 text-black">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">Harga Tersimpan</div>
          <div className="text-lg font-semibold">
            {fmtIDRWithSymbol(view.harga)}
          </div>
          {/* <div className="text-xs text-gray-500">(HSPItem.harga)</div> */}
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">
            Harga Terhitung (F)
          </div>
          <div className="text-lg font-semibold">
            {fmtIDRWithSymbol(recipe?.computed.F ?? 0)}
          </div>
          {/* <div className="text-xs text-gray-500">D+E (live)</div> */}
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">
            Overhead & Profit
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              className="w-24 rounded-md border px-2 py-1 text-right"
              value={overheadEdit}
              onChange={(e) => setOverheadEdit(e.target.value)}
              onBlur={() => {
                const n = parseFloat(overheadEdit);
                if (!isFinite(n))
                  setOverheadEdit(String(recipe?.overheadPercent ?? 10));
              }}
            />
            <span className="text-sm">%</span>
            <button
              onClick={saveOverhead}
              className="ml-auto rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      {recipe ? (
        <div className="space-y-10">
          {ORDER_NO_OTHER.map((g) => {
            const grp = recipe.groups[g];
            const items = grp?.items || [];
            return (
              <AhspGroupTable
                key={g}
                groupKey={g}
                items={items}
                subtotal={grp?.subtotal || 0}
                dirty={dirty}
                onCoefChange={onCoefChange}
                onPriceOverrideChange={onPriceOverrideChange}
                computeSubtotal={computeSubtotal}
                onSaveRow={saveRow}
                onRemoveRow={removeRow}
                onAddClick={() => setAddOpen({ open: true, group: g })}
                isUpdatingRow={updateCompMut.isPending}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-yellow-50 p-4 text-yellow-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              Belum ada recipe AHSP untuk item ini.
              <div className="text-sm">
                Pilih grup lalu klik{" "}
                <span className="font-semibold">+ Tambah</span> untuk membuat
                komponen pertama.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Grup:</label>
              {/* === Hanya 3 grup; OTHER dihapus === */}
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={firstGroup}
                onChange={(e) => setFirstGroup(e.target.value as GroupKey)}
              >
                <option value="LABOR">A — Tenaga</option>
                <option value="MATERIAL">B — Bahan</option>
                <option value="EQUIPMENT">C — Peralatan</option>
              </select>
              <button
                onClick={() => setAddOpen({ open: true, group: firstGroup })}
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                + Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {recipe && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3 text-black">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs uppercase text-gray-500">
                D — Jumlah (A+B+C)
              </div>
              <div className="text-lg font-semibold">
                {fmtIDRWithSymbol(recipe.computed.D)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs uppercase text-gray-500">
                E — Overhead & Profit ({recipe.overheadPercent}%)
              </div>
              <div className="text-lg font-semibold ">
                {fmtIDRWithSymbol(recipe.computed.E)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs uppercase text-gray-500">
                F — Harga Satuan Pekerjaan (D+E)
              </div>
              <div className="text-lg font-semibold">
                {fmtIDRWithSymbol(recipe.computed.F)}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={saveAll}
              disabled={!hasDirty || updateCompMut.isPending}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                hasDirty
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {updateCompMut.isPending
                ? "Menyimpan..."
                : "Simpan Semua Perubahan"}
            </button>
            <button
              onClick={recompute}
              disabled={recomputeMut.isPending}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              title="Hitung ulang & sync harga tersimpan"
            >
              {recomputeMut.isPending
                ? "Memproses..."
                : "Sinkronkan Harga Ke HSP Item"}
            </button>
            <div className="ml-auto text-sm text-gray-500">
              Terakhir diperbarui:{" "}
              <span className="font-medium">
                {new Date(recipe.updatedAt).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      )}

      <AddComponentModal
        open={addOpen.open}
        onClose={() => setAddOpen({ open: false, group: null })}
        hspCode={view.kode}
        group={addOpen.group || "LABOR"}
        onAdded={async () => {
          await refetch();
          notify("Komponen ditambahkan", "success");
        }}
        title={`Tambah Komponen ${GROUP_TITLE[addOpen.group || "LABOR"]}`}
      />
    </div>
  );
};

export default AhspView;
