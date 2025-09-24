import React from 'react';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { MainNav } from '@/components/main-nav';
import { Icons } from '@/components/icons';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-foreground">
            <Icons.logo className="h-6 w-6" />
            <span className="group-data-[collapsible=icon]:hidden">InsightLens</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-secondary/50">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
