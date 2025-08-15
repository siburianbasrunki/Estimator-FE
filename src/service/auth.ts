import { getEndpoints } from "../config/config";
import type { AuthResponse, OtpResponse, User } from "../model/user";


const AuthService = {
  async register(name: string, email: string): Promise<User> {
    const { auth } = getEndpoints();
    const res = await fetch(`${auth}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email }),
    });

    const json = await res.json();

    if (!res.ok) {
      const errorMessage = json?.error || `HTTP error! status: ${res.status}`;
      throw new Error(errorMessage);
    }

    return json.data;
  },

  async requestOtp(email: string): Promise<OtpResponse> {
    const { auth } = getEndpoints();
    const res = await fetch(`${auth}/login/request-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();

    if (!res.ok) {
      const errorMessage = json?.error || `HTTP error! status: ${res.status}`;
      throw new Error(errorMessage);
    }
    return json.data;
  },

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const { auth } = getEndpoints();
    const res = await fetch(`${auth}/login/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  async getCurrentUser(token: string): Promise<User> {
    const { auth } = getEndpoints();
    const res = await fetch(`${auth}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
    async getProfile(): Promise<User> {
    const { auth} = getEndpoints();
    const res = await fetch(`${auth}/profile`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
};

export default AuthService;
