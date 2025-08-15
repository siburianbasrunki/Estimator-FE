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
  }
}

export interface CategoryItemModel {
  id: string;
  name: string;
  _count: { items: number };
}
