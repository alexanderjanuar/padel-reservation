<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('bank_transfer','ewallet','cash','qris','midtrans') NOT NULL");

        Schema::table('payments', function (Blueprint $table) {
            $table->string('snap_token')->nullable()->after('notes');
            $table->string('midtrans_transaction_id')->nullable()->after('snap_token');
            $table->string('midtrans_order_id')->nullable()->unique()->after('midtrans_transaction_id');
            $table->timestamp('expired_at')->nullable()->after('midtrans_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['snap_token', 'midtrans_transaction_id', 'midtrans_order_id', 'expired_at']);
        });

        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('bank_transfer','ewallet','cash','qris') NOT NULL");
    }
};
