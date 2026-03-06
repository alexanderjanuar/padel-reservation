import { Head, Link, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Users,
    CalendarDays,
    MapPin,
    DollarSign,
    Activity,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Clock,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Filter,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
];

type RecentBooking = {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    total_price: number;
    created_at: string;
    user: {
        id: number;
        name: string;
    };
    court: {
        id: number;
        name: string;
        venue: {
            id: number;
            name: string;
            city: string;
        };
    };
};

type ChartData = {
    date: string;
    [key: string]: string | number;
};

type Props = {
    stats: {
        totalUsers: number;
        userTrend: number;
        totalBookings: number;
        bookingTrend: number;
        totalVenues: number;
        venueTrend: number;
        totalRevenue: number;
        revenueTrend: number;
    };
    chartData: {
        users: ChartData[];
        venues: ChartData[];
        revenue: ChartData[];
        bookings: ChartData[];
    };
    recentBookings: RecentBooking[];
};

type SortKey =
    | 'user.name'
    | 'court.venue.name'
    | 'date'
    | 'total_price'
    | 'status';

type SortConfig = {
    key: SortKey;
    direction: 'asc' | 'desc';
} | null;

export default function AdminDashboard({
    stats,
    chartData,
    recentBookings,
}: Props) {
    const { auth } = usePage().props;

    // --- State Management for Interactive Table ---
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'date',
        direction: 'desc',
    });

    // --- Derived Data using useMemo ---
    const filteredAndSortedBookings = useMemo(() => {
        let result = [...recentBookings];

        // 1. Text Search Filter (User, Venue, or Court)
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(
                (booking) =>
                    booking.user.name.toLowerCase().includes(lowerQuery) ||
                    booking.court.venue.name
                        .toLowerCase()
                        .includes(lowerQuery) ||
                    booking.court.name.toLowerCase().includes(lowerQuery) ||
                    booking.id.toString().includes(lowerQuery),
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(
                (booking) => booking.status === statusFilter,
            );
        }

        // 3. Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                // Extract nested values based on sort key
                switch (sortConfig.key) {
                    case 'user.name':
                        aValue = a.user.name;
                        bValue = b.user.name;
                        break;
                    case 'court.venue.name':
                        aValue = `${a.court.venue.name} ${a.court.name}`;
                        bValue = `${b.court.venue.name} ${b.court.name}`;
                        break;
                    case 'date':
                        // Combine date and time for absolute sorting
                        aValue = `${a.date}T${a.start_time}`;
                        bValue = `${b.date}T${b.start_time}`;
                        break;
                    default:
                        aValue = a[sortConfig.key as keyof RecentBooking];
                        bValue = b[sortConfig.key as keyof RecentBooking];
                }

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
    }, [recentBookings, searchQuery, statusFilter, sortConfig]);

    const handleSort = (key: SortKey) => {
        setSortConfig((current) => {
            if (current && current.key === key) {
                // Toggle direction
                return {
                    key,
                    direction: current.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            // Default to ascending for new sort key (or descending for dates)
            return { key, direction: key === 'date' ? 'desc' : 'asc' };
        });
    };

    // --- Formatters and Helpers ---
    const formatTime = (time: string) => time.substring(0, 5);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: RecentBooking['status']) => {
        const styles = {
            confirmed: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
            pending: 'bg-amber-100 text-amber-700 ring-amber-600/20',
            completed: 'bg-blue-100 text-blue-700 ring-blue-600/20',
            cancelled: 'bg-red-100 text-red-700 ring-red-600/20',
        };

        const labels = {
            confirmed: 'Dikonfirmasi',
            pending: 'Menunggu',
            completed: 'Selesai',
            cancelled: 'Dibatalkan',
        };

        return (
            <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
            >
                {labels[status]}
            </span>
        );
    };

    const renderSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return (
                <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
            );
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="ml-1 h-3.5 w-3.5 text-pink-600" />
        ) : (
            <ChevronDown className="ml-1 h-3.5 w-3.5 text-pink-600" />
        );
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                    <p className="mb-1 text-sm font-medium text-slate-500">
                        {label}
                    </p>
                    <p className="text-base font-bold text-slate-900">
                        {payload[0].dataKey === 'revenue'
                            ? formatCurrency(payload[0].value)
                            : `${payload[0].value} Reservasi`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 md:p-8">
                {/* ═══════════ Header Section ═══════════ */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Ringkasan Platform
                    </h1>
                    <p className="text-sm text-slate-500">
                        Pantau reservasi, tren pendapatan, dan aktivitas terkini
                        di seluruh fasilitas padel Anda.
                    </p>
                </div>

                {/* ═══════════ 1. Platform Quick Stats ═══════════ */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Stat Card 1: Users */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-30">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={chartData.users}
                                    margin={{
                                        top: 0,
                                        right: 0,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorUsers"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0.8}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorUsers)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 rounded-full bg-blue-50/50 p-8 transition-transform group-hover:scale-110">
                            <Users className="h-6 w-6 text-blue-500 opacity-50" />
                        </div>
                        <div className="relative z-10">
                            <div className="mb-3 flex items-center justify-between text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <p className="mt-0.5 text-xs leading-none font-semibold tracking-wider uppercase">
                                        Total Pengguna
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                                <span className="text-3xl font-bold tracking-tight text-slate-900">
                                    {stats.totalUsers}
                                </span>
                                <span
                                    className={`flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${stats.userTrend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                                >
                                    {stats.userTrend >= 0 ? (
                                        <TrendingUp className="mr-1 h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="mr-1 h-3 w-3" />
                                    )}
                                    {Math.abs(stats.userTrend)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 2: Revenue */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-30">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={chartData.revenue}
                                    margin={{
                                        top: 0,
                                        right: 0,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorRevCard"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#10b981"
                                                stopOpacity={0.8}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#10b981"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevCard)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 rounded-full bg-emerald-50/50 p-8 transition-transform group-hover:scale-110">
                            <DollarSign className="h-6 w-6 text-emerald-500 opacity-50" />
                        </div>
                        <div className="relative z-10">
                            <div className="mb-3 flex items-center justify-between text-slate-500">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    <p className="mt-0.5 text-xs leading-none font-semibold tracking-wider uppercase">
                                        Total Pendapatan
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                                <span className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                    {formatCurrency(stats.totalRevenue)}
                                </span>
                                <span
                                    className={`flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${stats.revenueTrend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                                >
                                    {stats.revenueTrend >= 0 ? (
                                        <TrendingUp className="mr-1 h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="mr-1 h-3 w-3" />
                                    )}
                                    {Math.abs(stats.revenueTrend)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 3: Bookings */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-pink-200 hover:shadow-md">
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-30">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={chartData.bookings}
                                    margin={{
                                        top: 0,
                                        right: 0,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorBookCard"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#ec4899"
                                                stopOpacity={0.8}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#ec4899"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#ec4899"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorBookCard)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 rounded-full bg-pink-50/50 p-8 transition-transform group-hover:scale-110">
                            <CalendarDays className="h-6 w-6 text-pink-500 opacity-50" />
                        </div>
                        <div className="relative z-10">
                            <div className="mb-3 flex items-center justify-between text-slate-500">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    <p className="mt-0.5 text-xs leading-none font-semibold tracking-wider uppercase">
                                        Total Reservasi
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                                <span className="text-3xl font-bold tracking-tight text-slate-900">
                                    {stats.totalBookings}
                                </span>
                                <span
                                    className={`flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${stats.bookingTrend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                                >
                                    {stats.bookingTrend >= 0 ? (
                                        <TrendingUp className="mr-1 h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="mr-1 h-3 w-3" />
                                    )}
                                    {Math.abs(stats.bookingTrend)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 4: Venues */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-purple-200 hover:shadow-md">
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-30">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={chartData.venues}
                                    margin={{
                                        top: 0,
                                        right: 0,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorVenueCard"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#a855f7"
                                                stopOpacity={0.8}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#a855f7"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#a855f7"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorVenueCard)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 rounded-full bg-purple-50/50 p-8 transition-transform group-hover:scale-110">
                            <MapPin className="h-6 w-6 text-purple-500 opacity-50" />
                        </div>
                        <div className="relative z-10">
                            <div className="mb-3 flex items-center justify-between text-slate-500">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <p className="mt-0.5 text-xs leading-none font-semibold tracking-wider uppercase">
                                        Total Lapangan
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                                <span className="text-3xl font-bold tracking-tight text-slate-900">
                                    {stats.totalVenues}
                                </span>
                                <span
                                    className={`flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${stats.venueTrend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                                >
                                    {stats.venueTrend >= 0 ? (
                                        <TrendingUp className="mr-1 h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="mr-1 h-3 w-3" />
                                    )}
                                    {Math.abs(stats.venueTrend)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ 2. Analytics Charts ═══════════ */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Revenue Trend Area Chart */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5 p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    Revenue Graph (7 Hari Terakhir)
                                </h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData.revenue}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="colorRevenue"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#10b981"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#10b981"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#e2e8f0"
                                        />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: '#64748b',
                                                fontSize: 12,
                                            }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: '#64748b',
                                                fontSize: 12,
                                            }}
                                            tickFormatter={(value) =>
                                                `Rp ${value / 1000}k`
                                            }
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            activeDot={{
                                                r: 6,
                                                fill: '#10b981',
                                                stroke: '#fff',
                                                strokeWidth: 2,
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Bookings Trend Bar Chart */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5 p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                                    <BarChart3 className="h-4 w-4 text-pink-500" />
                                    Reservasi Graph (7 Hari Terakhir)
                                </h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData.bookings}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                        barSize={32}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#e2e8f0"
                                        />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: '#64748b',
                                                fontSize: 12,
                                            }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: '#64748b',
                                                fontSize: 12,
                                            }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            content={<CustomTooltip />}
                                            cursor={{ fill: '#f1f5f9' }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="#ec4899"
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ 3. Recent Platform Activity (Interactive Table) ═══════════ */}
                <div className="flex flex-col gap-6">
                    {/* Header Controls */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-100 bg-pink-50 text-pink-600">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg leading-tight font-bold text-slate-900">
                                    Transaksi Terkini
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {filteredAndSortedBookings.length} reservasi
                                    ditemukan
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 sm:flex-row">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full appearance-none rounded-xl border-0 bg-slate-50/50 py-2 pr-3 pl-9 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-pink-600 focus:ring-inset"
                                    placeholder="Cari user, venue, id..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>

                            {/* Status Filter Dropdown / Select equivalent styling */}
                            <div className="relative flex w-full items-center gap-2 sm:w-auto">
                                <Filter className="hidden h-4 w-4 text-slate-400 sm:block" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="block w-full cursor-pointer appearance-none rounded-xl border-0 bg-slate-50/50 py-2 pr-10 pl-3 text-sm text-slate-900 ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-pink-600 focus:ring-inset"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="pending">Menunggu</option>
                                    <option value="confirmed">
                                        Dikonfirmasi
                                    </option>
                                    <option value="completed">Selesai</option>
                                    <option value="cancelled">
                                        Dibatalkan
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm whitespace-nowrap">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">
                                            <button
                                                className="group flex items-center focus:text-pink-600 focus:outline-none"
                                                onClick={() =>
                                                    handleSort('user.name')
                                                }
                                            >
                                                Pelanggan{' '}
                                                {renderSortIcon('user.name')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-6 py-4">
                                            <button
                                                className="group flex items-center focus:text-indigo-600 focus:outline-none"
                                                onClick={() =>
                                                    handleSort(
                                                        'court.venue.name',
                                                    )
                                                }
                                            >
                                                Venue & Lapangan{' '}
                                                {renderSortIcon(
                                                    'court.venue.name',
                                                )}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-6 py-4">
                                            <button
                                                className="group flex items-center focus:text-indigo-600 focus:outline-none"
                                                onClick={() =>
                                                    handleSort('date')
                                                }
                                            >
                                                Jadwal {renderSortIcon('date')}
                                            </button>
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-right"
                                        >
                                            <button
                                                className="group flex w-full items-center justify-end focus:text-indigo-600 focus:outline-none"
                                                onClick={() =>
                                                    handleSort('total_price')
                                                }
                                            >
                                                Harga{' '}
                                                {renderSortIcon('total_price')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-6 py-4">
                                            <button
                                                className="group flex w-full items-center justify-center focus:text-indigo-600 focus:outline-none"
                                                onClick={() =>
                                                    handleSort('status')
                                                }
                                            >
                                                Status{' '}
                                                {renderSortIcon('status')}
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredAndSortedBookings.length > 0 ? (
                                        filteredAndSortedBookings.map(
                                            (booking) => (
                                                <tr
                                                    key={booking.id}
                                                    className="group transition-colors hover:bg-slate-50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                                                            <span>
                                                                {
                                                                    booking.user
                                                                        .name
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-800">
                                                            {
                                                                booking.court
                                                                    .venue.name
                                                            }
                                                        </div>
                                                        <div className="mt-0.5 text-xs text-slate-500">
                                                            {booking.court.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-800">
                                                            {format(
                                                                parseISO(
                                                                    booking.date,
                                                                ),
                                                                'dd MMM yyyy',
                                                                { locale: id },
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                                            <Clock className="h-3 w-3" />
                                                            {formatTime(
                                                                booking.start_time,
                                                            )}{' '}
                                                            -{' '}
                                                            {formatTime(
                                                                booking.end_time,
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                                                            {formatCurrency(
                                                                booking.total_price,
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {getStatusBadge(
                                                            booking.status,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-16 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
                                                        <Search className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <h3 className="mb-1 text-base font-semibold text-slate-900">
                                                        Pencarian Tidak
                                                        Ditemukan
                                                    </h3>
                                                    <p className="mx-auto max-w-sm text-sm text-slate-500">
                                                        Tidak ada data transaksi
                                                        yang cocok dengan filter
                                                        atau kata kunci yang
                                                        dimasukkan.
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            setSearchQuery('');
                                                            setStatusFilter(
                                                                'all',
                                                            );
                                                        }}
                                                        className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        Reset Filter
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Table Footer */}
                        {filteredAndSortedBookings.length > 0 && (
                            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                                <p className="text-xs text-slate-500">
                                    Menampilkan{' '}
                                    {filteredAndSortedBookings.length} data
                                    transaksi berdasarkan kriteria pencarian.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
