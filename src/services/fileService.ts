import type { RoleUser } from "@/types/RoleUser";

const API_PREFIX = "/api";

function buildAuthHeaders() {
  if (typeof window === "undefined") return {} as HeadersInit;
  const token = localStorage.getItem("token");
  return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
}

export interface CategoryItem {
  _id: string;
  name: string;
}

export interface FileItem {
  _id: string;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
  storagePath: string;
  s3Key?: string;
  uploader: string | { _id: string; name?: string; email?: string; phone?: string };
  category?: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const fileService = {
  async list(
    page = 1,
    pageSize = 20,
    q = "",
    category = "",
    startDate?: string,
    endDate?: string
  ): Promise<{ files: FileItem[]; total: number; page: number; pageSize: number }> {
    const url = new URL(`${API_PREFIX}/files`, window.location.origin);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (q) url.searchParams.set("q", q);
    if (category) url.searchParams.set("category", category);
    if (startDate) url.searchParams.set("startDate", startDate);
    if (endDate) url.searchParams.set("endDate", endDate);
    const res = await fetch(url.toString(), { headers: { ...buildAuthHeaders() } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getCategories(): Promise<CategoryItem[]> {
    const res = await fetch(`${API_PREFIX}/categories`, { headers: { ...buildAuthHeaders() } });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return (data.categories || []) as CategoryItem[];
  },

  async createCategory(name: string): Promise<CategoryItem> {
    const res = await fetch(`${API_PREFIX}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.category as CategoryItem;
  },

  async upload(file: File, category?: string, isPublic: boolean = false, description?: string): Promise<FileItem> {
    const form = new FormData();
    form.append("file", file);
    if (category) form.append("category", category);
    if (isPublic) form.append("isPublic", String(isPublic));
    if (typeof description === 'string' && description.length) form.append('description', description);
    const res = await fetch(`${API_PREFIX}/files`, {
      method: "POST",
      headers: { ...buildAuthHeaders() },
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.file as FileItem;
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_PREFIX}/files/${id}`, {
      method: "DELETE",
      headers: { ...buildAuthHeaders() },
    });
    if (!res.ok) throw new Error(await res.text());
  },

  downloadUrl(id: string): string {
    return `${API_PREFIX}/files/${id}/download`;
  },

  async updateCategory(id: string, category: string | undefined): Promise<FileItem> {
    const res = await fetch(`${API_PREFIX}/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: JSON.stringify({ category }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.file as FileItem;
  },

  async updateVisibility(id: string, isPublic: boolean): Promise<FileItem> {
    const res = await fetch(`${API_PREFIX}/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.file as FileItem;
  },

  async updateMeta(id: string, payload: { category?: string; isPublic?: boolean; description?: string }): Promise<FileItem> {
    const res = await fetch(`${API_PREFIX}/files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.file as FileItem;
  },
};

export default fileService;
