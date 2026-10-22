<?php

namespace App\GraphQL\Mutations;

use App\Models\Document;
use App\Support\DocumentAccess;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RestoreDocument
{
    public function resolve($root, array $args)
    {
        DocumentAccess::admin();

        return DB::transaction(function () use ($args) {
            $document = Document::whereKey($args['id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($document->status !== 'archived') {
                throw ValidationException::withMessages([
                    'id' => 'Le document n’est pas archivé.',
                ]);
            }

            $archive = $document->archives()
                ->where('status', 'archived')
                ->latest('id')
                ->first();

            if ($archive) {
                $archive->update([
                    'status' => 'restored',
                ]);
            }

            $document->update([
                'status' => 'active',
            ]);

            return $document;
        });
    }
}