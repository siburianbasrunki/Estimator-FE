import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EstimationService from "../service/estimation";
import { useNavigate } from "react-router-dom";
import type { EstimationCreateModel } from "../model/estimation";
import { useNotify } from "../components/Notify/notify";

export const useEstimations = (
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  return useQuery({
    queryKey: ["estimations", { page, limit, search }],
    queryFn: () => EstimationService.getEstimations(page, limit, search),
  });
};

export const useEstimation = (id: string) => {
  return useQuery({
    queryKey: ["estimation", id],
    queryFn: () => EstimationService.getEstimationById(id),
    enabled: !!id,
  });
};

export const useCreateEstimation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const notify = useNotify();
  return useMutation({
    mutationFn: (payload: {
      data: EstimationCreateModel;
      imageFile?: File | null;
    }) => EstimationService.createEstimation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimations"] });
      notify("Estimation created successfully", "success");
      navigate(`/estimation`);
    },
    onError: (error: Error) => {
      notify(error.message, "error");
    },
  });
};

export const useUpdateEstimation = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: ({
      id,
      data,
      imageFile,
    }: {
      id: string;
      data: Partial<EstimationCreateModel> & { status?: string };
      imageFile?: File | null;
    }) => EstimationService.updateEstimation(id, { data, imageFile }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["estimations"] });
      queryClient.invalidateQueries({ queryKey: ["estimation", variables.id] });
      notify("Estimation updated successfully", "success");
      // navigate(`/estimation`);
    },
    onError: (error: Error) => {
      notify(error.message, "error");
    },
  });
};

export const useDeleteEstimation = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => EstimationService.deleteEstimation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimations"] });
      notify("Estimation deleted successfully", "success");
    },
    onError: (error: Error) => {
      notify(error.message, "error");
    },
  });
};

export const useEstimationStats = () => {
  return useQuery({
    queryKey: ["estimationStats"],
    queryFn: () => EstimationService.getEstimationStats(),
  });
};
