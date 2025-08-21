import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ImportHspSummary } from "../service/hsp";
import HspService from "../service/hsp";
import { useParams } from "react-router-dom";
import type { AhspDetailModel } from "../model/hsp";

export const useImportHsp = () => {
  return useMutation<ImportHspSummary, Error, File>({
    mutationFn: (file: File) => HspService.importHsp(file),
    onSuccess: (data) => {
      if (data.status === "success") {
        const cat = data.summary?.categories;
        const it = data.summary?.items;
        toast.success(
          `Import sukses. Kategori: +${cat?.created || 0} | Item: +${
            it?.created || 0
          } (update ${it?.updated || 0})`
        );
      } else {
        toast.error(data?.message || "Import HSP gagal");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Import HSP gagal");
    },
  });
};

export const useGetAllHsp = () => {
  return useQuery({
    queryKey: ["hsp"],
    queryFn: () => HspService.getAllHsp(),
  });
};

export const useGetItemJob = () => {
  return useQuery({
    queryKey: ["itemJob"],
    queryFn: () => HspService.getItemJob(),
  });
};

export const useGetCategoryJob = () => {
  return useQuery({
    queryKey: ["categoryJob"],
    queryFn: () => HspService.getCategoryJob(),
  });
};

export const useHspDetail = () => {
  const { code } = useParams();
  return useQuery<AhspDetailModel>({
    queryKey: ["hspDetail", code],
    queryFn: () => HspService.getAhspJob(code || ""),
    enabled: !!code,
  });
};

// ====== Mutations ======
export const useUpdateAhspComponent = () => {
  const qc = useQueryClient();
  const { code } = useParams();
  return useMutation<
    void,
    Error,
    { componentId: string; coefficient?: number; priceOverride?: number | null }
  >({
    mutationFn: ({ componentId, ...payload }) =>
      HspService.updateAhspComponent(componentId, payload),
    onSuccess: () => {
      toast.success("Komponen disimpan");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e) => toast.error(e.message || "Gagal menyimpan komponen"),
  });
};

export const useUpdateAhspOverhead = () => {
  const qc = useQueryClient();
  const { code } = useParams();
  return useMutation<void, Error, { code: string; overheadPercent: number }>({
    mutationFn: ({ code, overheadPercent }) =>
      HspService.updateAhspOverhead(code, overheadPercent),
    onSuccess: () => {
      toast.success("Overhead disimpan");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e) => toast.error(e.message || "Gagal menyimpan overhead"),
  });
};

export const useRecomputeHsp = () => {
  const qc = useQueryClient();
  const { code } = useParams();
  return useMutation<void, Error, { itemId: string }>({
    mutationFn: ({ itemId }) => HspService.recomputeHsp(itemId),
    onSuccess: () => {
      toast.success("Recompute sukses");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e) => toast.error(e.message || "Gagal recompute"),
  });
};

export const useSearchMaster = ({
  type,
  q,
  page = 1,
  take = 10,
}: {
  type: "LABOR" | "MATERIAL" | "EQUIPMENT" | "OTHER";
  q: string;
  page?: number;
  take?: number;
}) => {
  return useQuery({
    queryKey: ["master", type, q, page, take],
    queryFn: () => HspService.searchMaster(type, q, page, take),
  });
};

export const useCreateAhspComponent = () => {
  const qc = useQueryClient();
  const { code } = useParams();
  return useMutation({
    mutationFn: ({ code, payload }: any) =>
      HspService.createAhspComponent(code, payload),
    onSuccess: () => {
      toast.success("Komponen ditambahkan");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menambah komponen"),
  });
};

export const useDeleteAhspComponent = () => {
  const qc = useQueryClient();
  const { code } = useParams();
  return useMutation({
    mutationFn: ({ componentId }: { componentId: string }) =>
      HspService.deleteAhspComponent(componentId),
    onSuccess: () => {
      toast.success("Komponen dihapus");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus komponen"),
  });
};
