import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ImportHspSummary } from "../service/hsp";
import HspService from "../service/hsp";

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
