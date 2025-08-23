export type Permission = 
  | 'manage_users'
  | 'manage_files'
  | 'upload_files'
  | 'download_files'
  | 'manage_folders'
  | 'share_files'
  | 'view_audit_logs';

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: Permission[];
}

export interface RoleResponse {
  message?: string;
  error?: string;
  errors?: Array<{
    msg: string;
    param: string;
    location: string;
  }>;
  data?: Role | Role[];
} 