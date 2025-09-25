import { getEndpoints } from "../config/config";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export type Unit = {
  id: string;
  code: string;
  label: string;
  createdAt: string;
  updatedAt: string;
};

async function listUnits(q = ""): Promise<Unit[]> {
  const { hsp } = getEndpoints();
  const u = new URL(`${hsp}/units`);
  if (q?.trim()) u.searchParams.set("q", q.trim());
  const res = await fetch(u.toString(), { headers: authHeader() });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
  return json.data as Unit[];
}

async function createUnit(payload: { code: string; label: string }) {
  const { hsp } = getEndpoints();
  const res = await fetch(`${hsp}/units`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.error || `Create failed (HTTP ${res.status})`);
  return json.data as Unit;
}

async function updateUnit(
  id: string,
  payload: Partial<{ code: string; label: string }>
) {
  const { hsp } = getEndpoints();
  const res = await fetch(`${hsp}/units/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.error || `Update failed (HTTP ${res.status})`);
  return json.data as Unit;
}

async function deleteUnit(id: string) {
  const { hsp } = getEndpoints();
  const res = await fetch(`${hsp}/units/${id}`, {
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
}

const UnitService = {
  listUnits,
  createUnit,
  updateUnit,
  deleteUnit,
};
export default UnitService;
export type { Unit as UnitType };
