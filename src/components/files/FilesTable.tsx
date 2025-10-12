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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Permission functions
  const canDeleteFile = (file: FileItem) => {
    if (currentUserRole === 'admin') return true;
    if (typeof file.uploader === 'object' && file.uploader !== null) {
      return file.uploader._id === currentUserId;
    }
    return false;
  };

  const canEditFile = (file: FileItem) => {
    if (currentUserRole === 'admin') return true;
    if (typeof file.uploader === 'object' && file.uploader !== null) {
      return file.uploader._id === currentUserId;
    }
    return false;
  };

  const canChangeVisibility = (file: FileItem) => {
    if (currentUserRole === 'admin') return true;
    if (typeof file.uploader === 'object' && file.uploader !== null) {
      return file.uploader._id === currentUserId;
    }
    return false;
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const fetchFiles = async () => {
    try {
      console.log('Fetching files with params:', { q, category, tags, startDate, endDate });
      const result = await fileService.list(1, 50, q, category, tags, startDate?.toISOString(), endDate?.toISOString());
      console.log('Fetched files result:', result);
      setFiles(result.files);
    } catch (e: any) {
      console.error('Error fetching files:', e);
      showNotification(e?.message || 'Failed to fetch files', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await fileService.getCategories();
      setCategories(result);
    } catch (e: any) {
      console.error('Failed to fetch categories:', e);
    }
  };

  useEffect(() => {
    console.log('FilesTable mounted, fetching data...');
    fetchFiles();
    fetchCategories();
  }, []);

  const openDeleteDialog = (file: FileItem) => {
    if (!canDeleteFile(file)) {
      showNotification('You do not have permission to delete this file', 'error');
      return;
    }
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  const onDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    setDeletingId(fileToDelete._id);
    try {
      await fileService.delete(fileToDelete._id);
      showNotification('File deleted successfully', 'success');
      setFiles(prev => prev.filter(f => f._id !== fileToDelete._id));
    } catch (e: any) {
      showNotification(e?.message || 'Failed to delete file', 'error');
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setFileToDelete(null);
    }
  };

  const onToggleVisibility = async (file: FileItem) => {
    if (!canChangeVisibility(file)) {
      showNotification('You do not have permission to change file visibility', 'error');
      return;
    }

    setTogglingId(file._id);
    try {
      const updated = await fileService.updateMeta(file._id, {
        isPublic: !file.isPublic
      });
      setFiles(prev => prev.map(f => f._id === file._id ? { ...f, isPublic: updated.isPublic } : f));
      showNotification(`File is now ${updated.isPublic ? 'public' : 'private'}`, 'success');
    } catch (e: any) {
      showNotification(e?.message || 'Failed to update file visibility', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const openChangeCategory = (file: FileItem) => {
    if (!canEditFile(file)) {
      showNotification('You do not have permission to edit this file', 'error');
      return;
    }
    setChangeTarget(file);
    setChangeCategory(file.category || '');
    setChangeDescription(file.description || '');
    setChangeTags(file.tags || []);
    setShowChangeCat(true);
  };

  const onSaveChanges = async () => {
    if (!changeTarget) return;
    
    try {
      const updated = await fileService.updateMeta(changeTarget._id, {
        category: changeCategory,
        description: changeDescription,
        tags: changeTags
      });
      
      setFiles(prev => prev.map(f => 
        f._id === changeTarget._id 
          ? { ...f, category: updated.category, description: updated.description, tags: updated.tags }
          : f
      ));
      
      showNotification('File updated successfully', 'success');
      setShowChangeCat(false);
      setChangeTarget(null);
    } catch (e: any) {
      showNotification(e?.message || 'Failed to update file', 'error');
    }
  };

  const onCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    
    try {
      await fileService.createCategory(name);
      const list = await fileService.getCategories();
      setCategories(list);
      setShowAddCat(false);
      setNewCatName('');
      showNotification('Category created successfully', 'success');
    } catch (e: any) {
      showNotification(e?.message || 'Failed to create category', 'error');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading files...</div>;
  }

  console.log('Current files state:', files);
  console.log('Files length:', files.length);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files..."
            className="rounded border px-3 py-2 bg-transparent flex-1"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border px-3 py-2 bg-transparent min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="rounded border px-3 py-2 bg-transparent flex-1"
          />
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
              <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-400">
                <div className="space-y-2">
                  <p>No files found</p>
                  <p className="text-xs">Try uploading a file or check your filters</p>
                </div>
              </td></tr>
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
                        {canChangeVisibility(f) && togglingId !== f._id && (
                          <DropdownItem onClick={() => { onToggleVisibility(f); setOpenMenuId(null); }}>
                            {f.isPublic ? 'Make Private' : 'Make Public'}
                          </DropdownItem>
                        )}
                        {canChangeVisibility(f) && togglingId === f._id && (
                          <DropdownItem onClick={() => {}}>
                            <span className="text-gray-400">Saving...</span>
                          </DropdownItem>
                        )}
                        {canEditFile(f) && (
                          <DropdownItem onClick={() => { openChangeCategory(f); setOpenMenuId(null); }}>
                            Edit File
                          </DropdownItem>
                        )}
                        {canDeleteFile(f) && deletingId !== f._id && (
                          <DropdownItem onClick={() => { openDeleteDialog(f); setOpenMenuId(null); }} className="text-red-600">
                            Delete
                          </DropdownItem>
                        )}
                        {canDeleteFile(f) && deletingId === f._id && (
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

      {/* Mobile Accordion View */}
      <div className="md:hidden space-y-3">
        {files.length === 0 ? (
          <div className="p-6 text-center text-gray-400 space-y-2">
            <p>No files found</p>
            <p className="text-xs">Try uploading a file or check your filters</p>
          </div>
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

      {/* Change Category Dialog */}
      {showChangeCat && changeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowChangeCat(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit File</h3>
              <Button variant="outline" size="sm" onClick={() => setShowChangeCat(false)}>Close</Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <div className="flex gap-2">
                  <select
                    value={changeCategory}
                    onChange={(e) => setChangeCategory(e.target.value)}
                    className="flex-1 rounded border px-3 py-2 bg-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => setShowAddCat(true)}>+ Add</Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="File description"
                  className="w-full rounded border px-3 py-2 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                <TagsInput
                  tags={changeTags}
                  onChange={setChangeTags}
                  placeholder="Add tags..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowChangeCat(false)}>Cancel</Button>
                <Button onClick={onSaveChanges}>Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddCat(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-theme-base font-semibold">Add Category</h3>
              <button className="px-2 py-1 text-sm" onClick={() => setShowAddCat(false)}>Close</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category Name</label>
                <input 
                  value={newCatName} 
                  onChange={(e) => setNewCatName(e.target.value)} 
                  className="w-full rounded border px-3 py-2 bg-transparent" 
                  placeholder="e.g. Invoice" 
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowAddCat(false)}>Cancel</Button>
                <Button size="sm" onClick={onCreateCategory}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDeleteConfirm}
        title="Delete File"
        message={`Are you sure you want to delete "${fileToDelete?.originalName}"? This action cannot be undone.`}
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
