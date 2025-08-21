import { getEndpoints } from "../config/config";
import { sanitizeFileName, triggerBrowserDownload } from "../helper/download";
import type { Estimation, EstimationCreateModel } from "../model/estimation";

const EstimationService = {
  async getEstimations(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ data: Estimation[]; pagination: any }> {
    const { estimation } = getEndpoints();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const res = await fetch(`${estimation}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json;
  },

  async getEstimationById(id: string): Promise<Estimation> {
    const { estimation } = getEndpoints();
    const res = await fetch(`${estimation}/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async createEstimation(
    estimation: EstimationCreateModel
  ): Promise<Estimation> {
    const { estimation: estimationUrl } = getEndpoints();
    const res = await fetch(`${estimationUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(estimation),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to create estimation");
    }
    const json = await res.json();
    return json.data;
  },

  async updateEstimation(
    id: string,
    estimation: Partial<EstimationCreateModel> & { status?: string }
  ): Promise<Estimation> {
    const { estimation: estimationUrl } = getEndpoints();
    const res = await fetch(`${estimationUrl}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(estimation),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to update estimation");
    }
    const json = await res.json();
    return json.data;
  },

  async deleteEstimation(id: string): Promise<void> {
    const { estimation: estimationUrl } = getEndpoints();
    const res = await fetch(`${estimationUrl}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to delete estimation");
    }
  },

  async getEstimationStats(): Promise<{
    total: number;
    draft: number;
    completed: number;
    published: number;
  }> {
    const { estimation } = getEndpoints();
    const res = await fetch(`${estimation}/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async downloadPdf(id: string, projectName?: string): Promise<void> {
    const { estimation } = getEndpoints();
    const res = await fetch(`${estimation}/${id}/download/pdf`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) {
      let msg = `HTTP error! status: ${res.status}`;
      try {
        const j = await res.clone().json();
        msg = j?.error || msg;
      } catch {}
      throw new Error(msg);
    }
    const safe = sanitizeFileName(projectName || "estimation");
    const fallback = `${safe}_estimation.pdf`;
    await triggerBrowserDownload(res, fallback);
  },

  async downloadExcel(id: string, projectName?: string): Promise<void> {
    const { estimation } = getEndpoints();
    const res = await fetch(`${estimation}/${id}/download/excel`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) {
      let msg = `HTTP error! status: ${res.status}`;
      try {
        const j = await res.clone().json();
        msg = j?.error || msg;
      } catch {}
      throw new Error(msg);
    }
    const safe = sanitizeFileName(projectName || "estimation");
    const fallback = `RAB_${safe}_estimation.xlsx`;
    await triggerBrowserDownload(res, fallback);
  },
};

export default EstimationService;
