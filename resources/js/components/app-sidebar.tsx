import { Link } from '@inertiajs/react';
import { BookOpen, Dumbbell, ExternalLink, Github, Grid2x2, LayoutGrid, MapPin, Sparkles } from 'lucide-react';
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
        icon: Dumbbell,
    },
    {
        title: 'Tempat',
        href: venues.index(),
        icon: MapPin,
    },
    {
        title: 'Lapangan',
        href: courts.index(),
        icon: Grid2x2,
    },
    {
        title: 'Fasilitas',
        href: facilities.index(),
        icon: Sparkles,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repositori',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Github,
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

                {/* Lapangan CTA Button */}
                <div className="px-3 py-2 group-data-[collapsible=icon]:px-2">
                    <Link
                        href={courts.index()}
                        prefetch
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-padel-green px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:brightness-110 active:scale-95 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-2"
                    >
                        <Grid2x2 className="size-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">
                            Buat Reservasi
                        </span>
                        <ExternalLink className="size-3 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden" />
                    </Link>
                </div>
                <NavMain items={mainNavItems} />

            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
