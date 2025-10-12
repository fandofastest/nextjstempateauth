"use client";
import React, { useEffect, useState } from "react";
import { fileService, type FileItem, type CategoryItem } from "@/services/fileService";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import UploadDialog from "@/components/files/UploadDialog";
import TagsInput from "@/components/ui/input/TagsInput";
import DeleteConfirmDialog from "@/components/ui/dialog/DeleteConfirmDialog";
import NotificationToast from "@/components/ui/notification/NotificationToast";
import UploadedFilePreview from "@/components/ui/preview/UploadedFilePreview";
import UploadedFilePreviewModal from "@/components/ui/preview/UploadedFilePreviewModal";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useSession } from "next-auth/react";

export default function FilesTable() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showChangeCat, setShowChangeCat] = useState(false);
  const [changeTarget, setChangeTarget] = useState<FileItem | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [changeCategory, setChangeCategory] = useState<string>("");
  const [changeDescription, setChangeDescription] = useState<string>("");
  const [changeTags, setChangeTags] = useState<string[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Delete dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  
  // Notification states
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({ message: '', type: 'info', isVisible: false });
  
  // Preview modal states
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Get current user session
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id || (session?.user as any)?._id;
  const currentUserRole = (session?.user as any)?.role;

  // Filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  const fetchFiles = async () => {
    try {
      const data = await fileService.list(1, 20, q, category, tags, startDate, endDate);
      setFiles(data.files);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onToggleVisibility = async (file: FileItem) => {
    // Check permission before changing visibility
    if (!canChangeVisibility(file)) {
      setNotification({
        message: 'Anda tidak memiliki izin untuk mengubah visibility file ini.',
        type: 'error',
        isVisible: true
      });
      return;
    }
    
    setTogglingId(file._id);
    try {
      const updated = await fileService.updateVisibility(file._id, !file.isPublic);
      setFiles(prev => prev.map(f => f._id === file._id ? updated : f));
    } catch (e) {
      console.error(e);
      setNotification({
        message: 'Gagal mengubah visibility file.',
        type: 'error',
        isVisible: true
      });
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
      setNotification({
        message: e?.message || 'Gagal membuat kategori.',
        type: 'error',
        isVisible: true
      });
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
    // Check permission before opening edit dialog
    if (!canEditFile(file)) {
      setNotification({
        message: 'Anda tidak memiliki izin untuk mengedit file ini.',
        type: 'error',
        isVisible: true
      });
      return;
    }
    
    setChangeTarget(file);
    setChangeCategory(file.category || "");
    setChangeDescription(file.description || "");
    setChangeTags(file.tags || []);
    setShowChangeCat(true);
  };
  const applyChangeCategory = async (categoryName: string) => {
    if (!changeTarget) return;
    try {
      setLoading(true);
      await fileService.updateMeta(changeTarget._id, { 
        category: categoryName || undefined, 
        description: changeDescription,
        tags: changeTags
      });
      setShowChangeCat(false);
      setChangeTarget(null);
      await fetchFiles();
    } catch (e) {
      console.error(e);
      setNotification({
        message: 'Gagal mengubah file.',
        type: 'error',
        isVisible: true
      });
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

  const openDeleteDialog = (file: FileItem) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setFileToDelete(null);
    setShowDeleteDialog(false);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    setDeletingId(fileToDelete._id);
    try {
      await fileService.delete(fileToDelete._id);
      setFiles((prev) => prev.filter((f) => f._id !== fileToDelete._id));
      closeDeleteDialog();
    } catch (e) {
      console.error(e);
      setNotification({
        message: 'Gagal menghapus file.',
        type: 'error',
        isVisible: true
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Check if current user can delete the file
  const canDeleteFile = (file: FileItem) => {
    // Admin can delete any file
    if (currentUserRole === 'admin') return true;
    
    // Owner can delete their own file
    const fileOwnerId = typeof file.uploader === 'object' && file.uploader !== null 
      ? file.uploader._id 
      : file.uploader;
    
    return String(fileOwnerId) === String(currentUserId);
  };

  // Check if current user can edit the file (same logic as delete)
  const canEditFile = (file: FileItem) => {
    // Admin can edit any file
    if (currentUserRole === 'admin') return true;
    
    // Owner can edit their own file
    const fileOwnerId = typeof file.uploader === 'object' && file.uploader !== null 
      ? file.uploader._id 
      : file.uploader;
    
    return String(fileOwnerId) === String(currentUserId);
  };

  // Check if current user can change visibility (same logic as edit)
  const canChangeVisibility = (file: FileItem) => {
    // Admin can change visibility of any file
    if (currentUserRole === 'admin') return true;
    
    // Owner can change visibility of their own file
    const fileOwnerId = typeof file.uploader === 'object' && file.uploader !== null 
      ? file.uploader._id 
      : file.uploader;
    
    return String(fileOwnerId) === String(currentUserId);
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
            <Button size="sm" variant="outline" onClick={()=>setShowAddCat(true)} className="min-w-[90px]">+ Kategori</Button>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tags</label>
            <input value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="tag1,tag2..." className="rounded border px-3 py-2 text-sm bg-transparent min-w-[180px]" />
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
            <Button size="sm" onClick={fetchFiles} className="min-w-[70px]">Filter</Button>
            <Button size="sm" variant="outline" onClick={()=>{setQ("");setCategory("");setTags("");setStartDate(undefined);setEndDate(undefined);setLoading(true);fetchFiles();}} className="min-w-[70px]">Reset</Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={()=>setShowUploadDialog(true)} className="min-w-[100px]">+ Tambah File</Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-5 py-3 text-gray-500 text-theme-xs">Preview</th>
              <th className="px-5 py-3 text-gray-500 text-theme-xs">Name</th>
              <th className="px-5 py-3 text-gray-500 text-theme-xs">Category</th>
              <th className="px-5 py-3 text-gray-500 text-theme-xs">Size</th>
              <th className="px-5 py-3 text-gray-500 text-theme-xs">Visibility</th>
              <th className="px-5 py-3 text-gray-500 text-theme-xs">Uploaded</th>
              <th className="px-5 py-3 text-gray-500 text-theme-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-400">No files</td></tr>
            ) : files.map((f) => (
                <tr key={f._id} className="border-t border-gray-100 dark:border-white/[0.05]">
                  <td className="px-5 py-3">
                    <div 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setPreviewFile(f);
                        setShowPreviewModal(true);
                      }}
                      title="Klik untuk preview lebih besar"
                    >
                      <UploadedFilePreview 
                        fileUrl={fileService.downloadUrl(f._id)}
                        fileName={f.originalName}
                        mimeType={f.mimeType}
                        maxWidth={60} 
                        maxHeight={45}
                        className="border rounded"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="max-w-[200px]">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{f.originalName}</p>
                      {f.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{f.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">{f.category ? <Badge size="sm">{f.category}</Badge> : <span className="text-gray-400">-</span>}</td>
                  <td className="px-5 py-3">{(f.size/1024/1024).toFixed(2)} MB</td>
                  <td className="px-5 py-3">
                    {f.isPublic 
                      ? <Badge size="sm" variant="light" color="success">Public</Badge>
                      : <Badge size="sm" variant="light" color="light">Private</Badge>}
                  </td>
                  <td className="px-5 py-3">{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenMenuId(openMenuId === f._id ? null : f._id)}
                        className="min-w-[40px] px-2"
                        aria-label="More actions"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </Button>
                      <Dropdown isOpen={openMenuId === f._id} onClose={() => setOpenMenuId(null)}>
                        <div className="py-2">
                          <DropdownItem onClick={() => { window.open(fileService.downloadUrl(f._id), '_blank'); setOpenMenuId(null); }}>
                            Download
                          </DropdownItem>
                          {canChangeVisibility(f) && !togglingId && (
                            <DropdownItem onClick={() => { onToggleVisibility(f); setOpenMenuId(null); }}>
                              {f.isPublic ? 'Make Private' : 'Make Public'}
                            </DropdownItem>
                          )}
                          {canChangeVisibility(f) && togglingId===f._id && (
                            <DropdownItem onClick={() => {}}>
                              <span className="text-gray-400">Saving...</span>
                            </DropdownItem>
                          )}
                          {canEditFile(f) && (
                            <DropdownItem onClick={() => { openChangeCategory(f); setOpenMenuId(null); }}>
                              Edit File
                            </DropdownItem>
                          )}
                          {canDeleteFile(f) && !deletingId && (
                            <DropdownItem onClick={() => { openDeleteDialog(f); setOpenMenuId(null); }} className="text-red-600">
                              Delete
                            </DropdownItem>
                          )}
                          {canDeleteFile(f) && deletingId===f._id && (
                            <DropdownItem onClick={() => {}}>
                              <span className="text-gray-400">Deleting...</span>
                            </DropdownItem>
                          )}
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

      {/* Mobile Accordion View */}
      <div className="md:hidden space-y-3">
        {files.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No files</div>
        ) : files.map((f) => (
          <div key={f._id} className="border border-gray-200 dark:border-white/[0.05] rounded-lg overflow-hidden">
            {/* File Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                onClick={() => {
                  setPreviewFile(f);
                  setShowPreviewModal(true);
                }}
                title="Klik untuk preview lebih besar"
              >
                <UploadedFilePreview 
                  fileUrl={fileService.downloadUrl(f._id)}
                  fileName={f.originalName}
                  mimeType={f.mimeType}
                  maxWidth={50} 
                  maxHeight={40}
                  className="border rounded"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">{f.originalName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(f.size/1024/1024).toFixed(2)} MB • {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* File Details */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Category:</span>
                  <div className="mt-1">
                    {f.category ? <Badge size="sm">{f.category}</Badge> : <span className="text-gray-400">-</span>}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Visibility:</span>
                  <div className="mt-1">
                    {f.isPublic 
                      ? <Badge size="sm" variant="light" color="success">Public</Badge>
                      : <Badge size="sm" variant="light" color="light">Private</Badge>}
                  </div>
                </div>
              </div>
              
              {f.tags && f.tags.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {f.tags.map((tag, idx) => (
                      <Badge key={idx} size="sm" variant="light" color="light">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {f.description && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Description:</span>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{f.description}</p>
                </div>
              )}
              
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Uploader:</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {typeof f.uploader === 'object' && f.uploader !== null
                    ? (f.uploader.name || f.uploader.email || 'Unknown')
                    : 'Unknown'
                  }
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(fileService.downloadUrl(f._id), '_blank')}
                  className="flex-1 min-w-[80px]"
                >
                  Download
                </Button>
                {canChangeVisibility(f) && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onToggleVisibility(f)} 
                    disabled={togglingId===f._id}
                    className="flex-1 min-w-[80px]"
                  >
                    {togglingId===f._id ? 'Saving...' : (f.isPublic ? 'Private' : 'Public')}
                  </Button>
                )}
                {canEditFile(f) && (
                  <Button 
                    size="sm" 
                    onClick={() => openChangeCategory(f)}
                    className="flex-1 min-w-[60px]"
                  >
                    Edit
                  </Button>
                )}
                {canDeleteFile(f) && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openDeleteDialog(f)} 
                    disabled={deletingId===f._id}
                    className="flex-1 min-w-[60px] text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    {deletingId===f._id ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploaded={() => {
          setShowUploadDialog(false);
          setLoading(true);
          fetchFiles();
        }}
      />

      {/* Change Category Modal */}
      {showChangeCat && changeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>{setShowChangeCat(false); setChangeTarget(null);}} />
          <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-theme-base font-semibold">Edit File</h3>
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tags</label>
                <TagsInput
                  tags={changeTags}
                  onChange={setChangeTags}
                  placeholder="Ketik tag dan tekan Enter"
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title="Hapus File"
        message="Apakah Anda yakin ingin menghapus file ini? Tindakan ini tidak dapat dibatalkan."
        itemName={fileToDelete?.originalName}
        isDeleting={deletingId === fileToDelete?._id}
      />

      {/* Notification Toast */}
      <NotificationToast
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <UploadedFilePreviewModal
          file={previewFile}
          fileUrl={fileService.downloadUrl(previewFile._id)}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewFile(null);
          }}
        />
      )}
    </div>
  );
}
