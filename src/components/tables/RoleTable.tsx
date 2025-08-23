"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { roleService } from "../../services/roleService";
import type { RoleUser } from "@/types/RoleUser";
import Button from "../ui/button/Button";
import ConfirmModal from "../mycomponent/modal/ConfirmModal";
import EditRoleModal from "../mycomponent/modal/EditRoleModal";
// import { PencilIcon, TrashBinIcon } from "@/icons";
// import AddRoleModal from "../roles/AddRoleModal";
// import EditRoleModal from "../roles/EditRoleModal";
// import { Modal } from "../ui/modal";

export default function RoleTable() {
  const [roles, setRoles] = useState<RoleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleToDelete, setRoleToDelete] = useState<RoleUser | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<RoleUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRoles();
    const onRefresh = () => fetchRoles();
    if (typeof window !== 'undefined') {
      window.addEventListener('roles:refresh', onRefresh);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('roles:refresh', onRefresh);
      }
    };
  }, []);

  const fetchRoles = async () => {
    try {
      const data = await roleService.getAllRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    setDeleting(true);
    try {
      await roleService.deleteRole(roleToDelete._id);
      setRoles(roles.filter(r => r._id !== roleToDelete._id));
      setRoleToDelete(null);
    } catch (error) {
      console.error('Error deleting role:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Nama Role
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Hak Akses
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Dibuat
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {roles.length === 0 ? (
                <TableRow>
                  <td colSpan={4} className="py-8 text-center text-gray-400 dark:text-gray-500">
                    Belum ada role
                  </td>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {role.name}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((permission, index) => (
                          <Badge key={index} size="sm" color="info">
                            {permission.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {new Date(role.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="dark:bg-gray-800 dark:text-gray-200"
                          onClick={() => setRoleToEdit(role)}
                        >
                          Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-error-600 ring-error-500 dark:text-error-400 dark:ring-error-600"
                          onClick={() => setRoleToDelete(role)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ConfirmModal untuk konfirmasi hapus */}
      <ConfirmModal
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Role"
        description={roleToDelete ? `Yakin ingin menghapus role "${roleToDelete.name}"? Tindakan ini tidak dapat dibatalkan.` : ''}
        confirmText="Hapus"
        cancelText="Batal"
        loading={deleting}
      />

      {/* EditRoleModal untuk edit role */}
      <EditRoleModal
        isOpen={!!roleToEdit}
        onClose={() => setRoleToEdit(null)}
        onSuccess={fetchRoles}
        role={roleToEdit}
      />
    </div>
  );
} 