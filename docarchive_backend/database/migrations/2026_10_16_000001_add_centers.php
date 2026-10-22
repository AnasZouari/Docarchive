<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('centers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 150);
            $table->timestamps();
        });

        $now = now();

        $centers = [
            'SIEGE' => 'Siège',
            'RADES' => 'Radès',
            'SOUSSE' => 'Sousse',
            'SFAX' => 'Sfax',
        ];

        foreach ($centers as $code => $name) {
            DB::table('centers')->insert([
                'code' => $code,
                'name' => $name,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        Schema::table('services', function (Blueprint $table) {
            $table->foreignId('center_id')
                ->nullable()
                ->constrained('centers')
                ->restrictOnDelete();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('center_id')
                ->nullable()
                ->constrained('centers')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('center_id');
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropConstrainedForeignId('center_id');
        });

        Schema::dropIfExists('centers');
    }
};