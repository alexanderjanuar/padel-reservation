<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Facility extends Model
{
    /** @use HasFactory<\Database\Factories\FacilityFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'icon',
    ];

    /**
     * @return BelongsToMany<Venue, $this>
     */
    public function venues(): BelongsToMany
    {
        return $this->belongsToMany(Venue::class);
    }
}
