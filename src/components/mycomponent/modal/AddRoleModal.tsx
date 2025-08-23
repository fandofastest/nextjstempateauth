"use client";
import React, { useState } from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { roleService } from "@/services/roleService";

const allPermissions = [
  "manage_users",
  "manage_files",
  "upload_files",
  "download_files",
  "manage_folders",
  "share_files",
  "view_audit_logs",
];

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddRoleModal({ isOpen, onClose, onSuccess }: AddRoleModalProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePermissionChange = (perm: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await roleService.createRole(form);
      // optional callback
      onSuccess?.();
      // notify listeners to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("roles:refresh"));
      }
      // reset and close
      setForm({ name: "", description: "", permissions: [] });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[400px] p-5  border border-gray-200 dark:border-gray-800">
      <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Add Role</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white/90">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-black dark:text-white bg-white dark:bg-gray-800"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white/90">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-black dark:text-white bg-white dark:bg-gray-800"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white/90">Permissions</label>
          <div className="flex flex-wrap gap-2">
            {allPermissions.map((perm) => (
              <label key={perm} className="flex items-center gap-1 text-xs text-gray-700 dark:text-white/90">
                <input
                  type="checkbox"
                  checked={form.permissions.includes(perm)}
                  onChange={() => handlePermissionChange(perm)}
                  className="accent-primary"
                />
                {perm.replace(/_/g, " ")}
              </label>
            ))}
          </div>
        </div>
        {error && <div className="text-error-500 text-sm">{error}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading} type="button">
            Cancel
          </Button>
          <Button variant="primary" disabled={loading} type="submit">
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
