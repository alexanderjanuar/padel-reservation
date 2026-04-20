import { Head } from '@inertiajs/react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    CalendarCheck2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clock3,
    Filter,
    Inbox,
    MapPin,
    Search,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import * as bookingRoutes from '@/routes/bookings';
import type { BreadcrumbItem } from '@/types';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

interface BookingItem {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: BookingStatus;
    total_price: number;
    notes?: string | null;
    created_at?: string | null;
    user: {
        id?: number | null;
        name: string;
        email?: string | null;
        phone?: string | null;
    };
    court: {
        id?: number | null;
        name?: string | null;
        sport: {
            id?: number | null;
            name?: string | null;
        };
        venue: {
            id?: number | null;
            name?: string | null;
            city?: string | null;
        };
    };
    payment: {
        method?: string | null;
        status?: string | null;
    };
}

interface Props {
    bookings: BookingItem[];
    stats: {
        total: number;
        pending: number;
        confirmed: number;
        today: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/dashboard' },
    { title: 'Kelola Booking', href: bookingRoutes.index().url },
];

const statusMeta: Record<BookingStatus, { label: string; badge: string }> = {
    pending: {
        label: 'Menunggu',
        badge: 'bg-amber-100 text-amber-700 ring-amber-600/20',
    },
    confirmed: {
        label: 'Dikonfirmasi',
        badge: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
    },
    completed: {
        label: 'Selesai',
        badge: 'bg-sky-100 text-sky-700 ring-sky-600/20',
    },
    cancelled: {
        label: 'Dibatalkan',
        badge: 'bg-rose-100 text-rose-700 ring-rose-600/20',
    },
};

function fmtCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function fmtDate(date: string) {
    return format(parseISO(date), 'dd MMM yyyy', { locale: idLocale });
}

function fmtDateTime(date?: string | null) {
    if (!date) return '-';
    return format(parseISO(date), 'dd MMM yyyy, HH:mm', { locale: idLocale });
}

export default function AdminBookings({ bookings }: Props) {
    const [rows, setRows] = useState(bookings);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [actingId, setActingId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isStatsVisible, setIsStatsVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [linesPerPage, setLinesPerPage] = useState(10);

    const hasDateFilter = dateFrom !== '' || dateTo !== '';

    const clearDateFilter = () => {
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    const liveStats = useMemo(
        () => ({
            total: rows.length,
            pending: rows.filter((b) => b.status === 'pending').length,
            confirmed: rows.filter((b) => b.status === 'confirmed').length,
            today: rows.filter((b) => b.date === format(new Date(), 'yyyy-MM-dd')).length,
        }),
        [rows],
    );

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return rows.filter((booking) => {
            const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
            if (!matchesStatus) return false;

            if (dateFrom && booking.date < dateFrom) return false;
            if (dateTo && booking.date > dateTo) return false;

            if (!query) return true;
            return [
                booking.id.toString(),
                booking.user.name,
                booking.user.email ?? '',
                booking.user.phone ?? '',
                booking.court.name ?? '',
                booking.court.sport.name ?? '',
                booking.court.venue.name ?? '',
            ].some((v) => v.toLowerCase().includes(query));
        });
    }, [rows, search, statusFilter, dateFrom, dateTo]);

    const totalPages = Math.ceil(filteredRows.length / linesPerPage);

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * linesPerPage;
        return filteredRows.slice(start, start + linesPerPage);
    }, [filteredRows, currentPage, linesPerPage]);

    const runAction = async (bookingId: number, action: 'confirm' | 'cancel') => {
        setActingId(bookingId);
        setFeedback(null);

        try {
            const route =
                action === 'confirm'
                    ? bookingRoutes.confirm({ booking: bookingId })
                    : bookingRoutes.cancel({ booking: bookingId });

            const response = await axios({ url: route.url, method: route.method });

            setRows((current) =>
                current.map((booking) =>
                    booking.id === bookingId
                        ? {
                              ...booking,
                              status: action === 'confirm' ? 'confirmed' : 'cancelled',
                              payment: {
                                  ...booking.payment,
                                  status: action === 'confirm' ? 'paid' : booking.payment.status,
                              },
                          }
                        : booking,
                ),
            );

            setFeedback({
                type: 'success',
                text: response.data?.message ?? 'Status booking berhasil diperbarui.',
            });
        } catch (error: unknown) {
            setFeedback({
                type: 'error',
                text: axios.isAxiosError(error)
                    ? (error.response?.data?.message ?? 'Terjadi kesalahan saat memperbarui booking.')
                    : 'Terjadi kesalahan saat memperbarui booking.',
            });
        } finally {
            setActingId(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Booking" />

            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-1 flex-col gap-4 bg-white p-4 md:gap-6 md:p-8">
                {/* ═══════════ Header ═══════════ */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kelola Booking</h1>
                    <p className="text-sm font-medium text-slate-500">
                        Pantau & kelola semua reservasi lapangan dari satu tempat.{' '}
                        <button
                            className="ml-1 inline-flex items-center font-semibold text-slate-800 transition-colors hover:text-slate-900 focus:outline-none"
                            onClick={() => setIsStatsVisible(!isStatsVisible)}
                        >
                            {isStatsVisible ? 'Sembunyikan data' : 'Tampilkan data'}
                            <ChevronUp
                                className={cn(
                                    'ml-1 h-4 w-4 transition-transform duration-300',
                                    !isStatsVisible && 'rotate-180',
                                )}
                            />
                        </button>
                    </p>
                </div>

                {/* ═══════════ Stats Row (collapsible) ═══════════ */}
                <div
                    className={cn(
                        'grid overflow-hidden transition-all duration-500 ease-in-out',
                        isStatsVisible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                >
                    <div className="min-h-0">
                        <div className="grid grid-cols-1 gap-6 border-t border-b border-slate-200 py-6 md:grid-cols-4 md:gap-8">
                            <div className="flex flex-col">
                                <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                    <CalendarCheck2 className="h-3.5 w-3.5" />
                                    Total Booking
                                </span>
                                <span className="text-3xl font-semibold tracking-tight text-slate-900">
                                    {liveStats.total}
                                </span>
                                <span className="mt-2 text-xs font-medium text-slate-400">Semua waktu</span>
                            </div>
                            <div className="flex flex-col border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                                <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                    <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                                    Menunggu Konfirmasi
                                </span>
                                <span className="text-3xl font-semibold tracking-tight text-amber-600">
                                    {liveStats.pending}
                                </span>
                                <span className="mt-2 text-xs font-medium text-slate-400">Perlu tindakan</span>
                            </div>
                            <div className="flex flex-col border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                                <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    Dikonfirmasi
                                </span>
                                <span className="text-3xl font-semibold tracking-tight text-emerald-600">
                                    {liveStats.confirmed}
                                </span>
                                <span className="mt-2 text-xs font-medium text-slate-400">Booking aktif</span>
                            </div>
                            <div className="flex flex-col border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                                <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                    <CalendarDays className="h-3.5 w-3.5 text-sky-500" />
                                    Hari Ini
                                </span>
                                <span className="text-3xl font-semibold tracking-tight text-sky-600">
                                    {liveStats.today}
                                </span>
                                <span className="mt-2 text-xs font-medium text-slate-400">Jadwal hari ini</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ Action Toolbar ═══════════ */}
                <div className="flex flex-col gap-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama, lapangan, venue, atau ID..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-9 w-64 rounded-full border border-slate-200/80 bg-white pr-4 pl-9 text-sm focus:border-padel-green-dark focus:ring-padel-green-dark sm:w-72"
                            />
                        </div>

                        {/* Status filter */}
                        <div className="relative flex h-9 items-center">
                            <Filter className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as 'all' | BookingStatus);
                                    setCurrentPage(1);
                                }}
                                className="h-full appearance-none rounded-full border border-slate-200/80 bg-white py-0 pr-8 pl-9 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:border-padel-green-dark focus:ring-padel-green-dark"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="confirmed">Dikonfirmasi</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
                        </div>

                        {/* Date range filter */}
                        <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 h-9">
                            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-full w-32 bg-transparent text-sm text-slate-600 focus:outline-none"
                                title="Dari tanggal"
                            />
                            <span className="text-slate-300 text-xs">—</span>
                            <input
                                type="date"
                                value={dateTo}
                                min={dateFrom || undefined}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-full w-32 bg-transparent text-sm text-slate-600 focus:outline-none"
                                title="Sampai tanggal"
                            />
                            {hasDateFilter && (
                                <button
                                    onClick={clearDateFilter}
                                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                    title="Hapus filter tanggal"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        <span className="ml-auto text-sm font-medium text-slate-500">
                            <span className="font-semibold text-slate-700">{filteredRows.length}</span> booking
                        </span>
                    </div>
                </div>

                {/* ═══════════ Feedback Banner ═══════════ */}
                {feedback && (
                    <div
                        className={cn(
                            'rounded-xl border px-4 py-3 text-sm',
                            feedback.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-rose-200 bg-rose-50 text-rose-700',
                        )}
                    >
                        {feedback.text}
                    </div>
                )}

                {/* ═══════════ Data Table ═══════════ */}
                <div className="flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200/80">
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        ID / Dibuat
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        Pemesan
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        Lapangan
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        Jadwal
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        Biaya
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        Status
                                    </th>
                                    <th className="px-5 py-4 text-right text-[10px] font-light tracking-wide text-slate-600">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {paginatedRows.length > 0 ? (
                                    paginatedRows.map((booking) => {
                                        const meta = statusMeta[booking.status];
                                        const canConfirm = booking.status === 'pending';
                                        const canCancel = !['cancelled', 'completed'].includes(booking.status);

                                        return (
                                            <tr
                                                key={booking.id}
                                                className="group transition-colors outline-none hover:bg-slate-50/40"
                                            >
                                                <td className="px-5 py-4">
                                                    <span className="font-semibold text-slate-900">
                                                        #{booking.id}
                                                    </span>
                                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                                        {fmtDateTime(booking.created_at)}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-slate-700 transition-colors group-hover:text-slate-900">
                                                        {booking.user.name}
                                                    </span>
                                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                                        {booking.user.phone || booking.user.email || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-slate-700 group-hover:text-slate-900">
                                                        {booking.court.name || '-'}
                                                    </span>
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                                            {booking.court.sport.name || 'Olahraga'}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                            <MapPin className="h-3 w-3 text-padel-green" />
                                                            {booking.court.venue.name || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-slate-700 group-hover:text-slate-900">
                                                        {fmtDate(booking.date)}
                                                    </span>
                                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                                        {booking.start_time.slice(0, 5)} –{' '}
                                                        {booking.end_time.slice(0, 5)}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-medium text-slate-700 group-hover:text-slate-900">
                                                        {fmtCurrency(booking.total_price)}
                                                    </span>
                                                    <p className="mt-0.5 text-[11px] capitalize text-slate-400">
                                                        {booking.payment.method
                                                            ? booking.payment.method.replace('_', ' ')
                                                            : 'Belum ada metode'}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={cn(
                                                            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset',
                                                            meta.badge,
                                                        )}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={!canConfirm || actingId === booking.id}
                                                            onClick={() => runAction(booking.id, 'confirm')}
                                                            className="flex h-8 items-center rounded-md bg-padel-green px-3 text-xs font-semibold text-white transition-colors hover:bg-padel-green-dark disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            {actingId === booking.id && canConfirm
                                                                ? '...'
                                                                : 'Konfirmasi'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={!canCancel || actingId === booking.id}
                                                            onClick={() => runAction(booking.id, 'cancel')}
                                                            className="flex h-8 items-center rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            Batalkan
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                                                    <Inbox className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <h3 className="mb-1 text-sm font-semibold text-slate-900">
                                                    Tidak ada booking ditemukan
                                                </h3>
                                                <p className="text-[13px] text-slate-500">
                                                    Coba ubah kata kunci atau filter status.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ═══════════ Pagination Footer ═══════════ */}
                    <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <span className="text-[13px] text-slate-500">
                            Menampilkan:{' '}
                            <span className="font-semibold text-slate-700">
                                {filteredRows.length === 0 ? 0 : (currentPage - 1) * linesPerPage + 1} –{' '}
                                {Math.min(currentPage * linesPerPage, filteredRows.length)}
                            </span>{' '}
                            of {filteredRows.length}
                        </span>

                        <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:gap-6">
                            <div className="flex flex-wrap items-center justify-center gap-1">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1 || totalPages === 0}
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalPages }).map((_, idx) => {
                                    const pageNumber = idx + 1;
                                    if (totalPages > 5) {
                                        if (
                                            pageNumber !== 1 &&
                                            pageNumber !== totalPages &&
                                            Math.abs(currentPage - pageNumber) > 1
                                        ) {
                                            if (pageNumber === 2 || pageNumber === totalPages - 1) {
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
                                            onClick={() => setCurrentPage(pageNumber)}
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
                                })}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[13px] text-slate-500">Baris per halaman</span>
                                <select
                                    value={linesPerPage}
                                    onChange={(e) => {
                                        setLinesPerPage(Number(e.target.value));
                                        setCurrentPage(1);
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
            </div>
        </AppLayout>
    );
}
