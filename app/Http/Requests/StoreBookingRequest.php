<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'court_id' => ['required', 'integer', 'exists:courts,id'],
            'date' => ['required', 'date', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'total_price' => ['required', 'integer', 'min:0'],
            'payment_status' => ['required', 'in:paid,unpaid'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'Kustomer harus dipilih.',
            'court_id.required' => 'Lapangan harus dipilih.',
            'date.required' => 'Tanggal booking harus diisi.',
            'start_time.required' => 'Waktu mulai harus dipilih.',
            'end_time.after' => 'Waktu selesai harus setelah waktu mulai.',
            'payment_status.in' => 'Status pembayaran tidak valid.',
        ];
    }
}
