export function handleAuthExpired(reason: "invalid" | "expired" = "expired") {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {}
  const current = window.location.pathname + window.location.search + window.location.hash;
  const isOnLogin = window.location.pathname.startsWith("/login");
  if (!isOnLogin) {
    const params = new URLSearchParams({
      from: current,
      reason,
    });
    window.location.replace(`/login?${params.toString()}`);
  }
}