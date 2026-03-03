import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, MapPin, Trophy, Box } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import courts from '@/routes/courts';
import facilities from '@/routes/facilities';
import sports from '@/routes/sports';
import venues from '@/routes/venues';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Olahraga',
        href: sports.index(),
        icon: Trophy,
    },
    {
        title: 'Tempat',
        href: venues.index(),
        icon: MapPin,
    },
    {
        title: 'Lapangan',
        href: courts.index(),
        icon: Box,
    },
    {
        title: 'Fasilitas',
        href: facilities.index(),
        icon: Box,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repositori',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Dokumentasi',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="flex flex-row items-center justify-between">
                        <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                                <Link href={dashboard()} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </div>
                        <SidebarTrigger className="shrink-0 text-slate-400 hover:text-padel-green group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8" />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
