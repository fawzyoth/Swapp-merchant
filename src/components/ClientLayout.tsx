import { ReactNode } from 'react';
import ClientSidebar from './ClientSidebar';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <ClientSidebar />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
