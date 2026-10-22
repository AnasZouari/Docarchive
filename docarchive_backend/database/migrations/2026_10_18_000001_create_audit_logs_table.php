<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // Valeurs conservées indépendamment des suppressions
            // ou des changements d'affectation ultérieurs.
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name');
            $table->string('user_role', 30)->nullable();

            $table->unsignedBigInteger('center_id')->nullable();
            $table->string('center_name')->nullable();

            $table->unsignedBigInteger('document_id');
            $table->string('document_title');
            $table->string('document_reference');

            $table->string('action', 40);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['center_id', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index('document_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};