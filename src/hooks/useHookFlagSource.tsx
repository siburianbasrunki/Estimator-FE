import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SourceFlagService from "../service/sourceFlag";
import toast from "react-hot-toast";

export const useGetSources = (all = false) => {
  return useQuery({
    queryKey: ["sources", all],
    queryFn: () => SourceFlagService.listSources(all),
    staleTime: 60_000,
  });
};
export const useCreateSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { code: string; label: string }) =>
      SourceFlagService.createSourceTag(p),
    onSuccess: () => {
      toast.success("Sumber dibuat");
      qc.invalidateQueries({ queryKey: ["sources"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal membuat sumber"),
  });
};
export const useUpdateSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<{ code: string; label: string; isActive: boolean }>;
    }) => SourceFlagService.updateSourceTag(id, payload),
    onSuccess: () => {
      toast.success("Sumber diperbarui");
      qc.invalidateQueries({ queryKey: ["sources"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal memperbarui sumber"),
  });
};
export const useDeleteSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SourceFlagService.deleteSourceTag(id),
    onSuccess: () => {
      toast.success("Sumber dihapus");
      qc.invalidateQueries({ queryKey: ["sources"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus sumber"),
  });
};
