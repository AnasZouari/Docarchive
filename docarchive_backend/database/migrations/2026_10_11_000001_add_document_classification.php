<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['services', 'categories'] as $name) {
            Schema::create($name, function (Blueprint $table) {
                $table->id();
                $table->string('name', 150)->unique();
                $table->timestamps();
            });
        }

        Schema::create('folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('name', 150);
            $table->timestamps();

            $table->unique(['service_id', 'name']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('service_id')
                ->nullable()
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('category_id')
                ->nullable()
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('folder_id')
                ->nullable()
                ->constrained()
                ->restrictOnDelete();

            $table->text('description')->nullable();
            $table->date('document_date')->nullable();
            $table->string('product', 50)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('folder_id');
            $table->dropConstrainedForeignId('category_id');
            $table->dropConstrainedForeignId('service_id');

            $table->dropColumn([
                'description',
                'document_date',
                'product',
            ]);
        });

        Schema::dropIfExists('folders');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('services');
    }
};