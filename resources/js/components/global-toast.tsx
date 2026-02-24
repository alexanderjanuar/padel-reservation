import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function GlobalToast() {
    const { flash = {} } = usePage().props as any;
    const [isMounted, setIsMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    // Default auto-dismiss duration in milliseconds
    const DURATION = 5000;
    const ANIMATION_DURATION = 300; // ms for the fade-out animation

    useEffect(() => {
        if (flash.success) {
            setMessage({ type: 'success', text: flash.success });
            setIsMounted(true);
            setIsClosing(false);
        } else if (flash.error) {
            setMessage({ type: 'error', text: flash.error });
            setIsMounted(true);
            setIsClosing(false);
        }
    }, [flash]);

    // Timer to trigger the closing animation
    useEffect(() => {
        if (isMounted && !isClosing) {
            const timer = setTimeout(() => {
                setIsClosing(true);
            }, DURATION);
            return () => clearTimeout(timer);
        }
    }, [isMounted, isClosing]);

    // Timer to actually unmount the component after the animation finishes
    useEffect(() => {
        if (isClosing) {
            const timer = setTimeout(() => {
                setIsMounted(false);
                setIsClosing(false);
            }, ANIMATION_DURATION);
            return () => clearTimeout(timer);
        }
    }, [isClosing]);

    if (!isMounted || !message) return null;

    const isSuccess = message.type === 'success';

    return (
        <div
            className={cn(
                'fixed top-4 right-4 z-50 w-full max-w-sm duration-300',
                isClosing
                    ? 'animate-out fade-out slide-out-to-right fill-mode-forwards'
                    : 'animate-in fade-in slide-in-from-top slide-in-from-right',
            )}
        >
            <Alert
                className={cn(
                    'relative overflow-hidden border-l-4 pr-12 shadow-lg',
                    isSuccess
                        ? 'border-y-padel-green/20 border-r-padel-green/20 bg-white text-padel-green-dark'
                        : 'border-y-red-100 border-r-red-100 bg-white text-red-900',
                )}
            >
                {isSuccess ? (
                    <CheckCircle className="h-5 w-5 stroke-[2.5]" />
                ) : (
                    <AlertCircle className="h-5 w-5 stroke-[2.5] text-red-500" />
                )}

                <AlertTitle className="mb-0 font-semibold tracking-wide">
                    {isSuccess ? 'Berhasil' : 'Gagal'}
                </AlertTitle>

                <AlertDescription className="mt-0.5 font-medium text-slate-600">
                    {message.text}
                </AlertDescription>

                {/* Close Button */}
                <button
                    onClick={() => setIsClosing(true)}
                    className="absolute top-3 right-3 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:outline-none"
                    aria-label="Tutup notifikasi"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Animated Progress Bar */}
                <div
                    className={cn(
                        'absolute bottom-0 left-0 h-1',
                        isSuccess ? 'bg-padel-green' : 'bg-red-500/30',
                    )}
                    style={{
                        animation: `toast-progress ${DURATION}ms linear forwards`,
                    }}
                />
            </Alert>

            {/* Inject minimal keyframes for the progress bar without touching global CSS */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes toast-progress {
                    0% { width: 100%; }
                    100% { width: 0%; }
                }
            `,
                }}
            />
        </div>
    );
}
