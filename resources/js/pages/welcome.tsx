import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import {
    ArrowRight,
    Calendar,
    MapPin,
    Search,
    Star,
    Trophy,
} from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    // Mock data for venues to demonstrate the UI
    const featuredVenues = [
        {
            id: 1,
            name: 'The Padel Garden',
            location: 'Kebayoran Baru, Jakarta Selatan',
            price: 'Rp 350.000 / jam',
            rating: 4.8,
            courts: 4,
            image: 'https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            available: true,
        },
        {
            id: 2,
            name: 'Oasis Courts',
            location: 'Senayan, Jakarta Selatan',
            price: 'Rp 450.000 / jam',
            rating: 4.9,
            courts: 6,
            image: 'https://images.unsplash.com/photo-1698656005701-4ec1e1dcf638?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            available: true,
        },
        {
            id: 3,
            name: 'Cloud Padel Club',
            location: 'PIK, Jakarta Utara',
            price: 'Rp 400.000 / jam',
            rating: 4.7,
            courts: 3,
            image: 'https://images.unsplash.com/photo-1644781702528-7aa6fd386fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            available: false,
        },
    ];

    return (
        <div className="min-h-screen bg-padel-light font-sans text-padel-dark selection:bg-padel-green selection:text-white">
            <Head title="Reservasi Lapangan Padel" />

            {/* Navigation Bar */}
            <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-padel-border bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md transition-all">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-padel-green shadow-sm">
                        <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-heading text-xl font-bold tracking-tight text-padel-dark">
                        VibePadel
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {auth.user ? (
                        <Link
                            href={dashboard()}
                            className="rounded-full border border-padel-border bg-white px-6 py-2.5 text-sm font-medium shadow-sm transition-all duration-300 hover:border-padel-green hover:text-padel-green-dark"
                        >
                            Dasbor
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="px-5 py-2.5 text-sm font-medium text-padel-muted transition-colors hover:text-padel-dark"
                            >
                                Masuk
                            </Link>
                            {canRegister && (
                                <Link
                                    href={register()}
                                    className="rounded-full bg-padel-dark px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-black"
                                >
                                    Daftar
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative mx-auto flex max-w-7xl flex-col items-center justify-center px-6 pt-32 pb-20 text-center lg:px-8">
                <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-padel-green/30 bg-padel-green/10 px-4 py-2 text-xs font-medium tracking-wide text-padel-green-dark uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-padel-green"></span>
                    <span>Reservasi Cepat & Mudah</span>
                </div>

                <h1 className="animate-fade-in-up mb-6 max-w-4xl font-heading text-5xl leading-[1.1] font-extrabold tracking-tight text-padel-dark [animation-delay:100ms] md:text-7xl">
                    Pesan Lapangan Padel <br />
                    Lebih Mudah, Main Lebih Sering.
                </h1>

                <p className="animate-fade-in-up mb-10 max-w-xl text-lg font-normal text-padel-muted [animation-delay:200ms]">
                    Temukan lapangan padel premium di sekitar Anda. Cek
                    ketersediaan dan pesan jadwal bermain secara instan kapan
                    saja.
                </p>

                {/* Quick Search Bar */}
                <div className="animate-fade-in-up flex w-full max-w-3xl flex-col items-center gap-2 rounded-xl border border-padel-border bg-white p-2 shadow-md [animation-delay:300ms] md:flex-row md:rounded-full">
                    <div className="flex w-full flex-1 items-center px-4 py-3">
                        <Search className="mr-3 h-5 w-5 text-padel-muted" />
                        <input
                            type="text"
                            placeholder="Cari nama tempat atau area..."
                            className="w-full border-none bg-transparent font-sans text-padel-dark placeholder-padel-muted outline-none"
                        />
                    </div>
                    <div className="hidden h-8 w-[1px] bg-padel-border md:block"></div>
                    <div className="flex w-full flex-1 items-center px-4 py-3">
                        <Calendar className="mr-3 h-5 w-5 text-padel-muted" />
                        <select className="w-full cursor-pointer appearance-none border-none bg-transparent text-padel-dark outline-none">
                            <option value="">Kapan Saja</option>
                            <option value="today">Hari Ini</option>
                            <option value="tomorrow">Besok</option>
                        </select>
                    </div>
                    <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-padel-green px-8 py-3.5 text-lg font-medium text-white shadow-sm transition-all duration-300 hover:bg-padel-green-dark md:mt-0 md:w-auto md:rounded-full">
                        Cari Lapangan <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </main>

            {/* Featured Venues Section */}
            <section className="border-t border-padel-border bg-white px-6 py-20">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-10 flex flex-col justify-between md:flex-row md:items-end">
                        <div>
                            <h2 className="mb-2 font-heading text-3xl font-bold text-padel-dark">
                                Rekomendasi Tempat
                            </h2>
                            <p className="text-padel-muted">
                                Pilihan lapangan terbaik dengan fasilitas
                                lengkap untuk Anda.
                            </p>
                        </div>
                        <Link
                            href="#"
                            className="group mt-4 inline-flex items-center gap-2 font-medium text-padel-green-dark transition-colors hover:text-padel-green md:mt-0"
                        >
                            Lihat Semua
                            <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {featuredVenues.map((venue, i) => (
                            <Link
                                href={`/venue/${venue.id}`}
                                key={venue.id}
                                className="group animate-fade-in-up block overflow-hidden rounded-2xl border border-padel-border bg-padel-light transition-all duration-300 hover:border-padel-green/30 hover:shadow-lg"
                                style={{ animationDelay: `${(i + 4) * 100}ms` }}
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <div className="absolute inset-0 z-10 bg-black/10 transition-colors duration-500 group-hover:bg-transparent"></div>
                                    <img
                                        src={venue.image}
                                        alt={venue.name}
                                        className="h-full w-full transform object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    />
                                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                        {venue.available ? (
                                            <div className="rounded-md bg-white/95 px-3 py-1.5 text-xs font-bold tracking-wide text-padel-green-dark uppercase shadow-sm">
                                                Tersedia
                                            </div>
                                        ) : (
                                            <div className="rounded-md bg-white/95 px-3 py-1.5 text-xs font-bold tracking-wide text-padel-muted uppercase shadow-sm">
                                                Penuh
                                            </div>
                                        )}
                                        <div className="ml-auto flex w-fit items-center justify-center gap-1 self-end rounded-md bg-padel-dark px-3 py-1.5 text-right text-xs font-bold text-white shadow-sm">
                                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                            {venue.rating}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="mb-1 font-heading text-xl font-bold text-padel-dark transition-colors group-hover:text-padel-green-dark">
                                        {venue.name}
                                    </h3>
                                    <div className="mb-4 flex items-center text-sm text-padel-muted">
                                        <MapPin className="mr-1 h-4 w-4" />
                                        {venue.location}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-padel-border pt-4">
                                        <div className="flex flex-col">
                                            <span className="mb-0.5 text-xs font-medium text-padel-muted">
                                                Mulai dari
                                            </span>
                                            <span className="font-semibold text-padel-dark">
                                                {venue.price}
                                            </span>
                                        </div>
                                        <div className="rounded-lg border border-padel-border bg-white px-4 py-2 text-sm font-medium text-padel-dark transition-all duration-300 group-hover:border-padel-green group-hover:bg-padel-green group-hover:text-white">
                                            Pesan
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
