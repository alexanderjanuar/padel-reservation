#!/bin/bash

FILE="resources/js/pages/Admin/Courts.tsx"

# Extract lines 1-370
head -n 370 "$FILE" > temp_courts.tsx

# Append the new replacement block
cat << 'REPLACEMENT' >> temp_courts.tsx
                    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px] pb-6">
                        {/* Left Column: Scrollable List (Lapangans) */}
                        <div className="w-full lg:w-[320px] xl:w-[380px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 pb-20 lg:pb-0">
                            {courts
                                .filter(court => selectedSportIds.length === 0 || selectedSportIds.includes(court.sport_id))
                                .map(court => {
                                    const isSelected = selectedCourtId === court.id;
                                    return (
                                        <button
                                            key={court.id}
                                            onClick={() => setSelectedCourtId(court.id)}
                                            className={cn(
                                                "group text-left relative flex flex-row items-center bg-white rounded-2xl border p-2.5 gap-3 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 w-full",
                                                isSelected 
                                                    ? "border-padel-green ring-1 ring-padel-green shadow-md bg-emerald-50/10" 
                                                    : "border-slate-100 hover:border-padel-green-200 hover:shadow-md"
                                            )}
                                        >
                                            {/* Image Thumbnail */}
                                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                                <img
                                                    src={court.venue?.images && court.venue.images.length > 0 
                                                        ? `/storage/${court.venue.images[0]}` 
                                                        : "https://images.unsplash.com/photo-1622225369201-020e408ec9cc?q=80&w=400&h=400&auto=format&fit=crop"
                                                    }
                                                    alt={court.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </div>

                                            {/* Minimalist Info */}
                                            <div className="flex-1 min-w-0 pr-1 py-1 flex flex-col justify-center h-full">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h3 className={cn(
                                                        "font-heading text-base font-bold truncate transition-colors",
                                                        isSelected ? "text-padel-green" : "text-slate-900 group-hover:text-padel-green"
                                                    )}>
                                                        {court.name}
                                                    </h3>
                                                    {/* Status Dot */}
                                                    {court.is_booked_now ? (
                                                        <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]"></div>
                                                    ) : !court.is_active ? (
                                                        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                                                    ) : (
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium mb-1.5 truncate">
                                                    <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                                    <span className="truncate">{court.venue?.name}</span>
                                                </p>
                                                <div className="font-heading text-sm font-bold text-slate-900 mt-auto">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(court.price_per_hour)}<span className="text-[10px] text-slate-400 font-medium font-sans">/jam</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>

                        {/* Right Column: Detailed View */}
                        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col relative h-full">
                            {(() => {
                                const selectedCourt = courts.find(c => c.id === selectedCourtId);
                                
                                if (!selectedCourt) {
                                    return (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                                            <LayoutGrid className="h-12 w-12 mb-4 opacity-50" />
                                            <p className="font-semibold text-lg text-slate-600 mb-1">Pilih Lapangan</p>
                                            <p className="text-sm max-w-[250px]">Pilih lapangan dari daftar di sebelah kiri untuk melihat detail lengkapnya.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex flex-col h-full overflow-y-auto animate-in fade-in slide-in-from-right-2 duration-300">
                                        {/* Large Hero Image */}
                                        <div className="w-full h-[240px] lg:h-[320px] relative bg-slate-100 flex-shrink-0">
                                            <img
                                                src={selectedCourt.venue?.images && selectedCourt.venue.images.length > 0 
                                                    ? `/storage/${selectedCourt.venue.images[0]}` 
                                                    : "https://images.unsplash.com/photo-1622225369201-020e408ec9cc?q=80&w=400&h=400&auto=format&fit=crop"
                                                }
                                                alt={selectedCourt.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Gradient Overlay for Top Actions */}
                                            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none"></div>
                                            
                                            {/* Actions */}
                                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingCourt(selectedCourt);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 hover:text-padel-green hover:bg-white shadow-lg transition-all hover:scale-105"
                                                    title="Edit Lapangan"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDeletingCourt(selectedCourt);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 hover:text-red-600 hover:bg-white shadow-lg transition-all hover:scale-105"
                                                    title="Hapus Lapangan"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="absolute bottom-4 left-6 flex">
                                                {selectedCourt.is_booked_now ? (
                                                    <div className="bg-red-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-100 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                                        </span>
                                                        BOOKED SEKARANG
                                                    </div>
                                                ) : (
                                                    <div className="bg-padel-green/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-padel-green-100 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                                        </span>
                                                        TERSEDIA SAAT INI
                                                    </div>
                                                )}
                                                
                                                {!selectedCourt.is_active && (
                                                    <div className="ml-2 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                                                        NONAKTIF
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Detailed Content Header */}
                                        <div className="p-6 md:p-8 flex-1 flex flex-col">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
                                                <div className="space-y-2">
                                                    <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                                        {selectedCourt.name}
                                                    </h2>
                                                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                                                        <MapPin className="h-4 w-4 text-slate-400" />
                                                        <span>{selectedCourt.venue?.name}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col md:items-end">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tarif per Jam</p>
                                                    <p className="font-heading text-3xl font-extrabold text-padel-green">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedCourt.price_per_hour)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Feature Pills */}
                                            <h4 className="text-sm font-bold text-slate-900 mb-4 px-1">Fasilitas & Kategori Lapangan</h4>
                                            <div className="flex flex-wrap gap-3 mb-8">
                                                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-slate-200/80 text-sm font-semibold text-slate-700 bg-slate-50/50">
                                                    <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex justify-center items-center shadow-sm">
                                                        <Trophy className="h-4 w-4 text-padel-green" />
                                                    </div>
                                                    {selectedCourt.sport?.name}
                                                </div>
                                                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-slate-200/80 text-sm font-semibold text-slate-700 bg-slate-50/50">
                                                    <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex justify-center items-center shadow-sm">
                                                        <Activity className="h-4 w-4 text-sky-500" />
                                                    </div>
                                                    <span className="capitalize">{selectedCourt.type} Court</span>
                                                </div>
                                                {selectedCourt.is_active && (
                                                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-slate-200/80 text-sm font-semibold text-slate-700 bg-slate-50/50">
                                                        <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex justify-center items-center shadow-sm">
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        Aktif & Bisa Dipesan
                                                    </div>
                                                )}
                                            </div>

                                            {/* Temporary Placeholder for more info like description or rules */}
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mt-auto">
                                                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4 text-padel-green" />
                                                    Info Penting
                                                </h4>
                                                <p className="text-sm text-slate-500 leading-relaxed">
                                                    Harap diperhatikan bahwa harga dapat berubah untuk pemesanan pada waktu premium (malam hari atau akhir pekan). Pembatalan harus dilakukan selambat-lambatnya 24 jam sebelum jadwal bermain.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
REPLACEMENT

# Append lines from 478 to the end
tail -n +478 "$FILE" >> temp_courts.tsx

# Replace original file
mv temp_courts.tsx "$FILE"
chmod +x update_courts.sh
./update_courts.sh
rm update_courts.sh
