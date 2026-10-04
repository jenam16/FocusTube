import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusCircle,
  Search,
  FileText,
  BookOpen,
  FolderOpen,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { studyMaterialService } from '../services';
import { StudyMaterial, CreateStudyMaterialPayload } from '../types';
import {
  StudyMaterialCard,
  StudyMaterialModal,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../components';

const FILTER_TYPES = [
  { value: 'all', label: 'All Resources' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'doc', label: 'Docs' },
  { value: 'sheet', label: 'Sheets' },
  { value: 'epub', label: 'Books' },
  { value: 'link', label: 'Links' },
];

export const StudyMaterialsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);

  const [materialToDelete, setMaterialToDelete] = useState<StudyMaterial | null>(null);

  // Fetch materials
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['study-materials', searchTerm, selectedType],
    queryFn: () => studyMaterialService.getStudyMaterials(searchTerm, selectedType),
  });

  const materials = data?.materials || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateStudyMaterialPayload) =>
      studyMaterialService.createStudyMaterial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateStudyMaterialPayload }) =>
      studyMaterialService.updateStudyMaterial(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studyMaterialService.deleteStudyMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
      setMaterialToDelete(null);
    },
  });

  const handleOpenAddModal = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (material: StudyMaterial) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleSaveMaterial = async (payload: CreateStudyMaterialPayload) => {
    if (editingMaterial) {
      await updateMutation.mutateAsync({ id: editingMaterial._id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  // Stats derivation
  const stats = useMemo(() => {
    const total = materials.length;
    const pdfCount = materials.filter((m) => m.fileType === 'pdf').length;
    const otherCount = total - pdfCount;
    return { total, pdfCount, otherCount };
  }, [materials]);

  return (
    <div className="space-y-8">
      {/* Header Greeting & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl font-heading">
            Study Material
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-secondary">
            Your independent personal library of external study resources, PDFs, and documentation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Resource</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      {!isLoading && !error && materials.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-app bg-surface p-4 shadow-2xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-xs">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted font-heading">
                Total Saved
              </p>
              <p className="text-xl font-bold tracking-tight text-primary font-heading">
                {stats.total} {stats.total === 1 ? 'Resource' : 'Resources'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-app bg-surface p-4 shadow-2xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted font-heading">
                PDF Documents
              </p>
              <p className="text-xl font-bold tracking-tight text-primary font-heading">
                {stats.pdfCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-app bg-surface p-4 shadow-2xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted font-heading">
                Articles & Docs
              </p>
              <p className="text-xl font-bold tracking-tight text-primary font-heading">
                {stats.otherCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources by name or URL..."
            className="w-full rounded-xl border border-app bg-surface py-2.5 pl-10 pr-4 text-xs sm:text-sm text-primary placeholder-muted focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-app self-start sm:self-auto shadow-2xs overflow-x-auto max-w-full">
          {FILTER_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setSelectedType(type.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === type.value
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-secondary hover:text-primary hover:bg-surface-elevated'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingState type="grid" count={6} />}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorState
          title="Unable to load study materials"
          message="Could not retrieve your saved study resources at this time. Please try again."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && materials.length === 0 && (
        <EmptyState
          icon={<FolderOpen className="h-6 w-6" />}
          title={
            searchTerm || selectedType !== 'all'
              ? 'No matching resources found'
              : 'Your study material library is empty'
          }
          description={
            searchTerm || selectedType !== 'all'
              ? 'Try adjusting your search terms or filter to find what you are looking for.'
              : 'Save external PDF links, document URLs, and useful study resources with zero distractions.'
          }
          actionLabel={searchTerm || selectedType !== 'all' ? undefined : 'Add First Resource'}
          onAction={searchTerm || selectedType !== 'all' ? undefined : handleOpenAddModal}
        />
      )}

      {/* Materials Grid */}
      {!isLoading && !error && materials.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((item) => (
            <StudyMaterialCard
              key={item._id}
              material={item}
              onEdit={handleOpenEditModal}
              onDelete={(m) => setMaterialToDelete(m)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <StudyMaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveMaterial}
        initialData={editingMaterial}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMaterialToDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-app bg-surface p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-primary font-heading">
                Delete Study Material?
              </h3>
              <p className="mt-1 text-xs text-secondary leading-relaxed">
                Are you sure you want to remove{' '}
                <strong className="text-primary font-semibold">
                  "{materialToDelete.name}"
                </strong>{' '}
                from your study library? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                disabled={deleteMutation.isPending}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(materialToDelete._id)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/25 hover:bg-rose-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
