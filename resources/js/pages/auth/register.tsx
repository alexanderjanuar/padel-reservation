import { Form, Head, Link } from '@inertiajs/react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { home } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <div className="flex min-h-dvh w-full bg-white font-sans text-slate-900">
            <Head title="Daftar — VibePadel" />

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
                    <Link
                        href={login()}
                        className="text-sm font-medium tracking-wide text-slate-500 transition-colors hover:text-padel-green"
                    >
                        Masuk
                    </Link>
                </div>

                {/* Main Form Area */}
                <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16 lg:mx-0">
                    <div className="login-form-stagger mb-12">
                        <h1 className="mb-4 font-heading text-[2.5rem] leading-tight font-medium tracking-tight text-slate-900 sm:text-5xl">
                            Buat Akun
                        </h1>
                        <p className="text-[15px] leading-relaxed tracking-wide text-slate-500">
                            Bergabunglah dengan VibePadel untuk mulai memesan
                            lapangan dan bermain.
                        </p>
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password', 'password_confirmation']}
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="login-form-stagger flex flex-col gap-6">
                                    {/* Name Field */}
                                    <div className="group relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors duration-300 group-focus-within:text-padel-green">
                                            <User className="h-[18px] w-[18px]" />
                                        </div>
                                        <input
                                            id="name"
                                            type="text"
                                            name="name"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="name"
                                            placeholder=" "
                                            className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-4 pt-6 pb-2.5 pl-11 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                        />
                                        <label
                                            htmlFor="name"
                                            className="pointer-events-none absolute top-1/2 left-11 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                        >
                                            Nama Lengkap
                                        </label>
                                        <InputError
                                            message={errors.name}
                                            className="mt-2"
                                        />
                                    </div>

                                    {/* Email Field */}
                                    <div className="group relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors duration-300 group-focus-within:text-padel-green">
                                            <Mail className="h-[18px] w-[18px]" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            tabIndex={2}
                                            autoComplete="email"
                                            placeholder=" "
                                            className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-4 pt-6 pb-2.5 pl-11 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                        />
                                        <label
                                            htmlFor="email"
                                            className="pointer-events-none absolute top-1/2 left-11 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                        >
                                            Alamat Email
                                        </label>
                                        <InputError
                                            message={errors.email}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Password Field */}
                                        <div className="group relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors duration-300 group-focus-within:text-padel-green">
                                                <Lock className="h-[18px] w-[18px]" />
                                            </div>
                                            <input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={3}
                                                autoComplete="new-password"
                                                placeholder=" "
                                                className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-4 pt-6 pb-2.5 pl-11 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                            />
                                            <label
                                                htmlFor="password"
                                                className="pointer-events-none absolute top-1/2 left-11 -translate-y-1/2 text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                            >
                                                Password
                                            </label>
                                            <InputError
                                                message={errors.password}
                                                className="mt-2"
                                            />
                                        </div>

                                        {/* Confirm Password Field */}
                                        <div className="group relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors duration-300 group-focus-within:text-padel-green">
                                                <Lock className="h-[18px] w-[18px]" />
                                            </div>
                                            <input
                                                id="password_confirmation"
                                                type="password"
                                                name="password_confirmation"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                placeholder=" "
                                                className="peer block w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-4 pt-6 pb-2.5 pl-11 text-[15px] font-medium text-slate-900 placeholder-transparent transition-all duration-300 hover:border-slate-300 focus:border-padel-green focus:bg-transparent focus:ring-0 focus:outline-none"
                                            />
                                            <label
                                                htmlFor="password_confirmation"
                                                className="pointer-events-none absolute top-1/2 left-11 max-w-[calc(100%-3rem)] -translate-y-1/2 truncate text-[15px] font-normal text-slate-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-padel-green peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                                            >
                                                Konfirmasi
                                            </label>
                                            <InputError
                                                message={
                                                    errors.password_confirmation
                                                }
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Interactive Submit Button */}
                                <div className="login-form-stagger mt-8">
                                    <button
                                        type="submit"
                                        className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-padel-green px-6 py-4 text-[15px] font-semibold tracking-wide text-white shadow-lg shadow-padel-green/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-padel-green-dark hover:shadow-xl hover:shadow-padel-green/40 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:hover:-translate-y-0 disabled:active:scale-100"
                                        tabIndex={5}
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
                                                    <span className="translate-x-3 transition-transform duration-300 ease-out group-hover:translate-x-0">
                                                        Buat Akun
                                                    </span>
                                                    <ArrowRight
                                                        strokeWidth={2.5}
                                                        className="absolute right-[-24px] h-[18px] w-[18px] -translate-x-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100"
                                                    />
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>

                    <div className="login-form-stagger mt-8">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    atau daftar dengan
                                </span>
                            </div>
                        </div>

                        <a
                            href="/auth/google/redirect"
                            className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-100 bg-white px-6 py-4 text-[15px] font-semibold tracking-wide text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:shadow-md focus:border-padel-green focus:ring-4 focus:ring-padel-green/10 focus:outline-none active:translate-y-0 active:scale-[0.98]"
                            tabIndex={6}
                        >
                            <svg
                                className="h-[18px] w-[18px] transition-transform duration-300 ease-out group-hover:scale-110"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Daftar dengan Google
                        </a>
                    </div>
                </div>
            </div>

            {/* ═══════════ Right Panel — Stacked Imagery ═══════════ */}
            <div className="relative hidden items-center justify-center overflow-hidden p-12 lg:flex lg:w-1/2 xl:p-24">
                <div className="relative z-10 mx-auto aspect-[4/5] w-full max-w-[550px]">
                    {/* Back Image (Bottom layer) */}
                    <div className="absolute top-0 -left-8 h-[70%] w-[65%] rotate-[-6deg] overflow-hidden rounded-[2rem] border-[6px] border-white shadow-xl transition-all duration-500 hover:z-30 hover:scale-105 hover:rotate-[-4deg]">
                        <img
                            src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80"
                            alt="Tennis courts overview"
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* Middle Image (Right layer) */}
                    <div className="absolute top-16 -right-4 z-10 h-[60%] w-[70%] rotate-[8deg] overflow-hidden rounded-[2rem] border-[6px] border-white shadow-xl transition-all duration-500 hover:z-30 hover:scale-105 hover:rotate-[6deg]">
                        <img
                            src="https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80"
                            alt="Playing padel"
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* Front Hero Image (Top main layer) */}
                    <div className="absolute top-1/2 left-1/2 z-20 h-[75%] w-[80%] -translate-x-1/2 -translate-y-[40%] overflow-hidden rounded-[2rem] border-[8px] border-white shadow-2xl transition-all duration-500 hover:-translate-y-[42%] hover:scale-[1.03]">
                        <img
                            src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80"
                            alt="Padel match view"
                            className="h-full w-full object-cover"
                        />

                        {/* Overlay text on the top image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-90" />
                        <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                            <h3 className="mb-2 font-heading text-3xl leading-tight font-bold text-white shadow-sm">
                                Mulai perjalanan
                                <br />
                                Padel Anda.
                            </h3>
                            <div className="mt-4 h-1 w-12 rounded-full bg-padel-green" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
