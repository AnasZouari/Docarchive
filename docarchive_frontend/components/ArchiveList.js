'use client';

export default function ArchiveList({ documents, onRestore }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500 text-lg">📦 No archived documents</p>
        <p className="text-gray-400">Archive documents to see them here</p>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRestore = (id) => {
    if (confirm('Restore this document from archive?')) {
      onRestore(id);
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Title</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Reference</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Type</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Archived Date</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Reason</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b hover:bg-gray-50 transition-colors">
              <td className="p-3 font-medium">{doc.title || 'Untitled'}</td>
              <td className="p-3 text-sm text-gray-600">{doc.reference || 'N/A'}</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {doc.type || 'Unknown'}
                </span>
              </td>
              <td className="p-3 text-sm text-gray-600">
                {doc.archives && doc.archives.length > 0 && doc.archives[0].archive_date
                  ? formatDate(doc.archives[0].archive_date)
                  : 'N/A'}
              </td>
              <td className="p-3 text-sm text-gray-600">
                {doc.archives && doc.archives.length > 0 && doc.archives[0].reason
                  ? doc.archives[0].reason
                  : 'No reason provided'}
              </td>
              <td className="p-3">
                <button
                  onClick={() => handleRestore(doc.id)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm transition-colors"
                >
                  Restore
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}