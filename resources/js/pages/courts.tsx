import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,

    Filter,
    Instagram,
    Mail,
    MapPin,
    Menu,
    Phone,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

/* ─────────────────────────── Types ─────────────────────────── */
interface Sport { id: number; name: string; }
interface Venue { id: number; name: string; images?: string[]; }
interface Court {
    id: number; name: string; type: 'indoor' | 'outdoor';
    price_per_hour: number; sport: Sport; venue: Venue; images?: string[];
}
interface PageProps {
    courts: Court[]; sports: Sport[];
    filters: { sport?: string; type?: string; search?: string };
    canRegister?: boolean;
}

/* ─────────────────────────── Helpers ─────────────────────────── */
const getImageUrl = (path: string) => path.startsWith('http') ? path : `/storage/${path}`;
const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1646649853703-7645147474ba?w=800&q=80';

/* ─────────────────────────── Court Card ─────────────────────────── */
function CourtCard({ court }: { court: Court }) {
    const img = court.images?.[0] ?? court.venue?.images?.[0];
    const src = img ? getImageUrl(img) : FALLBACK_IMG;

    return (
        <Link
            href={`/lapangan/${court.id}`}
            className="group relative flex flex-col overflow-hidden border border-slate-100 bg-white transition-all duration-300 hover:border-slate-200 hover:shadow-md"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={src}
                    alt={court.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

                {/* Type pill */}
                <span className={cn(
                    'absolute top-3 left-3 rounded-full px-2.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase',
                    court.type === 'indoor' ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white'
                )}>
                    {court.type}
                </span>

                {/* Price overlay bottom */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-display text-xl font-black leading-none text-white">
                        {fmt(court.price_per_hour)}
                        <span className="ml-1 text-[11px] font-medium text-white/50">/jam</span>
                    </p>
                </div>
            </div>

            {/* Info row */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <div className="min-w-0">
                    <h3 className="font-display text-sm font-black leading-tight text-slate-900 transition-colors group-hover:text-emerald-600">
                        {court.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{court.venue?.name}</span>
                        <span className="text-slate-200">·</span>
                        <span className="text-slate-400">{court.sport?.name}</span>
                    </div>
                </div>
                <div className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 text-slate-300 transition-all duration-300 group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white">
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
            </div>
        </Link>
    );
}

/* ─────────────────────────── Main Page ─────────────────────────── */
export default function Courts({ courts = [], sports = [], filters = {}, canRegister = true }: PageProps) {
    const { auth } = usePage().props as {
        auth: { user?: { id: number; name: string; email: string } } | null;
    };

    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedSport, setSelectedSport] = useState<number | null>(filters.sport ? Number(filters.sport) : null);
    const [selectedType, setSelectedType] = useState<'indoor' | 'outdoor' | null>((filters.type as 'indoor' | 'outdoor') ?? null);
    const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

    useEffect(() => {
        const handler = () => setIsScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const filtered = useMemo(() => {
        let result = [...courts];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c => c.name.toLowerCase().includes(q) || c.venue?.name.toLowerCase().includes(q));
        }
        if (selectedSport) result = result.filter(c => c.sport?.id === selectedSport);
        if (selectedType) result = result.filter(c => c.type === selectedType);
        if (sortBy === 'price_asc') result.sort((a, b) => a.price_per_hour - b.price_per_hour);
        if (sortBy === 'price_desc') result.sort((a, b) => b.price_per_hour - a.price_per_hour);
        return result;
    }, [courts, search, selectedSport, selectedType, sortBy]);

    const activeFilterCount = [selectedSport, selectedType].filter(Boolean).length;

    function resetFilters() {
        setSearch(''); setSelectedSport(null); setSelectedType(null); setSortBy('default');
    }

    const navLinks = [
        { href: '/', label: 'Beranda' },
        { href: '/lapangan', label: 'Lapangan' },
    ];

    /* ── Filter panel (shared desktop/mobile) ── */
    const FilterPanel = () => (
        <div className="flex flex-col gap-7">
            {/* Search */}
            <div>
                <p className="mb-2.5 text-[9px] font-black tracking-[0.35em] text-slate-400 uppercase">Cari</p>
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Nama lapangan atau venue..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-8 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Sport */}
            <div>
                <p className="mb-2.5 text-[9px] font-black tracking-[0.35em] text-slate-400 uppercase">Cabang Olahraga</p>
                <div className="flex flex-col gap-px">
                    {[{ id: 0, name: 'Semua', count: courts.length }, ...sports.map(s => ({ id: s.id, name: s.name, count: courts.filter(c => c.sport?.id === s.id).length }))].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedSport(item.id === 0 ? null : (selectedSport === item.id ? null : item.id))}
                            className={cn(
                                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all',
                                (item.id === 0 ? !selectedSport : selectedSport === item.id)
                                    ? 'bg-slate-900 font-bold text-white'
                                    : 'font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                            )}
                        >
                            {item.name}
                            <span className={cn('text-[11px]', (item.id === 0 ? !selectedSport : selectedSport === item.id) ? 'text-slate-400' : 'text-slate-300')}>
                                {item.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100" />

            {/* Type */}
            <div>
                <p className="mb-2.5 text-[9px] font-black tracking-[0.35em] text-slate-400 uppercase">Tipe</p>
                <div className="flex flex-col gap-px">
                    {(['indoor', 'outdoor'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(selectedType === type ? null : type)}
                            className={cn(
                                'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium capitalize transition-all',
                                selectedType === type ? 'bg-slate-900 font-bold text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                            )}
                        >
                            <span className={cn('mr-2.5 h-2 w-2 rounded-full', type === 'indoor' ? 'bg-emerald-500' : 'bg-sky-500')} />
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100" />

            {/* Sort */}
            <div>
                <p className="mb-2.5 text-[9px] font-black tracking-[0.35em] text-slate-400 uppercase">Urutkan</p>
                <div className="flex flex-col gap-px">
                    {([
                        { value: 'default', label: 'Default' },
                        { value: 'price_asc', label: 'Harga Terendah' },
                        { value: 'price_desc', label: 'Harga Tertinggi' },
                    ] as const).map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={cn(
                                'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-all',
                                sortBy === opt.value ? 'bg-slate-900 font-bold text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reset */}
            {(activeFilterCount > 0 || search || sortBy !== 'default') && (
                <button
                    onClick={resetFilters}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-red-400 transition-colors hover:text-red-600"
                >
                    <X className="h-3.5 w-3.5" /> Reset Filter
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans">
            <Head title="Semua Lapangan — Sofiah Sport Center" />

            {/* ── Floating Pill Navbar ── */}
            <nav className={cn('fixed inset-x-0 top-0 z-50 px-5 transition-all duration-500 lg:px-8', isScrolled ? 'pt-3' : 'pt-4')}>
                <div className={cn('mx-auto flex max-w-7xl items-center justify-between gap-3 transition-all duration-500', isScrolled ? 'rounded-full border border-slate-200/60 bg-white/80 px-4 py-2.5 shadow-lg shadow-slate-900/[0.04] backdrop-blur-xl sm:px-6' : 'bg-white/60 px-4 py-2.5 backdrop-blur-md sm:px-6 rounded-full border border-slate-200/40')}>

                    {/* Logo */}
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden">
                            <img src="/images/logo-removebg-preview.png" alt="Logo" className="h-full w-full object-contain" />
                        </div>
                        <span className="hidden font-display text-lg font-bold tracking-tight text-slate-900 sm:block">Sofiah</span>
                    </Link>

                    {/* Center links */}
                    <div className={cn('hidden items-center gap-1 rounded-full p-1.5 sm:flex', isScrolled ? 'bg-slate-100/80' : 'bg-slate-100/60')}>
                        {navLinks.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                                    item.href === '/lapangan'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900',
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileNavOpen(!mobileNavOpen)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 sm:hidden"
                    >
                        {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="h-6 w-px bg-slate-200" />
                        {auth?.user ? (
                            <Link href={dashboard()} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={login()} className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:block">
                                    Masuk
                                </Link>
                                {canRegister && (
                                    <Link href={register()} className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600 sm:text-sm">
                                        Daftar
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile dropdown */}
                <div className={cn('mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl transition-all duration-300 sm:hidden', mobileNavOpen ? 'max-h-64 border border-slate-200/60 bg-white/95 opacity-100 shadow-lg backdrop-blur-xl' : 'max-h-0 opacity-0')}>
                    <div className="flex flex-col gap-0.5 p-2.5">
                        {navLinks.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileNavOpen(false)}
                                className={cn('rounded-2xl px-5 py-3 text-sm font-semibold transition-colors', item.href === '/lapangan' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* ── Page header ── */}
            <div className="border-b border-slate-200/80 bg-white pt-24 pb-8 lg:pt-28">
                <div className="mx-auto max-w-screen-2xl px-6 lg:px-8">
                    <p className="mb-1 text-[10px] font-black tracking-[0.4em] text-emerald-500 uppercase">Sofiah Sport Center</p>
                    <h1 className="font-display text-3xl font-black leading-none text-slate-900 lg:text-4xl">SEMUA LAPANGAN</h1>
                    <p className="mt-2 text-sm text-slate-400">{courts.length} lapangan tersedia untuk Anda</p>
                </div>
            </div>

            {/* ── Main layout ── */}
            <div className="mx-auto flex w-full max-w-screen-2xl min-h-screen">

                {/* ── Sidebar — no card, blends into bg ── */}
                <aside className="hidden w-56 shrink-0 border-r border-slate-200/80 bg-white lg:block xl:w-64">
                    <div className="sticky top-20 px-5 py-8 xl:px-6">
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-[9px] font-black tracking-[0.35em] text-slate-400 uppercase">Filter & Urutkan</p>
                            {(activeFilterCount > 0 || search || sortBy !== 'default') && (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">
                                    {activeFilterCount + (search ? 1 : 0) + (sortBy !== 'default' ? 1 : 0)}
                                </span>
                            )}
                        </div>
                        <FilterPanel />
                    </div>
                </aside>

                {/* ── Right content — no container, blends ── */}
                <div className="flex-1 overflow-hidden">

                    {/* Toolbar strip */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-3 lg:px-8">
                        {/* Mobile: search + filter button */}
                        <div className="flex flex-1 items-center gap-3 lg:hidden">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari lapangan..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pr-4 pl-8 text-sm focus:border-emerald-400 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setMobileFilterOpen(true)}
                                className="relative flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600"
                            >
                                <Filter className="h-3.5 w-3.5" /> Filter
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">{activeFilterCount}</span>
                                )}
                            </button>
                        </div>

                        {/* Desktop: results count */}
                        <p className="hidden text-sm text-slate-500 lg:block">
                            <span className="font-bold text-slate-900">{filtered.length}</span> lapangan ditemukan
                            {selectedSport && <> · <span className="font-semibold text-emerald-600">{sports.find(s => s.id === selectedSport)?.name}</span></>}
                            {selectedType && <> · <span className="font-semibold capitalize text-emerald-600">{selectedType}</span></>}
                        </p>
                    </div>

                    {/* Grid — no container, just padding */}
                    <div className="px-6 py-8 lg:px-8">
                        {filtered.length > 0 ? (
                            <div className="grid grid-cols-1 gap-px sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {filtered.map(court => (
                                    <CourtCard key={court.id} court={court} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-28 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                    <Search className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="font-display text-lg font-black text-slate-900">Tidak ada lapangan</h3>
                                <p className="mt-1 text-sm text-slate-500">Coba ubah filter atau kata pencarian</p>
                                <button onClick={resetFilters} className="mt-5 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
                                    Reset Filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Mobile filter drawer ── */}
            {mobileFilterOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
                    <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <span className="font-display text-lg font-black text-slate-900">Filter</span>
                            <button onClick={() => setMobileFilterOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <FilterPanel />
                        <div className="mt-6">
                            <button onClick={() => setMobileFilterOpen(false)} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white">
                                Terapkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 bg-white px-6 py-16 lg:px-12">
                <div className="mx-auto max-w-screen-2xl grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-16">
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
                <div className="mx-auto max-w-screen-2xl mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
                    <p className="text-sm font-medium text-slate-400">&copy; {new Date().getFullYear()} Sofiah Sport Center. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
