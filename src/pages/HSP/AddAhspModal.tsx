import React from "react";
import type { GroupKey } from "../../model/hsp";
import { useSearchMaster, useCreateAhspComponent } from "../../hooks/useHsp";
import { fmtIDRPlain, parseNumber } from "../../helper/rupiah";
import Portal from "../../components/Portal";
import { useNavigate } from "react-router-dom"; // ⬅️ NEW

type Props = {
  open: boolean;
  onClose: () => void;
  hspCode: string;
  group: GroupKey;
  onAdded?: () => void;
  title: string;
};

type Picked = {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
};

const AddComponentModal: React.FC<Props> = ({
  open,
  onClose,
  hspCode,
  group,
  onAdded,
  title,
}) => {
  const navigate = useNavigate(); // ⬅️ NEW
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [coef, setCoef] = React.useState("1");
  const [overridePrice, setOverridePrice] = React.useState<string>("");
  const [selected, setSelected] = React.useState<Picked | null>(null); // single-select

  const list = useSearchMaster({ type: group, q, page, take: 10 });
  const createMut = useCreateAhspComponent();

  React.useEffect(() => {
    if (!open) {
      setQ("");
      setPage(1);
      setCoef("1");
      setOverridePrice("");
      setSelected(null);
    }
  }, [open]);

  if (!open) return null;

  const total = list.data?.pagination.total || 0;
  const lastPage = Math.max(1, Math.ceil(total / 10));

  const toggleSelect = (it: any) => {
    setSelected((prev) =>
      prev?.id === it.id
        ? null
        : {
            id: it.id,
            code: it.code,
            name: it.name,
            unit: it.unit,
            price: it.price,
          }
    );
  };

  const add = async () => {
    if (!selected) return;
    await createMut.mutateAsync({
      code: hspCode,
      payload: {
        group,
        masterItemId: selected.id,
        coefficient: parseNumber(coef || "1"),
        priceOverride:
          overridePrice.trim() === "" ? null : parseNumber(overridePrice),
      },
    });
    onAdded?.();
    onClose();
  };

  const masterLink =
    group === "LABOR"
      ? "/master/upah"
      : group === "MATERIAL"
      ? "/master/bahan"
      : null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-gray-200/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-lg font-semibold text-black">{title}</div>
            {masterLink && (
              <button
                type="button"
                onClick={() => navigate(masterLink)} 
                className="rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                title={`Buka halaman ${group === "LABOR" ? "Tenaga" : "Bahan"}`}
              >
                Kelola {group === "LABOR" ? "Tenaga" : "Bahan"}
              </button>
            )}
          </div>

          <div className="mb-3 flex items-end gap-3">
            <div className="grow">
              <label className="block text-xs font-medium text-gray-600">
                Cari master
              </label>
              <input
                className="mt-1 w-full rounded-md border border-black px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="kode/nama/satuan"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="mb-1 text-sm text-gray-500">
              {list.isFetching ? "Memuat…" : `${total} item`}
            </div>
          </div>

          <div className="max-h-64 overflow-auto rounded border">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50 text-left text-sm text-gray-600">
                  <th className="border-b px-3 py-2">Pilih</th>
                  <th className="border-b px-3 py-2">Kode</th>
                  <th className="border-b px-3 py-2">Nama</th>
                  <th className="border-b px-3 py-2">Satuan</th>
                  <th className="border-b px-3 py-2">Harga</th>
                </tr>
              </thead>
              <tbody>
                {list.isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      Memuat…
                    </td>
                  </tr>
                )}
                {!list.isLoading && (list.data?.data.length || 0) === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                )}
                {list.data?.data.map((it: any) => {
                  const checked = selected?.id === it.id;
                  return (
                    <tr key={it.id} className="text-sm hover:bg-gray-50">
                      <td className="border-t px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(it)}
                        />
                      </td>
                      <td className="border-t px-3 py-2 text-black">
                        {it.code}
                      </td>
                      <td className="border-t px-3 py-2 text-black">
                        {it.name}
                      </td>
                      <td className="border-t px-3 py-2 text-black">
                        {it.unit}
                      </td>
                      <td className="border-t px-3 py-2 text-black">
                        {fmtIDRPlain(it.price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-black">
            <div className="text-gray-600">
              Dipilih:{" "}
              <span className="font-semibold">{!!selected ? 1 : 0}</span> item
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border px-3 py-1"
                disabled={page <= 1 || list.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              <div>
                Hal {page} / {lastPage}
              </div>
              <button
                className="rounded-md border px-3 py-1"
                disabled={page >= lastPage || list.isFetching}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Koefisien
              </label>
              <input
                className="mt-1 w-full rounded-md border border-black px-3 py-2 text-right text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={coef}
                onChange={(e) => setCoef(e.target.value)}
                inputMode="decimal"
                placeholder="1.0000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Harga Override (opsional)
              </label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-right text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
                inputMode="decimal"
                placeholder={
                  selected ? fmtIDRPlain(selected.price) : "harga master"
                }
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              onClick={add}
              disabled={!selected || createMut.isPending}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {createMut.isPending ? "Menyimpan…" : "Tambah"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default AddComponentModal;
