import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import UnitService, { type Unit } from "../service/units";
import { useNotify } from "../components/Notify/notify";

export const useGetUnits = (q: string) => {
  return useQuery({
    queryKey: ["units", q],
    queryFn: () => UnitService.listUnits(q),
    staleTime: 60_000,
  });
};

export const useCreateUnit = () => {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (p: { code: string; label: string }) =>
      UnitService.createUnit(p),
    onSuccess: () => {
      notify("Unit dibuat", "success");
      qc.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (e: any) => notify(e?.message || "Gagal membuat unit", "error"),
  });
};

export const useUpdateUnit = () => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Pick<Unit, "code" | "label">>;
    }) => UnitService.updateUnit(id, payload),
    onSuccess: () => {
      toast("Unit diperbarui", "success");
      qc.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (e: any) => toast(e?.message || "Gagal memperbarui unit", "error"),
  });
};

export const useDeleteUnit = () => {
  const qc = useQueryClient();
  const toast = useNotify();
  return useMutation({
    mutationFn: (id: string) => UnitService.deleteUnit(id),
    onSuccess: () => {
      toast("Unit dihapus", "success");
      qc.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (e: any) => toast(e?.message || "Gagal menghapus unit", "error"),
  });
};
