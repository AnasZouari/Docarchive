'use client';

import toast from 'react-hot-toast';

export default function DocumentList({ documents, onArchive, onDelete }) {
  // Show empty state if no documents
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-gray-500 text-lg font-medium">No documents yet</p>
        <p className="text-gray-400 text-sm mt-1">Upload your first document above!</p>
      </div>
    );
  }

  // Helper: Format date
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

  // Helper: Format file size
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  };

  // Helper: Get file URL
  const getFileUrl = (path) => {
    if (!path) return '#';
    // Clean the path - remove any leading slashes
    const cleanPath = path.replace(/^\/+/, '');
    return `http://localhost:9000/storage/${cleanPath}`;
  };

  // Handle archive with toast notification
  const handleArchive = (id) => {
    if (confirm('📦 Archive this document?')) {
      toast.promise(onArchive(id), {
        loading: 'Archiving...',
        success: '✅ Document archived successfully!',
        error: '❌ Failed to archive document',
      });
    }
  };

  // Handle delete with toast notification
  const handleDelete = (id) => {
    if (confirm('⚠️ Are you sure you want to delete this document? This action cannot be undone.')) {
      toast.promise(onDelete(id), {
        loading: 'Deleting...',
        success: '✅ Document deleted successfully!',
        error: '❌ Failed to delete document',
      });
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      active: 'bg-green-100 text-green-800',
      archived: 'bg-yellow-100 text-yellow-800',
      deleted: 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Get type badge color
  const getTypeBadge = (type) => {
    const typeMap = {
      PDF: 'bg-red-100 text-red-800',
      DOC: 'bg-blue-100 text-blue-800',
      DOCX: 'bg-blue-100 text-blue-800',
      XLS: 'bg-green-100 text-green-800',
      XLSX: 'bg-green-100 text-green-800',
      PPT: 'bg-orange-100 text-orange-800',
      PPTX: 'bg-orange-100 text-orange-800',
      Image: 'bg-purple-100 text-purple-800',
    };
    return typeMap[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Table Header with Count */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">📄 Documents</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {documents.length}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Reference
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {documents.map((doc, index) => (
            <tr 
              key={doc.id} 
              className="hover:bg-gray-50/50 transition-colors duration-150 fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Title */}
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{doc.title || 'Untitled'}</div>
                <div className="text-xs text-gray-400">{doc.file_name || 'No file'}</div>
              </td>

              {/* Reference */}
              <td className="px-6 py-4">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {doc.reference || 'N/A'}
                </code>
              </td>

              {/* Type */}
              <td className="px-6 py-4">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(doc.type)}`}>
                  {doc.type || 'Unknown'}
                </span>
              </td>

              {/* Size */}
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatSize(doc.file_size)}
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(doc.status)}`}>
                  {doc.status || 'Unknown'}
                </span>
              </td>

              {/* Uploaded Date */}
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(doc.created_at)}
              </td>

              {/* Actions */}
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {/* Download Button */}
                  {doc.file_path && (
                    <a
                      href={getFileUrl(doc.file_path)}
                      download={doc.file_name || 'document'}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download file"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  )}

                  {/* Archive Button (only for active documents) */}
                  {doc.status === 'active' && (
                    <button
                      onClick={() => handleArchive(doc.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-xs font-medium transition-colors"
                      title="Archive document"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Archive
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                    title="Delete document"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Table Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/50">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Total: <span className="font-medium">{documents.length}</span> documents
          </span>
          <span className="text-xs text-gray-400">
            Last updated: {formatDate(new Date().toISOString())}
          </span>
        </div>
      </div>
    </div>
  );
}