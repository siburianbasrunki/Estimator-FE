import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminAllWithItemsFlat, ImportHspSummary } from "../service/hsp";
import HspService from "../service/hsp";
import { useParams } from "react-router-dom";
import type { AhspDetailModel, ItemJobListResponse } from "../model/hsp";
import MasterService from "../service/master";
import { useNotify } from "../components/Notify/notify";

export const useImportHsp = () => {
  const toast = useNotify();
  return useMutation<ImportHspSummary, Error, File>({
    mutationFn: (file: File) => HspService.importHsp(file),
    onSuccess: (data) => {
      if (data.status === "success") {
        const cat = data.summary?.categories;
        const it = data.summary?.items;
        toast(
          `Import sukses. Kategori: +${cat?.created || 0} | Item: +${
            it?.created || 0
          } (update ${it?.updated || 0})`,
          "success"
        );
      } else {
        toast(data?.message || "Import HSP gagal", "error");
      }
    },
    onError: (err) => {
      toast(err.message || "Import HSP gagal", "error");
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
  const toast = useNotify();
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
      toast("Komponen disimpan", "success");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e) => toast(e.message || "Gagal menyimpan komponen", "error"),
  });
};

export const useUpdateAhspOverhead = () => {
  const toast = useNotify();
  const qc = useQueryClient();
  const { code } = useParams();
  return useMutation<void, Error, { code: string; overheadPercent: number }>({
    mutationFn: ({ code, overheadPercent }) =>
      HspService.updateAhspOverhead(code, overheadPercent),
    onSuccess: () => {
      toast("Overhead disimpan", "success");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e) => toast(e.message || "Gagal menyimpan overhead", "error"),
  });
};
export const useToggleHspOverride = () => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation({
    mutationFn: ({ kode, active }: { kode: string; active: boolean }) =>
      HspService.setHspOverrideActive(kode, active),
    onSuccess: (_, vars) => {
      toast(
        vars.active ? "Pakai versi saya (USER)" : "Kembali pakai Admin",
        "success"
      );
      qc.invalidateQueries({ queryKey: ["hspDetail", vars.kode] });
      qc.invalidateQueries({ queryKey: ["hsp"] });
    },
    onError: (e: any) => toast(e?.message || "Gagal mengganti sumber", "error"),
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
  const toast = useNotify();
  const { code } = useParams();
  return useMutation<void, Error, { itemId: string }>({
    mutationFn: ({ itemId }) => HspService.recomputeHsp(itemId),
    onSuccess: () => {
      toast("Recompute sukses", "success");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e) => toast(e.message || "Gagal recompute", "error"),
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
  const toast = useNotify();
  return useMutation({
    mutationFn: ({ code, payload }: any) =>
      HspService.createAhspComponent(code, payload),
    onSuccess: () => {
      toast("Komponen ditambahkan", "success");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e: any) =>
      toast(e?.message || "Gagal menambah komponen", "error"),
  });
};

export const useDeleteAhspComponent = () => {
  const qc = useQueryClient();
  const { code } = useParams();
  const toast = useNotify();
  return useMutation({
    mutationFn: ({ componentId }: { componentId: string }) =>
      HspService.deleteAhspComponent(componentId),
    onSuccess: () => {
      toast("Komponen dihapus", "success");
      qc.invalidateQueries({ queryKey: ["hspDetail", code] });
    },
    onError: (e: any) =>
      toast(e?.message || "Gagal menghapus komponen", "error"),
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation({
    mutationFn: (name: string) => HspService.createCategory(name),
    onSuccess: () => {
      toast("Kategori dibuat", "success");
      qc.invalidateQueries({ queryKey: ["categoryJob"] });
      qc.invalidateQueries({ queryKey: ["hsp"] });
    },
    onError: (e: any) => toast(e?.message || "Gagal membuat kategori", "error"),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      HspService.updateCategory(id, name),
    onSuccess: () => {
      toast("Kategori diperbarui", "success");
      qc.invalidateQueries({ queryKey: ["categoryJob"] });
      qc.invalidateQueries({ queryKey: ["hsp"] });
    },
    onError: (e: any) =>
      toast(e?.message || "Gagal memperbarui kategori", "error"),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation({
    mutationFn: (id: string) => HspService.deleteCategory(id),
    onSuccess: () => {
      toast("Kategori dihapus", "success");
      qc.invalidateQueries({ queryKey: ["categoryJob"] });
      qc.invalidateQueries({ queryKey: ["hsp"] });
    },
    onError: (e: any) =>
      toast(e?.message || "Gagal menghapus kategori", "error"),
  });
};

// Item CRUD hooks
export const useCreateHspItem = () => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation({
    mutationFn: (payload: {
      hspCategoryId: string;
      kode: string;
      deskripsi: string;
      satuan?: string;
      source?: "UUD" | "Sendiri";
    }) => HspService.createHspItem(payload),
    onSuccess: () => {
      toast("Item dibuat", "success");
      qc.invalidateQueries({ queryKey: ["hsp"] });
      qc.invalidateQueries({ queryKey: ["itemJob"] });
    },
    onError: (e: any) => toast(e?.message || "Gagal membuat item", "success"),
  });
};

export const useUpdateHspItem = () => {
  const qc = useQueryClient();
  const toast = useNotify();
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
      toast("Item diperbarui", "success");
      qc.invalidateQueries({ queryKey: ["hsp"] });
      qc.invalidateQueries({ queryKey: ["itemJob"] });
    },
    onError: (e: any) => toast(e?.message || "Gagal memperbarui item", "error"),
  });
};

export const useDeleteHspItem = () => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation({
    mutationFn: (kode: string) => HspService.deleteHspItemByKode(kode),
    onSuccess: () => {
      toast("Item dihapus", "success");
      qc.invalidateQueries({ queryKey: ["hsp"] });
      qc.invalidateQueries({ queryKey: ["itemJob"] });
    },
    onError: (e: any) => toast(e?.message || "Gagal menghapus item", "error"),
  });
};
