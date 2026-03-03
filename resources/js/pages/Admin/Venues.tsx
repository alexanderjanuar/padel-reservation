import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    ChevronUp,
    ChevronDown,
    Filter,
    Search,
    Download,
    Plus,
    Trophy,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    ImagePlus,
    X,
    Eye,
    UploadCloud,
    MapPin,
    ExternalLink,
} from 'lucide-react';
import React, { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const createCustomIcon = () => {
    return new L.DivIcon({
        html: `<div class="text-padel-green drop-shadow-md" style="margin-top:-32px; margin-left:-16px;"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15.006 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="white"/></svg></div>`,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });
};

// Component to handle map view updates
function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMapEvents({});

    // Only fly to if the distance is significant to avoid jitter
    useMemo(() => {
        map.flyTo(center, zoom);
    }, [center, zoom]);

    return null;
}

function LocationPicker({ position, onLocationSelect }: { position: [number, number] | null; onLocationSelect: (lat: number, lng: number, address?: string, city?: string) => void }) {
    const markerRef = useRef<L.Marker>(null);

    const handleLocationUpdate = async (lat: number, lng: number) => {
        // Optimistic update
        onLocationSelect(lat, lng);

        try {
            // Reverse Geocoding using Nominatim (OpenStreetMap)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();

            if (data && data.address) {
                // Extract convenient address parts
                const road = data.address.road || '';
                const houseNumber = data.address.house_number || '';
                const suburb = data.address.suburb || '';
                const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
                const state = data.address.state || '';
                const postCode = data.address.postcode || '';

                // Construct a clean full address string
                const parts = [
                    houseNumber ? `${road} No. ${houseNumber}` : road,
                    suburb,
                    city,
                    state,
                    postCode
                ].filter(Boolean);

                const fullAddress = parts.join(', ');

                // Specific check for city/kabupaten level
                const cityValue = data.address.city || data.address.town || data.address.regency || data.address.county || '';

                onLocationSelect(lat, lng, fullAddress, cityValue);
            }
        } catch (error) {
            console.error("Failed to fetch address details", error);
            // Fallback is just coordinates which are already set
        }
    };

    useMapEvents({
        click(e) {
            handleLocationUpdate(e.latlng.lat, e.latlng.lng);
        },
    });

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    handleLocationUpdate(lat, lng);
                }
            },
        }),
        []
    );

    return position ? (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={createCustomIcon()}
        />
    ) : null;
}
import InputError from '@/components/input-error';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store, update, destroy } from '@/routes/venues';
import type { BreadcrumbItem } from '@/types';

interface Venue {
    id: number;
    name: string;
    slug: string;
    address: string;
    city: string;
    phone: string;
    latitude: number | null;
    longitude: number | null;
    is_active: boolean;
    image_url: string | null;
    images?: string[];
    created_at: string;
    courts_count: number;
    facilities_count: number;
    reviews_count: number;
}

interface VenuesProps {
    venues: Venue[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Analitik Tempat',
        href: '/venues',
    },
];

type SortKey = 'name' | 'city' | 'is_active' | 'courts_count' | 'created_at';
type SortConfig = {
    key: SortKey;
    direction: 'asc' | 'desc';
} | null;

const MultiImageUploader = ({
    files,
    existingImages = [],
    onFilesChange,
    onExistingChange,
}: {
    files: File[];
    existingImages?: string[];
    onFilesChange: (files: File[]) => void;
    onExistingChange?: (images: string[]) => void;
}) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            onFilesChange([...files, ...newFiles]);
        }
    };

    const removeNewFile = (index: number) => {
        const updated = [...files];
        updated.splice(index, 1);
        onFilesChange(updated);
    };

    const removeExistingImage = (index: number) => {
        if (onExistingChange) {
            const updated = [...existingImages];
            updated.splice(index, 1);
            onExistingChange(updated);
        }
    };

    const totalImages = existingImages.length + files.length;

    return (
        <div className="flex flex-col gap-3">
            <label className="text-[13px] font-semibold tracking-wide text-slate-500 uppercase">
                Gambar Tempat (Opsional, Maks 5)
            </label>

            {totalImages === 0 ? (
                <label className="group flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 transition-all duration-300 hover:border-padel-green hover:bg-padel-green-50">
                    <div className="rounded-full bg-white p-4 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
                        <UploadCloud className="h-8 w-8 text-padel-green" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-padel-green-dark">Klik untuk mengunggah gambar</p>
                        <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG atau WEBP (Maks. 2MB)</p>
                    </div>
                    <input
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {/* Existing Images */}
                        {existingImages.map((imgPath, idx) => (
                            <div
                                key={`existing-${idx}`}
                                className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                            >
                                <img
                                    src={`/storage/${imgPath}`}
                                    alt={`Preview ${idx + 1}`}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeExistingImage(idx)}
                                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-red-600 hover:-translate-y-0.5 group-hover:opacity-100"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}

                        {/* Newly Added Files */}
                        {files.map((file, idx) => (
                            <div
                                key={`new-${idx}`}
                                className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                            >
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`New file ${idx + 1}`}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                    <span className="truncate text-[10px] text-white font-medium drop-shadow-md">{file.name}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeNewFile(idx)}
                                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-red-600 hover:-translate-y-0.5 group-hover:opacity-100"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}

                        {/* Upload Trigger (When images exist but < 5) */}
                        {totalImages < 5 && (
                            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-padel-green hover:bg-padel-green-50 hover:text-padel-green-dark">
                                <Plus className="h-6 w-6" />
                                <span className="text-[11px] font-semibold">Tambah</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/png, image/jpeg, image/jpg, image/webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        )}
                    </div>
                    {totalImages < 5 && (
                        <p className="text-[11px] text-slate-400">
                            Format: JPG, PNG, WEBP. Maksimum 2MB per gambar.
                            <span className="font-semibold text-padel-green-dark ml-1">
                                ({5 - totalImages} slot tersisa)
                            </span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default function Venues({ venues }: VenuesProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [linesPerPage, setLinesPerPage] = useState(10);
    const [filterOption, setFilterOption] = useState<
        'all' | 'active' | 'inactive'
    >('all');
    const [isStatsVisible, setIsStatsVisible] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { flash = {} } = usePage().props as any;

    // Form logic setup
    const form = useForm({
        name: '',
        city: '',
        address: '',
        latitude: '' as number | '',
        longitude: '' as number | '',
        phone: '',
        is_active: true,
        images: [] as File[],
    });

    const submitCreateVenue = (e: React.FormEvent) => {
        e.preventDefault();

        form.submit(store(), {
            forceFormData: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                form.reset();
                form.clearErrors();
            },
        });
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [venueToEdit, setVenueToEdit] = useState<Venue | null>(null);
    const editForm = useForm({
        name: '',
        city: '',
        address: '',
        latitude: '' as number | '',
        longitude: '' as number | '',
        phone: '',
        is_active: true,
        images: [] as File[],
        existing_images: [] as string[],
        _method: 'put',
    });

    const openEditModal = (venue: Venue) => {
        setVenueToEdit(venue);
        editForm.setData({
            name: venue.name,
            city: venue.city,
            address: venue.address,
            latitude: venue.latitude ? Number(venue.latitude) : '',
            longitude: venue.longitude ? Number(venue.longitude) : '',
            phone: venue.phone || '',
            is_active: venue.is_active,
            images: [],
            existing_images: venue.images || [],
            _method: 'put',
        });
        setIsEditModalOpen(true);
    };

    const submitEditVenue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!venueToEdit) return;

        // Use post with _method spoofing for file uploads in Laravel
        editForm.post(update({ venue: venueToEdit.id }) as unknown as string, {
            forceFormData: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                editForm.reset();
                editForm.clearErrors();
            },
        });
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);
    const deleteForm = useForm({});

    const openDeleteModal = (venue: Venue) => {
        setVenueToDelete(venue);
        setIsDeleteModalOpen(true);
    };

    const submitDeleteVenue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!venueToDelete) return;

        deleteForm.submit(destroy({ venue: venueToDelete.id }), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
            },
        });
    };

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [venueToView, setVenueToView] = useState<Venue | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const openViewModal = (venue: Venue) => {
        setVenueToView(venue);
        setIsViewModalOpen(true);
    };

    // Filter Logic
    const filteredVenues = useMemo(() => {
        let result = [...venues];

        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            result = result.filter((venue) =>
                venue.name.toLowerCase().includes(query) ||
                venue.city.toLowerCase().includes(query) ||
                venue.address.toLowerCase().includes(query)
            );
        }

        if (filterOption === 'active') {
            result = result.filter((venue) => venue.is_active);
        } else if (filterOption === 'inactive') {
            result = result.filter((venue) => !venue.is_active);
        }

        return result;
    }, [venues, searchTerm, filterOption]);

    // Sorting Logic
    const filteredAndSortedVenues = useMemo(() => {
        const result = [...filteredVenues];

        if (sortConfig !== null) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null)
                    return sortConfig.direction === 'asc' ? -1 : 1;
                if (bValue === null)
                    return sortConfig.direction === 'asc' ? 1 : -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [filteredVenues, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredAndSortedVenues.length / linesPerPage);
    const paginatedVenues = useMemo(() => {
        const start = (currentPage - 1) * linesPerPage;
        return filteredAndSortedVenues.slice(start, start + linesPerPage);
    }, [filteredAndSortedVenues, currentPage, linesPerPage]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'asc'
        ) {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return (
                <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-40" />
            );
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="ml-1 h-3.5 w-3.5 text-slate-800 transition-transform" />
        ) : (
            <ChevronDown className="ml-1 h-3.5 w-3.5 text-slate-800 transition-transform" />
        );
    };

    // Calculate aggregated stats
    const totalCourts = venues.reduce(
        (sum, venue) => sum + venue.courts_count,
        0,
    );
    const totalActive = venues.filter((venue) => venue.is_active).length;
    const totalInactive = venues.length - totalActive;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analitik Tempat" />

            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-1 flex-col gap-4 bg-white p-4 md:gap-6 md:p-8">
                {/* ═══════════ Header Stats Section ═══════════ */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Analitik Tempat
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        Navigasi Data untuk Keputusan Produk yang Terinformasi{' '}
                        <button
                            className="ml-1 inline-flex items-center font-semibold text-slate-800 transition-colors hover:text-slate-900 focus:outline-none"
                            onClick={() => setIsStatsVisible(!isStatsVisible)}
                        >
                            {isStatsVisible
                                ? 'Sembunyikan data'
                                : 'Tampilkan data'}
                            <ChevronUp
                                className={cn(
                                    'ml-1 h-4 w-4 transition-transform duration-300',
                                    !isStatsVisible && 'rotate-180',
                                )}
                            />
                        </button>
                    </p>
                </div>

                <div
                    className={cn(
                        'grid overflow-hidden transition-all duration-500 ease-in-out',
                        isStatsVisible
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0',
                    )}
                >
                    <div className="min-h-0">
                        <div className="grid grid-cols-1 gap-6 border-t border-b border-slate-200 py-6 md:grid-cols-4 md:gap-8">
                            <div className="flex flex-col">
                                <span className="mb-2 text-xs font-semibold text-slate-500">
                                    Total Tempat
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-semibold tracking-tight text-slate-900">
                                        {venues.length}
                                    </span>
                                </div>
                                <span className="mt-2 text-xs font-medium text-slate-400">
                                    Semua tempat terdaftar
                                </span>
                            </div>
                            <div className="flex flex-col border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                                <span className="mb-2 text-xs font-semibold text-slate-500">
                                    Total Lapangan
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-semibold tracking-tight text-slate-900">
                                        {totalCourts}
                                    </span>
                                </div>
                                <span className="mt-2 text-xs font-medium text-slate-400">
                                    Di seluruh tempat
                                </span>
                            </div>
                            <div className="flex flex-col border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                                <span className="mb-2 text-xs font-semibold text-slate-500">
                                    Aktif
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-semibold tracking-tight text-slate-900">
                                        {totalActive}
                                    </span>
                                </div>
                                <span className="mt-2 text-xs font-medium text-slate-400">
                                    Tempat beroperasi
                                </span>
                            </div>
                            <div className="flex flex-col border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                                <span className="mb-2 text-xs font-semibold text-slate-500">
                                    Tidak Aktif
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-semibold tracking-tight text-slate-900">
                                        {totalInactive}
                                    </span>
                                </div>
                                <span className="mt-2 text-xs font-medium text-slate-400">
                                    Tempat ditutup sementara
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ Action Toolbar ═══════════ */}
                <div className="flex flex-col justify-end gap-3 py-2 sm:flex-row sm:items-center sm:gap-4">
                    {/* Action Buttons */}
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <div className="group relative flex w-full items-center sm:w-auto">
                            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari tempat..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to page 1 on search
                                }}
                                className="h-9 w-full rounded-full border border-slate-200/80 bg-white pr-4 pl-9 text-sm focus:border-padel-green-dark focus:ring-padel-green-dark sm:w-64"
                            />
                        </div>
                        <div className="flex w-full gap-2 sm:w-auto">
                            <div className="relative flex h-9 flex-1 items-center sm:flex-none">
                                <Filter className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                                <select
                                    value={filterOption}
                                    onChange={(e) => {
                                        setFilterOption(e.target.value as any);
                                        setCurrentPage(1);
                                    }}
                                    className="h-full w-full appearance-none rounded-full border border-slate-200/80 bg-white py-0 pr-8 pl-9 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:border-padel-green-dark focus:ring-padel-green-dark sm:w-auto"
                                >
                                    <option value="all">Semua Data</option>
                                    <option value="active">
                                        Aktif
                                    </option>
                                    <option value="inactive">
                                        Tidak Aktif
                                    </option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
                            </div>
                            <Dialog
                                open={isCreateModalOpen}
                                onOpenChange={(open) => {
                                    setIsCreateModalOpen(open);
                                    if (!open) {
                                        form.reset();
                                        form.clearErrors();
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-padel-green bg-padel-green text-sm font-medium text-white shadow-sm transition-all hover:bg-padel-green-dark hover:shadow-md sm:flex-none sm:px-4">
                                        <Plus className="h-4 w-4" />
                                        Buat Tempat
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-white sm:max-w-[800px] p-0 overflow-hidden">
                                    <DialogHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                                        <DialogTitle className="font-heading text-xl">
                                            Buat Tempat Baru
                                        </DialogTitle>
                                        <DialogDescription>
                                            Tambahkan kategori tempat baru ke sistem. Lengkapi informasi secara mendetail.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                                        <form
                                            onSubmit={submitCreateVenue}
                                            className="flex flex-col gap-8"
                                        >
                                            {/* Full Width Map Section */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                    <div>
                                                        <h3 className="text-sm font-semibold tracking-wide text-slate-800 uppercase">Lokasi Peta</h3>
                                                        <p className="text-xs text-slate-500 mt-1">Klik pada peta untuk menandai lokasi spesifik venue dengan akurasi tinggi.</p>
                                                    </div>
                                                </div>
                                                <div className="h-[350px] w-full rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm relative z-0">
                                                    <MapContainer
                                                        center={[-0.5022, 117.1475]} // Defaulting roughly to Samarinda
                                                        zoom={13} // Initial Zoom
                                                        scrollWheelZoom={false}
                                                        style={{ height: '100%', width: '100%' }}
                                                    >
                                                        <TileLayer
                                                            attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                                                            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                                        />
                                                        {form.data.latitude && form.data.longitude && (
                                                            <RecenterMap center={[Number(form.data.latitude), Number(form.data.longitude)]} zoom={15} />
                                                        )}
                                                        <LocationPicker
                                                            position={form.data.latitude && form.data.longitude ? [Number(form.data.latitude), Number(form.data.longitude)] : null}
                                                            onLocationSelect={(lat, lng, address, city) => {
                                                                form.setData(current => ({
                                                                    ...current,
                                                                    latitude: lat,
                                                                    longitude: lng,
                                                                    address: address || current.address,
                                                                    city: city || current.city
                                                                }));
                                                            }}
                                                        />
                                                    </MapContainer>
                                                </div>
                                                {(form.errors.latitude || form.errors.longitude) && (
                                                    <div className="mt-1 text-sm text-red-600">
                                                        Peta wajib diisi dengan benar.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Two Columns: Basic Info & Media */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Left Column: Basic Info */}
                                                <div className="flex flex-col gap-6">
                                                    <div className="border-b border-slate-100 pb-2">
                                                        <h3 className="text-sm font-semibold tracking-wide text-slate-800 uppercase">Informasi Dasar</h3>
                                                    </div>

                                                    <div className="group relative">
                                                        <input
                                                            id="name"
                                                            type="text"
                                                            name="name"
                                                            required
                                                            autoFocus
                                                            value={form.data.name}
                                                            onChange={(e) => form.setData('name', e.target.value)}
                                                            placeholder=" "
                                                            className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                                        />
                                                        <label htmlFor="name" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                            Nama Tempat
                                                        </label>
                                                        <InputError message={form.errors.name} className="mt-2" />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="group relative">
                                                            <input
                                                                id="city"
                                                                type="text"
                                                                required
                                                                value={form.data.city}
                                                                onChange={(e) => form.setData('city', e.target.value)}
                                                                placeholder=" "
                                                                className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                                            />
                                                            <label htmlFor="city" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                                Kota
                                                            </label>
                                                            <InputError message={form.errors.city} className="mt-2" />
                                                        </div>
                                                        <div className="group relative">
                                                            <input
                                                                id="phone"
                                                                type="text"
                                                                required
                                                                value={form.data.phone}
                                                                onChange={(e) => form.setData('phone', e.target.value)}
                                                                placeholder=" "
                                                                className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                                            />
                                                            <label htmlFor="phone" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                                Telepon
                                                            </label>
                                                            <InputError message={form.errors.phone} className="mt-2" />
                                                        </div>
                                                    </div>

                                                    <div className="group relative">
                                                        <input
                                                            id="address"
                                                            type="text"
                                                            required
                                                            value={form.data.address}
                                                            onChange={(e) => form.setData('address', e.target.value)}
                                                            placeholder=" "
                                                            className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                                        />
                                                        <label htmlFor="address" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                            Alamat Lengkap
                                                        </label>
                                                        <InputError message={form.errors.address} className="mt-2" />
                                                    </div>

                                                    <div className="flex items-center gap-3 pt-2">
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={form.data.is_active}
                                                            onClick={() => form.setData('is_active', !form.data.is_active)}
                                                            className={cn(
                                                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2",
                                                                form.data.is_active ? "bg-padel-green-dark" : "bg-slate-200"
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                                    form.data.is_active ? "translate-x-6" : "translate-x-1"
                                                                )}
                                                            />
                                                        </button>
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {form.data.is_active ? 'Status: Aktif' : 'Status: Tidak Aktif'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right Column: Media */}
                                                <div className="flex flex-col gap-6">
                                                    <div className="border-b border-slate-100 pb-2">
                                                        <h3 className="text-sm font-semibold tracking-wide text-slate-800 uppercase">Media (Opsional)</h3>
                                                    </div>

                                                    <MultiImageUploader
                                                        files={form.data.images}
                                                        onFilesChange={(files) => form.setData('images', files)}
                                                    />
                                                    <InputError message={form.errors.images} className="mt-2" />
                                                </div>
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="mt-4 flex justify-end gap-3 pt-6 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreateModalOpen(false)}
                                                    className="flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={form.processing}
                                                    className="relative flex h-10 items-center justify-center rounded-lg bg-padel-green px-6 text-sm font-medium text-white shadow-sm shadow-padel-green/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-padel-green-dark hover:shadow-md hover:shadow-padel-green/40 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:hover:-translate-y-0 disabled:active:scale-100"
                                                >
                                                    <span className="relative flex items-center justify-center text-center">
                                                        {form.processing ? (
                                                            <Spinner className="h-5 w-5" />
                                                        ) : (
                                                            'Simpan Tempat'
                                                        )}
                                                    </span>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* ═══════════ Interactive Data Table ═══════════ */}
                <div className="flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200/80">
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        <button
                                            className="group flex items-center transition-colors hover:text-slate-900 focus:outline-none"
                                            onClick={() => handleSort('name')}
                                        >
                                            Nama Tempat
                                            {getSortIcon('name')}
                                        </button>
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        <button
                                            className="group flex items-center transition-colors hover:text-slate-900 focus:outline-none"
                                            onClick={() =>
                                                handleSort('city')
                                            }
                                        >
                                            Kota
                                            {getSortIcon('city')}
                                        </button>
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        Telepon
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        <button
                                            className="group flex items-center transition-colors hover:text-slate-900 focus:outline-none"
                                            onClick={() =>
                                                handleSort('is_active')
                                            }
                                        >
                                            Status
                                            {getSortIcon('is_active')}
                                        </button>
                                    </th>
                                    <th className="px-5 py-4 text-right text-[10px] font-light tracking-wide text-slate-600">
                                        <div className="flex justify-end">
                                            <button
                                                className="group flex items-center justify-end transition-colors hover:text-slate-900 focus:outline-none"
                                                onClick={() =>
                                                    handleSort('created_at')
                                                }
                                            >
                                                Dibuat Pada
                                                {getSortIcon('created_at')}
                                            </button>
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-light tracking-wide text-slate-600">
                                        <div className="flex justify-end">
                                            Aksi
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {paginatedVenues.length > 0 ? (
                                    paginatedVenues.map((venue) => {
                                        return (
                                            <tr
                                                key={venue.id}
                                                className="group transition-colors outline-none hover:bg-slate-50/40"
                                            >
                                                <td className="min-w-[300px] px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-base truncate text-slate-700 transition-colors group-hover:text-slate-900">
                                                            {venue.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500 truncate mt-0.5">
                                                            {venue.address}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-base text-[14px] text-slate-700">
                                                        {venue.city}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-base text-[14px] text-slate-700">
                                                        {venue.phone}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={cn(
                                                        "font-medium rounded-md px-2.5 py-1 text-[12px]",
                                                        venue.is_active ? "bg-padel-green-50 text-padel-green-dark" : "bg-red-50 text-red-700"
                                                    )}>
                                                        {venue.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right text-[13px] font-medium text-slate-600">
                                                    {format(
                                                        new Date(
                                                            venue.created_at,
                                                        ),
                                                        'dd MMM yyyy',
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                openViewModal(
                                                                    venue,
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                                            title="Detail Tempat"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    venue,
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    venue,
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                                                    <Search className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <h3 className="mb-1 text-sm font-semibold text-slate-900">
                                                    Tidak ada tempat ditemukan
                                                </h3>
                                                <p className="text-[13px] text-slate-500">
                                                    Sesuaikan pencarian atau
                                                    filter Anda untuk menemukan
                                                    data.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <span className="text-[13px] text-slate-500">
                            Menampilkan:{' '}
                            <span className="font-semibold text-slate-700">
                                {(currentPage - 1) * linesPerPage + 1} -{' '}
                                {Math.min(
                                    currentPage * linesPerPage,
                                    filteredAndSortedVenues.length,
                                )}
                            </span>{' '}
                            of {filteredAndSortedVenues.length}
                        </span>

                        <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:gap-6">
                            <div className="flex flex-wrap items-center justify-center gap-1">
                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(prev - 1, 1),
                                        )
                                    }
                                    disabled={
                                        currentPage === 1 || totalPages === 0
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalPages }).map(
                                    (_, idx) => {
                                        const pageNumber = idx + 1;
                                        // Handle ellipsis logic if many pages, but simple version for now
                                        if (totalPages > 5) {
                                            if (
                                                pageNumber !== 1 &&
                                                pageNumber !== totalPages &&
                                                Math.abs(
                                                    currentPage - pageNumber,
                                                ) > 1
                                            ) {
                                                if (
                                                    pageNumber === 2 ||
                                                    pageNumber ===
                                                    totalPages - 1
                                                ) {
                                                    return (
                                                        <span
                                                            key={pageNumber}
                                                            className="flex h-8 w-8 items-center justify-center text-slate-400"
                                                        >
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            }
                                        }

                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() =>
                                                    setCurrentPage(pageNumber)
                                                }
                                                className={cn(
                                                    'flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors',
                                                    currentPage === pageNumber
                                                        ? 'border border-slate-200 bg-white text-slate-900 shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-50',
                                                )}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    },
                                )}

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(prev + 1, totalPages),
                                        )
                                    }
                                    disabled={
                                        currentPage === totalPages ||
                                        totalPages === 0
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[13px] text-slate-500">
                                    Baris per halaman
                                </span>
                                <select
                                    value={linesPerPage}
                                    onChange={(e) => {
                                        setLinesPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to page 1
                                    }}
                                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 py-0 text-[13px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 focus:border-slate-300 focus:ring-0"
                                >
                                    <option value={5}>5 / halaman</option>
                                    <option value={10}>10 / halaman</option>
                                    <option value={20}>20 / halaman</option>
                                    <option value={50}>50 / halaman</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Venue Modal */}
                <Dialog
                    open={isEditModalOpen}
                    onOpenChange={(open) => {
                        setIsEditModalOpen(open);
                        if (!open) {
                            editForm.reset();
                            editForm.clearErrors();
                        }
                    }}
                >
                    <DialogContent className="bg-white sm:max-w-[800px] p-0 overflow-hidden">
                        <DialogHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                            <DialogTitle className="font-heading text-xl">
                                Edit Tempat
                            </DialogTitle>
                            <DialogDescription>
                                Perbarui detail informasi dari tempat ini secara mendetail.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            <form
                                onSubmit={submitEditVenue}
                                className="flex flex-col gap-8"
                            >
                                {/* Full Width Map Section */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <div>
                                            <h3 className="text-sm font-semibold tracking-wide text-slate-800 uppercase">Lokasi Peta</h3>
                                            <p className="text-xs text-slate-500 mt-1">Klik pada peta untuk memperbarui penanda lokasi venue dengan akurasi tinggi.</p>
                                        </div>
                                    </div>
                                    <div className="h-[350px] w-full rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm relative z-0">
                                        <MapContainer
                                            center={editForm.data.latitude && editForm.data.longitude ? [Number(editForm.data.latitude), Number(editForm.data.longitude)] : [-0.5022, 117.1475]}
                                            zoom={editForm.data.latitude ? 15 : 13}
                                            scrollWheelZoom={false}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                                                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                            />
                                            {editForm.data.latitude && editForm.data.longitude && (
                                                <RecenterMap center={[Number(editForm.data.latitude), Number(editForm.data.longitude)]} zoom={15} />
                                            )}

                                            <LocationPicker
                                                position={editForm.data.latitude && editForm.data.longitude ? [Number(editForm.data.latitude), Number(editForm.data.longitude)] : null}
                                                onLocationSelect={(lat, lng, address, city) => {
                                                    editForm.setData(current => ({
                                                        ...current,
                                                        latitude: lat,
                                                        longitude: lng,
                                                        address: address || current.address,
                                                        city: city || current.city
                                                    }));
                                                }}
                                            />
                                        </MapContainer>
                                    </div>
                                    {(editForm.errors.latitude || editForm.errors.longitude) && (
                                        <div className="mt-1 text-sm text-red-600">
                                            Peta wajib diisi dengan benar.
                                        </div>
                                    )}
                                </div>

                                {/* Two Columns: Basic Info & Media */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Basic Info */}
                                    <div className="flex flex-col gap-6">
                                        <div className="border-b border-slate-100 pb-2">
                                            <h3 className="text-sm font-semibold tracking-wide text-slate-800 uppercase">Informasi Dasar</h3>
                                        </div>

                                        <div className="group relative">
                                            <input
                                                id="edit-name"
                                                type="text"
                                                name="name"
                                                required
                                                autoFocus
                                                value={editForm.data.name}
                                                onChange={(e) => editForm.setData('name', e.target.value)}
                                                placeholder=" "
                                                className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                            />
                                            <label htmlFor="edit-name" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                Nama Tempat
                                            </label>
                                            <InputError message={editForm.errors.name} className="mt-2" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="group relative">
                                                <input
                                                    id="edit-city"
                                                    type="text"
                                                    required
                                                    value={editForm.data.city}
                                                    onChange={(e) => editForm.setData('city', e.target.value)}
                                                    placeholder=" "
                                                    className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                                />
                                                <label htmlFor="edit-city" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                    Kota
                                                </label>
                                                <InputError message={editForm.errors.city} className="mt-2" />
                                            </div>
                                            <div className="group relative">
                                                <input
                                                    id="edit-phone"
                                                    type="text"
                                                    required
                                                    value={editForm.data.phone}
                                                    onChange={(e) => editForm.setData('phone', e.target.value)}
                                                    placeholder=" "
                                                    className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                                />
                                                <label htmlFor="edit-phone" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                    Telepon
                                                </label>
                                                <InputError message={editForm.errors.phone} className="mt-2" />
                                            </div>
                                        </div>

                                        <div className="group relative">
                                            <input
                                                id="edit-address"
                                                type="text"
                                                required
                                                value={editForm.data.address}
                                                onChange={(e) => editForm.setData('address', e.target.value)}
                                                placeholder=" "
                                                className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                            />
                                            <label htmlFor="edit-address" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                                                Alamat Lengkap
                                            </label>
                                            <InputError message={editForm.errors.address} className="mt-2" />
                                        </div>

                                        <div className="flex items-center gap-3 pt-2">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={editForm.data.is_active}
                                                onClick={() => editForm.setData('is_active', !editForm.data.is_active)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2",
                                                    editForm.data.is_active ? "bg-padel-green-dark" : "bg-slate-200"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                        editForm.data.is_active ? "translate-x-6" : "translate-x-1"
                                                    )}
                                                />
                                            </button>
                                            <span className="text-sm font-medium text-slate-700">
                                                {editForm.data.is_active ? 'Status: Aktif' : 'Status: Tidak Aktif'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Column: Media */}
                                    <div className="flex flex-col gap-6">
                                        <div className="border-b border-slate-100 pb-2">
                                            <h3 className="text-sm font-semibold tracking-wide text-slate-800 uppercase">Media (Opsional)</h3>
                                        </div>

                                        <MultiImageUploader
                                            files={editForm.data.images}
                                            existingImages={editForm.data.existing_images}
                                            onFilesChange={(files) => editForm.setData('images', files)}
                                            onExistingChange={(images) => editForm.setData('existing_images', images)}
                                        />
                                        <InputError message={editForm.errors.images} className="mt-2" />
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="mt-4 flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="relative flex h-10 items-center justify-center rounded-lg bg-padel-green px-6 text-sm font-medium text-white shadow-sm shadow-padel-green/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-padel-green-dark hover:shadow-md hover:shadow-padel-green/40 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:hover:-translate-y-0 disabled:active:scale-100"
                                    >
                                        <span className="relative flex items-center justify-center text-center">
                                            {editForm.processing ? (
                                                <Spinner className="h-5 w-5" />
                                            ) : (
                                                'Simpan Perubahan'
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Venue Modal */}
                <Dialog
                    open={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                >
                    <DialogContent className="bg-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="font-heading text-xl text-red-600">
                                Hapus Tempat
                            </DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus{' '}
                                <strong>{venueToDelete?.name}</strong>? Tindakan
                                ini dapat dibatalkan, namun gagal jika masih
                                memiliki lapangan atau pemesanan yang aktif.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={submitDeleteVenue}
                            className="mt-4 flex flex-col gap-6"
                        >
                            <DialogFooter className="mt-2 flex-col gap-3 sm:flex-row sm:gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteForm.processing}
                                    className="relative flex h-10 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-medium text-white shadow-sm shadow-red-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md hover:shadow-red-600/40 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:hover:-translate-y-0 disabled:active:scale-100"
                                >
                                    <span className="relative flex items-center justify-center text-center">
                                        {deleteForm.processing ? (
                                            <Spinner className="h-5 w-5 text-red-100" />
                                        ) : (
                                            'Hapus Sekarang'
                                        )}
                                    </span>
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* View Venue Modal - Hyper Minimalist */}
                <Dialog
                    open={isViewModalOpen}
                    onOpenChange={setIsViewModalOpen}
                >
                    <DialogContent className="bg-white sm:max-w-[850px] max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 shadow-2xl">
                        {venueToView && (
                            <div className="flex flex-col md:flex-row min-h-[500px]">
                                {/* Left Side: Media Gallery & Lightbox Triggers */}
                                <div className="w-full md:w-1/2 p-2 bg-slate-50">
                                    {venueToView.images && venueToView.images.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2 h-full">
                                            {/* Hero Image */}
                                            <div
                                                className="col-span-2 relative group overflow-hidden rounded-2xl cursor-zoom-in"
                                                onClick={() => setSelectedImage(venueToView.images![0])}
                                            >
                                                <img
                                                    src={`/storage/${venueToView.images[0]}`}
                                                    alt="Cover"
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    style={{ minHeight: '280px' }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10 flex items-center justify-center">
                                                    <Search className="text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 h-8 w-8 drop-shadow-md" />
                                                </div>
                                            </div>
                                            {/* Remaining Images */}
                                            {venueToView.images.slice(1, 3).map((imgPath, idx) => (
                                                <div
                                                    key={`view-existing-${idx + 1}`}
                                                    className="relative group overflow-hidden rounded-2xl cursor-zoom-in aspect-square"
                                                    onClick={() => setSelectedImage(imgPath)}
                                                >
                                                    <img
                                                        src={`/storage/${imgPath}`}
                                                        alt={`Galeri ${idx + 2}`}
                                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10 flex items-center justify-center pointer-events-none">
                                                        <Search className="text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 h-6 w-6 drop-shadow-md" />
                                                    </div>
                                                </div>
                                            ))}
                                            {/* If more than 3 images exist, show a counter on the 3rd slot visually */}
                                            {venueToView.images.length > 3 && (
                                                <div
                                                    className="col-span-1 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center flex-col gap-1 text-slate-400 cursor-pointer hover:border-padel-green hover:text-padel-green transition-colors"
                                                    onClick={() => setSelectedImage(venueToView.images![3])}
                                                >
                                                    <span className="text-xl font-bold">+{venueToView.images.length - 3}</span>
                                                    <span className="text-xs font-medium">Foto Lainnya</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400">
                                            <ImagePlus className="mb-4 h-10 w-10 text-slate-300" />
                                            <span className="text-sm font-medium">Tidak ada foto visual</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Minimalist Typography Info */}
                                <div className="w-full md:w-1/2 p-10 flex flex-col justify-between">
                                    <div>
                                        <div className="mb-8">
                                            <span className={cn(
                                                "inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase",
                                                venueToView.is_active ? "bg-padel-green-50 text-padel-green-dark" : "bg-red-50 text-red-700"
                                            )}>
                                                {venueToView.is_active ? 'Status Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </div>

                                        <h2 className="text-4xl font-heading text-slate-900 leading-tight mb-2 tracking-wide">
                                            {venueToView.name}
                                        </h2>
                                        <p className="text-sm font-medium text-padel-green mb-10 tracking-widest uppercase">
                                            {venueToView.city}
                                        </p>

                                        <div className="space-y-8">
                                            <div>
                                                <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">
                                                    Alamat Lengkap
                                                </span>
                                                <div className="flex items-start gap-2 max-w-[280px]">
                                                    <MapPin className="h-4 w-4 mt-0.5 text-padel-green-400 flex-shrink-0" />
                                                    <p className="text-sm text-slate-700 leading-relaxed">
                                                        {venueToView.address}
                                                    </p>
                                                </div>
                                                {venueToView.latitude && venueToView.longitude && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${venueToView.latitude},${venueToView.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-padel-green hover:text-padel-green-dark transition-colors group"
                                                    >
                                                        Buka di Google Maps
                                                        <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                                    </a>
                                                )}
                                            </div>

                                            <div>
                                                <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">
                                                    Telepon & Kontak
                                                </span>
                                                <p className="text-lg text-slate-900 font-medium">
                                                    {venueToView.phone || 'Belum disediakan'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics Grid tightly integrated at bottom */}
                                    <div className="mt-12 pt-8 border-t border-slate-100">
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Lapangan</span>
                                                <span className="text-3xl font-heading text-slate-900">{venueToView.courts_count}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Fasilitas</span>
                                                <span className="text-3xl font-heading text-slate-900">{venueToView.facilities_count}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Ulasan</span>
                                                <span className="text-3xl font-heading text-slate-900">{venueToView.reviews_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Fullscreen Image Lightbox */}
                <Dialog
                    open={!!selectedImage}
                    onOpenChange={(open) => {
                        if (!open) setSelectedImage(null);
                    }}
                >
                    <DialogContent className="max-w-screen-lg w-full h-[90vh] p-0 bg-transparent border-0 shadow-none flex items-center justify-center [&>button]:hidden">
                        {selectedImage && (
                            <div className="relative w-full h-full flex items-center justify-center group">
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-12 right-0 md:-right-12 h-10 w-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all z-50 shadow-xl"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <img
                                    src={`/storage/${selectedImage}`}
                                    alt="Zoomed Venue"
                                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl drop-shadow-2xl"
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
