<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('bank_transfer','ewallet','cash','qris','midtrans','manual') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('bank_transfer','ewallet','cash','qris','midtrans') NOT NULL");
    }
};
