"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import { fileService, type CategoryItem } from "@/services/fileService";

export default function UploadArea({ onUploaded }: { onUploaded?: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fileService.getCategories();
        if (mounted) setCategories(list);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    try {
      const created = await fileService.createCategory(name);
      const list = await fileService.getCategories();
      setCategories(list);
      setCategory(created.name);
      setShowAddCat(false);
      setNewCatName('');
    } catch (e: any) {
      setError(e?.message || 'Gagal membuat kategori');
    }
  };

  const onPick = () => inputRef.current?.click();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      if (!category) {
        setError('Pilih kategori terlebih dahulu');
        return;
      }
      await fileService.upload(files[0], category, isPublic);
      onUploaded?.();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("files:refresh"));
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUploaded, category, isPublic]);

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border bg-transparent px-3 py-2 text-sm"
            disabled={isUploading}
          >
            <option value="">-- Pilih Kategori --</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="pb-1 flex items-center gap-2">
          <input id="isPublic" type="checkbox" checked={isPublic} onChange={(e)=>setIsPublic(e.target.checked)} disabled={isUploading} />
          <label htmlFor="isPublic" className="text-sm">Public</label>
        </div>
        <div className="pb-1">
          <button type="button" className="text-sm px-3 py-2 border rounded" onClick={()=>setShowAddCat(true)} disabled={isUploading}>+ Kategori</button>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
            disabled={isUploading}
          />
          <Button size="sm" onClick={onPick} disabled={isUploading}>
            {isUploading ? 'Mengupload...' : 'Tambah File'}
          </Button>
        </div>
      </div>

      {showAddCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowAddCat(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-theme-base font-semibold">Tambah Kategori</h3>
              <button className="px-2 py-1 text-sm" onClick={()=>setShowAddCat(false)}>Tutup</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nama Kategori</label>
                <input value={newCatName} onChange={(e)=>setNewCatName(e.target.value)} className="w-full rounded border bg-transparent px-3 py-2 text-sm" placeholder="mis. Invoice" />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={()=>setShowAddCat(false)}>Batal</Button>
                <Button size="sm" onClick={onCreateCategory}>Simpan</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded p-6 text-center ${isUploading ? 'opacity-50' : ''}`}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">Atau drag & drop file ke area ini</p>
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
