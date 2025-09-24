'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, History } from 'lucide-react';

export function MainNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const websiteUrl = searchParams.get('websiteUrl');

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/reports', label: 'Reports', icon: FileText },
    { href: `/activity${websiteUrl ? `?websiteUrl=${encodeURIComponent(websiteUrl)}` : ''}`, label: 'Activity', icon: History },
  ];

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href.split('?')[0]}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
