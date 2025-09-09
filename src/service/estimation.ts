import { getEndpoints } from "../config/config";
import { sanitizeFileName, triggerBrowserDownload } from "../helper/download";
import type { Estimation, EstimationCreateModel } from "../model/estimation";

function buildEstimationFormData(
  data: Partial<EstimationCreateModel> & { status?: string },
  imageFile?: File | null
) {
  const fd = new FormData();

  // field primitif
  if (data.projectName != null)
    fd.append("projectName", String(data.projectName));
  if (data.owner != null) fd.append("owner", String(data.owner));
  if (data.ppn != null) fd.append("ppn", String(data.ppn));
  if (data.notes != null) fd.append("notes", String(data.notes));
  if ((data as any).status != null)
    fd.append("status", String((data as any).status));

  // field kompleks (stringify)
  if (data.customFields != null) {
    fd.append("customFields", JSON.stringify(data.customFields));
  }
  if (data.estimationItem != null) {
    fd.append("estimationItem", JSON.stringify(data.estimationItem));
  }

  // file image (opsional)
  if (imageFile) {
    fd.append("image", imageFile);
  }
  return fd;
}
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

  async createEstimation(payload: {
    data: EstimationCreateModel;
    imageFile?: File | null;
  }): Promise<Estimation> {
    const { estimation: estimationUrl } = getEndpoints();
    const fd = buildEstimationFormData(payload.data, payload.imageFile);

    const res = await fetch(`${estimationUrl}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      } as any,
      body: fd,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Failed to create estimation (${res.status})`
      );
    }
    const json = await res.json();
    return json.data;
  },

  async updateEstimation(
    id: string,
    payload: {
      data: Partial<EstimationCreateModel> & { status?: string };
      imageFile?: File | null;
    }
  ): Promise<Estimation> {
    const { estimation: estimationUrl } = getEndpoints();
    const fd = buildEstimationFormData(payload.data, payload.imageFile);

    const res = await fetch(`${estimationUrl}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      } as any,
      body: fd,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Failed to update estimation (${res.status})`
      );
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

  async downloadPdf(
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
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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
  async downloadExcel(
    id: string,
    projectName?: string,
    logoFile?: File | null
  ): Promise<void> {
    const { estimation } = getEndpoints();

    let res: Response;

    if (logoFile) {
      const fd = new FormData();
      fd.append("logo", logoFile);

      res = await fetch(`${estimation}/${id}/download/excel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          // NOTE: jangan set Content-Type manual untuk FormData
        } as any,
        body: fd,
      });
    } else {
      // tetap dukung tanpa logo via POST tanpa body
      res = await fetch(`${estimation}/${id}/download/excel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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
    const fallback = `RAB_${safe}_estimation.xlsx`;
    await triggerBrowserDownload(res, fallback);
  },
};

export default EstimationService;
