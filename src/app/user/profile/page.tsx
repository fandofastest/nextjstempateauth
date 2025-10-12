import UserProfileCard from "@/components/user-profile/UserProfileCard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Profil | Sistem Aset Digital KPU Kota Dumai",
  description: "Halaman manajemen profil pengguna KPU Kota Dumai",
};

export default function UserProfile() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>User</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 dark:text-white">Profile</span>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          My Profile
        </h3>
        <UserProfileCard />
      </div>
    </div>
  );
}
