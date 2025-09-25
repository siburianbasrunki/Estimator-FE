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
  defaultDropAnimation,
  DragOverlay,
  useDroppable, // <— penting
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
  ppn: string;
  notes: string;
  customFields: Record<string, string>;
}
type VolumeSource = "MANUAL" | "DETAIL";

type ItemRow = {
  id: string;
  kode: string;
  deskripsi: string;
  volume: number;
  volumeDetails?: VolumeDetailRow[];
  volumeSource?: VolumeSource;
  manualVolumeInput?: string;
  satuan: string;
  hargaSatuan: number;
  hargaSatuanInput?: string;
  hargaTotal: number;
  isEditing?: boolean;
};

type Group = {
  id: string;
  title: string;
  items: ItemRow[];
  isEditingTitle?: boolean;
};

type Section = {
  id: string;
  title: string;
  items: ItemRow[]; // jika TANPA groups
  groups?: Group[]; // jika pakai groups
  isEditingTitle?: boolean;
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
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1.5 bg-blue-600 rounded" />
        <p className="text-blue-700 font-semibold">Profil Proyek</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Left form */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="textarea textarea-bordered w-full text-black bg-white border-black"
              placeholder="Masukkan deskripsi / catatan proyek"
              rows={3}
            />
          </div>

          {/* Custom fields */}
          <div className="space-y-2.5">
            <div className="text-sm font-medium text-gray-700">
              Custom Fields
            </div>
            {!!customFields.length && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      className="btn btn-ghost btn-xs text-red-600"
                      aria-label="Hapus field"
                      title="Hapus field"
                    >
                      <BiTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom field */}
            <div className="flex flex-col sm:flex-row gap-2.5">
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
                className="btn btn-primary btn-sm text-white"
              >
                <BiPlus size={16} /> Tambah Field
              </button>
            </div>
          </div>
          <div className="pt-1">
            <button
              onClick={onSave}
              className="btn btn-success btn-sm text-white"
            >
              Lanjut ke Estimation Items
            </button>
          </div>
        </div>

        {/* Right preview image */}
        <div className="lg:w-1/3">
          <div className="card bg-base-100 border border-gray-200 shadow-sm">
            <figure className="px-3 pt-3">
              <img
                src={previewUrl || ImageProyek}
                alt="Preview Proyek"
                className="rounded-lg border border-gray-200 object-cover"
              />
            </figure>
            <div className="card-body p-3">
              <input
                id="project-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="project-image-input"
                className="btn btn-outline btn-xs cursor-pointer"
              >
                <BiEdit className="mr-1" /> Ganti Gambar
              </label>
              {!!imageFile && (
                <button
                  className="btn btn-ghost btn-xs text-red-600 mt-1"
                  onClick={() => onPickImage(null)}
                >
                  <BiTrash className="mr-1" /> Hapus pilihan
                </button>
              )}
              <div className="text-[11px] text-gray-500">
                Format disarankan: JPG/PNG, rasio 4:3.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------- Card Utilities -------------------------- */
const getEffectiveVolume = (i: ItemRow) =>
  (i.volumeSource === "MANUAL"
    ? Math.max(0, toNumber(i.manualVolumeInput || "0"))
    : Math.max(0, Number(i.volume || 0))) || 0;

/** Wadah droppable untuk list (termasuk kosong) */
function DroppableContainer({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ""} ${
        isOver ? "ring-2 ring-primary/40 rounded-md" : ""
      }`}
    >
      {children}
    </div>
  );
}

/** ITEM CARD */
function SortableItemCard({
  indexNumber,
  item,
  onEditToggle,
  onDelete,
  onCopy,
  onUpdateField,
  onOpenVolumeModal,
  kodeOptions,
  onChangeKode,
}: {
  indexNumber: number;
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
      className={`card w-full border border-gray-200 bg-white shadow-sm ${
        isDragging ? "ring-2 ring-primary/50" : ""
      }`}
    >
      <div className="card-body p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-neutral">{indexNumber}</span>
            {!item.isEditing ? (
              <button
                onClick={() => onEditToggle(item.id, true)}
                className="btn btn-ghost btn-xs text-blue-600"
                title="Edit"
              >
                <BiEdit />
              </button>
            ) : (
              <button
                onClick={() => onEditToggle(item.id, false)}
                className="btn btn-ghost btn-xs text-green-600"
                title="Simpan"
              >
                <BiSave />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
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
                className="dropdown-content z-[1] menu p-2 shadow bg-white text-black rounded-box w-40"
              >
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
                <li>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="justify-start"
                    title="Hapus item"
                  >
                    <BiTrash className="text-red-600" />
                    <span>Hapus</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Drag handle */}
            <button
              className="btn btn-ghost btn-xs cursor-grab active:cursor-grabbing text-gray-600 text-lg bg-white"
              title="Drag"
              aria-label="Drag untuk memindahkan"
              {...attributes}
              {...listeners}
            >
              ≡
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="col-span-1 sm:col-span-2">
            <label className="text-xs text-gray-500">Uraian Pekerjaan</label>
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
              <div className="text-sm text-gray-800">
                {item.deskripsi || "-"}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500">Kode</label>
            {item.isEditing ? (
              <SearchableSelect
                options={kodeOptions}
                value={item.kode ?? ""}
                onChange={(v) => v && onChangeKode(item.id, v)}
                placeholder="Pilih Kode"
                size="sm"
              />
            ) : (
              <div className="text-sm font-mono">{item.kode || "-"}</div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500">Satuan</label>
            {item.isEditing ? (
              <SearchableSelect
                options={unitOptions}
                value={item.satuan ?? ""}
                onChange={(v) => onUpdateField(item.id, "satuan", v ?? "")}
                placeholder="Satuan"
                size="sm"
              />
            ) : (
              <div className="text-sm">
                {UnitList.find((u) => u.value === item.satuan)?.label ||
                  item.satuan ||
                  "-"}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500">Volume</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="any"
                className="input input-bordered input-sm w-full text-right text-black bg-white border-black"
                value={volInputDisplay}
                onChange={(e) => {
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
                <BiCalculator />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Harga Satuan</label>
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
              <div className="text-sm">{formatIDR(item.hargaSatuan)}</div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500">Harga Total</label>
            <div className="text-sm font-semibold text-gray-900">
              {formatIDR(item.hargaTotal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** SECTION HEADER CARD — draggable & editable */
function SortableSectionHeaderCard({
  section,
  index,
  isLoadingItems,
  PekerjaanOptions,
  DropdownPekerjaan,
  addItemToSection,
  addGroupToSection,
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
  addGroupToSection: (sectionId: string) => void;
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
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-blue-200 bg-blue-50/60 rounded-lg p-3 ${
        isDragging ? "ring-2 ring-primary/50" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost btn-xs cursor-grab active:cursor-grabbing text-2xl text-black bg-white"
            title="Drag kategori"
            aria-label="Drag kategori"
            {...attributes}
            {...listeners}
          >
            ≡
          </button>
          <span className="badge badge-primary">
            {String.fromCharCode(65 + index)}
          </span>
          <div className="min-w-[160px]">
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
              <div className="text-sm font-semibold text-blue-800">
                {section.title}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => addGroupToSection(section.id)}
            className="btn btn-outline btn-xs"
            title="Tambah Title Pekerjaan"
          >
            <BiPlus className="mr-1" /> Title
          </button>

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

          <button
            onClick={() => addItemToSection(section.id)}
            className="btn btn-solid btn-xs"
            title="Tambah Manual"
          >
            <BiPlus className="mr-1" /> Manual
          </button>

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

/* ------------------------- Group Header (title) CARD ------------------------- */
function GroupHeaderCard({
  group,
  label,
  isLoadingItems,
  PekerjaanOptions,
  DropdownPekerjaan,
  addItemToGroup,
  deleteGroup,
  onToggleEditTitle,
  onChangeTitle,
}: {
  group: Group;
  label: string;
  isLoadingItems: boolean;
  PekerjaanOptions: Option[];
  DropdownPekerjaan: {
    kode: string;
    label: string;
    value: string;
    detail: { deskripsi: string; satuan: string; harga: number };
  }[];
  addItemToGroup: (groupId: string, source?: any) => void;
  deleteGroup: (groupId: string) => void;
  onToggleEditTitle: (id: string, editing: boolean) => void;
  onChangeTitle: (id: string, title: string) => void;
}) {
  return (
    <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="badge">{label}</span>
          {group.isEditingTitle ? (
            <input
              autoFocus
              className="input input-bordered input-sm w-[240px] text-black bg-white border-black"
              value={group.title}
              onChange={(e) => onChangeTitle(group.id, e.target.value)}
              onBlur={() => onToggleEditTitle(group.id, false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape")
                  onToggleEditTitle(group.id, false);
              }}
              placeholder="Title pekerjaan"
            />
          ) : (
            <div className="text-sm font-semibold text-amber-900">
              {group.title}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-72">
            <SearchableSelect
              options={PekerjaanOptions}
              value={""}
              onChange={(v) => {
                if (!v) return;
                const sel = DropdownPekerjaan.find((it) => it.value === v);
                if (sel) addItemToGroup(group.id, sel);
              }}
              placeholder={isLoadingItems ? "Memuat..." : "Tambah dari HSP"}
              loading={isLoadingItems}
              size="sm"
            />
          </div>
          <button
            onClick={() => addItemToGroup(group.id)}
            className="btn btn-solid btn-xs"
            title="Tambah Manual"
          >
            <BiPlus className="mr-1" /> Manual
          </button>
          {!group.isEditingTitle ? (
            <button
              onClick={() => onToggleEditTitle(group.id, true)}
              className="btn btn-ghost btn-xs text-blue-600"
              title="Edit title"
            >
              <BiEdit className="text-lg" />
            </button>
          ) : (
            <button
              onClick={() => onToggleEditTitle(group.id, false)}
              className="btn btn-ghost btn-xs text-green-600"
              title="Simpan title"
            >
              <BiSave className="text-lg" />
            </button>
          )}
          <button
            onClick={() => deleteGroup(group.id)}
            className="btn btn-ghost btn-xs text-red-600"
            title="Hapus title"
          >
            <BiTrash className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Step 2: Items Cards (1 kolom) --------------------------- */
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

  const KodeOptions: Option[] = useMemo(() => {
    const byKode = new Map<string, { harga: number }>();
    for (const it of itemJobList) {
      const k = it?.kode ?? "";
      if (!k) continue;
      if (!byKode.has(k)) byKode.set(k, { harga: Number(it?.harga ?? 0) });
    }
    return Array.from(byKode.keys()).map((k) => ({ label: k, value: k }));
  }, [itemJobList]);

  const changeItemKode = (id: string, kodeBaru: string) => {
    const found = itemJobList.find((it: any) => it?.kode === kodeBaru);
    const newHarga = Number(found?.harga ?? 0);
    setSections((prev) =>
      prev.map((s) => {
        if (s.groups?.length) {
          return {
            ...s,
            groups: s.groups.map((g) => ({
              ...g,
              items: g.items.map((i) => {
                if (i.id !== id) return i;
                const next = { ...i, kode: kodeBaru } as ItemRow;
                next.hargaSatuan = newHarga;
                next.hargaSatuanInput = undefined;
                const effVol = getEffectiveVolume(next);
                next.hargaTotal = effVol * newHarga;
                return next;
              }),
            })),
          };
        }
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            const next = { ...i, kode: kodeBaru } as ItemRow;
            next.hargaSatuan = newHarga;
            next.hargaSatuanInput = undefined;
            const effVol = getEffectiveVolume(next);
            next.hargaTotal = effVol * newHarga;
            return next;
          }),
        };
      })
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

  const addGroupToSection = (sectionId: string, title = "Title Pekerjaan") => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const nextGroups = [...(s.groups ?? [])];
        nextGroups.push({ id: uid(), title, items: [], isEditingTitle: true });
        return { ...s, groups: nextGroups, items: [] };
      })
    );
  };

  const changeGroupTitle = (groupId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (!s.groups) return s;
        const groups = s.groups.map((g) =>
          g.id === groupId ? { ...g, title } : g
        );
        return { ...s, groups };
      })
    );
  };

  const toggleEditGroupTitle = (groupId: string, editing: boolean) => {
    setSections((prev) =>
      prev.map((s) => {
        if (!s.groups) return s;
        const groups = s.groups.map((g) =>
          g.id === groupId ? { ...g, isEditingTitle: editing } : g
        );
        return { ...s, groups };
      })
    );
  };

  const deleteGroup = (groupId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (!s.groups) return s;
        const groups = s.groups.filter((g) => g.id !== groupId);
        return { ...s, groups };
      })
    );
  };

  const addItemToGroup = (groupId: string, source?: PekerjaanDropdown) => {
    setSections((prev) =>
      prev.map((s) => {
        if (!s.groups) return s;
        const groups = s.groups.map((g) => {
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
        return { ...s, groups };
      })
    );
  };

  const addItemToSection = (sectionId: string, source?: PekerjaanDropdown) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        if (s.groups?.length) return s;
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
      prev.map((s) => {
        if (s.groups?.length) {
          return {
            ...s,
            groups: s.groups.map((g) => ({
              ...g,
              items: g.items.filter((i) => i.id !== itemId),
            })),
          };
        }
        return { ...s, items: s.items.filter((i) => i.id !== itemId) };
      })
    );
  };

  const toggleEditItem = (id: string, editing: boolean) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.groups?.length) {
          return {
            ...s,
            groups: s.groups.map((g) => ({
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
                  return {
                    ...i,
                    isEditing: false,
                    hargaSatuan: hs,
                    hargaSatuanInput: undefined,
                    hargaTotal: getEffectiveVolume(i) * hs,
                  };
                }
              }),
            })),
          };
        }
        return {
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
        };
      })
    );
  };

  const updateItemField = (id: string, field: keyof ItemRow, value: any) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.groups?.length) {
          return {
            ...s,
            groups: s.groups.map((g) => ({
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
          };
        }

        return {
          ...s,
          items: s.items.map((i) => {
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
        };
      })
    );
  };

  const copyItem = (itemId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.groups?.length) {
          return {
            ...s,
            groups: s.groups.map((g) => {
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
              } as ItemRow;
              const items = [...g.items];
              items.splice(idx + 1, 0, clone);
              return { ...g, items };
            }),
          };
        }
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

  /* --------------------- Volume Modal --------------------- */
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
      prev.map((s) => {
        if (s.groups?.length) {
          return {
            ...s,
            groups: s.groups.map((g) => ({
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
          };
        }
        return {
          ...s,
          items: s.items.map((i) => {
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
        };
      })
    );
  };

  /* --------------------------- Drag & Drop --------------------------- */
  const isSectionId = (dndId: string) => dndId.startsWith("sec-");
  const isItemId = (dndId: string) => dndId.startsWith("item-");
  const isGroupContainerId = (dndId: string) => dndId.startsWith("group-");
  const isSectionContainerId = (dndId: string) => dndId.startsWith("secItems-");
  const rawSectionId = (dndId: string) => dndId.replace(/^sec-/, "");
  const rawItemId = (dndId: string) => dndId.replace(/^item-/, "");
  const rawGroupIdFromContainer = (dndId: string) =>
    dndId.replace(/^group-/, "");
  const rawSectionIdFromContainer = (dndId: string) =>
    dndId.replace(/^secItems-/, "");

  // temukan posisi item
  const locateItem = (itemId: string) => {
    for (const s of sections) {
      const idxS = s.items.findIndex((i) => i.id === itemId);
      if (idxS !== -1)
        return { sectionId: s.id, groupId: null as string | null, index: idxS };
      for (const g of s.groups ?? []) {
        const idxG = g.items.findIndex((i) => i.id === itemId);
        if (idxG !== -1) return { sectionId: s.id, groupId: g.id, index: idxG };
      }
    }
    return null;
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    // ---------- Reorder Section headers ----------
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

    // ---------- Item cards ----------
    if (!isItemId(activeId)) return;

    const activeItemId = rawItemId(activeId);
    const src = locateItem(activeItemId);
    if (!src) return;

    // 1) Item → Item (reorder / pindah antar container by target item)
    if (isItemId(overId)) {
      const overItemId = rawItemId(overId);
      const dst = locateItem(overItemId);
      if (!dst) return;

      // Same section (no groups)
      if (!src.groupId && !dst.groupId && src.sectionId === dst.sectionId) {
        setSections((prev) => {
          const next = prev.map((s) => ({ ...s, items: [...s.items] }));
          const sec = next.find((s) => s.id === src.sectionId)!;
          const [moved] = sec.items.splice(src.index, 1);
          const insertIndex = src.index < dst.index ? dst.index - 1 : dst.index;
          sec.items.splice(insertIndex, 0, moved);
          return next;
        });
        return;
      }

      // Same group
      if (src.groupId && dst.groupId && src.groupId === dst.groupId) {
        setSections((prev) =>
          prev.map((s) => {
            if (!s.groups) return s;
            const groups = s.groups.map((g) => {
              if (g.id !== src.groupId) return g;
              const items = [...g.items];
              const [moved] = items.splice(src.index, 1);
              const insertIndex =
                src.index < dst.index ? dst.index - 1 : dst.index;
              items.splice(insertIndex, 0, moved);
              return { ...g, items };
            });
            return { ...s, groups };
          })
        );
        return;
      }

      // groupA -> groupB (beda group / beda section)
      if (src.groupId && dst.groupId && src.groupId !== dst.groupId) {
        setSections((prev) =>
          prev.map((s) => {
            if (!s.groups) return s;
            const groups = s.groups.map((g) => ({ ...g, items: [...g.items] }));
            const fromG = groups.find((g) => g.id === src.groupId)!;
            const toG = groups.find((g) => g.id === dst.groupId)!;
            const [moved] = fromG.items.splice(src.index, 1);

            // dst.index adalah index item tujuan
            const overIndex = toG.items.findIndex((i) => i.id === overItemId);
            const insertIndex = overIndex >= 0 ? overIndex : toG.items.length;
            toG.items.splice(insertIndex, 0, moved);
            return { ...s, groups };
          })
        );
        return;
      }

      // section(no group) -> section(no group) beda section
      if (!src.groupId && !dst.groupId && src.sectionId !== dst.sectionId) {
        setSections((prev) => {
          const next = prev.map((s) => ({ ...s, items: [...s.items] }));
          const fromSec = next.find((s) => s.id === src.sectionId)!;
          const toSec = next.find((s) => s.id === dst.sectionId)!;
          const [moved] = fromSec.items.splice(src.index, 1);

          const overIndex = toSec.items.findIndex((i) => i.id === overItemId);
          const insertIndex = overIndex >= 0 ? overIndex : toSec.items.length;
          toSec.items.splice(insertIndex, 0, moved);
          return next;
        });
        return;
      }

      // section(no group) -> group (drop ke item dalam group)
      if (!src.groupId && dst.groupId) {
        setSections((prev) =>
          prev.map((s) => {
            const next = {
              ...s,
              items: [...s.items],
              groups: s.groups?.map((g) => ({ ...g, items: [...g.items] })),
            };
            if (next.id === src.sectionId) {
              const [moved] = next.items.splice(src.index, 1);
              if (next.groups?.length) {
                const toG = next.groups.find((g) => g.id === dst.groupId)!;
                const overIndex = toG.items.findIndex(
                  (i) => i.id === overItemId
                );
                const insertIndex =
                  overIndex >= 0 ? overIndex : toG.items.length;
                toG.items.splice(insertIndex, 0, moved);
              }
            }
            return next;
          })
        );
        return;
      }

      // group -> section(no group) (drop ke item dalam section)
      if (src.groupId && !dst.groupId) {
        setSections((prev) =>
          prev.map((s) => {
            const next = {
              ...s,
              items: [...s.items],
              groups: s.groups?.map((g) => ({ ...g, items: [...g.items] })),
            };
            if (next.groups?.length) {
              const fromG = next.groups.find((g) => g.id === src.groupId)!;
              const idx = fromG.items.findIndex((i) => i.id === activeItemId);
              if (idx !== -1) {
                const [moved] = fromG.items.splice(idx, 1);
                if (next.id === dst.sectionId) {
                  const overIndex = next.items.findIndex(
                    (i) => i.id === overItemId
                  );
                  const insertIndex =
                    overIndex >= 0 ? overIndex : next.items.length;
                  next.items.splice(insertIndex, 0, moved);
                }
              }
            }
            return next;
          })
        );
        return;
      }
    }

    // 2) Item → Container (group kosong atau section kosong)
    if (isGroupContainerId(overId)) {
      const toGroupId = rawGroupIdFromContainer(overId);
      if (!toGroupId) return;

      setSections((prev) =>
        prev.map((s) => {
          const next = {
            ...s,
            items: [...s.items],
            groups: s.groups?.map((g) => ({ ...g, items: [...g.items] })),
          };

          // ambil dari sumber
          let moved: ItemRow | undefined;
          if (src.groupId) {
            const fromG = next.groups?.find((g) => g.id === src.groupId)!;
            moved = fromG.items.splice(src.index, 1)[0];
          } else {
            const idx = next.items.findIndex((i) => i.id === activeItemId);
            if (idx !== -1) moved = next.items.splice(idx, 1)[0];
          }

          if (moved && next.groups?.length) {
            const toG = next.groups.find((g) => g.id === toGroupId)!;
            toG.items.push(moved); // taruh di akhir
          }
          return next;
        })
      );
      return;
    }

    if (isSectionContainerId(overId)) {
      const toSectionId = rawSectionIdFromContainer(overId);
      if (!toSectionId) return;

      setSections((prev) =>
        prev.map((s) => {
          const next = {
            ...s,
            items: [...s.items],
            groups: s.groups?.map((g) => ({ ...g, items: [...g.items] })),
          };

          let moved: ItemRow | undefined;
          if (src.groupId && next.groups?.length) {
            const fromG = next.groups.find((g) => g.id === src.groupId)!;
            const idx = fromG.items.findIndex((i) => i.id === activeItemId);
            if (idx !== -1) moved = fromG.items.splice(idx, 1)[0];
          } else if (!src.groupId) {
            if (next.id === src.sectionId) {
              moved = next.items.splice(src.index, 1)[0];
            }
          }
          // append di section target
          if (moved && next.id === toSectionId) {
            next.items.push(moved);
          }
          return next;
        })
      );
      return;
    }
  };

  const handleDragOver = (_e: DragOverEvent) => {
    // optional: tidak digunakan; semua logika difinalkan di dragEnd
  };

  /* ------------------------------ Totals ------------------------------ */
  const subtotal = sections.reduce((acc, s) => {
    if (s.groups?.length) {
      const sg = s.groups.reduce(
        (gacc, g) =>
          gacc + g.items.reduce((t, i) => t + Number(i.hargaTotal || 0), 0),
        0
      );
      return acc + sg;
    }
    return acc + s.items.reduce((t, i) => t + Number(i.hargaTotal || 0), 0);
  }, 0);

  const ppnPct = Math.max(0, Number(projectProfile.ppn || "0"));
  const ppnAmount = (subtotal * ppnPct) / 100;
  const grandTotal = subtotal + ppnAmount;

  const handleSaveAllData = () => {
    const asItem = (items: ItemRow[]) =>
      items.map((i) => {
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
                jenis: d.jenis,
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
      });

    const estimationItem = sections.map((s) => {
      if (s.groups?.length) {
        return {
          title: s.title,
          groups: s.groups.map((g) => ({
            title: g.title,
            items: asItem(g.items),
          })),
        };
      }
      return { title: s.title, item: asItem(s.items) };
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
    <div className="bg-white rounded-xl shadow p-4 sm:p-5">
      {/* Title Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">
          {projectProfile.projectName || "Nama Proyek"}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="badge">{projectProfile.owner || "Owner: "}</span>
          <span className="badge">PPN {ppnPct || 0}%</span>
        </div>
      </div>

      {/* Tambah Kategori */}
      <div className="mb-4">
        {isAddingSection ? (
          <div className="space-y-2.5">
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
            <div className="flex flex-wrap gap-1.5">
              <button
                className="btn btn-soft btn-xs"
                onClick={() => setIsManualSection((v) => !v)}
              >
                {isManualSection ? "Pilih dari Daftar" : "Input Manual"}
              </button>
              <button
                className="btn btn-primary btn-xs text-white"
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
                className="btn btn-warning btn-xs"
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
            className="btn btn-success btn-xs text-white"
            onClick={() => setIsAddingSection(true)}
          >
            <BiPlus className="mr-1" /> Tambah Kategori Pekerjaan
          </button>
        )}
      </div>

      {/* Cards (1 kolom) + DnD */}
      <DndContext
        sensors={useSensors(
          useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
        )}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        collisionDetection={closestCorners}
      >
        {sections.length === 0 && (
          <div className="text-center text-sm text-gray-500 border border-dashed rounded-lg p-8">
            Belum ada kategori. Tambahkan kategori pekerjaan terlebih dahulu.
          </div>
        )}

        {/* Sortable untuk semua header section */}
        <SortableContext
          items={sections.map((s) => `sec-${s.id}`)}
          strategy={rectSortingStrategy}
        >
          {sections.map((section, sIdx) => {
            const usingGroups = (section.groups?.length ?? 0) > 0;

            return (
              <div key={section.id} className="mb-5">
                {/* Section header */}
                <SortableSectionHeaderCard
                  section={section}
                  index={sIdx}
                  isLoadingItems={isLoading}
                  PekerjaanOptions={PekerjaanOptions}
                  DropdownPekerjaan={DropdownPekerjaan}
                  addItemToSection={addItemToSection}
                  addGroupToSection={addGroupToSection}
                  deleteSection={deleteSection}
                  onToggleEditTitle={toggleEditSectionTitle}
                  onChangeTitle={changeSectionTitle}
                />

                {/* Content */}
                {usingGroups ? (
                  section.groups!.map((g, gIdx) => {
                    const groupSubtotal = g.items.reduce(
                      (a, b) => a + (b.hargaTotal ?? 0),
                      0
                    );
                    const groupLabel = `${String.fromCharCode(65 + sIdx)}.${
                      gIdx + 1
                    }`;

                    return (
                      <div key={g.id} className="mt-3">
                        {/* Group header */}
                        <GroupHeaderCard
                          group={g}
                          label={groupLabel}
                          isLoadingItems={isLoading}
                          PekerjaanOptions={PekerjaanOptions}
                          DropdownPekerjaan={DropdownPekerjaan}
                          addItemToGroup={addItemToGroup}
                          deleteGroup={deleteGroup}
                          onToggleEditTitle={toggleEditGroupTitle}
                          onChangeTitle={changeGroupTitle}
                        />

                        {/* Items list: 1 kolom (droppable) */}
                        <DroppableContainer
                          id={`group-${g.id}`}
                          className="mt-3"
                        >
                          <SortableContext
                            items={g.items.map((i) => `item-${i.id}`)}
                            strategy={rectSortingStrategy}
                          >
                            <div
                              className={`space-y-3 ${
                                g.items.length === 0
                                  ? "p-3 border border-dashed rounded-lg text-xs text-gray-500"
                                  : ""
                              }`}
                            >
                              {g.items.length === 0 &&
                                "Tarik & lepas item ke sini"}
                              {g.items.map((item, idxInGroup) => (
                                <SortableItemCard
                                  key={item.id}
                                  indexNumber={idxInGroup + 1}
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
                          </SortableContext>
                        </DroppableContainer>

                        {/* Group subtotal */}
                        {!!g.items.length && (
                          <div className="mt-2 flex justify-end">
                            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                              <span className="text-gray-700">
                                Subtotal {g.title}:{" "}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {formatIDR(groupSubtotal)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <>
                    {/* Items list (no groups) — 1 kolom (droppable) */}
                    <DroppableContainer
                      id={`secItems-${section.id}`}
                      className="mt-3"
                    >
                      <SortableContext
                        items={section.items.map((i) => `item-${i.id}`)}
                        strategy={rectSortingStrategy}
                      >
                        <div
                          className={`space-y-3 ${
                            section.items.length === 0
                              ? "p-3 border border-dashed rounded-lg text-xs text-gray-500"
                              : ""
                          }`}
                        >
                          {section.items.length === 0 &&
                            "Tarik & lepas item ke sini"}
                          {section.items.map((item, idxInSection) => (
                            <SortableItemCard
                              key={item.id}
                              indexNumber={idxInSection + 1}
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
                      </SortableContext>
                    </DroppableContainer>

                    {/* Section subtotal */}
                    {!!section.items.length && (
                      <div className="mt-2 flex justify-end">
                        <div className="px-3 py-2 rounded-lg bg-gray-50 border text-sm">
                          <span className="text-gray-700">
                            Subtotal {section.title}:{" "}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatIDR(
                              section.items.reduce(
                                (a, b) => a + (b.hargaTotal ?? 0),
                                0
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </SortableContext>

        {/* Overlay */}
        <DragOverlay dropAnimation={defaultDropAnimation} />
      </DndContext>

      {/* Footer total & actions */}
      <div className="rounded-lg border border-gray-200 p-3 mt-5 bg-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <div className="flex items-center justify-between gap-6">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                {formatIDR(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-gray-600">PPN ({ppnPct}%)</span>
              <span className="font-semibold text-gray-900">
                {formatIDR(ppnAmount)}
              </span>
            </div>
            <div className="divider my-1" />
            <div className="flex items-center justify-between gap-6">
              <span className="text-gray-800 font-semibold">Grand Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatIDR(grandTotal)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
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

      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Create Estimation</h1>
        <p className="text-sm text-gray-600">
          Lengkapi profil proyek, lalu tambahkan item pekerjaan pada kartu-kartu
          di bawah.
        </p>
      </div>

      <div className="join join-vertical w-full gap-3">
        <div className="collapse collapse-arrow join-item rounded-xl border border-gray-200 bg-white">
          <input
            type="radio"
            name="wizard-create-estimation"
            checked={activeAccordion === "step1"}
            onChange={() => toggleAccordion("step1")}
          />
          <div className="collapse-title text-base font-semibold text-gray-900">
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
          <div className="collapse-title text-base font-semibold text-gray-900">
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
