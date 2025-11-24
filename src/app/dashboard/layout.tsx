'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/sidebar';
import { useAppSelector } from '@/lib/hooks';
import { selectAuthStatus, selectAuthUser } from '@/features/auth/authSlice';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  /* ───── HOOK’LAR HER ZAMAN ÇALIŞIR ───── */
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const router = useRouter();
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectAuthUser);

  useEffect(() => {
    if (status !== 'loading' && !user) router.replace('/login');
  }, [status, user, router]);

  /* ───── KOŞULLU RENDER ───── */
  if (status === 'loading')
    return (
      <div className="flex h-screen items-center justify-center">
        Yükleniyor…
      </div>
    );

  if (!user) return null; // hook sayısı bozulmaz; yukarıda çağrıldı

  /* ───── NORMAL GÖRÜNÜM ───── */
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col">
        {/* Sticky Mobile Header */}
        <header className="sticky top-0 z-50 lg:hidden flex items-center bg-background border-b px-4 h-16">
          <button
            onClick={() => setSidebarOpen(open => !open)}
            className="p-2 text-gray-700 dark:text-gray-300"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 lg:pl-24 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
