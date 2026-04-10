import { Head, usePage, Link } from '@inertiajs/react';
import {
    ArrowRight,
    MapPin,
    Instagram,
    Facebook,
    Phone,
    Mail,
    Menu,
    X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
interface Court {
    id: number;
    name: string;
    type: 'indoor' | 'outdoor';
    price_per_hour: number;
    sport: Sport;
    venue: Venue;
    images?: string[];
}
interface WelcomeProps {
    canRegister?: boolean;
    courts: Court[];
    sports: Sport[];
}

/* ─────────────────────────── Helpers ─────────────────────────── */
const getImageUrl = (path: string) =>
    path.startsWith('http') ? path : `/storage/${path}`;


const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1646649853703-7645147474ba?w=1200&q=80';

function CourtCardInner({ court }: { court: Court }) {
    const p = court.images?.[0] ?? court.venue?.images?.[0];
    const imgSrc = p ? getImageUrl(p) : FALLBACK_IMG;
    return (
        <>
            <img
                src={imgSrc}
                alt={court.name}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

            {/* Hover book button */}
            <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-center pb-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 shadow-lg shadow-emerald-500/30 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-emerald-400 group-hover:shadow-emerald-400/40">
                    <span className="font-sans text-[11px] font-black tracking-[0.2em] text-white uppercase">Pesan Sekarang</span>
                    <ArrowRight className="h-3.5 w-3.5 text-white transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
            </div>
        </>
    );
}

/* ─────────────────────────── useInView ─────────────────────────── */
function useInView(threshold = 0.15) {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
        }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
}

/* ─────────────────────────── Main Page ─────────────────────────── */
export default function Welcome({ canRegister = true, courts = [], sports = [] }: WelcomeProps) {
    const { auth } = usePage().props as {
        auth: { user?: { id: number; name: string; email: string } } | null;
    };

    const [selectedSport, setSelectedSport] = useState<number | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const introAnim    = useInView(0.1);
    const featuredAnim = useInView(0.1);
    const sportsAnim   = useInView(0.1);
    const galleryAnim  = useInView(0.1);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-white selection:bg-emerald-500 selection:text-white">
            <Head title="Sewa Lapangan Olahraga di Samarinda — Sofiah Sport Center">
                <meta name="description" content="Sewa lapangan olahraga terbaik di Samarinda. Tersedia lapangan futsal, badminton, dan berbagai cabang olahraga lainnya. Pesan online mudah & cepat di Sofiah Sport Center, Kec. Loa Janan Ilir." />
                <meta name="keywords" content="lapangan di Samarinda, sewa lapangan Samarinda, lapangan futsal Samarinda, lapangan badminton Samarinda, sport center Samarinda, Sofiah Sport Center" />
            </Head>

            {/* ── Floating Pill Navbar ── */}
            <nav className={cn('fixed inset-x-0 top-0 z-50 px-5 transition-all duration-500 lg:px-8', isScrolled ? 'pt-3' : 'pt-4')}>
                <div className={cn('mx-auto flex max-w-7xl items-center justify-between gap-3 transition-all duration-500', isScrolled ? 'rounded-full border border-slate-200/60 bg-white/80 px-4 py-2.5 shadow-lg shadow-slate-900/[0.04] backdrop-blur-xl sm:px-6' : 'px-0 py-2')}>

                    {/* Logo */}
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                        <span className={cn('font-display text-lg font-bold tracking-tight transition-colors', isScrolled ? 'text-slate-900' : 'text-white')}>
                            Sofiah Sport Center
                        </span>
                    </Link>

                    {/* Center Nav Links */}
                    <div className={cn('hidden items-center gap-1 rounded-full p-1.5 sm:flex', isScrolled ? 'bg-slate-100/80' : '')}>
                        {([
                            { href: '/', label: 'Beranda' },
                            { href: '/lapangan', label: 'Lapangan' },
                        ] as const).map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                                    isScrolled ? 'text-slate-500 hover:text-slate-900' : 'text-white/60 hover:text-white',
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileNavOpen(!mobileNavOpen)}
                        className={cn('flex h-10 w-10 items-center justify-center rounded-full transition-colors sm:hidden', isScrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white/80 hover:text-white')}
                        aria-label="Menu"
                    >
                        {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className={cn('h-6 w-px', isScrolled ? 'bg-slate-200' : 'bg-white/15')} />
                        {auth?.user ? (
                            <Link
                                href={dashboard()}
                                className={cn('rounded-full px-5 py-2 text-sm font-semibold transition-all', isScrolled ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600' : 'bg-white/15 text-white hover:bg-white/25')}
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className={cn('hidden rounded-full px-4 py-2 text-sm font-medium transition-colors sm:block', isScrolled ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-white/70 hover:text-white')}
                                >
                                    Masuk
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className={cn('rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm', isScrolled ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600' : 'bg-white/15 text-white hover:bg-white/25')}
                                    >
                                        Daftar
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Nav Dropdown */}
                <div className={cn('mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl transition-all duration-300 sm:hidden', mobileNavOpen ? 'max-h-64 border border-slate-200/60 bg-white/95 opacity-100 shadow-lg backdrop-blur-xl' : 'max-h-0 opacity-0')}>
                    <div className="flex flex-col gap-0.5 p-2.5">
                        {([
                            { href: '/', label: 'Beranda' },
                            { href: '/lapangan', label: 'Lapangan' },
                        ] as const).map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileNavOpen(false)}
                                className="rounded-2xl px-5 py-3 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section id="hero" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden py-32">
                <div className="absolute inset-0 z-0 bg-slate-900">
                    <video src="/videos/Footage.mp4" autoPlay loop muted playsInline className="h-full w-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-slate-900/40" />
                </div>
                <div className="relative z-10 mx-auto w-full max-w-3xl px-5 text-center">
                    <h1 className="mb-6 font-display text-5xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
                        Selamat Datang di
                        <br />
                        <span className="text-emerald-400">Sofiah Sport Center</span>
                    </h1>
                    <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-200">
                        Rasakan pengalaman berolahraga terbaik. Pesan lapangan premium kami, tentukan jadwal ideal Anda, dan nikmati fasilitas lengkap dengan mudah dan cepat.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/booking"
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/50"
                        >
                            Booking Sekarang
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/lapangan"
                            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
                        >
                            Lihat Olahraga
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Featured Courts ── */}
            {courts.length > 0 && (
                <section ref={featuredAnim.ref} className="bg-slate-50 px-5 py-16 lg:px-8 lg:py-20">
                    <div className={cn('mx-auto max-w-7xl transition-all duration-700 ease-out', featuredAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>

                        {/* Header */}
                        <div className="mb-8 flex items-end justify-between">
                            <div>
                                <p className="mb-1 text-[10px] font-bold tracking-[0.4em] text-emerald-500 uppercase">Lapangan Unggulan</p>
                                <h2 className="font-display text-3xl font-black leading-none text-slate-900 lg:text-4xl">COURT TERBAIK</h2>
                            </div>
                            <Link href="/booking" className="hidden items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-emerald-600 sm:flex">
                                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        {/* Uniform card row */}
                        <div className="-mx-1 flex gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
                            {courts.slice(0, 3).map((court) => (
                                <Link
                                    key={court.id}
                                    href={`/lapangan/${court.id}`}
                                    className="group flex w-72 shrink-0 flex-col sm:w-auto"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                                        <CourtCardInner court={court} />
                                    </div>

                                    {/* Text below */}
                                    <div className="mt-3 px-0.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-display text-sm font-black leading-tight text-slate-900 transition-colors group-hover:text-emerald-600">
                                                {court.name}
                                            </h3>
                                            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                                        </div>
                                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                                            <span>{court.sport?.name}</span>
                                            <span className="h-3 w-px bg-slate-200" />
                                            <span>{court.venue?.name}</span>
                                        </div>
                                        <p className="mt-1.5 font-display text-sm font-black text-slate-900">
                                            {fmt(court.price_per_hour)}
                                            <span className="ml-1 text-[10px] font-medium text-slate-400">/jam</span>
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Mobile see-all */}
                        <div className="mt-6 flex justify-center sm:hidden">
                            <Link href="/booking" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-emerald-600">
                                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Intro Section ── */}
            <section ref={introAnim.ref} className="overflow-hidden bg-white">
                <div className={cn('transition-all duration-700 ease-out', introAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>

                    {/* Top row — label + headline + image bleeding to edge */}
                    <div className="flex flex-col lg:flex-row">

                        {/* Left text block */}
                        <div className="flex flex-col justify-center px-5 py-14 lg:w-1/2 lg:px-16 lg:py-20 xl:px-24">
                            <p className="mb-5 text-[10px] font-black tracking-[0.45em] text-emerald-500 uppercase">— Tentang Kami</p>
                            <h2 className="font-display text-4xl font-black leading-[1.05] text-slate-900 lg:text-5xl xl:text-6xl">
                                SATU TEMPAT,<br />
                                <span className="text-emerald-500">SEMUA</span><br />
                                OLAHRAGA.
                            </h2>
                            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-slate-500">
                                Sofiah Sport Center menghadirkan fasilitas olahraga premium dengan lapangan berkualitas tinggi, jadwal fleksibel, dan sistem pemesanan yang cepat dan mudah.
                            </p>
                            <div className="mt-8">
                                <Link
                                    href="/booking"
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-600"
                                >
                                    Reservasi Sekarang
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Right — image bleeds to edge, no border/radius */}
                        <div className="relative hidden lg:block lg:w-1/2">
                            <img
                                src="/images/Homepage/AboutUs.jpg"
                                alt="About Us"
                                className="h-full w-full object-cover"
                                style={{ minHeight: '520px' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/10 to-slate-900/40" />
                        </div>
                    </div>

                    {/* Bottom stats bar — full width, dark */}
                    <div className="grid grid-cols-3 divide-x divide-slate-700 bg-slate-900">
                        {[
                            { value: String(sports.length), label: 'Cabang Olahraga' },
                            { value: String(courts.length), label: 'Total Lapangan' },
                            { value: '09—22', label: 'Jam Operasional', emerald: true },
                        ].map((stat) => (
                            <div key={stat.label} className="flex flex-col items-center justify-center px-6 py-8 text-center">
                                <p className={cn('font-display text-3xl font-black leading-none lg:text-4xl', stat.emerald ? 'text-emerald-400' : 'text-white')}>
                                    {stat.value}
                                </p>
                                <p className="mt-2 text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Sports Section ── */}
            {sports.length > 0 && (
                <section ref={sportsAnim.ref} id="sports" className={cn('mb-0 mt-10 flex flex-col overflow-hidden transition-all duration-700 ease-out lg:mt-16 lg:h-screen', sportsAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
                    {/* Minimal strip header */}
                    <div className="shrink-0 border-b border-slate-100">
                        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
                            <h2 className="font-display text-3xl font-extrabold leading-none text-slate-900 lg:text-4xl">
                                OLAHRAGA KAMI
                            </h2>
                            <p className="hidden text-[11px] font-medium text-slate-400 sm:block">
                                {sports.length} kategori &middot; {courts.length} lapangan
                            </p>
                        </div>
                    </div>

                    {/* Cards — fill remaining height equally */}
                    <div className="flex min-h-0 flex-1 flex-col">
                        {sports.map((sport, idx) => {
                            const sportCourts = courts.filter((c) => c.sport?.id === sport.id);
                            const courtCount = sportCourts.length;
                            const imgPath =
                                sportCourts.find((c) => c.images?.length)?.images?.[0] ??
                                sportCourts.find((c) => c.venue?.images?.length)?.venue?.images?.[0];
                            const imgSrc = imgPath
                                ? getImageUrl(imgPath)
                                : 'https://images.unsplash.com/photo-1646649853703-7645147474ba?w=1200&q=80';
                            const isActive = selectedSport === sport.id;

                            return (
                                <Link
                                    key={sport.id}
                                    href={`/booking?sport=${sport.id}`}
                                    onClick={() => setSelectedSport(sport.id)}
                                    className={cn(
                                        'group relative flex w-full min-h-0 flex-1 flex-col overflow-hidden text-left transition-all duration-500',
                                        idx % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse',
                                    )}
                                >
                                    {/* ── Text panel ── */}
                                    <div className={cn('relative flex w-full flex-col justify-between px-6 py-5 transition-colors duration-500 sm:w-1/2 sm:px-10 sm:py-6 lg:px-12 lg:py-8', isActive ? 'bg-emerald-50' : 'bg-white group-hover:bg-slate-50')}>
                                        {/* Index */}
                                        <div className="flex items-center justify-between">
                                            <span className="select-none font-display text-4xl font-black leading-none text-slate-200 transition-colors duration-300 group-hover:text-slate-300">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            {isActive && (
                                                <span className="font-sans text-[10px] font-bold tracking-[0.35em] text-emerald-600 uppercase">✦ aktif</span>
                                            )}
                                        </div>

                                        {/* Bottom content */}
                                        <div>
                                            <h3 className={cn('font-display text-4xl font-black leading-none transition-colors duration-300 sm:text-5xl lg:text-[3.25rem]', isActive ? 'text-emerald-600' : 'text-slate-900 group-hover:text-emerald-600')}>
                                                {sport.name.toUpperCase()}
                                            </h3>
                                            <div className={cn('my-3 h-px transition-colors duration-500', isActive ? 'bg-emerald-400/50' : 'bg-slate-200 group-hover:bg-emerald-400/40')} />
                                            <div className="flex items-baseline gap-2.5">
                                                <span className="font-display text-2xl font-bold leading-none text-slate-400 transition-colors duration-300 group-hover:text-slate-900">
                                                    {courtCount}
                                                </span>
                                                <span className="font-sans text-xs text-slate-400 transition-colors group-hover:text-slate-600">lapangan tersedia</span>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2">
                                                <span className="font-sans text-xs font-semibold text-slate-400 transition-colors duration-300 group-hover:text-slate-900">Booking Sekarang</span>
                                                <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Image panel ── */}
                                    <div className="relative h-36 overflow-hidden sm:h-auto sm:w-1/2">
                                        <img src={imgSrc} alt={sport.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-slate-950/0 transition-all duration-500 group-hover:bg-slate-950/20" />
                                        <div className="absolute right-0 bottom-0 left-0 translate-y-full transition-transform duration-500 group-hover:translate-y-0">
                                            <div className="flex items-center justify-between bg-white/95 px-5 py-3 backdrop-blur-sm">
                                                <div>
                                                    <p className="font-display text-base font-bold leading-none text-slate-900">{sport.name.toUpperCase()}</p>
                                                    <p className="mt-0.5 font-sans text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">{courtCount} lapangan</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Gallery Section — Masonry ── */}
            <section ref={galleryAnim.ref} id="gallery" className="bg-slate-950 px-5 py-20 lg:px-8 lg:py-28">
                <div className={cn('mx-auto max-w-7xl transition-all duration-700 ease-out', galleryAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
                    <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="mb-3 text-[10px] font-bold tracking-[0.4em] text-emerald-500 uppercase">— 03 Galeri</p>
                            <h2 className="font-display text-4xl font-black leading-none text-white lg:text-5xl">
                                MOMEN<br />
                                <span className="text-slate-500">TERBAIK KAMI</span>
                            </h2>
                        </div>
                        <p className="max-w-xs text-sm leading-relaxed text-slate-400 sm:text-right">
                            Dipercaya oleh atlet dan komunitas dari berbagai kalangan.
                        </p>
                    </div>

                    <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
                        {([
                            { src: '/images/Gallery/gallery-1.jpg', aspect: 'aspect-[3/4]',  label: 'Sport Court' },
                            { src: '/images/Gallery/gallery-2.jpg', aspect: 'aspect-[4/3]',  label: 'Training' },
                            { src: '/images/Gallery/gallery-3.jpg', aspect: 'aspect-[2/3]',  label: 'Tournament' },
                            { src: '/images/Gallery/gallery-4.jpg', aspect: 'aspect-square',  label: 'Community' },
                            { src: '/images/Gallery/gallery-5.jpg', aspect: 'aspect-[3/4]',  label: 'Coaching' },
                            { src: '/images/Gallery/gallery-6.jpg', aspect: 'aspect-[16/10]', label: 'Venue' },
                            { src: '/images/Gallery/gallery-7.jpg', aspect: 'aspect-[4/5]',  label: 'Match Day' },
                        ] as const).map((item, i) => (
                            <div key={i} className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl">
                                <div className={cn('relative overflow-hidden', item.aspect)}>
                                    <img src={item.src} alt={item.label} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                                    <div className="absolute inset-0 bg-slate-950/0 transition-all duration-500 group-hover:bg-slate-950/40" />
                                    <div className="absolute top-3 left-3">
                                        <span className="font-display text-[11px] font-bold tracking-[0.2em] text-white/30">{String(i + 1).padStart(2, '0')}</span>
                                    </div>
                                    <div className="absolute right-0 bottom-0 left-0 translate-y-2 px-4 pb-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                        <div className="flex items-center justify-between">
                                            <span className="font-display text-sm font-bold tracking-wider text-white">{item.label.toUpperCase()}</span>
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                                                <ArrowRight className="h-3.5 w-3.5 text-white" />
                                            </span>
                                        </div>
                                        <div className="mt-2 h-px bg-white/20" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Location & Contact Section ── */}
            <section className="bg-white px-5 py-16 lg:px-8 lg:py-20">
                <div className="mx-auto max-w-7xl">

                    {/* Header */}
                    <div className="mb-10 flex items-end justify-between">
                        <div>
                            <p className="mb-1 text-[10px] font-bold tracking-[0.4em] text-emerald-500 uppercase">Temukan Kami</p>
                            <h2 className="font-display text-3xl font-black leading-none text-slate-900 lg:text-4xl">LOKASI & KONTAK</h2>
                        </div>
                    </div>

                    {/* Two-column layout */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">

                        {/* Map — takes more space */}
                        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 lg:aspect-auto lg:min-h-[420px]">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.6242839027245!2d117.10274740000001!3d-0.5650729!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2df681003ebb5213%3A0x3a2dd098144be2ab!2sSofiah%20sport%20centre!5e0!3m2!1sen!2sid!4v1775641731969!5m2!1sen!2sid"
                                className="absolute inset-0 h-full w-full border-0"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Sofiah Sport Centre Location"
                            />
                        </div>

                        {/* Info panel */}
                        <div className="flex flex-col gap-6 lg:col-span-2">

                            {/* Address */}
                            <div>
                                <p className="mb-2 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Alamat</p>
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <div>
                                        <p className="font-display text-sm font-black text-slate-900">Sofiah Sport Centre</p>
                                        <p className="mt-0.5 text-sm leading-relaxed text-slate-500">Jl. Moeis Hasan, Simpang Tiga,<br />Kec. Loa Janan Ilir, Kota Samarinda,<br />Kalimantan Timur</p>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Hours */}
                            <div>
                                <p className="mb-3 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Jam Operasional</p>
                                <div className="flex flex-col gap-2">
                                    {[
                                        { day: 'Senin – Jumat', hours: '07.00 – 22.00' },
                                        { day: 'Sabtu', hours: '06.00 – 23.00' },
                                        { day: 'Minggu & Libur', hours: '07.00 – 21.00' },
                                    ].map((row) => (
                                        <div key={row.day} className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500">{row.day}</span>
                                            <span className="font-display text-sm font-bold text-slate-900">{row.hours}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Contact */}
                            <div>
                                <p className="mb-3 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Kontak</p>
                                <div className="flex flex-col gap-2.5">
                                    <a href="tel:+62082155670524" className="flex items-center gap-3 text-sm text-slate-500 transition-colors hover:text-emerald-600">
                                        <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                        0821-5567-0524
                                    </a>
                                    <a href="mailto:info@sofiahsport.id" className="flex items-center gap-3 text-sm text-slate-500 transition-colors hover:text-emerald-600">
                                        <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                        info@sofiahsport.id
                                    </a>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Social */}
                            <div>
                                <p className="mb-3 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Media Sosial</p>
                                <div className="flex items-center gap-3">
                                    <a href="https://www.instagram.com/sofiahsportcentre/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600" aria-label="Instagram">
                                        <Instagram className="h-4 w-4" />
                                    </a>
                                    <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600" aria-label="Facebook">
                                        <Facebook className="h-4 w-4" />
                                    </a>
                                    <span className="text-[11px] font-medium text-slate-400">@sofiahsportcentre</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 bg-white px-5 py-16 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-16">
                        <div className="flex flex-col items-start">
                            <span className="mb-4 font-display text-2xl font-black tracking-tight text-slate-900">Sofiah Sport Center</span>
                            <p className="mb-6 text-sm leading-relaxed text-slate-500">
                                Menyediakan fasilitas olahraga lengkap dengan lapangan premium berkualitas. Nikmati pengalaman berolahraga terbaik bersama kami.
                            </p>
                            <div className="flex items-center gap-4">
                                <a href="https://www.instagram.com/sofiahsportcentre/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-500">
                                    <Instagram className="h-5 w-5" />
                                </a>
                                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-500">
                                    <Facebook className="h-5 w-5" />
                                </a>
                                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-500">
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
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
                                <p>0821-5567-0524</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-start">
                            <h3 className="mb-4 font-display text-base font-bold text-slate-900">Akses Cepat</h3>
                            <div className="flex flex-col gap-3">
                                <Link href="/booking" className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-500">Booking Lapangan</Link>
                                {!auth?.user && (
                                    <>
                                        <Link href={login()} className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-500">Masuk</Link>
                                        {canRegister && (
                                            <Link href={register()} className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-500">Daftar Akun</Link>
                                        )}
                                    </>
                                )}
                                <Link href="#" className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-500">Syarat & Ketentuan</Link>
                                <Link href="#" className="text-sm font-medium text-slate-500 transition-colors hover:text-emerald-500">Kebijakan Privasi</Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
                        <p className="text-sm font-medium text-slate-400">
                            &copy; {new Date().getFullYear()} Sofiah Sport Center. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
