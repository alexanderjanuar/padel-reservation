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
    Pencil,
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

const BOOKING_MODAL_SLOTS = Array.from({ length: 15 }, (_, index) => {
    const hour = index + 7;
    return `${hour.toString().padStart(2, '0')}:00`;
});

function getSelectableRangeEnd(endTime: string) {
    const hour = parseInt(endTime.split(':')[0], 10) - 1;
    return `${hour.toString().padStart(2, '0')}:00`;
}

function getSubmittedEndTime(range: { start: string | null; end: string | null }) {
    if (!range.start) return null;

    const rawEnd = range.end ?? range.start;
    const endHour = parseInt(rawEnd.split(':')[0], 10) + 1;

    return `${endHour.toString().padStart(2, '0')}:00`;
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
    const [editBooking, setEditBooking] = useState<BookingItem | null>(null);
    const [availabilityCourts, setAvailabilityCourts] = useState(courts);
    const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
    const [editDate, setEditDate] = useState(todayStr);
    const [editCourtId, setEditCourtId] = useState<number | null>(null);
    const [editRange, setEditRange] = useState<{ start: string | null; end: string | null }>({
        start: null,
        end: null,
    });
    const [editPaymentStatus, setEditPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
    const [editPriceMode, setEditPriceMode] = useState<'system' | 'manual'>('system');
    const [editManualTotal, setEditManualTotal] = useState<number | null>(null);
    const [editNotes, setEditNotes] = useState('');
    const [editError, setEditError] = useState('');
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

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

    const editCourt = useMemo(
        () => availabilityCourts.find((court) => court.id === editCourtId) ?? null,
        [availabilityCourts, editCourtId],
    );

    const editSystemTotal = useMemo(() => {
        if (!editCourt || !editRange.start) return 0;

        const submittedEnd = getSubmittedEndTime(editRange);
        if (!submittedEnd) return 0;

        return calculateBookingPrice(editCourt, editRange.start, submittedEnd, parseISO(editDate));
    }, [editCourt, editRange, editDate]);

    const editEffectiveTotal =
        editPriceMode === 'manual' && editManualTotal !== null ? editManualTotal : editSystemTotal;

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

    const loadAvailability = async (date: string) => {
        setIsAvailabilityLoading(true);

        try {
            const route = bookingRoutes.availability({ query: { date } });
            const response = await axios.get(route.url);
            setAvailabilityCourts(response.data?.courts ?? []);
        } catch {
            setEditError('Gagal memuat ketersediaan slot untuk tanggal tersebut.');
        } finally {
            setIsAvailabilityLoading(false);
        }
    };

    const openEditModal = async (booking: BookingItem) => {
        const bookingCourtId = booking.court.id ?? null;
        const initialRangeEnd =
            booking.end_time > booking.start_time ? getSelectableRangeEnd(booking.end_time) : null;

        setEditBooking(booking);
        setEditDate(booking.date);
        setEditCourtId(bookingCourtId);
        setEditRange({
            start: booking.start_time,
            end: initialRangeEnd,
        });
        setEditPaymentStatus(booking.status === 'confirmed' ? 'paid' : 'unpaid');
        setEditNotes(booking.notes ?? '');
        setEditPriceMode('manual');
        setEditManualTotal(booking.total_price);
        setEditError('');

        await loadAvailability(booking.date);
    };

    const resetEditState = () => {
        setEditBooking(null);
        setEditDate(todayStr);
        setEditCourtId(null);
        setEditRange({ start: null, end: null });
        setEditPaymentStatus('unpaid');
        setEditPriceMode('system');
        setEditManualTotal(null);
        setEditNotes('');
        setEditError('');
        setAvailabilityCourts(courts);
    };

    const closeEditModal = (open: boolean) => {
        if (open || isEditSubmitting) return;
        resetEditState();
    };

    const handleEditDateChange = async (value: string) => {
        setEditDate(value);
        setEditError('');
        await loadAvailability(value);
    };

    const handleEditCourtChange = (courtId: number) => {
        setEditCourtId(courtId);
        setEditRange({ start: null, end: null });
        setEditError('');
    };

    const handleEditSlotSelection = (
        _court: AvailabilityCourt,
        slot: string,
        blockedSlots: string[],
    ) => {
        if (!editRange.start || editRange.end) {
            setEditRange({ start: slot, end: null });
            setEditError('');
            return;
        }

        if (slot <= editRange.start) {
            setEditRange({ start: slot, end: null });
            setEditError('');
            return;
        }

        const startHour = parseInt(editRange.start.split(':')[0], 10);
        const endHour = parseInt(slot.split(':')[0], 10);

        for (let hour = startHour + 1; hour <= endHour; hour++) {
            const candidate = `${hour.toString().padStart(2, '0')}:00`;

            if (blockedSlots.includes(candidate)) {
                setEditError('Rentang waktu melewati slot yang sudah dikonfirmasi booking lain.');
                return;
            }
        }

        setEditRange({
            start: editRange.start,
            end: slot,
        });
        setEditError('');
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

    const submitEditBooking = async () => {
        if (!editBooking || !editCourtId || !editRange.start) {
            setEditError('Lengkapi lapangan dan slot booking terlebih dahulu.');
            return;
        }

        const endTime = getSubmittedEndTime(editRange);
        if (!endTime) {
            setEditError('Slot booking belum lengkap.');
            return;
        }

        if (editPriceMode === 'manual' && editManualTotal === null) {
            setEditError('Masukkan harga manual sebelum menyimpan perubahan.');
            return;
        }

        setIsEditSubmitting(true);
        setActingId(editBooking.id);
        setFeedback(null);
        setEditError('');

        try {
            const route = bookingRoutes.update({ booking: editBooking.id });
            const response = await axios({
                url: route.url,
                method: route.method,
                data: {
                    user_id: editBooking.user.id,
                    court_id: editCourtId,
                    date: editDate,
                    start_time: editRange.start,
                    end_time: endTime,
                    total_price: editPriceMode === 'manual' ? editManualTotal : editSystemTotal,
                    payment_status: editPaymentStatus,
                    notes: editNotes,
                },
            });

            const updatedBooking = response.data?.booking
                ? mapApiBookingToRow(response.data.booking)
                : {
                      ...editBooking,
                      date: editDate,
                      start_time: editRange.start,
                      end_time: endTime,
                      total_price: editEffectiveTotal,
                      status: (editPaymentStatus === 'paid' ? 'confirmed' : 'pending') as BookingStatus,
                      notes: editNotes,
                  };

            setRows((current) =>
                current.map((booking) => (booking.id === editBooking.id ? updatedBooking : booking)),
            );
            setFeedback({
                type: 'success',
                text: response.data?.message ?? 'Booking berhasil diperbarui.',
            });
            resetEditState();
        } catch (error: unknown) {
            const message = axios.isAxiosError(error)
                ? (error.response?.data?.message ?? 'Terjadi kesalahan saat memperbarui booking.')
                : 'Terjadi kesalahan saat memperbarui booking.';

            setEditError(message);
            setFeedback({
                type: 'error',
                text: message,
            });
        } finally {
            setIsEditSubmitting(false);
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
                        <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-200 py-5 md:grid-cols-4 md:gap-0 md:py-6">
                            {[
                                { icon: <CalendarCheck2 className="h-3.5 w-3.5" />, label: 'Total', value: liveStats.total, color: 'text-slate-900', sub: 'Semua waktu' },
                                { icon: <Clock3 className="h-3.5 w-3.5 text-amber-500" />, label: 'Menunggu', value: liveStats.pending, color: 'text-amber-600', sub: 'Perlu tindakan' },
                                { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, label: 'Dikonfirmasi', value: liveStats.confirmed, color: 'text-emerald-600', sub: 'Booking aktif' },
                                { icon: <CalendarDays className="h-3.5 w-3.5 text-sky-500" />, label: 'Hari Ini', value: liveStats.today, color: 'text-sky-600', sub: 'Jadwal hari ini' },
                            ].map((stat, i) => (
                                <div key={stat.label} className={cn('flex flex-col', i > 0 && 'md:border-l md:pl-8')}>
                                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                        {stat.icon}
                                        {stat.label}
                                    </span>
                                    <span className={cn('text-2xl font-semibold tracking-tight md:text-3xl', stat.color)}>
                                        {stat.value}
                                    </span>
                                    <span className="mt-1.5 text-xs font-medium text-slate-400">{stat.sub}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════ Action Toolbar ═══════════ */}
                <div className="flex flex-col gap-2 py-1">
                    {/* Row 1: Search + count */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex flex-1 items-center sm:flex-none">
                            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama, lapangan, atau ID..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-9 w-full rounded-full border border-slate-200/80 bg-white pr-4 pl-9 text-sm focus:border-padel-green-dark focus:ring-padel-green-dark sm:w-72"
                            />
                        </div>
                        <span className="ml-auto shrink-0 text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">{filteredRows.length}</span>
                            <span className="hidden sm:inline"> booking</span>
                        </span>
                    </div>

                    {/* Row 2: Filters */}
                    <div className="flex flex-wrap items-center gap-2">
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

                        <DateRangePicker
                            dateFrom={dateFrom}
                            dateTo={dateTo}
                            activePreset={activePreset}
                            onPreset={handlePreset}
                            onCustomChange={handleCustomDate}
                        />
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
                <div className="flex flex-col rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-4 py-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                        ID
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                        Pemesan
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                        Lapangan
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                        Jadwal
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                        Biaya
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRows.length > 0 ? (
                                    paginatedRows.map((booking) => {
                                        const meta = statusMeta[booking.status];
                                        const canConfirm = booking.status === 'pending';
                                        const canCancel = !['cancelled', 'completed'].includes(booking.status);
                                        const canEdit =
                                            !['cancelled', 'completed'].includes(booking.status) &&
                                            booking.date >= todayStr &&
                                            Boolean(booking.user.id);
                                        const isActing = actingId === booking.id;

                                        return (
                                            <tr
                                                key={booking.id}
                                                className="group bg-white transition-colors hover:bg-slate-50/60"
                                            >
                                                <td className="px-4 py-3.5">
                                                    <span className="text-xs font-bold text-slate-400">
                                                        #{booking.id}
                                                    </span>
                                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                                        {fmtDateTime(booking.created_at)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-medium text-slate-800">
                                                        {booking.user.name}
                                                    </span>
                                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                                        {booking.user.phone || booking.user.email || '—'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-medium text-slate-800">
                                                        {booking.court.name || '—'}
                                                    </span>
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                                            {booking.court.sport.name || 'Olahraga'}
                                                        </span>
                                                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                                                            <MapPin className="h-2.5 w-2.5 text-padel-green" />
                                                            {booking.court.venue.name || '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-medium text-slate-800">
                                                        {fmtDate(booking.date)}
                                                    </span>
                                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                                        {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-semibold text-slate-800">
                                                        {fmtCurrency(booking.total_price)}
                                                    </span>
                                                    <p className="mt-0.5 text-[11px] capitalize text-slate-400">
                                                        {booking.payment.method
                                                            ? booking.payment.method.replace('_', ' ')
                                                            : 'Belum ada'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={cn(
                                                            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset',
                                                            meta.badge,
                                                        )}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            disabled={!canEdit || isActing}
                                                            onClick={() => void openEditModal(booking)}
                                                            title="Edit booking"
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={!canConfirm || isActing}
                                                            onClick={() => openConfirmModal(booking)}
                                                            className="flex h-7 items-center rounded-lg bg-padel-green px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-padel-green-dark disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            {isActing && canConfirm ? (
                                                                <Spinner className="h-3 w-3" />
                                                            ) : (
                                                                'Konfirmasi'
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={!canCancel || isActing}
                                                            onClick={() => runAction(booking.id)}
                                                            className="flex h-7 items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-14 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                                    <Inbox className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    Tidak ada booking ditemukan
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Coba ubah kata kunci atau filter.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ═══════════ Pagination Footer ═══════════ */}
                    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row">
                        <span className="text-[12px] text-slate-400">
                            {filteredRows.length === 0 ? (
                                'Tidak ada data'
                            ) : (
                                <>
                                    <span className="font-semibold text-slate-600">
                                        {(currentPage - 1) * linesPerPage + 1}–{Math.min(currentPage * linesPerPage, filteredRows.length)}
                                    </span>
                                    {' '}dari {filteredRows.length} booking
                                </>
                            )}
                        </span>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1 || totalPages === 0}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
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
                                                    <span key={pageNumber} className="flex h-7 w-7 items-center justify-center text-[12px] text-slate-300">
                                                        ···
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
                                                'flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-medium transition-colors',
                                                currentPage === pageNumber
                                                    ? 'bg-slate-900 text-white'
                                                    : 'text-slate-500 hover:bg-slate-100',
                                            )}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <select
                                value={linesPerPage}
                                onChange={(e) => {
                                    setLinesPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-50 focus:ring-0"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>
                <Dialog open={Boolean(editBooking)} onOpenChange={closeEditModal}>
                    <DialogContent className="flex w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[92vh] sm:max-h-[88vh]">
                        <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 sm:px-6 sm:py-5">
                            <DialogTitle className="text-lg font-bold text-slate-900 sm:text-xl">
                                Edit Booking Mendatang
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                Perbarui jadwal booking dan pastikan slot barunya tidak bentrok dengan booking lain yang sudah dikonfirmasi.
                            </DialogDescription>
                        </DialogHeader>

                        {editBooking && (
                            <div className="flex-1 overflow-y-auto overscroll-contain">
                                <div className="space-y-5 px-5 py-5 sm:space-y-6 sm:px-6">
                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                                                    {editBooking.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="truncate text-base font-bold text-slate-900">
                                                            {editBooking.user.name}
                                                        </p>
                                                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                            #{editBooking.id}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 truncate text-sm text-slate-500">
                                                        {editBooking.user.phone || editBooking.user.email || '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                        Booking Saat Ini
                                                    </p>
                                                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                                                        {editBooking.court.name || '—'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {fmtDate(editBooking.date)} · {editBooking.start_time.slice(0, 5)} - {editBooking.end_time.slice(0, 5)}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                        Venue
                                                    </p>
                                                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                                                        {editBooking.court.venue.name || '—'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {editBooking.court.sport.name || 'Olahraga'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
                                            <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-700 uppercase">
                                                Ringkasan Update
                                            </p>
                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <div className="rounded-xl bg-white px-4 py-3 shadow-sm shadow-emerald-900/5">
                                                    <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                                        Mulai
                                                    </p>
                                                    <p className="mt-1 text-lg font-bold text-slate-900">
                                                        {editRange.start ? editRange.start.slice(0, 5) : '—'}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-white px-4 py-3 shadow-sm shadow-emerald-900/5">
                                                    <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                                        Selesai
                                                    </p>
                                                    <p className="mt-1 text-lg font-bold text-slate-900">
                                                        {getSubmittedEndTime(editRange)?.slice(0, 5) ?? '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 rounded-xl bg-white px-4 py-3 shadow-sm shadow-emerald-900/5">
                                                <div className="flex items-center justify-between gap-3 text-sm">
                                                    <span className="text-slate-500">Total baru</span>
                                                    <span className="text-xl font-bold text-emerald-600">
                                                        {fmtCurrency(editEffectiveTotal)}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                                                    <span>Harga sebelumnya</span>
                                                    <span className="font-semibold text-slate-700">
                                                        {fmtCurrency(editBooking.total_price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                                                    1
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900">
                                                        Atur Jadwal Booking
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        Pilih tanggal, status pembayaran, dan lapangan sebelum menentukan slot waktu.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                        Tanggal
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={editDate}
                                                        min={todayStr}
                                                        onChange={(e) => void handleEditDateChange(e.target.value)}
                                                        className="block h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                        Status Pembayaran
                                                    </label>
                                                    <select
                                                        value={editPaymentStatus}
                                                        onChange={(e) => setEditPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                                                        className="block h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none"
                                                    >
                                                        <option value="unpaid">Belum Lunas</option>
                                                        <option value="paid">Lunas</option>
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                        Lapangan
                                                    </label>
                                                    <select
                                                        value={editCourtId ?? ''}
                                                        onChange={(e) => handleEditCourtChange(Number(e.target.value))}
                                                        className="block h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none"
                                                    >
                                                        <option value="" disabled>
                                                            Pilih lapangan
                                                        </option>
                                                        {availabilityCourts.map((court) => (
                                                            <option key={court.id} value={court.id}>
                                                                {court.name} · {court.venue.name ?? '-'} · {court.sport.name ?? '-'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                                            <div className="mb-4 flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                                                        2
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900">
                                                            Pilih Slot Waktu
                                                        </h3>
                                                        <p className="text-xs text-slate-500">
                                                            Klik satu slot untuk mulai, lalu pilih slot akhir sesuai durasi booking.
                                                        </p>
                                                    </div>
                                                </div>
                                                {editRange.start && (
                                                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                                        <Clock3 className="h-3 w-3" />
                                                        {editRange.start.slice(0, 5)} → {getSubmittedEndTime(editRange)?.slice(0, 5) ?? '?'}
                                                    </span>
                                                )}
                                            </div>

                                            {isAvailabilityLoading ? (
                                                <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                                                    <Spinner className="h-5 w-5 text-emerald-500" />
                                                </div>
                                            ) : !editCourt ? (
                                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                                                    Pilih lapangan terlebih dahulu untuk menampilkan slot waktu.
                                                </div>
                                            ) : (
                                                (() => {
                                                    const blockedSlots = (editCourt.booked_slots || []).filter((slot) => {
                                                        const slotMeta = editCourt.slot_meta?.[slot];

                                                        if (!slotMeta) return false;
                                                        if (slotMeta.booking_id === editBooking.id) return false;

                                                        return ['confirmed', 'completed'].includes(slotMeta.status);
                                                    });

                                                    return (
                                                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                            <div className="grid gap-2 text-[11px] text-slate-500 sm:grid-cols-3">
                                                                <span className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                                                                    Slot putih: masih tersedia
                                                                </span>
                                                                <span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-200">
                                                                    Slot hijau: pilihan Anda
                                                                </span>
                                                                <span className="rounded-xl bg-rose-50 px-3 py-2 text-rose-600 ring-1 ring-rose-200">
                                                                    Slot merah: sudah dikonfirmasi
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                                                                {BOOKING_MODAL_SLOTS.map((slot) => {
                                                                    const isBlocked = blockedSlots.includes(slot);
                                                                    const isSelected =
                                                                        editRange.start &&
                                                                        (editRange.end
                                                                            ? slot >= editRange.start && slot <= editRange.end
                                                                            : slot === editRange.start);
                                                                    const slotMeta = editCourt.slot_meta?.[slot];

                                                                    return (
                                                                        <button
                                                                            key={slot}
                                                                            type="button"
                                                                            onClick={() =>
                                                                                !isBlocked &&
                                                                                handleEditSlotSelection(
                                                                                    editCourt,
                                                                                    slot,
                                                                                    blockedSlots,
                                                                                )
                                                                            }
                                                                            disabled={isBlocked}
                                                                            title={
                                                                                isBlocked && slotMeta
                                                                                    ? `${slotMeta.customer} • ${slotMeta.start_time}-${slotMeta.end_time}`
                                                                                    : slot
                                                                            }
                                                                            className={cn(
                                                                                'rounded-xl border py-3 text-center text-xs font-bold transition-all',
                                                                                isBlocked
                                                                                    ? 'cursor-not-allowed border-rose-200 bg-rose-50 text-rose-400 line-through'
                                                                                    : isSelected
                                                                                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                                                                      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600',
                                                                            )}
                                                                        >
                                                                            {slot}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                                                    3
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900">
                                                        Atur Harga & Catatan
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        Tentukan apakah booking memakai harga sistem atau manual.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-2 sm:grid-cols-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditPriceMode('system')}
                                                        className={cn(
                                                            'rounded-xl border px-4 py-3 text-left transition-all',
                                                            editPriceMode === 'system'
                                                                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white',
                                                        )}
                                                    >
                                                        <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                            Harga Sistem
                                                        </p>
                                                        <p className="mt-1 text-sm font-bold text-slate-900">
                                                            {fmtCurrency(editSystemTotal)}
                                                        </p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditPriceMode('manual');
                                                            setEditManualTotal((current) => current ?? editBooking.total_price);
                                                        }}
                                                        className={cn(
                                                            'rounded-xl border px-4 py-3 text-left transition-all',
                                                            editPriceMode === 'manual'
                                                                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white',
                                                        )}
                                                    >
                                                        <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                            Harga Manual
                                                        </p>
                                                        <p className="mt-1 text-sm font-bold text-slate-900">
                                                            {fmtCurrency(editManualTotal ?? editBooking.total_price)}
                                                        </p>
                                                    </button>
                                                </div>

                                            {editPriceMode === 'manual' && (
                                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                    <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                        Nominal Manual
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute inset-y-0 left-0 flex items-center text-sm font-semibold text-slate-400">
                                                            Rp
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={(editManualTotal ?? editBooking.total_price).toLocaleString('id-ID')}
                                                            onChange={(e) => {
                                                                const value = e.target.value.replace(/\D/g, '');
                                                                setEditManualTotal(value ? Number(value) : 0);
                                                            }}
                                                            className="block w-full border-0 border-b-2 border-emerald-200 bg-transparent py-1 pr-2 pl-7 text-lg font-bold text-slate-900 outline-none focus:border-emerald-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                                                <div>
                                                    <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                        Catatan
                                                    </label>
                                                    <textarea
                                                        value={editNotes}
                                                        onChange={(e) => setEditNotes(e.target.value)}
                                                        rows={4}
                                                        placeholder="Catatan tambahan..."
                                                        className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none"
                                                    />
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                                        Total Pembayaran
                                                    </p>
                                                    <div className="mt-3 flex items-center justify-between text-sm">
                                                        <span className="text-slate-500">Harga sebelumnya</span>
                                                        <span className="font-semibold text-slate-600">
                                                            {fmtCurrency(editBooking.total_price)}
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 border-t border-slate-200 pt-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm font-semibold text-slate-900">Total baru</span>
                                                            <span className="text-xl font-bold text-emerald-600">
                                                                {fmtCurrency(editEffectiveTotal)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {editError && (
                                        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            {editError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="shrink-0 border-t border-slate-200 px-5 py-4 sm:px-6">
                            <button
                                type="button"
                                onClick={() => closeEditModal(false)}
                                disabled={isEditSubmitting}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={submitEditBooking}
                                disabled={!editBooking || isEditSubmitting || isAvailabilityLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isEditSubmitting && <Spinner className="h-4 w-4" />}
                                {isEditSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={Boolean(confirmBooking)} onOpenChange={closeConfirmModal}>
                    <DialogContent className="flex w-[calc(100vw-2rem)] max-w-lg flex-col gap-0 rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh]">
                        <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 sm:px-6">
                            <DialogTitle className="text-lg font-bold text-slate-900">
                                Konfirmasi Booking
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                Pilih sumber harga sebelum booking ini dikonfirmasi.
                            </DialogDescription>
                        </DialogHeader>

                        {confirmBooking && (
                            <div className="flex-1 overflow-y-auto overscroll-contain">
                                <div className="space-y-4 px-5 py-5 sm:px-6">
                                    {/* Booking info — compact horizontal card */}
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="mb-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            Detail Booking
                                        </p>
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-slate-500">Pemesan</span>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-900">{confirmBooking.user.name}</p>
                                                    <p className="text-[11px] text-slate-400">{confirmBooking.user.phone || confirmBooking.user.email || '—'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-slate-500">Lapangan</span>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-900">{confirmBooking.court.name || '—'}</p>
                                                    <p className="text-[11px] text-slate-400">
                                                        {confirmBooking.court.venue.name || '—'} · {confirmBooking.court.sport.name || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-slate-500">Jadwal</span>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-900">{fmtDate(confirmBooking.date)}</p>
                                                    <p className="text-[11px] text-slate-400">
                                                        {confirmBooking.start_time.slice(0, 5)} – {confirmBooking.end_time.slice(0, 5)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price options */}
                                    <div>
                                        <p className="mb-2.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            Pilihan Harga
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setConfirmPriceMode('system'); setConfirmError(''); }}
                                                className={cn(
                                                    'rounded-xl border px-3 py-3 text-left transition-all',
                                                    confirmPriceMode === 'system'
                                                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                                        : 'border-slate-200 bg-white hover:border-slate-300',
                                                )}
                                            >
                                                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Sistem</p>
                                                <p className="mt-1 text-sm font-bold text-slate-900">{fmtCurrency(confirmSystemTotal)}</p>
                                                <p className="mt-1 text-[10px] text-slate-400">Harga otomatis dari rules lapangan.</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setConfirmPriceMode('manual');
                                                    setConfirmManualTotal((current) => current ?? confirmBooking.total_price);
                                                    setConfirmError('');
                                                }}
                                                className={cn(
                                                    'rounded-xl border px-3 py-3 text-left transition-all',
                                                    confirmPriceMode === 'manual'
                                                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                                        : 'border-slate-200 bg-white hover:border-slate-300',
                                                )}
                                            >
                                                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Manual</p>
                                                <p className="mt-1 text-sm font-bold text-slate-900">{fmtCurrency(confirmManualTotal ?? confirmBooking.total_price)}</p>
                                                <p className="mt-1 text-[10px] text-slate-400">Ubah nominal sebelum konfirmasi.</p>
                                            </button>
                                        </div>

                                        {confirmPriceMode === 'manual' && (
                                            <div className="mt-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
                                                <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Nominal Manual
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 flex items-center text-sm font-semibold text-slate-400">
                                                        Rp
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={(confirmManualTotal ?? confirmBooking.total_price).toLocaleString('id-ID')}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '');
                                                            setConfirmManualTotal(value ? Number(value) : 0);
                                                        }}
                                                        className="block w-full border-0 border-b-2 border-emerald-200 bg-transparent py-1 pr-2 pl-7 text-lg font-bold text-slate-900 outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Price summary */}
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Harga sebelumnya</span>
                                            <span className="font-semibold text-slate-600">{fmtCurrency(confirmBooking.total_price)}</span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Sumber harga</span>
                                            <span className="font-semibold text-slate-600">
                                                {confirmPriceMode === 'manual' ? 'Manual' : 'Sistem'}
                                            </span>
                                        </div>
                                        <div className="mt-3 border-t border-slate-200 pt-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-slate-900">Total konfirmasi</span>
                                                <span className="text-xl font-bold text-emerald-600">{fmtCurrency(confirmEffectiveTotal)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {confirmError && (
                                        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            {confirmError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="shrink-0 border-t border-slate-200 px-5 py-4 sm:px-6">
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
