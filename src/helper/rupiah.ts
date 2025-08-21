export const formatIDR = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

export const fmtIDRPlain = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(isFinite(n) ? n : 0);

export const fmtIDRWithSymbol = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  }).format(isFinite(n) ? n : 0);

export const parseNumber = (s: string): number => {
  const t = (s ?? "").trim();
  if (t.includes(",")) {
    const clean = t.replace(/\./g, "").replace(/,/g, ".");
    const n = parseFloat(clean);
    return Number.isFinite(n) ? n : 0;
  }
  const clean = t.replace(/\s/g, "");
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
};

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
