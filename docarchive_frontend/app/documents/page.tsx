'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_DOCUMENTS } from '@/lib/queries';
import { ARCHIVE_DOCUMENT, DELETE_DOCUMENT } from '@/lib/mutations';
import DocumentList from '@/components/DocumentList';
import UploadForm from '@/components/UploadForm';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  
  // Fetch documents
  const { data, loading, error, refetch } = useQuery(GET_DOCUMENTS);
  
  // Mutations
  const [archiveDocument] = useMutation(ARCHIVE_DOCUMENT);
  const [deleteDocument] = useMutation(DELETE_DOCUMENT);

  // Handle archive
  const handleArchive = async (id: string) => {
    try {
      await archiveDocument({ variables: { id } });
      toast.success('✅ Document archived successfully!');
      refetch();
    } catch (error) {
      console.error('Archive failed:', error);
      toast.error('Failed to archive document');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteDocument({ variables: { id } });
      toast.success('✅ Document deleted successfully!');
      refetch();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  // Filter documents based on search
  const documents = data?.documents?.filter((doc: any) =>
    doc.title.toLowerCase().includes(search.toLowerCase()) ||
    doc.reference.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading documents...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('GraphQL Error:', error);
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="text-red-600">
          <p className="text-lg font-semibold">Error loading documents</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          <p className="text-sm text-gray-400 mt-1">Make sure backend is running on port 9000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📄 Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and organize your documents
          </p>
        </div>
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search documents by title or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Upload Form */}
      <UploadForm onUpload={refetch} />

      {/* Document List */}
      <DocumentList
        documents={documents}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    </div>
  );
}