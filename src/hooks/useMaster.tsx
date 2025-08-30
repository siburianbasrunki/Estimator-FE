import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import HspService from "../service/hsp";
import type {
  MasterCreatePayload,
  MasterItem,
  MasterType,
  MasterUpdatePayload,
} from "../model/master";

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
      const res = await HspService.listMaster(type, {
        q,
        skip,
        take,
        orderBy,
        orderDir,
      });
      return res;
    },
    // keepPreviousData: true,
  });
};

export const useCreateMaster = (type: MasterType) => {
  const qc = useQueryClient();
  return useMutation<MasterItem, Error, MasterCreatePayload>({
    mutationFn: (payload) => HspService.createMaster(payload),
    onSuccess: () => {
      toast.success("Data berhasil dibuat");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast.error(e.message || "Gagal membuat data"),
  });
};

export const useUpdateMaster = (type: MasterType) => {
  const qc = useQueryClient();
  return useMutation<
    MasterItem,
    Error,
    { id: string; payload: MasterUpdatePayload; recompute?: boolean }
  >({
    mutationFn: ({ id, payload, recompute }) =>
      HspService.updateMaster(id, payload, { recompute }),
    onSuccess: () => {
      toast.success("Data berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast.error(e.message || "Gagal memperbarui data"),
  });
};
export const useUpdateMasterByCode = (type: MasterType) => {
  const qc = useQueryClient();
  return useMutation<
    MasterItem,
    Error,
    { code: string; payload: MasterUpdatePayload }
  >({
    mutationFn: ({ code, payload }) =>
      HspService.updateMasterByCode(code, payload),
    onSuccess: () => {
      toast.success("Data berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast.error(e.message || "Gagal memperbarui data"),
  });
};

export const useDeleteMasterByCode = (type: MasterType) => {
  const qc = useQueryClient();
  return useMutation<void, Error, { code: string }>({
    mutationFn: ({ code }) => HspService.deleteMasterByCode(code),
    onSuccess: () => {
      toast.success("Data berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast.error(e.message || "Gagal menghapus data"),
  });
};
export const useDeleteMaster = (type: MasterType) => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => HspService.deleteMaster(id),
    onSuccess: () => {
      toast.success("Data berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["master", type] });
    },
    onError: (e) => toast.error(e.message || "Gagal menghapus data"),
  });
};
