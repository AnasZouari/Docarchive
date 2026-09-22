'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { GET_DOCUMENT_STATS } from '@/lib/queries';
import StatsCards from '@/components/StatsCards';

export default function Home() {
  const { data, loading, error } = useQuery(GET_DOCUMENT_STATS);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading stats: {error.message}</p>
          <p className="text-sm text-gray-500 mt-2">Make sure backend is running on port 9000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📄 Document Archive System
          </h1>
          <p className="text-lg text-gray-600">
            Manage and archive your documents efficiently
          </p>
          <div className="mt-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 inline-block">
            ✅ Connected to backend
          </div>
        </div>

        <StatsCards stats={data?.documentStats} loading={loading} />

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/documents">
            <button className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              📤 View Documents
            </button>
          </Link>
          <Link href="/archives">
            <button className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              📦 View Archives
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}