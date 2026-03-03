import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    MapPin,
    Search,
    Star,
    Trophy,
    Activity,
    Clock,
    CheckCircle2,
    ChevronRight,
} from 'lucide-react';
import HeroSection from '@/components/Welcome/HeroSection';
import { dashboard, login, register } from '@/routes';

// Mock Interfaces based on database schema
interface Sport {
    id: number;
    name: string;
    slug: string;
    icon: any; // Lucide icon reference
}

interface Venue {
    id: number;
    name: string;
    slug: string;
    address: string;
    city: string;
    price: string;
    rating: number;
    image_url: string;
    is_active: boolean;
}

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    // Mock data for sports
    const sports: Sport[] = [
        { id: 1, name: 'Padel', slug: 'padel', icon: Activity },
        { id: 2, name: 'Tennis', slug: 'tennis', icon: Trophy },
        { id: 3, name: 'Badminton', slug: 'badminton', icon: Activity },
        { id: 4, name: 'Mini Soccer', slug: 'mini-soccer', icon: Activity },
        { id: 5, name: 'Basketball', slug: 'basketball', icon: Trophy },
    ];

    // Mock data for venues based on the new schema structure
    const featuredVenues: Venue[] = [
        {
            id: 1,
            name: 'The Padel Garden',
            slug: 'the-padel-garden',
            address: 'Jl. Senopati No. 45',
            city: 'Jakarta Selatan',
            price: 'Rp 350.000 / jam',
            rating: 4.8,
            image_url: 'https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            is_active: true,
        },
        {
            id: 2,
            name: 'Oasis Courts',
            slug: 'oasis-courts',
            address: 'Kawasan Gelora Bung Karno',
            city: 'Jakarta Pusat',
            price: 'Rp 450.000 / jam',
            rating: 4.9,
            image_url: 'https://images.unsplash.com/photo-1698656005701-4ec1e1dcf638?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            is_active: true,
        },
        {
            id: 3,
            name: 'Arena 7 Sports Club',
            slug: 'arena-7-sports-club',
            address: 'Pantai Indah Kapuk',
            city: 'Jakarta Utara',
            price: 'Rp 400.000 / jam',
            rating: 4.7,
            image_url: 'https://images.unsplash.com/photo-1644781702528-7aa6fd386fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            is_active: true,
        },
        {
            id: 4,
            name: 'South Quarter Arena',
            slug: 'south-quarter-arena',
            address: 'Cilandak',
            city: 'Jakarta Selatan',
            price: 'Rp 300.000 / jam',
            rating: 4.6,
            image_url: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            is_active: true,
        },
    ];

    const steps = [
        {
            id: 1,
            title: 'Find Your Sport',
            description: 'Choose from padel, tennis, and more at top-rated venues near you.',
            icon: Search,
        },
        {
            id: 2,
            title: 'Pick a Time',
            description: 'Check real-time availability and secure your preferred time slot instantly.',
            icon: Clock,
        },
        {
            id: 3,
            title: 'Play & Dominate',
            description: 'Show up, checking in seamlessly, and focus on the game.',
            icon: CheckCircle2,
        },
    ];

    return (
        <div className="min-h-screen bg-padel-light font-sans text-padel-dark selection:bg-padel-green selection:text-white">
            <Head title="Book Sports Venues" />

            {/* Top Navigation */}
            <nav className="border-b border-padel-border bg-white sticky top-0 z-50">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center bg-padel-dark text-white">
                            <Trophy className="h-4 w-4" />
                        </div>
                        <span className="font-heading text-xl font-bold tracking-tight text-padel-dark">
                            RESERVE
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex h-10 items-center justify-center bg-padel-dark px-6 text-sm font-semibold text-white transition-colors hover:bg-black"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="text-sm font-semibold text-padel-dark transition-colors hover:text-padel-green-dark hidden sm:block"
                                >
                                    Log In
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-flex h-10 items-center justify-center bg-padel-green px-6 text-sm font-bold text-white transition-colors hover:bg-padel-green-dark"
                                    >
                                        Sign Up
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <HeroSection />

            {/* Sports Selection Grid */}
            <section className="relative z-0 border-y border-padel-border bg-white pt-32 pb-16">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="font-heading text-3xl font-extrabold text-padel-dark mb-2">CHOOSE YOUR SPORT</h2>
                            <p className="text-padel-muted text-lg">We partner with the best facilities across multiple disciplines.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {sports.map((sport) => {
                            const Icon = sport.icon;
                            return (
                                <Link
                                    key={sport.id}
                                    href={`/sports/${sport.slug}`}
                                    className="group flex flex-col items-center justify-center border border-padel-border bg-padel-light p-8 transition-all hover:border-padel-dark hover:bg-padel-dark hover:text-white"
                                >
                                    <Icon className="h-10 w-10 mb-4 text-padel-dark transition-colors group-hover:text-white" />
                                    <span className="font-bold text-lg">{sport.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Featured Venues */}
            <section className="bg-padel-light py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="font-heading text-3xl font-extrabold text-padel-dark mb-2">PREMIUM VENUES</h2>
                            <p className="text-padel-muted text-lg">Top-rated courts available for booking right now.</p>
                        </div>
                        <Link href="/venues" className="inline-flex items-center font-bold text-padel-dark hover:text-padel-green transition-colors group">
                            View All Directory <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredVenues.map((venue) => (
                            <div key={venue.id} className="group flex flex-col bg-white border border-padel-border transition-all hover:shadow-lg">
                                {/* Image Box */}
                                <div className="relative h-48 overflow-hidden bg-padel-dark">
                                    <img
                                        src={venue.image_url}
                                        alt={venue.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                    />
                                    <div className="absolute top-3 left-3 bg-white px-2 py-1 text-xs font-bold text-padel-dark flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-padel-dark text-padel-dark" />
                                        {venue.rating}
                                    </div>
                                </div>

                                {/* Content Box */}
                                <div className="p-5 flex flex-col flex-grow">
                                    <h3 className="font-heading text-xl font-bold text-padel-dark mb-1 leading-tight group-hover:text-padel-green-dark transition-colors">
                                        {venue.name}
                                    </h3>
                                    <div className="flex items-start gap-1.5 text-sm text-padel-muted mb-4">
                                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>{venue.city}</span>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-padel-border flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-padel-muted font-medium mb-0.5">Starting from</p>
                                            <p className="font-bold text-padel-dark">{venue.price}</p>
                                        </div>
                                        <Link
                                            href={`/venue/${venue.id}`}
                                            className="h-10 w-10 flex items-center justify-center bg-padel-light border border-padel-border text-padel-dark transition-colors group-hover:bg-padel-green group-hover:border-padel-green group-hover:text-white"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="border-t border-padel-border bg-white py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h2 className="font-heading text-3xl font-extrabold text-padel-dark mb-16">HOW IT WORKS</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 relative">
                        {/* Connecting Line for Desktop */}
                        <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-px bg-padel-border"></div>

                        {steps.map((step) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.id} className="relative flex flex-col items-center">
                                    <div className="h-24 w-24 bg-white border-2 border-padel-dark flex items-center justify-center mb-6 relative z-10 transition-transform hover:-translate-y-1">
                                        <Icon className="h-8 w-8 text-padel-dark" />
                                        <div className="absolute -top-3 -right-3 h-8 w-8 bg-padel-green text-white font-bold flex items-center justify-center text-sm">
                                            {step.id}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-xl text-padel-dark mb-3">{step.title}</h3>
                                    <p className="text-padel-muted max-w-xs">{step.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-padel-dark text-white py-12 border-t-4 border-padel-green">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-padel-green" />
                        <span className="font-heading text-xl font-bold tracking-widest text-white">
                            RESERVE
                        </span>
                    </div>
                    <div className="text-padel-muted text-sm font-medium">
                        &copy; {new Date().getFullYear()} Reserve Booking Systems. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
