import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ApolloWrapper } from '@/components/ApolloWrapper';
import { Toaster } from '@/components/Toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Document Archive',
  description: 'Document Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloWrapper>
          <Toaster/>
          <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <a href="/" className="text-xl font-bold text-blue-600">
                  📄 DocArchive
                </a>
                <a href="/documents" className="text-gray-600 hover:text-blue-600">
                  Documents
                </a>
                <a href="/archives" className="text-gray-600 hover:text-blue-600">
                  Archives
                </a>
              </div>
              <div className="text-sm text-gray-400">
                {process.env.NODE_ENV === 'development' ? '🔧 Dev' : '🚀 Prod'}
              </div>
            </div>
          </nav>
          {children}
        </ApolloWrapper>
      </body>
    </html>
  );
}