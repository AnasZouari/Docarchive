'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_DOCUMENT } from '@/lib/mutations';
import toast from 'react-hot-toast';

interface UploadFormProps {
  onUpload: () => void;
}

export default function UploadForm({ onUpload }: UploadFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('PDF');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createDocument, { loading }] = useMutation(CREATE_DOCUMENT);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setUploadProgress(20);
      
      await createDocument({
        variables: { title, type, file },
      });
      
      setUploadProgress(100);
      toast.success('✅ Document uploaded successfully!');
      
      setTitle('');
      setFile(null);
      onUpload();
      
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      setTimeout(() => setUploadProgress(0), 2000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document: ' + (error as Error).message);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4">📤 Upload New Document</h2>
      
      {/* Progress Bar */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
        </div>
      )}
      
      {uploadProgress === 100 && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          ✅ Upload complete!
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          required
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option>PDF</option>
          <option>DOC</option>
          <option>DOCX</option>
          <option>XLS</option>
          <option>XLSX</option>
          <option>PPT</option>
          <option>PPTX</option>
          <option>Image</option>
          <option>Other</option>
        </select>
        <div>
          <input
            id="file-input"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 w-full"
            required
          />
          {file && (
            <p className="text-xs text-gray-500 mt-1">
              📎 {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '⏳ Uploading...' : '📤 Upload Document'}
      </button>
    </form>
  );
}