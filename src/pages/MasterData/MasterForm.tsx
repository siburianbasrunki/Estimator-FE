// src/pages/master/MasterForm.tsx
import React from "react";
import type {
  MasterCreatePayload,
  MasterItem,
  MasterType,
  MasterUpdatePayload,
} from "../../model/master";
import SearchableSelect, {
  type Option,
} from "../../components/SearchableSelect";
import { BiPlus } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useGetUnits } from "../../hooks/useHookUnits";
type Props = {
  mode: "create" | "edit";
  type: MasterType;
  initial?: Partial<MasterItem>;
  onCancel: () => void;
  onSubmit: (
    payload: MasterCreatePayload | MasterUpdatePayload,
    opts?: { recompute?: boolean }
  ) => Promise<void> | void;
};

const isLabor = (t: MasterType) => t === "LABOR";
const toNum = (v: string) => {
  const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const MasterForm: React.FC<Props> = ({
  mode,
  type,
  initial,
  onCancel,
  onSubmit,
}) => {
  // common
  const [name, setName] = React.useState(initial?.name ?? "");
  const [unit, setUnit] = React.useState(
    initial?.unit ?? (isLabor(type) ? "OH" : "")
  );
  const [notes, setNotes] = React.useState(initial?.notes ?? "");

  // code hanya untuk LABOR (sesuai kebutuhanmu)
  const [code, setCode] = React.useState(initial?.code ?? "");

  // material price
  const [price, setPrice] = React.useState(
    initial?.price != null ? String(initial?.price) : ""
  );

  // labor fields
  const [hourlyRate, setHourlyRate] = React.useState(
    initial?.hourlyRate != null ? String(initial?.hourlyRate) : ""
  );
  const [dailyRate, setDailyRate] = React.useState(
    initial?.dailyRate != null ? String(initial?.dailyRate) : ""
  );
  const [hoursPerDay, setHoursPerDay] = React.useState("8");
  const [autoFromDaily, setAutoFromDaily] = React.useState(true);

  // recompute saat edit
  const [recompute, setRecompute] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { data: units, isLoading: isLoadingUnits } = useGetUnits('');

  const unitOptions: Option[] = React.useMemo(
    () =>
      (units ?? []).map((u: any) => ({
        label: u.label ?? u.value ?? u.name ?? u.code ?? String(u),
        value: u.value ?? u.label ?? u.code ?? u.name ?? String(u),
      })),
    [units]
  );
  // Auto hitung hourly dari daily ÷ jam/hari
  React.useEffect(() => {
    if (!isLabor(type)) return;
    if (!autoFromDaily) return;
    const d = toNum(dailyRate || "0");
    const h = Math.max(1, Math.round(toNum(hoursPerDay || "8")));
    const hr = Math.round(d / h); // dibulatkan
    if (d > 0) setHourlyRate(String(hr));
  }, [dailyRate, hoursPerDay, autoFromDaily, type]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLabor(type)) {
        // gunakan dailyRate sbg price (unit default OH). Fallback ke hourlyRate jika daily kosong.
        const hr = hourlyRate.trim() === "" ? null : toNum(hourlyRate);
        const dr = dailyRate.trim() === "" ? null : toNum(dailyRate);

        const base: MasterCreatePayload = {
          type,
          name: name.trim(),
          unit: unit.trim(),
          // biarkan BE isi auto price dari dailyRate/hourlyRate jika price tidak dikirim
          hourlyRate: hr,
          dailyRate: dr,
          notes: notes.trim() === "" ? null : notes.trim(),
          // Kode wajib untuk LABOR
          code: code.trim(),
        };

        if (mode === "create") {
          await onSubmit(base);
        } else {
          const patch: MasterUpdatePayload = {};
          if (name.trim() !== initial?.name) patch.name = base.name;
          if (unit.trim() !== initial?.unit) patch.unit = base.unit;
          if ((code.trim() || "") !== (initial?.code || ""))
            patch.code = base.code;
          if ((hr ?? null) !== (initial?.hourlyRate ?? null))
            patch.hourlyRate = hr;
          if ((dr ?? null) !== (initial?.dailyRate ?? null))
            patch.dailyRate = dr;
          if ((notes.trim() || null) !== (initial?.notes ?? null))
            patch.notes = base.notes;

          // price sengaja tidak di-patch langsung; BE akan sync dari dailyRate bila ada
          await onSubmit(patch, { recompute });
        }
      } else {
        // MATERIAL / EQUIPMENT / OTHER
        const base: MasterCreatePayload = {
          type,
          name: name.trim(),
          unit: unit.trim(),
          price: toNum(price || "0"),
          notes: notes.trim() === "" ? null : notes.trim(),
          // code opsional, bisa dikosongkan → BE auto generate
        };

        if (mode === "create") {
          await onSubmit(base);
        } else {
          const patch: MasterUpdatePayload = {};
          if (name.trim() !== initial?.name) patch.name = base.name;
          if (unit.trim() !== initial?.unit) patch.unit = base.unit;
          if (toNum(price || "0") !== (initial?.price ?? 0))
            patch.price = base.price;
          if ((notes.trim() || null) !== (initial?.notes ?? null))
            patch.notes = base.notes;
          await onSubmit(patch, { recompute });
        }
      }

      onCancel();
    } finally {
      setSubmitting(false);
    }
  };
  const navigate = useNavigate();

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Nama */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Nama{isLabor(type) && " Tenaga"}
          </label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-black border-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Kode: hanya LABOR */}
        {isLabor(type) ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kode
            </label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-black border-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={code}
              disabled={mode === "edit"}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
        ) : null}

        {/* Satuan */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Satuan
          </label>
          <SearchableSelect
            className="mt-1 z-[2000]"
            options={unitOptions}
            value={unit || undefined}
            onChange={(v) => setUnit(v ?? (isLabor(type) ? "OH" : ""))}
            placeholder={
              isLoadingUnits
                ? "Memuat..."
                : isLabor(type)
                ? "OH"
                : "Pilih satuan"
            }
            size="sm"
            clearable={false}
            isButton={
              <>
                <button
                  onClick={() => navigate("/units")}
                  className="btn bg-green-500 btn-sm w-full"
                  title="Tambah item manual"
                >
                  <BiPlus className="mr-1 text-white" /> Units
                </button>
              </>
            }
          />
        </div>

        {/* MATERIAL price */}
        {!isLabor(type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Harga Satuan
            </label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-right text-black border-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              required
            />
          </div>
        )}

        {/* LABOR fields */}
        {isLabor(type) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Jam per Hari
              </label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-right text-black border-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                inputMode="numeric"
                placeholder="8"
              />
              <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={autoFromDaily}
                  onChange={(e) => setAutoFromDaily(e.target.checked)}
                />
                Hitung otomatis harga/jam = harga/hari ÷ jam/hari (dibulatkan)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Harga / Hari
              </label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-right text-black border-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                inputMode="decimal"
                placeholder="mis. 125000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Harga / Jam
              </label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-right text-black border-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                inputMode="decimal"
                placeholder="mis. 15625"
              />
            </div>
          </>
        )}

        {/* Keterangan */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Keterangan
          </label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 text-black border-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isLabor(type)
                ? "Catatan untuk jenis tenaga ini…"
                : "Catatan bahan/peralatan/lain-lain…"
            }
          />
        </div>
      </div>

      {mode === "edit" && (
        <label className="inline-flex items-center gap-2 text-sm text-black">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={recompute}
            onChange={(e) => setRecompute(e.target.checked)}
          />
          Recompute semua AHSP yang memakai item ini
        </label>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {submitting
            ? "Menyimpan..."
            : mode === "create"
            ? "Tambah"
            : "Simpan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
        >
          Batal
        </button>
      </div>
    </form>
  );
};
