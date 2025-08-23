"use client";
import React, { useEffect, useState } from "react";
import { fileService, type FileItem, type CategoryItem } from "@/services/fileService";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import UploadArea from "@/components/files/UploadArea";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

export default function FilesTable() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showChangeCat, setShowChangeCat] = useState(false);
  const [changeTarget, setChangeTarget] = useState<FileItem | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [changeCategory, setChangeCategory] = useState<string>("");
  const [changeDescription, setChangeDescription] = useState<string>("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  const fetchFiles = async () => {
    try {
      const data = await fileService.list(1, 20, q, category, startDate, endDate);
      setFiles(data.files);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onToggleVisibility = async (file: FileItem) => {
    setTogglingId(file._id);
    try {
      const updated = await fileService.updateVisibility(file._id, !file.isPublic);
      setFiles(prev => prev.map(f => f._id === file._id ? updated : f));
    } catch (e) {
      console.error(e);
      alert('Gagal mengubah visibility');
    } finally {
      setTogglingId(null);
    }
  };

  const onCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    try {
      const created = await fileService.createCategory(name);
      await fetchCategories();
      setCategory(created.name);
      setShowAddCat(false);
      setNewCatName("");
    } catch (e: any) {
      alert(e?.message || 'Gagal membuat kategori');
    }
  };

  const fetchCategories = async () => {
    try {
      const list = await fileService.getCategories();
      setCategories(list);
    } catch (e) {
      console.error(e);
    }
  };

  const openChangeCategory = (file: FileItem) => {
    setChangeTarget(file);
    setChangeCategory(file.category || "");
    setChangeDescription(file.description || "");
    setShowChangeCat(true);
  };
  const applyChangeCategory = async (categoryName: string) => {
    if (!changeTarget) return;
    try {
      setLoading(true);
      await fileService.updateMeta(changeTarget._id, { category: categoryName || undefined, description: changeDescription });
      setShowChangeCat(false);
      setChangeTarget(null);
      await fetchFiles();
    } catch (e) {
      console.error(e);
      alert("Gagal mengubah kategori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchCategories();
    const onRefresh = () => fetchFiles();
    window.addEventListener("files:refresh", onRefresh);
    return () => window.removeEventListener("files:refresh", onRefresh);
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    setDeletingId(id);
    try {
      await fileService.delete(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filters + Actions */}
      <div className="p-4 border-b border-gray-100 dark:border-white/[0.06] flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pencarian</label>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="nama atau tipe..." className="rounded border px-3 py-2 text-sm bg-transparent" />
          </div>
          <div className="flex items-end gap-2">
            <label className="block text-xs text-gray-500 mb-1">Kategori</label>
            <select value={category} onChange={(e)=>setCategory(e.target.value)} className="rounded border px-3 py-2 text-sm bg-transparent min-w-[180px]">
              <option value="">Semua</option>
              {categories.map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <button type="button" className="text-sm px-3 py-2 border rounded" onClick={()=>setShowAddCat(true)}>+ Kategori</button>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input type="date" value={startDate||""} onChange={(e)=>setStartDate(e.target.value||undefined)} className="rounded border px-3 py-2 text-sm bg-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input type="date" value={endDate||""} onChange={(e)=>setEndDate(e.target.value||undefined)} className="rounded border px-3 py-2 text-sm bg-transparent" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={fetchFiles}>Filter</Button>
            <Button size="sm" variant="outline" onClick={()=>{setQ("");setCategory("");setStartDate(undefined);setEndDate(undefined);setLoading(true);fetchFiles();}}>Reset</Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={()=>setShowAdd(true)}>Tambah File</Button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-5 py-3 text-gray-500 text-theme-xs">Name</th>
                <th className="px-5 py-3 text-gray-500 text-theme-xs">Kategori</th>
                <th className="px-5 py-3 text-gray-500 text-theme-xs">Deskripsi</th>
                <th className="px-5 py-3 text-gray-500 text-theme-xs">Uploader</th>
                <th className="px-5 py-3 text-gray-500 text-theme-xs">Type</th>
                <th className="px-5 py-3 text-gray-500 text-theme-xs">Size</th>
                <th className="px-5 py-3 text-gray-500 text-theme-xs">Visibility</th>
                <th className="px-5 py-3 text-gray-500 text-theme-xs">Uploaded</th>
                <th className="px-5 py-3 text-gray-500 text-theme-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-6 text-center text-gray-400">No files</td></tr>
              ) : files.map((f) => (
                <tr key={f._id} className="border-t border-gray-100 dark:border-white/[0.05]">
                  <td className="px-5 py-3">{f.originalName}</td>
                  <td className="px-5 py-3">{f.category ? <Badge size="sm">{f.category}</Badge> : <span className="text-gray-400">-</span>}</td>
                  <td className="px-5 py-3">{f.description ? <span className="text-xs text-gray-700 dark:text-gray-200">{f.description}</span> : <span className="text-gray-400">-</span>}</td>
                  <td className="px-5 py-3">
                    {typeof f.uploader === 'object' && f.uploader !== null ? (
                      <span>{f.uploader.name || f.uploader.phone || f.uploader.email || '-'}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><Badge size="sm">{f.mimeType || 'unknown'}</Badge></td>
                  <td className="px-5 py-3">{(f.size/1024/1024).toFixed(2)} MB</td>
                  <td className="px-5 py-3">
                    {f.isPublic 
                      ? <Badge size="sm" variant="light" color="success">Public</Badge>
                      : <Badge size="sm" variant="light" color="light">Private</Badge>}
                  </td>
                  <td className="px-5 py-3">{new Date(f.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 relative">
                      <a href={fileService.downloadUrl(f._id)} className="px-3 py-1 border rounded" target="_blank" rel="noreferrer">Download</a>
                      <Button size="sm" variant="outline" onClick={() => onToggleVisibility(f)} disabled={togglingId===f._id}>
                        {togglingId===f._id ? 'Saving...' : (f.isPublic ? 'Make Private' : 'Make Public')}
                      </Button>
                      <Button size="sm" onClick={() => openChangeCategory(f)}>Ganti Kategori</Button>
                      <Button size="sm" variant="outline" onClick={() => onDelete(f._id)} disabled={deletingId===f._id}>{deletingId===f._id? 'Deleting...' : 'Delete'}</Button>

                      <button
                        type="button"
                        className="ml-1 px-2 py-1 rounded border dropdown-toggle"
                        onClick={() => setOpenMenuId(openMenuId === f._id ? null : f._id)}
                        aria-label="More actions"
                      >
                        ⋮
                      </button>
                      <Dropdown isOpen={openMenuId === f._id} onClose={() => setOpenMenuId(null)}>
                        <div className="py-2">
                          <DropdownItem tag="a" href={fileService.downloadUrl(f._id)} onItemClick={() => setOpenMenuId(null)}>
                            Download
                          </DropdownItem>
                          <DropdownItem onClick={() => { onToggleVisibility(f); }} onItemClick={() => setOpenMenuId(null)}>
                            {f.isPublic ? 'Make Private' : 'Make Public'}
                          </DropdownItem>
                          <DropdownItem onClick={() => { openChangeCategory(f); }} onItemClick={() => setOpenMenuId(null)}>
                            Ganti Kategori
                          </DropdownItem>
                          <DropdownItem onClick={() => { onDelete(f._id); }} onItemClick={() => setOpenMenuId(null)} className="text-error-600">
                            Delete
                          </DropdownItem>
                        </div>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add File Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowAdd(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-theme-base font-semibold">Tambah File</h3>
              <button className="px-2 py-1 text-sm" onClick={()=>setShowAdd(false)}>Tutup</button>
            </div>
            <UploadArea onUploaded={()=>{setShowAdd(false); setLoading(true); fetchFiles();}} />
          </div>
        </div>
      )}

      {/* Change Category Modal */}
      {showChangeCat && changeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>{setShowChangeCat(false); setChangeTarget(null);}} />
          <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-theme-base font-semibold">Ganti Kategori & Deskripsi</h3>
              <button className="px-2 py-1 text-sm" onClick={()=>{setShowChangeCat(false); setChangeTarget(null);}}>Tutup</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kategori</label>
                <select value={changeCategory} onChange={(e)=>setChangeCategory(e.target.value)} className="w-full rounded border bg-transparent px-3 py-2 text-sm">
                  <option value="">Tidak ada</option>
                  {categories.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deskripsi</label>
                <input
                  value={changeDescription}
                  onChange={(e)=>setChangeDescription(e.target.value)}
                  className="w-full rounded border bg-transparent px-3 py-2 text-sm"
                  placeholder="Deskripsi singkat file"
                />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={()=>{setShowChangeCat(false); setChangeTarget(null);}}>Batal</Button>
                <Button size="sm" onClick={() => applyChangeCategory(changeCategory)}>Simpan</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
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
    </div>
  );
}
