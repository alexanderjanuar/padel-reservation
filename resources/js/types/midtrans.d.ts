interface MidtransResult {
    order_id: string;
    transaction_status: string;
    payment_type: string;
    gross_amount: string;
    status_code: string;
    status_message: string;
    fraud_status?: string;
    transaction_id?: string;
}

interface MidtransSnap {
    pay: (
        token: string,
        options: {
            onSuccess?: (result: MidtransResult) => void;
            onPending?: (result: MidtransResult) => void;
            onError?: (result: MidtransResult) => void;
            onClose?: () => void;
        },
    ) => void;
}

interface Window {
    snap: MidtransSnap;
}
