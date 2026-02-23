import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard, home } from '@/routes';
import { CalendarDays, MapPin, Trophy, History, ArrowRight, Activity, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
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
        sport: {
            name: string;
            icon: string | null;
        };
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

export default function Dashboard({ stats, upcomingBookings, pastBookings }: Props) {
    const { auth } = usePage().props;

    const formatTime = (time: string) => time.substring(0, 5);

    const getStatusBadge = (status: Booking['status']) => {
        const styles = {
            confirmed: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
            pending: 'bg-amber-100 text-amber-700 ring-amber-600/20',
            completed: 'bg-blue-100 text-blue-700 ring-blue-600/20',
            cancelled: 'bg-red-100 text-red-700 ring-red-600/20',
        };

        const labels = {
            confirmed: 'Dikonfirmasi',
            pending: 'Menunggu',
            completed: 'Selesai',
            cancelled: 'Dibatalkan',
        };

        return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-hidden p-4 md:p-8 max-w-7xl mx-auto w-full">

                {/* ═══════════ 1. Welcome Hero Section ═══════════ */}
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-8 py-12 md:p-16 shadow-xl border border-slate-800">
                    {/* Background Pattern/Gradient */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-padel-green/30 via-slate-900 to-slate-900 opacity-60"></div>

                    {/* Abstract court lines graphic for premium feel */}
                    <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12 pointer-events-none">
                        <svg width="400" height="400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                            <rect x="10" y="10" width="80" height="80" />
                            <line x1="50" y1="10" x2="50" y2="90" />
                            <line x1="10" y1="30" x2="90" y2="30" />
                            <line x1="10" y1="70" x2="90" y2="70" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-xl">
                            <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl mb-3">
                                Halo, {auth.user.name.split(' ')[0]}! 👋
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed font-medium">
                                Siap untuk pertandingan selanjutnya? Temukan lawan, pesan lapangan, dan tingkatkan permainan Anda.
                            </p>
                        </div>

                        <Link
                            href={home().url}
                            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-padel-green px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-padel-green-dark hover:shadow-padel-green/20"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Pesan Lapangan Sekarang
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                            <div className="absolute inset-0 h-full w-full scale-0 rounded-full bg-white/20 transition-transform duration-300 ease-out group-hover:scale-100"></div>
                        </Link>
                    </div>
                </div>

                {/* ═══════════ 2. Quick Stats Grid ═══════════ */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {/* Stat Card 1 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute -right-6 -top-6 rounded-full bg-padel-green/10 p-8 transition-transform group-hover:scale-110">
                            <Trophy className="h-8 w-8 text-padel-green" />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Total Bermain</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold tracking-tight text-slate-900">{stats.totalBookings}</span>
                                <span className="text-sm font-medium text-slate-500">kali</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute -right-6 -top-6 rounded-full bg-blue-50 p-8 transition-transform group-hover:scale-110">
                            <CalendarDays className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Jadwal Mendatang</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold tracking-tight text-slate-900">{stats.upcomingBookingsCount}</span>
                                <span className="text-sm font-medium text-slate-500">pertandingan</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute -right-6 -top-6 rounded-full bg-amber-50 p-8 transition-transform group-hover:scale-110">
                            <MapPin className="h-8 w-8 text-amber-500" />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Venue Favorit</p>
                            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 truncate pr-8">
                                {stats.favoriteVenue}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══════════ 3. Main Content Split Layout ═══════════ */}
                <div className="grid gap-8 lg:grid-cols-3">

                    {/* Left Column: Upcoming Bookings */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-slate-900">
                                <Activity className="h-5 w-5 text-padel-green" />
                                Jadwal Mendatang
                            </h2>
                            <Link href="#" className="text-sm font-semibold text-padel-green hover:text-padel-green-dark">
                                Lihat Semua
                            </Link>
                        </div>

                        {upcomingBookings.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {upcomingBookings.map((booking) => (
                                    <div key={booking.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-padel-green/30 hover:shadow-md">
                                        <div className="flex flex-col sm:flex-row">
                                            {/* Date Block */}
                                            <div className="flex shrink-0 flex-col items-center justify-center border-b border-slate-100 bg-slate-50 p-6 sm:w-32 sm:border-b-0 sm:border-r">
                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                    {format(parseISO(booking.date), 'MMM', { locale: id })}
                                                </span>
                                                <span className="font-heading text-4xl font-bold text-slate-900">
                                                    {format(parseISO(booking.date), 'dd')}
                                                </span>
                                                <span className="mt-1 text-sm font-semibold text-padel-green">
                                                    {formatTime(booking.start_time)}
                                                </span>
                                            </div>

                                            {/* Details Block */}
                                            <div className="flex flex-1 flex-col justify-center p-6 sm:px-8">
                                                <div className="mb-2 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">{booking.court.sport.icon}</span>
                                                        <h3 className="font-heading text-lg font-bold text-slate-900">
                                                            {booking.court.name}
                                                        </h3>
                                                    </div>
                                                    {getStatusBadge(booking.status)}
                                                </div>

                                                <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                                                    <MapPin className="h-4 w-4 text-slate-400" />
                                                    {booking.court.venue.name} • {booking.court.venue.city}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-400">
                                                    Durasi: {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                                <div className="rounded-full bg-white p-4 shadow-sm mb-4">
                                    <CalendarDays className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Belum ada jadwal bermain</h3>
                                <p className="mt-1 text-sm text-slate-500 max-w-sm">Anda belum memiliki pemesanan lapangan mendatang. Ayo mulai bertanding!</p>
                                <Link
                                    href={home().url}
                                    className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50"
                                >
                                    Cari Lapangan
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-slate-900">
                                <History className="h-5 w-5 text-slate-400" />
                                Riwayat Terakhir
                            </h2>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            {pastBookings.length > 0 ? (
                                <div className="space-y-6">
                                    {pastBookings.map((booking, idx) => (
                                        <div key={booking.id} className="relative flex gap-4">
                                            {/* Timeline dot connecting lines (except for last item) */}
                                            {idx !== pastBookings.length - 1 && (
                                                <div className="absolute left-4 top-8 -bottom-6 w-0.5 bg-slate-100"></div>
                                            )}

                                            <div className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white">
                                                <Clock className="h-4 w-4 text-slate-500" />
                                            </div>

                                            <div className="flex flex-col pt-0.5 pb-2">
                                                <p className="text-sm font-bold text-slate-900 line-clamp-1">
                                                    {booking.court.venue.name}
                                                </p>
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                                    {format(parseISO(booking.date), 'dd MMM yyyy', { locale: id })}
                                                </p>
                                                <div className="mt-1">
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <History className="h-8 w-8 text-slate-300 mb-3" />
                                    <p className="text-sm font-medium text-slate-500">Belum ada riwayat aktivitas.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
