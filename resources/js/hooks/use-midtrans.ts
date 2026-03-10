import { useCallback, useState } from 'react';

export type MidtransStatus = 'idle' | 'pending' | 'success' | 'error' | 'closed';

export function useMidtrans() {
    const [status, setStatus] = useState<MidtransStatus>('idle');
    const [result, setResult] = useState<MidtransResult | null>(null);

    const pay = useCallback((snapToken: string) => {
        if (!window.snap) {
            console.error('Midtrans Snap.js is not loaded');
            setStatus('error');

            return;
        }

        setStatus('pending');

        window.snap.pay(snapToken, {
            onSuccess: (res) => {
                setResult(res);
                setStatus('success');
            },
            onPending: (res) => {
                setResult(res);
                setStatus('pending');
            },
            onError: (res) => {
                setResult(res);
                setStatus('error');
            },
            onClose: () => {
                setStatus('closed');
            },
        });
    }, []);

    const reset = useCallback(() => {
        setStatus('idle');
        setResult(null);
    }, []);

    return { status, result, pay, reset };
}
