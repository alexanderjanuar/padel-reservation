import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    AlertCircle,
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
    Plus,
    Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import * as bookingRoutes from '@/routes/bookings';
import courtRoutes from '@/routes/courts';
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
        amount?: number | null;
    };
}

interface Props {
    bookings: BookingItem[];
    courts: AvailabilityCourt[];
}

interface PricingRule {
    days: number[];
    start_time: string;
    end_time: string;
    price: number;
    price_2_hours?: number;
}

interface AvailabilityCourt {
    id: number;
    name: string;
    type: 'indoor' | 'outdoor';
    price_per_hour: number;
    pricing_rules?: PricingRule[] | null;
    venue: {
        id?: number | null;
        name?: string | null;
    };
    sport: {
        id?: number | null;
        name?: string | null;
    };
    booked_slots: string[];
    slot_meta: Record<
        string,
        {
            booking_id: number;
            customer: string;
            phone: string;
            start_time: string;
            end_time: string;
            status: BookingStatus;
            total_price: number;
            notes?: string | null;
        }
    >;
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

function calculateBookingPrice(
    court: AvailabilityCourt,
    startTime: string,
    endTime: string,
    date: Date,
) {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const dayOfWeek = date.getDay();
    let total = 0;

    const findRule = (hour: number) => {
        const slot = `${hour.toString().padStart(2, '0')}:00`;

        return (
            court.pricing_rules?.find(
                (rule) =>
                    rule.days.includes(dayOfWeek) &&
                    slot >= rule.start_time &&
                    slot < rule.end_time,
            ) ?? null
        );
    };

    let hour = startHour;
    while (hour < endHour) {
        const rule = findRule(hour);
        const slotPrice = rule ? Number(rule.price) : court.price_per_hour;

        if (hour + 1 < endHour && rule?.price_2_hours) {
            const nextSlot = `${(hour + 1).toString().padStart(2, '0')}:00`;

            if (nextSlot >= rule.start_time && nextSlot < rule.end_time) {
                total += Number(rule.price_2_hours);
                hour += 2;
                continue;
            }
        }

        total += slotPrice;
        hour++;
    }

    return total;
}

function mapApiBookingToRow(booking: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: BookingStatus;
    total_price: number;
    notes?: string | null;
    created_at?: string | null;
    user?: {
        id?: number | null;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
    } | null;
    court?: {
        id?: number | null;
        name?: string | null;
        sport?: {
            id?: number | null;
            name?: string | null;
        } | null;
        venue?: {
            id?: number | null;
            name?: string | null;
            city?: string | null;
        } | null;
    } | null;
    payment?: {
        method?: string | null;
        status?: string | null;
        amount?: number | null;
    } | null;
}): BookingItem {
    return {
        id: booking.id,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        total_price: booking.total_price,
        notes: booking.notes ?? null,
        created_at: booking.created_at ?? new Date().toISOString(),
        user: {
            id: booking.user?.id ?? null,
            name: booking.user?.name ?? 'Guest',
            email: booking.user?.email ?? null,
            phone: booking.user?.phone ?? null,
        },
        court: {
            id: booking.court?.id ?? null,
            name: booking.court?.name ?? null,
            sport: {
                id: booking.court?.sport?.id ?? null,
                name: booking.court?.sport?.name ?? null,
            },
            venue: {
                id: booking.court?.venue?.id ?? null,
                name: booking.court?.venue?.name ?? null,
                city: booking.court?.venue?.city ?? null,
            },
        },
        payment: {
            method: booking.payment?.method ?? null,
            status: booking.payment?.status ?? null,
            amount: booking.payment?.amount ?? booking.total_price,
        },
    };
}

type Preset = 'today' | 'week' | 'month' | 'all' | 'custom';

function buildPresets(now: Date) {
    const todayStr = format(now, 'yyyy-MM-dd');
    return [
        { id: 'today' as Preset, label: 'Hari Ini', from: todayStr, to: todayStr },
        {
            id: 'week' as Preset,
            label: 'Minggu Ini',
            from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
            to: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        },
        {
            id: 'month' as Preset,
            label: 'Bulan Ini',
            from: format(startOfMonth(now), 'yyyy-MM-dd'),
            to: format(endOfMonth(now), 'yyyy-MM-dd'),
        },
        { id: 'all' as Preset, label: 'Semua', from: '', to: '' },
    ];
}

function DateRangePicker({
    dateFrom,
    dateTo,
    activePreset,
    onPreset,
    onCustomChange,
}: {
    dateFrom: string;
    dateTo: string;
    activePreset: Preset;
    onPreset: (preset: Preset, from: string, to: string) => void;
    onCustomChange: (from: string, to: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const now = new Date();
    const presets = buildPresets(now);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const label = (() => {
        if (activePreset === 'all') return 'Semua Tanggal';
        if (activePreset === 'today' && dateFrom)
            return format(parseISO(dateFrom), 'EEE, dd MMM yyyy', { locale: idLocale });
        if (activePreset === 'week') return 'Minggu Ini';
        if (activePreset === 'month') return format(now, 'MMMM yyyy', { locale: idLocale });
        if (dateFrom && dateTo && dateFrom !== dateTo)
            return `${format(parseISO(dateFrom), 'dd MMM', { locale: idLocale })} – ${format(parseISO(dateTo), 'dd MMM yyyy', { locale: idLocale })}`;
        if (dateFrom) return format(parseISO(dateFrom), 'dd MMM yyyy', { locale: idLocale });
        return 'Pilih Tanggal';
    })();

    const isActive = activePreset !== 'all';

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-all',
                    isActive
                        ? 'border-padel-green bg-padel-green/5 text-padel-green hover:bg-padel-green/10'
                        : 'border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50',
                )}
            >
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                <ChevronDown
                    className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                        open && 'rotate-180',
                        isActive ? 'text-padel-green/60' : 'text-slate-400',
                    )}
                />
            </button>

            {/* Panel */}
            {open && (
                <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                    {/* Presets */}
                    <div className="p-3">
                        <p className="mb-2.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Filter Cepat
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {presets.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        onPreset(p.id, p.from, p.to);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        'flex items-center justify-center rounded-xl border py-2 text-xs font-semibold transition-all',
                                        activePreset === p.id
                                            ? 'border-padel-green bg-padel-green text-white shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-3 border-t border-slate-100" />

                    {/* Custom range */}
                    <div className="p-3">
                        <p className="mb-2.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Rentang Kustom
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                <span className="w-10 shrink-0 text-xs font-semibold text-slate-400">Dari</span>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => onCustomChange(e.target.value, dateTo)}
                                    className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                <span className="w-10 shrink-0 text-xs font-semibold text-slate-400">s/d</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    min={dateFrom || undefined}
                                    onChange={(e) => onCustomChange(dateFrom, e.target.value)}
                                    className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminBookings({
    bookings,
    courts,
}: Props) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const [rows, setRows] = useState(bookings);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
    const [dateFrom, setDateFrom] = useState(todayStr);
    const [dateTo, setDateTo] = useState(todayStr);
    const [activePreset, setActivePreset] = useState<Preset>('today');
    const [actingId, setActingId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isStatsVisible, setIsStatsVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [linesPerPage, setLinesPerPage] = useState(10);
    const [confirmBooking, setConfirmBooking] = useState<BookingItem | null>(null);
    const [confirmPriceMode, setConfirmPriceMode] = useState<'system' | 'manual'>('system');
    const [confirmManualTotal, setConfirmManualTotal] = useState<number | null>(null);
    const [confirmError, setConfirmError] = useState('');
    const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

    const handlePreset = (preset: Preset, from: string, to: string) => {
        setActivePreset(preset);
        setDateFrom(from);
        setDateTo(to);
        setCurrentPage(1);
    };

    const handleCustomDate = (from: string, to: string) => {
        setActivePreset('custom');
        setDateFrom(from);
        setDateTo(to);
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

    const confirmCourt = useMemo(
        () => courts.find((court) => court.id === confirmBooking?.court.id) ?? null,
        [courts, confirmBooking],
    );

    const confirmSystemTotal = useMemo(() => {
        if (!confirmBooking) return 0;
        if (!confirmCourt) return confirmBooking.total_price;

        return calculateBookingPrice(
            confirmCourt,
            confirmBooking.start_time,
            confirmBooking.end_time,
            parseISO(confirmBooking.date),
        );
    }, [confirmBooking, confirmCourt]);

    const confirmEffectiveTotal =
        confirmPriceMode === 'manual' && confirmManualTotal !== null
            ? confirmManualTotal
            : confirmSystemTotal;

    const openConfirmModal = (booking: BookingItem) => {
        setConfirmBooking(booking);
        setConfirmPriceMode('system');
        setConfirmManualTotal(booking.total_price);
        setConfirmError('');
    };

    const closeConfirmModal = (open: boolean) => {
        if (open || isConfirmSubmitting) return;

        setConfirmBooking(null);
        setConfirmPriceMode('system');
        setConfirmManualTotal(null);
        setConfirmError('');
    };

    const runAction = async (bookingId: number) => {
        setActingId(bookingId);
        setFeedback(null);

        try {
            const route = bookingRoutes.cancel({ booking: bookingId });

            const response = await axios({ url: route.url, method: route.method });

            setRows((current) =>
                current.map((booking) =>
                    booking.id === bookingId
                        ? {
                              ...booking,
                              status: 'cancelled',
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

    const submitConfirmation = async () => {
        if (!confirmBooking) return;

        if (confirmPriceMode === 'manual' && confirmManualTotal === null) {
            setConfirmError('Masukkan harga manual sebelum booking dikonfirmasi.');
            return;
        }

        setIsConfirmSubmitting(true);
        setActingId(confirmBooking.id);
        setFeedback(null);
        setConfirmError('');

        try {
            const route = bookingRoutes.confirm({ booking: confirmBooking.id });
            const response = await axios({
                url: route.url,
                method: route.method,
                data: {
                    price_mode: confirmPriceMode,
                    total_price: confirmPriceMode === 'manual' ? confirmManualTotal : undefined,
                },
            });

            const updatedBooking = response.data?.booking
                ? mapApiBookingToRow(response.data.booking)
                : {
                      ...confirmBooking,
                      status: 'confirmed' as BookingStatus,
                      total_price: confirmEffectiveTotal,
                      payment: {
                          ...confirmBooking.payment,
                          amount: confirmEffectiveTotal,
                          status: 'paid',
                      },
                  };

            setRows((current) =>
                current.map((booking) => (booking.id === confirmBooking.id ? updatedBooking : booking)),
            );
            setFeedback({
                type: 'success',
                text: response.data?.message ?? 'Booking berhasil dikonfirmasi.',
            });
            setConfirmBooking(null);
            setConfirmPriceMode('system');
            setConfirmManualTotal(null);
            setConfirmError('');
        } catch (error: unknown) {
            const message = axios.isAxiosError(error)
                ? (error.response?.data?.message ?? 'Terjadi kesalahan saat mengonfirmasi booking.')
                : 'Terjadi kesalahan saat mengonfirmasi booking.';

            setConfirmError(message);
            setFeedback({
                type: 'error',
                text: message,
            });
        } finally {
            setIsConfirmSubmitting(false);
            setActingId(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Booking" />

            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-1 flex-col gap-4 bg-white p-4 md:gap-6 md:p-8">
                {/* ═══════════ Header ═══════════ */}
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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

                    <Link
                        href={courtRoutes.index().url}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600"
                    >
                        <Plus className="h-4 w-4" />
                        Buat Booking Baru
                    </Link>
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

                        {/* Date range picker */}
                        <DateRangePicker
                            dateFrom={dateFrom}
                            dateTo={dateTo}
                            activePreset={activePreset}
                            onPreset={handlePreset}
                            onCustomChange={handleCustomDate}
                        />

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
                                                            onClick={() => openConfirmModal(booking)}
                                                            className="flex h-8 items-center rounded-md bg-padel-green px-3 text-xs font-semibold text-white transition-colors hover:bg-padel-green-dark disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            {actingId === booking.id && canConfirm
                                                                ? '...'
                                                                : 'Konfirmasi'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={!canCancel || actingId === booking.id}
                                                            onClick={() => runAction(booking.id)}
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
                <Dialog open={Boolean(confirmBooking)} onOpenChange={closeConfirmModal}>
                    <DialogContent className="w-[calc(100vw-2rem)] max-w-xl rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl">
                        <DialogHeader className="border-b border-slate-200 px-6 py-5">
                            <DialogTitle className="text-xl font-bold text-slate-900">
                                Konfirmasi Booking
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                Pilih sumber harga sebelum booking ini dikonfirmasi.
                            </DialogDescription>
                        </DialogHeader>

                        {confirmBooking && (
                            <div className="space-y-5 px-6 py-5">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                Pemesan
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                {confirmBooking.user.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {confirmBooking.user.phone || confirmBooking.user.email || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                Jadwal
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                {fmtDate(confirmBooking.date)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {confirmBooking.start_time.slice(0, 5)} - {confirmBooking.end_time.slice(0, 5)}
                                            </p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                Lapangan
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                {confirmBooking.court.name || '-'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {confirmBooking.court.venue.name || '-'} · {confirmBooking.court.sport.name || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-3 text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
                                        Pilihan Harga
                                    </p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setConfirmPriceMode('system');
                                                setConfirmError('');
                                            }}
                                            className={cn(
                                                'rounded-2xl border px-4 py-3 text-left transition-all',
                                                confirmPriceMode === 'system'
                                                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300',
                                            )}
                                        >
                                            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Harga Sistem
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {fmtCurrency(confirmSystemTotal)}
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Gunakan harga otomatis dari rules lapangan.
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setConfirmPriceMode('manual');
                                                setConfirmManualTotal((current) => current ?? confirmBooking.total_price);
                                                setConfirmError('');
                                            }}
                                            className={cn(
                                                'rounded-2xl border px-4 py-3 text-left transition-all',
                                                confirmPriceMode === 'manual'
                                                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300',
                                            )}
                                        >
                                            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                Harga Manual
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {fmtCurrency(confirmManualTotal ?? confirmBooking.total_price)}
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Ubah nominal akhir sebelum booking dikonfirmasi.
                                            </p>
                                        </button>
                                    </div>

                                    {confirmPriceMode === 'manual' && (
                                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-900/5">
                                            <label className="mb-2 block text-xs font-semibold text-slate-500">
                                                Harga Manual
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-1 text-sm font-semibold text-slate-500">
                                                    Rp
                                                </span>
                                                <input
                                                    type="text"
                                                    value={(confirmManualTotal ?? confirmBooking.total_price).toLocaleString('id-ID')}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        setConfirmManualTotal(value ? Number(value) : 0);
                                                    }}
                                                    className="block w-full border-0 border-b-2 border-emerald-200 bg-transparent py-1 pr-2 pl-8 text-lg font-bold text-slate-900 outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            <p className="mt-2 text-[11px] text-slate-400">
                                                Nominal ini akan dipakai sebagai total akhir booking.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Harga tersimpan saat ini</span>
                                        <span className="font-semibold text-slate-700">
                                            {fmtCurrency(confirmBooking.total_price)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Sumber harga</span>
                                        <span className="font-semibold text-slate-700">
                                            {confirmPriceMode === 'manual' ? 'Manual' : 'Sistem'}
                                        </span>
                                    </div>
                                    <div className="mt-3 border-t border-slate-200 pt-3">
                                        <div className="flex items-end justify-between">
                                            <span className="text-sm font-semibold text-slate-900">Total setelah konfirmasi</span>
                                            <span className="text-2xl font-bold text-emerald-600">
                                                {fmtCurrency(confirmEffectiveTotal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {confirmError && (
                                    <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                        {confirmError}
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="border-t border-slate-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => closeConfirmModal(false)}
                                disabled={isConfirmSubmitting}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={submitConfirmation}
                                disabled={!confirmBooking || isConfirmSubmitting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isConfirmSubmitting && <Spinner className="h-4 w-4" />}
                                {isConfirmSubmitting ? 'Memproses...' : 'Konfirmasi Sekarang'}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
