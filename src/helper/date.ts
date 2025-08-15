// date.ts
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);

  // Format: 13 Agustus 2025, 16:21 WIB
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    timeZoneName: "short",
  });
};

export const formatDateOnly = (dateString: string): string => {
  const date = new Date(dateString);

  // Format: 13 Agustus 2025
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
};

export const formatTimeOnly = (dateString: string): string => {
  const date = new Date(dateString);

  // Format: 16:21
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
};


export const formatDateTimeID = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(d);
};
