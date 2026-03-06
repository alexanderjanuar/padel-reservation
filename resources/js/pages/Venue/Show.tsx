import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    MapPin,
    Star,
    Calendar,
    ArrowRight,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

// Mock data
const MOCK_VENUE = {
    id: 1,
    name: 'The Padel Garden',
    location: 'Kebayoran Baru, Jakarta Selatan',
    description:
        'Fasilitas padel premium dengan standar internasional. Dilengkapi dengan rumput sintetis terbaik, pencahayaan optimal, dan fasilitas pendukung untuk pengalaman bermain yang tak terlupakan.',
    price: 'Rp 350.000 / jam',
    rating: 4.8,
    reviews: 124,
    facilities: [
        'Outdoor',
        'Kafe',
        'Kamar Mandi',
        'Sewa Raket',
        'Parkir Valet',
    ],
    image: 'https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
};

const COURTS = [
    { id: 1, name: 'Lapangan 1 - Utama' },
    { id: 2, name: 'Lapangan 2' },
    { id: 3, name: 'Lapangan 3 - Indoor' },
];

const TIME_SLOTS = [
    { time: '06:00', available: true },
    { time: '07:00', available: true },
    { time: '08:00', available: false },
    { time: '09:00', available: false },
    { time: '10:00', available: true },
    { time: '11:00', available: true },
    { time: '12:00', available: true },
    { time: '13:00', available: false },
    { time: '14:00', available: true },
    { time: '15:00', available: true },
    { time: '16:00', available: true },
    { time: '17:00', available: false },
    { time: '18:00', available: false },
    { time: '19:00', available: false },
    { time: '20:00', available: true },
    { time: '21:00', available: true },
    { time: '22:00', available: true },
    { time: '23:00', available: true },
];

export default function VenueShow({ id }: { id: string }) {
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedCourt, setSelectedCourt] = useState(COURTS[0].id);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-padel-light pb-32 font-sans text-padel-dark selection:bg-pink-500 selection:text-white lg:pb-0">
            <Head title={`${MOCK_VENUE.name} | Reservasi Padel`} />

            {/* Navigation Bar */}
            <nav className="fixed top-0 right-0 left-0 z-50 flex items-center border-b border-padel-border bg-white/90 px-6 py-4 shadow-sm backdrop-blur-md transition-all">
                <Link
                    href="/"
                    className="group inline-flex h-10 w-10 items-center justify-center rounded-lg border border-padel-border bg-white text-padel-dark transition-colors hover:bg-padel-light"
                >
                    <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </Link>
                <div className="ml-4 font-heading text-lg font-bold">
                    {MOCK_VENUE.name}
                </div>
            </nav>

            {/* Venue Hero Image */}
            <div className="relative mx-auto mt-16 h-[40vh] w-full max-w-7xl md:h-[50vh] md:px-6 md:pt-6">
                <div className="relative h-full w-full overflow-hidden border-x border-b border-padel-border shadow-sm md:rounded-2xl md:border">
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-padel-dark/80 via-padel-dark/20 to-transparent"></div>
                    <img
                        src={MOCK_VENUE.image}
                        alt={MOCK_VENUE.name}
                        className="h-full w-full object-cover"
                    />

                    {/* Overlay Content */}
                    <div className="absolute bottom-0 left-0 z-20 w-full px-6 py-8">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1 rounded-md bg-white px-3 py-1 text-xs font-bold text-padel-dark shadow-sm">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {MOCK_VENUE.rating} ({MOCK_VENUE.reviews}{' '}
                                Ulasan)
                            </div>
                            <div className="flex items-center gap-1 rounded-md border border-white/20 bg-padel-dark/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                                <MapPin className="h-3.5 w-3.5 text-padel-light" />
                                {MOCK_VENUE.location}
                            </div>
                        </div>
                        <h1 className="mb-2 font-heading text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                            {MOCK_VENUE.name}
                        </h1>
                    </div>
                </div>
            </div>

            <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 md:px-12 lg:flex-row">
                {/* Left Column: Details & Reservation */}
                <div className="flex-1 space-y-8">
                    {/* Description & Facilities */}
                    <section className="rounded-2xl border border-padel-border bg-white p-6 shadow-sm md:p-8">
                        <h2 className="mb-4 font-heading text-xl font-bold text-padel-dark">
                            Tentang Tempat Ini
                        </h2>
                        <p className="mb-6 leading-relaxed text-padel-muted">
                            {MOCK_VENUE.description}
                        </p>

                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-padel-dark">
                                Fasilitas
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {MOCK_VENUE.facilities.map((facility, i) => (
                                    <span
                                        key={i}
                                        className="flex items-center gap-1.5 rounded-lg border border-padel-border bg-padel-light px-3 py-1.5 text-sm font-medium text-padel-dark"
                                    >
                                        <ShieldCheck className="h-4 w-4 text-pink-600" />
                                        {facility}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Booking Section */}
                    <section className="rounded-2xl border border-padel-border bg-white p-6 shadow-sm md:p-8">
                        <div className="mb-6 flex items-center justify-between border-b border-padel-border pb-6">
                            <h2 className="font-heading text-2xl font-bold text-padel-dark">
                                Pesan Jadwal
                            </h2>
                            <div className="text-right">
                                <div className="mb-1 text-xs font-medium text-padel-muted">
                                    Harga Standar / Jam
                                </div>
                                <div className="font-heading text-xl font-bold text-pink-600">
                                    {MOCK_VENUE.price}
                                </div>
                            </div>
                        </div>

                        {/* Date Selector */}
                        <div className="mb-8">
                            <label className="mb-3 block text-sm font-bold text-padel-dark">
                                1. Pilih Tanggal
                            </label>
                            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                                {['today', 'tomorrow', 'next1', 'next2'].map(
                                    (dateConfig, i) => {
                                        const dateLabels = [
                                            'Hari Ini',
                                            'Besok',
                                            'Rab, 24 Feb',
                                            'Kam, 25 Feb',
                                        ];
                                        const isSelected =
                                            selectedDate === dateConfig;
                                        return (
                                            <button
                                                key={dateConfig}
                                                onClick={() =>
                                                    setSelectedDate(dateConfig)
                                                }
                                                className={`shrink-0 rounded-xl border px-5 py-4 transition-all duration-200 ${isSelected ? 'border-pink-500 bg-pink-500 text-white shadow-md' : 'border-padel-border bg-white text-padel-muted hover:border-pink-500 hover:text-padel-dark'}`}
                                            >
                                                <div
                                                    className={`mb-1 text-xs font-medium ${isSelected ? 'text-white/90' : ''}`}
                                                >
                                                    {dateLabels[i]}
                                                </div>
                                                <div className="font-heading text-xl font-bold">
                                                    {i === 0
                                                        ? '22'
                                                        : i === 1
                                                          ? '23'
                                                          : i === 2
                                                            ? '24'
                                                            : '25'}
                                                </div>
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>

                        {/* Court Selector */}
                        <div className="mb-8">
                            <label className="mb-3 block text-sm font-bold text-padel-dark">
                                2. Pilih Lapangan
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COURTS.map((court) => (
                                    <button
                                        key={court.id}
                                        onClick={() => {
                                            setSelectedCourt(court.id);
                                            setSelectedSlot(null); // Reset slot on court change
                                        }}
                                        className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${selectedCourt === court.id ? 'border-padel-dark bg-padel-dark text-white shadow-md' : 'border-padel-border bg-white text-padel-muted hover:border-padel-dark hover:text-padel-dark'}`}
                                    >
                                        {court.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Slots Grid */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <label className="block text-sm font-bold text-padel-dark">
                                    3. Pilih Waktu
                                </label>
                                <div className="flex items-center gap-3 text-xs font-semibold text-padel-muted">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded-sm border border-pink-500 bg-pink-500/20"></span>{' '}
                                        Tersedia
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded-sm border border-padel-border bg-padel-light"></span>{' '}
                                        Penuh
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                                {TIME_SLOTS.map((slot, i) => {
                                    const isSelected =
                                        selectedSlot === slot.time;
                                    let slotClasses =
                                        'relative py-3 rounded-lg font-heading font-semibold text-base border transition-all duration-200 ';
                                    if (!slot.available)
                                        slotClasses +=
                                            'bg-padel-light border-transparent text-padel-muted/50 cursor-not-allowed';
                                    else if (isSelected)
                                        slotClasses +=
                                            'bg-pink-500 border-pink-500 text-white shadow-md transform scale-105 z-10';
                                    else
                                        slotClasses +=
                                            'bg-white border-padel-border text-padel-dark hover:border-pink-500 hover:bg-pink-500/5';

                                    return (
                                        <button
                                            key={i}
                                            disabled={!slot.available}
                                            onClick={() =>
                                                setSelectedSlot(slot.time)
                                            }
                                            className={slotClasses}
                                        >
                                            {slot.time}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column / Sticky Footer: Booking Summary */}
                <div className="shrink-0 lg:w-[340px]">
                    <div className="sticky top-24 hidden rounded-2xl border border-padel-border bg-white p-6 shadow-sm lg:block">
                        <h3 className="mb-5 border-b border-padel-border pb-4 font-heading text-xl font-bold text-padel-dark">
                            Ringkasan Pesanan
                        </h3>

                        <div className="mb-6 space-y-4">
                            <div className="flex items-center justify-between text-padel-dark">
                                <div className="flex items-center gap-2 text-padel-muted">
                                    <Calendar className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        Tanggal
                                    </span>
                                </div>
                                <div className="text-right font-semibold">
                                    {selectedDate === 'today'
                                        ? 'Hari Ini'
                                        : selectedDate === 'tomorrow'
                                          ? 'Besok'
                                          : '24 Feb'}
                                    , 22 Feb 2026
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-padel-dark">
                                <div className="flex items-center gap-2 text-padel-muted">
                                    <MapPin className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        Lapangan
                                    </span>
                                </div>
                                <div className="text-right font-semibold">
                                    {
                                        COURTS.find(
                                            (c) => c.id === selectedCourt,
                                        )?.name
                                    }
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-padel-dark">
                                <div className="flex items-center gap-2 text-padel-muted">
                                    <Clock className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        Waktu
                                    </span>
                                </div>
                                <div className="text-right font-semibold">
                                    {selectedSlot
                                        ? `${selectedSlot} - ${String(parseInt(selectedSlot) + 1).padStart(2, '0')}:00`
                                        : '-'}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 rounded-xl border border-padel-border bg-padel-light p-4 text-center">
                            <span className="mb-1 block text-xs font-medium text-padel-muted">
                                Total Tagihan (1 jam)
                            </span>
                            <span className="font-heading text-2xl font-bold text-padel-dark">
                                {selectedSlot ? 'Rp 350.000' : 'Rp 0'}
                            </span>
                        </div>

                        <button
                            disabled={!selectedSlot}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold transition-all duration-300 ${selectedSlot ? 'bg-padel-dark text-white shadow-md hover:bg-black' : 'cursor-not-allowed border border-padel-border bg-padel-light text-padel-muted'}`}
                        >
                            {selectedSlot ? (
                                <>
                                    Konfirmasi Pesanan{' '}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            ) : (
                                'Pilih Waktu'
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Sticky Footer */}
                <div
                    className={`fixed right-0 bottom-0 left-0 z-50 transform border-t border-padel-border bg-white p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 lg:hidden ${selectedSlot ? 'translate-y-0' : 'translate-y-[120%]'}`}
                >
                    <div className="mb-3 flex items-center justify-between px-1">
                        <div>
                            <div className="text-xs font-medium text-padel-muted">
                                Jadwal Dipilih
                            </div>
                            <div className="font-semibold text-padel-dark">
                                {selectedSlot} - Lapangan {selectedCourt}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-medium text-padel-muted">
                                Total
                            </div>
                            <div className="font-heading text-xl font-bold text-padel-dark">
                                Rp 350.000
                            </div>
                        </div>
                    </div>
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-padel-dark py-3.5 text-base font-bold text-white shadow-md">
                        Konfirmasi Pesanan <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </main>
        </div>
    );
}
