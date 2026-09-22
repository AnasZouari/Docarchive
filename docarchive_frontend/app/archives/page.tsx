'use client';

import { useQuery, useMutation } from '@apollo/client';
import { GET_DOCUMENTS } from '@/lib/queries';
import { RESTORE_DOCUMENT } from '@/lib/mutations';
import ArchiveList from '@/components/ArchiveList';
import toast from 'react-hot-toast';

export default function ArchivesPage() {
  const { data, loading, error, refetch } = useQuery(GET_DOCUMENTS);
  const [restoreDocument] = useMutation(RESTORE_DOCUMENT);

  const handleRestore = async (id: string) => {
    try {
      await restoreDocument({ variables: { id } });
      toast.success('✅ Document restored successfully!');
      refetch();
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('Failed to restore document');
    }
  };

  const archivedDocs = data?.documents?.filter((doc: any) => doc.status === 'archived') || [];

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading archives...</p>
      </div>
    );
  }

  if (error) {
    console.error('GraphQL Error:', error);
    return (
      <div className="container mx-auto p-8 text-center text-red-600">
        <p>Error loading archives: {error.message}</p>
        <p className="text-sm text-gray-500 mt-2">Make sure backend is running on port 9000</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📦 Archives</h1>
        <span className="text-gray-500">{archivedDocs.length} archived</span>
      </div>

      <ArchiveList documents={archivedDocs} onRestore={handleRestore} />
    </div>
  );
}