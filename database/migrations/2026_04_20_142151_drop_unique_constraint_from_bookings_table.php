<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // MySQL uses the unique index as the backing index for the court_id FK.
            // Add a plain index on court_id first so the FK can use that instead.
            $table->index('court_id', 'bookings_court_id_index');
            $table->dropUnique(['court_id', 'date', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unique(['court_id', 'date', 'start_time']);
            $table->dropIndex('bookings_court_id_index');
        });
    }
};
