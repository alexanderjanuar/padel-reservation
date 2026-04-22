import { useForm } from '@inertiajs/react';
import { Plus, UploadCloud, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Court, PricingRule, Sport, Venue } from '@/components/admin/courts/types';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/courts';

const getImageUrl = (path: string) =>
    path.startsWith('http') ? path : `/storage/${path}`;

function PricingRulesEditor({
    rules,
    onChange,
}: {
    rules: PricingRule[];
    onChange: (newRules: PricingRule[]) => void;
}) {
    const daysOfWeek = [
        { id: 1, name: 'Sen' },
        { id: 2, name: 'Sel' },
        { id: 3, name: 'Rab' },
        { id: 4, name: 'Kam' },
        { id: 5, name: 'Jum' },
        { id: 6, name: 'Sab' },
        { id: 0, name: 'Min' },
    ];

    const addRule = () => {
        onChange([
            ...rules,
            {
                days: [],
                start_time: '06:00',
                end_time: '18:00',
                price: '',
                price_2_hours: '',
            },
        ]);
    };

    const removeRule = (index: number) => {
        const newRules = [...rules];
        newRules.splice(index, 1);
        onChange(newRules);
    };

    const updateRule = <K extends keyof PricingRule>(
        index: number,
        field: K,
        value: PricingRule[K],
    ) => {
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], [field]: value };
        onChange(newRules);
    };

    const toggleDay = (ruleIndex: number, day: number) => {
        const rule = rules[ruleIndex];
        const newDays = rule.days.includes(day)
            ? rule.days.filter((d) => d !== day)
            : [...rule.days, day].sort();
        updateRule(ruleIndex, 'days', newDays);
    };

    const handlePriceChange = (index: number, rawValue: string) => {
        if (!rawValue) {
            updateRule(index, 'price', '');
            return;
        }

        const numericValue = rawValue.replace(/\D/g, '');
        updateRule(index, 'price', numericValue ? Number(numericValue) : '');
    };

    const handlePrice2HoursChange = (index: number, rawValue: string) => {
        if (!rawValue) {
            updateRule(index, 'price_2_hours', '');
            return;
        }

        const numericValue = rawValue.replace(/\D/g, '');
        updateRule(index, 'price_2_hours', numericValue ? Number(numericValue) : '');
    };

    return (
        <div className="col-span-full space-y-3 pt-2">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[13px] font-bold text-slate-900">
                        Harga Khusus{' '}
                        <span className="ml-1 text-[11px] font-semibold text-slate-400">
                            Opsional
                        </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                        Tarif berdasarkan hari & jam. Aturan teratas diprioritaskan jika tumpang tindih.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addRule}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-500"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah
                </button>
            </div>

            {rules.length > 0 && (
                <div className="space-y-2">
                    {rules.map((rule, index) => (
                        <div
                            key={index}
                            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                    Aturan {index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeRule(index)}
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {daysOfWeek.map((day) => {
                                    const isSelected = rule.days.includes(day.id);

                                    return (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => toggleDay(index, day.id)}
                                            className={cn(
                                                'rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-all active:scale-95',
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-500/50 hover:text-emerald-500',
                                            )}
                                        >
                                            {day.name}
                                        </button>
                                    );
                                })}
                            </div>

                            {rule.days.length === 0 && (
                                <p className="text-[11px] font-medium text-red-500">
                                    Pilih minimal satu hari
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Mulai
                                    </label>
                                    <Input
                                        type="time"
                                        value={rule.start_time}
                                        onChange={(e) => updateRule(index, 'start_time', e.target.value)}
                                        className="h-9 rounded-lg border-slate-200 bg-white text-center text-[13px] font-semibold focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Selesai
                                    </label>
                                    <Input
                                        type="time"
                                        value={rule.end_time}
                                        onChange={(e) => updateRule(index, 'end_time', e.target.value)}
                                        className="h-9 rounded-lg border-slate-200 bg-white text-center text-[13px] font-semibold focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Tarif/Jam
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            value={rule.price ? rule.price.toLocaleString('id-ID') : ''}
                                            onChange={(e) => handlePriceChange(index, e.target.value)}
                                            className="h-9 rounded-lg border-slate-200 bg-white pr-2 pl-8 text-[13px] font-semibold text-slate-900 focus-visible:ring-emerald-500"
                                            placeholder="250.000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Tarif/2 Jam
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            value={rule.price_2_hours ? rule.price_2_hours.toLocaleString('id-ID') : ''}
                                            onChange={(e) => handlePrice2HoursChange(index, e.target.value)}
                                            className="h-9 rounded-lg border-slate-200 bg-white pr-2 pl-8 text-[13px] font-semibold text-slate-900 focus-visible:ring-emerald-500"
                                            placeholder="400.000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function CreateCourtForm({
    venues,
    sports,
    onSuccess,
    onCancel,
}: {
    venues: Venue[];
    sports: Sport[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const form = useForm({
        venue_id: '',
        sport_id: '',
        name: '',
        type: 'indoor',
        price_per_hour: '',
        is_active: true,
        images: [] as File[],
        pricing_rules: [] as PricingRule[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit(store(), {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess();
                window.dispatchEvent(
                    new CustomEvent('toast', {
                        detail: {
                            type: 'success',
                            message: 'Lapangan baru berhasil dutambahkan.',
                        },
                    }),
                );
            },
        });
    };

    return (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="scrollbar-thin scrollbar-thumb-slate-200 min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="group relative md:col-span-2">
                        <input
                            id="name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder=" "
                            className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 pt-6 pb-2.5 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                        />
                        <label htmlFor="name" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase">
                            Nama Lapangan
                        </label>
                        <InputError message={form.errors.name} className="mt-2" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-900">
                            Foto Lapangan (Opsional, Maks 10)
                        </label>
                        <div className="flex flex-col gap-3">
                            <label
                                htmlFor="images"
                                className="group flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="mb-2 h-8 w-8 text-slate-400 transition-colors group-hover:text-emerald-500" />
                                    <p className="mb-1 text-sm text-slate-500">
                                        <span className="font-semibold text-emerald-500">Klik untuk unggah</span>{' '}
                                        atau seret dan lepas
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        JPEG, PNG, JPG, WEBP (Maks. 2MB)
                                    </p>
                                </div>
                                <input
                                    id="images"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const newFiles = Array.from(e.target.files);
                                            form.setData('images', [...form.data.images, ...newFiles].slice(0, 10));
                                        }
                                    }}
                                />
                            </label>

                            {form.data.images.length > 0 && (
                                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                    {form.data.images.map((file, index) => (
                                        <div
                                            key={index}
                                            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${index}`}
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [...form.data.images];
                                                    newImages.splice(index, 1);
                                                    form.setData('images', newImages);
                                                }}
                                                className="absolute top-1 right-1 rounded-full bg-red-500/90 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <InputError message={form.errors.images as string} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="venue_id" className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                            Lokasi / Tempat
                        </label>
                        <div className="relative">
                            <select
                                id="venue_id"
                                value={form.data.venue_id}
                                onChange={(e) => form.setData('venue_id', e.target.value)}
                                className="block w-full appearance-none rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-[15px] font-medium text-slate-900 transition-all hover:border-slate-300 focus:border-padel-green focus:ring-0 focus:outline-none"
                            >
                                <option value="" disabled>Pilih Tempat</option>
                                {venues.map((venue) => (
                                    <option key={venue.id} value={venue.id}>{venue.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-0 bottom-3 h-4 w-4 text-slate-400" />
                        </div>
                        <InputError message={form.errors.venue_id} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="sport_id" className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                            Jenis Olahraga
                        </label>
                        <div className="relative">
                            <select
                                id="sport_id"
                                value={form.data.sport_id}
                                onChange={(e) => form.setData('sport_id', e.target.value)}
                                className="block w-full appearance-none rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-[15px] font-medium text-slate-900 transition-all hover:border-slate-300 focus:border-padel-green focus:ring-0 focus:outline-none"
                            >
                                <option value="" disabled>Pilih Olahraga</option>
                                {sports.map((sport) => (
                                    <option key={sport.id} value={sport.id}>{sport.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-0 bottom-3 h-4 w-4 text-slate-400" />
                        </div>
                        <InputError message={form.errors.sport_id} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="type" className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                            Tipe Area
                        </label>
                        <div className="relative">
                            <select
                                id="type"
                                value={form.data.type}
                                onChange={(e) => form.setData('type', e.target.value as 'indoor' | 'outdoor')}
                                className="block w-full appearance-none rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-[15px] font-medium capitalize text-slate-900 transition-all hover:border-slate-300 focus:border-padel-green focus:ring-0 focus:outline-none"
                            >
                                <option value="indoor">Indoor</option>
                                <option value="outdoor">Outdoor</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-0 bottom-3 h-4 w-4 text-slate-400" />
                        </div>
                        <InputError message={form.errors.type} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="price_per_hour" className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                            Tarif / Jam
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute bottom-2.5 left-0 text-[15px] font-medium text-slate-400">Rp</span>
                            <input
                                id="price_per_hour"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.data.price_per_hour}
                                onChange={(e) => form.setData('price_per_hour', e.target.value)}
                                placeholder="150000"
                                className="block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 pl-8 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 transition-all hover:border-slate-300 focus:border-padel-green focus:ring-0 focus:outline-none"
                            />
                        </div>
                        <InputError message={form.errors.price_per_hour} className="mt-2" />
                    </div>

                    <div className="mt-2 md:col-span-2">
                        <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100/80">
                            <div className="space-y-0.5 pr-4">
                                <span className="block text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-500">
                                    Aktifkan Lapangan
                                </span>
                                <span className="block text-xs leading-relaxed text-slate-500">
                                    Lapangan yang aktif bisa dipesan langsung oleh pelanggan di website/aplikasi.
                                </span>
                            </div>
                            <div
                                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
                                style={{
                                    backgroundColor: form.data.is_active ? '#06D001' : '#cbd5e1',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                <span
                                    className={cn(
                                        'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                        form.data.is_active ? 'translate-x-5' : 'translate-x-0',
                                    )}
                                />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={form.processing}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 disabled:opacity-50"
                >
                    {form.processing && <Spinner className="h-4 w-4" />}
                    Simpan Lapangan
                </button>
            </div>
        </form>
    );
}

export function EditCourtForm({
    court,
    venues,
    sports,
    onSuccess,
    onCancel,
}: {
    court: Court;
    venues: Venue[];
    sports: Sport[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const form = useForm({
        venue_id: court.venue_id.toString(),
        sport_id: court.sport_id.toString(),
        name: court.name,
        type: court.type,
        price_per_hour: court.price_per_hour.toString(),
        is_active: court.is_active,
        images: [] as File[],
        images_to_delete: [] as string[],
        pricing_rules: court.pricing_rules || ([] as PricingRule[]),
    });

    const [existingImages, setExistingImages] = useState<string[]>(court.images || []);

    const handleRemoveExistingImage = (path: string) => {
        setExistingImages((prev) => prev.filter((img) => img !== path));
        form.setData('images_to_delete', [...form.data.images_to_delete, path]);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit(update(court.id), {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess();
                window.dispatchEvent(
                    new CustomEvent('toast', {
                        detail: {
                            type: 'success',
                            message: 'Lapangan berhasil diperbarui.',
                        },
                    }),
                );
            },
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
            <div className="scrollbar-thin scrollbar-thumb-slate-200 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7">
                    <div className="space-y-2.5 md:col-span-2">
                        <label htmlFor="edit_name" className="text-[13px] font-bold tracking-widest text-slate-900 uppercase">
                            Nama Lapangan <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="edit_name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className={cn(
                                'flex h-12 w-full rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                form.errors.name
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:ring-emerald-500/20',
                            )}
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="space-y-2.5 md:col-span-2">
                        <label className="block text-[13px] font-bold tracking-widest text-slate-900 uppercase">
                            Foto Lapangan (Maks 10)
                        </label>
                        <div className="flex flex-col gap-3">
                            <label
                                htmlFor="edit_images"
                                className="group flex min-h-[100px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
                            >
                                <div className="flex flex-col items-center justify-center py-5">
                                    <UploadCloud className="mb-2 h-6 w-6 text-slate-400 transition-colors group-hover:text-emerald-500" />
                                    <p className="mb-0.5 text-xs font-semibold text-slate-500">
                                        <span className="text-emerald-500">Klik untuk unggah</span>{' '}
                                        atau seret foto kesini
                                    </p>
                                </div>
                                <input
                                    id="edit_images"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const newFiles = Array.from(e.target.files);
                                            form.setData('images', [...form.data.images, ...newFiles].slice(0, 10));
                                        }
                                    }}
                                />
                            </label>

                            {(existingImages.length > 0 || form.data.images.length > 0) && (
                                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                    {existingImages.map((path, index) => (
                                        <div
                                            key={`existing-${index}`}
                                            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                                        >
                                            <img
                                                src={getImageUrl(path)}
                                                alt={`Existing ${index}`}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExistingImage(path)}
                                                className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1.5 text-red-500 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-50"
                                                title="Hapus foto ini"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[10px] font-medium text-white backdrop-blur-sm">
                                                Tersimpan
                                            </div>
                                        </div>
                                    ))}

                                    {form.data.images.map((file, index) => (
                                        <div
                                            key={`new-${index}`}
                                            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${index}`}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [...form.data.images];
                                                    newImages.splice(index, 1);
                                                    form.setData('images', newImages);
                                                }}
                                                className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1.5 text-red-500 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-50"
                                                title="Batal unggah"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 bg-emerald-500/90 py-1 text-center text-[10px] font-medium text-white backdrop-blur-sm">
                                                Baru
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <InputError message={form.errors.images as string} />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label htmlFor="edit_venue_id" className="text-[13px] font-bold tracking-widest text-slate-900 uppercase">
                            Lokasi Lapangan <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="edit_venue_id"
                            value={form.data.venue_id}
                            onChange={(e) => form.setData('venue_id', e.target.value)}
                            className={cn(
                                'flex h-12 w-full appearance-none rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none',
                                form.errors.venue_id
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:ring-emerald-500/20',
                            )}
                        >
                            <option value="" disabled>Pilih Tempat</option>
                            {venues.map((venue) => (
                                <option key={venue.id} value={venue.id}>{venue.name}</option>
                            ))}
                        </select>
                        <InputError message={form.errors.venue_id} />
                    </div>

                    <div className="space-y-2.5">
                        <label htmlFor="edit_sport_id" className="text-[13px] font-bold tracking-widest text-slate-900 uppercase">
                            Jenis Olahraga <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="edit_sport_id"
                            value={form.data.sport_id}
                            onChange={(e) => form.setData('sport_id', e.target.value)}
                            className={cn(
                                'flex h-12 w-full appearance-none rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium text-slate-900 transition-colors focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none',
                                form.errors.sport_id
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:ring-emerald-500/20',
                            )}
                        >
                            <option value="" disabled>Pilih Olahraga</option>
                            {sports.map((sport) => (
                                <option key={sport.id} value={sport.id}>{sport.name}</option>
                            ))}
                        </select>
                        <InputError message={form.errors.sport_id} />
                    </div>

                    <div className="space-y-2.5">
                        <label htmlFor="edit_type" className="text-[13px] font-bold tracking-widest text-slate-900 uppercase">
                            Tipe Area <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="edit_type"
                            value={form.data.type}
                            onChange={(e) => form.setData('type', e.target.value as 'indoor' | 'outdoor')}
                            className={cn(
                                'flex h-12 w-full appearance-none rounded-xl border bg-slate-50 px-4 py-2 text-[15px] font-medium capitalize text-slate-900 transition-colors focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none',
                                form.errors.type
                                    ? 'border-red-500 focus-visible:ring-red-200'
                                    : 'border-slate-200 focus-visible:ring-emerald-500/20',
                            )}
                        >
                            <option value="indoor">Indoor</option>
                            <option value="outdoor">Outdoor</option>
                        </select>
                        <InputError message={form.errors.type} />
                    </div>

                    <div className="space-y-2.5">
                        <label htmlFor="edit_price_per_hour" className="text-[13px] font-bold tracking-widest text-slate-900 uppercase">
                            Tarif / Jam <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-[15px] font-medium text-slate-400">
                                Rp
                            </span>
                            <input
                                id="edit_price_per_hour"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.data.price_per_hour}
                                onChange={(e) => form.setData('price_per_hour', e.target.value)}
                                className={cn(
                                    'flex h-12 w-full rounded-xl border bg-slate-50 py-2 pr-4 pl-11 text-[15px] font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:outline-none',
                                    form.errors.price_per_hour
                                        ? 'border-red-500 focus-visible:ring-red-200'
                                        : 'border-slate-200 focus-visible:ring-emerald-500/20',
                                )}
                            />
                        </div>
                        <InputError message={form.errors.price_per_hour} />
                    </div>

                    <PricingRulesEditor
                        rules={form.data.pricing_rules}
                        onChange={(rules) => form.setData('pricing_rules', rules)}
                    />

                    <div className="mt-2 md:col-span-2">
                        <label className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50">
                            <div className="space-y-1 pr-6">
                                <span className="block text-sm font-bold tracking-widest text-slate-900 uppercase">
                                    Aktifkan Lapangan
                                </span>
                                <span className="block text-[13px] leading-relaxed font-medium text-slate-500">
                                    Lapangan yang aktif bisa dipesan langsung oleh pelanggan di website/aplikasi.
                                </span>
                            </div>
                            <div
                                className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
                                style={{
                                    backgroundColor: form.data.is_active ? '#06D001' : '#cbd5e1',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                <span
                                    className={cn(
                                        'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                        form.data.is_active ? 'translate-x-5' : 'translate-x-0',
                                    )}
                                />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 rounded-b-3xl border-t border-slate-100 bg-white px-6 py-5 sm:px-8">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={form.processing}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition-all hover:bg-emerald-600 disabled:opacity-50"
                >
                    {form.processing && <Spinner className="h-4 w-4" />}
                    Simpan Perubahan
                </button>
            </div>
        </form>
    );
}
