"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface SearchFilters {
  query: string;
  category: string;
  tags: string[];
  dateFrom: string;
  dateTo: string;
  minSize: string;
  maxSize: string;
  fileType: string;
  isPublic: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
  categories: string[];
  popularTags: string[];
}

export default function AdvancedSearch({ onSearch, onReset, categories, popularTags }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    tags: [],
    dateFrom: '',
    dateTo: '',
    minSize: '',
    maxSize: '',
    fileType: '',
    isPublic: ''
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      query: '',
      category: '',
      tags: [],
      dateFrom: '',
      dateTo: '',
      minSize: '',
      maxSize: '',
      fileType: '',
      isPublic: ''
    });
    onReset();
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const hasActiveFilters = () => {
    return filters.query || filters.category || filters.tags.length > 0 || 
           filters.dateFrom || filters.dateTo || filters.minSize || 
           filters.maxSize || filters.fileType || filters.isPublic;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      {/* Basic Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari file berdasarkan nama, deskripsi, atau konten..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSearch} size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Cari
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Filter
            {hasActiveFilters() && (
              <Badge size="sm" color="primary">
                {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v).length}
              </Badge>
            )}
          </Button>

          {hasActiveFilters() && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipe File
              </label>
              <select
                value={filters.fileType}
                onChange={(e) => setFilters(prev => ({ ...prev, fileType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua Tipe</option>
                <option value="image">Gambar</option>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="document">Dokumen</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            {/* Visibility Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibilitas
              </label>
              <select
                value={filters.isPublic}
                onChange={(e) => setFilters(prev => ({ ...prev, isPublic: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua</option>
                <option value="true">Public</option>
                <option value="false">Private</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* File Size Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ukuran File (MB)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minSize}
                  onChange={(e) => setFilters(prev => ({ ...prev, minSize: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxSize}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxSize: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            
            {/* Selected Tags */}
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {filters.tags.map(tag => (
                  <div
                    key={tag}
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    <Badge variant="light" color="primary">
                      #{tag} ×
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Popular Tags */}
            <div className="flex flex-wrap gap-2">
              {popularTags.slice(0, 15).map(tag => (
                <div
                  key={tag}
                  className="cursor-pointer"
                  onClick={() => addTag(tag)}
                >
                  <Badge variant="light" color="light">
                    #{tag}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={handleSearch}>
              Terapkan Filter
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset Semua
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
