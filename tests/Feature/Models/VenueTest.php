<?php

use App\Models\Court;
use App\Models\Facility;
use App\Models\Review;
use App\Models\Sport;
use App\Models\User;
use App\Models\Venue;

it('has many courts', function () {
    $venue = Venue::factory()->create();
    $sport = Sport::factory()->create();
    Court::factory(3)->create(['venue_id' => $venue->id, 'sport_id' => $sport->id]);

    expect($venue->courts)->toHaveCount(3)
        ->each->toBeInstanceOf(Court::class);
});

it('has many facilities via pivot', function () {
    $venue = Venue::factory()->create();
    $facilities = Facility::factory(4)->create();
    $venue->facilities()->attach($facilities->pluck('id'));

    expect($venue->facilities)->toHaveCount(4)
        ->each->toBeInstanceOf(Facility::class);
});

it('has many reviews', function () {
    $venue = Venue::factory()->create();
    $users = User::factory(3)->create();

    $users->each(fn (User $user) => Review::factory()->create([
        'venue_id' => $venue->id,
        'user_id' => $user->id,
    ]));

    expect($venue->reviews)->toHaveCount(3)
        ->each->toBeInstanceOf(Review::class);
});

it('requires a unique slug', function () {
    Venue::factory()->create(['slug' => 'test-venue']);

    Venue::factory()->create(['slug' => 'test-venue']);
})->throws(\Illuminate\Database\QueryException::class);
