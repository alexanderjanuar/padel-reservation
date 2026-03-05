<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCourtRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'venue_id' => ['required', 'exists:venues,id'],
            'sport_id' => ['required', 'exists:sports,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:indoor,outdoor'],
            'price_per_hour' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'images_to_delete' => ['nullable', 'array'],
            'images_to_delete.*' => ['string'],
            'pricing_rules' => ['nullable', 'array'],
            'pricing_rules.*.days' => ['required', 'array'],
            'pricing_rules.*.days.*' => ['integer', 'min:0', 'max:6'],
            'pricing_rules.*.start_time' => ['required', 'date_format:H:i'],
            'pricing_rules.*.end_time' => ['required', 'date_format:H:i', 'after:pricing_rules.*.start_time'],
            'pricing_rules.*.price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
