import { Head, useForm, router } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Plus,
    Pencil,
    Trash2,
    MapPin,
    Trophy,
    LayoutGrid,
    CheckCircle2,
    XCircle,
    Activity,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Calendar as CalendarIcon,
    Clock,
    Search,
    AlertCircle,
    X,
    ArrowLeft,
    UploadCloud,
    Image as ImageIcon,
    Utensils,
    Coffee,
    Store,
    Car,
    Bike,
    Bath,
    Mail,
    Phone,
    Info,
    Star,
    ChevronDown,
    Printer,
    MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import InputError from '@/components/input-error';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

// Wayfinder generic routing (we'll assume standard inertia usage via useForm for now to match other pages)
import { store, update, destroy } from '@/routes/courts';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manajemen Lapangan', href: '/courts' },
];

interface Venue {
    id: number;
    name: string;
    images?: string[];
}

interface Sport {
    id: number;
    name: string;
}

interface Customer {
    id?: number;
    name: string;
    email: string;
    phone: string;
}

interface SlotMeta {
    booking_id: number;
    customer: string;
    phone: string;
    start_time: string;
    end_time: string;
    status: string;
    total_price: number;
    notes?: string;
}

interface PricingRule {
    days: number[];
    start_time: string;
    end_time: string;
    price: number | '';
}

interface Court {
    id: number;
    venue_id: number;
    sport_id: number;
    name: string;
    type: 'indoor' | 'outdoor';
    price_per_hour: number;
    is_active: boolean;
    is_booked_now: boolean;
    pricing_rules?: PricingRule[];
    venue: Venue;
    sport: Sport;
    images?: string[];
    booked_slots?: string[];
    slot_meta?: Record<string, SlotMeta>;
}

interface Props {
    courts: Court[];
    venues: Venue[];
    sports: Sport[];
    filters?: {
        date?: string;
    };
}

const getImageUrl = (path: string) =>
    path.startsWith('http') ? path : `/storage/${path}`;

export default function Courts({ courts, venues, sports, filters }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
    const [recapPeriod, setRecapPeriod] = useState<string>('month');
    const [recapStartDate, setRecapStartDate] = useState<Date | undefined>();
    const [recapEndDate, setRecapEndDate] = useState<Date | undefined>();
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingUserMode, setBookingUserMode] = useState<'search' | 'create'>(
        'search',
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        null,
    );
    const [newCustomer, setNewCustomer] = useState<Customer>({
        name: '',
        email: '',
        phone: '',
    });
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [customerError, setCustomerError] = useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [editingCourt, setEditingCourt] = useState<Court | null>(null);
    const [deletingCourt, setDeletingCourt] = useState<Court | null>(null);

    // Initialize from backend filters if available, else today
    const initialDate = filters?.date ? new Date(filters.date) : new Date();
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [startDate, setStartDate] = useState(initialDate);

    const [selectedRange, setSelectedRange] = useState<{
        start: string | null;
        end: string | null;
    }>({ start: '08:00', end: null });
    const [hoveredTime, setHoveredTime] = useState<string | null>(null);

    const calculateTotalPrice = (
        court: Court,
        range: { start: string | null; end: string | null },
        date: Date,
    ) => {
        if (!range.start) return 0;

        const startHour = parseInt(range.start.split(':')[0], 10);
        let endHour = startHour + 1;
        if (range.end) {
            endHour = parseInt(range.end.split(':')[0], 10) + 1; // range.end is start of last slot, so +1 for actual end
        }

        const dayOfWeek = date.getDay();
        let total = 0;

        for (let h = startHour; h < endHour; h++) {
            const currentSlotHour = `${h.toString().padStart(2, '0')}:00`;
            let slotPrice = court.price_per_hour;

            if (court.pricing_rules && court.pricing_rules.length > 0) {
                for (const rule of court.pricing_rules) {
                    if (rule.days.includes(dayOfWeek)) {
                        if (
                            currentSlotHour >= rule.start_time &&
                            currentSlotHour < rule.end_time
                        ) {
                            slotPrice = Number(rule.price);
                            break;
                        }
                    }
                }
            }
            total += slotPrice;
        }

        return total;
    };

    const getSelectedHoursCount = () => {
        if (!selectedRange.start) return 0;
        if (!selectedRange.end) return 1;
        const startMins = parseInt(selectedRange.start.split(':')[0], 10) * 60;
        const endMins = parseInt(selectedRange.end.split(':')[0], 10) * 60;
        return (endMins - startMins) / 60 + 1;
    };
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>(
        'paid',
    );
    const [customTotal, setCustomTotal] = useState<number | null>(null);
    const [bookingNotes, setBookingNotes] = useState<string>('');
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [selectedSportIds, setSelectedSportIds] = useState<number[]>([]);

    // Split View State
    const [selectedCourtId, setSelectedCourtId] = useState<number | null>(
        courts.length > 0 ? courts[0].id : null,
    );
    const [detailCourt, setDetailCourt] = useState<Court | null>(null);
    const [bookedSlotInfo, setBookedSlotInfo] = useState<{
        court: Court;
        meta: SlotMeta;
    } | null>(null);
    const [slotActionLoading, setSlotActionLoading] = useState<
        'confirm' | 'cancel' | null
    >(null);
    const [expandedCourts, setExpandedCourts] = useState<number[]>([]);

    const toggleCourtExpanded = (id: number) => {
        setExpandedCourts((prev) =>
            prev.includes(id)
                ? prev.filter((cId) => cId !== id)
                : [...prev, id],
        );
    };

    const handlePrevDays = () => {
        const newStart = new Date(startDate);
        newStart.setDate(newStart.getDate() - 1);
        setStartDate(newStart);
    };

    const handleNextDays = () => {
        const newStart = new Date(startDate);
        newStart.setDate(newStart.getDate() + 1);
        setStartDate(newStart);
    };

    const timeSlots = Array.from({ length: 17 }, (_, i) => {
        const hour = i + 6; // 06:00 to 22:00
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    // User Search Effect
    useEffect(() => {
        async function searchUsers() {
            if (!debouncedSearchQuery || debouncedSearchQuery.trim() === '') {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await axios.get('/users/search', {
                    params: { q: debouncedSearchQuery.trim() },
                });
                setSearchResults(response.data);
            } catch (error) {
                console.error('Failed to search users:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }

        searchUsers();
    }, [debouncedSearchQuery]);

    const generateVisibleDates = () => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const visibleDates = generateVisibleDates();

    // Form logic to come...

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Lapangan" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-6">
                {/* Header & Stats */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-6">
                    <div className="space-y-1">
                        <h1 className="font-heading text-2xl font-semibold text-slate-900 sm:text-3xl">
                            Manajemen Lapangan
                        </h1>
                        <p className="text-xs text-slate-500 sm:text-sm">
                            Kelola lapangan fisik, harga per jam, dan pantau
                            status ketersediaan secara real-time.
                        </p>
                    </div>

                    <div className="flex w-full items-center gap-2 sm:gap-3 md:w-auto">
                        <button
                            onClick={() => setIsRecapModalOpen(true)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold whitespace-nowrap text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm md:flex-none md:px-5"
                        >
                            <Printer className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            Cetak Rekapan
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition-all hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm md:flex-none md:px-5"
                        >
                            <Plus className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            Tambah Lapangan
                        </button>
                    </div>
                </div>

                {/* Full-width Responsive Date Ribbon Without Overflow */}
                <div className="mb-2 flex w-full items-center justify-between gap-1 md:gap-3">
                    <button
                        onClick={handlePrevDays}
                        className="z-10 flex-shrink-0 rounded-full border border-slate-200/60 bg-white p-1.5 text-slate-400 shadow-sm transition-colors hover:text-slate-900 active:scale-95 md:p-2"
                        aria-label="Hari sebelumnya"
                    >
                        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                    </button>

                    <div className="grid flex-1 grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-7 md:gap-2">
                        {visibleDates.map((date, idx) => {
                            const isSelected =
                                date.getDate() === selectedDate.getDate() &&
                                date.getMonth() === selectedDate.getMonth() &&
                                date.getFullYear() ===
                                    selectedDate.getFullYear();

                            const today = new Date();
                            const isToday =
                                date.getDate() === today.getDate() &&
                                date.getMonth() === today.getMonth() &&
                                date.getFullYear() === today.getFullYear();

                            const dayName = new Intl.DateTimeFormat('id-ID', {
                                weekday: 'short',
                            }).format(date);
                            const dayNumber = date.getDate();

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedDate(date);
                                        // Fetch new bookings data for the selected date
                                        router.get(
                                            '/courts',
                                            {
                                                date: format(
                                                    date,
                                                    'yyyy-MM-dd',
                                                ),
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                    className={cn(
                                        'flex h-[60px] w-full flex-col items-center justify-center rounded-2xl border py-2 transition-all duration-200',
                                        isSelected
                                            ? 'relative border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/20 ring-offset-1 ring-offset-slate-50'
                                            : 'border-slate-200/60 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800',
                                        idx < 4
                                            ? 'flex'
                                            : idx < 5
                                              ? 'hidden sm:flex'
                                              : 'hidden md:flex',
                                    )}
                                >
                                    {isToday && isSelected && (
                                        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                        </div>
                                    )}
                                    <span
                                        className={cn(
                                            'mb-0.5 text-[9px] font-semibold tracking-wider uppercase',
                                            isSelected
                                                ? 'text-slate-300'
                                                : 'opacity-80 group-hover:opacity-100',
                                        )}
                                    >
                                        {isToday ? 'Hari Ini' : dayName}
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span
                                            className={cn(
                                                'font-heading text-xl font-semibold',
                                                isSelected ? 'text-white' : '',
                                            )}
                                        >
                                            {dayNumber}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleNextDays}
                        className="z-10 flex-shrink-0 rounded-full border border-slate-200/60 bg-white p-1.5 text-slate-400 shadow-sm transition-colors hover:text-slate-900 active:scale-95 md:p-2"
                        aria-label="Hari berikutnya"
                    >
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                </div>

                {/* Top Filters Row */}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setSelectedSportIds([])}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all',
                            selectedSportIds.length === 0
                                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
                        )}
                    >
                        Semua
                    </button>
                    {sports.map((sport) => {
                        const isSelected = selectedSportIds.includes(sport.id);
                        return (
                            <button
                                key={sport.id}
                                onClick={() => {
                                    if (isSelected) {
                                        setSelectedSportIds(
                                            selectedSportIds.filter(
                                                (id) => id !== sport.id,
                                            ),
                                        );
                                    } else {
                                        setSelectedSportIds([
                                            ...selectedSportIds,
                                            sport.id,
                                        ]);
                                    }
                                }}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all',
                                    isSelected
                                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
                                )}
                            >
                                {sport.name}
                            </button>
                        );
                    })}
                </div>

                {courts.length === 0 ? (
                    <div className="animate-in fade-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center duration-500">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <LayoutGrid className="h-8 w-8 text-slate-400" />
                        </div>
                        <h2 className="mb-1 text-lg font-semibold text-slate-900">
                            Belum Ada Lapangan
                        </h2>
                        <p className="mb-6 max-w-sm text-sm text-slate-500">
                            Mulai tambahkan lapangan untuk mengelola harga dan
                            menerima reservasi pelanggan.
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-500 transition-colors hover:text-emerald-600"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Lapangan Pertama
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 pb-10">
                        {courts
                            .filter(
                                (court) =>
                                    selectedSportIds.length === 0 ||
                                    selectedSportIds.includes(court.sport_id),
                            )
                            .map((court) => {
                                const courtImages =
                                    court.images && court.images.length > 0
                                        ? court.images
                                        : court.venue?.images &&
                                            court.venue.images.length > 0
                                          ? court.venue.images
                                          : null;

                                const isSelected = selectedCourtId === court.id;

                                const handleTimeSlotClickForCourt = (
                                    time: string,
                                    isAvailable: boolean,
                                    bookedSlots: string[],
                                ) => {
                                    if (!isAvailable) return;
                                    // Switch to this court if selecting a different one
                                    if (selectedCourtId !== court.id) {
                                        setSelectedCourtId(court.id);
                                        setSelectedRange({
                                            start: time,
                                            end: null,
                                        });
                                        return;
                                    }
                                    if (
                                        !selectedRange.start ||
                                        (selectedRange.start &&
                                            selectedRange.end)
                                    ) {
                                        setSelectedRange({
                                            start: time,
                                            end: null,
                                        });
                                        return;
                                    }
                                    if (
                                        selectedRange.start &&
                                        !selectedRange.end
                                    ) {
                                        if (time < selectedRange.start) {
                                            setSelectedRange({
                                                start: time,
                                                end: null,
                                            });
                                        } else if (time > selectedRange.start) {
                                            const startHour = parseInt(
                                                selectedRange.start.split(
                                                    ':',
                                                )[0],
                                            );
                                            const endHour = parseInt(
                                                time.split(':')[0],
                                            );
                                            let hasConflict = false;
                                            for (
                                                let h = startHour + 1;
                                                h <= endHour;
                                                h++
                                            ) {
                                                const checkTime = `${h.toString().padStart(2, '0')}:00`;
                                                if (
                                                    bookedSlots.includes(
                                                        checkTime,
                                                    )
                                                ) {
                                                    hasConflict = true;
                                                    break;
                                                }
                                            }
                                            if (hasConflict) {
                                                setSelectedRange({
                                                    start: time,
                                                    end: null,
                                                });
                                            } else {
                                                setSelectedRange({
                                                    start: selectedRange.start,
                                                    end: time,
                                                });
                                            }
                                        } else {
                                            setSelectedRange({
                                                start: null,
                                                end: null,
                                            });
                                        }
                                    }
                                };

                                return (
                                    <div
                                        key={court.id}
                                        className={cn(
                                            'overflow-hidden rounded-2xl border bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-300',
                                            isSelected
                                                ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                                                : 'border-slate-100 hover:border-slate-200 hover:shadow-md',
                                        )}
                                    >
                                        {/* ── Court Accordion Header ── */}
                                        <div
                                            onClick={() =>
                                                toggleCourtExpanded(court.id)
                                            }
                                            className="flex cursor-pointer items-center justify-between bg-white px-5 py-4 transition-colors select-none hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        'h-2.5 w-2.5 rounded-full shadow-sm',
                                                        court.is_booked_now
                                                            ? 'bg-red-500 shadow-red-500/40'
                                                            : court.is_active
                                                              ? 'bg-emerald-500 shadow-emerald-500/40'
                                                              : 'bg-slate-300 shadow-slate-400/40',
                                                    )}
                                                />
                                                <h3 className="font-heading text-lg font-extrabold tracking-tight text-slate-900">
                                                    {court.name}
                                                </h3>
                                                <span className="hidden items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase sm:flex">
                                                    {court.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="hidden text-right sm:block">
                                                    <p className="font-heading text-base leading-none font-extrabold text-emerald-500">
                                                        {new Intl.NumberFormat(
                                                            'id-ID',
                                                            {
                                                                style: 'currency',
                                                                currency: 'IDR',
                                                                maximumFractionDigits: 0,
                                                            },
                                                        ).format(
                                                            court.price_per_hour,
                                                        )}
                                                        <span className="ml-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                                            / Jam
                                                        </span>
                                                    </p>
                                                </div>
                                                <div
                                                    className={cn(
                                                        'rounded-full bg-slate-100 p-1.5 text-slate-500 transition-transform duration-300',
                                                        expandedCourts.includes(
                                                            court.id,
                                                        )
                                                            ? 'rotate-180 bg-slate-200 text-slate-700'
                                                            : 'rotate-0',
                                                    )}
                                                >
                                                    <ChevronDown className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Collapsible Info (Brief Detail) ── */}
                                        <div
                                            className={cn(
                                                'grid bg-slate-50/50 transition-all duration-300 ease-in-out',
                                                expandedCourts.includes(
                                                    court.id,
                                                )
                                                    ? 'grid-rows-[1fr] border-t border-slate-100 opacity-100'
                                                    : 'grid-rows-[0fr] opacity-0',
                                            )}
                                        >
                                            <div className="overflow-hidden">
                                                <div className="flex flex-col sm:flex-row">
                                                    {/* Image */}
                                                    <div className="relative h-36 w-full flex-shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-40 md:w-52">
                                                        <img
                                                            src={
                                                                courtImages
                                                                    ? getImageUrl(
                                                                          courtImages[0],
                                                                      )
                                                                    : 'https://images.unsplash.com/photo-1622225369201-020e408ec9cc?q=80&w=600&auto=format&fit=crop'
                                                            }
                                                            alt={court.name}
                                                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                                                        />
                                                        {/* Status Badge overlay */}
                                                        <div className="absolute top-2.5 left-2.5">
                                                            {court.is_booked_now ? (
                                                                <span className="inline-flex items-center gap-1.5 rounded bg-red-500/90 px-2 py-1 text-[9px] font-bold text-white shadow backdrop-blur-sm">
                                                                    <span className="relative flex h-1 w-1">
                                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-200 opacity-75"></span>
                                                                        <span className="relative inline-flex h-1 w-1 rounded-full bg-white"></span>
                                                                    </span>
                                                                    BOOKED
                                                                </span>
                                                            ) : court.is_active ? (
                                                                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/90 px-2 py-1 text-[9px] font-bold text-white shadow backdrop-blur-sm">
                                                                    <span className="relative flex h-1 w-1">
                                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-200 opacity-75"></span>
                                                                        <span className="relative inline-flex h-1 w-1 rounded-full bg-white"></span>
                                                                    </span>
                                                                    TERSEDIA
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 rounded bg-slate-500/90 px-2 py-1 text-[9px] font-bold text-white shadow backdrop-blur-sm">
                                                                    NONAKTIF
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Court Info & Actions */}
                                                    <div className="flex flex-1 flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center">
                                                        <div className="min-w-0 space-y-2.5">
                                                            <div className="flex items-center gap-2.5 text-[13px] font-medium text-slate-600">
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-100 bg-white shadow-sm">
                                                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                                </div>
                                                                <span className="truncate text-slate-700">
                                                                    {
                                                                        court
                                                                            .venue
                                                                            ?.name
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2.5 text-[13px] font-medium text-slate-600">
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-100 bg-white shadow-sm">
                                                                    <Activity className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                                </div>
                                                                <span className="text-slate-700">
                                                                    {
                                                                        court
                                                                            .sport
                                                                            ?.name
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 flex w-full shrink-0 items-center justify-end gap-2 sm:mt-0 sm:w-auto">
                                                            {/* Detail Button */}
                                                            <button
                                                                onClick={() =>
                                                                    setDetailCourt(
                                                                        court,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition-all outline-none hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95"
                                                            >
                                                                <Info className="h-3.5 w-3.5" />
                                                                Lihat Detail
                                                            </button>
                                                            {/* Edit / Delete */}
                                                            <button
                                                                onClick={() => {
                                                                    setEditingCourt(
                                                                        court,
                                                                    );
                                                                    setIsEditModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-emerald-500/30 hover:bg-emerald-50 hover:text-emerald-500 active:scale-95"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setDeletingCourt(
                                                                        court,
                                                                    );
                                                                    setIsDeleteModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Jadwal Ketersediaan ── */}
                                        <div className="border-t border-slate-100 px-5 py-5">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                                    <Clock className="h-4 w-4 text-emerald-500" />
                                                    Jadwal Ketersediaan
                                                </h4>
                                                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold tracking-wider text-emerald-500 uppercase">
                                                    {selectedDate.toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short',
                                                        },
                                                    )}
                                                </span>
                                            </div>

                                            {/* Time Slots Grid */}
                                            {(() => {
                                                const baseHours = Array.from(
                                                    { length: 15 },
                                                    (_, i) => i + 7,
                                                );
                                                const bookedSlots =
                                                    court.booked_slots || [];
                                                const timeSlots = baseHours.map(
                                                    (hour) => {
                                                        const timeString = `${hour.toString().padStart(2, '0')}:00`;
                                                        return {
                                                            time: timeString,
                                                            status: bookedSlots.includes(
                                                                timeString,
                                                            )
                                                                ? 'booked'
                                                                : 'available',
                                                        };
                                                    },
                                                );

                                                return (
                                                    <>
                                                        <div className="mb-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15">
                                                            {timeSlots.map(
                                                                (
                                                                    slot,
                                                                    index,
                                                                ) => {
                                                                    const isAvailable =
                                                                        slot.status ===
                                                                        'available';
                                                                    const isSlotSelected =
                                                                        (() => {
                                                                            if (
                                                                                !isSelected ||
                                                                                !selectedRange.start
                                                                            )
                                                                                return false;
                                                                            if (
                                                                                !selectedRange.end
                                                                            )
                                                                                return (
                                                                                    slot.time ===
                                                                                    selectedRange.start
                                                                                );
                                                                            return (
                                                                                slot.time >=
                                                                                    selectedRange.start &&
                                                                                slot.time <=
                                                                                    selectedRange.end
                                                                            );
                                                                        })();

                                                                    const isHoveredRange =
                                                                        (() => {
                                                                            if (
                                                                                !isSelected ||
                                                                                !isAvailable ||
                                                                                !selectedRange.start ||
                                                                                selectedRange.end ||
                                                                                !hoveredTime
                                                                            )
                                                                                return false;
                                                                            if (
                                                                                slot.time <=
                                                                                    selectedRange.start ||
                                                                                slot.time >
                                                                                    hoveredTime
                                                                            )
                                                                                return false;
                                                                            const startHour =
                                                                                parseInt(
                                                                                    selectedRange.start.split(
                                                                                        ':',
                                                                                    )[0],
                                                                                    10,
                                                                                );
                                                                            const hoverHour =
                                                                                parseInt(
                                                                                    hoveredTime.split(
                                                                                        ':',
                                                                                    )[0],
                                                                                    10,
                                                                                );
                                                                            for (
                                                                                let h =
                                                                                    startHour +
                                                                                    1;
                                                                                h <=
                                                                                hoverHour;
                                                                                h++
                                                                            ) {
                                                                                if (
                                                                                    bookedSlots.includes(
                                                                                        `${h.toString().padStart(2, '0')}:00`,
                                                                                    )
                                                                                )
                                                                                    return false;
                                                                            }
                                                                            return true;
                                                                        })();

                                                                    return (
                                                                        <button
                                                                            key={
                                                                                index
                                                                            }
                                                                            onClick={() => {
                                                                                if (
                                                                                    !isAvailable
                                                                                ) {
                                                                                    const meta =
                                                                                        court
                                                                                            .slot_meta?.[
                                                                                            slot
                                                                                                .time
                                                                                        ];
                                                                                    if (
                                                                                        meta
                                                                                    )
                                                                                        setBookedSlotInfo(
                                                                                            {
                                                                                                court,
                                                                                                meta,
                                                                                            },
                                                                                        );
                                                                                    return;
                                                                                }
                                                                                handleTimeSlotClickForCourt(
                                                                                    slot.time,
                                                                                    isAvailable,
                                                                                    bookedSlots,
                                                                                );
                                                                            }}
                                                                            onMouseEnter={() => {
                                                                                if (
                                                                                    isAvailable
                                                                                ) {
                                                                                    setSelectedCourtId(
                                                                                        court.id,
                                                                                    );
                                                                                    setHoveredTime(
                                                                                        slot.time,
                                                                                    );
                                                                                }
                                                                            }}
                                                                            onMouseLeave={() =>
                                                                                isAvailable &&
                                                                                setHoveredTime(
                                                                                    null,
                                                                                )
                                                                            }
                                                                            className={cn(
                                                                                'flex flex-col items-center justify-center rounded-lg border py-2 text-xs transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
                                                                                isAvailable
                                                                                    ? isSlotSelected
                                                                                        ? 'z-10 scale-[1.04] border-emerald-500 bg-emerald-500 font-bold text-white shadow-[0_4px_10px_rgba(34,197,94,0.25)]'
                                                                                        : isHoveredRange
                                                                                          ? 'scale-[1.02] border-emerald-500/40 bg-emerald-50 font-semibold text-emerald-600'
                                                                                          : 'cursor-pointer border-slate-200 bg-white font-semibold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-500 active:scale-95'
                                                                                    : 'relative cursor-pointer overflow-hidden border-red-200 bg-red-50 font-medium text-red-400 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-500',
                                                                            )}
                                                                        >
                                                                            {
                                                                                slot.time
                                                                            }
                                                                            {!isAvailable && (
                                                                                <>
                                                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                                                        <div className="h-px w-full rotate-[20deg] transform bg-red-300"></div>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                },
                                                            )}
                                                        </div>

                                                        {/* Legend */}
                                                        <div className="flex items-center gap-5 text-[11px] font-semibold text-slate-400">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="h-2.5 w-2.5 rounded-full border-2 border-slate-300 bg-white"></div>
                                                                <span>
                                                                    Tersedia
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="h-2.5 w-2.5 rounded-full border border-emerald-500 bg-emerald-500"></div>
                                                                <span className="text-slate-700">
                                                                    Dipilih
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="relative h-2.5 w-2.5 overflow-hidden rounded-full border border-red-300 bg-red-100">
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <div className="h-px w-full rotate-45 transform bg-red-400"></div>
                                                                    </div>
                                                                </div>
                                                                <span className="text-red-400">
                                                                    Terisi (klik
                                                                    untuk info)
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Booking Summary (appears when range selected for this court) */}
                                                        {isSelected &&
                                                            selectedRange.start && (
                                                                <div className="animate-in fade-in slide-in-from-top-1 mt-5 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 duration-300 sm:flex-row sm:items-end">
                                                                    <div>
                                                                        <p className="mb-1.5 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                                                            Ringkasan
                                                                        </p>
                                                                        <div className="flex items-baseline gap-2">
                                                                            <span className="font-heading text-2xl font-extrabold tracking-tight text-emerald-500">
                                                                                Rp{' '}
                                                                                {calculateTotalPrice(
                                                                                    court,
                                                                                    selectedRange,
                                                                                    selectedDate,
                                                                                ).toLocaleString(
                                                                                    'id-ID',
                                                                                )}
                                                                            </span>
                                                                            <span className="text-sm font-medium text-slate-500">
                                                                                untuk{' '}
                                                                                {getSelectedHoursCount()}{' '}
                                                                                jam
                                                                                (
                                                                                {
                                                                                    selectedRange.start
                                                                                }
                                                                                {selectedRange.end
                                                                                    ? ` – ${selectedRange.end}`
                                                                                    : ''}

                                                                                )
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() =>
                                                                            setIsBookingModalOpen(
                                                                                true,
                                                                            )
                                                                        }
                                                                        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-white shadow-emerald-500/20 transition-all outline-none hover:bg-emerald-600 hover:shadow-lg active:scale-[0.98] sm:w-auto"
                                                                    >
                                                                        Buat
                                                                        Booking
                                                                        <ArrowRight className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* ── Court Detail Modal ── */}
            {detailCourt &&
                (() => {
                    const dc = detailCourt;
                    const imgs =
                        dc.images && dc.images.length > 0
                            ? dc.images
                            : dc.venue?.images && dc.venue.images.length > 0
                              ? dc.venue.images
                              : null;
                    const fmt = (n: number) =>
                        new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            maximumFractionDigits: 0,
                        }).format(n);

                    return (
                        <Dialog
                            open={!!detailCourt}
                            onOpenChange={(open) =>
                                !open && setDetailCourt(null)
                            }
                        >
                            <DialogContent className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] sm:max-w-xl md:max-w-3xl">
                                {/* ── Two-column body ── */}
                                <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
                                    {/* Left — Image Panel */}
                                    <div className="relative h-52 shrink-0 overflow-hidden bg-slate-100 md:h-auto md:w-64 lg:w-72">
                                        {imgs ? (
                                            <img
                                                src={getImageUrl(imgs[0])}
                                                alt={dc.name}
                                                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                <UploadCloud className="h-12 w-12 stroke-1" />
                                            </div>
                                        )}
                                        {/* Gradient for text legibility */}
                                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent md:bg-linear-to-r md:from-black/50 md:via-transparent md:to-transparent" />

                                        {/* Close */}
                                        <button
                                            onClick={() => setDetailCourt(null)}
                                            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50 md:hidden"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>

                                        {/* Title overlay on mobile bottom, desktop left-bottom */}
                                        <div className="absolute right-0 bottom-0 left-0 p-4 md:p-5">
                                            <span
                                                className={cn(
                                                    'mb-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold backdrop-blur-sm',
                                                    dc.is_booked_now
                                                        ? 'border-red-300/40 bg-red-500/80 text-white'
                                                        : dc.is_active
                                                          ? 'border-emerald-300/40 bg-emerald-500/80 text-white'
                                                          : 'border-slate-400/40 bg-slate-600/80 text-white',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'h-1.5 w-1.5 rounded-full bg-white',
                                                        dc.is_booked_now &&
                                                            'animate-pulse',
                                                    )}
                                                />
                                                {dc.is_booked_now
                                                    ? 'Sedang Dipakai'
                                                    : dc.is_active
                                                      ? 'Tersedia'
                                                      : 'Nonaktif'}
                                            </span>
                                            <h2 className="font-heading text-xl leading-tight font-extrabold tracking-tight text-white drop-shadow">
                                                {dc.name}
                                            </h2>
                                            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/70">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                <span className="truncate">
                                                    {dc.venue?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right — Info Panel */}
                                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                        {/* Desktop close + header strip */}
                                        <div className="hidden shrink-0 items-center justify-between border-b border-slate-100 px-6 pt-5 pb-4 md:flex">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 capitalize">
                                                    {dc.type}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                                                    <Activity className="h-3 w-3" />
                                                    {dc.sport?.name}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setDetailCourt(null)
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Mobile type/sport badges */}
                                        <div className="flex shrink-0 items-center gap-2 px-5 pt-4 md:hidden">
                                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 capitalize">
                                                {dc.type}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                                                <Activity className="h-3 w-3" />
                                                {dc.sport?.name}
                                            </span>
                                        </div>

                                        {/* Scrollable content */}
                                        <div className="scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent flex-1 overflow-y-auto">
                                            {/* Price */}
                                            <div className="border-b border-slate-100 px-5 pt-4 pb-4 md:px-6">
                                                <p className="mb-0.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                                    Tarif per Jam
                                                </p>
                                                <p className="font-heading text-3xl leading-none font-extrabold tracking-tight text-emerald-500">
                                                    {fmt(dc.price_per_hour)}
                                                </p>
                                            </div>

                                            {/* Info rows */}
                                            <div className="space-y-3.5 border-b border-slate-100 px-5 py-4 md:px-6">
                                                <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                                    Informasi
                                                </p>
                                                {[
                                                    {
                                                        label: 'Tipe Area',
                                                        value: dc.type,
                                                        cap: true,
                                                    },
                                                    {
                                                        label: 'Olahraga',
                                                        value:
                                                            dc.sport?.name ??
                                                            '—',
                                                    },
                                                    {
                                                        label: 'Lokasi / Venue',
                                                        value:
                                                            dc.venue?.name ??
                                                            '—',
                                                    },
                                                ].map(
                                                    ({ label, value, cap }) => (
                                                        <div
                                                            key={label}
                                                            className="flex items-baseline justify-between gap-4"
                                                        >
                                                            <span className="shrink-0 text-[12px] text-slate-500">
                                                                {label}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'text-right text-[13px] font-semibold text-slate-900',
                                                                    cap &&
                                                                        'capitalize',
                                                                )}
                                                            >
                                                                {value}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>

                                            {/* Fasilitas */}
                                            <div className="px-5 py-4 md:px-6">
                                                <p className="mb-3 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                                    Fasilitas Venue
                                                </p>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {[
                                                        {
                                                            icon: Utensils,
                                                            label: 'Makanan Ringan',
                                                        },
                                                        {
                                                            icon: Coffee,
                                                            label: 'Minuman',
                                                        },
                                                        {
                                                            icon: Store,
                                                            label: 'Musholla',
                                                        },
                                                        {
                                                            icon: Car,
                                                            label: 'Parkir Mobil',
                                                        },
                                                        {
                                                            icon: Bike,
                                                            label: 'Parkir Motor',
                                                        },
                                                        {
                                                            icon: Bath,
                                                            label: 'Toilet',
                                                        },
                                                    ].map(
                                                        ({
                                                            icon: Icon,
                                                            label,
                                                        }) => (
                                                            <div
                                                                key={label}
                                                                className="group flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 transition-colors hover:border-emerald-500/30 hover:bg-emerald-50/40"
                                                            >
                                                                <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5] text-slate-400 transition-colors group-hover:text-emerald-500" />
                                                                <span className="text-[11px] leading-tight font-semibold text-slate-600">
                                                                    {label}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 md:px-6">
                                            <button
                                                onClick={() => {
                                                    setEditingCourt(dc);
                                                    setDetailCourt(null);
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        setDetailCourt(null)
                                                    }
                                                    className="px-3 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-700"
                                                >
                                                    Tutup
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDetailCourt(null);
                                                        setSelectedCourtId(
                                                            dc.id,
                                                        );
                                                    }}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95"
                                                >
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Pilih Slot Waktu
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    );
                })()}

            {/* Booking Slot Info Modal */}
            {bookedSlotInfo &&
                (() => {
                    const { court: bc, meta } = bookedSlotInfo;
                    const durationHours =
                        parseInt(meta.end_time.split(':')[0]) -
                        parseInt(meta.start_time.split(':')[0]);
                    const fmt = (n: number) =>
                        new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            maximumFractionDigits: 0,
                        }).format(n);
                    const statusConfig: Record<
                        string,
                        { label: string; className: string }
                    > = {
                        confirmed: {
                            label: 'Terkonfirmasi',
                            className:
                                'bg-emerald-50 text-emerald-700 border-emerald-200',
                        },
                        completed: {
                            label: 'Selesai',
                            className:
                                'bg-slate-100 text-slate-600 border-slate-200',
                        },
                        pending: {
                            label: 'Menunggu Konfirmasi',
                            className:
                                'bg-amber-50 text-amber-700 border-amber-200',
                        },
                        cancelled: {
                            label: 'Dibatalkan',
                            className: 'bg-red-50 text-red-600 border-red-200',
                        },
                    };
                    const status = statusConfig[meta.status] ?? {
                        label: meta.status,
                        className:
                            'bg-slate-100 text-slate-600 border-slate-200',
                    };

                    const handleSlotAction = async (
                        action: 'confirm' | 'cancel',
                    ) => {
                        setSlotActionLoading(action);
                        try {
                            await axios.patch(
                                `/bookings/${meta.booking_id}/${action}`,
                            );
                            setBookedSlotInfo(null);
                            router.reload({ only: ['courts'] });
                        } catch (err: any) {
                            window.dispatchEvent(
                                new CustomEvent('toast', {
                                    detail: {
                                        type: 'error',
                                        message:
                                            err.response?.data?.message ??
                                            'Terjadi kesalahan.',
                                    },
                                }),
                            );
                        } finally {
                            setSlotActionLoading(null);
                        }
                    };

                    const canConfirm = meta.status === 'pending';
                    const canCancel = !['cancelled', 'completed'].includes(
                        meta.status,
                    );

                    return (
                        <Dialog
                            open={!!bookedSlotInfo}
                            onOpenChange={(open) => {
                                if (!slotActionLoading) {
                                    !open && setBookedSlotInfo(null);
                                }
                            }}
                        >
                            <DialogContent
                                hideClose
                                className="w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] sm:max-w-[480px]"
                            >
                                {/* ── Header ── */}
                                <div className="border-b border-slate-100 px-5 pt-5 pb-4">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <span
                                            className={cn(
                                                'shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold',
                                                status.className,
                                            )}
                                        >
                                            {status.label}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setBookedSlotInfo(null)
                                            }
                                            disabled={!!slotActionLoading}
                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <h3 className="font-heading text-base leading-tight font-bold text-slate-900">
                                        {bc.name}
                                    </h3>
                                    <p className="mt-0.5 text-[12px] text-slate-400">
                                        {bc.venue?.name}
                                    </p>
                                </div>

                                {/* ── Time band ── */}
                                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                                    <div className="flex-1 text-center">
                                        <p className="mb-0.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                            Mulai
                                        </p>
                                        <p className="font-heading text-3xl leading-none font-black text-slate-900">
                                            {meta.start_time}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-center gap-0.5">
                                        <div className="flex items-center gap-1">
                                            <div className="h-px w-8 bg-slate-200" />
                                            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                                        </div>
                                        <span className="text-[10px] font-semibold text-slate-400">
                                            {durationHours} jam
                                        </span>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <p className="mb-0.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                            Selesai
                                        </p>
                                        <p className="font-heading text-3xl leading-none font-black text-slate-900">
                                            {meta.end_time}
                                        </p>
                                    </div>
                                </div>

                                {/* ── Details ── */}
                                <div className="space-y-3 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                                            <span className="text-[11px] font-black text-slate-500">
                                                {meta.customer
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-bold text-slate-900">
                                                {meta.customer}
                                            </p>
                                            <p className="text-[12px] text-slate-400">
                                                {meta.phone}
                                            </p>
                                        </div>
                                        <div className="ml-auto shrink-0 text-right">
                                            <p className="mb-0.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                                Total
                                            </p>
                                            <p className="font-heading text-base font-extrabold text-slate-900">
                                                {fmt(meta.total_price)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {meta.notes && (
                                    <div className="px-6 py-2 pb-4">
                                        <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                                            <h4 className="mb-1.5 text-[11px] font-bold tracking-wider text-orange-800 uppercase">
                                                Catatan Resepsionis
                                            </h4>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-orange-900">
                                                {meta.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ── Footer actions ── */}
                                <div className="flex items-center justify-between gap-3 px-6 pt-2 pb-6">
                                    <div className="flex items-center gap-2">
                                        {canCancel && (
                                            <button
                                                onClick={() =>
                                                    handleSlotAction('cancel')
                                                }
                                                disabled={!!slotActionLoading}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-[12px] font-bold text-red-600 transition-all hover:bg-red-100 active:scale-[0.97] disabled:opacity-50"
                                            >
                                                {slotActionLoading ===
                                                'cancel' ? (
                                                    <Spinner className="h-3.5 w-3.5" />
                                                ) : (
                                                    <XCircle className="h-3.5 w-3.5" />
                                                )}
                                                Batalkan
                                            </button>
                                        )}
                                        {canConfirm && (
                                            <button
                                                onClick={() =>
                                                    handleSlotAction('confirm')
                                                }
                                                disabled={!!slotActionLoading}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50"
                                            >
                                                {slotActionLoading ===
                                                'confirm' ? (
                                                    <Spinner className="h-3.5 w-3.5" />
                                                ) : (
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                )}
                                                Konfirmasi
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setBookedSlotInfo(null)}
                                        disabled={!!slotActionLoading}
                                        className="rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    );
                })()}

            {/* Create Modal */}
            <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            >
                <DialogContent
                    hideClose
                    className="flex max-h-[90dvh] w-[95vw] flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl sm:max-w-xl md:max-w-4xl"
                >
                    <DialogHeader className="relative flex-shrink-0 border-b border-slate-100 px-6 py-6 pb-4 sm:px-8">
                        <DialogTitle className="pr-10 text-xl font-bold text-slate-900 md:text-2xl">
                            Tambah Lapangan Baru
                        </DialogTitle>
                        <DialogDescription className="mt-1.5 text-sm font-medium text-slate-500">
                            Konfigurasi lapangan fisik baru untuk sistem
                            reservasi.
                        </DialogDescription>
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-6 right-6 rounded-full p-2 text-slate-400 transition-colors outline-none hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </DialogHeader>
                    <CreateCourtForm
                        venues={venues}
                        sports={sports}
                        onSuccess={() => setIsCreateModalOpen(false)}
                        onCancel={() => setIsCreateModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsEditModalOpen(false);
                        setTimeout(() => setEditingCourt(null), 300);
                    }
                }}
            >
                <DialogContent
                    hideClose
                    className="flex max-h-[90dvh] w-[95vw] flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl sm:max-w-xl md:max-w-4xl"
                >
                    <DialogHeader className="relative flex-shrink-0 border-b border-slate-100 px-6 py-6 pb-4 sm:px-8">
                        <DialogTitle className="pr-10 text-xl font-bold text-slate-900 md:text-2xl">
                            Edit Lapangan
                        </DialogTitle>
                        <DialogDescription className="mt-1.5 text-sm font-medium text-slate-500">
                            Perbarui informasi harga, lokasi, atau tipe
                            lapangan.
                        </DialogDescription>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-6 right-6 rounded-full p-2 text-slate-400 transition-colors outline-none hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </DialogHeader>
                    {editingCourt && (
                        <EditCourtForm
                            court={editingCourt}
                            venues={venues}
                            sports={sports}
                            onSuccess={() => setIsEditModalOpen(false)}
                            onCancel={() => setIsEditModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog
                open={isDeleteModalOpen}
                onOpenChange={(open) => {
                    setIsDeleteModalOpen(open);
                    if (!open) setTimeout(() => setDeletingCourt(null), 200);
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="animate-in zoom-in-50 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 duration-300">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-center font-heading text-xl">
                            Hapus Lapangan?
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-center">
                            Anda yakin ingin menghapus{' '}
                            <span className="font-semibold text-slate-900">
                                {deletingCourt?.name}
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan dan akan
                            menghapus semua jadwal reservasi yang belum diproses
                            untuk lapangan ini.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 gap-2 sm:justify-center">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (deletingCourt) {
                                    router.delete(destroy(deletingCourt.id), {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setIsDeleteModalOpen(false);
                                            window.dispatchEvent(
                                                new CustomEvent('toast', {
                                                    detail: {
                                                        type: 'success',
                                                        message:
                                                            'Lapangan berhasil dihapus.',
                                                    },
                                                }),
                                            );
                                        },
                                    });
                                }
                            }}
                            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                            Hapus Lapangan
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Recap Modal */}
            <Dialog open={isRecapModalOpen} onOpenChange={setIsRecapModalOpen}>
                <DialogContent
                    hideClose
                    className="flex w-[95vw] flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl sm:max-w-md"
                >
                    <DialogHeader className="relative flex-shrink-0 border-b border-slate-100 px-6 py-6 pb-4">
                        <DialogTitle className="pr-10 text-xl font-bold text-slate-900">
                            Cetak Rekapan
                        </DialogTitle>
                        <DialogDescription className="mt-1.5 text-sm font-medium text-slate-500">
                            Pilih periode untuk mengekspor rekapan pendapatan
                            seluruh lapangan.
                        </DialogDescription>
                        <button
                            onClick={() => setIsRecapModalOpen(false)}
                            className="absolute top-6 right-6 rounded-full p-2 text-slate-400 transition-colors outline-none hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </DialogHeader>

                    <div className="space-y-4 px-6 py-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-900">
                                Periode Rekapan
                            </label>
                            <div className="relative">
                                <select
                                    value={recapPeriod}
                                    onChange={(e) =>
                                        setRecapPeriod(e.target.value)
                                    }
                                    className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none sm:text-sm"
                                >
                                    <option value="today">Hari Ini</option>
                                    <option value="week">Minggu Ini</option>
                                    <option value="month">Bulan Ini</option>
                                    <option value="year">Tahun Ini</option>
                                    <option value="custom">
                                        Kustom Tanggal
                                    </option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        {recapPeriod === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-500">
                                        Dari Tanggal
                                    </label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                className={cn(
                                                    'flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-sm font-medium text-slate-900 transition-all',
                                                    !recapStartDate
                                                        ? 'border-slate-200 text-slate-400'
                                                        : 'border-emerald-500 ring-1 ring-emerald-500/20',
                                                )}
                                            >
                                                {recapStartDate
                                                    ? format(
                                                          recapStartDate,
                                                          'dd MMM yyyy',
                                                          { locale: id },
                                                      )
                                                    : 'Pilih Tanggal'}
                                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="z-[100] w-auto rounded-xl border-slate-200 bg-white p-0 shadow-lg"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={recapStartDate}
                                                onSelect={setRecapStartDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-500">
                                        Sampai Tanggal
                                    </label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                className={cn(
                                                    'flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-sm font-medium text-slate-900 transition-all',
                                                    !recapEndDate
                                                        ? 'border-slate-200 text-slate-400'
                                                        : 'border-emerald-500 ring-1 ring-emerald-500/20',
                                                )}
                                            >
                                                {recapEndDate
                                                    ? format(
                                                          recapEndDate,
                                                          'dd MMM yyyy',
                                                          { locale: id },
                                                      )
                                                    : 'Pilih Tanggal'}
                                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="z-[100] w-auto rounded-xl border-slate-200 bg-white p-0 shadow-lg"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={recapEndDate}
                                                onSelect={setRecapEndDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-6">
                        <button
                            onClick={() => setIsRecapModalOpen(false)}
                            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200/50 hover:text-slate-900"
                        >
                            Batal
                        </button>
                        <button
                            disabled={
                                recapPeriod === 'custom' &&
                                (!recapStartDate || !recapEndDate)
                            }
                            onClick={() => {
                                let url = `/bookings/recap?period=${recapPeriod}`;
                                if (
                                    recapPeriod === 'custom' &&
                                    recapStartDate &&
                                    recapEndDate
                                ) {
                                    url += `&start_date=${format(recapStartDate, 'yyyy-MM-dd')}&end_date=${format(recapEndDate, 'yyyy-MM-dd')}`;
                                }
                                window.open(url, '_blank');
                                setIsRecapModalOpen(false);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Printer className="h-4 w-4" />
                            Export PDF
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isBookingModalOpen}
                onOpenChange={(open) => {
                    setIsBookingModalOpen(open);
                    if (!open) {
                        setTimeout(() => {
                            setBookingUserMode('search');
                            setSelectedCustomer(null);
                            setNewCustomer({ name: '', email: '', phone: '' });
                            setSearchQuery('');
                            setBookingError('');
                        }, 300);
                    }
                }}
            >
                <DialogContent className="flex max-h-[90dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl sm:max-w-lg md:max-h-[85vh] md:max-w-[800px]">
                    <DialogHeader className="shrink-0 space-y-1 border-b border-slate-100 bg-white px-6 py-6 sm:px-8 md:px-10">
                        <DialogTitle className="text-xl font-bold text-slate-900 md:text-2xl">
                            Konfirmasi Booking
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500">
                            Lengkapi detail kustomer dan selesaikan reservasi
                            ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative h-full min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 md:px-10 md:py-8">
                        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
                            {/* LEFT COLUMN: Customer */}
                            <div className="space-y-8">
                                {selectedCustomer ? (
                                    <div className="animate-in slide-in-from-left-4 fade-in duration-500">
                                        <div className="mb-8 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                                <h3 className="text-sm font-bold tracking-wide text-slate-900 uppercase">
                                                    Kustomer Terpilih
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setSelectedCustomer(null)
                                                }
                                                className="group flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-red-500"
                                            >
                                                <X className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                                                Ganti Kustomer
                                            </button>
                                        </div>

                                        <div className="relative pl-6 before:absolute before:top-1 before:bottom-1 before:left-0 before:w-[3px] before:rounded-full">
                                            <div className="mb-2 flex flex-wrap items-end gap-3 md:gap-4">
                                                <h4 className="font-heading text-3xl leading-none font-black tracking-tight break-all text-slate-900 md:text-4xl">
                                                    {selectedCustomer.name}
                                                </h4>
                                                {selectedCustomer.id ? (
                                                    <span className="mb-1 inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
                                                        Member
                                                    </span>
                                                ) : (
                                                    <span className="mb-1 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                                                        Baru
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-7 flex flex-col gap-3 overflow-hidden sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:gap-6">
                                                <div className="flex min-w-0 items-center gap-3 text-slate-600">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
                                                        <Mail className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span
                                                        className="truncate text-[15px] font-medium"
                                                        title={
                                                            selectedCustomer.email
                                                        }
                                                    >
                                                        {selectedCustomer.email}
                                                    </span>
                                                </div>
                                                <div className="flex min-w-0 items-center gap-3 text-slate-600">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
                                                        <Phone className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span
                                                        className="truncate text-[15px] font-medium"
                                                        title={
                                                            selectedCustomer.phone
                                                        }
                                                    >
                                                        {selectedCustomer.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="no-scrollbar flex items-center gap-4 overflow-x-auto md:gap-6">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setBookingUserMode('search')
                                                }
                                                className={cn(
                                                    'border-b-[3px] pb-3 text-sm font-bold transition-colors',
                                                    bookingUserMode === 'search'
                                                        ? 'border-emerald-500 text-emerald-500'
                                                        : 'border-transparent text-slate-400 hover:text-slate-600',
                                                )}
                                            >
                                                Cari Kustomer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setBookingUserMode('create')
                                                }
                                                className={cn(
                                                    'border-b-[3px] pb-3 text-sm font-bold transition-colors',
                                                    bookingUserMode === 'create'
                                                        ? 'border-emerald-500 text-emerald-500'
                                                        : 'border-transparent text-slate-400 hover:text-slate-600',
                                                )}
                                            >
                                                Buat Baru
                                            </button>
                                        </div>

                                        {bookingUserMode === 'search' ? (
                                            <div className="space-y-4 pt-2">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={searchQuery}
                                                    onChange={(e) =>
                                                        setSearchQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Ketik nama, email, atau telepon..."
                                                    className="w-full border-0 border-b border-slate-200 bg-transparent py-3.5 text-base font-medium transition-all outline-none focus:border-emerald-500 focus:ring-0"
                                                />
                                                {searchQuery.trim().length >
                                                    0 && (
                                                    <div className="animate-in slide-in-from-top-2 fade-in flex flex-col pt-2 duration-200">
                                                        {isSearching ? (
                                                            <div className="flex items-center justify-center py-8">
                                                                <Spinner className="h-5 w-5 text-emerald-500" />
                                                            </div>
                                                        ) : searchResults.length >
                                                          0 ? (
                                                            searchResults.map(
                                                                (user) => (
                                                                    <div
                                                                        key={
                                                                            user.id
                                                                        }
                                                                        onClick={() =>
                                                                            setSelectedCustomer(
                                                                                user,
                                                                            )
                                                                        }
                                                                        className="group flex cursor-pointer items-center justify-between border-b border-slate-50 py-4 last:border-0"
                                                                    >
                                                                        <div className="min-w-0 pr-4">
                                                                            <p className="truncate font-bold text-slate-900 transition-colors group-hover:text-emerald-500">
                                                                                {
                                                                                    user.name
                                                                                }
                                                                            </p>
                                                                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 truncate text-sm text-slate-500">
                                                                                {user.email && (
                                                                                    <span>
                                                                                        {
                                                                                            user.email
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                                {user.email &&
                                                                                    user.phone && (
                                                                                        <span className="text-[10px] opacity-50">
                                                                                            •
                                                                                        </span>
                                                                                    )}
                                                                                {user.phone && (
                                                                                    <span>
                                                                                        {
                                                                                            user.phone
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                                {!user.email &&
                                                                                    !user.phone && (
                                                                                        <span className="italic">
                                                                                            Tidak
                                                                                            ada
                                                                                            kontak
                                                                                        </span>
                                                                                    )}
                                                                            </p>
                                                                        </div>
                                                                        <ArrowRight className="h-5 w-5 shrink-0 transform text-emerald-500 opacity-0 transition-opacity group-hover:translate-x-1 group-hover:opacity-100" />
                                                                    </div>
                                                                ),
                                                            )
                                                        ) : (
                                                            <div className="py-8 text-center text-sm font-medium text-slate-500">
                                                                Tidak ada
                                                                kustomer yang
                                                                cocok dengan
                                                                pencarian Anda.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="animate-in slide-in-from-right-2 fade-in flex h-full flex-col space-y-5 pt-2 duration-300">
                                                <div className="group relative">
                                                    <input
                                                        id="cust_name"
                                                        type="text"
                                                        required
                                                        value={newCustomer.name}
                                                        onChange={(e) =>
                                                            setNewCustomer({
                                                                ...newCustomer,
                                                                name: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        placeholder=" "
                                                        className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:bg-transparent focus:ring-0 focus:outline-none"
                                                    />
                                                    <label
                                                        htmlFor="cust_name"
                                                        className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-emerald-500 peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                                    >
                                                        Nama Lengkap
                                                    </label>
                                                </div>
                                                <div className="group relative">
                                                    <input
                                                        id="cust_email"
                                                        type="email"
                                                        required
                                                        value={
                                                            newCustomer.email
                                                        }
                                                        onChange={(e) =>
                                                            setNewCustomer({
                                                                ...newCustomer,
                                                                email: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        placeholder=" "
                                                        className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:bg-transparent focus:ring-0 focus:outline-none"
                                                    />
                                                    <label
                                                        htmlFor="cust_email"
                                                        className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-emerald-500 peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                                    >
                                                        Alamat Email
                                                    </label>
                                                </div>
                                                <div className="group relative">
                                                    <input
                                                        id="cust_phone"
                                                        type="text"
                                                        required
                                                        value={
                                                            newCustomer.phone
                                                        }
                                                        onChange={(e) =>
                                                            setNewCustomer({
                                                                ...newCustomer,
                                                                phone: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        placeholder=" "
                                                        className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:bg-transparent focus:ring-0 focus:outline-none"
                                                    />
                                                    <label
                                                        htmlFor="cust_phone"
                                                        className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-emerald-500 peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                                    >
                                                        Nomor Telepon
                                                    </label>
                                                </div>
                                                <div className="mt-8 space-y-3">
                                                    {customerError && (
                                                        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[13px] font-medium text-red-500">
                                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                                            <span>
                                                                {customerError}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            setIsCreatingCustomer(
                                                                true,
                                                            );
                                                            setCustomerError(
                                                                '',
                                                            );
                                                            try {
                                                                const response =
                                                                    await axios.post(
                                                                        '/users/quick-store',
                                                                        newCustomer,
                                                                    );
                                                                setSelectedCustomer(
                                                                    response
                                                                        .data
                                                                        .user,
                                                                );
                                                            } catch (error: any) {
                                                                setCustomerError(
                                                                    error
                                                                        .response
                                                                        ?.data
                                                                        ?.message ||
                                                                        'Gagal menambahkan kustomer.',
                                                                );
                                                            } finally {
                                                                setIsCreatingCustomer(
                                                                    false,
                                                                );
                                                            }
                                                        }}
                                                        disabled={
                                                            !newCustomer.name ||
                                                            !newCustomer.email ||
                                                            !newCustomer.phone ||
                                                            isCreatingCustomer
                                                        }
                                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isCreatingCustomer ? (
                                                            <Spinner className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        )}
                                                        {isCreatingCustomer
                                                            ? 'Memproses...'
                                                            : 'Gunakan Kustomer Ini'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* RIGHT COLUMN: Booking Details & Payment */}
                            <div className="space-y-10">
                                {/* Summary Block */}
                                <div>
                                    <h3 className="mb-6 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        Rincian Reservasi
                                    </h3>
                                    {(() => {
                                        const selectedCourt = courts.find(
                                            (c) => c.id === selectedCourtId,
                                        );
                                        if (!selectedCourt) return null;
                                        const hours = getSelectedHoursCount();
                                        const total = calculateTotalPrice(
                                            selectedCourt,
                                            selectedRange,
                                            selectedDate,
                                        );

                                        return (
                                            <div className="flex flex-col gap-5 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">
                                                        Lapangan
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {selectedCourt.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">
                                                        Lokasi
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {
                                                            selectedCourt.venue
                                                                ?.name
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">
                                                        Tanggal
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {selectedDate.toLocaleDateString(
                                                            'id-ID',
                                                            {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">
                                                        Waktu Main
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {selectedRange.start}{' '}
                                                        {selectedRange.end
                                                            ? `- ${selectedRange.end}`
                                                            : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">
                                                        Durasi
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {hours} Jam
                                                    </span>
                                                </div>
                                                <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-5">
                                                    <label
                                                        htmlFor="overrideTotal"
                                                        className="flex items-center justify-between font-medium text-slate-900"
                                                    >
                                                        <span>Total Harga</span>
                                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                                                            Bisa diedit
                                                        </span>
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-semibold text-slate-500">
                                                            Rp
                                                        </span>
                                                        <input
                                                            id="overrideTotal"
                                                            type="text"
                                                            value={
                                                                customTotal !==
                                                                null
                                                                    ? customTotal.toLocaleString(
                                                                          'id-ID',
                                                                      )
                                                                    : total.toLocaleString(
                                                                          'id-ID',
                                                                      )
                                                            }
                                                            onChange={(e) => {
                                                                const val =
                                                                    e.target.value.replace(
                                                                        /\D/g,
                                                                        '',
                                                                    );
                                                                if (
                                                                    val === ''
                                                                ) {
                                                                    setCustomTotal(
                                                                        total,
                                                                    ); // Revert to calculated if emptied, or 0
                                                                } else {
                                                                    setCustomTotal(
                                                                        Number(
                                                                            val,
                                                                        ),
                                                                    );
                                                                }
                                                            }}
                                                            className="block w-full rounded-xl border-slate-200 py-2.5 pr-4 pl-10 text-lg font-bold text-slate-900 transition-all hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                                                        />
                                                    </div>
                                                    {customTotal !== null &&
                                                        customTotal !==
                                                            total && (
                                                            <div className="mt-1 flex items-center justify-between">
                                                                <p className="text-[11px] text-slate-500">
                                                                    Harga
                                                                    sistem: Rp{' '}
                                                                    {total.toLocaleString(
                                                                        'id-ID',
                                                                    )}
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setCustomTotal(
                                                                            null,
                                                                        )
                                                                    }
                                                                    className="text-[11px] font-semibold text-emerald-500 hover:underline"
                                                                >
                                                                    Kembalikan
                                                                </button>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Payment Block */}
                                <div>
                                    <h3 className="mb-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        Status Pembayaran
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPaymentStatus('paid')
                                            }
                                            className={cn(
                                                'flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200',
                                                paymentStatus === 'paid'
                                                    ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'text-sm font-bold',
                                                    paymentStatus === 'paid'
                                                        ? 'text-emerald-500'
                                                        : 'text-slate-700',
                                                )}
                                            >
                                                Sudah Dibayar
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                Lunas saat ini
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPaymentStatus('unpaid')
                                            }
                                            className={cn(
                                                'flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200',
                                                paymentStatus === 'unpaid'
                                                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'text-sm font-bold',
                                                    paymentStatus === 'unpaid'
                                                        ? 'text-amber-600'
                                                        : 'text-slate-700',
                                                )}
                                            >
                                                Belum Dibayar
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                Bayar nanti
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* Notes Block */}
                            <div className="pt-2">
                                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Catatan Resepsionis{' '}
                                    <span className="font-normal tracking-normal text-slate-400 lowercase">
                                        (Opsional)
                                    </span>
                                </h3>
                                <textarea
                                    value={bookingNotes}
                                    onChange={(e) =>
                                        setBookingNotes(e.target.value)
                                    }
                                    placeholder="Tambahkan catatan khusus, request raket, atau info kustomer..."
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:outline-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex w-full shrink-0 flex-col-reverse items-stretch justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:px-8 md:px-10">
                        <button
                            type="button"
                            onClick={() => setIsBookingModalOpen(false)}
                            className="mt-2 w-full rounded-lg px-5 py-2.5 text-[13px] font-bold text-slate-500 transition-colors outline-none hover:bg-slate-100 hover:text-slate-900 sm:mt-0 sm:w-auto"
                        >
                            Batal
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (!selectedCustomer) {
                                    setBookingError(
                                        'Pilih atau buat kustomer terlebih dahulu.',
                                    );
                                    return;
                                }
                                setBookingError('');
                                setIsConfirmModalOpen(true);
                            }}
                            className="w-full rounded-lg bg-emerald-500 px-6 py-2.5 text-center text-[13px] font-bold text-white shadow-sm shadow-emerald-500/20 transition-all outline-none hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 sm:w-auto"
                        >
                            Konfirmasi Reservasi
                        </button>
                    </div>
                    {bookingError && (
                        <div className="flex items-center gap-2 px-6 pb-4 text-[13px] font-medium text-red-500 sm:px-8 md:px-10">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {bookingError}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Confirmation Dialog */}
            {(() => {
                const selectedCourt = courts.find(
                    (c) => c.id === selectedCourtId,
                );
                const hours = getSelectedHoursCount();
                const calculatedTotal = selectedCourt
                    ? calculateTotalPrice(
                          selectedCourt,
                          selectedRange,
                          selectedDate,
                      )
                    : 0;
                const effectiveTotal =
                    customTotal !== null ? customTotal : calculatedTotal;

                const handleSubmitBooking = async () => {
                    if (!selectedCourt || !selectedCustomer) return;
                    setIsSubmittingBooking(true);
                    setBookingError('');

                    // Compute end_time: if selectedRange.end exists, use next hour; else start + 1h
                    const endHour = selectedRange.end
                        ? parseInt(selectedRange.end.split(':')[0], 10) + 1
                        : parseInt(selectedRange.start!.split(':')[0], 10) + 1;
                    const endTime = `${endHour.toString().padStart(2, '0')}:00`;

                    try {
                        await axios.post('/bookings', {
                            user_id: selectedCustomer.id,
                            court_id: selectedCourt.id,
                            date: format(selectedDate, 'yyyy-MM-dd'),
                            start_time: selectedRange.start!,
                            end_time: endTime,
                            total_price: effectiveTotal,
                            payment_status: paymentStatus,
                            notes: bookingNotes,
                        });

                        setIsConfirmModalOpen(false);
                        setIsBookingModalOpen(false);
                        setSelectedRange({ start: '08:00', end: null });
                        setSelectedCustomer(null);
                        setSearchQuery('');
                        setPaymentStatus('paid');
                        setCustomTotal(null);
                        setBookingNotes('');

                        window.dispatchEvent(
                            new CustomEvent('toast', {
                                detail: {
                                    type: 'success',
                                    message: 'Booking berhasil dibuat!',
                                },
                            }),
                        );

                        router.reload({ only: ['courts'] });
                    } catch (err: any) {
                        setBookingError(
                            err.response?.data?.message ??
                                'Terjadi kesalahan. Coba lagi.',
                        );
                        setIsConfirmModalOpen(false);
                        setSelectedRange({ start: null, end: null });
                        router.reload({ only: ['courts'] });
                    } finally {
                        setIsSubmittingBooking(false);
                    }
                };

                return (
                    <Dialog
                        open={isConfirmModalOpen}
                        onOpenChange={(open) => {
                            if (!isSubmittingBooking) {
                                setIsConfirmModalOpen(open);
                            }
                        }}
                    >
                        <DialogContent className="overflow-hidden rounded-2xl border-slate-200/60 bg-white p-0 shadow-2xl sm:max-w-md">
                            <DialogHeader className="border-b border-slate-100 px-7 pt-7 pb-5">
                                <DialogTitle className="text-lg font-bold text-slate-900">
                                    Konfirmasi Booking
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-500">
                                    Pastikan semua detail di bawah sudah benar
                                    sebelum membuat booking.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 px-7 py-5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">
                                        Lapangan
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                        {selectedCourt?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">
                                        Kustomer
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                        {selectedCustomer?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">
                                        Tanggal
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                        {selectedDate.toLocaleDateString(
                                            'id-ID',
                                            {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            },
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">
                                        Waktu
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                        {selectedRange.start}
                                        {selectedRange.end
                                            ? ` – ${selectedRange.end}`
                                            : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">
                                        Durasi
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                        {hours} Jam
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">
                                        Pembayaran
                                    </span>
                                    <span
                                        className={cn(
                                            'font-semibold',
                                            paymentStatus === 'paid'
                                                ? 'text-emerald-500'
                                                : 'text-amber-600',
                                        )}
                                    >
                                        {paymentStatus === 'paid'
                                            ? 'Sudah Dibayar'
                                            : 'Belum Dibayar'}
                                    </span>
                                </div>
                                <div className="mt-2 flex justify-between border-t border-slate-100 pt-3">
                                    <span className="font-medium text-slate-900">
                                        Total
                                    </span>
                                    <span className="text-lg font-bold text-slate-900">
                                        Rp{' '}
                                        {effectiveTotal.toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {bookingNotes && (
                                    <div className="mt-4 rounded-lg border border-yellow-100 bg-yellow-50 p-4">
                                        <h4 className="mb-2 text-[11px] font-bold tracking-wider text-yellow-800 uppercase">
                                            Catatan
                                        </h4>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-yellow-900">
                                            {bookingNotes}
                                        </p>
                                    </div>
                                )}

                                {bookingError && (
                                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-[13px] font-medium text-red-500">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {bookingError}
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex flex-col-reverse justify-end gap-3 px-7 pb-6 sm:flex-row">
                                <button
                                    type="button"
                                    disabled={isSubmittingBooking}
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    className="w-full rounded-lg px-5 py-2.5 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 sm:w-auto"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmittingBooking}
                                    onClick={handleSubmitBooking}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all outline-none hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 disabled:opacity-70 sm:w-auto"
                                >
                                    {isSubmittingBooking && (
                                        <Spinner className="h-4 w-4" />
                                    )}
                                    {isSubmittingBooking
                                        ? 'Memproses...'
                                        : 'Ya, Buat Booking'}
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                );
            })()}
        </AppLayout>
    );
}

// ----------------------------------------------------------------------
// PRICING RULES EDITOR COMPONENT
// ----------------------------------------------------------------------
function PricingRulesEditor({
    rules,
    onChange,
}: {
    rules: PricingRule[];
    onChange: (newRules: PricingRule[]) => void;
}) {
    const daysOfWeek = [
        { id: 1, name: 'Sen' },
        { id: 2, name: 'Sel' },
        { id: 3, name: 'Rab' },
        { id: 4, name: 'Kam' },
        { id: 5, name: 'Jum' },
        { id: 6, name: 'Sab' },
        { id: 0, name: 'Min' },
    ];

    const addRule = () => {
        onChange([
            ...rules,
            { days: [], start_time: '06:00', end_time: '18:00', price: '' },
        ]);
    };

    const removeRule = (index: number) => {
        const newRules = [...rules];
        newRules.splice(index, 1);
        onChange(newRules);
    };

    const updateRule = (
        index: number,
        field: keyof PricingRule,
        value: any,
    ) => {
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], [field]: value };
        onChange(newRules);
    };

    const toggleDay = (ruleIndex: number, day: number) => {
        const rule = rules[ruleIndex];
        const newDays = rule.days.includes(day)
            ? rule.days.filter((d) => d !== day)
            : [...rule.days, day].sort();
        updateRule(ruleIndex, 'days', newDays);
    };

    const handlePriceChange = (index: number, rawValue: string) => {
        if (!rawValue) {
            updateRule(index, 'price', '');
            return;
        }
        const numericValue = rawValue.replace(/\D/g, '');
        updateRule(index, 'price', numericValue ? Number(numericValue) : '');
    };

    return (
        <div className="col-span-full space-y-3 pt-2">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[13px] font-bold text-slate-900">
                        Harga Khusus{' '}
                        <span className="ml-1 text-[11px] font-semibold text-slate-400">
                            Opsional
                        </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                        Tarif berdasarkan hari & jam. Aturan teratas
                        diprioritaskan jika tumpang tindih.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addRule}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-500"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah
                </button>
            </div>

            {rules.length > 0 && (
                <div className="space-y-2">
                    {rules.map((rule, index) => (
                        <div
                            key={index}
                            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                            {/* Rule header */}
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                    Aturan {index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeRule(index)}
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {/* Days */}
                            <div className="flex flex-wrap gap-1.5">
                                {daysOfWeek.map((day) => {
                                    const isSelected = rule.days.includes(
                                        day.id,
                                    );
                                    return (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() =>
                                                toggleDay(index, day.id)
                                            }
                                            className={cn(
                                                'rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-all active:scale-95',
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-500/50 hover:text-emerald-500',
                                            )}
                                        >
                                            {day.name}
                                        </button>
                                    );
                                })}
                            </div>
                            {rule.days.length === 0 && (
                                <p className="text-[11px] font-medium text-red-500">
                                    Pilih minimal satu hari
                                </p>
                            )}

                            {/* Time + Price row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Mulai
                                    </label>
                                    <Input
                                        type="time"
                                        value={rule.start_time}
                                        onChange={(e) =>
                                            updateRule(
                                                index,
                                                'start_time',
                                                e.target.value,
                                            )
                                        }
                                        className="h-9 rounded-lg border-slate-200 bg-white text-center text-[13px] font-semibold focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Selesai
                                    </label>
                                    <Input
                                        type="time"
                                        value={rule.end_time}
                                        onChange={(e) =>
                                            updateRule(
                                                index,
                                                'end_time',
                                                e.target.value,
                                            )
                                        }
                                        className="h-9 rounded-lg border-slate-200 bg-white text-center text-[13px] font-semibold focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Tarif/Jam
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            value={
                                                rule.price
                                                    ? rule.price.toLocaleString(
                                                          'id-ID',
                                                      )
                                                    : ''
                                            }
                                            onChange={(e) =>
                                                handlePriceChange(
                                                    index,
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 rounded-lg border-slate-200 bg-white pr-2 pl-8 text-[13px] font-semibold text-slate-900 focus-visible:ring-emerald-500"
                                            placeholder="200.000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// FORM COMPONENTS
// ----------------------------------------------------------------------

function CreateCourtForm({
    venues,
    sports,
    onSuccess,
    onCancel,
}: {
    venues: Venue[];
    sports: Sport[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const form = useForm({
        venue_id: '',
        sport_id: '',
        name: '',
        type: 'indoor',
        price_per_hour: '',
        is_active: true,
        images: [] as File[],
        pricing_rules: [] as PricingRule[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit(store(), {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess();
                window.dispatchEvent(
                    new CustomEvent('toast', {
                        detail: {
                            type: 'success',
                            message: 'Lapangan baru berhasil dutambahkan.',
                        },
                    }),
                );
            },
        });
    };

    return (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="scrollbar-thin scrollbar-thumb-slate-200 min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Input: Name */}
                    <div className="space-y-2 md:col-span-2">
                        <label
                            htmlFor="name"
                            className="text-sm font-semibold text-slate-900"
                        >
                            Nama Lapangan{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            placeholder="Contoh: Lapangan A (Padel)"
                            className={cn(
                                'flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                form.errors.name
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-300',
                            )}
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    {/* Input: Images (Multiple) */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-900">
                            Foto Lapangan (Opsional, Maks 10)
                        </label>
                        <div className="flex flex-col gap-3">
                            {/* File Input Area */}
                            <label
                                htmlFor="images"
                                className="group flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="mb-2 h-8 w-8 text-slate-400 transition-colors group-hover:text-emerald-500" />
                                    <p className="mb-1 text-sm text-slate-500">
                                        <span className="font-semibold text-emerald-500">
                                            Klik untuk unggah
                                        </span>{' '}
                                        atau seret dan lepas
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        JPEG, PNG, JPG, WEBP (Maks. 2MB)
                                    </p>
                                </div>
                                <input
                                    id="images"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const newFiles = Array.from(
                                                e.target.files,
                                            );
                                            form.setData(
                                                'images',
                                                [
                                                    ...form.data.images,
                                                    ...newFiles,
                                                ].slice(0, 10),
                                            ); // Limit to max 10
                                        }
                                    }}
                                />
                            </label>

                            {/* Previews for selected new files */}
                            {form.data.images.length > 0 && (
                                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                    {form.data.images.map((file, index) => (
                                        <div
                                            key={index}
                                            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${index}`}
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [
                                                        ...form.data.images,
                                                    ];
                                                    newImages.splice(index, 1);
                                                    form.setData(
                                                        'images',
                                                        newImages,
                                                    );
                                                }}
                                                className="absolute top-1 right-1 rounded-full bg-red-500/90 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <InputError
                                message={form.errors.images as string}
                            />
                            {/* We also need to map through array errors like images.0, but usually simple string is fine if backend sends it. */}
                        </div>
                    </div>

                    {/* Input: Venue & Sport (Selects) */}
                    <div className="space-y-2">
                        <label
                            htmlFor="venue_id"
                            className="text-sm font-semibold text-slate-900"
                        >
                            Lokasi / Tempat{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="venue_id"
                            value={form.data.venue_id}
                            onChange={(e) =>
                                form.setData('venue_id', e.target.value)
                            }
                            className={cn(
                                'flex h-11 w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:ring-2 focus-visible:outline-none',
                                form.errors.venue_id
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-300',
                            )}
                        >
                            <option value="" disabled>
                                Pilih Tempat
                            </option>
                            {venues.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.venue_id} />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="sport_id"
                            className="text-sm font-semibold text-slate-900"
                        >
                            Jenis Olahraga{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="sport_id"
                            value={form.data.sport_id}
                            onChange={(e) =>
                                form.setData('sport_id', e.target.value)
                            }
                            className={cn(
                                'flex h-11 w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:ring-2 focus-visible:outline-none',
                                form.errors.sport_id
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-300',
                            )}
                        >
                            <option value="" disabled>
                                Pilih Olahraga
                            </option>
                            {sports.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.sport_id} />
                    </div>

                    {/* Input: Type & Price */}
                    <div className="space-y-2">
                        <label
                            htmlFor="type"
                            className="text-sm font-semibold text-slate-900"
                        >
                            Tipe Area <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="type"
                            value={form.data.type}
                            onChange={(e) =>
                                form.setData(
                                    'type',
                                    e.target.value as 'indoor' | 'outdoor',
                                )
                            }
                            className={cn(
                                'flex h-11 w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 capitalize transition-colors focus-visible:ring-2 focus-visible:outline-none',
                                form.errors.type
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-300',
                            )}
                        >
                            <option value="indoor">Indoor</option>
                            <option value="outdoor">Outdoor</option>
                        </select>
                        <InputError message={form.errors.type} />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="price_per_hour"
                            className="text-sm font-semibold text-slate-900"
                        >
                            Tarif / Jam (Rp){' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-slate-400">
                                Rp
                            </span>
                            <input
                                id="price_per_hour"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.data.price_per_hour}
                                onChange={(e) =>
                                    form.setData(
                                        'price_per_hour',
                                        e.target.value,
                                    )
                                }
                                placeholder="150000"
                                className={cn(
                                    'flex h-11 w-full rounded-xl border bg-white py-2 pr-3 pl-9 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none',
                                    form.errors.price_per_hour
                                        ? 'border-red-500 focus-visible:ring-red-200'
                                        : 'border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-300',
                                )}
                            />
                        </div>
                        <InputError message={form.errors.price_per_hour} />
                    </div>

                    {/* Pricing Rules Editor */}
                    <PricingRulesEditor
                        rules={form.data.pricing_rules}
                        onChange={(rules) =>
                            form.setData('pricing_rules', rules)
                        }
                    />

                    {/* Input: is_active Toggle */}
                    <div className="mt-2 md:col-span-2">
                        <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100/80">
                            <div className="space-y-0.5 pr-4">
                                <span className="block text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-500">
                                    Aktifkan Lapangan
                                </span>
                                <span className="block text-xs leading-relaxed text-slate-500">
                                    Lapangan yang aktif bisa dipesan langsung
                                    oleh pelanggan di website/aplikasi.
                                </span>
                            </div>
                            <div
                                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
                                style={{
                                    backgroundColor: form.data.is_active
                                        ? '#06D001'
                                        : '#cbd5e1',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={form.data.is_active}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span
                                    className={cn(
                                        'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                        form.data.is_active
                                            ? 'translate-x-5'
                                            : 'translate-x-0',
                                    )}
                                />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={form.processing}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 disabled:opacity-50"
                >
                    {form.processing && <Spinner className="h-4 w-4" />}
                    Simpan Lapangan
                </button>
            </div>
        </form>
    );
}

function EditCourtForm({
    court,
    venues,
    sports,
    onSuccess,
    onCancel,
}: {
    court: Court;
    venues: Venue[];
    sports: Sport[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const form = useForm({
        venue_id: court.venue_id.toString(),
        sport_id: court.sport_id.toString(),
        name: court.name,
        type: court.type,
        price_per_hour: court.price_per_hour.toString(),
        is_active: court.is_active,
        images: [] as File[],
        images_to_delete: [] as string[],
        pricing_rules: court.pricing_rules || ([] as PricingRule[]),
    });

    const [existingImages, setExistingImages] = useState<string[]>(
        court.images || [],
    );

    const handleRemoveExistingImage = (path: string) => {
        setExistingImages((prev) => prev.filter((img) => img !== path));
        form.setData('images_to_delete', [...form.data.images_to_delete, path]);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit(update(court.id), {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess();
                window.dispatchEvent(
                    new CustomEvent('toast', {
                        detail: {
                            type: 'success',
                            message: 'Lapangan berhasil diperbarui.',
                        },
                    }),
                );
            },
        });
    };

    return (
        <form
            onSubmit={submit}
            className="flex flex-1 flex-col overflow-hidden"
        >
            <div className="scrollbar-thin scrollbar-thumb-slate-200 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7">
                    {/* Input: Name */}
                    <div className="space-y-2.5 md:col-span-2">
                        <label
                            htmlFor="edit_name"
                            className="text-[13px] font-bold tracking-widest text-slate-900 uppercase"
                        >
                            Nama Lapangan{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="edit_name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            className={cn(
                                'flex h-12 w-full rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                form.errors.name
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:ring-emerald-500/20',
                            )}
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    {/* Input: Images (Multiple) */}
                    <div className="space-y-2.5 md:col-span-2">
                        <label className="block text-[13px] font-bold tracking-widest text-slate-900 uppercase">
                            Foto Lapangan (Maks 10)
                        </label>
                        <div className="flex flex-col gap-3">
                            <label
                                htmlFor="edit_images"
                                className="group flex min-h-[100px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
                            >
                                <div className="flex flex-col items-center justify-center py-5">
                                    <UploadCloud className="mb-2 h-6 w-6 text-slate-400 transition-colors group-hover:text-emerald-500" />
                                    <p className="mb-0.5 text-xs font-semibold text-slate-500">
                                        <span className="text-emerald-500">
                                            Klik untuk unggah
                                        </span>{' '}
                                        atau seret foto kesini
                                    </p>
                                </div>
                                <input
                                    id="edit_images"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const newFiles = Array.from(
                                                e.target.files,
                                            );
                                            form.setData(
                                                'images',
                                                [
                                                    ...form.data.images,
                                                    ...newFiles,
                                                ].slice(0, 10),
                                            ); // Limit to max 10
                                        }
                                    }}
                                />
                            </label>

                            {/* Previews for existing and new files */}
                            {(existingImages.length > 0 ||
                                form.data.images.length > 0) && (
                                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                    {/* Existing Images */}
                                    {existingImages.map((path, index) => (
                                        <div
                                            key={`existing-${index}`}
                                            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                                        >
                                            <img
                                                src={getImageUrl(path)}
                                                alt={`Existing ${index}`}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveExistingImage(
                                                        path,
                                                    )
                                                }
                                                className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1.5 text-red-500 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-50"
                                                title="Hapus foto ini"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[10px] font-medium text-white backdrop-blur-sm">
                                                Tersimpan
                                            </div>
                                        </div>
                                    ))}

                                    {/* New Images */}
                                    {form.data.images.map((file, index) => (
                                        <div
                                            key={`new-${index}`}
                                            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${index}`}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [
                                                        ...form.data.images,
                                                    ];
                                                    newImages.splice(index, 1);
                                                    form.setData(
                                                        'images',
                                                        newImages,
                                                    );
                                                }}
                                                className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1.5 text-red-500 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-50"
                                                title="Batal unggah"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 bg-emerald-500/90 py-1 text-center text-[10px] font-medium text-white backdrop-blur-sm">
                                                Baru
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <InputError
                                message={form.errors.images as string}
                            />
                        </div>
                    </div>

                    {/* Input: Venue & Sport (Selects) */}
                    <div className="space-y-2.5">
                        <label
                            htmlFor="edit_venue_id"
                            className="text-[13px] font-bold tracking-widest text-slate-900 uppercase"
                        >
                            Lokasi Lapangan{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="edit_venue_id"
                            value={form.data.venue_id}
                            onChange={(e) =>
                                form.setData('venue_id', e.target.value)
                            }
                            className={cn(
                                'flex h-12 w-full appearance-none rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none',
                                form.errors.venue_id
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:ring-emerald-500/20',
                            )}
                        >
                            <option value="" disabled>
                                Pilih Tempat
                            </option>
                            {venues.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.venue_id} />
                    </div>

                    <div className="space-y-2.5">
                        <label
                            htmlFor="edit_sport_id"
                            className="text-[13px] font-bold tracking-widest text-slate-900 uppercase"
                        >
                            Jenis Olahraga{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="edit_sport_id"
                            value={form.data.sport_id}
                            onChange={(e) =>
                                form.setData('sport_id', e.target.value)
                            }
                            className={cn(
                                'flex h-12 w-full appearance-none rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none',
                                form.errors.sport_id
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:ring-emerald-500/20',
                            )}
                        >
                            <option value="" disabled>
                                Pilih Olahraga
                            </option>
                            {sports.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.sport_id} />
                    </div>

                    {/* Input: Type & Price */}
                    <div className="space-y-2.5">
                        <label
                            htmlFor="edit_type"
                            className="text-[13px] font-bold tracking-widest text-slate-900 uppercase"
                        >
                            Tipe Area <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="edit_type"
                            value={form.data.type}
                            onChange={(e) =>
                                form.setData(
                                    'type',
                                    e.target.value as 'indoor' | 'outdoor',
                                )
                            }
                            className={cn(
                                'flex h-12 w-full appearance-none rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 capitalize transition-colors focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none',
                                form.errors.type
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:ring-emerald-500/20',
                            )}
                        >
                            <option value="indoor">Indoor</option>
                            <option value="outdoor">Outdoor</option>
                        </select>
                        <InputError message={form.errors.type} />
                    </div>

                    <div className="space-y-2.5">
                        <label
                            htmlFor="edit_price_per_hour"
                            className="text-[13px] font-bold tracking-widest text-slate-900 uppercase"
                        >
                            Tarif / Jam <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-[15px] font-medium text-slate-400">
                                Rp
                            </span>
                            <input
                                id="edit_price_per_hour"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.data.price_per_hour}
                                onChange={(e) =>
                                    form.setData(
                                        'price_per_hour',
                                        e.target.value,
                                    )
                                }
                                className={cn(
                                    'flex h-12 w-full rounded-xl border bg-slate-50 py-2 pr-4 pl-11 text-[15px] font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none',
                                    form.errors.price_per_hour
                                        ? 'border-red-500 focus-visible:ring-red-200'
                                        : 'border-slate-200 focus-visible:ring-emerald-500/20',
                                )}
                            />
                        </div>
                        <InputError message={form.errors.price_per_hour} />
                    </div>

                    {/* Pricing Rules Editor */}
                    <PricingRulesEditor
                        rules={form.data.pricing_rules}
                        onChange={(rules) =>
                            form.setData('pricing_rules', rules)
                        }
                    />

                    {/* Input: is_active Toggle */}
                    <div className="mt-2 md:col-span-2">
                        <label className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50">
                            <div className="space-y-1 pr-6">
                                <span className="block text-sm font-bold tracking-widest text-slate-900 uppercase">
                                    Aktifkan Lapangan
                                </span>
                                <span className="block text-[13px] leading-relaxed font-medium text-slate-500">
                                    Lapangan yang aktif bisa dipesan langsung
                                    oleh pelanggan di website/aplikasi.
                                </span>
                            </div>
                            <div
                                className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
                                style={{
                                    backgroundColor: form.data.is_active
                                        ? '#06D001'
                                        : '#cbd5e1',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={form.data.is_active}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span
                                    className={cn(
                                        'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                        form.data.is_active
                                            ? 'translate-x-5'
                                            : 'translate-x-0',
                                    )}
                                />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 rounded-b-3xl border-t border-slate-100 bg-white px-6 py-5 sm:px-8">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={form.processing}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition-all hover:bg-emerald-600 disabled:opacity-50"
                >
                    {form.processing && <Spinner className="h-4 w-4" />}
                    Simpan Perubahan
                </button>
            </div>
        </form>
    );
}
