import { getEndpoints } from "../config/config";
import type {
  CategoryItemModel,
  HspAllModel,
  ItemJobModel,
} from "../model/hsp";
export type ImportHspSummary = {
  status: "success" | "error";
  message?: string;
  summary?: {
    categories: { total: number; created: number; updated: number };
    items: { created: number; updated: number };
    errors: Array<{ kode?: string; reason: string }>;
  };
  error?: string;
  detail?: string;
};

const HspService = {
  async importHsp(file: File): Promise<ImportHspSummary> {
    const { importHsp } = getEndpoints();
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(importHsp, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: form,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Import failed (HTTP ${res.status})`);
    }
    return json as ImportHspSummary;
  },

  async getAllHsp(): Promise<HspAllModel> {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/with-items`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Import failed (HTTP ${res.status})`);
    }
    return json.data;
  },

  async getItemJob(): Promise<ItemJobModel[]> {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/items`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Import failed (HTTP ${res.status})`);
    }
    return json.data;
  },
  async getCategoryJob(): Promise<CategoryItemModel[]> {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/categories`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Import failed (HTTP ${res.status})`);
    }
    return json.data;
  },
};

export default HspService;
