import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { AdminAllWithItemsFlat, ImportHspSummary } from "../service/hsp";
import HspService from "../service/hsp";
import { useParams } from "react-router-dom";
import type { AhspDetailModel, ItemJobListResponse } from "../model/hsp";
import MasterService from "../service/master";

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

export const useGetItemJob = (params: {
  q?: string;
  skip: number;
  take: number;
  orderBy?: "kode" | "harga";
  orderDir?: "asc" | "desc";
}) => {
  return useQuery<ItemJobListResponse>({
    queryKey: ["itemJob", params],
    queryFn: () => HspService.getItemJob(params),
  });
};

export const useGetCategoryJob = () => {
  return useQuery({
    queryKey: ["categoryJob"],
    queryFn: () => HspService.getCategoryJob(),
  });
};
export const useGetAdminAllWithItemsFlat = () => {
  return useQuery<AdminAllWithItemsFlat>({
    queryKey: ["adminAllWithItemsFlat"],
    queryFn: () =>
      HspService.getAdminAllWithItemsFlat({
        scope: "ALL",
        itemOrderBy: "kode",
        itemOrderDir: "asc",
      }),
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
    {
      componentId: string;
      coefficient?: number;
      priceOverride?: number | null;
      // NEW
      useAdminPrice?: boolean;
    }
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
export const useToggleHspOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kode, active }: { kode: string; active: boolean }) =>
      HspService.setHspOverrideActive(kode, active),
    onSuccess: (_, vars) => {
      toast.success(
        vars.active ? "Pakai versi saya (USER)" : "Kembali pakai Admin"
      );
      qc.invalidateQueries({ queryKey: ["hspDetail", vars.kode] });
      qc.invalidateQueries({ queryKey: ["hsp"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal mengganti sumber"),
  });
};
export const useToggleMasterOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, active }: { code: string; active: boolean }) =>
      MasterService.setMasterOverrideActive(code, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master"] }),
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
    queryFn: () => MasterService.searchMaster(type, q, page, take),
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

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => HspService.createCategory(name),
    onSuccess: () => {
      toast.success("Kategori dibuat");
      qc.invalidateQueries({ queryKey: ["categoryJob"] });
      qc.invalidateQueries({ queryKey: ["hsp"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal membuat kategori"),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      HspService.updateCategory(id, name),
    onSuccess: () => {
      toast.success("Kategori diperbarui");
      qc.invalidateQueries({ queryKey: ["categoryJob"] });
      qc.invalidateQueries({ queryKey: ["hsp"] });
    },
    onError: (e: any) =>
      toast.error(e?.message || "Gagal memperbarui kategori"),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => HspService.deleteCategory(id),
    onSuccess: () => {
      toast.success("Kategori dihapus");
      qc.invalidateQueries({ queryKey: ["categoryJob"] });
      qc.invalidateQueries({ queryKey: ["hsp"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus kategori"),
  });
};

// Item CRUD hooks
export const useCreateHspItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      hspCategoryId: string;
      kode: string;
      deskripsi: string;
      satuan?: string;
      source?: "UUD" | "Sendiri";
    }) => HspService.createHspItem(payload),
    onSuccess: () => {
      toast.success("Item dibuat");
      qc.invalidateQueries({ queryKey: ["hsp"] });
      qc.invalidateQueries({ queryKey: ["itemJob"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal membuat item"),
  });
};

export const useUpdateHspItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      kode,
      payload,
    }: {
      kode: string;
      payload: {
        hspCategoryId?: string;
        kode?: string;
        deskripsi?: string;
        satuan?: string;
        source?: "UUD" | "Sendiri";
      };
    }) => HspService.updateHspItemByKode(kode, payload),
    onSuccess: () => {
      toast.success("Item diperbarui");
      qc.invalidateQueries({ queryKey: ["hsp"] });
      qc.invalidateQueries({ queryKey: ["itemJob"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal memperbarui item"),
  });
};

export const useDeleteHspItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kode: string) => HspService.deleteHspItemByKode(kode),
    onSuccess: () => {
      toast.success("Item dihapus");
      qc.invalidateQueries({ queryKey: ["hsp"] });
      qc.invalidateQueries({ queryKey: ["itemJob"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus item"),
  });
};
