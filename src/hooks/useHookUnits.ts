import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import UnitService, { type Unit } from "../service/units";
import toast from "react-hot-toast";

export const useGetUnits = (q: string) => {
  return useQuery({
    queryKey: ["units", q],
    queryFn: () => UnitService.listUnits(q),
    staleTime: 60_000,
  });
};

export const useCreateUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { code: string; label: string }) =>
      UnitService.createUnit(p),
    onSuccess: () => {
      toast.success("Unit dibuat");
      qc.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal membuat unit"),
  });
};

export const useUpdateUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Pick<Unit, "code" | "label">>;
    }) => UnitService.updateUnit(id, payload),
    onSuccess: () => {
      toast.success("Unit diperbarui");
      qc.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal memperbarui unit"),
  });
};

export const useDeleteUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => UnitService.deleteUnit(id),
    onSuccess: () => {
      toast.success("Unit dihapus");
      qc.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus unit"),
  });
};
