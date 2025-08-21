export interface HspItem {
  kode: string;
  deskripsi: string;
  satuan: string;
  harga: number;
}

export interface HspMetaParams {
  q: string;
  limitPerCategory: number;
  includeEmpty: boolean;
  itemOrderBy: string;
  itemOrderDir: string;
}

export interface HspMeta {
  categories: number;
  items: number;
  params: HspMetaParams;
}

export interface HspAllModel {
  status: string;
  data: {
    [category: string]: HspItem[];
  };
  meta: HspMeta;
}

export interface ItemJobModel {
  id: string;
  kode: string;
  deskripsi: string;
  satuan: string;
  harga: number;
  hspCategoryId: string;
  category: {
    id: string;
    name: string;
  };
  pagination: {
    skip: number;
    take: number;
    total: number;
  };
}

export interface CategoryItemModel {
  id: string;
  name: string;
  _count: { items: number };
}

export type GroupKey = "LABOR" | "MATERIAL" | "EQUIPMENT" | "OTHER";

export interface MasterItemModel {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
  type: GroupKey;
}

export interface AhspComponentModel {
  id: string;
  order: number;
  group: GroupKey;
  masterItemId: string;
  masterItem?: MasterItemModel;

  nameSnapshot: string;
  unitSnapshot: string;
  unitPriceSnapshot: number;

  coefficient: number;
  priceOverride: number | null;
  notes?: string | null;

  effectiveUnitPrice?: number | null;
  subtotal?: number | null;
}

export interface AhspGroupModel {
  key: GroupKey;
  label: "A" | "B" | "C" | "X";
  subtotal: number;
  items: AhspComponentModel[];
}

export interface RecipeComputedModel {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
}

export interface RecipeStoredModel {
  subtotalABC: number | null;
  overheadAmount: number | null;
  finalUnitPrice: number | null;
}

export interface AhspRecipeModel {
  id: string;
  overheadPercent: number;
  stored: RecipeStoredModel;
  computed: RecipeComputedModel;
  groups: Record<GroupKey, AhspGroupModel>;
  notes?: string | null;
  updatedAt: string;
}

export interface AhspDetailModel {
  id: string; // HSP item id
  kode: string;
  deskripsi: string;
  satuan: string;
  category: { id: string; name: string };
  harga: number; // cached price
  recipe: AhspRecipeModel | null;
}

// src/model/hsp.ts



export interface AhspComponentModel {
  id: string;
  order: number;
  group: GroupKey;
  masterItemId: string;
  masterItem?: MasterItemModel;
  nameSnapshot: string;
  unitSnapshot: string;
  unitPriceSnapshot: number;
  coefficient: number;
  priceOverride: number | null;
  notes?: string | null;
  effectiveUnitPrice?: number | null;
  subtotal?: number | null;
}

export interface AhspGroupModel {
  key: GroupKey;
  label: "A" | "B" | "C" | "X";
  subtotal: number;
  items: AhspComponentModel[];
}

export interface AhspDetailModel {
  id: string;
  kode: string;
  deskripsi: string;
  satuan: string;
  category: { id: string; name: string };
  harga: number;
  recipe: null | {
    id: string;
    overheadPercent: number;
    stored: {
      subtotalABC: number | null;
      overheadAmount: number | null;
      finalUnitPrice: number | null;
    };
    computed: {
      A: number;
      B: number;
      C: number;
      D: number;
      E: number;
      F: number;
    };
    groups: Record<GroupKey, AhspGroupModel>;
    notes?: string | null;
    updatedAt: string;
  };
}
