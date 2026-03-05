import { Head, Link, usePage } from '@inertiajs/react';
import type { Auth } from '@/types/auth';
import {
    Activity,
    ArrowRight,
    Calendar,
    CheckCircle,
    ChevronRight,
    Mail,
    MapPin,
    Phone,
    Search,
    Shield,
    Star,
    Trophy,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import HeroSection from '@/components/Welcome/HeroSection';
import { dashboard, login, register } from '@/routes';

/* ─── Types ─────────────────────────────────────────────── */
interface Sport {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
}

interface FeaturedVenue {
    id: number;
    name: string;
    slug: string;
    city: string;
    address: string;
    image_url: string | null;
    images: string[] | null;
    min_price: number | null;
    avg_rating: number | null;
    review_count: number;
    sports: string[];
    facilities: string[];
    courts_count: number;
}

interface Stats {
    venues: number;
    courts: number;
    bookings: number;
}

interface PageProps {
    canRegister: boolean;
    sports: Sport[];
    featuredVenues: FeaturedVenue[];
    cities: string[];
    stats: Stats;
}

/* ─── Helpers ────────────────────────────────────────────── */
function formatIDR(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function getVenueImage(venue: FeaturedVenue): string | null {
    return venue.images?.[0] ?? venue.image_url ?? null;
}

/* ─── Navbar ─────────────────────────────────────────────── */
function SiteNavbar({
    auth,
    canRegister,
}: {
    auth: Auth;
    canRegister: boolean;
}) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const textColor = scrolled ? 'text-padel-dark' : 'text-white';
    const mutedColor = scrolled ? 'text-padel-muted hover:text-padel-dark' : 'text-white/70 hover:text-white';

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                scrolled ? 'border-b border-padel-border bg-white/95 shadow-sm backdrop-blur-md' : ''
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-padel-green shadow-sm">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className={`font-display text-xl tracking-wider ${textColor}`}>
                        COURTHUB
                    </span>
                </div>

                {/* Desktop nav links */}
                <nav className="hidden items-center gap-7 md:flex">
                    {[
                        { label: 'Olahraga', href: '#sports' },
                        { label: 'Venue', href: '#venues' },
                        { label: 'Cara Pesan', href: '#how' },
                    ].map(({ label, href }) => (
                        <a
                            key={href}
                            href={href}
                            className={`text-sm font-medium transition-colors ${mutedColor}`}
                        >
                            {label}
                        </a>
                    ))}
                </nav>

                {/* Auth buttons */}
                <div className="flex items-center gap-3">
                    {auth.user ? (
                        <Link
                            href={dashboard().url}
                            className={`hidden items-center gap-1.5 text-sm font-semibold transition-colors md:flex ${mutedColor}`}
                        >
                            Dashboard
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login().url}
                                className={`hidden text-sm font-semibold transition-colors md:block ${mutedColor}`}
                            >
                                Masuk
                            </Link>
                            {canRegister && (
                                <Link
                                    href={register().url}
                                    className="rounded-lg bg-padel-green px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-padel-green-dark active:scale-95"
                                >
                                    Daftar Gratis
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

/* ─── Venue Card ─────────────────────────────────────────── */
function VenueCard({ venue }: { venue: FeaturedVenue }) {
    const imageUrl = getVenueImage(venue);

    return (
        <Link
            href={`/venue/${venue.id}`}
            className="group block overflow-hidden rounded-2xl border border-padel-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-padel-green/30 hover:shadow-lg"
        >
            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={venue.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-padel-green/15 to-slate-200">
                        <MapPin className="h-10 w-10 text-padel-green/40" />
                    </div>
                )}

                {/* Rating badge */}
                {venue.avg_rating !== null && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-slate-800">{venue.avg_rating}</span>
                        {venue.review_count > 0 && (
                            <span className="text-xs text-slate-400">({venue.review_count})</span>
                        )}
                    </div>
                )}

                {/* Courts count pill */}
                <div className="absolute bottom-3 left-3 rounded-md bg-padel-dark/75 px-2.5 py-1 backdrop-blur-sm">
                    <span className="text-[11px] font-semibold text-white">
                        {venue.courts_count} lapangan
                    </span>
                </div>
            </div>

            {/* Card body */}
            <div className="p-5">
                {/* Sport pills */}
                {venue.sports.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {venue.sports.slice(0, 3).map((sport) => (
                            <span
                                key={sport}
                                className="rounded-md bg-padel-green-50 px-2 py-0.5 text-[11px] font-semibold text-padel-green-dark"
                            >
                                {sport}
                            </span>
                        ))}
                        {venue.sports.length > 3 && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                +{venue.sports.length - 3}
                            </span>
                        )}
                    </div>
                )}

                <h3 className="font-heading text-base font-bold text-padel-dark">{venue.name}</h3>

                <div className="mt-1 flex items-center gap-1.5 text-sm text-padel-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{venue.city}</span>
                </div>

                {/* Facilities */}
                {venue.facilities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {venue.facilities.slice(0, 3).map((f) => (
                            <span
                                key={f}
                                className="flex items-center gap-1 rounded-md border border-padel-border bg-padel-light px-2 py-0.5 text-[11px] text-padel-muted"
                            >
                                <CheckCircle className="h-3 w-3 text-padel-green" />
                                {f}
                            </span>
                        ))}
                    </div>
                )}

                {/* Price + CTA */}
                <div className="mt-4 flex items-end justify-between border-t border-padel-border pt-4">
                    <div>
                        {venue.min_price !== null ? (
                            <>
                                <p className="text-[11px] text-padel-muted">Mulai dari</p>
                                <p className="font-heading text-lg font-bold text-padel-dark">
                                    {formatIDR(venue.min_price)}
                                </p>
                                <p className="text-[11px] text-padel-muted">/ jam</p>
                            </>
                        ) : (
                            <p className="text-sm font-medium text-padel-muted">Cek ketersediaan</p>
                        )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-padel-green transition-all group-hover:gap-2">
                        Lihat Jadwal
                        <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function Welcome({ canRegister = true, sports, featuredVenues, cities, stats }: PageProps) {
    const { auth } = usePage().props;

    const steps = [
        {
            num: '01',
            title: 'Cari Venue',
            description: 'Pilih olahraga dan kota favoritmu. Filter berdasarkan harga, fasilitas, dan jadwal tersedia.',
            icon: Search,
        },
        {
            num: '02',
            title: 'Pilih Jadwal',
            description: 'Cek ketersediaan real-time. Tentukan tanggal, jam mulai, dan durasi bermain.',
            icon: Calendar,
        },
        {
            num: '03',
            title: 'Main & Menang',
            description: 'Datang ke venue, check-in mudah dengan kode booking, dan nikmati sesimu.',
            icon: Trophy,
        },
    ];

    const displayStats = [
        {
            label: 'Venue Aktif',
            value: stats?.venues > 0 ? `${stats.venues}+` : '50+',
            icon: MapPin,
            color: 'text-padel-green',
            bg: 'bg-padel-green/15',
        },
        {
            label: 'Lapangan',
            value: stats?.courts > 0 ? `${stats.courts}+` : '200+',
            icon: Activity,
            color: 'text-blue-400',
            bg: 'bg-blue-400/15',
        },
        {
            label: 'Sesi Terbooking',
            value: stats?.bookings > 0 ? `${stats.bookings}+` : '10K+',
            icon: TrendingUp,
            color: 'text-amber-400',
            bg: 'bg-amber-400/15',
        },
        {
            label: 'Pengguna Aktif',
            value: '5K+',
            icon: Users,
            color: 'text-purple-400',
            bg: 'bg-purple-400/15',
        },
    ];

    return (
        <div className="min-h-screen bg-padel-light font-sans text-padel-dark">
            <Head title="CourtHub — Reservasi Lapangan Olahraga" />

            <SiteNavbar auth={auth} canRegister={canRegister} />

            {/* ── Hero ── */}
            <HeroSection sports={sports ?? []} popularLocations={cities ?? []} />

            {/* ── Sports Categories ── */}
            <section id="sports" className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-padel-green">
                            Kategori Olahraga
                        </span>
                        <h2 className="mt-2 font-display text-4xl tracking-wider text-padel-dark md:text-5xl">
                            PILIH OLAHRAGAMU
                        </h2>
                        <p className="mx-auto mt-3 max-w-md text-padel-muted">
                            Temukan venue terbaik untuk olahraga favoritmu
                        </p>
                    </div>

                    {sports && sports.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {sports.map((sport) => (
                                <button
                                    key={sport.id}
                                    type="button"
                                    className="group flex flex-col items-center gap-3 rounded-2xl border border-padel-border bg-white p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-padel-green hover:shadow-md"
                                >
                                    <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
                                        {sport.icon ?? '🏆'}
                                    </span>
                                    <span className="text-sm font-semibold text-padel-dark transition-colors group-hover:text-padel-green">
                                        {sport.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-padel-muted">
                            Belum ada kategori olahraga.
                        </p>
                    )}
                </div>
            </section>

            {/* ── Featured Venues ── */}
            <section id="venues" className="bg-padel-light py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    {/* Section header */}
                    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-padel-green">
                                Venue Unggulan
                            </span>
                            <h2 className="mt-2 font-display text-4xl tracking-wider text-padel-dark md:text-5xl">
                                VENUE TERPOPULER
                            </h2>
                            <p className="mt-2 text-padel-muted">
                                Venue pilihan komunitas dengan fasilitas terlengkap
                            </p>
                        </div>
                        <a
                            href="#venues"
                            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-padel-green transition-colors hover:text-padel-green-dark"
                        >
                            Lihat Semua
                            <ChevronRight className="h-4 w-4" />
                        </a>
                    </div>

                    {featuredVenues && featuredVenues.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredVenues.map((venue) => (
                                <VenueCard key={venue.id} venue={venue} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-padel-border py-20 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-padel-green/10">
                                <MapPin className="h-8 w-8 text-padel-green/50" />
                            </div>
                            <p className="font-heading text-base font-bold text-padel-dark">Belum ada venue aktif</p>
                            <p className="mt-1 text-sm text-padel-muted">Venue sedang dalam proses pendaftaran</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how" className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-padel-green">
                            Cara Booking
                        </span>
                        <h2 className="mt-2 font-display text-4xl tracking-wider text-padel-dark md:text-5xl">
                            3 LANGKAH MUDAH
                        </h2>
                        <p className="mx-auto mt-3 max-w-md text-padel-muted">
                            Dari pencarian hingga bermain, prosesnya cepat dan mudah
                        </p>
                    </div>

                    <div className="relative grid gap-8 md:grid-cols-3">
                        {/* Connector line */}
                        <div className="absolute left-[calc(33%+2rem)] right-[calc(33%+2rem)] top-10 hidden h-0.5 bg-gradient-to-r from-padel-green/30 via-padel-green to-padel-green/30 md:block" />

                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div key={i} className="relative flex flex-col items-center text-center">
                                    {/* Icon circle */}
                                    <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-padel-green/25 bg-padel-green/8 ring-4 ring-padel-green/8">
                                        <Icon className="h-8 w-8 text-padel-green" />
                                        <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-padel-green font-display text-sm text-white shadow-sm">
                                            {i + 1}
                                        </div>
                                    </div>

                                    <h3 className="font-heading text-lg font-bold text-padel-dark">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-padel-muted">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* CTA */}
                    <div className="mt-14 text-center">
                        <Link
                            href={auth.user ? dashboard().url : canRegister ? register().url : login().url}
                            className="inline-flex items-center gap-2.5 rounded-xl bg-padel-green px-8 py-4 font-bold text-white shadow-sm transition-all hover:bg-padel-green-dark active:scale-95"
                        >
                            {auth.user ? 'Ke Dashboard' : 'Mulai Gratis Sekarang'}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        {!auth.user && (
                            <p className="mt-3 text-xs text-padel-muted">
                                Sudah punya akun?{' '}
                                <Link href={login().url} className="font-semibold text-padel-green hover:underline">
                                    Masuk di sini
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Trust & Stats ── */}
            <section className="bg-padel-dark py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mb-14 text-center">
                        <h2 className="font-display text-4xl tracking-wider text-white md:text-5xl">
                            DIPERCAYA RIBUAN PEMAIN
                        </h2>
                        <p className="mt-3 text-white/50">
                            Bergabung dengan komunitas olahragawan terbesar di platform kami
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        {displayStats.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div key={i} className="flex flex-col items-center text-center">
                                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${stat.bg}`}>
                                        <Icon className={`h-7 w-7 ${stat.color}`} />
                                    </div>
                                    <div className={`font-display text-5xl tracking-wider ${stat.color}`}>
                                        {stat.value}
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-white/50">
                                        {stat.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Trust badges */}
                    <div className="mt-16 grid grid-cols-1 gap-4 border-t border-white/10 pt-12 sm:grid-cols-3">
                        {[
                            {
                                icon: Shield,
                                title: 'Booking Aman & Terjamin',
                                desc: 'Semua transaksi diproteksi dengan enkripsi terkini',
                            },
                            {
                                icon: Zap,
                                title: 'Konfirmasi Instan',
                                desc: 'Dapatkan konfirmasi booking dalam hitungan detik',
                            },
                            {
                                icon: Users,
                                title: 'Komunitas Aktif',
                                desc: 'Bergabung dengan ribuan pengguna aktif setiap harinya',
                            },
                        ].map(({ icon: Icon, title, desc }, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-padel-green/15">
                                    <Icon className="h-5 w-5 text-padel-green" />
                                </div>
                                <div>
                                    <p className="font-heading text-sm font-bold text-white">{title}</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-white/45">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-white/10 bg-padel-dark">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1">
                            <div className="mb-4 flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-padel-green">
                                    <Zap className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-display text-xl tracking-wider text-white">COURTHUB</span>
                            </div>
                            <p className="max-w-[200px] text-sm leading-relaxed text-white/40">
                                Platform reservasi lapangan olahraga terpercaya di Indonesia.
                            </p>
                        </div>

                        {/* Layanan */}
                        <div>
                            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                                Layanan
                            </p>
                            <ul className="space-y-3">
                                {['Cari Venue', 'Olahraga Kami', 'Pricing', 'Partnerships'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-sm text-white/55 transition-colors hover:text-white">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Perusahaan */}
                        <div>
                            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                                Perusahaan
                            </p>
                            <ul className="space-y-3">
                                {['Tentang Kami', 'Cara Kerja', 'FAQ', 'Blog'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-sm text-white/55 transition-colors hover:text-white">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Kontak */}
                        <div>
                            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                                Kontak
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-white/55">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    hello@courthub.id
                                </li>
                                <li className="flex items-center gap-2 text-sm text-white/55">
                                    <Phone className="h-4 w-4 shrink-0" />
                                    +62 812 3456 7890
                                </li>
                                <li className="flex items-center gap-2 text-sm text-white/55">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    Jakarta, Indonesia
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                        <p className="text-xs text-white/30">
                            © 2026 CourtHub. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Cookie'].map((item) => (
                                <a key={item} href="#" className="text-xs text-white/30 transition-colors hover:text-white/60">
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
