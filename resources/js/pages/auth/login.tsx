import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { home } from '@/routes';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F9FAFB] p-6 font-sans sm:p-12">
            <Head title="Masuk — VibePadel" />

            {/* Container */}
            <div className="w-full max-w-[1000px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 sm:flex sm:min-h-[600px]">

                {/* ═══════════ Left Panel — Form ═══════════ */}
                <div className="flex w-full flex-col justify-center px-8 py-12 sm:w-1/2 sm:px-12 lg:px-16">
                    {/* Header */}
                    <Link
                        href={home()}
                        className="mb-10 inline-block font-heading text-xl font-bold tracking-tight text-slate-900"
                    >
                        VibePadel
                    </Link>

                    <div>
                        <h1 className="mb-2 font-heading text-3xl font-semibold tracking-tight text-slate-900">
                            Masuk ke akun Anda
                        </h1>
                        <p className="mb-8 text-sm text-slate-500">
                            Masuk untuk melanjutkan reservasi lapangan.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6 rounded-md bg-emerald-50 p-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200/50">
                            {status}
                        </div>
                    )}

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="flex flex-col gap-5">
                                    {/* Email Field */}
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="mb-1.5 block text-sm font-medium text-slate-700"
                                        >
                                            Alamat Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            className="block w-full rounded-lg border-0 bg-slate-50 py-2.5 px-3.5 text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                                        />
                                        <InputError
                                            message={errors.email}
                                            className="mt-2"
                                        />
                                    </div>

                                    {/* Password Field */}
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <label
                                                htmlFor="password"
                                                className="block text-sm font-medium text-slate-700"
                                            >
                                                Password
                                            </label>
                                            {canResetPassword && (
                                                <Link
                                                    href={request()}
                                                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                                    tabIndex={5}
                                                >
                                                    Lupa password?
                                                </Link>
                                            )}
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            className="block w-full rounded-lg border-0 bg-slate-50 py-2.5 px-3.5 text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                                        />
                                        <InputError
                                            message={errors.password}
                                            className="mt-2"
                                        />
                                    </div>

                                    {/* Remember Me */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                        />
                                        <label
                                            htmlFor="remember"
                                            className="text-sm text-slate-600"
                                        >
                                            Ingat saya
                                        </label>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="mt-4">
                                    <button
                                        type="submit"
                                        className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70 disabled:hover:bg-slate-900"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                                        Masuk
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>

                    {canRegister && (
                        <p className="mt-8 text-center text-sm text-slate-500">
                            Belum mendaftar?{' '}
                            <Link
                                href={register()}
                                className="font-medium text-slate-900 transition-colors hover:underline"
                            >
                                Buat akun baru
                            </Link>
                        </p>
                    )}
                </div>

                {/* ═══════════ Right Panel — Image ═══════════ */}
                <div className="relative hidden w-1/2 bg-slate-50 sm:block">
                    <img
                        src="https://images.unsplash.com/photo-1646649853703-7645147474ba?auto=format&fit=crop&w=1200&q=80"
                        alt="Padel court"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </div>
            </div>
        </div>
    );
}
