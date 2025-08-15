export interface Estimation {
  id: string;
  projectName: string;
  projectOwner: string;
  ppn: number;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: Author;
  customFields: CustomField[];
  items: EstimationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  }
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
}



export interface EstimationCreateModel {
  projectName: string;
  owner: string;
  ppn: string;
  notes: string;
  customFields: Record<string, string>;
  estimationItem: Array<{
    title: string;
    item: Array<{
      kode: string;
      nama: string;
      satuan: string;
      harga: number;
      volume: number;
      hargaTotal: number;
    }>;
  }>;
}