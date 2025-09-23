import { getEndpoints } from "../config/config";
import { authFetch } from "../helper/auth-fetch";
import type { AuthResponse, OtpResponse, User } from "../model/user";

const AuthService = {
  async register(name: string, email: string): Promise<User> {
    const { auth } = getEndpoints();
    const { data } = await authFetch<{ data: User }>(`${auth}/register`, {
      method: "POST",
      body: JSON.stringify({ name, email }),
    });
    return data.data;
  },

  async requestOtp(email: string): Promise<OtpResponse> {
    const { auth } = getEndpoints();
    const { data } = await authFetch<{ data: OtpResponse }>(`${auth}/login/request-otp`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return data.data;
  },

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const { auth } = getEndpoints();
    const { data } = await authFetch<{ data: AuthResponse }>(`${auth}/login/verify-otp`, {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    return data.data;
  },

  async getCurrentUser(token: string): Promise<User> {
    const { auth } = getEndpoints();
    const { data } = await authFetch<{ data: User }>(`${auth}/me`, {
      headers: { Authorization: `Bearer ${token}` }, 
    });
    return data.data;
  },

  async getProfile(): Promise<User> {
    const { auth } = getEndpoints();
    const { data } = await authFetch<{ data: User }>(`${auth}/profile`);
    return data.data;
  },
};

export default AuthService;
