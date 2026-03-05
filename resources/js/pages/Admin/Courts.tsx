import { Head, useForm, router } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Plus, Pencil, Trash2, MapPin, Trophy, LayoutGrid, CheckCircle2, XCircle,
    Activity, ChevronLeft, ChevronRight, ArrowRight, Calendar as CalendarIcon, Clock,
    Search, AlertCircle, X, ArrowLeft, UploadCloud, Image as ImageIcon,
    Utensils, Coffee, Store, Car, Bike, Bath, Mail, Phone, Info, Star, ChevronDown,
    Printer
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    }
}

const getImageUrl = (path: string) => path.startsWith('http') ? path : `/storage/${path}`;

export default function Courts({ courts, venues, sports, filters }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
    const [recapPeriod, setRecapPeriod] = useState<string>('month');
    const [recapStartDate, setRecapStartDate] = useState<Date | undefined>();
    const [recapEndDate, setRecapEndDate] = useState<Date | undefined>();
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingUserMode, setBookingUserMode] = useState<'search' | 'create'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [newCustomer, setNewCustomer] = useState<Customer>({ name: '', email: '', phone: '' });
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

    const [selectedRange, setSelectedRange] = useState<{ start: string | null, end: string | null }>({ start: '08:00', end: null });
    const [hoveredTime, setHoveredTime] = useState<string | null>(null);

    const calculateTotalPrice = (court: Court, range: { start: string | null, end: string | null }, date: Date) => {
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
                        if (currentSlotHour >= rule.start_time && currentSlotHour < rule.end_time) {
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
        return ((endMins - startMins) / 60) + 1;
    };
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [selectedSportIds, setSelectedSportIds] = useState<number[]>([]);

    // Split View State
    const [selectedCourtId, setSelectedCourtId] = useState<number | null>(courts.length > 0 ? courts[0].id : null);
    const [detailCourt, setDetailCourt] = useState<Court | null>(null);
    const [bookedSlotInfo, setBookedSlotInfo] = useState<{ court: Court; meta: SlotMeta } | null>(null);
    const [slotActionLoading, setSlotActionLoading] = useState<'confirm' | 'cancel' | null>(null);
    const [expandedCourts, setExpandedCourts] = useState<number[]>([]);

    const toggleCourtExpanded = (id: number) => {
        setExpandedCourts(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
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
                    params: { q: debouncedSearchQuery.trim() }
                });
                setSearchResults(response.data);
            } catch (error) {
                console.error("Failed to search users:", error);
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

            <div className="flex flex-col gap-6 p-6 w-full max-w-[1600px] mx-auto">
                {/* Header & Stats */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-slate-900">Manajemen Lapangan</h1>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Kelola lapangan fisik, harga per jam, dan pantau status ketersediaan secara real-time.
                        </p>
                    </div>

                    <div className="flex items-center w-full md:w-auto gap-2 sm:gap-3">
                        <button
                            onClick={() => setIsRecapModalOpen(true)}
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-white border border-slate-200 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200 whitespace-nowrap"
                        >
                            <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                            Cetak Rekapan
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-padel-green px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-padel-green-dark transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-padel-green disabled:opacity-50 whitespace-nowrap"
                        >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                            Tambah Lapangan
                        </button>
                    </div>
                </div>

                {/* Full-width Responsive Date Ribbon Without Overflow */}
                <div className="w-full mb-2 flex items-center justify-between gap-1 md:gap-3">
                    <button
                        onClick={handlePrevDays}
                        className="p-1.5 md:p-2 bg-white text-slate-400 hover:text-slate-900 border border-slate-200/60 shadow-sm rounded-full transition-colors active:scale-95 flex-shrink-0 z-10"
                        aria-label="Hari sebelumnya"
                    >
                        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                    </button>

                    <div className="flex-1 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1.5 md:gap-2">
                        {visibleDates.map((date, idx) => {
                            const isSelected =
                                date.getDate() === selectedDate.getDate() &&
                                date.getMonth() === selectedDate.getMonth() &&
                                date.getFullYear() === selectedDate.getFullYear();

                            const today = new Date();
                            const isToday =
                                date.getDate() === today.getDate() &&
                                date.getMonth() === today.getMonth() &&
                                date.getFullYear() === today.getFullYear();

                            const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
                            const dayNumber = date.getDate();

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedDate(date);
                                        // Fetch new bookings data for the selected date
                                        router.get(
                                            '/courts',
                                            { date: format(date, 'yyyy-MM-dd') },
                                            { preserveState: true, preserveScroll: true, replace: true }
                                        );
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center py-2 h-[60px] w-full rounded-2xl transition-all duration-200 border",
                                        isSelected
                                            ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20 ring-offset-1 ring-offset-slate-50 relative"
                                            : "bg-white text-slate-500 border-slate-200/60 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800",
                                        idx < 4 ? "flex" : idx < 5 ? "hidden sm:flex" : "hidden md:flex"
                                    )}
                                >
                                    {isToday && isSelected && (
                                        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-padel-green opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-padel-green"></span>
                                        </div>
                                    )}
                                    <span className={cn(
                                        "text-[9px] font-semibold uppercase tracking-wider mb-0.5",
                                        isSelected ? "text-slate-300" : "opacity-80 group-hover:opacity-100"
                                    )}>
                                        {isToday ? 'Hari Ini' : dayName}
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                            "text-xl font-heading font-semibold",
                                            isSelected ? "text-white" : ""
                                        )}>
                                            {dayNumber}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleNextDays}
                        className="p-1.5 md:p-2 bg-white text-slate-400 hover:text-slate-900 border border-slate-200/60 shadow-sm rounded-full transition-colors active:scale-95 flex-shrink-0 z-10"
                        aria-label="Hari berikutnya"
                    >
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                </div>

                {/* Top Filters Row */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <button
                        onClick={() => setSelectedSportIds([])}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-semibold transition-all",
                            selectedSportIds.length === 0
                                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
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
                                        setSelectedSportIds(selectedSportIds.filter(id => id !== sport.id));
                                    } else {
                                        setSelectedSportIds([...selectedSportIds, sport.id]);
                                    }
                                }}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-semibold transition-all",
                                    isSelected
                                        ? "bg-padel-green border-padel-green text-white shadow-sm"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                )}
                            >
                                {sport.name}
                            </button>
                        );
                    })}
                </div>

                {courts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center animate-in fade-in duration-500">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                            <LayoutGrid className="h-8 w-8 text-slate-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-1">Belum Ada Lapangan</h2>
                        <p className="text-sm text-slate-500 max-w-sm mb-6">
                            Mulai tambahkan lapangan untuk mengelola harga dan menerima reservasi pelanggan.
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-padel-green hover:text-padel-green-dark transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Lapangan Pertama
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 pb-10">
                        {courts
                            .filter(court => selectedSportIds.length === 0 || selectedSportIds.includes(court.sport_id))
                            .map(court => {
                                const courtImages = (court.images && court.images.length > 0)
                                    ? court.images
                                    : (court.venue?.images && court.venue.images.length > 0)
                                        ? court.venue.images
                                        : null;

                                const isSelected = selectedCourtId === court.id;

                                const handleTimeSlotClickForCourt = (time: string, isAvailable: boolean, bookedSlots: string[]) => {
                                    if (!isAvailable) return;
                                    // Switch to this court if selecting a different one
                                    if (selectedCourtId !== court.id) {
                                        setSelectedCourtId(court.id);
                                        setSelectedRange({ start: time, end: null });
                                        return;
                                    }
                                    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
                                        setSelectedRange({ start: time, end: null });
                                        return;
                                    }
                                    if (selectedRange.start && !selectedRange.end) {
                                        if (time < selectedRange.start) {
                                            setSelectedRange({ start: time, end: null });
                                        } else if (time > selectedRange.start) {
                                            const startHour = parseInt(selectedRange.start.split(':')[0]);
                                            const endHour = parseInt(time.split(':')[0]);
                                            let hasConflict = false;
                                            for (let h = startHour + 1; h <= endHour; h++) {
                                                const checkTime = `${h.toString().padStart(2, '0')}:00`;
                                                if (bookedSlots.includes(checkTime)) { hasConflict = true; break; }
                                            }
                                            if (hasConflict) {
                                                setSelectedRange({ start: time, end: null });
                                            } else {
                                                setSelectedRange({ start: selectedRange.start, end: time });
                                            }
                                        } else {
                                            setSelectedRange({ start: null, end: null });
                                        }
                                    }
                                };

                                return (
                                    <div
                                        key={court.id}
                                        className={cn(
                                            "bg-white rounded-2xl border shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300",
                                            isSelected
                                                ? "border-padel-green ring-1 ring-padel-green/30"
                                                : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                                        )}
                                    >
                                        {/* ── Court Accordion Header ── */}
                                        <div
                                            onClick={() => toggleCourtExpanded(court.id)}
                                            className="flex items-center justify-between px-5 py-4 cursor-pointer select-none bg-white hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full shadow-sm",
                                                    court.is_booked_now ? "bg-red-500 shadow-red-500/40"
                                                        : court.is_active ? "bg-padel-green shadow-padel-green/40"
                                                            : "bg-slate-300 shadow-slate-400/40"
                                                )} />
                                                <h3 className="font-heading text-lg font-extrabold text-slate-900 tracking-tight">{court.name}</h3>
                                                <span className="hidden sm:flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {court.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <p className="font-heading text-base font-extrabold text-padel-green leading-none">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(court.price_per_hour)}
                                                        <span className="text-[11px] text-slate-400 font-bold ml-1 tracking-wider uppercase">/ Jam</span>
                                                    </p>
                                                </div>
                                                <div className={cn(
                                                    "p-1.5 rounded-full bg-slate-100 text-slate-500 transition-transform duration-300",
                                                    expandedCourts.includes(court.id) ? "rotate-180 bg-slate-200 text-slate-700" : "rotate-0"
                                                )}>
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Collapsible Info (Brief Detail) ── */}
                                        <div
                                            className={cn(
                                                "grid transition-all duration-300 ease-in-out bg-slate-50/50",
                                                expandedCourts.includes(court.id) ? "grid-rows-[1fr] opacity-100 border-t border-slate-100" : "grid-rows-[0fr] opacity-0"
                                            )}
                                        >
                                            <div className="overflow-hidden">
                                                <div className="flex flex-col sm:flex-row">
                                                    {/* Image */}
                                                    <div className="relative w-full sm:w-40 md:w-52 h-36 sm:h-auto flex-shrink-0 overflow-hidden bg-slate-100">
                                                        <img
                                                            src={courtImages ? getImageUrl(courtImages[0]) : "https://images.unsplash.com/photo-1622225369201-020e408ec9cc?q=80&w=600&auto=format&fit=crop"}
                                                            alt={court.name}
                                                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                                        />
                                                        {/* Status Badge overlay */}
                                                        <div className="absolute top-2.5 left-2.5">
                                                            {court.is_booked_now ? (
                                                                <span className="inline-flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded shadow">
                                                                    <span className="relative flex h-1 w-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span><span className="relative inline-flex rounded-full h-1 w-1 bg-white"></span></span>
                                                                    BOOKED
                                                                </span>
                                                            ) : court.is_active ? (
                                                                <span className="inline-flex items-center gap-1.5 bg-padel-green/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded shadow">
                                                                    <span className="relative flex h-1 w-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span><span className="relative inline-flex rounded-full h-1 w-1 bg-white"></span></span>
                                                                    TERSEDIA
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 bg-slate-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded shadow">
                                                                    NONAKTIF
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Court Info & Actions */}
                                                    <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-4">
                                                        <div className="space-y-2.5 min-w-0">
                                                            <div className="flex items-center gap-2.5 text-slate-600 text-[13px] font-medium">
                                                                <div className="w-6 h-6 rounded-md bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                                                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                                </div>
                                                                <span className="truncate text-slate-700">{court.venue?.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2.5 text-slate-600 text-[13px] font-medium">
                                                                <div className="w-6 h-6 rounded-md bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                                                    <Activity className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                                </div>
                                                                <span className="text-slate-700">{court.sport?.name}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end mt-2 sm:mt-0">
                                                            {/* Detail Button */}
                                                            <button
                                                                onClick={() => setDetailCourt(court)}
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                                            >
                                                                <Info className="w-3.5 h-3.5" />
                                                                Lihat Detail
                                                            </button>
                                                            {/* Edit / Delete */}
                                                            <button
                                                                onClick={() => { setEditingCourt(court); setIsEditModalOpen(true); }}
                                                                className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-padel-green hover:border-padel-green/30 hover:bg-emerald-50 transition-all active:scale-95"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => { setDeletingCourt(court); setIsDeleteModalOpen(true); }}
                                                                className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95"
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
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-padel-green" />
                                                    Jadwal Ketersediaan
                                                </h4>
                                                <span className="text-[11px] font-bold text-padel-green bg-padel-green-50 border border-padel-green-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                    {selectedDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>

                                            {/* Time Slots Grid */}
                                            {(() => {
                                                const baseHours = Array.from({ length: 15 }, (_, i) => i + 7);
                                                const bookedSlots = court.booked_slots || [];
                                                const timeSlots = baseHours.map(hour => {
                                                    const timeString = `${hour.toString().padStart(2, '0')}:00`;
                                                    return { time: timeString, status: bookedSlots.includes(timeString) ? 'booked' : 'available' };
                                                });

                                                return (
                                                    <>
                                                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-2 mb-4">
                                                            {timeSlots.map((slot, index) => {
                                                                const isAvailable = slot.status === 'available';
                                                                const isSlotSelected = (() => {
                                                                    if (!isSelected || !selectedRange.start) return false;
                                                                    if (!selectedRange.end) return slot.time === selectedRange.start;
                                                                    return slot.time >= selectedRange.start && slot.time <= selectedRange.end;
                                                                })();

                                                                const isHoveredRange = (() => {
                                                                    if (!isSelected || !isAvailable || !selectedRange.start || selectedRange.end || !hoveredTime) return false;
                                                                    if (slot.time <= selectedRange.start || slot.time > hoveredTime) return false;
                                                                    const startHour = parseInt(selectedRange.start.split(':')[0], 10);
                                                                    const hoverHour = parseInt(hoveredTime.split(':')[0], 10);
                                                                    for (let h = startHour + 1; h <= hoverHour; h++) {
                                                                        if (bookedSlots.includes(`${h.toString().padStart(2, '0')}:00`)) return false;
                                                                    }
                                                                    return true;
                                                                })();

                                                                return (
                                                                    <button
                                                                        key={index}
                                                                        onClick={() => {
                                                                            if (!isAvailable) {
                                                                                const meta = court.slot_meta?.[slot.time];
                                                                                if (meta) setBookedSlotInfo({ court, meta });
                                                                                return;
                                                                            }
                                                                            handleTimeSlotClickForCourt(slot.time, isAvailable, bookedSlots);
                                                                        }}
                                                                        onMouseEnter={() => { if (isAvailable) { setSelectedCourtId(court.id); setHoveredTime(slot.time); } }}
                                                                        onMouseLeave={() => isAvailable && setHoveredTime(null)}
                                                                        className={cn(
                                                                            "py-2 flex flex-col items-center justify-center rounded-lg border text-xs transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-padel-green focus-visible:ring-offset-1",
                                                                            isAvailable
                                                                                ? isSlotSelected
                                                                                    ? "bg-padel-green border-padel-green text-white shadow-[0_4px_10px_rgba(34,197,94,0.25)] scale-[1.04] font-bold z-10"
                                                                                    : isHoveredRange
                                                                                        ? "bg-emerald-50 border-padel-green/40 text-padel-green-dark font-semibold scale-[1.02]"
                                                                                        : "bg-white border-slate-200 text-slate-700 hover:border-padel-green hover:text-padel-green hover:bg-emerald-50/50 font-semibold cursor-pointer active:scale-95"
                                                                                : "bg-red-50 border-red-200 text-red-400 cursor-pointer hover:bg-red-100 hover:border-red-300 hover:text-red-500 font-medium relative overflow-hidden transition-colors"
                                                                        )}
                                                                    >
                                                                        {slot.time}
                                                                        {!isAvailable && (
                                                                            <>
                                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                                    <div className="w-full h-px bg-red-300 transform rotate-[20deg]"></div>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Legend */}
                                                        <div className="flex items-center gap-5 text-[11px] font-semibold text-slate-400">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-300"></div>
                                                                <span>Tersedia</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-padel-green border border-padel-green"></div>
                                                                <span className="text-slate-700">Dipilih</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="relative w-2.5 h-2.5 rounded-full bg-red-100 border border-red-300 overflow-hidden">
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <div className="w-full h-px bg-red-400 transform rotate-45"></div>
                                                                    </div>
                                                                </div>
                                                                <span className="text-red-400">Terisi (klik untuk info)</span>
                                                            </div>
                                                        </div>

                                                        {/* Booking Summary (appears when range selected for this court) */}
                                                        {isSelected && selectedRange.start && (
                                                            <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                                                <div>
                                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ringkasan</p>
                                                                    <div className="flex items-baseline gap-2">
                                                                        <span className="text-2xl font-heading font-extrabold text-padel-green tracking-tight">
                                                                            Rp {calculateTotalPrice(court, selectedRange, selectedDate).toLocaleString('id-ID')}
                                                                        </span>
                                                                        <span className="text-sm font-medium text-slate-500">untuk {getSelectedHoursCount()} jam ({selectedRange.start}{selectedRange.end ? ` – ${selectedRange.end}` : ''})</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => setIsBookingModalOpen(true)}
                                                                    className="bg-padel-green text-white font-semibold px-7 py-3 rounded-full hover:bg-padel-green-dark hover:shadow-lg transition-all active:scale-[0.98] outline-none shadow-padel-green/20 text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                                                                >
                                                                    Buat Booking
                                                                    <ArrowRight className="w-4 h-4" />
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
            {detailCourt && (() => {
                const dc = detailCourt;
                const imgs = (dc.images && dc.images.length > 0)
                    ? dc.images
                    : (dc.venue?.images && dc.venue.images.length > 0)
                        ? dc.venue.images : null;
                const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

                return (
                    <Dialog open={!!detailCourt} onOpenChange={(open) => !open && setDetailCourt(null)}>
                        <DialogContent className="w-full sm:max-w-xl md:max-w-3xl p-0 overflow-hidden bg-white rounded-2xl border border-slate-200/70 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] max-h-[92vh] flex flex-col">

                            {/* ── Two-column body ── */}
                            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

                                {/* Left — Image Panel */}
                                <div className="relative md:w-64 lg:w-72 shrink-0 h-52 md:h-auto bg-slate-100 overflow-hidden">
                                    {imgs ? (
                                        <img
                                            src={getImageUrl(imgs[0])}
                                            alt={dc.name}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <UploadCloud className="w-12 h-12 stroke-1" />
                                        </div>
                                    )}
                                    {/* Gradient for text legibility */}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent md:bg-linear-to-r md:from-black/50 md:via-transparent md:to-transparent" />

                                    {/* Close */}
                                    <button
                                        onClick={() => setDetailCourt(null)}
                                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center text-white transition-all md:hidden"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    {/* Title overlay on mobile bottom, desktop left-bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm border mb-2",
                                            dc.is_booked_now ? "bg-red-500/80 text-white border-red-300/40"
                                                : dc.is_active ? "bg-emerald-500/80 text-white border-emerald-300/40"
                                                    : "bg-slate-600/80 text-white border-slate-400/40"
                                        )}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full bg-white", dc.is_booked_now && "animate-pulse")} />
                                            {dc.is_booked_now ? "Sedang Dipakai" : dc.is_active ? "Tersedia" : "Nonaktif"}
                                        </span>
                                        <h2 className="font-heading text-xl font-extrabold text-white tracking-tight leading-tight drop-shadow">
                                            {dc.name}
                                        </h2>
                                        <div className="flex items-center gap-1.5 mt-1 text-white/70 text-xs font-medium">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{dc.venue?.name}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right — Info Panel */}
                                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

                                    {/* Desktop close + header strip */}
                                    <div className="hidden md:flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                                                {dc.type}
                                            </span>
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100 inline-flex items-center gap-1">
                                                <Activity className="w-3 h-3" />
                                                {dc.sport?.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setDetailCourt(null)}
                                            className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Mobile type/sport badges */}
                                    <div className="flex md:hidden items-center gap-2 px-5 pt-4 shrink-0">
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 capitalize">{dc.type}</span>
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100 inline-flex items-center gap-1">
                                            <Activity className="w-3 h-3" />{dc.sport?.name}
                                        </span>
                                    </div>

                                    {/* Scrollable content */}
                                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">

                                        {/* Price */}
                                        <div className="px-5 md:px-6 pt-4 pb-4 border-b border-slate-100">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Tarif per Jam</p>
                                            <p className="font-heading text-3xl font-extrabold text-padel-green leading-none tracking-tight">
                                                {fmt(dc.price_per_hour)}
                                            </p>
                                        </div>

                                        {/* Info rows */}
                                        <div className="px-5 md:px-6 py-4 border-b border-slate-100 space-y-3.5">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Informasi</p>
                                            {[
                                                { label: 'Tipe Area', value: dc.type, cap: true },
                                                { label: 'Olahraga', value: dc.sport?.name ?? '—' },
                                                { label: 'Lokasi / Venue', value: dc.venue?.name ?? '—' },
                                            ].map(({ label, value, cap }) => (
                                                <div key={label} className="flex items-baseline justify-between gap-4">
                                                    <span className="text-[12px] text-slate-500 shrink-0">{label}</span>
                                                    <span className={cn("text-[13px] font-semibold text-slate-900 text-right", cap && "capitalize")}>{value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Fasilitas */}
                                        <div className="px-5 md:px-6 py-4">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Fasilitas Venue</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {[
                                                    { icon: Utensils, label: 'Makanan Ringan' },
                                                    { icon: Coffee, label: 'Minuman' },
                                                    { icon: Store, label: 'Musholla' },
                                                    { icon: Car, label: 'Parkir Mobil' },
                                                    { icon: Bike, label: 'Parkir Motor' },
                                                    { icon: Bath, label: 'Toilet' },
                                                ].map(({ icon: Icon, label }) => (
                                                    <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 group hover:border-padel-green/30 hover:bg-emerald-50/40 transition-colors">
                                                        <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0 stroke-[1.5] group-hover:text-padel-green transition-colors" />
                                                        <span className="text-[11px] font-semibold text-slate-600 leading-tight">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="shrink-0 px-5 md:px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white">
                                        <button
                                            onClick={() => { setEditingCourt(dc); setDetailCourt(null); setIsEditModalOpen(true); }}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setDetailCourt(null)}
                                                className="text-[13px] font-medium text-slate-400 hover:text-slate-700 transition-colors px-3 py-2"
                                            >
                                                Tutup
                                            </button>
                                            <button
                                                onClick={() => { setDetailCourt(null); setSelectedCourtId(dc.id); }}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-padel-green text-white text-[13px] font-bold hover:bg-padel-green-dark transition-all shadow-sm shadow-padel-green/20 active:scale-95"
                                            >
                                                <Clock className="w-3.5 h-3.5" />
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
            {bookedSlotInfo && (() => {
                const { court: bc, meta } = bookedSlotInfo;
                const durationHours = parseInt(meta.end_time.split(':')[0]) - parseInt(meta.start_time.split(':')[0]);
                const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
                const statusConfig: Record<string, { label: string; className: string }> = {
                    confirmed: { label: 'Terkonfirmasi', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    completed: { label: 'Selesai', className: 'bg-slate-100 text-slate-600 border-slate-200' },
                    pending: { label: 'Menunggu Konfirmasi', className: 'bg-amber-50 text-amber-700 border-amber-200' },
                    cancelled: { label: 'Dibatalkan', className: 'bg-red-50 text-red-600 border-red-200' },
                };
                const status = statusConfig[meta.status] ?? { label: meta.status, className: 'bg-slate-100 text-slate-600 border-slate-200' };

                const handleSlotAction = async (action: 'confirm' | 'cancel') => {
                    setSlotActionLoading(action);
                    try {
                        await axios.patch(`/bookings/${meta.booking_id}/${action}`);
                        setBookedSlotInfo(null);
                        router.reload({ only: ['courts'] });
                    } catch (err: any) {
                        window.dispatchEvent(new CustomEvent('toast', {
                            detail: { type: 'error', message: err.response?.data?.message ?? 'Terjadi kesalahan.' }
                        }));
                    } finally {
                        setSlotActionLoading(null);
                    }
                };

                const canConfirm = meta.status === 'pending';
                const canCancel = !['cancelled', 'completed'].includes(meta.status);

                return (
                    <Dialog open={!!bookedSlotInfo} onOpenChange={(open) => { if (!slotActionLoading) { !open && setBookedSlotInfo(null); } }}>
                        <DialogContent hideClose className="w-[calc(100%-2rem)] sm:max-w-[480px] p-0 overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)]">

                            {/* ── Header ── */}
                            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0', status.className)}>
                                        {status.label}
                                    </span>
                                    <button
                                        onClick={() => setBookedSlotInfo(null)}
                                        disabled={!!slotActionLoading}
                                        className="h-7 w-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shrink-0 disabled:opacity-50"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <h3 className="font-heading text-base font-bold text-slate-900 leading-tight">{bc.name}</h3>
                                <p className="text-[12px] text-slate-400 mt-0.5">{bc.venue?.name}</p>
                            </div>

                            {/* ── Time band ── */}
                            <div className="px-6 py-4 flex items-center gap-3 bg-slate-50 border-b border-slate-100">
                                <div className="flex-1 text-center">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Mulai</p>
                                    <p className="font-heading text-3xl font-black text-slate-900 leading-none">{meta.start_time}</p>
                                </div>
                                <div className="flex flex-col items-center gap-0.5 shrink-0">
                                    <div className="flex items-center gap-1">
                                        <div className="h-px w-8 bg-slate-200" />
                                        <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-400">{durationHours} jam</span>
                                </div>
                                <div className="flex-1 text-center">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Selesai</p>
                                    <p className="font-heading text-3xl font-black text-slate-900 leading-none">{meta.end_time}</p>
                                </div>
                            </div>

                            {/* ── Details ── */}
                            <div className="px-6 py-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <span className="text-[11px] font-black text-slate-500">{meta.customer.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-slate-900 truncate">{meta.customer}</p>
                                        <p className="text-[12px] text-slate-400">{meta.phone}</p>
                                    </div>
                                    <div className="ml-auto text-right shrink-0">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Total</p>
                                        <p className="font-heading text-base font-extrabold text-slate-900">{fmt(meta.total_price)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Footer actions ── */}
                            <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    {canCancel && (
                                        <button
                                            onClick={() => handleSlotAction('cancel')}
                                            disabled={!!slotActionLoading}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-[12px] font-bold hover:bg-red-100 transition-all active:scale-[0.97] disabled:opacity-50"
                                        >
                                            {slotActionLoading === 'cancel' ? <Spinner className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                            Batalkan
                                        </button>
                                    )}
                                    {canConfirm && (
                                        <button
                                            onClick={() => handleSlotAction('confirm')}
                                            disabled={!!slotActionLoading}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 transition-all active:scale-[0.97] disabled:opacity-50"
                                        >
                                            {slotActionLoading === 'confirm' ? <Spinner className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                            Konfirmasi
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setBookedSlotInfo(null)}
                                    disabled={!!slotActionLoading}
                                    className="px-4 py-2 rounded-lg text-[12px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
                                >
                                    Tutup
                                </button>
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            })()}


            {/* Create Modal */}
            < Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} >
                <DialogContent hideClose className="w-[95vw] sm:max-w-xl md:max-w-4xl p-0 bg-white border-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90dvh]">
                    <DialogHeader className="px-6 sm:px-8 py-6 pb-4 border-b border-slate-100 flex-shrink-0 relative">
                        <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 pr-10">
                            Tambah Lapangan Baru
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500 mt-1.5">
                            Konfigurasi lapangan fisik baru untuk sistem reservasi.
                        </DialogDescription>
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors outline-none"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </DialogHeader>
                    <CreateCourtForm
                        venues={venues}
                        sports={sports}
                        onSuccess={() => setIsCreateModalOpen(false)}
                        onCancel={() => setIsCreateModalOpen(false)}
                    />
                </DialogContent>
            </Dialog >

            {/* Edit Modal */}
            < Dialog open={isEditModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsEditModalOpen(false);
                    setTimeout(() => setEditingCourt(null), 300);
                }
            }}>
                <DialogContent hideClose className="w-[95vw] sm:max-w-xl md:max-w-4xl p-0 bg-white border-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90dvh]">
                    <DialogHeader className="px-6 sm:px-8 py-6 pb-4 border-b border-slate-100 flex-shrink-0 relative">
                        <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 pr-10">
                            Edit Lapangan
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500 mt-1.5">
                            Perbarui informasi harga, lokasi, atau tipe lapangan.
                        </DialogDescription>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors outline-none"
                        >
                            <X className="w-5 h-5" />
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
            </Dialog >

            {/* Delete Confirmation Modal */}
            < Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
                setIsDeleteModalOpen(open);
                if (!open) setTimeout(() => setDeletingCourt(null), 200);
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4 animate-in zoom-in-50 duration-300">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-center font-heading text-xl">Hapus Lapangan?</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Anda yakin ingin menghapus <span className="font-semibold text-slate-900">{deletingCourt?.name}</span>?
                            Tindakan ini tidak dapat dibatalkan dan akan menghapus semua jadwal reservasi yang belum diproses untuk lapangan ini.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center gap-2 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
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
                                            window.dispatchEvent(new CustomEvent('toast', {
                                                detail: { type: 'success', message: 'Lapangan berhasil dihapus.' }
                                            }));
                                        },
                                    });
                                }
                            }}
                            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                            Hapus Lapangan
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Recap Modal */}
            < Dialog open={isRecapModalOpen} onOpenChange={setIsRecapModalOpen}>
                <DialogContent hideClose className="w-[95vw] sm:max-w-md p-0 bg-white border-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
                    <DialogHeader className="px-6 py-6 pb-4 border-b border-slate-100 flex-shrink-0 relative">
                        <DialogTitle className="text-xl font-bold text-slate-900 pr-10">
                            Cetak Rekapan
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500 mt-1.5">
                            Pilih periode untuk mengekspor rekapan pendapatan seluruh lapangan.
                        </DialogDescription>
                        <button
                            onClick={() => setIsRecapModalOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors outline-none"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </DialogHeader>

                    <div className="px-6 py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-900 block">
                                Periode Rekapan
                            </label>
                            <div className="relative">
                                <select
                                    value={recapPeriod}
                                    onChange={(e) => setRecapPeriod(e.target.value)}
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-transparent transition-all sm:text-sm appearance-none cursor-pointer"
                                >
                                    <option value="today">Hari Ini</option>
                                    <option value="week">Minggu Ini</option>
                                    <option value="month">Bulan Ini</option>
                                    <option value="year">Tahun Ini</option>
                                    <option value="custom">Kustom Tanggal</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        {recapPeriod === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 block">Dari Tanggal</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className={cn("w-full h-11 px-3 bg-white border rounded-xl text-sm font-medium text-slate-900 text-left flex items-center justify-between transition-all", !recapStartDate ? "text-slate-400 border-slate-200" : "border-padel-green ring-1 ring-padel-green/20")}>
                                                {recapStartDate ? format(recapStartDate, 'dd MMM yyyy', { locale: id }) : 'Pilih Tanggal'}
                                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 z-[100] bg-white border-slate-200 rounded-xl shadow-lg" align="start">
                                            <Calendar mode="single" selected={recapStartDate} onSelect={setRecapStartDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 block">Sampai Tanggal</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className={cn("w-full h-11 px-3 bg-white border rounded-xl text-sm font-medium text-slate-900 text-left flex items-center justify-between transition-all", !recapEndDate ? "text-slate-400 border-slate-200" : "border-padel-green ring-1 ring-padel-green/20")}>
                                                {recapEndDate ? format(recapEndDate, 'dd MMM yyyy', { locale: id }) : 'Pilih Tanggal'}
                                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 z-[100] bg-white border-slate-200 rounded-xl shadow-lg" align="start">
                                            <Calendar mode="single" selected={recapEndDate} onSelect={setRecapEndDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-6 flex justify-end gap-3 bg-slate-50 border-t border-slate-100 mt-auto">
                        <button
                            onClick={() => setIsRecapModalOpen(false)}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-all"
                        >
                            Batal
                        </button>
                        <button
                            disabled={recapPeriod === 'custom' && (!recapStartDate || !recapEndDate)}
                            onClick={() => {
                                let url = `/bookings/recap?period=${recapPeriod}`;
                                if (recapPeriod === 'custom' && recapStartDate && recapEndDate) {
                                    url += `&start_date=${format(recapStartDate, 'yyyy-MM-dd')}&end_date=${format(recapEndDate, 'yyyy-MM-dd')}`;
                                }
                                window.open(url, '_blank');
                                setIsRecapModalOpen(false);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-padel-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-padel-green-dark transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-padel-green disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer className="w-4 h-4" />
                            Export PDF
                        </button>
                    </div>
                </DialogContent>
            </Dialog >

            <Dialog open={isBookingModalOpen} onOpenChange={(open) => {
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
            }}>
                <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-[800px] p-0 bg-white border-0 shadow-2xl max-h-[90dvh] md:max-h-[85vh] overflow-hidden rounded-3xl flex flex-col gap-0">
                    <DialogHeader className="px-6 sm:px-8 md:px-10 py-6 border-b border-slate-100 bg-white shrink-0 space-y-1">
                        <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900">
                            Konfirmasi Booking
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500">
                            Lengkapi detail kustomer dan selesaikan reservasi ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 sm:px-8 md:px-10 py-6 md:py-8 overflow-y-auto flex-1 h-full min-h-0 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
                            {/* LEFT COLUMN: Customer */}
                            <div className="space-y-8">
                                {selectedCustomer ? (
                                    <div className="animate-in slide-in-from-left-4 fade-in duration-500">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-padel-green animate-pulse" />
                                                <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Kustomer Terpilih</h3>
                                            </div>
                                            <button
                                                onClick={() => setSelectedCustomer(null)}
                                                className="group flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                                                Ganti Kustomer
                                            </button>
                                        </div>

                                        <div className="relative pl-6 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full">
                                            <div className="flex flex-wrap items-end gap-3 md:gap-4 mb-2">
                                                <h4 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-slate-900 leading-none break-all">{selectedCustomer.name}</h4>
                                                {selectedCustomer.id ? (
                                                    <span className="mb-1 inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                                        Member
                                                    </span>
                                                ) : (
                                                    <span className="mb-1 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                                        Baru
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-3 mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:gap-6 overflow-hidden">
                                                <div className="flex items-center gap-3 text-slate-600 min-w-0">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                                                        <Mail className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="text-[15px] font-medium truncate" title={selectedCustomer.email}>{selectedCustomer.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-600 min-w-0">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                                                        <Phone className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="text-[15px] font-medium truncate" title={selectedCustomer.phone}>{selectedCustomer.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar">
                                            <button
                                                type="button"
                                                onClick={() => setBookingUserMode('search')}
                                                className={cn(
                                                    "text-sm font-bold pb-3 transition-colors border-b-[3px]",
                                                    bookingUserMode === 'search'
                                                        ? "text-padel-green border-padel-green"
                                                        : "text-slate-400 border-transparent hover:text-slate-600"
                                                )}
                                            >
                                                Cari Kustomer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBookingUserMode('create')}
                                                className={cn(
                                                    "text-sm font-bold pb-3 transition-colors border-b-[3px]",
                                                    bookingUserMode === 'create'
                                                        ? "text-padel-green border-padel-green"
                                                        : "text-slate-400 border-transparent hover:text-slate-600"
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
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Ketik nama, email, atau telepon..."
                                                    className="w-full py-3.5 bg-transparent border-0 border-b border-slate-200 text-base font-medium focus:border-padel-green focus:ring-0 transition-all outline-none"
                                                />
                                                {searchQuery.trim().length > 0 && (
                                                    <div className="pt-2 flex flex-col animate-in slide-in-from-top-2 fade-in duration-200">
                                                        {isSearching ? (
                                                            <div className="py-8 flex justify-center items-center">
                                                                <Spinner className="w-5 h-5 text-padel-green" />
                                                            </div>
                                                        ) : searchResults.length > 0 ? (
                                                            searchResults.map(user => (
                                                                <div
                                                                    key={user.id}
                                                                    onClick={() => setSelectedCustomer(user)}
                                                                    className="py-4 cursor-pointer flex items-center justify-between group border-b border-slate-50 last:border-0"
                                                                >
                                                                    <div className="min-w-0 pr-4">
                                                                        <p className="font-bold text-slate-900 group-hover:text-padel-green transition-colors truncate">{user.name}</p>
                                                                        <p className="text-slate-500 text-sm mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                                                                            {user.email && <span>{user.email}</span>}
                                                                            {user.email && user.phone && <span className="opacity-50 text-[10px]">•</span>}
                                                                            {user.phone && <span>{user.phone}</span>}
                                                                            {!user.email && !user.phone && <span className="italic">Tidak ada kontak</span>}
                                                                        </p>
                                                                    </div>
                                                                    <ArrowRight className="h-5 w-5 shrink-0 text-padel-green opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="py-8 text-center text-slate-500 text-sm font-medium">
                                                                Tidak ada kustomer yang cocok dengan pencarian Anda.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-5 pt-2 animate-in slide-in-from-right-2 fade-in duration-300 flex flex-col h-full">
                                                <div className="group relative">
                                                    <input
                                                        id="cust_name"
                                                        type="text"
                                                        required
                                                        value={newCustomer.name}
                                                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                                        placeholder=" "
                                                        className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                                    />
                                                    <label htmlFor="cust_name" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                        Nama Lengkap
                                                    </label>
                                                </div>
                                                <div className="group relative">
                                                    <input
                                                        id="cust_email"
                                                        type="email"
                                                        required
                                                        value={newCustomer.email}
                                                        onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                                        placeholder=" "
                                                        className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                                    />
                                                    <label htmlFor="cust_email" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                        Alamat Email
                                                    </label>
                                                </div>
                                                <div className="group relative">
                                                    <input
                                                        id="cust_phone"
                                                        type="text"
                                                        required
                                                        value={newCustomer.phone}
                                                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                                        placeholder=" "
                                                        className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                                    />
                                                    <label htmlFor="cust_phone" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                        Nomor Telepon
                                                    </label>
                                                </div>
                                                <div className="mt-8 space-y-3">
                                                    {customerError && (
                                                        <div className="text-[13px] font-medium text-red-500 bg-red-50 p-3 rounded-lg flex items-start gap-2">
                                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                            <span>{customerError}</span>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            setIsCreatingCustomer(true);
                                                            setCustomerError('');
                                                            try {
                                                                const response = await axios.post('/users/quick-store', newCustomer);
                                                                setSelectedCustomer(response.data.user);
                                                            } catch (error: any) {
                                                                setCustomerError(error.response?.data?.message || 'Gagal menambahkan kustomer.');
                                                            } finally {
                                                                setIsCreatingCustomer(false);
                                                            }
                                                        }}
                                                        disabled={!newCustomer.name || !newCustomer.email || !newCustomer.phone || isCreatingCustomer}
                                                        className="flex w-full justify-center items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isCreatingCustomer ? <Spinner className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                        {isCreatingCustomer ? 'Memproses...' : 'Gunakan Kustomer Ini'}
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
                                    <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">Rincian Reservasi</h3>
                                    {(() => {
                                        const selectedCourt = courts.find(c => c.id === selectedCourtId);
                                        if (!selectedCourt) return null;
                                        const hours = getSelectedHoursCount();
                                        const total = calculateTotalPrice(selectedCourt, selectedRange, selectedDate);

                                        return (
                                            <div className="flex flex-col gap-5 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500">Lapangan</span>
                                                    <span className="font-bold text-slate-900">{selectedCourt.name}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500">Lokasi</span>
                                                    <span className="font-bold text-slate-900">{selectedCourt.venue?.name}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500">Tanggal</span>
                                                    <span className="font-bold text-slate-900">
                                                        {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500">Waktu Main</span>
                                                    <span className="font-bold text-slate-900">
                                                        {selectedRange.start} {selectedRange.end ? `- ${selectedRange.end}` : ''}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500">Durasi</span>
                                                    <span className="font-bold text-slate-900">
                                                        {hours} Jam
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-5 border-t border-slate-200 mt-2">
                                                    <span className="font-medium text-slate-900">Total Harga</span>
                                                    <span className="text-xl font-bold text-slate-900">Rp {total.toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Payment Block */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Status Pembayaran</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentStatus('paid')}
                                            className={cn(
                                                "flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200",
                                                paymentStatus === 'paid'
                                                    ? "border-padel-green bg-padel-green/5 shadow-sm"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            )}
                                        >
                                            <span className={cn("text-sm font-bold", paymentStatus === 'paid' ? "text-padel-green" : "text-slate-700")}>
                                                Sudah Dibayar
                                            </span>
                                            <span className="text-xs text-slate-400">Lunas saat ini</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentStatus('unpaid')}
                                            className={cn(
                                                "flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200",
                                                paymentStatus === 'unpaid'
                                                    ? "border-amber-400 bg-amber-50 shadow-sm"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            )}
                                        >
                                            <span className={cn("text-sm font-bold", paymentStatus === 'unpaid' ? "text-amber-600" : "text-slate-700")}>
                                                Belum Dibayar
                                            </span>
                                            <span className="text-xs text-slate-400">Bayar nanti</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 sm:px-8 md:px-10 py-4 border-t border-slate-100 shrink-0 bg-white flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 w-full shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] relative z-10">
                        <button
                            type="button"
                            onClick={() => setIsBookingModalOpen(false)}
                            className="w-full sm:w-auto text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors outline-none px-5 py-2.5 rounded-lg hover:bg-slate-100 mt-2 sm:mt-0"
                        >
                            Batal
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (!selectedCustomer) {
                                    setBookingError('Pilih atau buat kustomer terlebih dahulu.');
                                    return;
                                }
                                setBookingError('');
                                setIsConfirmModalOpen(true);
                            }}
                            className="w-full sm:w-auto px-6 py-2.5 text-[13px] font-bold text-white bg-padel-green hover:bg-padel-green-dark rounded-lg shadow-sm shadow-padel-green/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-padel-green outline-none text-center"
                        >
                            Konfirmasi Reservasi
                        </button>
                    </div>
                    {bookingError && (
                        <div className="px-6 sm:px-8 md:px-10 pb-4 flex items-center gap-2 text-[13px] font-medium text-red-500">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {bookingError}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Confirmation Dialog */}
            {
                (() => {
                    const selectedCourt = courts.find(c => c.id === selectedCourtId);
                    const hours = getSelectedHoursCount();
                    const total = selectedCourt ? calculateTotalPrice(selectedCourt, selectedRange, selectedDate) : 0;

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
                                total_price: total,
                                payment_status: paymentStatus,
                            });

                            setIsConfirmModalOpen(false);
                            setIsBookingModalOpen(false);
                            setSelectedRange({ start: '08:00', end: null });
                            setSelectedCustomer(null);
                            setSearchQuery('');
                            setPaymentStatus('paid');

                            window.dispatchEvent(new CustomEvent('toast', {
                                detail: { type: 'success', message: 'Booking berhasil dibuat!' }
                            }));

                            router.reload({ only: ['courts'] });
                        } catch (err: any) {
                            setBookingError(err.response?.data?.message ?? 'Terjadi kesalahan. Coba lagi.');
                            setIsConfirmModalOpen(false);
                            setSelectedRange({ start: null, end: null });
                            router.reload({ only: ['courts'] });
                        } finally {
                            setIsSubmittingBooking(false);
                        }
                    };

                    return (
                        <Dialog open={isConfirmModalOpen} onOpenChange={(open) => {
                            if (!isSubmittingBooking) {
                                setIsConfirmModalOpen(open);
                            }
                        }}>
                            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-slate-200/60 shadow-2xl rounded-2xl">
                                <DialogHeader className="px-7 pt-7 pb-5 border-b border-slate-100">
                                    <DialogTitle className="text-lg font-bold text-slate-900">Konfirmasi Booking</DialogTitle>
                                    <DialogDescription className="text-sm text-slate-500">Pastikan semua detail di bawah sudah benar sebelum membuat booking.</DialogDescription>
                                </DialogHeader>

                                <div className="px-7 py-5 space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Lapangan</span>
                                        <span className="font-semibold text-slate-900">{selectedCourt?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Kustomer</span>
                                        <span className="font-semibold text-slate-900">{selectedCustomer?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tanggal</span>
                                        <span className="font-semibold text-slate-900">{selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Waktu</span>
                                        <span className="font-semibold text-slate-900">
                                            {selectedRange.start}{selectedRange.end ? ` – ${selectedRange.end}` : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Durasi</span>
                                        <span className="font-semibold text-slate-900">{hours} Jam</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Pembayaran</span>
                                        <span className={cn("font-semibold", paymentStatus === 'paid' ? 'text-padel-green' : 'text-amber-600')}>
                                            {paymentStatus === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-3 border-t border-slate-100 mt-2">
                                        <span className="font-medium text-slate-900">Total</span>
                                        <span className="text-lg font-bold text-slate-900">Rp {total.toLocaleString('id-ID')}</span>
                                    </div>

                                    {bookingError && (
                                        <div className="flex items-center gap-2 text-[13px] font-medium text-red-500 bg-red-50 p-3 rounded-lg mt-2">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            {bookingError}
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="px-7 pb-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
                                    <button
                                        type="button"
                                        disabled={isSubmittingBooking}
                                        onClick={() => setIsConfirmModalOpen(false)}
                                        className="w-full sm:w-auto px-5 py-2.5 text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmittingBooking}
                                        onClick={handleSubmitBooking}
                                        className="w-full sm:w-auto px-6 py-2.5 text-[13px] font-bold text-white bg-padel-green hover:bg-padel-green-dark rounded-lg shadow-sm transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-padel-green outline-none disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {isSubmittingBooking && <Spinner className="w-4 h-4" />}
                                        {isSubmittingBooking ? 'Memproses...' : 'Ya, Buat Booking'}
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    );
                })()
            }
        </AppLayout >
    );
}

// ----------------------------------------------------------------------
// PRICING RULES EDITOR COMPONENT
// ----------------------------------------------------------------------
function PricingRulesEditor({ rules, onChange }: { rules: PricingRule[], onChange: (newRules: PricingRule[]) => void }) {
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
        onChange([...rules, { days: [], start_time: '06:00', end_time: '18:00', price: '' }]);
    };

    const removeRule = (index: number) => {
        const newRules = [...rules];
        newRules.splice(index, 1);
        onChange(newRules);
    };

    const updateRule = (index: number, field: keyof PricingRule, value: any) => {
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], [field]: value };
        onChange(newRules);
    };

    const toggleDay = (ruleIndex: number, day: number) => {
        const rule = rules[ruleIndex];
        const newDays = rule.days.includes(day)
            ? rule.days.filter(d => d !== day)
            : [...rule.days, day].sort();
        updateRule(ruleIndex, 'days', newDays);
    };

    const handlePriceChange = (index: number, rawValue: string) => {
        if (!rawValue) { updateRule(index, 'price', ''); return; }
        const numericValue = rawValue.replace(/\D/g, '');
        updateRule(index, 'price', numericValue ? Number(numericValue) : '');
    };

    return (
        <div className="col-span-full space-y-3 pt-2">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[13px] font-bold text-slate-900">Harga Khusus <span className="text-[11px] font-semibold text-slate-400 ml-1">Opsional</span></p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tarif berdasarkan hari & jam. Aturan teratas diprioritaskan jika tumpang tindih.</p>
                </div>
                <button
                    type="button"
                    onClick={addRule}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-padel-green hover:text-padel-green hover:bg-emerald-50 transition-all shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                </button>
            </div>

            {rules.length > 0 && (
                <div className="space-y-2">
                    {rules.map((rule, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                            {/* Rule header */}
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aturan {index + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeRule(index)}
                                    className="h-6 w-6 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Days */}
                            <div className="flex flex-wrap gap-1.5">
                                {daysOfWeek.map((day) => {
                                    const isSelected = rule.days.includes(day.id);
                                    return (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => toggleDay(index, day.id)}
                                            className={cn(
                                                "px-2.5 py-1 text-[12px] font-bold rounded-lg border transition-all active:scale-95",
                                                isSelected
                                                    ? "border-padel-green bg-padel-green text-white"
                                                    : "border-slate-200 bg-white text-slate-500 hover:border-padel-green/50 hover:text-padel-green"
                                            )}
                                        >
                                            {day.name}
                                        </button>
                                    );
                                })}
                            </div>
                            {rule.days.length === 0 && (
                                <p className="text-[11px] font-medium text-red-500">Pilih minimal satu hari</p>
                            )}

                            {/* Time + Price row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mulai</label>
                                    <Input
                                        type="time"
                                        value={rule.start_time}
                                        onChange={(e) => updateRule(index, 'start_time', e.target.value)}
                                        className="h-9 text-[13px] font-semibold border-slate-200 focus-visible:ring-padel-green rounded-lg text-center bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</label>
                                    <Input
                                        type="time"
                                        value={rule.end_time}
                                        onChange={(e) => updateRule(index, 'end_time', e.target.value)}
                                        className="h-9 text-[13px] font-semibold border-slate-200 focus-visible:ring-padel-green rounded-lg text-center bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarif/Jam</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400 pointer-events-none">Rp</span>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            value={rule.price ? rule.price.toLocaleString('id-ID') : ''}
                                            onChange={(e) => handlePriceChange(index, e.target.value)}
                                            className="h-9 pl-8 pr-2 text-[13px] font-semibold text-slate-900 border-slate-200 focus-visible:ring-padel-green rounded-lg bg-white"
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

function CreateCourtForm({ venues, sports, onSuccess, onCancel }: { venues: Venue[], sports: Sport[], onSuccess: () => void, onCancel: () => void }) {
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
                window.dispatchEvent(new CustomEvent('toast', {
                    detail: { type: 'success', message: 'Lapangan baru berhasil dutambahkan.' }
                }));
            },
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input: Name */}
                    <div className="md:col-span-2 space-y-2">
                        <label htmlFor="name" className="text-sm font-semibold text-slate-900">Nama Lapangan <span className="text-red-500">*</span></label>
                        <input
                            id="name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder="Contoh: Lapangan A (Padel)"
                            className={cn(
                                "flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
                                form.errors.name ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:border-padel-green focus-visible:ring-padel-green-200"
                            )}
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    {/* Input: Images (Multiple) */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-semibold text-slate-900 block">Foto Lapangan (Opsional, Maks 10)</label>
                        <div className="flex flex-col gap-3">
                            {/* File Input Area */}
                            <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-slate-400 group-hover:text-padel-green transition-colors" />
                                    <p className="mb-1 text-sm text-slate-500"><span className="font-semibold text-padel-green">Klik untuk unggah</span> atau seret dan lepas</p>
                                    <p className="text-xs text-slate-400">JPEG, PNG, JPG, WEBP (Maks. 2MB)</p>
                                </div>
                                <input
                                    id="images"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const newFiles = Array.from(e.target.files);
                                            form.setData('images', [...form.data.images, ...newFiles].slice(0, 10)); // Limit to max 10
                                        }
                                    }}
                                />
                            </label>

                            {/* Previews for selected new files */}
                            {form.data.images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-2">
                                    {form.data.images.map((file, index) => (
                                        <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${index}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [...form.data.images];
                                                    newImages.splice(index, 1);
                                                    form.setData('images', newImages);
                                                }}
                                                className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <InputError message={form.errors.images as string} />
                            {/* We also need to map through array errors like images.0, but usually simple string is fine if backend sends it. */}
                        </div>
                    </div>

                    {/* Input: Venue & Sport (Selects) */}
                    <div className="space-y-2">
                        <label htmlFor="venue_id" className="text-sm font-semibold text-slate-900">Lokasi / Tempat <span className="text-red-500">*</span></label>
                        <select
                            id="venue_id"
                            value={form.data.venue_id}
                            onChange={(e) => form.setData('venue_id', e.target.value)}
                            className={cn(
                                "flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 appearance-none",
                                form.errors.venue_id ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:border-padel-green focus-visible:ring-padel-green-200"
                            )}
                        >
                            <option value="" disabled>Pilih Tempat</option>
                            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <InputError message={form.errors.venue_id} />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="sport_id" className="text-sm font-semibold text-slate-900">Jenis Olahraga <span className="text-red-500">*</span></label>
                        <select
                            id="sport_id"
                            value={form.data.sport_id}
                            onChange={(e) => form.setData('sport_id', e.target.value)}
                            className={cn(
                                "flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 appearance-none",
                                form.errors.sport_id ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:border-padel-green focus-visible:ring-padel-green-200"
                            )}
                        >
                            <option value="" disabled>Pilih Olahraga</option>
                            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <InputError message={form.errors.sport_id} />
                    </div>

                    {/* Input: Type & Price */}
                    <div className="space-y-2">
                        <label htmlFor="type" className="text-sm font-semibold text-slate-900">Tipe Area <span className="text-red-500">*</span></label>
                        <select
                            id="type"
                            value={form.data.type}
                            onChange={(e) => form.setData('type', e.target.value as 'indoor' | 'outdoor')}
                            className={cn(
                                "flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 appearance-none capitalize",
                                form.errors.type ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:border-padel-green focus-visible:ring-padel-green-200"
                            )}
                        >
                            <option value="indoor">Indoor</option>
                            <option value="outdoor">Outdoor</option>
                        </select>
                        <InputError message={form.errors.type} />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="price_per_hour" className="text-sm font-semibold text-slate-900">Tarif / Jam (Rp) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>
                            <input
                                id="price_per_hour"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.data.price_per_hour}
                                onChange={(e) => form.setData('price_per_hour', e.target.value)}
                                placeholder="150000"
                                className={cn(
                                    "flex h-11 w-full rounded-xl border bg-white pl-9 pr-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2",
                                    form.errors.price_per_hour ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:border-padel-green focus-visible:ring-padel-green-200"
                                )}
                            />
                        </div>
                        <InputError message={form.errors.price_per_hour} />
                    </div>

                    {/* Pricing Rules Editor */}
                    <PricingRulesEditor rules={form.data.pricing_rules} onChange={(rules) => form.setData('pricing_rules', rules)} />

                    {/* Input: is_active Toggle */}
                    <div className="md:col-span-2 mt-2">
                        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors group">
                            <div className="space-y-0.5 pr-4">
                                <span className="block text-sm font-bold text-slate-900 group-hover:text-padel-green transition-colors">Aktifkan Lapangan</span>
                                <span className="block text-xs text-slate-500 leading-relaxed">Lapangan yang aktif bisa dipesan langsung oleh pelanggan di website/aplikasi.</span>
                            </div>
                            <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2" style={{ backgroundColor: form.data.is_active ? '#06D001' : '#cbd5e1' }}>
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", form.data.is_active ? "translate-x-5" : "translate-x-0")} />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={form.processing}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-padel-green px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-padel-green-dark transition-all disabled:opacity-50"
                >
                    {form.processing && <Spinner className="h-4 w-4" />}
                    Simpan Lapangan
                </button>
            </div>
        </form>
    );
}

function EditCourtForm({ court, venues, sports, onSuccess, onCancel }: { court: Court, venues: Venue[], sports: Sport[], onSuccess: () => void, onCancel: () => void }) {
    const form = useForm({
        venue_id: court.venue_id.toString(),
        sport_id: court.sport_id.toString(),
        name: court.name,
        type: court.type,
        price_per_hour: court.price_per_hour.toString(),
        is_active: court.is_active,
        images: [] as File[],
        images_to_delete: [] as string[],
        pricing_rules: court.pricing_rules || [] as PricingRule[],
    });

    const [existingImages, setExistingImages] = useState<string[]>(court.images || []);

    const handleRemoveExistingImage = (path: string) => {
        setExistingImages(prev => prev.filter(img => img !== path));
        form.setData('images_to_delete', [...form.data.images_to_delete, path]);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit(update(court.id), {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess();
                window.dispatchEvent(new CustomEvent('toast', {
                    detail: { type: 'success', message: 'Lapangan berhasil diperbarui.' }
                }));
            },
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
                    {/* Input: Name */}
                    <div className="md:col-span-2 space-y-2.5">
                        <label htmlFor="edit_name" className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Nama Lapangan <span className="text-red-500">*</span></label>
                        <input
                            id="edit_name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className={cn(
                                "flex h-12 w-full rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:border-padel-green disabled:cursor-not-allowed disabled:opacity-50",
                                form.errors.name ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:ring-padel-green/20"
                            )}
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    {/* Input: Images (Multiple) */}
                    <div className="md:col-span-2 space-y-2.5">
                        <label className="text-[13px] font-bold text-slate-900 uppercase tracking-widest block">Foto Lapangan (Maks 10)</label>
                        <div className="flex flex-col gap-3">
                            <label htmlFor="edit_images" className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
                                <div className="flex flex-col items-center justify-center py-5">
                                    <UploadCloud className="w-6 h-6 mb-2 text-slate-400 group-hover:text-padel-green transition-colors" />
                                    <p className="mb-0.5 text-xs font-semibold text-slate-500"><span className="text-padel-green">Klik untuk unggah</span> atau seret foto kesini</p>
                                </div>
                                <input
                                    id="edit_images"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const newFiles = Array.from(e.target.files);
                                            form.setData('images', [...form.data.images, ...newFiles].slice(0, 10)); // Limit to max 10
                                        }
                                    }}
                                />
                            </label>

                            {/* Previews for existing and new files */}
                            {(existingImages.length > 0 || form.data.images.length > 0) && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-2">
                                    {/* Existing Images */}
                                    {existingImages.map((path, index) => (
                                        <div key={`existing-${index}`} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                                            <img
                                                src={getImageUrl(path)}
                                                alt={`Existing ${index}`}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExistingImage(path)}
                                                className="absolute top-1.5 right-1.5 bg-white/90 text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 shadow-sm transition-all hover:bg-red-50"
                                                title="Hapus foto ini"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm text-[10px] text-white font-medium text-center py-1">Tersimpan</div>
                                        </div>
                                    ))}

                                    {/* New Images */}
                                    {form.data.images.map((file, index) => (
                                        <div key={`new-${index}`} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${index}`}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [...form.data.images];
                                                    newImages.splice(index, 1);
                                                    form.setData('images', newImages);
                                                }}
                                                className="absolute top-1.5 right-1.5 bg-white/90 text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 shadow-sm transition-all hover:bg-red-50"
                                                title="Batal unggah"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 bg-padel-green/90 backdrop-blur-sm text-[10px] text-white font-medium text-center py-1">Baru</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <InputError message={form.errors.images as string} />
                        </div>
                    </div>

                    {/* Input: Venue & Sport (Selects) */}
                    <div className="space-y-2.5">
                        <label htmlFor="edit_venue_id" className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Lokasi Lapangan <span className="text-red-500">*</span></label>
                        <select
                            id="edit_venue_id"
                            value={form.data.venue_id}
                            onChange={(e) => form.setData('venue_id', e.target.value)}
                            className={cn(
                                "flex h-12 w-full rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:border-padel-green appearance-none",
                                form.errors.venue_id ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:ring-padel-green/20"
                            )}
                        >
                            <option value="" disabled>Pilih Tempat</option>
                            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <InputError message={form.errors.venue_id} />
                    </div>

                    <div className="space-y-2.5">
                        <label htmlFor="edit_sport_id" className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Jenis Olahraga <span className="text-red-500">*</span></label>
                        <select
                            id="edit_sport_id"
                            value={form.data.sport_id}
                            onChange={(e) => form.setData('sport_id', e.target.value)}
                            className={cn(
                                "flex h-12 w-full rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:border-padel-green appearance-none",
                                form.errors.sport_id ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:ring-padel-green/20"
                            )}
                        >
                            <option value="" disabled>Pilih Olahraga</option>
                            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <InputError message={form.errors.sport_id} />
                    </div>

                    {/* Input: Type & Price */}
                    <div className="space-y-2.5">
                        <label htmlFor="edit_type" className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Tipe Area <span className="text-red-500">*</span></label>
                        <select
                            id="edit_type"
                            value={form.data.type}
                            onChange={(e) => form.setData('type', e.target.value as 'indoor' | 'outdoor')}
                            className={cn(
                                "flex h-12 w-full rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:border-padel-green appearance-none capitalize",
                                form.errors.type ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:ring-padel-green/20"
                            )}
                        >
                            <option value="indoor">Indoor</option>
                            <option value="outdoor">Outdoor</option>
                        </select>
                        <InputError message={form.errors.type} />
                    </div>

                    <div className="space-y-2.5">
                        <label htmlFor="edit_price_per_hour" className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Tarif / Jam <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[15px] font-medium">Rp</span>
                            <input
                                id="edit_price_per_hour"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.data.price_per_hour}
                                onChange={(e) => form.setData('price_per_hour', e.target.value)}
                                className={cn(
                                    "flex h-12 w-full rounded-xl border bg-slate-50 pl-11 pr-4 py-2 text-[15px] font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:border-padel-green",
                                    form.errors.price_per_hour ? "border-red-500 focus-visible:ring-red-200" : "border-slate-200 focus-visible:ring-padel-green/20"
                                )}
                            />
                        </div>
                        <InputError message={form.errors.price_per_hour} />
                    </div>

                    {/* Pricing Rules Editor */}
                    <PricingRulesEditor rules={form.data.pricing_rules} onChange={(rules) => form.setData('pricing_rules', rules)} />

                    {/* Input: is_active Toggle */}
                    <div className="md:col-span-2 mt-2">
                        <label className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors group shadow-sm">
                            <div className="space-y-1 pr-6">
                                <span className="block text-sm font-bold text-slate-900 uppercase tracking-widest">Aktifkan Lapangan</span>
                                <span className="block text-[13px] font-medium text-slate-500 leading-relaxed">Lapangan yang aktif bisa dipesan langsung oleh pelanggan di website/aplikasi.</span>
                            </div>
                            <div className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2" style={{ backgroundColor: form.data.is_active ? '#06D001' : '#cbd5e1' }}>
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                <span className={cn("inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out", form.data.is_active ? "translate-x-5" : "translate-x-0")} />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 bg-white px-6 sm:px-8 py-5 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={form.processing}
                    className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-padel-green px-7 py-2.5 text-sm font-bold text-white shadow-sm shadow-padel-green/20 hover:bg-padel-green-dark transition-all disabled:opacity-50"
                >
                    {form.processing && <Spinner className="h-4 w-4" />}
                    Simpan Perubahan
                </button>
            </div>
        </form>
    );
}
