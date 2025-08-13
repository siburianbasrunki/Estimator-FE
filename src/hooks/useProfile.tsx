import { useQuery } from "@tanstack/react-query";
import AuthService from "../service/auth";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => AuthService.getProfile(),
  });
};
