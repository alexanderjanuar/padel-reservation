<?php

use App\Models\Court;
use App\Models\Sport;

it('has many courts', function () {
    $sport = Sport::factory()->create();
    $courts = Court::factory(3)->create(['sport_id' => $sport->id]);

    expect($sport->courts)->toHaveCount(3)
        ->each->toBeInstanceOf(Court::class);
});

it('requires a unique slug', function () {
    Sport::factory()->create(['slug' => 'padel']);

    Sport::factory()->create(['slug' => 'padel']);
})->throws(\Illuminate\Database\QueryException::class);
