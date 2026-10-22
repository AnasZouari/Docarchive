import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import Navigation from '@/components/Navigation';
import { ApolloWrapper } from '@/components/ApolloWrapper';
import { Toaster } from '@/components/Toaster';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'archivio',
  description: 'Document management and archiving',
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
          <Toaster />

          <AuthProvider>
            <Navigation>{children}</Navigation>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}