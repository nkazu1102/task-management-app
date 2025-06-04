import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'タスク管理アプリ',
  description: '効率的なタスク管理のためのWebアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-primary text-white p-4 shadow-md">
            <div className="container mx-auto">
              <h1 className="text-2xl font-bold">タスク管理アプリ</h1>
            </div>
          </header>
          <main className="container mx-auto p-4">
            {children}
          </main>
          <footer className="bg-gray-100 p-4 border-t">
            <div className="container mx-auto text-center text-gray-500">
              <p>© 2024 タスク管理アプリ</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
} 