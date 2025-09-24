import { useMemo, useState } from "react";
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

// dnd-kit
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  defaultDropAnimation,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { VolumeDetailRow } from "./VolumeModal";
import VolModal from "./VolumeModal";
import { BackButton } from "../../components/BackButton";
import { useNavigate } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";

import { useNotify } from "../../components/Notify/notify";

/* ------------------------------ Helpers ------------------------------ */
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatIDR = (n: number = 0) =>
  `Rp ${Math.max(0, Number(n || 0)).toLocaleString("id-ID")}`;

// Hapus semua yang bukan digit/koma/titik, normalize koma->titik
const sanitizeMoneyInput = (v: string) => {
  const cleaned = v.replace(/[^\d.,]/g, "").replace(/,/g, ".");
  return cleaned.replace(/^0+(?=\d)/, "");
};

const toNumber = (v?: string) => {
  if (v == null || v.trim() === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* ------------------------------ Types ------------------------------ */
interface CustomField {
  id: string;
  label: string;
  value: string;
  type: string;
}
interface ProjectProfile {
  projectName: string;
  owner: string;
  ppn: string; // keep string for easy input bind
  notes: string;
  customFields: Record<string, string>;
}
type VolumeSource = "MANUAL" | "DETAIL";

type ItemRow = {
  id: string;
  kode: string;
  deskripsi: string;

  // AUTO hasil dari modal
  volume: number;
  volumeDetails?: VolumeDetailRow[];

  // NEW: input manual tanpa toggle
  volumeSource?: VolumeSource; // "MANUAL" | "DETAIL"
  manualVolumeInput?: string; // string input untuk angka manual

  satuan: string;
  hargaSatuan: number; // nilai final untuk hitung & tampil non-edit
  hargaSatuanInput?: string; // nilai string saat editing (boleh kosong)
  hargaTotal: number;
  isEditing?: boolean;
};
type Section = {
  id: string;
  title: string;
  items: ItemRow[];
  isEditingTitle?: boolean; // edit judul kategori
};

/* --------------------------- Step 1: Profile --------------------------- */
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
  formData: {
    projectName: string;
    owner: string;
    ppn: string;
    notes: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      projectName: string;
      owner: string;
      ppn: string;
      notes: string;
    }>
  >;
  customFields: CustomField[];
  setCustomFields: React.Dispatch<React.SetStateAction<CustomField[]>>;
  imageFile: File | null;
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>;
}) => {
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const onPickImage = (f?: File | null) => {
    setImageFile(f ?? null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
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
                  <div key={field.id} className="flex items-end gap-2">
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
                id="project-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="project-image-input"
                className="btn btn-outline btn-sm cursor-pointer"
              >
                <BiEdit className="mr-1" /> Ganti Gambar
              </label>
              {!!imageFile && (
                <button
                  className="btn btn-ghost btn-xs text-red-600 mt-2"
                  onClick={() => onPickImage(null)}
                >
                  <BiTrash className="mr-1" /> Hapus pilihan
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

/* -------------------------- Table Utilities/Rows -------------------------- */
function DroppableRow({
  droppableId,
  colSpan,
  showHint = false,
}: {
  droppableId: string;
  colSpan: number;
  showHint?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  return (
    <tr ref={setNodeRef}>
      <td colSpan={colSpan}>
        <div
          className={`h-8 transition-all rounded ${
            isOver ? "border-2 border-dashed border-primary/70" : "border-0"
          } ${showHint ? "text-xs text-gray-400 italic py-1" : ""}`}
        >
          {isOver ? "Lepas di sini" : showHint ? "Drop di sini" : null}
        </div>
      </td>
    </tr>
  );
}

/** Effective Volume (tanpa toggle): MANUAL > DETAIL */
const getEffectiveVolume = (i: ItemRow) =>
  (i.volumeSource === "MANUAL"
    ? Math.max(0, toNumber(i.manualVolumeInput || "0"))
    : Math.max(0, Number(i.volume || 0))) || 0;

/** ITEM ROW — pakai id dnd "item-<id>" */
function SortableItemRow({
  idxInSection,
  item,
  onEditToggle,
  onDelete,
  onCopy,
  onUpdateField,
  onOpenVolumeModal,
  kodeOptions,
  onChangeKode,
}: {
  idxInSection: number;
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
    <tr
      ref={setNodeRef}
      style={style}
      className={`align-top ${isDragging ? "bg-blue-50" : ""}`}
    >
      <td className="px-4 py-3 text-sm text-gray-500">{idxInSection + 1}</td>

      {/* Uraian */}
      <td className="px-4 py-3 text-sm text-gray-800 min-w-[280px]">
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
          <span className="break-words">{item.deskripsi || "-"}</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-800 w-40">
        {item.isEditing ? (
          <SearchableSelect
            options={kodeOptions}
            value={item.kode ?? ""}
            onChange={(v) => v && onChangeKode(item.id, v)}
            placeholder="Pilih Kode"
            size="sm"
          />
        ) : (
          <span className="font-mono">{item.kode || "-"}</span>
        )}
      </td>
      {/* Volume: input langsung + tombol Detail */}
      <td className="px-4 py-3 text-sm text-gray-800">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="any"
            className="input input-bordered input-sm w-28 text-right text-black bg-white border-black"
            value={volInputDisplay}
            onChange={(e) => {
              // Switch ke MANUAL & update nilai
              onUpdateField(item.id, "volumeSource", "MANUAL");
              onUpdateField(item.id, "manualVolumeInput", e.target.value);
            }}
            placeholder="0.00"
          />
          <button
            className="btn btn-ghost btn-xs text-blue-600 bg-white"
            title="Detail Volume"
            onClick={() => onOpenVolumeModal(item)}
          >
            <BiCalculator className="mr-1" /> Detail
          </button>
        </div>
        {/* <div className="text-[11px] text-gray-500 mt-1">
          {item.volumeSource === "MANUAL"
            ? "Mode: manual"
            : "Mode: dari detail"}
        </div> */}
      </td>

      {/* Satuan (Searchable) */}
      <td className="px-4 py-3 text-sm text-gray-800 w-36">
        {item.isEditing ? (
          <SearchableSelect
            options={unitOptions}
            value={item.satuan ?? ""}
            onChange={(v) => onUpdateField(item.id, "satuan", v ?? "")}
            placeholder="Pilih Satuan"
            size="sm"
          />
        ) : (
          UnitList.find((u) => u.value === item.satuan)?.label ||
          item.satuan ||
          "-"
        )}
      </td>

      {/* Harga Satuan */}
      <td className="px-4 py-3 text-sm text-gray-800">
        {item.isEditing ? (
          <input
            type="text"
            inputMode="decimal"
            className="input input-bordered input-sm w-36 text-black bg-white border-black"
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
          formatIDR(item.hargaSatuan)
        )}
      </td>

      {/* Harga Total */}
      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
        {formatIDR(item.hargaTotal)}
      </td>

      {/* Aksi + drag handle */}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          {/* Drag handle */}

          {/* Menu kebab */}
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className="btn btn-ghost btn-xs bg-white"
              aria-label="Aksi lainnya"
              title="Aksi lainnya"
            >
              <BsThreeDotsVertical className="text-lg text-black" />
            </button>

            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-white text-black rounded-box w-44"
            >
              {!item.isEditing ? (
                <li>
                  <button
                    onClick={() => onEditToggle(item.id, true)}
                    className="justify-start"
                    title="Edit baris"
                  >
                    <BiEdit className="text-blue-600" />
                    <span>Edit</span>
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    onClick={() => onEditToggle(item.id, false)}
                    className="justify-start"
                    title="Simpan baris"
                  >
                    <BiSave className="text-green-600" />
                    <span>Simpan</span>
                  </button>
                </li>
              )}

              {/* Salin */}
              <li>
                <button
                  onClick={() => onCopy(item.id)}
                  className="justify-start"
                  title="Salin item"
                >
                  <BiCopy className="text-indigo-600" />
                  <span>Salin</span>
                </button>
              </li>

              {/* Hapus */}
              <li>
                <button
                  onClick={() => onDelete(item.id)}
                  className="justify-start"
                  title="Hapus baris"
                >
                  <BiTrash className="text-red-600" />
                  <span>Hapus</span>
                </button>
              </li>
            </ul>
          </div>
          <button
            className="btn btn-ghost btn-xs cursor-grab active:cursor-grabbing text-gray-600 text-xl bg-white"
            title="Drag"
            aria-label="Drag untuk memindahkan"
            {...attributes}
            {...listeners}
          >
            ≡
          </button>
        </div>
      </td>
    </tr>
  );
}

/** SECTION HEADER — draggable & editable */
function SortableSectionHeader({
  section,
  index,
  isLoadingItems,
  PekerjaanOptions,
  DropdownPekerjaan,
  addItemToSection,
  deleteSection,
  onToggleEditTitle,
  onChangeTitle,
}: {
  section: Section;
  index: number;
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
  deleteSection: (sectionId: string) => void;
  onToggleEditTitle: (id: string, editing: boolean) => void;
  onChangeTitle: (id: string, title: string) => void;
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
  const navigate = useNavigate();
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`bg-blue-50/70 ${isDragging ? "opacity-80" : ""}`}
    >
      <td className="px-4 py-3 text-sm font-semibold text-blue-700">
        <div className="flex items-end gap-2">
          <button
            className="btn btn-ghost btn-xs cursor-grab active:cursor-grabbing mr-2 text-3xl text-black bg-white"
            title="Drag kategori"
            aria-label="Drag kategori"
            {...attributes}
            {...listeners}
          >
            ≡
          </button>
          {String.fromCharCode(65 + index)}
        </div>
      </td>

      {/* Judul kategori (editable) */}
      <td className="px-4 py-3 text-sm font-bold text-blue-800">
        {section.isEditingTitle ? (
          <input
            autoFocus
            className="input input-bordered input-sm w-full text-black bg-white border-black"
            value={section.title}
            onChange={(e) => onChangeTitle(section.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                onToggleEditTitle(section.id, false);
              }
            }}
            onBlur={() => onToggleEditTitle(section.id, false)}
            placeholder="Judul kategori"
          />
        ) : (
          <span>{section.title}</span>
        )}
      </td>

      <td colSpan={5}></td>

      {/* Aksi header kategori */}
      <td>
        <div className="flex  gap-2 items-center">
          {/* Tambah dari HSP */}
          <div className="w-72">
            <SearchableSelect
              options={PekerjaanOptions}
              value={""}
              onChange={(v) => {
                if (!v) return;
                const sel = DropdownPekerjaan.find((it) => it.value === v);
                if (sel) addItemToSection(section.id, sel);
              }}
              placeholder={isLoadingItems ? "Memuat..." : "Tambah dari HSP"}
              loading={isLoadingItems}
              size="sm"
              clearable={false}
              isButton={
                <>
                  <button
                    className="w-full px-3 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-500"
                    onClick={() => navigate("/hsp")}
                  >
                    Kelola HSP
                  </button>
                </>
              }
            />
          </div>

          {/* Tambah manual */}
          <button
            onClick={() => addItemToSection(section.id)}
            className="btn btn-solid btn-sm"
            title="Tambah Manual"
          >
            <BiPlus className="mr-1" /> Manual
          </button>

          {/* Edit / Simpan judul kategori */}
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

          {/* Hapus kategori */}
          <button
            onClick={() => deleteSection(section.id)}
            className="btn btn-ghost btn-xs text-red-600 hover:bg-red-600 hover:text-white"
            title="Hapus Kategori"
          >
            <BiTrash className="text-lg" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* --------------------------- Step 2: Items Table --------------------------- */
type CreateStepTwoProps = {
  projectProfile: ProjectProfile;
  onSave: (data: any) => void;
};

const CreateStepTwo = ({ projectProfile, onSave }: CreateStepTwoProps) => {
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

  const { data: hspAll, isLoading } = useGetAdminAllWithItemsFlat();
  const itemJobList = hspAll?.items ?? [];
  const categories = hspAll?.categories ?? [];
  // Opsi unik untuk dropdown KODE (ambil harga default untuk kode tsb)
  const KodeOptions: Option[] = useMemo(() => {
    const byKode = new Map<string, { harga: number }>();
    for (const it of itemJobList) {
      const k = it?.kode ?? "";
      if (!k) continue;
      if (!byKode.has(k)) byKode.set(k, { harga: Number(it?.harga ?? 0) });
    }
    return Array.from(byKode.keys()).map((k) => ({ label: k, value: k }));
  }, [itemJobList]);

  // Ganti kode: hanya update kode & hargaSatuan (recalc total). Lainnya tetap.
  const changeItemKode = (id: string, kodeBaru: string) => {
    // cari harga untuk kodeBaru (ambil first match)
    const found = itemJobList.find((it: any) => it?.kode === kodeBaru);
    const newHarga = Number(found?.harga ?? 0);
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) => {
          if (i.id !== id) return i;
          const next = { ...i, kode: kodeBaru } as ItemRow;
          // set hargaSatuan dari kode, bersihkan input edit supaya konsisten
          next.hargaSatuan = newHarga;
          next.hargaSatuanInput = undefined;
          // Recalc total pakai volume efektif
          const effVol = getEffectiveVolume(next);
          next.hargaTotal = effVol * newHarga;
          return next;
        }),
      }))
    );
  };
  const CategoryOptions: Option[] = useMemo(
    () =>
      (categories ?? []).map((c: { name: string }) => ({
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
          label: ` ${it.deskripsi} - ${formatIDR(it.harga ?? 0)}/${
            it.satuan ?? "-"
          }`,
          value: unique,
          detail: {
            deskripsi: it.deskripsi,
            satuan: it.satuan ?? "",
            harga: it.harga ?? 0,
            categoryId: it.hspCategoryId,
            categoryName: it.categoryName,
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
      { id: uid(), title, items: [], isEditingTitle: false },
    ]);
    setIsAddingSection(false);
    setIsManualSection(false);
    setSelectedSectionFromList("");
    setManualSectionTitle("");
  };

  const deleteSection = (sectionId: string) =>
    setSections((prev) => prev.filter((s) => s.id !== sectionId));

  const addItemToSection = (sectionId: string, source?: PekerjaanDropdown) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
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
        return { ...s, items: [...s.items, base] };
      })
    );
  };

  const deleteItem = (itemId: string) => {
    setSections((prev) =>
      prev.map((s) => ({ ...s, items: s.items.filter((i) => i.id !== itemId) }))
    );
  };

  const toggleEditItem = (id: string, editing: boolean) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) => {
          if (i.id !== id) return i;

          if (editing) {
            const hsInput =
              i.hargaSatuan > 0
                ? String(i.hargaSatuan)
                : i.hargaSatuanInput ?? "";
            return { ...i, isEditing: true, hargaSatuanInput: hsInput };
          } else {
            const hs = toNumber(i.hargaSatuanInput);
            return {
              ...i,
              isEditing: false,
              hargaSatuan: hs,
              hargaSatuanInput: undefined,
              hargaTotal: getEffectiveVolume(i) * hs,
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
        items: s.items.map((i) => {
          if (i.id !== id) return i;

          // hargaSatuanInput: sanitize & hitung ulang
          if (field === "hargaSatuanInput") {
            const input = sanitizeMoneyInput(String(value));
            const hs = toNumber(input);
            const next = { ...i, hargaSatuanInput: input } as ItemRow;
            next.hargaTotal = getEffectiveVolume(next) * hs;
            return next;
          }

          // field lain (termasuk volumeSource & manualVolumeInput)
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

  /* -------------------------- Copy item -------------------------- */
  const copyItem = (itemId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        const idx = s.items.findIndex((i) => i.id === itemId);
        if (idx === -1) return s;
        const src = s.items[idx];
        const clone: ItemRow = {
          ...src,
          id: uid(),
          isEditing: true,
          hargaSatuanInput: src.hargaSatuan > 0 ? String(src.hargaSatuan) : "",
          volumeDetails: src.volumeDetails ? [...src.volumeDetails] : [],
          volumeSource: src.volumeSource ?? "DETAIL",
          manualVolumeInput: src.manualVolumeInput ?? "",
          hargaTotal: getEffectiveVolume(src) * (Number(src.hargaSatuan) || 0),
        } as ItemRow;
        const items = [...s.items];
        items.splice(idx + 1, 0, clone);
        return { ...s, items };
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
        items: s.items.map((i) => {
          if (i.id !== itemId) return i;

          const volume = Number(totalVol || 0);
          const next: ItemRow = {
            ...i,
            volume,
            volumeDetails: rows,
            volumeSource: "DETAIL", // hasil modal = pakai DETAIL
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
  const isItemId = (dndId: string) => dndId.startsWith("item-");
  const rawSectionId = (dndId: string) => dndId.replace(/^sec-/, "");
  const rawItemId = (dndId: string) => dndId.replace(/^item-/, "");

  const findSectionIdByItemId = (itemDndId: string) => {
    const itemId = rawItemId(itemDndId);
    for (const s of sections)
      if (s.items.some((i) => i.id === itemId)) return s.id;
    return null;
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    // Reorder KATEGORI
    if (isSectionId(activeId) && isSectionId(overId)) {
      const fromId = rawSectionId(activeId);
      const toId = rawSectionId(overId);
      setSections((prev) => {
        const next = [...prev];
        const fromIdx = next.findIndex((s) => s.id === fromId);
        const toIdx = next.findIndex((s) => s.id === toId);
        if (fromIdx < 0 || toIdx < 0) return prev;
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        return next;
      });
      return;
    }

    // Drag ITEM
    if (!isItemId(activeId)) return;
    const isOverItem = isItemId(overId);
    const isOverSectionTop = overId.startsWith("section-");
    const isOverSectionBottom = overId.startsWith("dropzone-");

    const fromSectionId = findSectionIdByItemId(activeId);
    if (!fromSectionId) return;

    const toSectionId = isOverItem
      ? findSectionIdByItemId(overId)!
      : isOverSectionTop
      ? overId.replace("section-", "")
      : isOverSectionBottom
      ? overId.replace("dropzone-", "")
      : null;

    if (!toSectionId) return;

    const activeItemId = rawItemId(activeId);
    const overItemId = isOverItem ? rawItemId(overId) : null;

    setSections((prev) => {
      const next = prev.map((s) => ({ ...s, items: [...s.items] }));
      const from = next.find((s) => s.id === fromSectionId)!;
      const to = next.find((s) => s.id === toSectionId)!;

      const fromIdx = from.items.findIndex((i) => i.id === activeItemId);
      const [moved] = from.items.splice(fromIdx, 1);

      if (isOverItem && overItemId) {
        const overIdx = to.items.findIndex((i) => i.id === overItemId);
        to.items.splice(overIdx, 0, moved);
      } else if (isOverSectionTop) {
        to.items.unshift(moved);
      } else if (isOverSectionBottom) {
        to.items.push(moved);
      }
      return next;
    });
  };

  const handleDragOver = (_e: DragOverEvent) => {};

  /* ------------------------------ Aggregations ----------------------------- */
  const subtotal = sections.reduce(
    (acc, s) =>
      acc + s.items.reduce((t, i) => t + Number(i.hargaTotal ?? 0), 0),
    0
  );
  const ppnPct = Math.max(0, Number(projectProfile.ppn || "0"));
  const ppnAmount = (subtotal * ppnPct) / 100;
  const grandTotal = subtotal + ppnAmount;

  const handleSaveAllData = () => {
    const estimationItem = sections.map((s) => ({
      title: s.title,
      item: s.items.map((i) => {
        const isManual = i.volumeSource === "MANUAL";
        const effectiveVol = getEffectiveVolume(i);

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
                jenis: d.jenis, // "penjumlahan" | "pengurangan"
                panjang: d.panjang,
                lebar: d.lebar,
                tinggi: d.tinggi,
                jumlah: d.jumlah,
                volume: Number(d.volume.toFixed(2)),
                extras:
                  d.extras && d.extras.length
                    ? d.extras.map((x) => ({ name: x.name, value: x.value }))
                    : [],
              })),
        };
      }),
    }));

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
          <span className="badge">{projectProfile.owner || "Owner: "}</span>
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
                placeholder={isLoading ? "Memuat..." : "Pilih Kategori"}
                loading={isLoading}
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

      {/* TABLE + DnD */}
      <div className="collapse bg-transparent shadow-none">
        <div className="overflow-x-auto rounded-lg border border-gray-200 h-[500px]">
          <DndContext
            sensors={useSensors(
              useSensor(PointerSensor, {
                activationConstraint: { distance: 5 },
              })
            )}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            collisionDetection={closestCorners}
          >
            <table className="table min-w-[1100px]">
              <thead className="bg-gray-50 sticky top-0 z-[1]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Uraian Pekerjaan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Kode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Vol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Satuan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Harga Satuan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Harga Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {sections.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      Belum ada kategori. Tambahkan kategori pekerjaan terlebih
                      dahulu.
                    </td>
                  </tr>
                )}

                {sections.map((section, sIdx) => (
                  <SortableContext
                    key={section.id}
                    items={section.items.map((i) => `item-${i.id}`)}
                    strategy={rectSortingStrategy}
                  >
                    {/* Header Kategori */}
                    <SortableSectionHeader
                      section={section}
                      index={sIdx}
                      isLoadingItems={isLoading}
                      PekerjaanOptions={PekerjaanOptions}
                      DropdownPekerjaan={DropdownPekerjaan}
                      addItemToSection={addItemToSection}
                      deleteSection={deleteSection}
                      onToggleEditTitle={toggleEditSectionTitle}
                      onChangeTitle={changeSectionTitle}
                    />

                    {/* DROPPABLE: header (drop ke atas list) */}
                    <DroppableRow
                      droppableId={`section-${section.id}`}
                      colSpan={8}
                    />

                    {/* Items */}
                    {section.items.map((item, idxInSection) => (
                      <SortableItemRow
                        key={item.id}
                        idxInSection={idxInSection}
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

                    {/* DROPPABLE: bawah (akhir list) */}
                    <DroppableRow
                      droppableId={`dropzone-${section.id}`}
                      colSpan={7}
                      showHint={section.items.length === 0}
                    />

                    {/* Subtotal per kategori */}
                    {!!section.items.length && (
                      <tr className="bg-gray-50">
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-sm text-right text-gray-700"
                        >
                          Subtotal {section.title}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {formatIDR(
                            section.items.reduce(
                              (a, b) => a + (b.hargaTotal ?? 0),
                              0
                            )
                          )}
                        </td>
                        <td />
                      </tr>
                    )}
                  </SortableContext>
                ))}
              </tbody>
            </table>

            {/* Overlay (optional) */}
            <DragOverlay dropAnimation={defaultDropAnimation} />
          </DndContext>
        </div>
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
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
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
          setImageFile(null); // reset image
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
          Lengkapi profil proyek, lalu tambahkan item pekerjaan pada tabel di
          bawah.
        </p>
      </div>

      <div className="join join-vertical w-full gap-4">
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

        {/* ACCORDION: Step 2 */}
        <div className="collapse collapse-arrow join-item rounded-xl border border-gray-200 bg-white">
          <input
            type="radio"
            name="wizard-create-estimation"
            checked={activeAccordion === "step2"}
            onChange={() => toggleAccordion("step2")}
          />
          <div className="collapse-title text-lg font-semibold text-gray-900">
            {`  2) Estimation Items`}
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
