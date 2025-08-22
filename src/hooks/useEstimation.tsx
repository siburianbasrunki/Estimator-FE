import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EstimationService from "../service/estimation";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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

  return useMutation({
    mutationFn: EstimationService.createEstimation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimations"] });
      toast("Estimation created successfully");
      navigate(`/estimation`);
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });
};

export const useUpdateEstimation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      EstimationService.updateEstimation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["estimations"] });
      queryClient.invalidateQueries({ queryKey: ["estimation", variables.id] });
      toast("Estimation updated successfully");
      navigate(`/estimation`);
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });
};

export const useDeleteEstimation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => EstimationService.deleteEstimation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimations"] });
      toast.success("Estimation deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useEstimationStats = () => {
  return useQuery({
    queryKey: ["estimationStats"],
    queryFn: () => EstimationService.getEstimationStats(),
  });
};
