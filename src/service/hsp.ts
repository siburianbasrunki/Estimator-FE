import { getEndpoints } from "../config/config";
import type {
  CategoryItemModel,
  HspAllModel,
  AhspDetailModel,
  ItemJobListResponse,
} from "../model/hsp";
import type {
  MasterCreatePayload,
  MasterDetailResponse,
  MasterItem,
  MasterListResponse,
  MasterType,
  MasterUpdatePayload,
} from "../model/master";

export type ImportMasterCounts = {
  created_global: number;
  updated_global: number;
  created_user: number;
  updated_user: number;
  updated_user_price: number;
};

export type ImportMasterOptions = {
  useHargaFile: boolean;
  lockExistingPrice: boolean;
  preferDaily?: boolean;
};
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
export type AdminAllWithItemsFlat = {
  categories: Array<{ id: string; name: string }>;
  items: Array<{
    kode: string;
    deskripsi: string;
    satuan?: string;
    harga?: number;
    hspCategoryId?: string;
    categoryName?: string;
  }>;
};
async function importMasterMaterials(
  file: File,
  opts?: { useHargaFile?: boolean; lockExistingPrice?: boolean }
): Promise<ImportMasterSummary> {
  const { hsp } = getEndpoints();
  const form = new FormData();
  form.append("file", file);

  const u = new URL(`${hsp}/master/import/materials`);
  if (opts?.useHargaFile !== undefined)
    u.searchParams.set("useHargaFile", String(!!opts.useHargaFile));
  if (opts?.lockExistingPrice !== undefined)
    u.searchParams.set("lockExistingPrice", String(!!opts.lockExistingPrice));

  const res = await fetch(u.toString(), {
    method: "POST",
    headers: authHeader(),
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || `Import failed (HTTP ${res.status})`);
  }
  return json as ImportMasterSummary;
}
export type ImportMasterSummary = {
  status: "success" | "error";
  message?: string;
  summary?: {
    options: ImportMasterOptions;
    counts: ImportMasterCounts;
    errors: Array<{ key?: string; code?: string; reason: string }>;
  };
  error?: string;
  detail?: string;
};

async function importMasterLabor(
  file: File,
  opts?: {
    useHargaFile?: boolean;
    lockExistingPrice?: boolean;
    preferDaily?: boolean;
  }
): Promise<ImportMasterSummary> {
  const { hsp } = getEndpoints();
  const form = new FormData();
  form.append("file", file);

  const u = new URL(`${hsp}/master/import/labor`);
  if (opts?.useHargaFile !== undefined)
    u.searchParams.set("useHargaFile", String(!!opts.useHargaFile));
  if (opts?.lockExistingPrice !== undefined)
    u.searchParams.set("lockExistingPrice", String(!!opts.lockExistingPrice));
  if (opts?.preferDaily !== undefined)
    u.searchParams.set("preferDaily", String(!!opts.preferDaily));

  const res = await fetch(u.toString(), {
    method: "POST",
    headers: authHeader(),
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || `Import failed (HTTP ${res.status})`);
  }
  return json as ImportMasterSummary;
}
const HspService = {
  importMasterMaterials,
  importMasterLabor,
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

  async getItemJob(params?: {
    q?: string;
    skip?: number;
    take?: number;
    orderBy?: "kode" | "harga";
    orderDir?: "asc" | "desc";
    categoryId?: string;
    kode?: string; // exact
  }): Promise<ItemJobListResponse> {
    const { hsp } = getEndpoints();
    const u = new URL(`${hsp}/items`);
    if (params?.q) u.searchParams.set("q", params.q);
    if (typeof params?.skip === "number")
      u.searchParams.set("skip", String(params.skip));
    if (typeof params?.take === "number")
      u.searchParams.set("take", String(params.take));
    if (params?.orderBy) u.searchParams.set("orderBy", params.orderBy);
    if (params?.orderDir) u.searchParams.set("orderDir", params.orderDir);
    if (params?.categoryId) u.searchParams.set("categoryId", params.categoryId);
    if (params?.kode) u.searchParams.set("kode", params.kode);

    const res = await fetch(u.toString(), { headers: authHeader() });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
    return json as ItemJobListResponse;
  },
  async getAdminAllWithItemsFlat(params?: {
    scope?: "ALL" | "ADMIN" | "USER";
    itemOrderBy?: "kode" | "harga";
    itemOrderDir?: "asc" | "desc";
  }): Promise<AdminAllWithItemsFlat> {
    const { hsp } = getEndpoints();
    const u = new URL(`${hsp}/admin/all-with-items`);
    u.searchParams.set("flat", "1");
    u.searchParams.set("scope", params?.scope ?? "ALL");
    u.searchParams.set("itemOrderBy", params?.itemOrderBy ?? "kode");
    u.searchParams.set("itemOrderDir", params?.itemOrderDir ?? "asc");

    const res = await fetch(u.toString(), { headers: authHeader() });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
    }

    const raw = json.data ?? json;

    // 1) Sudah sesuai { categories, items } -> normalisasi kecil & return
    if (Array.isArray(raw?.categories) && Array.isArray(raw?.items)) {
      const items = raw.items.map(normalizeItem);
      const categories = (raw.categories || []).map((c: any) => ({
        id: c.id ?? c.categoryId ?? `name:${c.name}`,
        name: c.name,
      }));
      return { categories, items };
    }

    // 2) Sudah flat array -> bentuk categories dari item
    if (Array.isArray(raw)) {
      const items = raw.map(normalizeItem);
      const cats = new Map<string, { id: string; name: string }>();
      for (const it of items) {
        const name = it.categoryName ?? "Tanpa Kategori";
        const id = it.hspCategoryId ?? `name:${name}`;
        if (!cats.has(name)) cats.set(name, { id, name });
      }
      return { categories: Array.from(cats.values()), items };
    }

    // 3) GROUPED object -> flatten + dedupe by kode (prioritas USER)
    if (raw && typeof raw === "object") {
      const categories: Array<{ id: string; name: string }> = [];
      const itemsRaw: any[] = [];

      for (const [catName, arr] of Object.entries(raw)) {
        const list = Array.isArray(arr) ? (arr as any[]) : [];
        const first = list[0];
        const catId =
          first?.hspCategoryId ?? first?.categoryId ?? `name:${catName}`;
        categories.push({ id: catId, name: catName });
        for (const it of list) itemsRaw.push(it);
      }

      const items = itemsRaw.map(normalizeItem);
      return { categories, items };
    }

    // fallback
    return { categories: [], items: [] };

    function normalizeItem(it: any) {
      return {
        id: it.id,
        kode: it.kode,
        deskripsi: it.deskripsi,
        satuan: it.satuan ?? "",
        harga: Number(it.harga ?? 0),
        hspCategoryId: it.hspCategoryId ?? it.categoryId,
        categoryName: it.categoryName,
        scope: it.scope,
        ownerUserId: it.ownerUserId,
        source: it.source,
      };
    }
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
    const url = `${hsp}/ahsp/${encodeURIComponent(code)}`;
    const res = await fetch(url, { headers: authHeader() });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
    return json.data as AhspDetailModel;
  },
  async setHspOverrideActive(kode: string, active: boolean) {
    const { hsp } = getEndpoints();
    const url = `${hsp}/items/by-kode/${encodeURIComponent(
      kode
    )}/override/active`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ active }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Failed (HTTP ${res.status})`);
    return json.data as { kode: string; active: boolean };
  },
  async setMasterOverrideActive(code: string, active: boolean) {
    const { hsp } = getEndpoints();
    const url = `${hsp}/master/by-code/${encodeURIComponent(
      code
    )}/override/active`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ active }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Failed (HTTP ${res.status})`);
    return json.data as { code: string; active: boolean };
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
  async updateMasterByCode(
    code: string,
    payload: MasterUpdatePayload
  ): Promise<MasterItem> {
    const { hsp } = getEndpoints();
    const res = await fetch(
      `${hsp}/master/by-code/${encodeURIComponent(code)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Update failed (HTTP ${res.status})`);
    return json.data as MasterItem;
  },

  async deleteMasterByCode(code: string): Promise<void> {
    const { hsp } = getEndpoints();
    const res = await fetch(
      `${hsp}/master/by-code/${encodeURIComponent(code)}`,
      {
        method: "DELETE",
        headers: authHeader(),
      }
    );
    if (!res.ok) {
      let msg = "";
      try {
        msg = (await res.json())?.error;
      } catch {}
      throw new Error(msg || `Delete failed (HTTP ${res.status})`);
    }
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
      useAdminPrice?: boolean;
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
      // NEW
      useAdminPrice?: boolean;
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
  async createCategory(name: string) {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Create failed (HTTP ${res.status})`);
    return json.data as { id: string; name: string };
  },

  async updateCategory(id: string, name: string) {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Update failed (HTTP ${res.status})`);
    return json.data as { id: string; name: string };
  },

  async deleteCategory(id: string) {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/categories/${id}`, {
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
  async createHspItem(payload: {
    hspCategoryId: string;
    kode: string;
    deskripsi: string;
    satuan?: string;
    source?: "UUD" | "Sendiri";
  }) {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Create failed (HTTP ${res.status})`);
    return json.data;
  },

  async updateHspItem(
    id: string,
    payload: {
      hspCategoryId?: string;
      kode?: string;
      deskripsi?: string;
      satuan?: string;
    }
  ) {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(payload), // harga tidak dikirim dari UI
    });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Update failed (HTTP ${res.status})`);
    return json.data;
  },

  async deleteHspItem(id: string) {
    const { hsp } = getEndpoints();
    const res = await fetch(`${hsp}/items/${id}`, {
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
  async updateHspItemByKode(
    kode: string,
    payload: {
      hspCategoryId?: string;
      kode?: string;
      deskripsi?: string;
      satuan?: string;
      source?: "UUD" | "Sendiri";
    }
  ) {
    const { hsp } = getEndpoints();
    const res = await fetch(
      `${hsp}/items/by-kode/${encodeURIComponent(kode)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok)
      throw new Error(json?.error || `Update failed (HTTP ${res.status})`);
    return json.data;
  },

  async deleteHspItemByKode(kode: string) {
    const { hsp } = getEndpoints();
    const res = await fetch(
      `${hsp}/items/by-kode/${encodeURIComponent(kode)}`,
      {
        method: "DELETE",
        headers: authHeader(),
      }
    );
    if (!res.ok) {
      let msg = "";
      try {
        msg = (await res.json())?.error;
      } catch {}
      throw new Error(msg || `Delete failed (HTTP ${res.status})`);
    }
  },
};

export default HspService;
