<?php

namespace App\GraphQL\Mutations;

use App\Models\Archive;
use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ArchiveDocument
{
    public function resolve($root, array $args)
    {
        Validator::make($args, [
            'reason' => ['nullable', 'string', 'max:2000'],
        ])->validate();

        return DB::transaction(function () use ($args) {
            $document = Document::whereKey($args['id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($document->status !== 'active') {
                throw ValidationException::withMessages([
                    'id' => 'Le document n’est pas actif.',
                ]);
            }

            Archive::create([
                'document_id' => $document->id,
                'archive_date' => now(),
                'storage_location' => $document->file_path,
                'status' => 'archived',
                'reason' => $args['reason'] ?? null,
            ]);

            $document->update([
                'status' => 'archived',
            ]);

            return $document;
        });
    }
}