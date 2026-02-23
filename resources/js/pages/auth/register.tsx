import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { home } from '@/routes';

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
                <div className="flex flex-1 flex-col justify-center max-w-md w-full mx-auto lg:mx-0 py-16">
                    <div className="login-form-stagger mb-12">
                        <h1 className="mb-4 font-heading text-[2.5rem] leading-tight font-medium tracking-tight text-slate-900 sm:text-5xl">
                            Buat Akun
                        </h1>
                        <p className="text-[15px] leading-relaxed tracking-wide text-slate-500">
                            Bergabunglah dengan VibePadel untuk mulai memesan lapangan dan bermain.
                        </p>
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                        className="flex flex-col gap-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="login-form-stagger flex flex-col gap-5">
                                    {/* Name Field */}
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase"
                                        >
                                            Nama Lengkap
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            name="name"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="name"
                                            className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-[15px] text-slate-900 ring-1 ring-inset ring-transparent transition-all placeholder:text-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-padel-green"
                                        />
                                        <InputError
                                            message={errors.name}
                                            className="mt-2"
                                        />
                                    </div>

                                    {/* Email Field */}
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase"
                                        >
                                            Alamat Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            tabIndex={2}
                                            autoComplete="email"
                                            className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-[15px] text-slate-900 ring-1 ring-inset ring-transparent transition-all placeholder:text-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-padel-green"
                                        />
                                        <InputError
                                            message={errors.email}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Password Field */}
                                        <div>
                                            <label
                                                htmlFor="password"
                                                className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase"
                                            >
                                                Password
                                            </label>
                                            <input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={3}
                                                autoComplete="new-password"
                                                className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-[15px] text-slate-900 ring-1 ring-inset ring-transparent transition-all placeholder:text-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-padel-green"
                                            />
                                            <InputError
                                                message={errors.password}
                                                className="mt-2"
                                            />
                                        </div>

                                        {/* Confirm Password Field */}
                                        <div>
                                            <label
                                                htmlFor="password_confirmation"
                                                className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase truncate"
                                                title="Konfirmasi Password"
                                            >
                                                Konfirmasi
                                            </label>
                                            <input
                                                id="password_confirmation"
                                                type="password"
                                                name="password_confirmation"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-[15px] text-slate-900 ring-1 ring-inset ring-transparent transition-all placeholder:text-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-padel-green"
                                            />
                                            <InputError
                                                message={errors.password_confirmation}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="login-form-stagger mt-6">
                                    <button
                                        type="submit"
                                        className="flex w-full items-center justify-center rounded-xl bg-padel-green px-6 py-4 text-[15px] font-semibold tracking-wide text-white transition-all hover:bg-padel-green-dark active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                                        tabIndex={5}
                                        disabled={processing}
                                        data-test="register-button"
                                    >
                                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                                        Buat Akun
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
                                <span className="bg-white px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">atau daftar dengan</span>
                            </div>
                        </div>

                        <a
                            href="/auth/google/redirect"
                            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 text-[15px] font-semibold tracking-wide text-slate-700 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2"
                            tabIndex={6}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Google
                        </a>
                    </div>
                </div>
            </div>

            {/* ═══════════ Right Panel — The Bento Grid Image Layout ═══════════ */}
            <div className="hidden lg:flex lg:w-1/2 p-4 xl:p-6 bg-white items-center justify-center">
                <div className="grid h-full max-h-[850px] w-full grid-cols-2 grid-rows-3 gap-3 xl:gap-5">
                    {/* Main large image (Court perspective) */}
                    <div className="col-span-2 row-span-2 overflow-hidden rounded-[2rem] bg-slate-100">
                        <img
                            src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80"
                            alt="Tennis court overview"
                            className="h-full w-full object-cover transition-transform duration-[40s] ease-out hover:scale-110"
                        />
                    </div>
                    {/* Bottom left detail image */}
                    <div className="col-span-1 row-span-1 overflow-hidden rounded-[2rem] bg-slate-100">
                        <img
                            src="https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=600&q=80"
                            alt="Racket detail"
                            className="h-full w-full object-cover transition-transform duration-[20s] ease-out hover:scale-110"
                        />
                    </div>
                    {/* Bottom right image (Padel Court interior) */}
                    <div className="col-span-1 row-span-1 overflow-hidden rounded-[2rem] bg-slate-100">
                        <img
                            src="https://images.unsplash.com/photo-1646649853703-7645147474ba?auto=format&fit=crop&w=600&q=80"
                            alt="Padel court interior"
                            className="h-full w-full object-cover transition-transform duration-[20s] ease-out hover:scale-110"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
