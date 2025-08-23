import type { RoleUser } from "@/types/RoleUser";

const API_PREFIX = "/api";

function buildAuthHeaders() {
  if (typeof window === "undefined") return {} as HeadersInit;
  const token = localStorage.getItem("token");
  return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
}

export const roleService = {
  async getAllRoles(): Promise<RoleUser[]> {
    const res = await fetch(`${API_PREFIX}/roles`, {
      method: "GET",
      headers: { ...buildAuthHeaders() },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.roles as RoleUser[];
  },

  async createRole(payload: Pick<RoleUser, "name" | "description"> & { permissions: string[] }): Promise<RoleUser> {
    const res = await fetch(`${API_PREFIX}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.role as RoleUser;
  },

  async updateRole(id: string, payload: Partial<Pick<RoleUser, "name" | "description" | "permissions">>): Promise<RoleUser> {
    const res = await fetch(`${API_PREFIX}/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.role as RoleUser;
  },

  async deleteRole(id: string): Promise<void> {
    const res = await fetch(`${API_PREFIX}/roles/${id}`, {
      method: "DELETE",
      headers: { ...buildAuthHeaders() },
    });
    if (!res.ok) throw new Error(await res.text());
  },
};

export default roleService;
