import { Head, usePage, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Clock,
    Plus,
    ShoppingCart,
    Trash2,
    X,
    CheckCircle2,
    AlertCircle,
    Activity,
    Zap,
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { login } from '@/routes';

/* ─────────────────────────── Types ─────────────────────────── */
interface Sport {
    id: number;
    name: string;
}
interface Venue {
    id: number;
    name: string;
    images?: string[];
}
interface PricingRule {
    days: number[];
    start_time: string;
    end_time: string;
    price: number;
}
interface Court {
    id: number;
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
}
interface CartItem {
    court: Court;
    date: Date;
    startTime: string;
    endTime: string;
    hours: number;
    totalPrice: number;
}
interface BookingProps {
    courts: Court[];
    sports: Sport[];
    filters?: { date?: string; sport?: string };
}

/* ─────────────────────────── Helpers ─────────────────────────── */
const getImageUrl = (path: string) =>
    path.startsWith('http') ? path : `/storage/${path}`;

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(n);

function calcPrice(court: Court, startTime: string, endTime: string, date: Date): number {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const dayOfWeek = date.getDay();
    let total = 0;
    for (let h = startHour; h < endHour; h++) {
        const slot = `${h.toString().padStart(2, '0')}:00`;
        let price = court.price_per_hour;
        if (court.pricing_rules) {
            for (const rule of court.pricing_rules) {
                if (rule.days.includes(dayOfWeek) && slot >= rule.start_time && slot < rule.end_time) {
                    price = Number(rule.price);
                    break;
                }
            }
        }
        total += price;
    }
    return total;
}

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

/* ─────────────────────────── Time Slot Picker ─────────────────────────── */
function TimeSlotPicker({ court, date, onAdd }: { court: Court; date: Date; onAdd: (item: CartItem) => void }) {
    const [start, setStart] = useState<string | null>(null);
    const [end, setEnd] = useState<string | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    const bookedSlots = court.booked_slots ?? [];

    const isInRange = (t: string) => {
        if (!start || end) return false;
        if (!hovered || t <= start || t > hovered) return false;
        const sh = parseInt(start.split(':')[0]);
        const hh = parseInt(hovered.split(':')[0]);
        for (let h = sh + 1; h <= hh; h++) {
            if (bookedSlots.includes(`${h.toString().padStart(2, '0')}:00`)) return false;
        }
        return true;
    };

    const isSelected = (t: string) => {
        if (!start) return false;
        if (!end) return t === start;
        return t >= start && t <= end;
    };

    const handleClick = (t: string) => {
        if (bookedSlots.includes(t)) return;
        if (!start || (start && end)) { setStart(t); setEnd(null); return; }
        if (t < start) { setStart(t); return; }
        if (t === start) { setStart(null); return; }
        const sh = parseInt(start.split(':')[0]);
        const th = parseInt(t.split(':')[0]);
        let conflict = false;
        for (let h = sh + 1; h <= th; h++) {
            if (bookedSlots.includes(`${h.toString().padStart(2, '0')}:00`)) { conflict = true; break; }
        }
        if (conflict) { setStart(t); setEnd(null); } else { setEnd(t); }
    };

    const hours = useMemo(() => {
        if (!start) return 0;
        if (!end) return 1;
        return parseInt(end.split(':')[0]) - parseInt(start.split(':')[0]) + 1;
    }, [start, end]);

    const endTime = useMemo(() => {
        if (!start) return '';
        const lastSlot = end ?? start;
        return `${(parseInt(lastSlot.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;
    }, [start, end]);

    const total = useMemo(() => {
        if (!start) return 0;
        return calcPrice(court, start, endTime, date);
    }, [court, start, endTime, date]);

    const handleAdd = () => {
        if (!start || !endTime) return;
        onAdd({ court, date, startTime: start, endTime, hours, totalPrice: total });
        setStart(null);
        setEnd(null);
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-8 gap-1.5">
                {TIME_SLOTS.map((t) => {
                    const booked = bookedSlots.includes(t);
                    const sel = isSelected(t);
                    const inRange = isInRange(t);
                    return (
                        <button
                            key={t}
                            disabled={booked}
                            onClick={() => handleClick(t)}
                            onMouseEnter={() => !booked && setHovered(t)}
                            onMouseLeave={() => setHovered(null)}
                            className={cn(
                                'relative rounded-lg border py-2 text-[10px] font-bold transition-all duration-150 outline-none',
                                booked
                                    ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-700 line-through'
                                    : sel
                                      ? 'z-10 scale-105 border-emerald-500 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                      : inRange
                                        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-500'
                                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-emerald-500/40 hover:bg-slate-200 hover:text-slate-900',
                            )}
                        >
                            {t.slice(0, 5)}
                        </button>
                    );
                })}
            </div>

            {start && (
                <div className="animate-in fade-in slide-in-from-top-2 flex items-center justify-between border-t border-slate-200 pt-3 duration-200">
                    <div>
                        <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Pilihan</p>
                        <p className="font-mono font-bold text-slate-900">
                            {start} → {endTime}
                            <span className="ml-2 text-xs text-slate-400">({hours} jam)</span>
                        </p>
                        <p className="mt-0.5 font-mono text-lg font-bold text-emerald-500">{fmt(total)}</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-600 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────── Court Card ─────────────────────────── */
function CourtCard({ court, date, onAdd }: { court: Court; date: Date; onAdd: (item: CartItem) => void }) {
    const [expanded, setExpanded] = useState(false);
    const imgs = court.images?.length ? court.images : court.venue?.images?.length ? court.venue.images : null;
    const imgSrc = imgs ? getImageUrl(imgs[0]) : 'https://images.unsplash.com/photo-1646649853703-7645147474ba?w=800&q=80';

    return (
        <div className={cn('overflow-hidden rounded-2xl border transition-all duration-300', expanded ? 'border-emerald-500/50 bg-white' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100')}>
            <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-4 px-5 py-4 text-left">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img src={imgSrc} alt={court.name} className="h-full w-full object-cover" />
                    <div className={cn('absolute top-1 right-1 h-2 w-2 rounded-full', court.is_booked_now ? 'bg-red-500' : 'bg-emerald-500')} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                        <h3 className="truncate font-display font-bold text-slate-900">{court.name}</h3>
                        <span className="hidden rounded-full border border-slate-200 px-2 py-0.5 text-[9px] font-black tracking-widest text-slate-500 uppercase sm:inline">
                            {court.type}
                        </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">{court.venue?.name} · {court.sport?.name}</p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-bold text-emerald-500">{fmt(court.price_per_hour)}</p>
                    <p className="text-[10px] text-slate-400">/jam</p>
                </div>
                <ChevronRight className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300', expanded && 'rotate-90 text-emerald-500')} />
            </button>

            <div className={cn('grid transition-all duration-300', expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                <div className="overflow-hidden">
                    <div className="border-t border-slate-200 px-5 pt-4 pb-5">
                        <div className="mb-3 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Pilih Jam — {format(date, 'EEE, dd MMM', { locale: idLocale })}
                            </span>
                        </div>
                        <TimeSlotPicker court={court} date={date} onAdd={(item) => { onAdd(item); setExpanded(false); }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────── Cart Panel ─────────────────────────── */
function CartPanel({ items, onRemove, onCheckout }: { items: CartItem[]; onRemove: (i: number) => void; onCheckout: () => void }) {
    const total = items.reduce((s, i) => s + i.totalPrice, 0);

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                    <ShoppingCart className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">Keranjang kosong</p>
                <p className="mt-1 text-xs text-slate-700">Pilih lapangan & jam di atas</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{item.court.name}</p>
                        <p className="truncate text-xs text-slate-500">{item.court.venue?.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[11px] text-slate-700">{format(item.date, 'dd MMM')}</span>
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] text-emerald-500">{item.startTime} – {item.endTime}</span>
                            <span className="text-[11px] text-slate-400">{item.hours} jam</span>
                        </div>
                        <p className="mt-2 font-mono text-sm font-bold text-emerald-500">{fmt(item.totalPrice)}</p>
                    </div>
                    <button onClick={() => onRemove(i)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-950/40 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            <div className="mt-1 border-t border-slate-200 pt-3">
                <div className="mb-4 flex items-baseline justify-between">
                    <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Total</span>
                    <span className="font-mono text-xl font-black text-slate-900">{fmt(total)}</span>
                </div>
                <button
                    onClick={onCheckout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-bold text-white shadow-[0_4px_24px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-600 hover:shadow-[0_4px_32px_rgba(16,185,129,0.5)] active:scale-[0.98]"
                >
                    Pesan Sekarang
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────── Checkout Modal ─────────────────────────── */
type CheckoutStep = 'confirm' | 'done';

function CheckoutModal({
    items,
    onClose,
    onSuccess,
    user,
}: {
    items: CartItem[];
    onClose: () => void;
    onSuccess: () => void;
    user: { id: number; name: string; email: string; phone?: string };
}) {
    const [step, setStep] = useState<CheckoutStep>('confirm');
    const [submitting, setSubmitting] = useState(false);
    const [snapOpen, setSnapOpen] = useState(false);
    const [error, setError] = useState('');
    const [phoneInput, setPhoneInput] = useState('');
    const needsPhone = !user.phone;
    const total = items.reduce((s, i) => s + i.totalPrice, 0);

    const openSnapAt = (idx: number, tokens: string[]) => {
        if (idx >= tokens.length) { setSnapOpen(false); setStep('done'); return; }
        if (!window.snap) { setSnapOpen(false); setError('Midtrans tidak tersedia. Refresh halaman dan coba lagi.'); return; }
        setSnapOpen(true);
        window.snap.pay(tokens[idx], {
            onSuccess: () => openSnapAt(idx + 1, tokens),
            onPending: () => openSnapAt(idx + 1, tokens),
            onError: () => { setSnapOpen(false); setError(`Pembayaran lapangan ke-${idx + 1} gagal. Silakan coba lagi.`); },
            onClose: () => { setSnapOpen(false); setError('Pembayaran dibatalkan. Klik "Bayar Sekarang" untuk melanjutkan.'); },
        });
    };

    const handlePay = async () => {
        if (needsPhone && !phoneInput.trim()) { setError('Nomor WhatsApp wajib diisi.'); return; }
        setSubmitting(true);
        setError('');
        try {
            if (needsPhone) await axios.patch('/user/phone', { phone: phoneInput.trim() });
            const tokens: string[] = [];
            for (const item of items) {
                const res = await axios.post('/bookings/guest', {
                    user_id: user.id,
                    court_id: item.court.id,
                    date: format(item.date, 'yyyy-MM-dd'),
                    start_time: item.startTime,
                    end_time: item.endTime,
                    total_price: item.totalPrice,
                    payment_status: 'midtrans',
                });
                tokens.push(res.data.snap_token);
            }
            setSubmitting(false);
            openSnapAt(0, tokens);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message ?? 'Terjadi kesalahan. Coba lagi.');
            setSubmitting(false);
        }
    };

    return (
        <div className={cn('fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center', snapOpen && 'invisible')}>
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                {step === 'done' ? (
                    <div className="flex flex-col items-center p-10 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                        </div>
                        <h2 className="mb-2 font-display text-2xl font-black text-slate-900">Pembayaran Berhasil!</h2>
                        <p className="mb-1 text-sm text-slate-400">Booking Anda telah dikonfirmasi.</p>
                        <p className="mb-6 text-xs text-slate-500">
                            Notifikasi akan dikirim via WhatsApp ke{' '}
                            <span className="font-medium text-slate-900">{user.phone ?? (phoneInput || user.email)}</span>
                        </p>
                        <button onClick={() => { onSuccess(); onClose(); }} className="rounded-xl bg-emerald-500 px-8 py-3 font-bold text-white transition-all hover:bg-emerald-600">
                            Selesai
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
                            <div>
                                <h2 className="font-display text-xl font-black text-slate-900">Konfirmasi Pesanan</h2>
                                <p className="mt-0.5 text-xs text-slate-500">{items.length} lapangan · {fmt(total)}</p>
                            </div>
                            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-48 space-y-2 overflow-y-auto border-b border-slate-200 px-7 py-4">
                            {items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div>
                                        <span className="font-medium text-slate-900">{item.court.name}</span>
                                        <span className="mx-2 text-slate-500">·</span>
                                        <span className="font-mono text-xs text-slate-500">{format(item.date, 'dd MMM')} {item.startTime}–{item.endTime}</span>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-emerald-500">{fmt(item.totalPrice)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-b border-slate-200 px-7 py-4">
                            <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">Pemesan</p>
                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                            {user.phone ? (
                                <p className="text-xs text-slate-500">{user.phone}</p>
                            ) : (
                                <div className="mt-3 group relative">
                                    <input
                                        id="checkout-phone"
                                        type="tel"
                                        required
                                        value={phoneInput}
                                        onChange={(e) => setPhoneInput(e.target.value)}
                                        placeholder=" "
                                        className="peer block w-full rounded-none border-0 border-b-2 border-amber-300 bg-transparent px-0 pt-5 pb-2 text-sm font-medium text-slate-900 placeholder-transparent transition-all duration-300 focus:border-emerald-500 focus:ring-0 focus:outline-none"
                                    />
                                    <label htmlFor="checkout-phone" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-sm font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-1 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-emerald-500 peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                        Nomor WhatsApp
                                    </label>
                                    <p className="mt-1 text-[10px] text-amber-600">Diperlukan untuk notifikasi booking</p>
                                </div>
                            )}
                        </div>

                        <div className="px-7 py-6">
                            <div className="mb-4 flex items-baseline justify-between">
                                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Total Pembayaran</span>
                                <span className="font-mono text-xl font-black text-slate-900">{fmt(total)}</span>
                            </div>
                            {error && (
                                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={handlePay}
                                disabled={submitting}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-bold text-white shadow-[0_4px_24px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />Memproses...</>
                                ) : (
                                    <><Zap className="h-4 w-4" />Bayar Sekarang · {fmt(total)}</>
                                )}
                            </button>
                            <p className="mt-3 text-center text-xs text-slate-700">Pembayaran aman via Midtrans · Berbagai metode tersedia</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────── Main Page ─────────────────────────── */
export default function Booking({ courts = [], sports = [], filters }: BookingProps) {
    const { auth } = usePage().props as {
        auth: { user?: { id: number; name: string; email: string; phone?: string } } | null;
    };

    const [selectedDate, setSelectedDate] = useState(() => {
        if (filters?.date) {
            const [y, m, d] = filters.date.split('-');
            if (y && m && d) return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        }
        return new Date();
    });
    const [startDate, setStartDate] = useState(selectedDate);
    const [selectedSport, setSelectedSport] = useState<number | null>(() => {
        return filters?.sport ? parseInt(filters.sport) : null;
    });
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            if (filters?.date !== formattedDate || (filters?.sport ?? null) !== (selectedSport !== null ? String(selectedSport) : null)) {
                router.get(
                    '/booking',
                    {
                        date: formattedDate,
                        ...(selectedSport !== null && { sport: selectedSport }),
                    },
                    { preserveState: true, preserveScroll: true, only: ['courts', 'filters'], replace: true },
                );
            }
        }, 150);
        return () => clearTimeout(t);
    }, [selectedDate, selectedSport, filters?.date, filters?.sport]);

    const visibleDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d;
    });

    const filteredCourts = useMemo(
        () => courts.filter((c) => selectedSport === null || c.sport?.id === selectedSport),
        [courts, selectedSport],
    );

    const addToCart = useCallback((item: CartItem) => {
        setCartItems((prev) => [...prev, item]);
        setCartOpen(true);
    }, []);

    const removeFromCart = useCallback((idx: number) => {
        setCartItems((prev) => prev.filter((_, i) => i !== idx));
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
            <Head title="Booking Lapangan — Sofiah Sport Center" />

            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="h-5 w-px bg-slate-200" />
                        <span className="font-display text-lg font-bold text-slate-900">Sofiah Sport Center</span>
                    </div>

                    <h1 className="font-display text-base font-black text-slate-900 sm:text-lg">BOOKING LAPANGAN</h1>

                    <div className="flex items-center gap-2">
                        {/* Cart button */}
                        <button
                            onClick={() => setCartOpen(!cartOpen)}
                            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                        {auth?.user ? (
                            <Link href="/dashboard" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600">
                                Dashboard
                            </Link>
                        ) : (
                            <Link href={login()} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600">
                                Masuk
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Main Layout ── */}
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 lg:flex-row lg:gap-8 lg:px-8">

                {/* LEFT — Courts */}
                <div className="min-w-0 flex-1">

                    {/* Date Ribbon */}
                    <div className="mb-5 flex items-center gap-2">
                        <button
                            onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 1); setStartDate(d); }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:border-slate-300 hover:text-slate-900 active:scale-95"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="grid flex-1 grid-cols-7 gap-1.5">
                            {visibleDates.map((d, idx) => {
                                const isSel = d.toDateString() === selectedDate.toDateString();
                                const isToday = d.toDateString() === new Date().toDateString();
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(d)}
                                        className={cn(
                                            'flex flex-col items-center rounded-xl border py-2.5 text-center transition-all duration-200',
                                            isSel
                                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
                                                : 'border-slate-200 bg-slate-100/50 text-slate-500 hover:border-slate-300 hover:text-slate-900',
                                        )}
                                    >
                                        <span className={cn('text-[9px] font-bold tracking-wider uppercase', isSel ? 'text-white' : '')}>
                                            {isToday ? 'Hari Ini' : format(d, 'EEE', { locale: idLocale })}
                                        </span>
                                        <span className="mt-0.5 font-display text-lg font-black leading-none">{d.getDate()}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 1); setStartDate(d); }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:border-slate-300 hover:text-slate-900 active:scale-95"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Sport Filter */}
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setSelectedSport(null)}
                            className={cn(
                                'rounded-full border px-4 py-1.5 text-sm font-bold transition-all',
                                selectedSport === null
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900',
                            )}
                        >
                            Semua
                        </button>
                        {sports.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSport(s.id)}
                                className={cn(
                                    'rounded-full border px-4 py-1.5 text-sm font-bold transition-all',
                                    selectedSport === s.id
                                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_2px_12px_rgba(16,185,129,0.3)]'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900',
                                )}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>

                    {/* Courts List */}
                    {filteredCourts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
                            <Activity className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                            <p className="font-medium text-slate-500">Tidak ada lapangan tersedia</p>
                            <p className="mt-1 text-sm text-slate-400">Coba pilih olahraga atau tanggal lain</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredCourts.map((court) => (
                                <CourtCard key={court.id} court={court} date={selectedDate} onAdd={addToCart} />
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT — Cart Sidebar (desktop) */}
                <div className="hidden w-80 shrink-0 lg:block">
                    <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-emerald-500" />
                            <h3 className="font-display text-sm font-bold text-slate-900">Keranjang Pesanan</h3>
                            {cartItems.length > 0 && (
                                <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-black text-emerald-500">
                                    {cartItems.length}
                                </span>
                            )}
                        </div>
                        <CartPanel
                            items={cartItems}
                            onRemove={removeFromCart}
                            onCheckout={() => {
                                if (!auth?.user) { router.visit(login()); return; }
                                setCheckoutOpen(true);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Mobile Cart Drawer ── */}
            {cartOpen && (
                <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
                    <div className="relative max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-6">
                        <div className="mb-5 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-emerald-500" />
                            <h3 className="font-display font-bold text-slate-900">Keranjang</h3>
                            <button onClick={() => setCartOpen(false)} className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <CartPanel
                            items={cartItems}
                            onRemove={removeFromCart}
                            onCheckout={() => {
                                setCartOpen(false);
                                if (!auth?.user) { router.visit(login()); return; }
                                setCheckoutOpen(true);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Mobile FAB Cart */}
            {cartItems.length > 0 && !cartOpen && (
                <div className="fixed right-6 bottom-6 z-40 lg:hidden">
                    <button
                        onClick={() => setCartOpen(true)}
                        className="flex items-center gap-3 rounded-2xl bg-emerald-500 px-5 py-3.5 font-bold text-white shadow-[0_8px_32px_rgba(16,185,129,0.5)] transition-all hover:bg-emerald-600 active:scale-95"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        <span>{cartItems.length} item</span>
                        <span className="font-mono">·</span>
                        <span className="font-mono">{fmt(cartItems.reduce((s, i) => s + i.totalPrice, 0))}</span>
                    </button>
                </div>
            )}

            {/* Checkout Modal */}
            {checkoutOpen && auth?.user && (
                <CheckoutModal
                    items={cartItems}
                    onClose={() => setCheckoutOpen(false)}
                    onSuccess={() => setCartItems([])}
                    user={auth.user}
                />
            )}
        </div>
    );
}
