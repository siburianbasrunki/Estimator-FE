export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OtpResponse {
  email: string;
  otpExpiry: string;
}

export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role?: Role;
  phoneNumber?: string;
  file?: File | null;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  phoneNumber?: string;
  file?: File | null;
}
