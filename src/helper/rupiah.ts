export const formatIDR = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

