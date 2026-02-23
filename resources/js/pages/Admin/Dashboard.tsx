import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { Users, CalendarDays, MapPin, DollarSign, Activity, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
];

type RecentBooking = {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    total_price: number;
    created_at: string;
    user: {
        id: number;
        name: string;
    };
    court: {
        id: number;
        name: string;
        venue: {
            id: number;
            name: string;
            city: string;
        };
    };
};

type Props = {
    stats: {
        totalUsers: number;
        totalBookings: number;
        totalVenues: number;
        totalRevenue: number;
    };
    recentBookings: RecentBooking[];
};

export default function AdminDashboard({ stats, recentBookings }: Props) {
    const { auth } = usePage().props;

    const formatTime = (time: string) => time.substring(0, 5);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: RecentBooking['status']) => {
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
            <Head title="Admin Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-hidden p-4 md:p-8 max-w-7xl mx-auto w-full">

                {/* ═══════════ 1. Admin Hero Section ═══════════ */}
                <div className="relative overflow-hidden rounded-[2rem] bg-indigo-950 px-8 py-10 md:p-12 shadow-xl border border-indigo-900">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-indigo-950 to-indigo-950 opacity-80"></div>

                    <div className="relative z-10 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-xl">
                            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-indigo-300 uppercase bg-indigo-900/50 rounded-full border border-indigo-800">
                                Administrator Control
                            </span>
                            <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl mb-2">
                                Selamat datang, {auth.user.name.split(' ')[0]}
                            </h1>
                            <p className="text-base text-indigo-200 leading-relaxed font-medium">
                                Ringkasan platform VibePadel hari ini.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══════════ 2. Platform Quick Stats ═══════════ */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Stat Card 1 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute -right-4 -top-4 rounded-full bg-blue-50 p-6 transition-transform group-hover:scale-110">
                            <Users className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="relative">
                            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Total User</p>
                            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                {stats.totalUsers}
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute -right-4 -top-4 rounded-full bg-emerald-50 p-6 transition-transform group-hover:scale-110">
                            <DollarSign className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div className="relative">
                            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Total Pendapatan</p>
                            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 truncate">
                                {formatCurrency(stats.totalRevenue)}
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute -right-4 -top-4 rounded-full bg-indigo-50 p-6 transition-transform group-hover:scale-110">
                            <CalendarDays className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div className="relative">
                            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Total Transaksi</p>
                            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                {stats.totalBookings}
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute -right-4 -top-4 rounded-full bg-purple-50 p-6 transition-transform group-hover:scale-110">
                            <MapPin className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="relative">
                            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Total Venue</p>
                            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                {stats.totalVenues}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ 3. Recent Platform Activity ═══════════ */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-slate-900">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            Transaksi Booking Terkini
                        </h2>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {recentBookings.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {recentBookings.map((booking) => (
                                    <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                                                <CalendarDays className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm">{booking.user.name}</span>
                                                    <span className="text-slate-400 text-xs px-1.5 py-0.5 rounded-md bg-slate-100">ID: #{booking.id}</span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                                    {booking.court.venue.name} — {booking.court.name}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Jadwal: {format(parseISO(booking.date), 'dd MMM yyyy', { locale: id })} ({formatTime(booking.start_time)} - {formatTime(booking.end_time)})
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                            <span className="font-bold text-slate-900 text-sm">
                                                {formatCurrency(booking.total_price)}
                                            </span>
                                            {getStatusBadge(booking.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Activity className="h-8 w-8 text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-500">Belum ada transaksi di platform.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
