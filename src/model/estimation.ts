export interface Estimation {
  id: string;
  projectName: string;
  projectOwner: string;
  ppn: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: Author;
  customFields: CustomField[];
  items: EstimationItem[];
  imageUrl?: string;
  imageId?: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}

export interface Author {
  id: string;
  name: string;
  email: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: string;
  estimationId: string;
}

export interface EstimationItem {
  id: string;
  title: string;
  estimationId: string;
  details: EstimationDetail[];
  groups?: JobGroup[];
}

export interface JobGroup {
  id: string;
  title: string;
  order: number;
  estimationItemId: string;
  details: EstimationDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EstimationDetail {
  id: string;
  kode: string;
  deskripsi: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  hargaTotal: number;
  estimationItemId: string;

  jobGroupId?: string | null;
  parentDetailId?: string | null;
  order?: number;
  hspItemId?: string;
  children?: EstimationDetail[];
  volumeDetails?: VolumeDetail[];
  hspItem?: HspItem | null;
}

export interface VolumeDetail {
  id: string;
  nama: string;
  jenis: "ADD" | "SUB" | string;
  panjang?: number | null;
  lebar?: number | null;
  tinggi?: number | null;
  jumlah?: number | null;
  volume: number;
  extras?: Array<{ name: string; value: string }>;
  itemDetailId: string;
}
export interface HspItem {
  id: string;
  scope: string;
  kode: string;
  deskripsi: string;
  satuan: string;
  harga: number;
  isDeleted: boolean;
  isDisabled: boolean;
  hspCategoryId: string;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    scope: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  ahsp?: {
    id: string;
    scope: string;
    hspItemId: string;
    overheadPercent: number;
    subtotalABC: number;
    overheadAmount: number;
    finalUnitPrice: number;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    components?: AhspComponent[];
  } | null;
}

export interface AhspComponent {
  id: string;
  scope: string;
  ahspId: string;
  group: string;
  masterItemId: string;
  nameSnapshot: string;
  unitSnapshot: string;
  unitPriceSnapshot: number;
  coefficient: number;
  priceOverride?: number | null;
  effectiveUnitPrice: number;
  subtotal: number;
  order: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  masterItem?: {
    id: string;
    scope: string;
    code: string;
    name: string;
    unit: string;
    price: number;
    type: string;
    hourlyRate?: number;
    dailyRate?: number;
    notes?: string | null;
    isDeleted: boolean;
    isDisabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

type ItemInput = {
  kode: string;
  nama: string;
  satuan: string;
  harga: number;
  volume: number;
  hargaTotal: number;
  children?: ItemInput[];
};

export interface EstimationCreateModel {
  projectName: string;
  owner: string;
  ppn: string;
  notes: string;
  customFields: Record<string, string>;
  estimationItem: Array<{
    title: string;
    item?: ItemInput[];
    groups?: Array<{
      title: string;
      items: ItemInput[];
    }>;
  }>;
}
