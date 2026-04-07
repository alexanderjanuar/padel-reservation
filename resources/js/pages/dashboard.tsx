import { Head, Link, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    CalendarDays,
    MapPin,
    Trophy,
    Clock,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Hourglass,
    Star,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard, home } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
];

type Booking = {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    total_price: number;
    court: {
        id: number;
        name: string;
        type: string;
        sport: { name: string; icon: string | null };
        venue: {
            id: number;
            name: string;
            city: string;
            image_url: string | null;
        };
    };
};

type Props = {
    stats: {
        totalBookings: number;
        upcomingBookingsCount: number;
        favoriteVenue: string;
    };
    upcomingBookings: Booking[];
    pastBookings: Booking[];
};

const STATUS_CONFIG = {
    confirmed: {
        label: 'Dikonfirmasi',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
    },
    pending: {
        label: 'Menunggu',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Hourglass,
    },
    completed: {
        label: 'Selesai',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: CheckCircle2,
    },
    cancelled: {
        label: 'Dibatalkan',
        className: 'bg-red-50 text-red-600 border-red-200',
        icon: XCircle,
    },
} as const;

function StatusBadge({ status }: { status: Booking['status'] }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${cfg.className}`}
        >
            {cfg.label}
        </span>
    );
}

function formatTime(time: string) {
    return time.substring(0, 5);
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function Dashboard({
    stats,
    upcomingBookings,
    pastBookings,
}: Props) {
    const { auth } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-8">
                {/* ── Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                            Selamat datang kembali
                        </p>
                        <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
                            {auth.user.name.split(' ')[0]}
                        </h1>
                        <p className="text-sm text-slate-500">
                            Pantau jadwal dan riwayat reservasi lapangan Anda.
                        </p>
                    </div>
                    <Link
                        href={home().url}
                        className="inline-flex items-center gap-2 self-start rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95 sm:self-auto"
                    >
                        Pesan Lapangan
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                    Total Bermain
                                </p>
                                <p className="mt-2 font-heading text-4xl font-bold text-slate-900">
                                    {stats.totalBookings}
                                </p>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    sesi
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                                <Trophy className="h-5 w-5 text-emerald-500" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                    Jadwal Mendatang
                                </p>
                                <p className="mt-2 font-heading text-4xl font-bold text-slate-900">
                                    {stats.upcomingBookingsCount}
                                </p>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    pertandingan
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                                <CalendarDays className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                    Venue Favorit
                                </p>
                                <p className="mt-2 truncate pr-2 font-heading text-lg font-bold text-slate-900">
                                    {stats.favoriteVenue === '-'
                                        ? '—'
                                        : stats.favoriteVenue}
                                </p>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    paling sering dipesan
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                                <Star className="h-5 w-5 text-amber-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Content ── */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Upcoming Bookings */}
                    <div className="flex flex-col gap-4 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <h2 className="font-heading text-base font-bold text-slate-900">
                                Jadwal Mendatang
                            </h2>
                            <span className="text-[11px] font-semibold text-slate-400">
                                {upcomingBookings.length} reservasi
                            </span>
                        </div>

                        {upcomingBookings.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {upcomingBookings.map((booking) => {
                                    const parsedDate = parseISO(booking.date);
                                    return (
                                        <div
                                            key={booking.id}
                                            className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                                        >
                                            {/* Date chip */}
                                            <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-slate-100 bg-slate-50 py-5">
                                                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                    {format(parsedDate, 'MMM', {
                                                        locale: id,
                                                    })}
                                                </span>
                                                <span className="mt-0.5 font-heading text-3xl leading-none font-black text-slate-900">
                                                    {format(parsedDate, 'dd')}
                                                </span>
                                                <span className="mt-1.5 text-[11px] font-bold text-emerald-500">
                                                    {formatTime(
                                                        booking.start_time,
                                                    )}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-5 py-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-heading text-sm font-bold text-slate-900">
                                                            {booking.court.name}
                                                        </p>
                                                        <div className="mt-0.5 flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                                                            <p className="truncate text-[12px] text-slate-500">
                                                                {
                                                                    booking
                                                                        .court
                                                                        .venue
                                                                        .name
                                                                }
                                                                {booking.court
                                                                    .venue.city
                                                                    ? ` · ${booking.court.venue.city}`
                                                                    : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <StatusBadge
                                                        status={booking.status}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-[12px] text-slate-400">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTime(
                                                            booking.start_time,
                                                        )}{' '}
                                                        –{' '}
                                                        {formatTime(
                                                            booking.end_time,
                                                        )}
                                                        {booking.court.sport
                                                            ?.name && (
                                                            <span className="ml-2 rounded-md border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                                                {
                                                                    booking
                                                                        .court
                                                                        .sport
                                                                        .name
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[12px] font-bold text-slate-700">
                                                        {formatCurrency(
                                                            booking.total_price,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-14 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                                    <CalendarDays className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-700">
                                    Belum ada jadwal mendatang
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Yuk, pesan lapangan untuk sesi berikutnya!
                                </p>
                                <Link
                                    href={home().url}
                                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-emerald-500 hover:text-emerald-500"
                                >
                                    Cari Lapangan
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-heading text-base font-bold text-slate-900">
                                Riwayat Terakhir
                            </h2>
                            <span className="text-[11px] font-semibold text-slate-400">
                                {pastBookings.length} sesi
                            </span>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {pastBookings.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {pastBookings.map((booking) => {
                                        const parsedDate = parseISO(
                                            booking.date,
                                        );
                                        return (
                                            <div
                                                key={booking.id}
                                                className="flex items-center gap-3 px-4 py-3.5"
                                            >
                                                <div className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                                                    <span className="text-[9px] leading-none font-bold text-slate-400 uppercase">
                                                        {format(
                                                            parsedDate,
                                                            'MMM',
                                                            { locale: id },
                                                        )}
                                                    </span>
                                                    <span className="font-heading text-sm leading-none font-black text-slate-700">
                                                        {format(
                                                            parsedDate,
                                                            'dd',
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[13px] font-semibold text-slate-800">
                                                        {
                                                            booking.court.venue
                                                                .name
                                                        }
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        {booking.court.name}
                                                    </p>
                                                </div>
                                                <StatusBadge
                                                    status={booking.status}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Clock className="mb-2 h-7 w-7 text-slate-300" />
                                    <p className="text-xs font-medium text-slate-400">
                                        Belum ada riwayat.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
