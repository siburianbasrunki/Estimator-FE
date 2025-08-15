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
