export type MasterType = "LABOR" | "MATERIAL" | "EQUIPMENT" | "OTHER";

export interface MasterItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
  type: MasterType;
  hourlyRate?: number | null; // only for LABOR (optional)
  dailyRate?: number | null;  // only for LABOR (optional)
  notes? : string | null
  updatedAt?: string;
  _count?: { components: number };
}

export interface MasterListResponse {
  status: "success" | "error";
  data: MasterItem[];
  pagination: {
    skip: number;
    take: number;
    total: number;
  };
  meta: { type: MasterType };
}

export interface MasterDetailResponse {
  status: "success" | "error";
  data: MasterItem;
}

export interface MasterCreatePayload {
  code?: string;
  name: string;
  unit: string;
  price?: number;
  type: MasterType;
  hourlyRate?: number | null;
  dailyRate?: number | null;
  notes? : string | null
}

export interface MasterUpdatePayload {
  code?: string;
  name?: string;
  unit?: string;
  price?: number;
  type?: MasterType;
  hourlyRate?: number | null;
  dailyRate?: number | null;
  notes? : string | null
}
