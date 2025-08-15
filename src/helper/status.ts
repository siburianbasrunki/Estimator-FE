
export const statusBadgeClass = (raw?: string) => {
  const s = (raw || "").toLowerCase();
  if (["done", "complete", "completed", "complated"].some((k) => s.includes(k)))
    return "bg-blue-600 text-white border border-blue-600";
  if (["reject", "cancel"].some((k) => s.includes(k)))
    return "bg-red-100 text-red-800 border border-red-300";
  if (["draft"].some((k) => s.includes(k)))
    return "bg-blue-100 text-blue-800 border border-blue-300";
  if (["pending", "hold"].some((k) => s.includes(k)))
    return "bg-amber-100 text-amber-800 border border-amber-300";
  return "bg-blue-100 text-blue-800 border border-blue-300";
};
