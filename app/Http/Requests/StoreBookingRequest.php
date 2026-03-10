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
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'guest_name' => ['nullable', 'string', 'max:255', 'required_without:user_id'],
            'guest_email' => ['nullable', 'email', 'max:255', 'required_without:user_id'],
            'guest_phone' => ['nullable', 'string', 'max:30', 'required_without:user_id'],
            'court_id' => ['required', 'integer', 'exists:courts,id'],
            'date' => ['required', 'date', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'total_price' => ['required', 'integer', 'min:0'],
            'payment_status' => ['required', $this->routeIs('bookings.guest') ? 'in:midtrans' : 'in:paid,unpaid'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'guest_name.required_without' => 'Nama wajib diisi untuk pemesanan tanpa akun.',
            'guest_email.required_without' => 'Email wajib diisi untuk pemesanan tanpa akun.',
            'guest_phone.required_without' => 'Nomor telepon wajib diisi untuk pemesanan tanpa akun.',
            'court_id.required' => 'Lapangan harus dipilih.',
            'date.required' => 'Tanggal booking harus diisi.',
            'start_time.required' => 'Waktu mulai harus dipilih.',
            'end_time.after' => 'Waktu selesai harus setelah waktu mulai.',
            'payment_status.in' => 'Status pembayaran tidak valid.',
        ];
    }
}
