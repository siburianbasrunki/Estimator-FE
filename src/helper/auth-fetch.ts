import { handleAuthExpired } from "./auth-expired";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function authFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ data: T; raw: Response }> {
  const token = localStorage.getItem("token");
  const headers = new Headers(init?.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, { ...init, headers });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
  }

  if (res.status === 401) {
    handleAuthExpired("expired");
    throw new AuthError("Unauthorized", 401);
  }

  if (!res.ok) {
    const msg = json?.error || `HTTP error! status: ${res.status}`;
    // beberapa BE kirim 400 dengan { error: "Invalid token" }
    if (
      typeof json?.error === "string" &&
      json.error.toLowerCase().includes("invalid token")
    ) {
      handleAuthExpired("invalid");
      throw new AuthError(json.error, res.status);
    }
    throw new Error(msg);
  }

  if (
    typeof json?.error === "string" &&
    json.error.toLowerCase().includes("invalid token")
  ) {
    handleAuthExpired("invalid");
    throw new AuthError(json.error, res.status);
  }

  return { data: json, raw: res };
}
