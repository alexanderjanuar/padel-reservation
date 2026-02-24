<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVenueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('venues', 'name')->ignore($this->route('venue')),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'is_active' => ['boolean'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'existing_images' => ['nullable', 'array'],
            'existing_images.*' => ['string'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama tempat',
            'description' => 'deskripsi',
            'address' => 'alamat',
            'city' => 'kota',
            'phone' => 'telepon',
            'is_active' => 'status aktif',
            'images' => 'gambar',
            'images.*' => 'file gambar',
            'existing_images' => 'gambar lama',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => $this->boolean('is_active'),
            ]);
        }
    }
}
