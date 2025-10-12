import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RoleTable from "@/components/tables/RoleTable";
import { Metadata } from "next";
import RolesActions from "@/components/roles/RolesActions";

export const metadata: Metadata = {
  title: "Roles | Sistem Aset Digital KPU Kota Dumai",
  description: "Manajemen peran pengguna dalam sistem KPU Kota Dumai",
};

export default function RolesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <PageBreadcrumb pageTitle="Roles" />
        <RolesActions />
      </div>
      
      <div className="mt-6">
        <ComponentCard title="Role List">
          <RoleTable />
        </ComponentCard>
      </div>
    </div>
  );
}