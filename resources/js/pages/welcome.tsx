import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    ArrowRight, ChevronLeft, ChevronRight, Clock, MapPin,
    Plus, ShoppingCart, Trash2, Trophy, X, CheckCircle2,
    AlertCircle, Activity, Zap,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

/* ─────────────────────────── Types ─────────────────────────── */
interface Sport { id: number; name: string; }
interface Venue { id: number; name: string; images?: string[]; }
interface PricingRule { days: number[]; start_time: string; end_time: string; price: number; }
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
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

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
function TimeSlotPicker({
    court, date, onAdd,
}: { court: Court; date: Date; onAdd: (item: CartItem) => void; }) {
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
        setStart(null); setEnd(null);
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
                                'relative py-2 text-[10px] font-bold rounded-lg border transition-all duration-150 outline-none',
                                booked
                                    ? 'bg-red-950/30 border-red-900/30 text-red-700 cursor-not-allowed line-through'
                                    : sel
                                        ? 'bg-padel-green border-padel-green text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-105 z-10'
                                        : inRange
                                            ? 'bg-padel-green/20 border-padel-green/40 text-padel-green'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-padel-green/40 hover:text-white hover:bg-white/10'
                            )}
                        >
                            {t.slice(0, 5)}
                        </button>
                    );
                })}
            </div>

            {start && (
                <div className="flex items-center justify-between pt-3 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Pilihan</p>
                        <p className="font-mono text-white font-bold">
                            {start} → {endTime}
                            <span className="ml-2 text-slate-400 text-xs">({hours} jam)</span>
                        </p>
                        <p className="text-padel-green font-bold text-lg font-mono mt-0.5">{fmt(total)}</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-padel-green text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-padel-green-dark transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
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
    const imgSrc = imgs ? getImageUrl(imgs[0]) : 'https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?w=800&q=80';

    return (
        <div className={cn(
            'rounded-2xl border overflow-hidden transition-all duration-300',
            expanded
                ? 'border-padel-green/50 bg-[#0d1f18]'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
        )}>
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
            >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-900">
                    <img src={imgSrc} alt={court.name} className="w-full h-full object-cover" />
                    <div className={cn(
                        'absolute top-1 right-1 w-2 h-2 rounded-full',
                        court.is_booked_now ? 'bg-red-500' : 'bg-padel-green'
                    )} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-heading font-bold text-white truncate">{court.name}</h3>
                        <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 text-slate-500">
                            {court.type}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{court.venue?.name} · {court.sport?.name}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-padel-green text-sm">{fmt(court.price_per_hour)}</p>
                    <p className="text-[10px] text-slate-600">/jam</p>
                </div>
                <ChevronRight className={cn(
                    'w-4 h-4 text-slate-600 shrink-0 transition-transform duration-300',
                    expanded && 'rotate-90 text-padel-green'
                )} />
            </button>

            {/* Expanded Slots */}
            <div className={cn(
                'grid transition-all duration-300',
                expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            )}>
                <div className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-3.5 h-3.5 text-padel-green" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
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
function CartPanel({
    items, onRemove, onCheckout
}: {
    items: CartItem[];
    onRemove: (i: number) => void;
    onCheckout: () => void;
}) {
    const total = items.reduce((s, i) => s + i.totalPrice, 0);

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center mb-4 bg-white/5">
                    <ShoppingCart className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Keranjang kosong</p>
                <p className="text-slate-700 text-xs mt-1">Pilih lapangan & jam di atas</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {items.map((item, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{item.court.name}</p>
                        <p className="text-xs text-slate-500 truncate">{item.court.venue?.name}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] bg-white/10 text-slate-300 px-2 py-0.5 rounded">
                                {format(item.date, 'dd MMM')}
                            </span>
                            <span className="font-mono text-[11px] bg-padel-green/15 text-padel-green px-2 py-0.5 rounded">
                                {item.startTime} – {item.endTime}
                            </span>
                            <span className="text-[11px] text-slate-600">{item.hours} jam</span>
                        </div>
                        <p className="font-mono font-bold text-padel-green text-sm mt-2">{fmt(item.totalPrice)}</p>
                    </div>
                    <button
                        onClick={() => onRemove(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-red-950/40 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}

            <div className="border-t border-white/10 pt-3 mt-1">
                <div className="flex justify-between items-baseline mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Total</span>
                    <span className="font-mono font-black text-white text-xl">{fmt(total)}</span>
                </div>
                <button
                    onClick={onCheckout}
                    className="w-full bg-padel-green text-white font-bold py-3 rounded-xl hover:bg-padel-green-dark transition-all shadow-[0_4px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    Pesan Sekarang
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────── Checkout Modal ─────────────────────────── */
// Steps: 'form' → 'qris' → 'upload' → 'done'
type CheckoutStep = 'form' | 'qris' | 'upload' | 'done';

function CheckoutModal({
    items, onClose, onSuccess
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
            setError(e.response?.data?.message ?? 'Terjadi kesalahan. Coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    // Step 3: Upload proof for each booking
    const handleUploadProof = async () => {
        if (bookingIds.some(id => !proofFiles[id])) {
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
            const e = err as { response?: { data?: { message?: string; errors?: unknown } } };
            console.error('Upload error:', e.response?.data);
            setError(e.response?.data?.message ?? JSON.stringify(e.response?.data?.errors) ?? 'Upload gagal. Coba lagi.');
        } finally {
            setUploadingProof(false);
        }
    };

    const QRIS_IMAGE = '/images/qris.png'; // letakkan file QRIS di public/images/qris.png

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#0a0f0d] border border-white/10 rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)]">

                {/* ── Step: Done ── */}
                {step === 'done' && (
                    <div className="p-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-padel-green/10 border border-padel-green/30 flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-9 h-9 text-padel-green" />
                        </div>
                        <h2 className="font-heading text-2xl font-black text-white mb-2">Bukti Terkirim!</h2>
                        <p className="text-slate-400 text-sm mb-1">
                            Pembayaran akan diverifikasi admin dalam <span className="text-white font-semibold">1×24 jam</span>.
                        </p>
                        <p className="text-slate-500 text-xs mb-2">
                            Notifikasi konfirmasi akan dikirim via WhatsApp ke <span className="text-white font-medium">{phone}</span>
                        </p>
                        <div className="my-4 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-900/30 text-xs text-amber-400 text-left w-full">
                            ⏳ Status booking: <span className="font-bold">Menunggu Konfirmasi</span><br />
                            Setelah admin memverifikasi pembayaran, booking Anda akan aktif.
                        </div>
                        <button
                            onClick={() => { onSuccess(); onClose(); }}
                            className="bg-padel-green text-white font-bold px-8 py-3 rounded-xl hover:bg-padel-green-dark transition-all"
                        >
                            Selesai
                        </button>
                    </div>
                )}

                {/* ── Step: QRIS ── */}
                {step === 'qris' && (
                    <>
                        <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
                            <div>
                                <h2 className="font-heading text-xl font-black text-white">Scan & Bayar</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Scan QRIS lalu upload bukti bayar</p>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-7 py-6 flex flex-col items-center gap-5">
                            {/* QRIS Image */}
                            <div className="bg-white rounded-2xl p-4 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                                <img
                                    src={QRIS_IMAGE}
                                    alt="QRIS Payment"
                                    className="w-56 h-56 object-contain"
                                    onError={e => {
                                        (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=224x224&data=RESERVE-BOOKING-QRIS-PLACEHOLDER';
                                    }}
                                />
                            </div>

                            {/* Amount */}
                            <div className="text-center">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Nominal Transfer</p>
                                <p className="font-mono font-black text-3xl text-white">{fmt(total)}</p>
                                <p className="text-xs text-slate-600 mt-1">Transfer tepat sesuai nominal di atas</p>
                            </div>

                            {/* Instructions */}
                            <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                                {[
                                    'Buka aplikasi m-banking / e-wallet Anda',
                                    'Pilih menu Scan QR / QRIS',
                                    `Transfer tepat ${fmt(total)}`,
                                    'Simpan bukti transfer / screenshot',
                                    'Klik tombol di bawah untuk upload bukti',
                                ].map((text, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm">
                                        <span className="w-5 h-5 rounded-full bg-padel-green/20 text-padel-green text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                        <span className="text-slate-400">{text}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep('upload')}
                                className="w-full bg-padel-green text-white font-bold py-3.5 rounded-xl hover:bg-padel-green-dark transition-all shadow-[0_4px_24px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                            >
                                <ArrowRight className="w-4 h-4" />
                                Sudah Bayar – Upload Bukti
                            </button>
                        </div>
                    </>
                )}

                {/* ── Step: Upload Proof ── */}
                {step === 'upload' && (
                    <>
                        <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
                            <div>
                                <h2 className="font-heading text-xl font-black text-white">Upload Bukti Bayar</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{bookingIds.length} pesanan · {fmt(total)}</p>
                            </div>
                            <button onClick={() => setStep('qris')} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-7 py-6 space-y-4">
                            <p className="text-xs text-slate-500">
                                Upload screenshot / foto bukti transfer untuk setiap pesanan.
                            </p>

                            {bookingIds.length === 1 ? (
                                /* Single booking — one upload area */
                                <UploadArea
                                    label={`Pesanan #${bookingIds[0]}`}
                                    file={proofFiles[bookingIds[0]]}
                                    onChange={file => setProofFiles(prev => ({ ...prev, [bookingIds[0]]: file }))}
                                />
                            ) : (
                                /* Multiple bookings */
                                <div className="space-y-3">
                                    {bookingIds.map((id, idx) => (
                                        <UploadArea
                                            key={id}
                                            label={`Pesanan ${idx + 1} — ${items[idx]?.court.name ?? `#${id}`}`}
                                            file={proofFiles[id]}
                                            onChange={file => setProofFiles(prev => ({ ...prev, [id]: file }))}
                                        />
                                    ))}
                                </div>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-xl p-3">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleUploadProof}
                                disabled={uploadingProof || bookingIds.some(id => !proofFiles[id])}
                                className="w-full bg-padel-green text-white font-bold py-3.5 rounded-xl hover:bg-padel-green-dark transition-all shadow-[0_4px_24px_rgba(16,185,129,0.3)] disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {uploadingProof ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengupload...</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4" /> Kirim Bukti Pembayaran</>
                                )}
                            </button>
                            <p className="text-center text-xs text-slate-700">
                                Booking aktif setelah admin memverifikasi · Max 1×24 jam
                            </p>
                        </div>
                    </>
                )}

                {/* ── Step: Form ── */}
                {step === 'form' && (
                    <>
                        <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
                            <div>
                                <h2 className="font-heading text-xl font-black text-white">Lengkapi Pesanan</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{items.length} lapangan · {fmt(total)}</p>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="px-7 py-4 border-b border-white/10 max-h-40 overflow-y-auto space-y-2">
                            {items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div>
                                        <span className="text-white font-medium">{item.court.name}</span>
                                        <span className="text-slate-500 mx-2">·</span>
                                        <span className="font-mono text-xs text-slate-500">{format(item.date, 'dd MMM')} {item.startTime}–{item.endTime}</span>
                                    </div>
                                    <span className="font-mono text-padel-green font-bold text-xs">{fmt(item.totalPrice)}</span>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmitForm} className="px-7 py-6 space-y-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Data Pemesan</p>

                            {[
                                { id: 'name', label: 'Nama Lengkap', type: 'text', value: name, set: setName },
                                { id: 'email', label: 'Alamat Email', type: 'email', value: email, set: setEmail },
                                { id: 'phone', label: 'Nomor WhatsApp', type: 'tel', value: phone, set: setPhone },
                            ].map(({ id, label, type, value, set }) => (
                                <div key={id} className="group relative">
                                    <input
                                        id={id}
                                        type={type}
                                        required
                                        value={value}
                                        onChange={e => set(e.target.value)}
                                        placeholder=" "
                                        className="peer block w-full rounded-none border-0 border-b-2 border-white/10 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-white placeholder-transparent transition-all duration-300 hover:border-white/20 focus:border-padel-green focus:ring-0 focus:outline-none"
                                    />
                                    <label htmlFor={id} className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                        {label}
                                    </label>
                                </div>
                            ))}

                            {error && (
                                <div className="flex items-start gap-2 text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-xl p-3">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-padel-green text-white font-bold py-3.5 rounded-xl hover:bg-padel-green-dark transition-all shadow-[0_4px_24px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                                    ) : (
                                        <>Lanjut ke Pembayaran · {fmt(total)} <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                                <p className="text-center text-xs text-slate-700 mt-3">Pembayaran via QRIS · Verifikasi manual oleh admin</p>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────── Upload Area ─────────────────────────── */
function UploadArea({ label, file, onChange }: { label: string; file?: File; onChange: (f: File) => void }) {
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <label
                className={cn(
                    'flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all',
                    isDragging
                        ? 'border-padel-green bg-padel-green/10 scale-[1.01]'
                        : file
                            ? 'border-padel-green/50 bg-padel-green/5'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && onChange(e.target.files[0])}
                />
                {isDragging ? (
                    <>
                        <div className="w-10 h-10 rounded-xl border border-padel-green/30 bg-padel-green/10 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-padel-green" />
                        </div>
                        <p className="text-xs font-medium text-padel-green">Lepas untuk upload</p>
                    </>
                ) : file ? (
                    <>
                        <CheckCircle2 className="w-6 h-6 text-padel-green" />
                        <p className="text-xs font-medium text-padel-green truncate max-w-[200px]">{file.name}</p>
                        <p className="text-[10px] text-slate-600">Klik atau drag untuk ganti</p>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-slate-500" />
                        </div>
                        <p className="text-xs text-slate-500">Klik atau drag foto bukti bayar</p>
                        <p className="text-[10px] text-slate-700">JPG, PNG, WEBP · Maks 10MB</p>
                    </>
                )}
            </label>
        </div>
    );
}

/* ─────────────────────────── Main Page ─────────────────────────── */
export default function Welcome({ canRegister = true, courts = [], sports = [], venues = [] }: WelcomeProps) {
    const { auth } = usePage().props as { auth: { user?: { name: string } } | null };
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startDate, setStartDate] = useState(new Date());
    const [selectedSport, setSelectedSport] = useState<number | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    const visibleDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d;
    });

    const filteredCourts = useMemo(() =>
        courts.filter(c => selectedSport === null || c.sport?.id === selectedSport),
        [courts, selectedSport]
    );

    const addToCart = (item: CartItem) => {
        setCartItems(prev => [...prev, item]);
        setCartOpen(true);
    };

    const removeFromCart = (idx: number) => {
        setCartItems(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="min-h-screen bg-[#060a08] font-sans text-white selection:bg-padel-green selection:text-white">
            <Head title="Reservasi Lapangan Premium" />

            {/* ── Navbar ── */}
            <nav className="fixed top-0 inset-x-0 z-40 border-b border-white/5 bg-[#060a08]/90 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-padel-green rounded-lg flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-heading text-lg font-black tracking-tight text-white">RESERVE</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Cart toggle */}
                        <button
                            onClick={() => setCartOpen(!cartOpen)}
                            className={cn(
                                'relative flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all',
                                cartItems.length > 0
                                    ? 'border-padel-green/50 bg-padel-green/10 text-padel-green'
                                    : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                            )}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="hidden sm:inline">Keranjang</span>
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-padel-green rounded-full text-[10px] font-black text-white flex items-center justify-center">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>

                        {auth?.user ? (
                            <Link href={dashboard()} className="px-4 py-2 rounded-xl bg-white/10 text-sm font-semibold text-white hover:bg-white/15 transition-colors">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={login()} className="text-sm font-medium text-slate-500 hover:text-white transition-colors hidden sm:block">
                                    Masuk
                                </Link>
                                {canRegister && (
                                    <Link href={register()} className="px-4 py-2 rounded-xl bg-padel-green text-sm font-bold text-white hover:bg-padel-green-dark transition-all">
                                        Daftar
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative pt-32 pb-20 px-5 lg:px-8 overflow-hidden">
                {/* Background grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,black,transparent)]" />
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-padel-green/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-16">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-padel-green/20 bg-padel-green/5 text-padel-green text-xs font-bold uppercase tracking-widest mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-padel-green animate-pulse" />
                                Booking Instan · Tanpa Akun
                            </div>
                            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] text-white mb-6">
                                Lapangan<br />
                                <span className="text-padel-green">Premium</span><br />
                                <span className="text-white/30">Tersedia</span>
                            </h1>
                            <p className="text-slate-500 text-lg max-w-md leading-relaxed">
                                Pilih lapangan, tentukan jam bermain, dan konfirmasi — semua dalam hitungan detik.
                            </p>
                        </div>

                        {/* Stats strip */}
                        <div className="grid grid-cols-3 gap-4 lg:gap-6 lg:w-72">
                            {[
                                { label: 'Lapangan Aktif', value: courts.length, icon: Activity },
                                { label: 'Olahraga', value: sports.length, icon: Zap },
                                { label: 'Venue', value: venues.length, icon: MapPin },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                                    <Icon className="w-4 h-4 text-padel-green mx-auto mb-2" />
                                    <p className="font-mono font-black text-2xl text-white">{value}</p>
                                    <p className="text-[10px] text-slate-600 font-medium mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Booking Section ── */}
            <section className="px-5 lg:px-8 pb-24">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">

                    {/* LEFT: Courts */}
                    <div className="flex-1 min-w-0">
                        {/* Date Ribbon */}
                        <div className="flex items-center gap-2 mb-5">
                            <button
                                onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 1); setStartDate(d); }}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:border-white/20 hover:text-white transition-all active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex-1 grid grid-cols-7 gap-1.5">
                                {visibleDates.map((d, idx) => {
                                    const isSel = d.toDateString() === selectedDate.toDateString();
                                    const isToday = d.toDateString() === new Date().toDateString();
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedDate(d)}
                                            className={cn(
                                                'flex flex-col items-center py-2.5 rounded-xl border text-center transition-all duration-200',
                                                isSel
                                                    ? 'bg-padel-green border-padel-green text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
                                                    : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white bg-white/[0.02]'
                                            )}
                                        >
                                            <span className={cn('text-[9px] font-bold uppercase tracking-wider', isSel ? 'text-green-200' : '')}>
                                                {isToday ? 'Hari Ini' : format(d, 'EEE', { locale: idLocale })}
                                            </span>
                                            <span className="font-heading font-black text-lg leading-none mt-0.5">
                                                {d.getDate()}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 1); setStartDate(d); }}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:border-white/20 hover:text-white transition-all active:scale-95"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Sport Filter */}
                        <div className="flex items-center gap-2 flex-wrap mb-5">
                            <button
                                onClick={() => setSelectedSport(null)}
                                className={cn(
                                    'px-4 py-1.5 rounded-full border text-sm font-bold transition-all',
                                    selectedSport === null
                                        ? 'bg-white text-black border-white'
                                        : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                )}
                            >
                                Semua
                            </button>
                            {sports.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedSport(s.id)}
                                    className={cn(
                                        'px-4 py-1.5 rounded-full border text-sm font-bold transition-all',
                                        selectedSport === s.id
                                            ? 'bg-padel-green border-padel-green text-white shadow-[0_2px_12px_rgba(16,185,129,0.3)]'
                                            : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                    )}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>

                        {/* Courts List */}
                        {filteredCourts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
                                <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">Tidak ada lapangan tersedia</p>
                                <p className="text-slate-700 text-sm mt-1">Coba pilih olahraga lain</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredCourts.map(court => (
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
                    <div className="hidden lg:block w-80 shrink-0">
                        <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <ShoppingCart className="w-4 h-4 text-padel-green" />
                                <h3 className="font-heading font-bold text-white text-sm">Keranjang Pesanan</h3>
                                {cartItems.length > 0 && (
                                    <span className="ml-auto text-xs font-black text-padel-green bg-padel-green/10 px-2 py-0.5 rounded-full">
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

            {/* ── Mobile Cart Drawer ── */}
            {cartOpen && (
                <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
                    <div className="relative bg-[#0a0f0d] border-t border-white/10 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-5">
                            <ShoppingCart className="w-4 h-4 text-padel-green" />
                            <h3 className="font-heading font-bold text-white">Keranjang</h3>
                            <button onClick={() => setCartOpen(false)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <CartPanel
                            items={cartItems}
                            onRemove={removeFromCart}
                            onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
                        />
                    </div>
                </div>
            )}

            {/* Mobile FAB Cart */}
            {cartItems.length > 0 && !cartOpen && (
                <div className="lg:hidden fixed bottom-6 right-6 z-40">
                    <button
                        onClick={() => setCartOpen(true)}
                        className="flex items-center gap-3 bg-padel-green text-white font-bold px-5 py-3.5 rounded-2xl shadow-[0_8px_32px_rgba(16,185,129,0.5)] hover:bg-padel-green-dark transition-all active:scale-95"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span>{cartItems.length} item</span>
                        <span className="font-mono">·</span>
                        <span className="font-mono">{fmt(cartItems.reduce((s, i) => s + i.totalPrice, 0))}</span>
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
            <footer className="border-t border-white/5 px-5 lg:px-8 py-10">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-padel-green rounded-md flex items-center justify-center">
                            <Trophy className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-heading font-black text-white tracking-tight">RESERVE</span>
                    </div>
                    <p className="text-slate-700 text-sm">&copy; {new Date().getFullYear()} Reserve Booking Systems</p>
                    <div className="flex items-center gap-5">
                        {!auth?.user && (
                            <>
                                <Link href={login()} className="text-sm text-slate-600 hover:text-white transition-colors">Masuk</Link>
                                {canRegister && (
                                    <Link href={register()} className="text-sm text-padel-green hover:text-padel-green-dark transition-colors font-semibold">Daftar</Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}
