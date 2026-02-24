import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    ChevronUp,
    ChevronDown,
    Filter,
    Search,
    Download,
    Plus,
    Trophy,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    HelpCircle,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { store, update, destroy } from '@/routes/facilities';

interface Facility {
    id: number;
    name: string;
    icon: string | null;
    created_at: string;
    venues_count: number;
}

interface FacilitiesProps {
    facilities: Facility[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Analitik Fasilitas',
        href: '/facilities',
    },
];

type SortKey = 'name' | 'venues_count' | 'created_at';
type SortConfig = {
    key: SortKey;
    direction: 'asc' | 'desc';
} | null;

const DynamicIcon = ({ name, className }: { name: string | null; className?: string }) => {
    if (!name) return <HelpCircle className={className} />;

    // Attempt to dynamically load the icon from LucideIcons
    const IconComponent = (LucideIcons as any)[name];
    if (!IconComponent) return <HelpCircle className={className} />;

    return <IconComponent className={className} />;
};

const IconPicker = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Extract all valid icon names to search against
    const allIconNames = useMemo(() => {
        return Object.keys(LucideIcons).filter(key =>
            key !== 'createLucideIcon' &&
            key !== 'Icon' &&
            key !== 'LucideIcon' &&
            key !== 'LucideProps' &&
            /^[A-Z]/.test(key)
        );
    }, []);

    const filteredIcons = useMemo(() => {
        if (!searchQuery) {
            // Curated list of common facility/sports related icons for default view
            const popularIcons = [
                'Activity', 'Award', 'BadgeCheck', 'Bath', 'Battery', 'Bell', 'Bike', 'Book',
                'Box', 'Briefcase', 'Building', 'Car', 'CheckCircle', 'Clock', 'Coffee',
                'CreditCard', 'DoorClosed', 'Droplets', 'Dumbbell', 'Flame', 'Gamepad2',
                'Heart', 'Home', 'Info', 'Key', 'Lock', 'MapPin', 'Monitor', 'Moon',
                'Music', 'Navigation', 'Package', 'Phone', 'Radio', 'Search', 'Settings',
                'Shield', 'ShoppingBag', 'ShowerHead', 'Smartphone', 'Snowflake', 'Speaker',
                'Star', 'Store', 'Sun', 'Tent', 'Ticket', 'TreePine', 'Trophy', 'Tv',
                'Users', 'Utensils', 'Video', 'Volume2', 'Wifi', 'Wind', 'Zap'
            ];
            return popularIcons.filter(name => allIconNames.includes(name));
        }

        // Search across all icons and limit to 100 to prevent rendering lag
        return allIconNames.filter(name =>
            name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 100);
    }, [searchQuery, allIconNames]);

    return (
        <div className="relative mt-2">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:border-padel-green focus:ring-1 focus:ring-padel-green focus:outline-none"
            >
                <div className="flex items-center gap-3">
                    <DynamicIcon name={value} className="h-5 w-5 text-padel-green-dark" />
                    <span>{value || 'Pilih Ikon...'}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute top-12 left-0 z-50 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="relative mb-3">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full rounded-lg border-0 py-2 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-padel-green sm:text-sm sm:leading-6"
                            placeholder="Cari ikon... (msl. Wifi)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Prevent toggling the dropdown
                        />
                    </div>
                    <div className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto p-1">
                        {filteredIcons.map((iconName) => {
                            const IconComponent = (LucideIcons as any)[iconName];
                            if (!IconComponent) return null;
                            return (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => {
                                        onChange(iconName);
                                        setIsOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className={cn(
                                        "flex aspect-square items-center justify-center rounded-lg border transition-all hover:bg-padel-green-50 hover:text-padel-green-dark focus:outline-none",
                                        value === iconName
                                            ? "border-padel-green bg-padel-green-50 text-padel-green-dark"
                                            : "border-transparent text-slate-600"
                                    )}
                                    title={iconName}
                                >
                                    <IconComponent className="h-5 w-5" />
                                </button>
                            );
                        })}
                        {filteredIcons.length === 0 && (
                            <div className="col-span-6 py-4 text-center text-sm text-slate-500">
                                Ikon tidak ditemukan.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Facilities({ facilities }: FacilitiesProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [linesPerPage, setLinesPerPage] = useState(10);
    const [filterOption, setFilterOption] = useState<
        'all' | 'has_venues' | 'no_venues'
    >('all');
    const [isStatsVisible, setIsStatsVisible] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { flash = {} } = usePage().props as any;

    // Form logic setup
    const form = useForm({
        name: '',
        icon: '',
    });

    const submitCreateFacility = (e: React.FormEvent) => {
        e.preventDefault();

        form.submit(store(), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                form.reset();
                form.clearErrors();
            },
        });
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [facilityToEdit, setFacilityToEdit] = useState<Facility | null>(null);
    const editForm = useForm({ name: '', icon: '' });

    const openEditModal = (facility: Facility) => {
        setFacilityToEdit(facility);
        editForm.setData({
            name: facility.name,
            icon: facility.icon || '',
        });
        setIsEditModalOpen(true);
    };

    const submitEditFacility = (e: React.FormEvent) => {
        e.preventDefault();
        if (!facilityToEdit) return;

        editForm.submit(update({ facility: facilityToEdit.id }), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                editForm.reset();
                editForm.clearErrors();
            },
        });
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null);
    const deleteForm = useForm({});

    const openDeleteModal = (facility: Facility) => {
        setFacilityToDelete(facility);
        setIsDeleteModalOpen(true);
    };

    const submitDeleteFacility = (e: React.FormEvent) => {
        e.preventDefault();
        if (!facilityToDelete) return;

        deleteForm.submit(destroy({ facility: facilityToDelete.id }), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
            },
        });
    };

    // Filter Logic
    const filteredFacilities = useMemo(() => {
        let result = [...facilities];

        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            result = result.filter((facility) =>
                facility.name.toLowerCase().includes(query)
            );
        }

        if (filterOption === 'has_venues') {
            result = result.filter((facility) => facility.venues_count > 0);
        } else if (filterOption === 'no_venues') {
            result = result.filter((facility) => facility.venues_count === 0);
        }

        return result;
    }, [facilities, searchTerm, filterOption]);

    // Sorting Logic
    const filteredAndSortedFacilities = useMemo(() => {
        let result = [...filteredFacilities];

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
    }, [filteredFacilities, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredAndSortedFacilities.length / linesPerPage);
    const paginatedFacilities = useMemo(() => {
        const start = (currentPage - 1) * linesPerPage;
        return filteredAndSortedFacilities.slice(start, start + linesPerPage);
    }, [filteredAndSortedFacilities, currentPage, linesPerPage]);

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
                <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-40" />
            );
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="ml-1 h-3.5 w-3.5 text-slate-800 transition-transform" />
        ) : (
            <ChevronDown className="ml-1 h-3.5 w-3.5 text-slate-800 transition-transform" />
        );
    };

    // Calculate aggregated stats
    const totalFacilities = facilities.length;
    const totalLinkedVenues = facilities.reduce(
        (sum, facility) => sum + facility.venues_count,
        0,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analitik Fasilitas" />

            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-1 flex-col gap-4 bg-white p-4 md:gap-6 md:p-8">
                {/* ═══════════ Header Stats Section ═══════════ */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Analitik Fasilitas
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        Navigasi Data untuk Keputusan Produk yang Terinformasi{' '}
                        <button
                            className="ml-1 inline-flex items-center font-semibold text-slate-800 transition-colors hover:text-slate-900 focus:outline-none"
                            onClick={() => setIsStatsVisible(!isStatsVisible)}
                        >
                            {isStatsVisible
                                ? 'Sembunyikan data'
                                : 'Tampilkan data'}
                            <ChevronUp
                                className={cn(
                                    'ml-1 h-4 w-4 transition-transform duration-300',
                                    !isStatsVisible && 'rotate-180',
                                )}
                            />
                        </button>
                    </p>
                </div>

                <div
                    className={cn(
                        'grid overflow-hidden transition-all duration-500 ease-in-out',
                        isStatsVisible
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0',
                    )}
                >
                    <div className="min-h-0">
                        <div className="grid grid-cols-1 gap-6 border-t border-b border-slate-200 py-6 md:grid-cols-2 md:gap-8">
                            <div className="flex flex-col">
                                <span className="mb-2 text-xs font-semibold text-slate-500">
                                    Total Fasilitas
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-semibold tracking-tight text-slate-900">
                                        {totalFacilities}
                                    </span>
                                </div>
                                <span className="mt-2 text-xs font-medium text-slate-400">
                                    Semua fasilitas terdaftar
                                </span>
                            </div>
                            <div className="flex flex-col border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                                <span className="mb-2 text-xs font-semibold text-slate-500">
                                    Total Tempat Terhubung
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-semibold tracking-tight text-slate-900">
                                        {totalLinkedVenues}
                                    </span>
                                </div>
                                <span className="mt-2 text-xs font-medium text-slate-400">
                                    Total asosiasi tempat dengan fasilitas
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ Action Toolbar ═══════════ */}
                <div className="flex flex-col justify-end gap-3 py-2 sm:flex-row sm:items-center sm:gap-4">
                    {/* Action Buttons */}
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <div className="group relative flex w-full items-center sm:w-auto">
                            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari fasilitas..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to page 1 on search
                                }}
                                className="h-9 w-full rounded-full border border-slate-200/80 bg-white pr-4 pl-9 text-sm focus:border-padel-green-dark focus:ring-padel-green-dark sm:w-64"
                            />
                        </div>
                        <div className="flex w-full gap-2 sm:w-auto">
                            <div className="relative flex h-9 flex-1 items-center sm:flex-none">
                                <Filter className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                                <select
                                    value={filterOption}
                                    onChange={(e) => {
                                        setFilterOption(e.target.value as any);
                                        setCurrentPage(1);
                                    }}
                                    className="h-full w-full appearance-none rounded-full border border-slate-200/80 bg-white py-0 pr-8 pl-9 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:border-padel-green-dark focus:ring-padel-green-dark sm:w-auto"
                                >
                                    <option value="all">Semua Data</option>
                                    <option value="has_venues">
                                        Ada Tempat
                                    </option>
                                    <option value="no_venues">
                                        Belum Ada Tempat
                                    </option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
                            </div>
                            <Dialog
                                open={isCreateModalOpen}
                                onOpenChange={(open) => {
                                    setIsCreateModalOpen(open);
                                    if (!open) {
                                        form.reset();
                                        form.clearErrors();
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-padel-green bg-padel-green text-sm font-medium text-white shadow-sm transition-all hover:bg-padel-green-dark hover:shadow-md sm:flex-none sm:px-4">
                                        <Plus className="h-4 w-4" />
                                        Buat Fasilitas
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-white sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle className="font-heading text-xl">
                                            Buat Fasilitas Baru
                                        </DialogTitle>
                                        <DialogDescription>
                                            Tambahkan kategori fasilitas baru ke
                                            sistem. Nama fasilitas harus unik.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form
                                        onSubmit={submitCreateFacility}
                                        className="mt-4 flex flex-col gap-6"
                                    >
                                        <div className="group relative">
                                            <input
                                                id="name"
                                                type="text"
                                                name="name"
                                                required
                                                autoFocus
                                                value={form.data.name}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder=" "
                                                className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                            />
                                            <label
                                                htmlFor="name"
                                                className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                            >
                                                Nama Fasilitas
                                            </label>
                                            <InputError
                                                message={form.errors.name}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[13px] font-semibold tracking-wide text-slate-500 uppercase">
                                                Ikon Fasilitas
                                            </label>
                                            <IconPicker
                                                value={form.data.icon}
                                                onChange={(val) => form.setData('icon', val)}
                                            />
                                            <InputError
                                                message={form.errors.icon}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="mt-2 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsCreateModalOpen(false)
                                                }
                                                className="flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={form.processing}
                                                className="relative flex h-10 items-center justify-center rounded-lg bg-padel-green px-6 text-sm font-medium text-white shadow-sm shadow-padel-green/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-padel-green-dark hover:shadow-md hover:shadow-padel-green/40 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:hover:-translate-y-0 disabled:active:scale-100"
                                            >
                                                <span className="relative flex items-center justify-center text-center">
                                                    {form.processing ? (
                                                        <Spinner className="h-5 w-5" />
                                                    ) : (
                                                        'Simpan Fasilitas'
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* ═══════════ Interactive Data Table ═══════════ */}
                <div className="flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200/80">
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        <button
                                            className="group flex items-center transition-colors hover:text-slate-900 focus:outline-none"
                                            onClick={() => handleSort('name')}
                                        >
                                            Nama Fasilitas
                                            {getSortIcon('name')}
                                        </button>
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        Ikon
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        <button
                                            className="group flex items-center transition-colors hover:text-slate-900 focus:outline-none"
                                            onClick={() =>
                                                handleSort('venues_count')
                                            }
                                        >
                                            Jumlah Tempat
                                            {getSortIcon('venues_count')}
                                        </button>
                                    </th>
                                    <th className="px-5 py-4 text-right text-[10px] font-light tracking-wide text-slate-600">
                                        <div className="flex justify-end">
                                            <button
                                                className="group flex items-center justify-end transition-colors hover:text-slate-900 focus:outline-none"
                                                onClick={() =>
                                                    handleSort('created_at')
                                                }
                                            >
                                                Dibuat Pada
                                                {getSortIcon('created_at')}
                                            </button>
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        <div className="flex justify-end">
                                            Aksi
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {paginatedFacilities.length > 0 ? (
                                    paginatedFacilities.map((facility) => {
                                        return (
                                            <tr
                                                key={facility.id}
                                                className="group transition-colors outline-none hover:bg-slate-50/40"
                                            >
                                                <td className="min-w-[300px] px-5 py-4">
                                                    <span className="font-base truncate text-slate-700 transition-colors group-hover:text-slate-900">
                                                        {facility.name}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name={facility.icon} className="h-5 w-5 text-padel-green-dark" />
                                                        <span className="font-base text-[14px] text-slate-700">
                                                            {facility.icon || 'Tidak ada'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-base rounded-md bg-padel-green-50 px-2.5 py-1 text-[14px] text-padel-green-dark">
                                                        {facility.venues_count}{' '}
                                                        Tempat
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right text-[13px] font-medium text-slate-600">
                                                    {format(
                                                        new Date(
                                                            facility.created_at,
                                                        ),
                                                        'dd MMM yyyy',
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    facility,
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    facility,
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                                                    <Search className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <h3 className="mb-1 text-sm font-semibold text-slate-900">
                                                    Tidak ada fasilitas ditemukan
                                                </h3>
                                                <p className="text-[13px] text-slate-500">
                                                    Sesuaikan pencarian atau
                                                    filter Anda untuk menemukan
                                                    data.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <span className="text-[13px] text-slate-500">
                            Menampilkan:{' '}
                            <span className="font-semibold text-slate-700">
                                {(currentPage - 1) * linesPerPage + 1} -{' '}
                                {Math.min(
                                    currentPage * linesPerPage,
                                    filteredAndSortedFacilities.length,
                                )}
                            </span>{' '}
                            of {filteredAndSortedFacilities.length}
                        </span>

                        <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:gap-6">
                            <div className="flex flex-wrap items-center justify-center gap-1">
                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(prev - 1, 1),
                                        )
                                    }
                                    disabled={
                                        currentPage === 1 || totalPages === 0
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalPages }).map(
                                    (_, idx) => {
                                        const pageNumber = idx + 1;
                                        // Handle ellipsis logic if many pages, but simple version for now
                                        if (totalPages > 5) {
                                            if (
                                                pageNumber !== 1 &&
                                                pageNumber !== totalPages &&
                                                Math.abs(
                                                    currentPage - pageNumber,
                                                ) > 1
                                            ) {
                                                if (
                                                    pageNumber === 2 ||
                                                    pageNumber ===
                                                    totalPages - 1
                                                ) {
                                                    return (
                                                        <span
                                                            key={pageNumber}
                                                            className="flex h-8 w-8 items-center justify-center text-slate-400"
                                                        >
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            }
                                        }

                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() =>
                                                    setCurrentPage(pageNumber)
                                                }
                                                className={cn(
                                                    'flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors',
                                                    currentPage === pageNumber
                                                        ? 'border border-slate-200 bg-white text-slate-900 shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-50',
                                                )}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    },
                                )}

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(prev + 1, totalPages),
                                        )
                                    }
                                    disabled={
                                        currentPage === totalPages ||
                                        totalPages === 0
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[13px] text-slate-500">
                                    Baris per halaman
                                </span>
                                <select
                                    value={linesPerPage}
                                    onChange={(e) => {
                                        setLinesPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to page 1
                                    }}
                                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 py-0 text-[13px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 focus:border-slate-300 focus:ring-0"
                                >
                                    <option value={5}>5 / halaman</option>
                                    <option value={10}>10 / halaman</option>
                                    <option value={20}>20 / halaman</option>
                                    <option value={50}>50 / halaman</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Facility Modal */}
                <Dialog
                    open={isEditModalOpen}
                    onOpenChange={(open) => {
                        setIsEditModalOpen(open);
                        if (!open) {
                            editForm.reset();
                            editForm.clearErrors();
                        }
                    }}
                >
                    <DialogContent className="bg-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="font-heading text-xl">
                                Edit Fasilitas
                            </DialogTitle>
                            <DialogDescription>
                                Perbarui nama kategori fasilitas ini.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={submitEditFacility}
                            className="mt-4 flex flex-col gap-6"
                        >
                            <div className="group relative">
                                <input
                                    id="edit-name"
                                    type="text"
                                    name="name"
                                    required
                                    autoFocus
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    placeholder=" "
                                    className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                />
                                <label
                                    htmlFor="edit-name"
                                    className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                >
                                    Nama Fasilitas
                                </label>
                                <InputError
                                    message={editForm.errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <label className="text-[13px] font-semibold tracking-wide text-slate-500 uppercase">
                                    Ikon Fasilitas
                                </label>
                                <IconPicker
                                    value={editForm.data.icon}
                                    onChange={(val) => editForm.setData('icon', val)}
                                />
                                <InputError
                                    message={editForm.errors.icon}
                                    className="mt-2"
                                />
                            </div>

                            <DialogFooter className="mt-2 gap-3 sm:gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="relative flex h-10 items-center justify-center rounded-lg bg-padel-green px-6 text-sm font-medium text-white shadow-sm shadow-padel-green/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-padel-green-dark hover:shadow-md hover:shadow-padel-green/40 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:hover:-translate-y-0 disabled:active:scale-100"
                                >
                                    <span className="relative flex items-center justify-center text-center">
                                        {editForm.processing ? (
                                            <Spinner className="h-5 w-5" />
                                        ) : (
                                            'Simpan Perubahan'
                                        )}
                                    </span>
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Facility Modal */}
                <Dialog
                    open={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                >
                    <DialogContent className="bg-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="font-heading text-xl text-red-600">
                                Hapus Fasilitas
                            </DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus{' '}
                                <strong>{facilityToDelete?.name}</strong>? Tindakan
                                ini dapat dibatalkan, namun gagal jika masih
                                memiliki lapangan atau pemesanan yang aktif.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={submitDeleteFacility}
                            className="mt-4 flex flex-col gap-6"
                        >
                            <DialogFooter className="mt-2 flex-col gap-3 sm:flex-row sm:gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteForm.processing}
                                    className="relative flex h-10 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-medium text-white shadow-sm shadow-red-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md hover:shadow-red-600/40 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:hover:-translate-y-0 disabled:active:scale-100"
                                >
                                    <span className="relative flex items-center justify-center text-center">
                                        {deleteForm.processing ? (
                                            <Spinner className="h-5 w-5 text-red-100" />
                                        ) : (
                                            'Hapus Sekarang'
                                        )}
                                    </span>
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
