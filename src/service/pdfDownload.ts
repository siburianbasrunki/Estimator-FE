import { getEndpoints } from "../config/config";
import { sanitizeFileName, triggerBrowserDownload } from "../helper/download";

const PdfService = {
  async downloadPdfRAB(
    id: string,
    projectName?: string,
    logoFile?: File | null
  ): Promise<void> {
    const { estimation } = getEndpoints();

    let res: Response;
    if (logoFile) {
      const fd = new FormData();
      fd.append("logo", logoFile);
      res = await fetch(`${estimation}/${id}/download/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        } as any,
        body: fd,
      });
    } else {
      res = await fetch(`${estimation}/${id}/download/pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    }

    if (!res.ok) {
      let msg = `HTTP error! status: ${res.status}`;
      try {
        const j = await res.clone().json();
        msg = j?.error || msg;
      } catch {}
      throw new Error(msg);
    }
    const safe = sanitizeFileName(projectName || "estimation");
    const fallback = `RAB_${safe}.pdf`;
    await triggerBrowserDownload(res, fallback);
  },

  // === PDF "langsung hit" tanpa logo ===
  async downloadPdfVolume(id: string, projectName?: string): Promise<void> {
    const { exportPdf } = getEndpoints();
    const res = await fetch(`${exportPdf}/${id}/download/pdf/volume`, {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(`Gagal unduh PDF Volume (${res.status})`);
    const safe = sanitizeFileName(projectName || "estimation");
    await triggerBrowserDownload(res, `Volume_${safe}.pdf`);
  },

  async downloadPdfJobItem(id: string, projectName?: string): Promise<void> {
    const { exportPdf } = getEndpoints();
    const res = await fetch(`${exportPdf}/${id}/download/pdf/job-item`, {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(`Gagal unduh PDF Job Item (${res.status})`);
    const safe = sanitizeFileName(projectName || "estimation");
    await triggerBrowserDownload(res, `JobItem_${safe}.pdf`);
  },

  async downloadPdfKategori(id: string, projectName?: string): Promise<void> {
    const { exportPdf } = getEndpoints();
    const res = await fetch(`${exportPdf}/${id}/download/pdf/kategori`, {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(`Gagal unduh PDF Kategori (${res.status})`);
    const safe = sanitizeFileName(projectName || "estimation");
    await triggerBrowserDownload(res, `Kategori_${safe}.pdf`);
  },

  async downloadPdfAHSP(id: string, projectName?: string): Promise<void> {
    const { exportPdf } = getEndpoints();
    const res = await fetch(`${exportPdf}/${id}/download/pdf/ahsp`, {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(`Gagal unduh PDF AHSP (${res.status})`);
    const safe = sanitizeFileName(projectName || "estimation");
    await triggerBrowserDownload(res, `AHSP_${safe}.pdf`);
  },

  async downloadPdfMasterItem(id: string, projectName?: string): Promise<void> {
    const { exportPdf } = getEndpoints();
    const res = await fetch(`${exportPdf}/${id}/download/pdf/master-item`, {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(`Gagal unduh PDF Master Item (${res.status})`);
    const safe = sanitizeFileName(projectName || "estimation");
    await triggerBrowserDownload(res, `MasterItem_${safe}.pdf`);
  },

  // === Excel tetap seperti semula (pakai modal/logo opsional) ===
  async downloadExcel(
    id: string,
    projectName?: string,
    logoFile?: File | null
  ): Promise<void> {
    const { exportPdf } = getEndpoints();
    let res: Response;
    if (logoFile) {
      const fd = new FormData();
      fd.append("logo", logoFile);
      res = await fetch(`${exportPdf}/${id}/download/excel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        } as any,
        body: fd,
      });
    } else {
      res = await fetch(`${exportPdf}/${id}/download/excel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    }
    if (!res.ok) {
      let msg = `HTTP error! status: ${res.status}`;
      try {
        const j = await res.clone().json();
        msg = j?.error || msg;
      } catch {}
      throw new Error(msg);
    }
    const safe = sanitizeFileName(projectName || "estimation");
    await triggerBrowserDownload(res, `RAB_${safe}_estimation.xlsx`);
  },
};

export default PdfService;
