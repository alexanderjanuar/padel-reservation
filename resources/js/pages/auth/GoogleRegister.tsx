import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { store } from '@/routes/google';
import { home } from '@/routes';

type Props = {
    name: string;
    email: string;
};

export default function GoogleRegister({ name, email }: Props) {
    return (
        <div className="flex min-h-dvh w-full bg-white font-sans text-slate-900">
            <Head title="Selesaikan Registrasi — VibePadel" />

            {/* ═══════════ Left Panel — The Functional Zone ═══════════ */}
            <div className="flex w-full flex-col p-8 sm:p-16 lg:w-1/2 lg:p-24 xl:p-32">
                {/* Header Anchor */}
                <div className="flex items-center justify-between">
                    <Link
                        href={home()}
                        className="font-heading text-2xl font-bold tracking-tighter text-slate-900"
                    >
                        VibePadel.
                    </Link>
                </div>

                {/* Main Form Area */}
                <div className="flex flex-1 flex-col justify-center max-w-md w-full mx-auto lg:mx-0 py-16">
                    <div className="login-form-stagger mb-12">
                        <h1 className="mb-4 font-heading text-[2.5rem] leading-tight font-medium tracking-tight text-slate-900 sm:text-4xl">
                            Hampir Selesai, {name.split(' ')[0]}!
                        </h1>
                        <p className="text-[15px] leading-relaxed tracking-wide text-slate-500">
                            Amankan akun Anda dengan menambahkan password. Anda dapat menggunakan email atau akun Google ini untuk masuk kembali di masa mendatang.
                        </p>
                    </div>

                    <Form
                        {...store.form()}
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="login-form-stagger flex flex-col gap-6">
                                    {/* Disabled Email Field */}
                                    <div className="group relative opacity-70">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Mail className="h-[18px] w-[18px]" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={email}
                                            disabled
                                            className="block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-4 pb-2.5 pt-6 pl-11 text-[15px] font-medium text-slate-900 cursor-not-allowed focus:ring-0"
                                        />
                                        <label className="pointer-events-none absolute left-11 top-3 -translate-y-1/2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                                            Alamat Email
                                        </label>
                                    </div>

                                    {/* Interactive Password Field */}
                                    <div className="group relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-padel-green">
                                            <Lock className="h-[18px] w-[18px]" />
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="new-password"
                                            placeholder=" "
                                            className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-4 pb-2.5 pt-6 pl-11 text-[15px] font-medium text-slate-900 transition-all duration-300 placeholder-transparent hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:outline-none focus:ring-0"
                                        />
                                        <label
                                            htmlFor="password"
                                            className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-padel-green peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest"
                                        >
                                            Buat Password
                                        </label>
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    {/* Interactive Password Confirmation Field */}
                                    <div className="group relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-padel-green">
                                            <Lock className="h-[18px] w-[18px]" />
                                        </div>
                                        <input
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            required
                                            tabIndex={2}
                                            autoComplete="new-password"
                                            placeholder=" "
                                            className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-4 pb-2.5 pt-6 pl-11 text-[15px] font-medium text-slate-900 transition-all duration-300 placeholder-transparent hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:outline-none focus:ring-0"
                                        />
                                        <label
                                            htmlFor="password_confirmation"
                                            className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-padel-green peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest"
                                        >
                                            Konfirmasi Password
                                        </label>
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>

                                </div>

                                {/* Interactive Submit Button */}
                                <div className="login-form-stagger mt-8">
                                    <button
                                        type="submit"
                                        className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-padel-green px-6 py-4 text-[15px] font-semibold tracking-wide text-white shadow-lg shadow-padel-green/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-padel-green/40 hover:bg-padel-green-dark active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:hover:-translate-y-0"
                                        tabIndex={3}
                                        disabled={processing}
                                        data-test="register-button"
                                    >
                                        {/* Animated shine effect */}
                                        <div className="absolute inset-0 -translate-x-[150%] skew-x-[-15deg] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-[800ms] ease-in-out group-hover:translate-x-[150%]" />

                                        <span className="relative flex items-center justify-center text-center">
                                            {processing ? (
                                                <Spinner className="h-5 w-5" />
                                            ) : (
                                                <>
                                                    <span className="translate-x-3 transition-transform duration-300 ease-out group-hover:translate-x-0">Simpan & Masuk</span>
                                                    <ArrowRight strokeWidth={2.5} className="absolute right-[-24px] h-[18px] w-[18px] -translate-x-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>

            {/* ═══════════ Right Panel — Stacked Imagery ═══════════ */}
            <div className="hidden lg:flex lg:w-1/2 p-12 xl:p-24 relative items-center justify-center overflow-hidden">
                <div className="relative w-full aspect-[4/5] max-w-[550px] mx-auto z-10">

                    {/* Back Image (Bottom layer) */}
                    <div className="absolute -left-8 top-0 w-[65%] h-[70%] rounded-[2rem] overflow-hidden shadow-xl rotate-[-6deg] transition-all duration-500 hover:rotate-[-4deg] hover:scale-105 hover:z-30 border-[6px] border-white">
                        <img
                            src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80"
                            alt="Tennis courts overview"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Middle Image (Right layer) */}
                    <div className="absolute -right-4 top-16 w-[70%] h-[60%] rounded-[2rem] overflow-hidden shadow-xl rotate-[8deg] transition-all duration-500 hover:rotate-[6deg] hover:scale-105 hover:z-30 border-[6px] border-white z-10">
                        <img
                            src="https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80"
                            alt="Playing padel"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Front Hero Image (Top main layer) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[40%] w-[80%] h-[75%] rounded-[2rem] overflow-hidden shadow-2xl z-20 border-[8px] border-white transition-all duration-500 hover:-translate-y-[42%] hover:scale-[1.03]">
                        <img
                            src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80"
                            alt="Padel racket close up"
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay text on the top image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-90" />
                        <div className="absolute bottom-0 left-0 p-8 w-full text-white">
                            <h3 className="font-heading text-3xl font-bold leading-tight mb-2 shadow-sm text-white">
                                Bergabunglah bersama kami.
                            </h3>
                            <div className="w-12 h-1 bg-padel-green mt-4 rounded-full" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
