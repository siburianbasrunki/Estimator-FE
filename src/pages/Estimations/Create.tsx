import React, { useMemo, useState } from "react";
import Input from "../../components/input";
import ImageProyek from "../../assets/images/image 1.png";
import {
  BiEdit,
  BiTrash,
  BiPlus,
  BiSave,
  BiCalculator,
  BiCopy,
} from "react-icons/bi";
import Button from "../../components/Button";
import { UnitList } from "../../stores/units";
import { useCreateEstimation } from "../../hooks/useEstimation";
import { useGetAdminAllWithItemsFlat } from "../../hooks/useHsp";
import type { Option } from "../../components/SearchableSelect";
import SearchableSelect from "../../components/SearchableSelect";

/* dnd-kit */
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  defaultDropAnimation,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  pointerWithin,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* Volume Modal */
import type { VolumeDetailRow, ExtraCol } from "./VolumeModal";
import VolModal from "./VolumeModal";

import { BackButton } from "../../components/BackButton";
import { useNavigate } from "react-router-dom";
import { useNotify } from "../../components/Notify/notify";

/* ------------------------------ Helpers ------------------------------ */
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatIDR = (n: number = 0) =>
  `Rp ${Math.max(0, Number(n || 0)).toLocaleString("id-ID")}`;

const sanitizeMoneyInput = (v: string) =>
  v
    .replace(/[^\d.,]/g, "")
    .replace(/,/g, ".")
    .replace(/^0+(?=\d)/, "");
const toNumber = (v?: string) =>
  v == null || v.trim() === "" ? 0 : Number(v) || 0;

/** Volume efektif mengikuti mode - MANUAL > DETAIL */
type VolumeSource = "MANUAL" | "DETAIL";
const getEffectiveVolume = (i: ItemRow) =>
  (i.volumeSource === "MANUAL"
    ? Math.max(0, toNumber(i.manualVolumeInput || "0"))
    : Math.max(0, Number(i.volume || 0))) || 0;

/* --- Numbering helpers --- */
const toRoman = (num: number) => {
  if (num <= 0) return "";
  const map: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let n = num;
  let out = "";
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
};
const toAlpha = (idx0: number) => {
  // 0->a, 25->z, 26->aa
  let n = idx0 + 1;
  let out = "";
  while (n > 0) {
    n--; // 1-based to 0-based char
    out = String.fromCharCode(97 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
};
const toArabic = (idx0: number) => String(idx0 + 1);

/* ------------------------------ Types ------------------------------ */
interface CustomFieldUI {
  id: string;
  label: string;
  value: string;
  type: string;
}
interface ProjectProfile {
  projectName: string;
  owner: string;
  ppn: string;
  notes: string;
  customFields: Record<string, string>;
}

type ItemRow = {
  id: string;
  kode: string;
  deskripsi: string;

  volume: number;
  volumeDetails?: VolumeDetailRow[];

  volumeSource?: VolumeSource; // "MANUAL" | "DETAIL"
  manualVolumeInput?: string; // input string manual

  satuan: string;
  hargaSatuan: number;
  hargaSatuanInput?: string;
  hargaTotal: number;
  isEditing?: boolean;
};

type Group = {
  id: string;
  title: string; // contoh: "Cor Beton Sloof 20x25 cm"
  items: ItemRow[]; // contoh: Pembesian, Bekisting, Beton
  isEditingTitle?: boolean;
};

type Section = {
  id: string;
  title: string; // contoh: "IV PEKERJAAN BETON"
  groups?: Group[]; // daftar Title (opsional)
  items?: ItemRow[]; // fallback jika tanpa Title
  isEditingTitle?: boolean;
};

/* -------------------------- Step 1 (Profil) -------------------------- */
const CreateStepOne = ({
  onSave,
  formData,
  setFormData,
  customFields,
  setCustomFields,
  imageFile,
  setImageFile,
}: {
  onSave: () => void;
  formData: { projectName: string; owner: string; ppn: string; notes: string };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      projectName: string;
      owner: string;
      ppn: string;
      notes: string;
    }>
  >;
  customFields: CustomFieldUI[];
  setCustomFields: React.Dispatch<React.SetStateAction<CustomFieldUI[]>>;
  imageFile: File | null;
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>;
}) => {
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onPickImage = (f?: File | null) => {
    setImageFile(f ?? null);
    if (previewUrl && previewUrl.startsWith("blob:"))
      URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomFieldChange = (id: string, value: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value } : f))
    );
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    setCustomFields((prev) => [
      ...prev,
      { id: uid(), label: newFieldLabel.trim(), value: "", type: newFieldType },
    ]);
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const removeCustomField = (id: string) =>
    setCustomFields((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-2">
        <div className="h-6 w-1.5 bg-blue-600 rounded" />
        <p className="text-blue-700 font-semibold">Profil Proyek</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Left form */}
        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Proyek"
              placeholder="Masukkan nama proyek"
              name="projectName"
              value={formData.projectName}
              onChange={handleInputChange}
            />
            <Input
              label="Pemilik Proyek"
              placeholder="Masukkan pemilik proyek"
              name="owner"
              value={formData.owner}
              onChange={handleInputChange}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PPN (%)
              </label>
              <input
                name="ppn"
                type="number"
                min={0}
                className="input input-bordered w-full text-black bg-white border-black"
                value={formData.ppn}
                onChange={handleInputChange}
                placeholder="11"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="textarea textarea-bordered w-full text-black bg-white border-black"
              placeholder="Masukkan deskripsi / catatan proyek"
              rows={4}
            />
          </div>

          {/* Custom fields */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              Custom Fields
            </div>
            {!!customFields.length && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map((field) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        label={field.label}
                        name={`custom-${field.id}`}
                        type={field.type}
                        value={field.value}
                        onChange={(e) =>
                          handleCustomFieldChange(field.id, e.target.value)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="btn btn-ghost btn-sm text-red-600"
                      aria-label="Hapus field"
                      title="Hapus field"
                    >
                      <BiTrash size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom field */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Label field (mis. Lokasi, Deadline, dll)"
                className="input input-bordered w-full text-black bg-white border-black"
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="select select-bordered w-full sm:w-44 text-black bg-white border-black"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="date">Date</option>
              </select>
              <button
                onClick={addCustomField}
                className="btn btn-primary text-white"
              >
                <BiPlus size={18} /> Tambah Field
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button onClick={onSave} className="btn btn-success text-white">
              Lanjut ke Estimation Items
            </button>
          </div>
        </div>

        {/* Right preview image */}
        <div className="lg:w-1/3">
          <div className="card bg-base-100 border border-gray-200 shadow-sm">
            <figure className="px-4 pt-4">
              <img
                src={previewUrl || ImageProyek}
                alt="Preview Proyek"
                className="rounded-lg border border-gray-200 object-cover"
              />
            </figure>
            <div className="card-body p-4">
              <input
                id="project-image-input-create"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="project-image-input-create"
                className="btn btn-outline btn-sm cursor-pointer"
              >
                <BiEdit className="mr-1" /> Ganti Gambar
              </label>
              {!!imageFile && (
                <button
                  className="btn btn-ghost btn-xs text-red-600 mt-2"
                  onClick={() => onPickImage(null)}
                >
                  <BiTrash className="mr-1" /> Batalkan gambar
                </button>
              )}
              <div className="text-xs text-gray-500">
                Format disarankan: JPG/PNG, rasio 4:3.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- Droppable zone (div, non-table) ---------------------- */
function DroppableZone({
  droppableId,
  showHint = false,
  className = "",
}: {
  droppableId: string;
  showHint?: boolean;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  return (
    <div
      ref={setNodeRef}
      className={`h-9 rounded transition-all ${
        isOver
          ? "border-2 border-dashed border-primary/70 bg-primary/5"
          : "border border-dashed border-transparent"
      } ${className}`}
    >
      {showHint && !isOver ? (
        <div className="text-[11px] text-gray-400 italic px-2 py-1">
          Drop di sini
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------- Item Card (job) --------------------------- */
function SortableItemCard({
  itemIndexDisplay,
  item,
  onEditToggle,
  onDelete,
  onCopy,
  onUpdateField,
  onOpenVolumeModal,
  kodeOptions,
  onChangeKode,
}: {
  /** string indeks yang sudah diformat (a, b, c / 1, 2, 3) */
  itemIndexDisplay: string;
  item: ItemRow;
  onEditToggle: (id: string, editing: boolean) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
  onUpdateField: (id: string, field: keyof ItemRow, value: any) => void;
  onOpenVolumeModal: (item: ItemRow) => void;
  kodeOptions: Option[];
  onChangeKode: (id: string, kodeBaru: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const unitOptions: Option[] = useMemo(
    () =>
      (UnitList ?? []).map((u: { label: string; value: string }) => ({
        label: u.value,
        value: u.value,
      })),
    []
  );

  const volInputDisplay =
    item.volumeSource === "MANUAL"
      ? item.manualVolumeInput ?? ""
      : String(Number(item.volume || 0));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-3 sm:p-4 bg-white ${
        isDragging ? "ring-2 ring-primary/50 bg-blue-50/40" : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* No / drag handle */}
        <button
          className="btn btn-ghost btn-xs cursor-grab active:cursor-grabbing text-gray-600 text-xl"
          title="Drag"
          aria-label="Drag untuk memindahkan"
          {...attributes}
          {...listeners}
        >
          ≡
        </button>
        <div className="text-md font-semibold text-black min-w-6 pt-1">
          {itemIndexDisplay}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Uraian & aksi */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1">
              {item.isEditing ? (
                <input
                  className="input input-bordered input-sm w-full text-black bg-white border-black"
                  value={item.deskripsi}
                  onChange={(e) =>
                    onUpdateField(item.id, "deskripsi", e.target.value)
                  }
                  placeholder="Nama / deskripsi pekerjaan"
                />
              ) : (
                <div className="font-medium text-gray-800 break-words">
                  {item.deskripsi || "-"}
                </div>
              )}
            </div>

            {/* Aksi */}
            <div className="flex items-center gap-2">
              {!item.isEditing ? (
                <button
                  onClick={() => onEditToggle(item.id, true)}
                  className="btn btn-ghost btn-xs text-blue-600"
                  title="Edit"
                >
                  <BiEdit className="text-lg" />
                </button>
              ) : (
                <button
                  onClick={() => onEditToggle(item.id, false)}
                  className="btn btn-ghost btn-xs text-green-600"
                  title="Simpan"
                >
                  <BiSave className="text-lg" />
                </button>
              )}

              <button
                onClick={() => onCopy(item.id)}
                className="btn btn-ghost btn-xs text-indigo-600"
                title="Salin"
              >
                <BiCopy className="text-lg" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="btn btn-ghost btn-xs text-red-600"
                title="Hapus"
              >
                <BiTrash className="text-lg" />
              </button>
            </div>
          </div>

          {/* Grid field: Kode, Vol + Detail, Satuan, Harga Satuan, Total */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">Kode</div>
              {item.isEditing ? (
                <SearchableSelect
                  options={kodeOptions}
                  value={item.kode ?? ""}
                  onChange={(v) => v && onChangeKode(item.id, v)}
                  placeholder="Pilih Kode"
                  size="sm"
                />
              ) : (
                <div className="font-mono text-sm text-gray-800">
                  {item.kode || "-"}
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] text-gray-500 mb-1">Volume</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="input input-bordered input-sm w-28 text-right text-black bg-white border-black"
                  value={volInputDisplay}
                  onChange={(e) => {
                    onUpdateField(item.id, "volumeSource", "MANUAL");
                    onUpdateField(item.id, "manualVolumeInput", e.target.value);
                  }}
                  placeholder="0.00"
                />
                <button
                  className="btn btn-ghost btn-xs text-blue-600"
                  title="Detail Volume"
                  onClick={() => onOpenVolumeModal(item)}
                >
                  <BiCalculator className="mr-1" /> Detail
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-gray-500 mb-1">Satuan</div>
              {item.isEditing ? (
                <SearchableSelect
                  options={unitOptions}
                  value={item.satuan ?? ""}
                  onChange={(v) => onUpdateField(item.id, "satuan", v ?? "")}
                  placeholder="Pilih Satuan"
                  size="sm"
                />
              ) : (
                <div className="text-sm text-gray-800">
                  {item.satuan || "-"}
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] text-gray-500 mb-1">Harga Satuan</div>
              {item.isEditing ? (
                <input
                  type="text"
                  inputMode="decimal"
                  className="input input-bordered input-sm w-full text-black bg-white border-black"
                  value={item.hargaSatuanInput ?? ""}
                  onChange={(e) =>
                    onUpdateField(item.id, "hargaSatuanInput", e.target.value)
                  }
                  onBlur={() => onEditToggle(item.id, false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape")
                      onEditToggle(item.id, false);
                  }}
                  placeholder="0"
                />
              ) : (
                <div className="text-sm text-black font-medium">
                  {formatIDR(item.hargaSatuan)}
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] text-gray-500 mb-1">Harga Total</div>
              <div className="text-sm font-semibold text-gray-800">
                {formatIDR(item.hargaTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- Group Header (Title) - Card ---------------------- */
function SortableGroupHeaderCard({
  groupIndexArabic,
  sectionId,
  group,
  isLoadingItems,
  PekerjaanOptions,
  DropdownPekerjaan,
  addItemToGroup,
  deleteGroup,
  onToggleEditGroupTitle,
  onChangeGroupTitle,
}: {
  sectionIndexRoman: string; // I, II, ...
  groupIndexArabic: string; // 1, 2, ...
  sectionId: string;
  group: Group;
  isLoadingItems: boolean;
  PekerjaanOptions: Option[];
  DropdownPekerjaan: {
    kode: string;
    label: string;
    value: string;
    detail: {
      deskripsi: string;
      satuan: string;
      harga: number;
      categoryId?: string;
      categoryName?: string;
    };
  }[];
  addItemToGroup: (sectionId: string, groupId: string, source?: any) => void;
  deleteGroup: (sectionId: string, groupId: string) => void;
  onToggleEditGroupTitle: (
    sectionId: string,
    groupId: string,
    editing: boolean
  ) => void;
  onChangeGroupTitle: (
    sectionId: string,
    groupId: string,
    title: string
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `grp-${group.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const navigate = useNavigate();
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg px-3 py-2 bg-slate-50 border ${
        isDragging ? "opacity-80 border-slate-300" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost btn-xs cursor-grab active:cursor-grabbing text-black text-xl"
            title="Urutkan Title"
            aria-label="Drag Title"
            {...attributes}
            {...listeners}
          >
            ≡
          </button>
          <div className="text-sm text-slate-600">
            {groupIndexArabic}
          </div>
          <div className="font-semibold text-slate-800">
            {group.isEditingTitle ? (
              <input
                autoFocus
                className="input input-bordered input-sm text-black bg-white border-black"
                value={group.title}
                onChange={(e) =>
                  onChangeGroupTitle(sectionId, group.id, e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") {
                    onToggleEditGroupTitle(sectionId, group.id, false);
                  }
                }}
                onBlur={() =>
                  onToggleEditGroupTitle(sectionId, group.id, false)
                }
                placeholder="Judul (mis. Cor Beton Sloof 20x25 cm)"
              />
            ) : (
              group.title || "Title"
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-72">
            <SearchableSelect
              options={PekerjaanOptions}
              value={""}
              onChange={(v) => {
                if (!v) return;
                const sel = DropdownPekerjaan.find((it) => it.value === v);
                if (sel) addItemToGroup(sectionId, group.id, sel);
              }}
              placeholder={isLoadingItems ? "Memuat..." : "Tambah item HSP"}
              loading={isLoadingItems}
              size="sm"
              clearable={false}
              isButton={
                <>
                  <button
                    onClick={() => navigate("/hsp")}
                    className="btn bg-green-500 btn-sm w-full"
                    title="Tambah item manual"
                  >
                    <BiPlus className="mr-1 text-white" /> Item HSP
                  </button>
                </>
              }
            />
          </div>
          <button
            onClick={() => addItemToGroup(sectionId, group.id)}
            className="btn btn-solid btn-sm"
            title="Tambah item manual"
          >
            <BiPlus className="mr-1" /> Item
          </button>

          {!group.isEditingTitle ? (
            <button
              onClick={() => onToggleEditGroupTitle(sectionId, group.id, true)}
              className="btn btn-ghost btn-xs text-blue-600"
              title="Edit Title"
            >
              <BiEdit className="text-lg" />
            </button>
          ) : (
            <button
              onClick={() => onToggleEditGroupTitle(sectionId, group.id, false)}
              className="btn btn-ghost btn-xs text-green-600"
              title="Simpan Title"
            >
              <BiSave className="text-lg" />
            </button>
          )}

          <button
            onClick={() => deleteGroup(sectionId, group.id)}
            className="btn btn-ghost btn-xs text-red-600 hover:bg-red-600 hover:text-white"
            title="Hapus Title"
          >
            <BiTrash className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Section Header (Kategori) - Card ----------------------- */
function SortableSectionHeaderCard({
  section,
  index,
  addGroup,
  deleteSection,
  onToggleEditTitle,
  onChangeTitle,
  isLoadingItems,
  PekerjaanOptions,
  DropdownPekerjaan,
  addItemToSection,
}: {
  section: Section;
  index: number;
  addGroup: (sectionId: string) => void;
  deleteSection: (sectionId: string) => void;
  onToggleEditTitle: (id: string, editing: boolean) => void;
  onChangeTitle: (id: string, title: string) => void;
  isLoadingItems: boolean;
  PekerjaanOptions: Option[];
  DropdownPekerjaan: {
    kode: string;
    label: string;
    value: string;
    detail: {
      deskripsi: string;
      satuan: string;
      harga: number;
      categoryId?: string;
      categoryName?: string;
    };
  }[];
  addItemToSection: (sectionId: string, source?: any) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `sec-${section.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const idxRoman = toRoman(index + 1);
  const navigate = useNavigate();
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border p-4 sm:p-5 bg-blue-50/50 ${
        isDragging ? "opacity-80 border-blue-300" : "border-blue-200"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost btn-xs cursor-grab active:cursor-grabbing mr-1 text-2xl text-black"
            title="Drag kategori"
            aria-label="Drag kategori"
            {...attributes}
            {...listeners}
          >
            ≡
          </button>
          <div className="text-blue-700 font-semibold">{idxRoman}</div>

          <div className="text-blue-800 font-bold">
            {section.isEditingTitle ? (
              <input
                autoFocus
                className="input input-bordered input-sm text-black bg-white border-black"
                value={section.title}
                onChange={(e) => onChangeTitle(section.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape")
                    onToggleEditTitle(section.id, false);
                }}
                onBlur={() => onToggleEditTitle(section.id, false)}
                placeholder="Judul kategori (mis. IV PEKERJAAN BETON)"
              />
            ) : (
              section.title
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => addGroup(section.id)}
            className="btn btn-success btn-xs text-white"
            title="Tambah Title"
          >
            <BiPlus className="mr-1" /> Title
          </button>

          {/* Saat tidak ada group -> izinkan tambah item langsung */}
          {!(section.groups && section.groups.length) && (
            <>
              <div className="w-72">
                <SearchableSelect
                  options={PekerjaanOptions}
                  value={""}
                  onChange={(v) => {
                    if (!v) return;
                    const sel = DropdownPekerjaan.find((it) => it.value === v);
                    if (sel) addItemToSection(section.id, sel);
                  }}
                  placeholder={isLoadingItems ? "Memuat..." : "Tambah item HSP"}
                  loading={isLoadingItems}
                  size="sm"
                  clearable={false}
                  isButton={
                    <>
                      <button
                        onClick={() => navigate("/hsp")}
                        className="btn bg-green-500 btn-sm w-full"
                        title="Tambah item manual"
                      >
                        <BiPlus className="mr-1 text-white" /> Item HSP
                      </button>
                    </>
                  }
                />
              </div>
              <button
                onClick={() => addItemToSection(section.id)}
                className="btn btn-solid btn-xs"
                title="Tambah item manual"
              >
                <BiPlus className="mr-1" /> Item
              </button>
            </>
          )}

          {!section.isEditingTitle ? (
            <button
              onClick={() => onToggleEditTitle(section.id, true)}
              className="btn btn-ghost btn-xs text-blue-600"
              title="Edit judul kategori"
            >
              <BiEdit className="text-lg" />
            </button>
          ) : (
            <button
              onClick={() => onToggleEditTitle(section.id, false)}
              className="btn btn-ghost btn-xs text-green-600"
              title="Simpan judul"
            >
              <BiSave className="text-lg" />
            </button>
          )}

          <button
            onClick={() => deleteSection(section.id)}
            className="btn btn-ghost btn-xs text-red-600 hover:bg-red-600 hover:text-white"
            title="Hapus Kategori"
          >
            <BiTrash className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Step 2 (Items + DnD) --------------------------- */
type CreateStepTwoProps = {
  projectProfile: ProjectProfile;
  onSave: (data: any) => void;
};

const CreateStepTwo: React.FC<CreateStepTwoProps> = ({
  projectProfile,
  onSave,
}) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isManualSection, setIsManualSection] = useState(false);
  const [selectedSectionFromList, setSelectedSectionFromList] = useState("");
  const [manualSectionTitle, setManualSectionTitle] = useState("");

  // Volume modal state
  const [volModalOpen, setVolModalOpen] = useState(false);
  const [volTargetItemId, setVolTargetItemId] = useState<string | null>(null);
  const [volTargetItemLabel, setVolTargetItemLabel] = useState<
    string | undefined
  >(undefined);
  const [volInitialRows, setVolInitialRows] = useState<
    VolumeDetailRow[] | undefined
  >(undefined);

  const { data: hspAll, isLoading: isLoadingHsp } =
    useGetAdminAllWithItemsFlat();
  const itemJobList = hspAll?.items ?? [];
  const categories = hspAll?.categories ?? [];

  const KodeOptions: Option[] = useMemo(() => {
    const uniq = new Set<string>();
    const out: Option[] = [];
    for (const it of itemJobList) {
      const k = it?.kode ?? "";
      if (!k || uniq.has(k)) continue;
      uniq.add(k);
      out.push({ label: k, value: k });
    }
    return out;
  }, [itemJobList]);

  const changeItemKode = (id: string, kodeBaru: string) => {
    const job = itemJobList.find((it: any) => it?.kode === kodeBaru);
    const hargaBaru = Number(job?.harga ?? 0);
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        groups: (s.groups || []).map((g) => ({
          ...g,
          items: g.items.map((i) => {
            if (i.id !== id) return i;
            const next: ItemRow = { ...i, kode: kodeBaru };
            next.hargaSatuan = hargaBaru;
            next.hargaSatuanInput = undefined;
            const volEff = getEffectiveVolume(next);
            next.hargaTotal = volEff * hargaBaru;
            return next;
          }),
        })),
        items: (s.items || []).map((i) => {
          if (i.id !== id) return i;
          const next: ItemRow = { ...i, kode: kodeBaru };
          next.hargaSatuan = hargaBaru;
          next.hargaSatuanInput = undefined;
          const volEff = getEffectiveVolume(next);
          next.hargaTotal = volEff * hargaBaru;
          return next;
        }),
      }))
    );
  };

  const CategoryOptions: Option[] = useMemo(
    () =>
      (categories ?? [])
        .slice()
        .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)))
        .map((c: any) => ({
          label: c.name,
          value: c.name,
        })),
    [categories]
  );

  type PekerjaanDropdown = {
    kode: string;
    label: string;
    value: string;
    detail: {
      deskripsi: string;
      satuan: string;
      harga: number;
      categoryId?: string;
      categoryName?: string;
      scope?: string;
      ownerUserId?: string;
    };
  };

  const DropdownPekerjaan: PekerjaanDropdown[] = useMemo(
    () =>
      (itemJobList ?? []).map((it: any) => {
        const unique = `${it.kode}::${it.ownerUserId ?? "GLOBAL"}`;
        return {
          kode: it.kode,
          label: `${it.deskripsi} - ${formatIDR(it.harga ?? 0)}/${
            it.satuan ?? "-"
          }`,
          value: unique,
          detail: {
            deskripsi: it.deskripsi,
            satuan: it.satuan ?? "",
            harga: it.harga ?? 0,
            categoryId: it.hspCategoryId,
            categoryName: it.categoryName,
            scope: it.scope,
            ownerUserId: it.ownerUserId,
          },
        };
      }),
    [itemJobList]
  );

  const PekerjaanOptions: Option[] = useMemo(
    () => DropdownPekerjaan.map((p) => ({ label: p.label, value: p.value })),
    [DropdownPekerjaan]
  );

  /* ----------------------------- Add / Remove ----------------------------- */
  const addSection = () => {
    const title = isManualSection
      ? manualSectionTitle.trim()
      : selectedSectionFromList;
    if (!title) return;
    setSections((prev) => [
      ...prev,
      {
        id: uid(),
        title,
        isEditingTitle: false,
        groups: [],
        items: undefined,
      },
    ]);
    setIsAddingSection(false);
    setIsManualSection(false);
    setSelectedSectionFromList("");
    setManualSectionTitle("");
  };

  const deleteSection = (sectionId: string) =>
    setSections((prev) => prev.filter((s) => s.id !== sectionId));

  /* Groups */
  const addGroup = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const groups = s.groups ?? [];
        return {
          ...s,
          groups: [
            ...groups,
            { id: uid(), title: "Title Baru", items: [], isEditingTitle: true },
          ],
          items: undefined,
        };
      })
    );
  };

  const deleteGroup = (sectionId: string, groupId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, groups: (s.groups || []).filter((g) => g.id !== groupId) }
          : s
      )
    );
  };

  const onToggleEditGroupTitle = (
    sectionId: string,
    groupId: string,
    editing: boolean
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              groups: (s.groups || []).map((g) =>
                g.id === groupId ? { ...g, isEditingTitle: editing } : g
              ),
            }
          : s
      )
    );
  };

  const onChangeGroupTitle = (
    sectionId: string,
    groupId: string,
    title: string
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              groups: (s.groups || []).map((g) =>
                g.id === groupId ? { ...g, title } : g
              ),
            }
          : s
      )
    );
  };

  /* Items pada Group */
  const addItemToGroup = (
    sectionId: string,
    groupId: string,
    source?: PekerjaanDropdown
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const groups = (s.groups || []).map((g) => {
          if (g.id !== groupId) return g;
          const base: ItemRow = {
            id: uid(),
            kode: source?.kode || "",
            deskripsi: source?.detail.deskripsi || "",
            volume: 0,
            volumeDetails: [],
            volumeSource: "DETAIL",
            manualVolumeInput: "",
            satuan: source?.detail.satuan || "",
            hargaSatuan: source?.detail.harga ?? 0,
            hargaSatuanInput:
              source?.detail.harga && source.detail.harga > 0
                ? String(source.detail.harga)
                : "",
            hargaTotal: 0,
            isEditing: true,
          };
          return { ...g, items: [...g.items, base] };
        });
        return { ...s, groups, items: undefined };
      })
    );
  };

  // Items langsung pada Section (tanpa Title)
  const addItemToSection = (sectionId: string, source?: PekerjaanDropdown) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const items = s.items ? [...s.items] : [];
        const base: ItemRow = {
          id: uid(),
          kode: source?.kode || "",
          deskripsi: source?.detail.deskripsi || "",
          volume: 0,
          volumeDetails: [],
          volumeSource: "DETAIL",
          manualVolumeInput: "",
          satuan: source?.detail.satuan || "",
          hargaSatuan: source?.detail.harga ?? 0,
          hargaSatuanInput:
            source?.detail.harga && source.detail.harga > 0
              ? String(source.detail.harga)
              : "",
          hargaTotal: 0,
          isEditing: true,
        };
        items.push(base);
        return {
          ...s,
          groups: s.groups && s.groups.length > 0 ? s.groups : [],
          items,
        };
      })
    );
  };

  const deleteItem = (itemId: string) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        groups: (s.groups || []).map((g) => ({
          ...g,
          items: g.items.filter((i) => i.id !== itemId),
        })),
        items: (s.items || []).filter((i) => i.id !== itemId),
      }))
    );
  };

  const toggleEditItem = (id: string, editing: boolean) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        groups: (s.groups || []).map((g) => ({
          ...g,
          items: g.items.map((i) => {
            if (i.id !== id) return i;
            if (editing) {
              const hsInput =
                i.hargaSatuan > 0
                  ? String(i.hargaSatuan)
                  : i.hargaSatuanInput ?? "";
              return { ...i, isEditing: true, hargaSatuanInput: hsInput };
            } else {
              const hs = toNumber(i.hargaSatuanInput);
              const volEff = getEffectiveVolume(i);
              return {
                ...i,
                isEditing: false,
                hargaSatuan: hs,
                hargaSatuanInput: undefined,
                hargaTotal: volEff * hs,
              };
            }
          }),
        })),
        items: (s.items || []).map((i) => {
          if (i.id !== id) return i;
          if (editing) {
            const hsInput =
              i.hargaSatuan > 0
                ? String(i.hargaSatuan)
                : i.hargaSatuanInput ?? "";
            return { ...i, isEditing: true, hargaSatuanInput: hsInput };
          } else {
            const hs = toNumber(i.hargaSatuanInput);
            const volEff = getEffectiveVolume(i);
            return {
              ...i,
              isEditing: false,
              hargaSatuan: hs,
              hargaSatuanInput: undefined,
              hargaTotal: volEff * hs,
            };
          }
        }),
      }))
    );
  };

  const updateItemField = (id: string, field: keyof ItemRow, value: any) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        groups: (s.groups || []).map((g) => ({
          ...g,
          items: g.items.map((i) => {
            if (i.id !== id) return i;

            if (field === "hargaSatuanInput") {
              const input = sanitizeMoneyInput(String(value));
              const hs = toNumber(input);
              const next = { ...i, hargaSatuanInput: input } as ItemRow;
              next.hargaTotal = getEffectiveVolume(next) * hs;
              return next;
            }

            const next: ItemRow = { ...i, [field]: value } as ItemRow;

            const hs =
              typeof next.hargaSatuanInput === "string"
                ? toNumber(next.hargaSatuanInput)
                : Number(next.hargaSatuan || 0);

            next.hargaTotal = getEffectiveVolume(next) * hs;
            return next;
          }),
        })),
        items: (s.items || []).map((i) => {
          if (i.id !== id) return i;

          if (field === "hargaSatuanInput") {
            const input = sanitizeMoneyInput(String(value));
            const hs = toNumber(input);
            const next = { ...i, hargaSatuanInput: input } as ItemRow;
            next.hargaTotal = getEffectiveVolume(next) * hs;
            return next;
          }

          const next: ItemRow = { ...i, [field]: value } as ItemRow;
          const hs =
            typeof next.hargaSatuanInput === "string"
              ? toNumber(next.hargaSatuanInput)
              : Number(next.hargaSatuan || 0);
          next.hargaTotal = getEffectiveVolume(next) * hs;
          return next;
        }),
      }))
    );
  };

  const copyItem = (itemId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        const next = { ...s };
        if (next.groups?.length) {
          next.groups = next.groups.map((g) => {
            const idx = g.items.findIndex((i) => i.id === itemId);
            if (idx === -1) return g;
            const src = g.items[idx];
            const clone: ItemRow = {
              ...src,
              id: uid(),
              isEditing: true,
              hargaSatuanInput:
                src.hargaSatuan > 0 ? String(src.hargaSatuan) : "",
              volumeDetails: src.volumeDetails ? [...src.volumeDetails] : [],
              volumeSource: src.volumeSource ?? "DETAIL",
              manualVolumeInput: src.manualVolumeInput ?? "",
              hargaTotal:
                getEffectiveVolume(src) * (Number(src.hargaSatuan) || 0),
            };
            const items = [...g.items];
            items.splice(idx + 1, 0, clone);
            return { ...g, items };
          });
        } else if (next.items?.length) {
          const idx = next.items.findIndex((i) => i.id === itemId);
          if (idx !== -1) {
            const src = next.items[idx];
            const clone: ItemRow = {
              ...src,
              id: uid(),
              isEditing: true,
              hargaSatuanInput:
                src.hargaSatuan > 0 ? String(src.hargaSatuan) : "",
              volumeDetails: src.volumeDetails ? [...src.volumeDetails] : [],
              volumeSource: src.volumeSource ?? "DETAIL",
              manualVolumeInput: src.manualVolumeInput ?? "",
              hargaTotal:
                getEffectiveVolume(src) * (Number(src.hargaSatuan) || 0),
            };
            const items = [...next.items];
            items.splice(idx + 1, 0, clone);
            next.items = items;
          }
        }
        return next;
      })
    );
  };

  /* --------------------- Volume Modal handlers --------------------- */
  const openVolumeModal = (item: ItemRow) => {
    setVolTargetItemId(item.id);
    setVolTargetItemLabel(item.deskripsi || item.kode);
    setVolInitialRows(item.volumeDetails || []);
    setVolModalOpen(true);
  };

  const applyVolumeFromModal = (
    itemId: string,
    rows: VolumeDetailRow[],
    totalVol: number
  ) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        groups: (s.groups || []).map((g) => ({
          ...g,
          items: g.items.map((i) => {
            if (i.id !== itemId) return i;
            const volume = Number(totalVol || 0);
            const next: ItemRow = {
              ...i,
              volume,
              volumeDetails: rows,
              volumeSource: "DETAIL",
            };
            const hs =
              typeof next.hargaSatuanInput === "string"
                ? toNumber(next.hargaSatuanInput)
                : Number(next.hargaSatuan || 0);
            next.hargaTotal = getEffectiveVolume(next) * hs;
            return next;
          }),
        })),
        items: (s.items || []).map((i) => {
          if (i.id !== itemId) return i;
          const volume = Number(totalVol || 0);
          const next: ItemRow = {
            ...i,
            volume,
            volumeDetails: rows,
            volumeSource: "DETAIL",
          };
          const hs =
            typeof next.hargaSatuanInput === "string"
              ? toNumber(next.hargaSatuanInput)
              : Number(next.hargaSatuan || 0);
          next.hargaTotal = getEffectiveVolume(next) * hs;
          return next;
        }),
      }))
    );
  };

  /* --------------------------- Drag & Drop Logic -------------------------- */
  const isSectionId = (dndId: string) => dndId.startsWith("sec-");
  const isGroupId = (dndId: string) => dndId.startsWith("grp-");
  const isItemId = (dndId: string) => dndId.startsWith("item-");
  const rawSectionId = (dndId: string) => dndId.replace(/^sec-/, "");
  const rawGroupId = (dndId: string) => dndId.replace(/^grp-/, "");
  const rawItemId = (dndId: string) => dndId.replace(/^item-/, "");

  const findPathByItemDndId = (itemDndId: string) => {
    const itemId = rawItemId(itemDndId);
    for (const s of sections) {
      if (s.groups?.length) {
        for (const g of s.groups) {
          if (g.items.some((i) => i.id === itemId))
            return { sectionId: s.id, groupId: g.id };
        }
      }
      if (s.items?.some((i) => i.id === itemId)) return { sectionId: s.id };
    }
    return null;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );
  const splitTail = (s: string) => {
    const p = s.lastIndexOf("-");
    return p === -1 ? [s, ""] : [s.slice(0, p), s.slice(p + 1)];
  };

  const parseGroupOverId = (overId: string) => {
    if (!overId.startsWith("ghead-") && !overId.startsWith("gdrop-"))
      return null;
    const kind = overId.startsWith("ghead-") ? "head" : "drop";
    const rest = overId.replace(/^ghead-/, "").replace(/^gdrop-/, "");
    const [sectionId, groupId] = splitTail(rest);
    return { kind, sectionId, groupId };
  };

  const parseSectionOverId = (overId: string) => {
    if (overId.startsWith("section-")) {
      return {
        kind: "section" as const,
        sectionId: overId.slice("section-".length),
      };
    }
    if (overId.startsWith("dropzone-")) {
      return {
        kind: "dropzone" as const,
        sectionId: overId.slice("dropzone-".length),
      };
    }
    return null;
  };

  const findSectionIdByGroupId = (groupId: string, data: Section[]) => {
    for (const s of data) {
      if (s.groups?.some((g) => g.id === groupId)) return s.id;
    }
    return null;
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    // --- Reorder Section
    if (isSectionId(activeId) && isSectionId(overId)) {
      const fromId = rawSectionId(activeId);
      const toId = rawSectionId(overId);
      setSections((prev) => {
        const next = [...prev];
        const fromIdx = next.findIndex((s) => s.id === fromId);
        const toIdx = next.findIndex((s) => s.id === toId);
        if (fromIdx < 0 || toIdx < 0) return prev;
        const [m] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, m);
        return next;
      });
      return;
    }

    // --- Reorder Group dalam Section
    if (isGroupId(activeId) && isGroupId(overId)) {
      const fromG = rawGroupId(activeId);
      const toG = rawGroupId(overId);
      setSections((prev) =>
        prev.map((s) => {
          if (!s.groups?.length) return s;
          const idxFrom = s.groups.findIndex((g) => g.id === fromG);
          const idxTo = s.groups.findIndex((g) => g.id === toG);
          if (idxFrom < 0 || idxTo < 0) return s;
          const arr = [...s.groups];
          const [m] = arr.splice(idxFrom, 1);
          arr.splice(idxTo, 0, m);
          return { ...s, groups: arr };
        })
      );
      return;
    }

    // --- Item drag
    if (!isItemId(activeId)) return;

    const activePath = findPathByItemDndId(activeId);
    if (!activePath) return;

    const overIsItem = isItemId(overId);
    const overGroupRow = parseGroupOverId(overId);
    const overSectionRow = parseSectionOverId(overId);
    const overIsGroupHeader = isGroupId(overId);
    const overIsSectionHeader = isSectionId(overId);

    let toSectionId: string | undefined;
    let toGroupId: string | undefined;

    if (overIsItem) {
      const p = findPathByItemDndId(overId);
      toSectionId = p?.sectionId;
      toGroupId = p?.groupId;
    } else if (overGroupRow) {
      toSectionId = overGroupRow.sectionId;
      toGroupId = overGroupRow.groupId;
    } else if (overIsGroupHeader) {
      const gId = rawGroupId(overId);
      toSectionId = findSectionIdByGroupId(gId, sections) || undefined;
      toGroupId = gId;
    } else if (overSectionRow) {
      toSectionId = overSectionRow.sectionId;
      toGroupId = undefined;
    } else if (overIsSectionHeader) {
      toSectionId = rawSectionId(overId);
      toGroupId = undefined;
    }

    if (!toSectionId) return;

    const activeItemId = rawItemId(activeId);
    const overItemId = overIsItem ? rawItemId(overId) : null;

    setSections((prev) => {
      const next = prev.map((s) => ({
        ...s,
        groups: s.groups?.map((g) => ({ ...g, items: [...g.items] })),
        items: s.items ? [...s.items] : undefined,
      }));

      // 1) Ambil item dari sumber
      let moving: ItemRow | null = null;
      for (const s of next) {
        if (s.id !== activePath.sectionId) continue;
        if (activePath.groupId && s.groups?.length) {
          const g = s.groups.find((x) => x.id === activePath.groupId);
          if (g) {
            const idx = g.items.findIndex((i) => i.id === activeItemId);
            if (idx >= 0) [moving] = g.items.splice(idx, 1);
          }
        } else if (s.items) {
          const idx = s.items.findIndex((i) => i.id === activeItemId);
          if (idx >= 0) [moving] = s.items.splice(idx, 1);
        }
      }
      if (!moving) return prev;

      // 2) Taruh ke tujuan
      const targetSection = next.find((s) => s.id === toSectionId);
      if (!targetSection) return prev;

      if (toGroupId && targetSection.groups?.length) {
        const g = targetSection.groups.find((x) => x.id === toGroupId);
        if (!g) return prev;

        if (overIsItem && overItemId) {
          const idx = g.items.findIndex((i) => i.id === overItemId);
          g.items.splice(idx < 0 ? g.items.length : idx, 0, moving);
        } else if (overGroupRow?.kind === "head") {
          g.items.unshift(moving);
        } else if (overIsGroupHeader) {
          g.items.push(moving);
        } else {
          g.items.push(moving);
        }
      } else {
        targetSection.items = targetSection.items || [];

        if (overIsItem && overItemId) {
          const idx = targetSection.items.findIndex((i) => i.id === overItemId);
          targetSection.items.splice(
            idx < 0 ? targetSection.items.length : idx,
            0,
            moving
          );
        } else if (overSectionRow?.kind === "section" || overIsSectionHeader) {
          targetSection.items.unshift(moving);
        } else {
          targetSection.items.push(moving);
        }
      }

      return next;
    });
  };

  const handleDragOver = (_e: DragOverEvent) => {};

  /* ------------------------------ Aggregations ----------------------------- */
  const subtotal = sections.reduce((sectAcc, s) => {
    const fromGroups =
      s.groups?.reduce(
        (acc, g) =>
          acc + g.items.reduce((t, i) => t + Number(i.hargaTotal || 0), 0),
        0
      ) || 0;
    const fromItems =
      s.items?.reduce((t, i) => t + Number(i.hargaTotal || 0), 0) || 0;
    return sectAcc + fromGroups + fromItems;
  }, 0);

  const ppnPct = Math.max(0, Number(projectProfile.ppn || "0"));
  const ppnAmount = (subtotal * ppnPct) / 100;
  const grandTotal = subtotal + ppnAmount;

  /* ------------------------------ Save payload ----------------------------- */
  const handleSaveAllData = () => {
    const estimationItem = sections.map((s) => {
      if (s.groups && s.groups.length > 0) {
        return {
          title: s.title,
          groups: s.groups.map((g) => ({
            title: g.title,
            items: g.items.map((i) => {
              const effectiveVol = getEffectiveVolume(i);
              const isManual = i.volumeSource === "MANUAL";
              return {
                kode: i.kode,
                nama: i.deskripsi,
                satuan: i.satuan,
                harga: i.hargaSatuan,
                volume: effectiveVol,
                hargaTotal: effectiveVol * Number(i.hargaSatuan || 0),
                details: isManual
                  ? []
                  : (i.volumeDetails || []).map((d) => ({
                      nama: d.uraian,
                      jenis: d.jenis,
                      panjang: d.panjang,
                      lebar: d.lebar,
                      tinggi: d.tinggi,
                      jumlah: d.jumlah,
                      volume: Number(Number(d.volume).toFixed(2)),
                      extras: (d.extras || []).map((ex: ExtraCol) => ({
                        name: ex.name,
                        value: ex.value,
                      })),
                    })),
              };
            }),
          })),
        };
      }

      return {
        title: s.title,
        item: (s.items || []).map((i) => {
          const effectiveVol = getEffectiveVolume(i);
          const isManual = i.volumeSource === "MANUAL";
          return {
            kode: i.kode,
            nama: i.deskripsi,
            satuan: i.satuan,
            harga: i.hargaSatuan,
            volume: effectiveVol,
            hargaTotal: effectiveVol * Number(i.hargaSatuan || 0),
            details: isManual
              ? []
              : (i.volumeDetails || []).map((d) => ({
                  nama: d.uraian,
                  jenis: d.jenis,
                  panjang: d.panjang,
                  lebar: d.lebar,
                  tinggi: d.tinggi,
                  jumlah: d.jumlah,
                  volume: Number(Number(d.volume).toFixed(2)),
                  extras: (d.extras || []).map((ex: ExtraCol) => ({
                    name: ex.name,
                    value: ex.value,
                  })),
                })),
          };
        }),
      };
    });

    const dataToSave = {
      projectName: projectProfile.projectName,
      owner: projectProfile.owner,
      ppn: projectProfile.ppn,
      notes: projectProfile.notes,
      customFields: projectProfile.customFields,
      estimationItem,
    };
    onSave(dataToSave);
  };

  /* --------------------------- Section handlers --------------------------- */
  const toggleEditSectionTitle = (sectionId: string, editing: boolean) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, isEditingTitle: editing } : s
      )
    );
  };

  const changeSectionTitle = (sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  };

  /* --------------------------------- Render -------------------------------- */
  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      {/* Title Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          {projectProfile.projectName || "Nama Proyek"}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="badge">
            {projectProfile.owner ? `Owner: ${projectProfile.owner}` : "Owner"}
          </span>
          <span className="badge">PPN {ppnPct || 0}%</span>
        </div>
      </div>

      {/* Tambah Kategori */}
      <div className="mb-4">
        {isAddingSection ? (
          <div className="space-y-3">
            {isManualSection ? (
              <input
                className="input input-bordered w-full text-black bg-white border-black"
                placeholder="Masukkan nama kategori"
                value={manualSectionTitle}
                onChange={(e) => setManualSectionTitle(e.target.value)}
              />
            ) : (
              <SearchableSelect
                options={CategoryOptions}
                value={selectedSectionFromList}
                onChange={(v) => setSelectedSectionFromList(v || "")}
                placeholder={isLoadingHsp ? "Memuat..." : "Pilih Kategori"}
                loading={isLoadingHsp}
                size="sm"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-soft"
                onClick={() => setIsManualSection((v) => !v)}
              >
                {isManualSection ? "Pilih dari Daftar" : "Input Manual"}
              </button>
              <button
                className="btn btn-primary text-white"
                onClick={addSection}
                disabled={
                  isManualSection
                    ? !manualSectionTitle.trim()
                    : !selectedSectionFromList
                }
              >
                Tambah
              </button>
              <button
                className="btn btn-warning"
                onClick={() => {
                  setIsAddingSection(false);
                  setIsManualSection(false);
                  setSelectedSectionFromList("");
                  setManualSectionTitle("");
                }}
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-success text-white"
            onClick={() => setIsAddingSection(true)}
          >
            <BiPlus className="mr-1" /> Tambah Kategori Pekerjaan
          </button>
        )}
      </div>

      {/* CARD LIST + DnD */}
      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          collisionDetection={pointerWithin}
          autoScroll={{
            enabled: true,
            acceleration: 12,
            interval: 10,
            threshold: { x: 0.2, y: 0.2 },
          }}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          {sections.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Belum ada kategori.
            </div>
          )}

          {sections.map((section, sIdx) => {
            const groups = section.groups || [];
            const fallbackItems = section.items || [];
            const sRoman = toRoman(sIdx + 1);

            return (
              <SortableContext
                key={section.id}
                items={[
                  ...groups.map((g) => `grp-${g.id}`),
                  ...groups.flatMap((g) => g.items.map((i) => `item-${i.id}`)),
                  ...fallbackItems.map((i) => `item-${i.id}`),
                ]}
                strategy={rectSortingStrategy}
              >
                {/* Kategori Card */}
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  {/* Header kategori */}
                  <div className="p-4 border-b border-gray-200">
                    <SortableSectionHeaderCard
                      section={section}
                      index={sIdx}
                      addGroup={addGroup}
                      deleteSection={deleteSection}
                      onToggleEditTitle={toggleEditSectionTitle}
                      onChangeTitle={changeSectionTitle}
                      isLoadingItems={isLoadingHsp}
                      PekerjaanOptions={PekerjaanOptions}
                      DropdownPekerjaan={DropdownPekerjaan}
                      addItemToSection={addItemToSection}
                    />
                  </div>

                  {/* Body kategori */}
                  <div className="p-4 space-y-4">
                    {/* Jika punya groups (Title) */}
                    {groups.length > 0 ? (
                      <>
                        {groups.map((group, gIdx) => (
                          <React.Fragment key={group.id}>
                            {/* Header Title */}
                            <SortableGroupHeaderCard
                              sectionIndexRoman={sRoman}
                              groupIndexArabic={toArabic(gIdx)}
                              sectionId={section.id}
                              group={group}
                              isLoadingItems={isLoadingHsp}
                              PekerjaanOptions={PekerjaanOptions}
                              DropdownPekerjaan={DropdownPekerjaan}
                              addItemToGroup={addItemToGroup}
                              deleteGroup={deleteGroup}
                              onToggleEditGroupTitle={onToggleEditGroupTitle}
                              onChangeGroupTitle={onChangeGroupTitle}
                            />

                            {/* Dropzone atas group */}
                            <DroppableZone
                              droppableId={`ghead-${section.id}-${group.id}`}
                              className="my-2"
                            />

                            {/* Items (huruf kecil a,b,...) */}
                            <div className="space-y-3">
                              {group.items.map((item, idxInGroup) => (
                                <SortableItemCard
                                  key={item.id}
                                  itemIndexDisplay={toAlpha(idxInGroup)}
                                  item={item}
                                  onEditToggle={toggleEditItem}
                                  onDelete={deleteItem}
                                  onCopy={copyItem}
                                  onUpdateField={updateItemField}
                                  onOpenVolumeModal={openVolumeModal}
                                  kodeOptions={KodeOptions}
                                  onChangeKode={changeItemKode}
                                />
                              ))}
                            </div>

                            {/* Dropzone bawah group */}
                            <DroppableZone
                              droppableId={`gdrop-${section.id}-${group.id}`}
                              className="mt-2"
                              showHint={group.items.length === 0}
                            />

                            {/* Subtotal per Title */}
                            {!!group.items.length && (
                              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <div className="text-sm text-gray-800 font-semibold">
                                  Subtotal {section.title} — {group.title}
                                </div>
                                <div className="text-sm font-semibold  text-gray-800">
                                  {formatIDR(
                                    group.items.reduce(
                                      (a, b) => a + (b.hargaTotal ?? 0),
                                      0
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </>
                    ) : (
                      /* Fallback: items langsung di kategori (tanpa Title) */
                      <>
                        <DroppableZone
                          droppableId={`section-${section.id}`}
                          className="mb-2"
                        />
                        <div className="space-y-3">
                          {fallbackItems.map((item, idxInGroup) => (
                            <SortableItemCard
                              key={item.id}
                              // Tanpa title ⇒ item pakai angka 1,2,3...
                              itemIndexDisplay={toArabic(idxInGroup)}
                              item={item}
                              onEditToggle={toggleEditItem}
                              onDelete={deleteItem}
                              onCopy={copyItem}
                              onUpdateField={updateItemField}
                              onOpenVolumeModal={openVolumeModal}
                              kodeOptions={KodeOptions}
                              onChangeKode={changeItemKode}
                            />
                          ))}
                        </div>
                        <DroppableZone
                          droppableId={`dropzone-${section.id}`}
                          className="mt-2"
                          showHint={fallbackItems.length === 0}
                        />

                        {!!fallbackItems.length && (
                          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="text-sm text-gray-700">
                              Subtotal {section.title}
                            </div>
                            <div className="text-sm font-semibold">
                              {formatIDR(
                                fallbackItems.reduce(
                                  (a, b) => a + (b.hargaTotal ?? 0),
                                  0
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </SortableContext>
            );
          })}

          {/* Overlay */}
          <DragOverlay dropAnimation={defaultDropAnimation} />
        </DndContext>
      </div>

      {/* Footer total & actions */}
      <div className="rounded-lg border border-gray-200 p-4 mt-5 bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <div className="flex items-center justify-between gap-8">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                {formatIDR(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-gray-600">PPN ({ppnPct}%)</span>
              <span className="font-semibold text-gray-900">
                {formatIDR(ppnAmount)}
              </span>
            </div>
            <div className="divider my-2" />
            <div className="flex items-center justify-between gap-8">
              <span className="text-gray-800 font-semibold">Grand Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatIDR(grandTotal)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="success" onClick={handleSaveAllData}>
              Simpan Estimation
            </Button>
          </div>
        </div>
      </div>

      {/* Volume Modal */}
      <VolModal
        open={volModalOpen}
        onClose={() => setVolModalOpen(false)}
        itemLabel={volTargetItemLabel}
        initialRows={volInitialRows}
        onSave={(rows, total) => {
          if (volTargetItemId) {
            applyVolumeFromModal(volTargetItemId, rows, total);
          }
        }}
      />
    </div>
  );
};

/* ------------------------------- Root Create ------------------------------- */
const CreateEstimation = () => {
  const [activeAccordion, setActiveAccordion] = useState<string>("step1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    projectName: "",
    owner: "",
    ppn: "11",
    notes: "",
  });
  const [customFields, setCustomFields] = useState<CustomFieldUI[]>([]);
  const createMutation = useCreateEstimation();
  const notify = useNotify();
  const toggleAccordion = (step: string) =>
    setActiveAccordion((prev) => (prev === step ? "" : step));

  const handleStepOneSave = () => setActiveAccordion("step2");

  const projectProfile: ProjectProfile = useMemo(
    () => ({
      ...formData,
      customFields: customFields.reduce((acc, field) => {
        acc[field.label] = field.value;
        return acc;
      }, {} as Record<string, string>),
    }),
    [formData, customFields]
  );

  const handleSaveData = (data: any) => {
    createMutation.mutate(
      { data, imageFile },
      {
        onSuccess: () => {
          setFormData({ projectName: "", owner: "", ppn: "11", notes: "" });
          setCustomFields([]);
          setActiveAccordion("step1");
          setImageFile(null);
          notify("Berhasil menyimpan data", "success");
        },
      }
    );
  };
  const navigate = useNavigate();
  return (
    <div className="mx-auto p-3 sm:p-4">
      <BackButton onClick={() => navigate("/estimation")} title="Kembali" />

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Create Estimation</h1>
        <p className="text-sm text-gray-600">
          Lengkapi profil proyek, lalu tambahkan item pekerjaan.
        </p>
      </div>

      <div className="join join-vertical w-full gap-4">
        {/* Step 1 */}
        <div className="collapse collapse-arrow join-item rounded-xl border border-gray-200 bg-white">
          <input
            type="radio"
            name="wizard-create-estimation"
            checked={activeAccordion === "step1"}
            onChange={() => toggleAccordion("step1")}
          />
          <div className="collapse-title text-lg font-semibold text-gray-900">
            {`1) Project Profile`}
          </div>
          <div className="collapse-content p-4 sm:p-5">
            <CreateStepOne
              onSave={handleStepOneSave}
              formData={formData}
              setFormData={setFormData}
              customFields={customFields}
              setCustomFields={setCustomFields}
              imageFile={imageFile}
              setImageFile={setImageFile}
            />
          </div>
        </div>

        {/* Step 2 */}
        <div className="collapse collapse-arrow join-item rounded-xl border border-gray-200 bg-white">
          <input
            type="radio"
            name="wizard-create-estimation"
            checked={activeAccordion === "step2"}
            onChange={() => toggleAccordion("step2")}
          />
          <div className="collapse-title text-lg font-semibold text-gray-900">
            {`2) Estimation Items`}
          </div>
          <div className="collapse-content p-0">
            <div className="p-4 sm:p-5">
              <CreateStepTwo
                projectProfile={projectProfile}
                onSave={handleSaveData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEstimation;
