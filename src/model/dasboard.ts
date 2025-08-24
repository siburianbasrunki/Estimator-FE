export interface EstimationMonthlyPayload {
  labels: string[];
  series: number[];
  from: string;
  to: string;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  error?: string;
}