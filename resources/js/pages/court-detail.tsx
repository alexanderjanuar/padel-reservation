import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Instagram,
    Mail,
    MapPin,
    Menu,
    Phone,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

/* ─────────────────────────── Types ─────────────────────────── */
interface Sport { id: number; name: string; }
interface Facility { id: number; name: string; icon?: string; }
interface Venue {
    id: number; name: string; address?: string; city?: string;
    phone?: string; description?: string; images?: string[];
    facilities?: Facility[];
}
interface Court {
    id: number; name: string; type: 'indoor' | 'outdoor';
    price_per_hour: number; sport: Sport; venue: Venue;
    images?: string[]; pricing_rules?: { days: number[]; start_time: string; end_time: string; price: number; }[];
}
interface PageProps {
    court: Court;
    relatedCourts: Court[];
    canRegister?: boolean;
}

/* ─────────────────────────── Helpers ─────────────────────────── */
const getImageUrl = (path: string) => path.startsWith('http') ? path : `/storage/${path}`;
const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1646649853703-7645147474ba?w=1200&q=80';

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

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

/* ─────────────────────────── Related Card ─────────────────────────── */
function RelatedCard({ court }: { court: Court }) {
    const img = court.images?.[0] ?? court.venue?.images?.[0];
    const src = img ? getImageUrl(img) : FALLBACK_IMG;
    return (
        <Link href={`/lapangan/${court.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:border-slate-200 hover:shadow-md">
            <div className="relative aspect-[4/3] overflow-hidden">
                <img src={src} alt={court.name} onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                <span className={cn('absolute top-3 left-3 rounded-full px-2.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase', court.type === 'indoor' ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white')}>
                    {court.type}
                </span>
                <p className="absolute bottom-3 left-3 font-display text-base font-black text-white">{fmt(court.price_per_hour)}<span className="ml-1 text-[10px] font-medium text-white/50">/jam</span></p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <div className="min-w-0">
                    <h3 className="font-display text-sm font-black leading-tight text-slate-900 group-hover:text-emerald-600">{court.name}</h3>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">{court.venue?.name}</p>
                </div>
                <div className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 text-slate-300 transition-all group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white">
                    <ArrowRight className="h-3.5 w-3.5" />
                </div>
            </div>
        </Link>
    );
}

/* ─────────────────────────── Checkout Modal ─────────────────────────── */
interface CheckoutItem {
    courtId: number;
    courtName: string;
    date: Date;
    startTime: string;
    endTime: string;
    hours: number;
    totalPrice: number;
}

function CheckoutModal({
    item,
    onClose,
    onSuccess,
    user,
}: {
    item: CheckoutItem;
    onClose: () => void;
    onSuccess: () => void;
    user: { id: number; name: string; email: string; phone?: string };
}) {
    const [step, setStep] = useState<'confirm' | 'done'>('confirm');
    const [submitting, setSubmitting] = useState(false);
    const [snapOpen, setSnapOpen] = useState(false);
    const [error, setError] = useState('');
    const [phoneInput, setPhoneInput] = useState('');
    const needsPhone = !user.phone;

    const openSnap = (token: string) => {
        if (!window.snap) { setError('Midtrans tidak tersedia. Refresh halaman dan coba lagi.'); return; }
        setSnapOpen(true);
        window.snap.pay(token, {
            onSuccess: () => { setSnapOpen(false); setStep('done'); },
            onPending: () => { setSnapOpen(false); setStep('done'); },
            onError: () => { setSnapOpen(false); setError('Pembayaran gagal. Silakan coba lagi.'); },
            onClose: () => { setSnapOpen(false); setError('Pembayaran dibatalkan. Klik "Bayar Sekarang" untuk melanjutkan.'); },
        });
    };

    const handlePay = async () => {
        if (needsPhone && !phoneInput.trim()) { setError('Nomor WhatsApp wajib diisi.'); return; }
        setSubmitting(true);
        setError('');
        try {
            if (needsPhone) await axios.patch('/user/phone', { phone: phoneInput.trim() });
            const res = await axios.post('/bookings/guest', {
                user_id: user.id,
                court_id: item.courtId,
                date: format(item.date, 'yyyy-MM-dd'),
                start_time: item.startTime,
                end_time: item.endTime,
                total_price: item.totalPrice,
                payment_status: 'midtrans',
            });
            setSubmitting(false);
            openSnap(res.data.snap_token);
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
                                <p className="mt-0.5 text-xs text-slate-500">{item.courtName} · {fmt(item.totalPrice)}</p>
                            </div>
                            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="border-b border-slate-200 px-7 py-4">
                            <div className="flex items-center justify-between text-sm">
                                <div>
                                    <span className="font-medium text-slate-900">{item.courtName}</span>
                                    <span className="mx-2 text-slate-400">·</span>
                                    <span className="font-mono text-xs text-slate-500">
                                        {format(item.date, 'dd MMM yyyy', { locale: idLocale })} · {item.startTime}–{item.endTime} ({item.hours} jam)
                                    </span>
                                </div>
                                <span className="ml-4 shrink-0 font-mono text-xs font-bold text-emerald-500">{fmt(item.totalPrice)}</span>
                            </div>
                        </div>

                        <div className="border-b border-slate-200 px-7 py-4">
                            <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">Pemesan</p>
                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                            {user.phone ? (
                                <p className="text-xs text-slate-500">{user.phone}</p>
                            ) : (
                                <div className="group relative mt-3">
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
                                <span className="font-mono text-xl font-black text-slate-900">{fmt(item.totalPrice)}</span>
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
                                    <><Zap className="h-4 w-4" />Bayar Sekarang · {fmt(item.totalPrice)}</>
                                )}
                            </button>
                            <p className="mt-3 text-center text-xs text-slate-400">Pembayaran aman via Midtrans · Berbagai metode tersedia</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────── Main Page ─────────────────────────── */
export default function CourtDetail({ court, relatedCourts = [], canRegister = true }: PageProps) {
    const { auth } = usePage().props as { auth: { user?: { id: number; name: string; email: string } } | null; };

    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    // Booking state
    const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
    const [weekStart, setWeekStart] = useState<Date>(today);
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [timeStart, setTimeStart] = useState<string | null>(null);
    const [timeEnd, setTimeEnd] = useState<string | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);

    const visibleDates = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }),
    [weekStart]);

    const bookingEndTime = useMemo(() => {
        if (!timeStart) return '';
        const lastSlot = timeEnd ?? timeStart;
        return `${(parseInt(lastSlot.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;
    }, [timeStart, timeEnd]);

    const bookingHours = useMemo(() => {
        if (!timeStart) return 0;
        if (!timeEnd) return 1;
        return parseInt(timeEnd.split(':')[0]) - parseInt(timeStart.split(':')[0]) + 1;
    }, [timeStart, timeEnd]);

    const bookingTotal = useMemo(() => {
        if (!timeStart || !bookingEndTime) return 0;
        return calcPrice(court, timeStart, bookingEndTime, selectedDate);
    }, [court, timeStart, bookingEndTime, selectedDate]);

    const handleSlotClick = (t: string) => {
        if (!timeStart || (timeStart && timeEnd)) { setTimeStart(t); setTimeEnd(null); return; }
        if (t < timeStart) { setTimeStart(t); return; }
        if (t === timeStart) { setTimeStart(null); return; }
        setTimeEnd(t);
    };

    const isSlotInRange = (t: string) => {
        if (!timeStart || timeEnd) return false;
        if (!hovered || t <= timeStart || t > hovered) return false;
        return true;
    };

    const isSlotSelected = (t: string) => {
        if (!timeStart) return false;
        if (!timeEnd) return t === timeStart;
        return t >= timeStart && t <= timeEnd;
    };

    useEffect(() => {
        const handler = () => setIsScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const images = [
        ...(court.images ?? []),
        ...(court.venue?.images ?? []),
    ].filter(Boolean);
    const displayImages = images.length > 0 ? images : [FALLBACK_IMG];

    const navLinks = [
        { href: '/', label: 'Beranda' },
        { href: '/lapangan', label: 'Lapangan' },
    ];

    return (
        <div className="min-h-screen bg-white font-sans">
            <Head title={`${court.name} — Sewa Lapangan di Samarinda | Sofiah Sport Center`}>
                <meta name="description" content={`Sewa ${court.name} di Samarinda. Lapangan ${court.sport?.name ?? 'olahraga'} ${court.type === 'indoor' ? 'indoor' : 'outdoor'} berkualitas di Sofiah Sport Center, Kec. Loa Janan Ilir, Samarinda. Pesan sekarang!`} />
                <meta name="keywords" content={`${court.name}, lapangan ${court.sport?.name ?? 'olahraga'} Samarinda, sewa lapangan Samarinda, ${court.sport?.name ?? 'olahraga'} Samarinda, Sofiah Sport Center`} />
            </Head>

            {/* ── Floating Pill Navbar ── */}
            <nav className={cn('fixed inset-x-0 top-0 z-50 px-5 transition-all duration-500 lg:px-8', isScrolled ? 'pt-3' : 'pt-4')}>
                <div className={cn('mx-auto flex max-w-screen-2xl items-center justify-between gap-3 transition-all duration-500', isScrolled ? 'rounded-full border border-slate-200/60 bg-white/80 px-4 py-2.5 shadow-lg shadow-slate-900/[0.04] backdrop-blur-xl sm:px-6' : 'rounded-full border border-slate-200/40 bg-white/60 px-4 py-2.5 backdrop-blur-md sm:px-6')}>
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                        <span className="font-display text-lg font-bold tracking-tight text-slate-900">Sofiah Sport Center</span>
                    </Link>

                    <div className={cn('hidden items-center gap-1 rounded-full p-1.5 sm:flex', isScrolled ? 'bg-slate-100/80' : 'bg-slate-100/60')}>
                        {navLinks.map(item => (
                            <Link key={item.href} href={item.href} className={cn('rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200', item.href === '/lapangan' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900')}>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 sm:hidden">
                        {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="h-6 w-px bg-slate-200" />
                        {auth?.user ? (
                            <Link href={dashboard()} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600">Dashboard</Link>
                        ) : (
                            <>
                                <Link href={login()} className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:block">Masuk</Link>
                                {canRegister && <Link href={register()} className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600 sm:text-sm">Daftar</Link>}
                            </>
                        )}
                    </div>
                </div>

                <div className={cn('mx-auto mt-2 max-w-screen-2xl overflow-hidden rounded-3xl transition-all duration-300 sm:hidden', mobileNavOpen ? 'max-h-64 border border-slate-200/60 bg-white/95 opacity-100 shadow-lg backdrop-blur-xl' : 'max-h-0 opacity-0')}>
                    <div className="flex flex-col gap-0.5 p-2.5">
                        {navLinks.map(item => (
                            <Link key={item.href} href={item.href} onClick={() => setMobileNavOpen(false)} className={cn('rounded-2xl px-5 py-3 text-sm font-semibold transition-colors', item.href === '/lapangan' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* ── Gallery grid ── */}
            <div className="mx-auto max-w-screen-2xl pt-20 lg:pt-24">
                {/* Breadcrumb */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
                    <Link href="/lapangan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-700">
                        <ArrowLeft className="h-3.5 w-3.5" /> Semua Lapangan
                    </Link>
                </div>

                {/* Gallery — 1 main + 2 sub */}
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex h-[280px] gap-2 sm:h-[400px] lg:h-[520px]">
                        {/* Main image */}
                        <div className="relative w-full shrink-0 overflow-hidden rounded-xl sm:w-[65%] sm:rounded-2xl">
                            <img
                                src={displayImages[0] ? (displayImages[0].startsWith('http') ? displayImages[0] : `/storage/${displayImages[0]}`) : FALLBACK_IMG}
                                alt={court.name}
                                onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        {/* 2 sub images stacked — hidden on mobile */}
                        <div className="hidden flex-1 flex-col gap-2 sm:flex">
                            <div className="relative flex-1 overflow-hidden rounded-2xl">
                                <img
                                    src={displayImages[1] ? (displayImages[1].startsWith('http') ? displayImages[1] : `/storage/${displayImages[1]}`) : FALLBACK_IMG}
                                    alt=""
                                    onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="relative flex-1 overflow-hidden rounded-2xl">
                                <img
                                    src={displayImages[2] ? (displayImages[2].startsWith('http') ? displayImages[2] : `/storage/${displayImages[2]}`) : FALLBACK_IMG}
                                    alt=""
                                    onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                                    className="h-full w-full object-cover"
                                />
                                {displayImages.length > 3 && (
                                    <div className="absolute inset-0 flex items-end justify-end bg-slate-900/20 p-3">
                                        <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-900 shadow-sm">
                                            Lihat semua foto
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Title below gallery ── */}
            <div className="mx-auto max-w-screen-2xl px-4 pt-5 pb-2 sm:px-6 sm:pt-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase', court.type === 'indoor' ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white')}>
                        {court.type}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">{court.sport?.name}</span>
                </div>
                <h1 className="mt-2 font-display text-xl font-black leading-tight text-slate-900 sm:text-2xl lg:text-4xl">{court.name}</h1>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {court.venue?.name}{court.venue?.city ? `, ${court.venue.city}` : ''}
                </p>
            </div>

            {/* ── Main content ── */}
            <div className="mx-auto max-w-screen-2xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-8 lg:px-8 lg:py-12">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-16">

                    {/* ── Left — details ── */}
                    <div className="lg:col-span-2">

                        {/* About */}
                        {court.venue?.description && (
                            <div className="mb-10 border-b border-slate-100 pb-10">
                                <p className="mb-3 text-[10px] font-black tracking-[0.35em] text-slate-400 uppercase">Tentang Venue</p>
                                <p className="text-[15px] leading-relaxed text-slate-600">{court.venue.description}</p>
                            </div>
                        )}

                        {/* Facilities */}
                        {(court.venue?.facilities ?? []).length > 0 && (
                            <div className="mb-10 border-b border-slate-100 pb-10">
                                <p className="mb-4 text-[10px] font-black tracking-[0.35em] text-slate-400 uppercase">Fasilitas</p>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-4 sm:grid-cols-3">
                                    {court.venue.facilities!.map(f => (
                                        <div key={f.id} className="flex items-center gap-3">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                            <span className="text-sm text-slate-700">{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Booking — date + time picker */}
                        <div className="mb-10 border-b border-slate-100 pb-10">
                            <p className="mb-5 text-[10px] font-black tracking-[0.35em] text-slate-400 uppercase">Pilih Jadwal</p>

                            {/* Date ribbon */}
                            <div className="mb-5 flex items-center gap-1.5 sm:gap-2">
                                <button
                                    onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
                                    disabled={weekStart <= today}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all hover:border-slate-300 hover:text-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9 sm:rounded-xl"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                                <div className="grid flex-1 grid-cols-7 gap-0.5 sm:gap-1">
                                    {visibleDates.map((d, idx) => {
                                        const isSel = d.toDateString() === selectedDate.toDateString();
                                        const isToday = d.toDateString() === today.toDateString();
                                        const isPast = d < today;
                                        return (
                                            <button
                                                key={idx}
                                                disabled={isPast}
                                                onClick={() => { setSelectedDate(d); setTimeStart(null); setTimeEnd(null); }}
                                                className={cn(
                                                    'flex flex-col items-center rounded-lg border py-1.5 text-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 sm:rounded-xl sm:py-2.5',
                                                    isSel
                                                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
                                                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-900',
                                                )}
                                            >
                                                <span className={cn('text-[7px] font-bold tracking-wide uppercase sm:text-[9px] sm:tracking-wider', isSel ? 'text-white/80' : 'text-slate-400')}>
                                                    {isToday ? 'Hari\nIni' : format(d, 'EEE', { locale: idLocale })}
                                                </span>
                                                <span className="mt-0.5 font-display text-sm font-black leading-none sm:text-base">{d.getDate()}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all hover:border-slate-300 hover:text-slate-900 active:scale-95 sm:h-9 sm:w-9 sm:rounded-xl"
                                >
                                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                            </div>

                            {/* Time slot label */}
                            <div className="mb-3 flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                    Pilih Jam — {format(selectedDate, 'EEE, dd MMM yyyy', { locale: idLocale })}
                                </span>
                            </div>

                            {/* Time slot grid */}
                            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
                                {TIME_SLOTS.map((t) => {
                                    const sel = isSlotSelected(t);
                                    const inRange = isSlotInRange(t);
                                    return (
                                        <button
                                            key={t}
                                            onClick={() => handleSlotClick(t)}
                                            onMouseEnter={() => setHovered(t)}
                                            onMouseLeave={() => setHovered(null)}
                                            className={cn(
                                                'relative rounded-lg border py-2 text-[10px] font-bold transition-all duration-150 outline-none',
                                                sel
                                                    ? 'z-10 scale-105 border-emerald-500 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                                    : inRange
                                                        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-600'
                                                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-emerald-500/40 hover:bg-slate-100 hover:text-slate-900',
                                            )}
                                        >
                                            {t.slice(0, 5)}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mt-3 flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-sm border border-emerald-500 bg-emerald-500" />
                                    <span className="text-[10px] text-slate-400">Dipilih</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-sm border border-slate-200 bg-slate-50" />
                                    <span className="text-[10px] text-slate-400">Tersedia</span>
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* ── Right — booking summary (desktop only) ── */}
                    <div className="hidden lg:col-span-1 lg:block">
                        <div className="sticky top-24 flex flex-col gap-5">
                            {/* Price header */}
                            <div>
                                <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Harga Mulai</p>
                                <p className="mt-1 font-display text-3xl font-black text-slate-900">
                                    {fmt(court.price_per_hour)}
                                    <span className="ml-2 text-sm font-medium text-slate-400">/jam</span>
                                </p>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Booking summary */}
                            {timeStart ? (
                                <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Ringkasan</p>
                                    <div className="flex flex-col gap-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Tanggal</span>
                                            <span className="font-semibold text-slate-900">{format(selectedDate, 'dd MMM yyyy', { locale: idLocale })}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Jam</span>
                                            <span className="font-mono font-semibold text-slate-900">{timeStart} – {bookingEndTime}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Durasi</span>
                                            <span className="font-semibold text-slate-900">{bookingHours} jam</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-200 pt-3">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total</span>
                                            <span className="font-display text-xl font-black text-emerald-500">{fmt(bookingTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                                    <Clock className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                                    <p className="text-xs font-medium text-slate-400">Pilih tanggal & jam<br />untuk melihat total harga</p>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="flex flex-col gap-2">
                                <button
                                    disabled={!timeStart}
                                    onClick={() => {
                                        if (!auth?.user) { window.location.href = '/login'; return; }
                                        setCheckoutOpen(true);
                                    }}
                                    className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {timeStart ? 'Booking Sekarang' : 'Pilih Jam Dulu'}
                                </button>
                                <Link
                                    href="/lapangan"
                                    className="flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-700"
                                >
                                    Lihat Lapangan Lain
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Related courts ── */}
            {relatedCourts.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-12 lg:px-8 lg:py-16">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="mb-8 flex items-end justify-between">
                            <div>
                                <p className="mb-1 text-[10px] font-black tracking-[0.4em] text-emerald-500 uppercase">Lapangan Serupa</p>
                                <h2 className="font-display text-2xl font-black text-slate-900 lg:text-3xl">MUNGKIN ANDA SUKA</h2>
                            </div>
                            <Link href="/lapangan" className="hidden items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-emerald-600 sm:flex">
                                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedCourts.map(c => <RelatedCard key={c.id} court={c} />)}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 bg-white px-6 py-16 lg:px-8">
                <div className="mx-auto max-w-screen-2xl">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-16">
                        <div className="flex flex-col items-start">
                            <span className="mb-4 font-display text-2xl font-black tracking-tight text-slate-900">Sofiah Sport Center</span>
                            <p className="mb-6 text-sm leading-relaxed text-slate-500">Menyediakan fasilitas olahraga premium dengan lapangan berkualitas tinggi dan sistem pemesanan yang mudah.</p>
                            <div className="flex items-center gap-3">
                                <a href="https://www.instagram.com/sofiahsportcentre/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-500">
                                    <Instagram className="h-5 w-5" />
                                </a>
                                <a href="mailto:info@sofiahsport.id" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-500">
                                    <Mail className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                        <div className="flex flex-col items-start">
                            <h3 className="mb-4 font-display text-base font-bold text-slate-900">Lokasi Kami</h3>
                            <div className="mb-4 flex items-start gap-3 text-sm text-slate-500">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                <p>Jl. Moeis Hasan, Simpang Tiga,<br />Kec. Loa Janan Ilir, Kota Samarinda,<br />Kalimantan Timur</p>
                            </div>
                            <a href="tel:+62082155670524" className="flex items-center gap-3 text-sm text-slate-500 transition-colors hover:text-emerald-600">
                                <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
                                0821-5567-0524
                            </a>
                        </div>
                        <div className="flex flex-col items-start">
                            <h3 className="mb-4 font-display text-base font-bold text-slate-900">Akses Cepat</h3>
                            <div className="flex flex-col gap-3">
                                <Link href="/" className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-500">Beranda</Link>
                                <Link href="/lapangan" className="text-sm font-medium text-emerald-600">Semua Lapangan</Link>
                                <Link href="/booking" className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-500">Booking Lapangan</Link>
                                {!auth?.user && (
                                    <>
                                        <Link href={login()} className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-500">Masuk</Link>
                                        {canRegister && <Link href={register()} className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-500">Daftar Akun</Link>}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
                        <p className="text-sm font-medium text-slate-400">&copy; {new Date().getFullYear()} Sofiah Sport Center. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* ── Mobile sticky bottom bar ── */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
                <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        {timeStart ? (
                            <>
                                <p className="font-mono text-sm font-bold text-slate-900">{timeStart} → {bookingEndTime} <span className="text-xs font-normal text-slate-400">({bookingHours} jam)</span></p>
                                <p className="font-display text-base font-black text-emerald-500">{fmt(bookingTotal)}</p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400">Pilih jam untuk booking</p>
                        )}
                    </div>
                    <button
                        disabled={!timeStart}
                        onClick={() => {
                            if (!auth?.user) { window.location.href = '/login'; return; }
                            setCheckoutOpen(true);
                        }}
                        className="shrink-0 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {timeStart ? 'Booking' : 'Pilih Jam'}
                    </button>
                </div>
            </div>

            {/* ── Checkout Modal ── */}
            {checkoutOpen && auth?.user && timeStart && (
                <CheckoutModal
                    item={{
                        courtId: court.id,
                        courtName: court.name,
                        date: selectedDate,
                        startTime: timeStart,
                        endTime: bookingEndTime,
                        hours: bookingHours,
                        totalPrice: bookingTotal,
                    }}
                    user={auth.user}
                    onClose={() => setCheckoutOpen(false)}
                    onSuccess={() => { setTimeStart(null); setTimeEnd(null); }}
                />
            )}
        </div>
    );
}
