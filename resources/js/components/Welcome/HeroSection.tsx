import { Activity, Calendar, Clock, Flag, Search, Timer, Trophy, Users, Wind, Zap } from 'lucide-react';
import { useState } from 'react';

interface Sport {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
}

interface Props {
    sports: Sport[];
    popularLocations: string[];
}

const SPORT_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
    padel: Zap,
    tennis: Activity,
    badminton: Wind,
    'mini-soccer': Flag,
    futsal: Flag,
    basketball: Trophy,
};

const FALLBACK_SPORTS: Sport[] = [
    { id: 1, name: 'Padel', slug: 'padel', icon: null },
    { id: 2, name: 'Tennis', slug: 'tennis', icon: null },
    { id: 3, name: 'Badminton', slug: 'badminton', icon: null },
    { id: 4, name: 'Mini Soccer', slug: 'mini-soccer', icon: null },
];

const FALLBACK_LOCATIONS = ['Jakarta Selatan', 'Kebayoran', 'Senayan', 'Kelapa Gading', 'BSD City'];

const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = 6 + i;
    return `${String(hour).padStart(2, '0')}:00`;
});

function SportIcon({ sport, isActive }: { sport: Sport; isActive: boolean }) {
    if (sport.icon && sport.icon.trim().length > 0) {
        return <span className="text-sm leading-none">{sport.icon}</span>;
    }
    const FallbackIcon = SPORT_ICON_MAP[sport.slug] ?? Activity;
    return <FallbackIcon className={`h-3.5 w-3.5 transition-colors ${isActive ? 'text-padel-green' : 'text-padel-muted/60'}`} />;
}

export default function HeroSection({ sports: propSports, popularLocations: propLocations }: Props) {
    const displaySports = propSports.length > 0 ? propSports : FALLBACK_SPORTS;
    const displayLocations = propLocations.length > 0 ? propLocations : FALLBACK_LOCATIONS;

    const [activeSport, setActiveSport] = useState(displaySports[0]?.slug ?? 'padel');
    const [players, setPlayers] = useState(2);
    const today = new Date().toISOString().split('T')[0];

    return (
        <section className="relative min-h-screen overflow-hidden bg-padel-dark">
            {/* ── Background ── */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                    alt=""
                    className="h-full w-full object-cover opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-padel-dark via-padel-dark/88 to-padel-dark/50" />
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-padel-dark to-transparent" />

                {/* Atmosphere glows */}
                <div className="absolute -right-40 top-1/4 h-[600px] w-[600px] rounded-full bg-padel-green/8 blur-[100px]" />
                <div className="absolute left-1/4 top-1/2 h-[300px] w-[300px] rounded-full bg-padel-green/5 blur-[80px]" />

                {/* Court SVG lines */}
                <svg
                    className="absolute right-0 top-0 h-full w-1/2 opacity-[0.045]"
                    viewBox="0 0 440 700"
                    preserveAspectRatio="xMaxYMid slice"
                    fill="none"
                >
                    <rect x="60" y="80" width="320" height="540" stroke="white" strokeWidth="2" />
                    <line x1="220" y1="80" x2="220" y2="620" stroke="white" strokeWidth="1.5" />
                    <line x1="60" y1="350" x2="380" y2="350" stroke="white" strokeWidth="1.5" />
                    <rect x="120" y="265" width="200" height="170" stroke="white" strokeWidth="1" />
                    <circle cx="220" cy="350" r="55" stroke="white" strokeWidth="1" />
                    <line x1="60" y1="180" x2="380" y2="180" stroke="white" strokeWidth="1" />
                    <line x1="60" y1="520" x2="380" y2="520" stroke="white" strokeWidth="1" />
                </svg>
            </div>

            {/* ── Content ── */}
            <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-24 lg:px-8">
                {/* Top: hero copy */}
                <div className="max-w-xl">
                    <div
                        className="welcome-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-padel-green/35 bg-padel-green/10 px-4 py-2"
                        style={{ animationDelay: '0.05s' }}
                    >
                        <Zap className="h-3 w-3 text-padel-green" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-padel-green">
                            Platform Reservasi Olahraga #1
                        </span>
                    </div>

                    <h1
                        className="welcome-fade-up font-display leading-[0.92] text-white"
                        style={{ fontSize: 'clamp(72px, 13vw, 148px)', animationDelay: '0.15s' }}
                    >
                        TEMUKAN
                        <br />
                        <span className="text-padel-green">LAPANGAN</span>
                        <br />
                        TERBAIK
                    </h1>

                    <p
                        className="welcome-fade-up mt-6 max-w-[340px] text-[15px] leading-relaxed text-white/55"
                        style={{ animationDelay: '0.25s' }}
                    >
                        Pesan lapangan padel, tenis, badminton, dan lebih banyak lagi — cepat, mudah, terpercaya.
                    </p>

                    <div
                        className="welcome-fade-up mt-8 flex flex-wrap items-center gap-5"
                        style={{ animationDelay: '0.35s' }}
                    >
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-padel-green" />
                            <span className="text-sm font-semibold text-white/65">10K+ sesi terbooking</span>
                        </div>
                        <div className="h-4 w-px bg-white/20" />
                        <span className="text-sm font-semibold text-white/65">50+ venue aktif</span>
                        <div className="h-4 w-px bg-white/20" />
                        <span className="text-sm font-semibold text-white/65">5K+ pengguna</span>
                    </div>
                </div>

                {/* Bottom: search widget */}
                <div
                    className="welcome-scale-in mt-12 w-full"
                    style={{ animationDelay: '0.4s' }}
                >
                    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/50">

                        {/* ── Sport tabs ── */}
                        <div className="flex items-end gap-0.5 overflow-x-auto border-b border-padel-border/60 bg-slate-50 px-4 pt-3">
                            {displaySports.map((sport) => {
                                const active = activeSport === sport.slug;
                                return (
                                    <button
                                        key={sport.id}
                                        type="button"
                                        onClick={() => setActiveSport(sport.slug)}
                                        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                                            active
                                                ? '-mb-px border border-b-0 border-padel-border/60 bg-white pb-[calc(0.625rem+1px)] text-padel-dark'
                                                : 'text-padel-muted hover:text-padel-dark'
                                        }`}
                                    >
                                        <SportIcon sport={sport} isActive={active} />
                                        {sport.name}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Search fields ── */}
                        <div className="flex flex-col md:flex-row md:items-stretch">
                            {/* Location */}
                            <div className="flex flex-[2] flex-col border-b border-padel-border/40 px-5 py-4 transition-colors focus-within:bg-emerald-50/25 hover:bg-slate-50/80 md:border-b-0 md:border-r">
                                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-padel-dark/60">
                                    <Search className="h-3 w-3 text-padel-green" />
                                    Lokasi
                                </label>
                                <input
                                    type="text"
                                    placeholder="Kota atau nama venue"
                                    className="border-none bg-transparent p-0 text-[15px] font-semibold text-padel-dark outline-none placeholder:font-normal placeholder:text-padel-muted/45 focus:ring-0"
                                />
                            </div>

                            {/* Date */}
                            <div className="flex flex-1 flex-col border-b border-padel-border/40 px-5 py-4 transition-colors focus-within:bg-emerald-50/25 hover:bg-slate-50/80 md:border-b-0 md:border-r">
                                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-padel-dark/60">
                                    <Calendar className="h-3 w-3 text-padel-green" />
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    min={today}
                                    defaultValue={today}
                                    className="w-full cursor-pointer border-none bg-transparent p-0 text-[15px] font-semibold text-padel-dark outline-none focus:ring-0"
                                />
                            </div>

                            {/* Time */}
                            <div className="flex flex-1 flex-col border-b border-padel-border/40 px-5 py-4 transition-colors focus-within:bg-emerald-50/25 hover:bg-slate-50/80 md:border-b-0 md:border-r">
                                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-padel-dark/60">
                                    <Clock className="h-3 w-3 text-padel-green" />
                                    Mulai Pukul
                                </label>
                                <select className="cursor-pointer appearance-none border-none bg-transparent p-0 text-[15px] font-semibold text-padel-dark outline-none focus:ring-0">
                                    <option value="">Pilih waktu</option>
                                    {timeSlots.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Duration */}
                            <div className="flex flex-1 flex-col border-b border-padel-border/40 px-5 py-4 transition-colors focus-within:bg-emerald-50/25 hover:bg-slate-50/80 md:border-b-0 md:border-r">
                                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-padel-dark/60">
                                    <Timer className="h-3 w-3 text-padel-green" />
                                    Durasi
                                </label>
                                <select className="cursor-pointer appearance-none border-none bg-transparent p-0 text-[15px] font-semibold text-padel-dark outline-none focus:ring-0">
                                    <option value="1">1 Jam</option>
                                    <option value="1.5">1,5 Jam</option>
                                    <option value="2">2 Jam</option>
                                    <option value="3">3 Jam</option>
                                </select>
                            </div>

                            {/* Players — stepper */}
                            <div className="flex flex-1 flex-col border-b border-padel-border/40 px-5 py-4 md:border-b-0">
                                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-padel-dark/60">
                                    <Users className="h-3 w-3 text-padel-green" />
                                    Pemain
                                </label>
                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setPlayers(Math.max(2, players - 1))}
                                        disabled={players <= 2}
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-padel-border font-medium text-padel-dark transition-colors hover:border-padel-green hover:text-padel-green disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        −
                                    </button>
                                    <span className="w-16 text-center text-[15px] font-semibold text-padel-dark">
                                        {players} orang
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPlayers(Math.min(10, players + 1))}
                                        disabled={players >= 10}
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-padel-border font-medium text-padel-dark transition-colors hover:border-padel-green hover:text-padel-green disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Search CTA */}
                            <div className="flex items-center p-3">
                                <button
                                    type="button"
                                    className="flex h-full min-h-[60px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-padel-green px-7 font-bold text-white transition-all hover:bg-padel-green-dark active:scale-95 md:w-auto"
                                >
                                    <Search className="h-4 w-4" />
                                    Cari
                                </button>
                            </div>
                        </div>

                        {/* ── Popular searches footer ── */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-padel-border/40 bg-slate-50/70 px-5 py-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-padel-muted/70">
                                Populer:
                            </span>
                            {displayLocations.map((loc) => (
                                <button
                                    key={loc}
                                    type="button"
                                    className="rounded-full border border-padel-border/60 bg-white px-3 py-1 text-xs font-medium text-padel-dark transition-all hover:border-padel-green hover:text-padel-green"
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
