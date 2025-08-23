"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useModal } from "@/hooks/useModal";
import { roleService } from "@/services/roleService";
import type { RoleUser } from "@/types/RoleUser";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState<{ name: string; email: string; password: string; role: string }>({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [editing, setEditing] = useState<User | null>(null);
  const [roles, setRoles] = useState<RoleUser[]>([]);
  const [saving, setSaving] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  // Client-side pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const pagedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  const authHeader = useMemo<HeadersInit>(() => {
    const headers: Record<string, string> = {};
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users", { headers: { ...authHeader } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers(data.users || []);
      setPage(1);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await roleService.getAllRoles();
      setRoles(data);
      // set default role for create form if empty
      setForm((f) => ({ ...f, role: f.role || (data[0]?.name ?? "") }));
    } catch (e) {
      // silent; roles may be empty if API not ready
      console.error("Gagal memuat role", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setForm({ name: "", email: "", password: "", role: roles[0]?.name ?? "" });
      await fetchUsers();
      closeModal();
    } catch (e: any) {
      setError(e?.message || "Gagal membuat pengguna");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus user ini?")) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE", headers: { ...authHeader } });
      if (!res.ok) throw new Error(await res.text());
      await fetchUsers();
    } catch (e: any) {
      setError(e?.message || "Gagal menghapus pengguna");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name: editing.name, email: editing.email, role: editing.role }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditing(null);
      await fetchUsers();
    } catch (e: any) {
      setError(e?.message || "Gagal memperbarui pengguna");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manajemen Pengguna</h1>
        <p className="text-sm text-gray-500">Kelola user untuk akses aplikasi.</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded">{error}</div>
      )}

      {/* Create user via Modal */}
      <div className="flex justify-end">
        <Button size="sm" onClick={openModal}>Tambah User</Button>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[640px] p-6">
        <form onSubmit={handleCreate} className="">
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">Tambah Pengguna</h4>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="col-span-1">
              <Label>Nama</Label>
              <Input type="text" placeholder="Nama" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="col-span-1">
              <Label>Email</Label>
              <Input type="email" placeholder="email@domain.com" onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="col-span-1">
              <Label>Password</Label>
              <Input type="password" placeholder="Password" onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="col-span-1">
              <Label>Role</Label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="h-11 w-full rounded-lg border px-4 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                {roles.length === 0 ? (
                  <option value="" disabled>
                    Memuat role...
                  </option>
                ) : (
                  roles.map((r) => (
                    <option key={r._id} value={r.name}>
                      {r.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button size="sm" variant="outline" type="button" onClick={closeModal}>Batal</Button>
            <Button size="sm" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </Modal>

      {/* Users table with shared UI components */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Role</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Dibuat</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Aksi</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell className="px-5 py-6" colSpan={5}>Memuat...</TableCell>
                  </TableRow>
                ) : pagedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-center text-gray-400" colSpan={5}>Tidak ada data</TableCell>
                  </TableRow>
                ) : (
                  pagedUsers.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{u.name}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{u.email}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{u.role}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{new Date(u.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 border rounded" onClick={() => setEditing(u)}>Edit</button>
                          <button className="px-3 py-1 border rounded text-error-500 border-error-500" onClick={() => handleDelete(u._id)}>Hapus</button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {!loading && users.length > pageSize && (
          <div className="p-4 border-t border-gray-100 dark:border-white/[0.05] flex justify-end">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))} />
          </div>
        )}
      </div>

      {/* Edit modal simple */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-5 w-full max-w-lg space-y-4 border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Pengguna</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-white/90">Nama</label>
                <input className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-white/90">Email</label>
                <input type="email" className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-white/90">Role</label>
                <select className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  {roles.map((r) => (
                    <option key={r._id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white">Batal</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white rounded">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
