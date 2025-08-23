import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UploadArea from "@/components/files/UploadArea";
import FilesTable from "@/components/files/FilesTable";

export default function FilesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <PageBreadcrumb pageTitle="Files" />
      </div>
      <div className="space-y-6">
        <ComponentCard title="Upload Files">
          <UploadArea />
        </ComponentCard>
        <ComponentCard title="Your Files">
          <FilesTable />
        </ComponentCard>
      </div>
    </div>
  );
}
