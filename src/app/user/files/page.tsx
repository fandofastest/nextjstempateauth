import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FilesTable from "@/components/files/FilesTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Files | Sistem Aset Digital KPU Kota Dumai",
  description: "Manajemen file aset digital KPU Kota Dumai",
};

export default function FilesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <PageBreadcrumb pageTitle="Files" />
      </div>
      
      <div className="mt-6">
        <ComponentCard title="Your Files">
          <FilesTable />
        </ComponentCard>
      </div>
    </div>
  );
}
