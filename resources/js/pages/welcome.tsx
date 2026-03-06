import { Head, usePage, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Plus,
    ShoppingCart,
    Trash2,
    Trophy,
    X,
    CheckCircle2,
    AlertCircle,
    Activity,
    Zap,
    Instagram,
    Facebook,
    Phone,
    Mail,
    Sparkles,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

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

interface WelcomeProps {
    canRegister?: boolean;
    courts: Court[];
    sports: Sport[];
    venues: Venue[];
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

function calcPrice(
    court: Court,
    startTime: string,
    endTime: string,
    date: Date,
): number {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const dayOfWeek = date.getDay();
    let total = 0;
    for (let h = startHour; h < endHour; h++) {
        const slot = `${h.toString().padStart(2, '0')}:00`;
        let price = court.price_per_hour;
        if (court.pricing_rules) {
            for (const rule of court.pricing_rules) {
                if (
                    rule.days.includes(dayOfWeek) &&
                    slot >= rule.start_time &&
                    slot < rule.end_time
                ) {
                    price = Number(rule.price);
                    break;
                }
            }
        }
        total += price;
    }
    return total;
}

const TIME_SLOTS = Array.from(
    { length: 16 },
    (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`,
);

/* ─────────────────────────── Time Slot Picker ─────────────────────────── */
function TimeSlotPicker({
    court,
    date,
    onAdd,
}: {
    court: Court;
    date: Date;
    onAdd: (item: CartItem) => void;
}) {
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
            if (bookedSlots.includes(`${h.toString().padStart(2, '0')}:00`))
                return false;
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
        if (!start || (start && end)) {
            setStart(t);
            setEnd(null);
            return;
        }
        if (t < start) {
            setStart(t);
            return;
        }
        if (t === start) {
            setStart(null);
            return;
        }
        const sh = parseInt(start.split(':')[0]);
        const th = parseInt(t.split(':')[0]);
        let conflict = false;
        for (let h = sh + 1; h <= th; h++) {
            if (bookedSlots.includes(`${h.toString().padStart(2, '0')}:00`)) {
                conflict = true;
                break;
            }
        }
        if (conflict) {
            setStart(t);
            setEnd(null);
        } else {
            setEnd(t);
        }
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
        onAdd({
            court,
            date,
            startTime: start,
            endTime,
            hours,
            totalPrice: total,
        });
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
                                      ? 'z-10 scale-105 border-pink-500 bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                                      : inRange
                                        ? 'border-pink-500/40 bg-pink-500/20 text-pink-500'
                                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-pink-500/40 hover:bg-slate-200 hover:text-slate-900',
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
                        <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            Pilihan
                        </p>
                        <p className="font-mono font-bold text-slate-900">
                            {start} → {endTime}
                            <span className="ml-2 text-xs text-slate-400">
                                ({hours} jam)
                            </span>
                        </p>
                        <p className="mt-0.5 font-mono text-lg font-bold text-pink-500">
                            {fmt(total)}
                        </p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(236,72,153,0.3)] transition-all hover:bg-pink-600 active:scale-95"
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
function CourtCard({
    court,
    date,
    onAdd,
}: {
    court: Court;
    date: Date;
    onAdd: (item: CartItem) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const imgs = court.images?.length
        ? court.images
        : court.venue?.images?.length
          ? court.venue.images
          : null;
    const imgSrc = imgs
        ? getImageUrl(imgs[0])
        : 'https://images.unsplash.com/photo-1646649853703-7645147474ba?w=800&q=80';

    return (
        <div
            className={cn(
                'overflow-hidden rounded-2xl border transition-all duration-300',
                expanded
                    ? 'border-pink-500/50 bg-white'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100',
            )}
        >
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img
                        src={imgSrc}
                        alt={court.name}
                        className="h-full w-full object-cover"
                    />
                    <div
                        className={cn(
                            'absolute top-1 right-1 h-2 w-2 rounded-full',
                            court.is_booked_now ? 'bg-red-500' : 'bg-pink-500',
                        )}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                        <h3 className="truncate font-heading font-bold text-slate-900">
                            {court.name}
                        </h3>
                        <span className="hidden rounded-full border border-slate-200 px-2 py-0.5 text-[9px] font-black tracking-widest text-slate-500 uppercase sm:inline">
                            {court.type}
                        </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">
                        {court.venue?.name} · {court.sport?.name}
                    </p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-bold text-pink-500">
                        {fmt(court.price_per_hour)}
                    </p>
                    <p className="text-[10px] text-slate-400">/jam</p>
                </div>
                <ChevronRight
                    className={cn(
                        'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300',
                        expanded && 'rotate-90 text-pink-500',
                    )}
                />
            </button>

            {/* Expanded Slots */}
            <div
                className={cn(
                    'grid transition-all duration-300',
                    expanded
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0',
                )}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-slate-200 px-5 pt-4 pb-5">
                        <div className="mb-3 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-pink-500" />
                            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Pilih Jam —{' '}
                                {format(date, 'EEE, dd MMM', {
                                    locale: idLocale,
                                })}
                            </span>
                        </div>
                        <TimeSlotPicker
                            court={court}
                            date={date}
                            onAdd={(item) => {
                                onAdd(item);
                                setExpanded(false);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────── Cart Panel ─────────────────────────── */
function CartPanel({
    items,
    onRemove,
    onCheckout,
}: {
    items: CartItem[];
    onRemove: (i: number) => void;
    onCheckout: () => void;
}) {
    const total = items.reduce((s, i) => s + i.totalPrice, 0);

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                    <ShoppingCart className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">
                    Keranjang kosong
                </p>
                <p className="mt-1 text-xs text-slate-700">
                    Pilih lapangan & jam di atas
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {items.map((item, i) => (
                <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                            {item.court.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            {item.court.venue?.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                                {format(item.date, 'dd MMM')}
                            </span>
                            <span className="rounded bg-pink-500/15 px-2 py-0.5 font-mono text-[11px] text-pink-500">
                                {item.startTime} – {item.endTime}
                            </span>
                            <span className="text-[11px] text-slate-400">
                                {item.hours} jam
                            </span>
                        </div>
                        <p className="mt-2 font-mono text-sm font-bold text-pink-500">
                            {fmt(item.totalPrice)}
                        </p>
                    </div>
                    <button
                        onClick={() => onRemove(i)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-950/40 hover:text-red-600"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}

            <div className="mt-1 border-t border-slate-200 pt-3">
                <div className="mb-4 flex items-baseline justify-between">
                    <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                        Total
                    </span>
                    <span className="font-mono text-xl font-black text-slate-900">
                        {fmt(total)}
                    </span>
                </div>
                <button
                    onClick={onCheckout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 py-3 font-bold text-white shadow-[0_4px_24px_rgba(236,72,153,0.3)] transition-all hover:bg-pink-600 hover:shadow-[0_4px_32px_rgba(236,72,153,0.5)] active:scale-[0.98]"
                >
                    Pesan Sekarang
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────── Checkout Modal ─────────────────────────── */
// Steps: 'form' → 'qris' → 'upload' → 'done'
type CheckoutStep = 'form' | 'qris' | 'upload' | 'done';

function CheckoutModal({
    items,
    onClose,
    onSuccess,
}: {
    items: CartItem[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [step, setStep] = useState<CheckoutStep>('form');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    // IDs of created bookings (for proof upload)
    const [bookingIds, setBookingIds] = useState<number[]>([]);
    // Proof file per booking
    const [proofFiles, setProofFiles] = useState<Record<number, File>>({});
    const [uploadingProof, setUploadingProof] = useState(false);
    const total = items.reduce((s, i) => s + i.totalPrice, 0);

    // Step 1: Submit booking data → receive booking IDs → go to QRIS
    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const ids: number[] = [];
        try {
            for (const item of items) {
                const res = await axios.post('/bookings/guest', {
                    guest_name: name,
                    guest_email: email,
                    guest_phone: phone,
                    court_id: item.court.id,
                    date: format(item.date, 'yyyy-MM-dd'),
                    start_time: item.startTime,
                    end_time: item.endTime,
                    total_price: item.totalPrice,
                    payment_status: 'unpaid',
                });
                ids.push(res.data.booking.id);
            }
            setBookingIds(ids);
            setStep('qris');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(
                e.response?.data?.message ?? 'Terjadi kesalahan. Coba lagi.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Step 3: Upload proof for each booking
    const handleUploadProof = async () => {
        if (bookingIds.some((id) => !proofFiles[id])) {
            setError('Harap upload bukti bayar untuk semua pesanan.');
            return;
        }
        setUploadingProof(true);
        setError('');
        try {
            for (const id of bookingIds) {
                const formData = new FormData();
                formData.append('proof', proofFiles[id]);
                await axios.post(`/bookings/${id}/upload-proof`, formData);
            }
            setStep('done');
        } catch (err: unknown) {
            const e = err as {
                response?: { data?: { message?: string; errors?: unknown } };
            };
            console.error('Upload error:', e.response?.data);
            setError(
                e.response?.data?.message ??
                    JSON.stringify(e.response?.data?.errors) ??
                    'Upload gagal. Coba lagi.',
            );
        } finally {
            setUploadingProof(false);
        }
    };

    const QRIS_IMAGE = '/images/qris.png'; // letakkan file QRIS di public/images/qris.png

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                {/* ── Step: Done ── */}
                {step === 'done' && (
                    <div className="flex flex-col items-center p-10 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-pink-500/30 bg-pink-500/10">
                            <CheckCircle2 className="h-9 w-9 text-pink-500" />
                        </div>
                        <h2 className="mb-2 font-heading text-2xl font-black text-slate-900">
                            Bukti Terkirim!
                        </h2>
                        <p className="mb-1 text-sm text-slate-400">
                            Pembayaran akan diverifikasi admin dalam{' '}
                            <span className="font-semibold text-slate-900">
                                1×24 jam
                            </span>
                            .
                        </p>
                        <p className="mb-2 text-xs text-slate-500">
                            Notifikasi konfirmasi akan dikirim via WhatsApp ke{' '}
                            <span className="font-medium text-slate-900">
                                {phone}
                            </span>
                        </p>
                        <div className="my-4 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs text-amber-700">
                            ⏳ Status booking:{' '}
                            <span className="font-bold">
                                Menunggu Konfirmasi
                            </span>
                            <br />
                            Setelah admin memverifikasi pembayaran, booking Anda
                            akan aktif.
                        </div>
                        <button
                            onClick={() => {
                                onSuccess();
                                onClose();
                            }}
                            className="rounded-xl bg-pink-500 px-8 py-3 font-bold text-white transition-all hover:bg-pink-600"
                        >
                            Selesai
                        </button>
                    </div>
                )}

                {/* ── Step: QRIS ── */}
                {step === 'qris' && (
                    <>
                        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
                            <div>
                                <h2 className="font-heading text-xl font-black text-slate-900">
                                    Scan & Bayar
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Scan QRIS lalu upload bukti bayar
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-5 px-7 py-6">
                            {/* QRIS Image */}
                            <div className="rounded-2xl bg-white p-4 shadow-[0_0_40px_rgba(236,72,153,0.15)]">
                                <img
                                    src={QRIS_IMAGE}
                                    alt="QRIS Payment"
                                    className="h-56 w-56 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            'https://api.qrserver.com/v1/create-qr-code/?size=224x224&data=RESERVE-BOOKING-QRIS-PLACEHOLDER';
                                    }}
                                />
                            </div>

                            {/* Amount */}
                            <div className="text-center">
                                <p className="mb-1 text-xs font-bold tracking-widest text-slate-500 uppercase">
                                    Nominal Transfer
                                </p>
                                <p className="font-mono text-3xl font-black text-slate-900">
                                    {fmt(total)}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Transfer tepat sesuai nominal di atas
                                </p>
                            </div>

                            {/* Instructions */}
                            <div className="w-full space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                {[
                                    'Buka aplikasi m-banking / e-wallet Anda',
                                    'Pilih menu Scan QR / QRIS',
                                    `Transfer tepat ${fmt(total)}`,
                                    'Simpan bukti transfer / screenshot',
                                    'Klik tombol di bawah untuk upload bukti',
                                ].map((text, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 text-sm"
                                    >
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-[10px] font-black text-pink-500">
                                            {i + 1}
                                        </span>
                                        <span className="text-slate-400">
                                            {text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep('upload')}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 py-3.5 font-bold text-white shadow-[0_4px_24px_rgba(236,72,153,0.3)] transition-all hover:bg-pink-600"
                            >
                                <ArrowRight className="h-4 w-4" />
                                Sudah Bayar – Upload Bukti
                            </button>
                        </div>
                    </>
                )}

                {/* ── Step: Upload Proof ── */}
                {step === 'upload' && (
                    <>
                        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
                            <div>
                                <h2 className="font-heading text-xl font-black text-slate-900">
                                    Upload Bukti Bayar
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {bookingIds.length} pesanan · {fmt(total)}
                                </p>
                            </div>
                            <button
                                onClick={() => setStep('qris')}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4 px-7 py-6">
                            <p className="text-xs text-slate-500">
                                Upload screenshot / foto bukti transfer untuk
                                setiap pesanan.
                            </p>

                            {bookingIds.length === 1 ? (
                                /* Single booking — one upload area */
                                <UploadArea
                                    label={`Pesanan #${bookingIds[0]}`}
                                    file={proofFiles[bookingIds[0]]}
                                    onChange={(file) =>
                                        setProofFiles((prev) => ({
                                            ...prev,
                                            [bookingIds[0]]: file,
                                        }))
                                    }
                                />
                            ) : (
                                /* Multiple bookings */
                                <div className="space-y-3">
                                    {bookingIds.map((id, idx) => (
                                        <UploadArea
                                            key={id}
                                            label={`Pesanan ${idx + 1} — ${items[idx]?.court.name ?? `#${id}`}`}
                                            file={proofFiles[id]}
                                            onChange={(file) =>
                                                setProofFiles((prev) => ({
                                                    ...prev,
                                                    [id]: file,
                                                }))
                                            }
                                        />
                                    ))}
                                </div>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleUploadProof}
                                disabled={
                                    uploadingProof ||
                                    bookingIds.some((id) => !proofFiles[id])
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 py-3.5 font-bold text-white shadow-[0_4px_24px_rgba(236,72,153,0.3)] transition-all hover:bg-pink-600 disabled:opacity-40"
                            >
                                {uploadingProof ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />{' '}
                                        Mengupload...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />{' '}
                                        Kirim Bukti Pembayaran
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-slate-700">
                                Booking aktif setelah admin memverifikasi · Max
                                1×24 jam
                            </p>
                        </div>
                    </>
                )}

                {/* ── Step: Form ── */}
                {step === 'form' && (
                    <>
                        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
                            <div>
                                <h2 className="font-heading text-xl font-black text-slate-900">
                                    Lengkapi Pesanan
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {items.length} lapangan · {fmt(total)}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="max-h-40 space-y-2 overflow-y-auto border-b border-slate-200 px-7 py-4">
                            {items.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <div>
                                        <span className="font-medium text-slate-900">
                                            {item.court.name}
                                        </span>
                                        <span className="mx-2 text-slate-500">
                                            ·
                                        </span>
                                        <span className="font-mono text-xs text-slate-500">
                                            {format(item.date, 'dd MMM')}{' '}
                                            {item.startTime}–{item.endTime}
                                        </span>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-pink-500">
                                        {fmt(item.totalPrice)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <form
                            onSubmit={handleSubmitForm}
                            className="space-y-4 px-7 py-6"
                        >
                            <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                Data Pemesan
                            </p>

                            {[
                                {
                                    id: 'name',
                                    label: 'Nama Lengkap',
                                    type: 'text',
                                    value: name,
                                    set: setName,
                                },
                                {
                                    id: 'email',
                                    label: 'Alamat Email',
                                    type: 'email',
                                    value: email,
                                    set: setEmail,
                                },
                                {
                                    id: 'phone',
                                    label: 'Nomor WhatsApp',
                                    type: 'tel',
                                    value: phone,
                                    set: setPhone,
                                },
                            ].map(({ id, label, type, value, set }) => (
                                <div key={id} className="group relative">
                                    <input
                                        id={id}
                                        type={type}
                                        required
                                        value={value}
                                        onChange={(e) => set(e.target.value)}
                                        placeholder=" "
                                        className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-pink-500 focus:ring-0 focus:outline-none"
                                    />
                                    <label
                                        htmlFor={id}
                                        className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-pink-500 peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                    >
                                        {label}
                                    </label>
                                </div>
                            ))}

                            {error && (
                                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 py-3.5 font-bold text-white shadow-[0_4px_24px_rgba(236,72,153,0.3)] transition-all hover:bg-pink-600 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />{' '}
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            Lanjut ke Pembayaran · {fmt(total)}{' '}
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                                <p className="mt-3 text-center text-xs text-slate-700">
                                    Pembayaran via QRIS · Verifikasi manual oleh
                                    admin
                                </p>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────── Upload Area ─────────────────────────── */
function UploadArea({
    label,
    file,
    onChange,
}: {
    label: string;
    file?: File;
    onChange: (f: File) => void;
}) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped && dropped.type.startsWith('image/')) {
            onChange(dropped);
        }
    };

    return (
        <div className="space-y-1.5">
            <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {label}
            </p>
            <label
                className={cn(
                    'flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all',
                    isDragging
                        ? 'scale-[1.01] border-pink-500 bg-pink-500/10'
                        : file
                          ? 'border-pink-500/50 bg-pink-500/5'
                          : 'border-slate-200 bg-slate-100/50 hover:border-slate-300 hover:bg-slate-100',
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                        e.target.files?.[0] && onChange(e.target.files[0])
                    }
                />
                {isDragging ? (
                    <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/30 bg-pink-500/10">
                            <Plus className="h-5 w-5 text-pink-500" />
                        </div>
                        <p className="text-xs font-medium text-pink-500">
                            Lepas untuk upload
                        </p>
                    </>
                ) : file ? (
                    <>
                        <CheckCircle2 className="h-6 w-6 text-pink-500" />
                        <p className="max-w-[200px] truncate text-xs font-medium text-pink-500">
                            {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                            Klik atau drag untuk ganti
                        </p>
                    </>
                ) : (
                    <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                            <Plus className="h-5 w-5 text-slate-500" />
                        </div>
                        <p className="text-xs text-slate-500">
                            Klik atau drag foto bukti bayar
                        </p>
                        <p className="text-[10px] text-slate-700">
                            JPG, PNG, WEBP · Maks 10MB
                        </p>
                    </>
                )}
            </label>
        </div>
    );
}

/* ─────────────────────────── Main Page ─────────────────────────── */
export default function Welcome({
    canRegister = true,
    courts = [],
    sports = [],
    venues = [],
    filters,
}: WelcomeProps & { filters?: { date?: string } }) {
    const { auth } = usePage().props as {
        auth: { user?: { name: string } } | null;
    };
    const [selectedDate, setSelectedDate] = useState(() => {
        if (filters?.date) {
            // Split YYYY-MM-DD and create date in local timezone to avoid UTC shift
            const [y, m, d] = filters.date.split('-');
            if (y && m && d)
                return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        }
        return new Date();
    });
    const [startDate, setStartDate] = useState(selectedDate);
    const [selectedSport, setSelectedSport] = useState<number | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Refetch data when selected date changes
    useEffect(() => {
        // Debounce to avoid rapid refetches while paginating
        const t = setTimeout(() => {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            if (filters?.date !== formattedDate) {
                router.get(
                    '/',
                    { date: formattedDate },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        only: ['courts', 'filters'],
                        replace: true,
                    },
                );
            }
        }, 150);

        return () => clearTimeout(t);
    }, [selectedDate, filters?.date]);

    const visibleDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d;
    });

    const filteredCourts = useMemo(
        () =>
            courts.filter(
                (c) => selectedSport === null || c.sport?.id === selectedSport,
            ),
        [courts, selectedSport],
    );

    const addToCart = (item: CartItem) => {
        setCartItems((prev) => [...prev, item]);
        setCartOpen(true);
    };

    const removeFromCart = (idx: number) => {
        setCartItems((prev) => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-white selection:bg-pink-500 selection:text-white">
            <Head title="Reservasi Lapangan Premium" />

            {/* ── Navbar ── */}
            <nav
                className={cn(
                    'fixed inset-x-0 top-0 z-40 transition-all duration-300',
                    isScrolled
                        ? 'border-b border-slate-200 bg-white'
                        : 'bg-transparent',
                )}
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden sm:h-10 sm:w-10">
                            <img
                                src="/images/logo-removebg-preview.png"
                                alt="Aubry Padel Logo"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <span
                            className={cn(
                                'font-heading text-lg font-black tracking-tight transition-colors sm:text-2xl',
                                isScrolled ? 'text-slate-900' : 'text-white',
                            )}
                        >
                            Aubry Padel
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Cart toggle */}
                        <button
                            onClick={() => setCartOpen(!cartOpen)}
                            className={cn(
                                'relative flex items-center justify-center rounded-xl p-2 transition-colors',
                                cartItems.length > 0
                                    ? 'text-pink-500 hover:bg-white/10'
                                    : isScrolled
                                      ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                      : 'text-white/80 hover:bg-white/10 hover:text-white',
                            )}
                            aria-label="Keranjang"
                        >
                            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-pink-500 text-[9px] font-black text-white shadow-sm">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>

                        <div
                            className={cn(
                                'mx-1 h-6 w-px',
                                isScrolled ? 'bg-slate-200' : 'bg-white/20',
                            )}
                        />

                        {auth?.user ? (
                            <Link
                                href={dashboard()}
                                className={cn(
                                    'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                                    isScrolled
                                        ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                                        : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30',
                                )}
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className={cn(
                                        'hidden text-xs font-medium transition-colors sm:block sm:text-sm',
                                        isScrolled
                                            ? 'text-slate-500 hover:text-slate-900'
                                            : 'text-white/80 hover:text-white',
                                    )}
                                >
                                    Masuk
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className={cn(
                                            'rounded-lg px-3 py-1.5 text-xs font-bold transition-all sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm',
                                            isScrolled
                                                ? 'bg-pink-500 text-white hover:bg-pink-600'
                                                : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30',
                                        )}
                                    >
                                        Daftar
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative mb-8 flex min-h-[90vh] w-full items-center justify-center overflow-hidden px-5 py-32 lg:px-8">
                {/* Full-width Background Video */}
                <div className="absolute inset-0 z-0 bg-slate-900">
                    <video
                        src="/videos/Footage.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover opacity-90"
                    />
                    {/* Softer, more natural overlays - slightly darkened for text legibility */}
                    <div className="absolute inset-0 bg-slate-900/70" />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
                    <h1 className="mb-6 font-heading text-5xl leading-[1.1] font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                        Selamat Datang di
                        <br />
                        <span className="text-pink-400">Aubry Padel</span>
                    </h1>
                    <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-200">
                        Rasakan pengalaman bermain padel terbaik. Pesan lapangan
                        premium kami, tentukan jadwal ideal Anda, dan kuasai
                        pertandingan dengan mudah dan cepat.
                    </p>
                </div>
            </section>

            {/* ── Booking Section ── */}
            <section className="px-5 pb-24 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:gap-8">
                    {/* LEFT: Courts */}
                    <div className="min-w-0 flex-1">
                        {/* Date Ribbon */}
                        <div className="mb-5 flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const d = new Date(startDate);
                                    d.setDate(d.getDate() - 1);
                                    setStartDate(d);
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:border-slate-300 hover:text-slate-900 active:scale-95"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <div className="grid flex-1 grid-cols-7 gap-1.5">
                                {visibleDates.map((d, idx) => {
                                    const isSel =
                                        d.toDateString() ===
                                        selectedDate.toDateString();
                                    const isToday =
                                        d.toDateString() ===
                                        new Date().toDateString();
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedDate(d)}
                                            className={cn(
                                                'flex flex-col items-center rounded-xl border py-2.5 text-center transition-all duration-200',
                                                isSel
                                                    ? 'border-pink-500 bg-pink-500 text-white shadow-[0_4px_16px_rgba(236,72,153,0.3)]'
                                                    : 'border-slate-200 bg-slate-100/50 text-slate-500 hover:border-slate-300 hover:text-slate-900',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'text-[9px] font-bold tracking-wider uppercase',
                                                    isSel ? 'text-white' : '',
                                                )}
                                            >
                                                {isToday
                                                    ? 'Hari Ini'
                                                    : format(d, 'EEE', {
                                                          locale: idLocale,
                                                      })}
                                            </span>
                                            <span className="mt-0.5 font-heading text-lg leading-none font-black">
                                                {d.getDate()}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => {
                                    const d = new Date(startDate);
                                    d.setDate(d.getDate() + 1);
                                    setStartDate(d);
                                }}
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
                                        ? 'border-white bg-white text-black'
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
                                            ? 'border-pink-500 bg-pink-500 text-white shadow-[0_2px_12px_rgba(236,72,153,0.3)]'
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
                                <Activity className="mx-auto mb-3 h-10 w-10 text-slate-700" />
                                <p className="font-medium text-slate-500">
                                    Tidak ada lapangan tersedia
                                </p>
                                <p className="mt-1 text-sm text-slate-700">
                                    Coba pilih olahraga lain
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredCourts.map((court) => (
                                    <CourtCard
                                        key={court.id}
                                        court={court}
                                        date={selectedDate}
                                        onAdd={addToCart}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Cart Sidebar (desktop) */}
                    <div className="hidden w-80 shrink-0 lg:block">
                        <div className="sticky top-24 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-pink-500" />
                                <h3 className="font-heading text-sm font-bold text-slate-900">
                                    Keranjang Pesanan
                                </h3>
                                {cartItems.length > 0 && (
                                    <span className="ml-auto rounded-full bg-pink-500/10 px-2 py-0.5 text-xs font-black text-pink-500">
                                        {cartItems.length}
                                    </span>
                                )}
                            </div>
                            <CartPanel
                                items={cartItems}
                                onRemove={removeFromCart}
                                onCheckout={() => setCheckoutOpen(true)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Gallery Section (Animated Slider Arch) ── */}
            <section className="overflow-hidden bg-white py-24">
                <div className="relative mx-auto w-full max-w-[1600px]">
                    {/* Text Section (Moved Above Slider) */}
                    <div className="mb-16 flex flex-col items-center px-5 text-center">
                        <h2 className="font-heading text-3xl leading-tight font-black tracking-tight text-pink-500 md:text-4xl lg:text-4xl">
                            Dipercaya oleh atlet
                            <br className="md:hidden" /> dan komunitas
                        </h2>
                        <p className="mt-4 text-xl font-bold tracking-tight text-slate-400 md:text-2xl lg:text-3xl">
                            dari berbagai kalangan
                        </p>
                    </div>

                    {/* Infinite Scrolling Slider Wrapper */}
                    <div className="group flex w-full overflow-hidden">
                        {/* 
                          We duplicate the column set twice inside a continuous flex row. 
                          The wrapper has an infinite linear `animate-scroll` animation 
                          which creates the slider effect.
                        */}
                        <div className="flex w-max shrink-0 animate-[scroll_40s_linear_infinite] items-start gap-4 px-2 md:gap-6 lg:gap-8">
                            {/* --- FIRST SET --- */}

                            <div className="mt-32 w-36 shrink-0 animate-[bump_6s_ease-in-out_infinite_alternate] md:w-48 lg:w-56">
                                <img
                                    src="/images/Gallery/gallery-1.jpg"
                                    alt="Padel"
                                    className="h-72 w-full rounded-[24px] object-cover shadow-sm md:h-80 lg:h-[400px]"
                                />
                            </div>
                            <div className="mt-16 w-40 shrink-0 animate-[bump-reverse_5s_ease-in-out_infinite_alternate] md:w-52 lg:w-60">
                                <img
                                    src="/images/Gallery/gallery-2.jpg"
                                    alt="Padel"
                                    className="h-80 w-full rounded-[24px] object-cover shadow-sm md:h-96 lg:h-[450px]"
                                />
                            </div>
                            <div className="mt-24 w-44 shrink-0 animate-[bump_7s_ease-in-out_infinite_alternate] md:w-56 lg:w-64">
                                <img
                                    src="/images/Gallery/gallery-3.jpg"
                                    alt="Padel"
                                    className="h-96 w-full rounded-[32px] object-cover shadow-sm md:h-[450px] lg:h-[500px]"
                                />
                            </div>
                            <div className="mt-0 w-48 shrink-0 animate-[bump-reverse_6s_ease-in-out_infinite_alternate] md:w-64 lg:w-72">
                                <img
                                    src="/images/Gallery/gallery-4.jpg"
                                    alt="Padel"
                                    className="h-72 w-full rounded-[32px] object-cover shadow-sm md:h-[350px] lg:h-[400px]"
                                />
                            </div>
                            <div className="mt-8 w-44 shrink-0 animate-[bump_5s_ease-in-out_infinite_alternate] md:w-56 lg:w-64">
                                <img
                                    src="/images/Gallery/gallery-5.jpg"
                                    alt="Padel"
                                    className="h-64 w-full rounded-[32px] object-cover shadow-sm md:h-80 lg:h-[350px]"
                                />
                            </div>
                            <div className="mt-32 w-48 shrink-0 animate-[bump-reverse_7s_ease-in-out_infinite_alternate] md:w-64 lg:w-72">
                                <img
                                    src="/images/Gallery/gallery-6.jpg"
                                    alt="Padel"
                                    className="h-[400px] w-full rounded-[32px] object-cover shadow-sm md:h-[500px] lg:h-[550px]"
                                />
                            </div>
                            <div className="mt-16 w-40 shrink-0 animate-[bump_6s_ease-in-out_infinite_alternate] md:w-52 lg:w-60">
                                <img
                                    src="/images/Gallery/gallery-7.jpg"
                                    alt="Padel"
                                    className="h-80 w-full rounded-[24px] object-cover shadow-sm md:h-[400px] lg:h-[450px]"
                                />
                            </div>
                            <div className="mt-28 w-36 shrink-0 animate-[bump-reverse_5s_ease-in-out_infinite_alternate] md:w-48 lg:w-56">
                                <img
                                    src="/images/Gallery/gallery-1.jpg"
                                    alt="Padel"
                                    className="h-72 w-full rounded-[24px] object-cover shadow-sm md:h-80 lg:h-[400px]"
                                />
                            </div>

                            {/* --- SECOND SET (DUPLICATE FOR SCROLL LOOP) --- */}

                            <div className="mt-32 w-36 shrink-0 animate-[bump_6s_ease-in-out_infinite_alternate] md:w-48 lg:w-56">
                                <img
                                    src="/images/Gallery/gallery-1.jpg"
                                    alt="Padel"
                                    className="h-72 w-full rounded-[24px] object-cover shadow-sm md:h-80 lg:h-[400px]"
                                />
                            </div>
                            <div className="mt-16 w-40 shrink-0 animate-[bump-reverse_5s_ease-in-out_infinite_alternate] md:w-52 lg:w-60">
                                <img
                                    src="/images/Gallery/gallery-2.jpg"
                                    alt="Padel"
                                    className="h-80 w-full rounded-[24px] object-cover shadow-sm md:h-96 lg:h-[450px]"
                                />
                            </div>
                            <div className="mt-24 w-44 shrink-0 animate-[bump_7s_ease-in-out_infinite_alternate] md:w-56 lg:w-64">
                                <img
                                    src="/images/Gallery/gallery-3.jpg"
                                    alt="Padel"
                                    className="h-96 w-full rounded-[32px] object-cover shadow-sm md:h-[450px] lg:h-[500px]"
                                />
                            </div>
                            <div className="mt-0 w-48 shrink-0 animate-[bump-reverse_6s_ease-in-out_infinite_alternate] md:w-64 lg:w-72">
                                <img
                                    src="/images/Gallery/gallery-4.jpg"
                                    alt="Padel"
                                    className="h-72 w-full rounded-[32px] object-cover shadow-sm md:h-[350px] lg:h-[400px]"
                                />
                            </div>
                            <div className="mt-8 w-44 shrink-0 animate-[bump_5s_ease-in-out_infinite_alternate] md:w-56 lg:w-64">
                                <img
                                    src="/images/Gallery/gallery-5.jpg"
                                    alt="Padel"
                                    className="h-64 w-full rounded-[32px] object-cover shadow-sm md:h-80 lg:h-[350px]"
                                />
                            </div>
                            <div className="mt-32 w-48 shrink-0 animate-[bump-reverse_7s_ease-in-out_infinite_alternate] md:w-64 lg:w-72">
                                <img
                                    src="/images/Gallery/gallery-6.jpg"
                                    alt="Padel"
                                    className="h-[400px] w-full rounded-[32px] object-cover shadow-sm md:h-[500px] lg:h-[550px]"
                                />
                            </div>
                            <div className="mt-16 w-40 shrink-0 animate-[bump_6s_ease-in-out_infinite_alternate] md:w-52 lg:w-60">
                                <img
                                    src="/images/Gallery/gallery-7.jpg"
                                    alt="Padel"
                                    className="h-80 w-full rounded-[24px] object-cover shadow-sm md:h-[400px] lg:h-[450px]"
                                />
                            </div>
                            <div className="mt-28 w-36 shrink-0 animate-[bump-reverse_5s_ease-in-out_infinite_alternate] md:w-48 lg:w-56">
                                <img
                                    src="/images/Gallery/gallery-1.jpg"
                                    alt="Padel"
                                    className="h-72 w-full rounded-[24px] object-cover shadow-sm md:h-80 lg:h-[400px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Mobile Cart Drawer ── */}
            {cartOpen && (
                <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={() => setCartOpen(false)}
                    />
                    <div className="relative max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-6">
                        <div className="mb-5 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-pink-500" />
                            <h3 className="font-heading font-bold text-slate-900">
                                Keranjang
                            </h3>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <CartPanel
                            items={cartItems}
                            onRemove={removeFromCart}
                            onCheckout={() => {
                                setCartOpen(false);
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
                        className="flex items-center gap-3 rounded-2xl bg-pink-500 px-5 py-3.5 font-bold text-white shadow-[0_8px_32px_rgba(236,72,153,0.5)] transition-all hover:bg-pink-600 active:scale-95"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        <span>{cartItems.length} item</span>
                        <span className="font-mono">·</span>
                        <span className="font-mono">
                            {fmt(
                                cartItems.reduce((s, i) => s + i.totalPrice, 0),
                            )}
                        </span>
                    </button>
                </div>
            )}

            {/* ── Checkout Modal ── */}
            {checkoutOpen && (
                <CheckoutModal
                    items={cartItems}
                    onClose={() => setCheckoutOpen(false)}
                    onSuccess={() => setCartItems([])}
                />
            )}

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 bg-white px-5 py-16 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-16">
                        {/* Brand & Socials */}
                        <div className="flex flex-col items-start">
                            <span className="mb-4 font-heading text-2xl font-black tracking-tight text-slate-900">
                                Aubry Padel
                            </span>
                            <p className="mb-6 text-sm leading-relaxed text-slate-500">
                                Menyediakan fasilitas padel kelas dunia dengan
                                lapangan premium. Mainkan permainan terbaik Anda
                                bersama kami.
                            </p>
                            <div className="flex items-center gap-4">
                                <a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-pink-50 hover:text-pink-500"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>
                                <a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-pink-50 hover:text-pink-500"
                                >
                                    <Facebook className="h-5 w-5" />
                                </a>
                                <a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-pink-50 hover:text-pink-500"
                                >
                                    <Mail className="h-5 w-5" />
                                </a>
                            </div>
                        </div>

                        {/* Location & Map */}
                        <div className="flex flex-col items-start">
                            <h3 className="mb-4 font-heading text-base font-bold text-slate-900">
                                Lokasi Kami
                            </h3>
                            <div className="mb-4 flex items-start gap-3 text-sm text-slate-500">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                                <p>
                                    Jl. Padel Premium No. 123,
                                    <br />
                                    Jakarta Selatan, DKI Jakarta 12345
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <Phone className="h-4 w-4 shrink-0 text-pink-500" />
                                <p>+62 812-3456-7890</p>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="flex flex-col items-start">
                            <h3 className="mb-4 font-heading text-base font-bold text-slate-900">
                                Akses Cepat
                            </h3>
                            <div className="flex flex-col gap-3">
                                {!auth?.user && (
                                    <>
                                        <Link
                                            href={login()}
                                            className="text-sm font-medium text-slate-500 transition-colors hover:text-pink-500"
                                        >
                                            Masuk
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="text-sm font-medium text-slate-500 transition-colors hover:text-pink-500"
                                            >
                                                Daftar Akun
                                            </Link>
                                        )}
                                    </>
                                )}
                                <Link
                                    href="#"
                                    className="text-sm font-medium text-slate-500 transition-colors hover:text-pink-500"
                                >
                                    Syarat & Ketentuan
                                </Link>
                                <Link
                                    href="#"
                                    className="text-sm font-medium text-slate-500 transition-colors hover:text-pink-500"
                                >
                                    Kebijakan Privasi
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
                        <p className="text-sm font-medium text-slate-400">
                            &copy; {new Date().getFullYear()} Aubry Padel. All
                            rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
