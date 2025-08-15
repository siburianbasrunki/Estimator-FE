export function sanitizeFileName(name: string) {
  return name.replace(/[^\w\d-_]+/g, "_");
}

export function parseFilenameFromContentDisposition(header?: string | null) {
  if (!header) return null;
  // Contoh: attachment; filename="Project_X_estimation.pdf"
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header);
  return match ? decodeURIComponent(match[1]) : null;
}


export async function triggerBrowserDownload(
  res: Response,
  fallbackName: string
): Promise<void> {
  const blob = await res.blob();
  // Ambil nama file dari header kalau di-expose
  const cd = res.headers.get("Content-Disposition");
  const headerName = parseFilenameFromContentDisposition(cd);
  const fileName = headerName || fallbackName;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}