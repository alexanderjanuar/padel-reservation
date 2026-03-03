import { ArrowRight, Calendar, Search, Users } from 'lucide-react';
import { useState } from 'react';

export default function HeroSection() {
    const [activeTab, setActiveTab] = useState('Padel');
    const tabs = ['Padel', 'Tennis', 'Badminton'];

    return (
        <section className="relative w-full pb-56 pt-24 md:pb-64 lg:pt-32">
            {/* Full-width airy background image */}
            <div className="absolute inset-0 z-0 bg-padel-light">
                <img
                    src="https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                    alt="Padel court"
                    className="h-full w-full object-cover opacity-70 mix-blend-multiply filter contrast-[0.9] brightness-[1.1]"
                // We use a light overlay mask to ensure the dark text remains legible over the image details
                />
                <div className="absolute inset-0 bg-gradient-to-r from-padel-light via-padel-light/80 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start px-6 lg:px-8">
                <h1 className="mb-4 max-w-2xl font-heading text-6xl font-black leading-[1.0] tracking-tighter text-padel-dark md:text-8xl">
                    Temukan<br />
                    tempat<br />
                    bermain<br />
                    Anda.
                </h1>

                {/* Overlapping Booking Search Form Container */}
                <div className="absolute left-6 right-6 lg:left-8 lg:right-8 bottom-0 z-20 translate-y-1/2">
                    <div className="mx-auto max-w-5xl">

                        {/* Category Pills */}
                        <div className="mb-3 flex items-center gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all ${activeTab === tab
                                        ? 'bg-padel-green text-white shadow-padel-green/30'
                                        : 'bg-white text-padel-muted hover:text-padel-dark hover:bg-gray-50'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Pill Search Bar */}
                        <div className="flex w-full flex-col gap-2 rounded-3xl bg-white p-2.5 shadow-2xl shadow-black/10 border border-padel-border/50 md:flex-row md:rounded-[40px] md:items-center">

                            {/* Location Input */}
                            <div className="flex flex-[1.5] items-center rounded-2xl bg-padel-light/50 px-5 py-3.5 transition-colors focus-within:bg-padel-light md:rounded-full">
                                <Search className="mr-3 h-5 w-5 shrink-0 text-padel-dark" />
                                <div className="flex w-full flex-col">
                                    <span className="text-xs font-bold text-padel-dark">Lokasi</span>
                                    <input
                                        type="text"
                                        placeholder="Cari kota atau area"
                                        className="w-full border-none bg-transparent p-0 font-medium text-padel-muted outline-none placeholder:text-padel-muted focus:ring-0 sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* Divider Line (hidden on mobile) */}
                            <div className="hidden h-10 w-[1px] bg-padel-border md:block"></div>

                            {/* Date Select */}
                            <div className="flex flex-1 items-center rounded-2xl bg-padel-light/50 px-5 py-3.5 transition-colors focus-within:bg-padel-light md:rounded-full">
                                <Calendar className="mr-3 h-5 w-5 shrink-0 text-padel-dark" />
                                <div className="flex w-full flex-col">
                                    <span className="text-xs font-bold text-padel-dark">Jadwal</span>
                                    <select className="w-full cursor-pointer appearance-none border-none bg-transparent p-0 font-medium text-padel-muted outline-none focus:ring-0 sm:text-sm">
                                        <option value="">Kapan saja</option>
                                        <option value="today">Hari ini</option>
                                        <option value="tomorrow">Besok</option>
                                    </select>
                                </div>
                            </div>

                            {/* Divider Line (hidden on mobile) */}
                            <div className="hidden h-10 w-[1px] bg-padel-border md:block"></div>

                            {/* Duration Select (representing "Guests" from reference) */}
                            <div className="flex flex-1 items-center rounded-2xl bg-padel-light/50 px-5 py-3.5 transition-colors focus-within:bg-padel-light md:rounded-full">
                                <Users className="mr-3 h-5 w-5 shrink-0 text-padel-dark" />
                                <div className="flex w-full flex-col">
                                    <span className="text-xs font-bold text-padel-dark">Durasi</span>
                                    <select className="w-full cursor-pointer appearance-none border-none bg-transparent p-0 font-medium text-padel-muted outline-none focus:ring-0 sm:text-sm">
                                        <option value="1">1 Jam</option>
                                        <option value="1.5">1.5 Jam</option>
                                        <option value="2">2 Jam</option>
                                    </select>
                                </div>
                            </div>

                            {/* Search Button */}
                            <button className="flex h-14 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-padel-green px-8 font-bold text-white transition-all hover:bg-padel-green-dark hover:shadow-lg hover:shadow-padel-green/30 md:h-auto md:w-auto md:min-h-[56px] md:rounded-full">
                                Cari Lapangan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
