"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface AnalyticsData {
  overview: {
    totalFiles: number;
    totalSize: number;
    recentFiles: number;
    period: string;
  };
  dailyStats: Array<{
    date: string;
    count: number;
    size: number;
  }>;
  categoryStats: Array<{
    _id: string;
    count: number;
    size: number;
  }>;
  tagStats: Array<{
    _id: string;
    count: number;
  }>;
  userStats: Array<{
    _id: string;
    count: number;
    size: number;
    userName: string;
    userEmail: string;
  }>;
  typeStats: Array<{
    _id: string;
    count: number;
    size: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  const fetchAnalytics = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor aktivitas dan statistik file</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2 mt-4 sm:mt-0">
          {[
            { value: '7d', label: '7 Hari' },
            { value: '30d', label: '30 Hari' },
            { value: '90d', label: '90 Hari' },
            { value: '1y', label: '1 Tahun' }
          ].map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? "primary" : "outline"}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Files</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(analytics.overview.totalFiles)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Storage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(analytics.overview.totalSize)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Uploads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(analytics.overview.recentFiles)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Tags</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(analytics.tagStats.length)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribusi Kategori</h3>
          <div className="space-y-3">
            {analytics.categoryStats.slice(0, 8).map((cat, index) => (
              <div key={cat._id || 'uncategorized'} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 bg-${['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink', 'indigo'][index % 8]}-500`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{cat._id || 'Uncategorized'}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(cat.count)}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(cat.size)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Types */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tipe File</h3>
          <div className="space-y-3">
            {analytics.typeStats.map((type, index) => (
              <div key={type._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 bg-${['blue', 'green', 'purple', 'orange'][index % 4]}-500`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type._id}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(type.count)}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(type.size)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags Populer</h3>
        <div className="flex flex-wrap gap-2">
          {analytics.tagStats.slice(0, 20).map((tag) => (
            <Badge key={tag._id} variant="light" color="primary">
              #{tag._id} ({tag.count})
            </Badge>
          ))}
        </div>
      </div>

      {/* User Activity */}
      {(session?.user as any)?.role === 'admin' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aktivitas User</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-gray-500 text-sm">User</th>
                  <th className="px-4 py-2 text-gray-500 text-sm">Files</th>
                  <th className="px-4 py-2 text-gray-500 text-sm">Size</th>
                </tr>
              </thead>
              <tbody>
                {analytics.userStats.map((user) => (
                  <tr key={user._id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{user.userName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{user.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{formatNumber(user.count)}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{formatFileSize(user.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
