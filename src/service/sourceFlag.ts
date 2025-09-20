import { getEndpoints } from "../config/config";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
export type SourceTag = {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
};

async function listSources(all = false): Promise<SourceTag[]> {
  const { hsp } = getEndpoints();
  const u = new URL(`${hsp}/sources`);
  if (all) u.searchParams.set("all", "1");
  const res = await fetch(u.toString(), { headers: authHeader() });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.error || `Fetch failed (HTTP ${res.status})`);
  return json.data as SourceTag[];
}

async function createSourceTag(payload: { code: string; label: string }) {
  const { hsp } = getEndpoints();
  const res = await fetch(`${hsp}/sources`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.error || `Create failed (HTTP ${res.status})`);
  return json.data as SourceTag;
}

async function updateSourceTag(
  id: string,
  payload: Partial<{ code: string; label: string; isActive: boolean }>
) {
  const { hsp } = getEndpoints();
  const res = await fetch(`${hsp}/sources/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.error || `Update failed (HTTP ${res.status})`);
  return json.data as SourceTag;
}

async function deleteSourceTag(id: string) {
  const { hsp } = getEndpoints();
  const res = await fetch(`${hsp}/sources/${id}`, {
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

const SourceFlagService = {
  listSources,
  createSourceTag,
  updateSourceTag,
  deleteSourceTag,
};
export default SourceFlagService;
