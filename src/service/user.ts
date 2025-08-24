// src/service/users.ts
import { getEndpoints } from "../config/config";
import type { CreateUserInput, UpdateUserInput, User } from "../model/user";

const UsersService = {
  async list(): Promise<User[]> {
    const { users } = getEndpoints();
    const res = await fetch(users, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data as User[];
  },

  async getById(id: string): Promise<User> {
    const { users } = getEndpoints();
    const res = await fetch(`${users}/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data as User;
  },

  async create(payload: CreateUserInput): Promise<User> {
    const { users } = getEndpoints();
    const fd = new FormData();
    fd.append("name", payload.name);
    fd.append("email", payload.email);
    if (payload.role) fd.append("role", payload.role);
    if (payload.phoneNumber) fd.append("phoneNumber", payload.phoneNumber);
    if (payload.file) fd.append("file", payload.file);

    const res = await fetch(users, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data as User;
  },

  async update(id: string, payload: UpdateUserInput): Promise<User> {
    const { users } = getEndpoints();
    const fd = new FormData();
    if (payload.name !== undefined) fd.append("name", payload.name);
    if (payload.role !== undefined) fd.append("role", payload.role);
    if (payload.phoneNumber !== undefined)
      fd.append("phoneNumber", payload.phoneNumber);
    if (payload.file) fd.append("file", payload.file);

    const res = await fetch(`${users}/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data as User;
  },

  async remove(id: string): Promise<void> {
    const { users } = getEndpoints();
    const res = await fetch(`${users}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
};

export default UsersService;
