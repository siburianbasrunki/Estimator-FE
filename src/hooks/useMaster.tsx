import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MasterCreatePayload,
  MasterItem,
  MasterType,
  MasterUpdatePayload,
} from "../model/master";
import type { ImportMasterSummary } from "../service/master";
import MasterService from "../service/master";
import { useNotify } from "../components/Notify/notify";

export const useImportMaster = (type: MasterType) => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation<
    ImportMasterSummary,
    Error,
    {
      file: File;
      useHargaFile?: boolean;
      lockExistingPrice?: boolean;
      preferDaily?: boolean; // dipakai jika LABOR
    }
  >({
    mutationFn: ({
      file,
      useHargaFile = true,
      lockExistingPrice = true,
      preferDaily = true,
    }) => {
      if (type === "MATERIAL") {
        return MasterService.importMasterMaterials(file, {
          useHargaFile,
          lockExistingPrice,
        });
      }
      if (type === "LABOR") {
        return MasterService.importMasterLabor(file, {
          useHargaFile,
          lockExistingPrice,
          preferDaily,
        });
      }
      throw new Error("Import hanya tersedia untuk MATERIAL & LABOR");
    },
    onSuccess: (res) => {
      toast(res?.message || "Import selesai", "success");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast(e.message || "Gagal import", "error"),
  });
};

export const useListMaster = (
  type: MasterType,
  params: {
    q?: string;
    page?: number;
    pageSize?: number;
    orderBy?: "code" | "name" | "price";
    orderDir?: "asc" | "desc";
  }
) => {
  const {
    q,
    page = 1,
    pageSize = 20,
    orderBy = "code",
    orderDir = "asc",
  } = params;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return useQuery({
    queryKey: ["master", type, q, page, pageSize, orderBy, orderDir],
    queryFn: async () => {
      const res = await MasterService.listMaster(type, {
        q,
        skip,
        take,
        orderBy,
        orderDir,
      });
      return res;
    },
    staleTime: 5 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateMaster = (type: MasterType) => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation<MasterItem, Error, MasterCreatePayload>({
    mutationFn: (payload) => MasterService.createMaster(payload),
    onSuccess: () => {
      toast("Data berhasil dibuat", "success");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast(e.message || "Gagal membuat data", "error"),
  });
};

export const useUpdateMaster = (type: MasterType) => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation<
    MasterItem,
    Error,
    { id: string; payload: MasterUpdatePayload; recompute?: boolean }
  >({
    mutationFn: ({ id, payload, recompute }) =>
      MasterService.updateMaster(id, payload, { recompute }),
    onSuccess: () => {
      toast("Data berhasil diperbarui", "success");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast(e.message || "Gagal memperbarui data", "error"),
  });
};

export const useUpdateMasterByCode = (type: MasterType) => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation<
    MasterItem,
    Error,
    { code: string; payload: MasterUpdatePayload }
  >({
    mutationFn: ({ code, payload }) =>
      MasterService.updateMasterByCode(code, payload),
    onSuccess: () => {
      toast("Data berhasil diperbarui", "success");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast(e.message || "Gagal memperbarui data", "error"),
  });
};

export const useDeleteMasterByCode = (type: MasterType) => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation<void, Error, { code: string }>({
    mutationFn: ({ code }) => MasterService.deleteMasterByCode(code),
    onSuccess: () => {
      toast("Data berhasil dihapus", "success");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast(e.message || "Gagal menghapus data", "error"),
  });
};

export const useDeleteMaster = (type: MasterType) => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => MasterService.deleteMaster(id),
    onSuccess: () => {
      toast("Data berhasil dihapus", "success");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast(e.message || "Gagal menghapus data", "error"),
  });
};
