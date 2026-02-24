<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Sport extends Model
{
    /** @use HasFactory<\Database\Factories\SportFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'icon',
    ];

    /**
     * @return HasMany<Court, $this>
     */
    public function courts(): HasMany
    {
        return $this->hasMany(Court::class);
    }

    /**
     * @return HasManyThrough<Booking, Court, $this>
     */
    public function bookings(): HasManyThrough
    {
        return $this->hasManyThrough(Booking::class, Court::class);
    }
}
