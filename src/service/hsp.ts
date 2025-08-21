import { getEndpoints } from "../config/config";
import type {
  CategoryItemModel,
  HspAllModel,
  ItemJobModel,
  AhspDetailModel,
} from "../model/hsp";
import type {
  MasterCreatePayload,
  MasterDetailResponse,
  MasterItem,
  MasterListResponse,
  MasterType,
  MasterUpdatePayload,
} from "../model/master";

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

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const HspService = {
  async importHsp(file: File): Promise<ImportHspSummary> {
    const { importHsp } = getEndpoints();
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(importHsp, {
      method: "POST",
      headers: authHeader(),
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
      headers: authHeader(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
    }
    return json.data as HspAllModel;
  },

  async getItemJob(): Promise<ItemJobModel[]> {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/items`, {
      headers: authHeader(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
    }
    return json.data as ItemJobModel[];
  },

  async getCategoryJob(): Promise<CategoryItemModel[]> {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/categories`, {
      headers: authHeader(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
    }
    return json.data as CategoryItemModel[];
  },

  // NOTE: return type diperbaiki ke detail AHSP
  async getAhspJob(code: string): Promise<AhspDetailModel> {
    const { hsp } = getEndpoints();
    // sesuaikan dengan backend kamu; di sini pakai /ahsp/:code
    const res = await fetch(`${hsp}/ahsp/${encodeURIComponent(code)}`, {
      headers: authHeader(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
    }
    return json.data as AhspDetailModel;
  },

  // Master item
  async listMaster(
    type: MasterType,
    params?: {
      q?: string;
      skip?: number;
      take?: number;
      orderBy?: "code" | "name" | "price";
      orderDir?: "asc" | "desc";
    }
  ): Promise<MasterListResponse> {
    const { hsp } = getEndpoints();
    const u = new URL(`${hsp}/master`);
    u.searchParams.set("type", type);
    if (params?.q) u.searchParams.set("q", params.q);
    if (typeof params?.skip === "number")
      u.searchParams.set("skip", String(params.skip));
    if (typeof params?.take === "number")
      u.searchParams.set("take", String(params.take));
    if (params?.orderBy) u.searchParams.set("orderBy", params.orderBy);
    if (params?.orderDir) u.searchParams.set("orderDir", params.orderDir);

    const res = await fetch(u.toString(), { headers: authHeader() });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
    return json as MasterListResponse;
  },

  async createMaster(payload: MasterCreatePayload): Promise<MasterItem> {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/master`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Create failed (HTTP ${res.status})`);
    return json.data as MasterItem;
  },

  async getMaster(id: string): Promise<MasterItem> {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/master/${id}`, { headers: authHeader() });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
    return (json as MasterDetailResponse).data;
  },

  async updateMaster(
    id: string,
    payload: MasterUpdatePayload,
    opts?: { recompute?: boolean }
  ): Promise<MasterItem> {
    const { hsp } = getEndpoints();
    const u = new URL(`${hsp}/master/${id}`);
    if (opts?.recompute) u.searchParams.set("recompute", "true");

    const res = await fetch(u.toString(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Update failed (HTTP ${res.status})`);
    return json.data as MasterItem;
  },

  async deleteMaster(id: string): Promise<void> {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/master/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    if (!res.ok) {
      let msg = "";
      try {
        msg = (await res.json())?.error;
      } catch {}
      throw new Error(msg || `Delete failed (HTTP ${res.status})`);
    }
  },
  // recipe
  async searchMaster(
    type: "LABOR" | "MATERIAL" | "EQUIPMENT" | "OTHER",
    q: string,
    page = 1,
    take = 10
  ) {
    const { hsp } = getEndpoints();
    const skip = (page - 1) * take;
    const url = `${hsp}/master?type=${type}&q=${encodeURIComponent(
      q
    )}&skip=${skip}&take=${take}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Failed (HTTP ${res.status})`);
    return json; // {status,data,pagination,meta}
  },

  async createAhspComponent(
    code: string,
    payload: {
      group: "LABOR" | "MATERIAL" | "EQUIPMENT" | "OTHER";
      masterItemId: string;
      coefficient?: number;
      priceOverride?: number | null;
      notes?: string;
    }
  ) {
    const { hsp } = getEndpoints();
    const res = await fetch(
      `${hsp}/items/by-kode/${encodeURIComponent(code)}/recipe/components`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Failed (HTTP ${res.status})`);
    return json.data;
  },

  async updateAhspComponent(
    componentId: string,
    payload: {
      coefficient?: number;
      priceOverride?: number | null;
      notes?: string;
    }
  ) {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/recipe/components/${componentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Failed (HTTP ${res.status})`);
    return json.data;
  },

  async deleteAhspComponent(componentId: string) {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/recipe/components/${componentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Failed (HTTP ${res.status})`);
    return json.data;
  },

  async updateAhspOverhead(code: string, overheadPercent: number) {
    const { hsp } = getEndpoints();
    const res = await fetch(
      `${hsp}/items/by-kode/${encodeURIComponent(code)}/recipe`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ overheadPercent }),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Failed (HTTP ${res.status})`);
    return json.data;
  },

  async recomputeHsp(itemId: string) {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/items/${itemId}/recompute`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Failed (HTTP ${res.status})`);
    return json.data;
  },
};

export default HspService;
