import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    ChevronUp,
    ChevronsUpDown,
    Filter,
    Search,
    Trophy,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

interface Sport {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    created_at: string;
    courts_count: number;
}

interface SportsProps {
    sports: Sport[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Sports',
        href: '/sports',
    },
];

type SortKey = 'name' | 'slug' | 'courts_count' | 'created_at';
type SortConfig = {
    key: SortKey;
    direction: 'asc' | 'desc';
} | null;

export default function Sports({ sports }: SportsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    // Apply filters and sorting
    const filteredAndSortedSports = useMemo(() => {
        let result = [...sports];

        // 1. Search filter
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            result = result.filter(
                (sport) =>
                    sport.name.toLowerCase().includes(query) ||
                    sport.slug.toLowerCase().includes(query),
            );
        }

        // 2. Sorting
        if (sortConfig !== null) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null)
                    return sortConfig.direction === 'asc' ? -1 : 1;
                if (bValue === null)
                    return sortConfig.direction === 'asc' ? 1 : -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [sports, searchTerm, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'asc'
        ) {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return (
                <ChevronsUpDown className="ml-1 h-3 w-3 opacity-30 transition-opacity group-hover:opacity-100" />
            );
        }
        return (
            <ChevronUp
                className={`ml-1 h-3 w-3 text-padel-green-dark transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}
            />
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sports Management" />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8">
                {/* ═══════════ Header Section ═══════════ */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Manajemen Olahraga
                        </h1>
                        <p className="text-sm text-slate-500">
                            Kelola jenis olahraga dan lihat jumlah lapangan yang
                            tersedia.
                        </p>
                    </div>
                </div>

                {/* ═══════════ 2. Interactive Data Table ═══════════ */}
                <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {/* Header Toolbar */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-padel-green-dark" />
                            <h2 className="text-sm font-semibold text-slate-900">
                                Daftar Olahraga
                            </h2>
                            <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                {filteredAndSortedSports.length} total
                            </span>
                        </div>

                        {/* Search and Filter Group */}
                        <div className="flex flex-1 items-center gap-3 sm:max-w-md sm:justify-end">
                            {/* Search Input */}
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari olahraga..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full rounded-lg border-slate-200 bg-white py-2 pr-4 pl-9 text-sm shadow-sm focus:border-padel-green-dark focus:ring-padel-green-dark"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-600">
                                        <button
                                            className="group flex items-center font-semibold focus:outline-none"
                                            onClick={() => handleSort('name')}
                                        >
                                            Nama Olahraga
                                            {getSortIcon('name')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">
                                        <button
                                            className="group flex items-center font-semibold focus:outline-none"
                                            onClick={() => handleSort('slug')}
                                        >
                                            Slug
                                            {getSortIcon('slug')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">
                                        <button
                                            className="group flex items-center font-semibold focus:outline-none"
                                            onClick={() =>
                                                handleSort('courts_count')
                                            }
                                        >
                                            Jumlah Lapangan
                                            {getSortIcon('courts_count')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">
                                        <button
                                            className="group flex items-center font-semibold focus:outline-none"
                                            onClick={() =>
                                                handleSort('created_at')
                                            }
                                        >
                                            Dibuat Pada
                                            {getSortIcon('created_at')}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAndSortedSports.length > 0 ? (
                                    filteredAndSortedSports.map((sport) => (
                                        <tr
                                            key={sport.id}
                                            className="group transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-padel-green-100 bg-padel-green-50 text-padel-green-dark">
                                                        {sport.icon ? (
                                                            // Using dangerouslySetInnerHTML if icon is SVG, or replace logically.
                                                            // For now assuming a text/emoji or generic representation
                                                            <Trophy className="h-5 w-5" />
                                                        ) : (
                                                            <Trophy className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 transition-colors group-hover:text-padel-green-dark">
                                                            {sport.name}
                                                        </div>
                                                        <div className="mt-0.5 font-mono text-xs text-slate-500">
                                                            ID: #{sport.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-slate-600 ring-1 ring-slate-500/10 ring-inset">
                                                    {sport.slug}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                    {sport.courts_count}
                                                    <span className="text-xs font-normal text-slate-400">
                                                        lapangan
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {format(
                                                    new Date(sport.created_at),
                                                    'dd MMM yyyy, HH:mm',
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    /* Empty State */
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                                    <Search className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                                                    Tidak ada olahraga ditemukan
                                                </h3>
                                                <p className="mt-1 max-w-sm text-sm text-slate-500">
                                                    Kami tidak dapat menemukan
                                                    data olahraga yang sesuai
                                                    dengan pencarian{' '}
                                                    <span className="font-semibold text-slate-700">
                                                        "{searchTerm}"
                                                    </span>
                                                    .
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        setSearchTerm('')
                                                    }
                                                    className="mt-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all outline-none hover:bg-slate-50 hover:text-slate-900 focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 active:bg-slate-100"
                                                >
                                                    <Filter className="h-4 w-4" />
                                                    Hapus Pencarian
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
