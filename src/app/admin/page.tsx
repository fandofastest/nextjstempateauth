import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import FileModel from "@/models/File";
import CategoryModel from "@/models/Category";

export const metadata: Metadata = {
  title: "Dashboard Admin | Malay Futsal",
  description: "Panel kontrol admin untuk manajemen sistem Malay Futsal",
};

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) {
    redirect('/signin?callbackUrl=/admin');
  }

  const userId = (session.user as any)?.id || (session.user as any)?._id;
  await dbConnect();

  const [
    totalCategories,
    myFiles,
    myPrivateFiles,
    totalPublicFiles,
  ] = await Promise.all([
    CategoryModel.countDocuments({}),
    FileModel.countDocuments({ uploader: userId }),
    FileModel.countDocuments({ uploader: userId, isPublic: false }),
    FileModel.countDocuments({ isPublic: true }),
  ]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Ringkasan
      </h1>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
            <div className="text-theme-xs text-gray-500">Total Kategori</div>
            <div className="mt-2 text-2xl font-semibold">{totalCategories}</div>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
            <div className="text-theme-xs text-gray-500">File Saya</div>
            <div className="mt-2 text-2xl font-semibold">{myFiles}</div>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
            <div className="text-theme-xs text-gray-500">Private (Saya)</div>
            <div className="mt-2 text-2xl font-semibold">{myPrivateFiles}</div>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
            <div className="text-theme-xs text-gray-500">Public (Semua)</div>
            <div className="mt-2 text-2xl font-semibold">{totalPublicFiles}</div>
          </div>
        </div>
      </div>

      {/* Placeholder area to keep admin template feel; can be expanded later */}
      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-dark dark:text-gray-300">
            Gunakan menu di sidebar untuk mengelola file, kategori, dan lainnya.
          </div>
        </div>
      </div>
    </div>
  );
}
