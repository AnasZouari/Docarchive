<?php

namespace App\GraphQL\Mutations;

use App\Models\Document;
use App\Support\DocumentAccess;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DeleteDocument
{
    public function resolve($root, array $args)
    {
        DocumentAccess::admin();

        return DB::transaction(function () use ($args) {
            $document = Document::whereKey($args['id'])
                ->lockForUpdate()
                ->firstOrFail();

            $disk = Storage::disk('documents');
            $path = $document->file_path;

            if (
                $disk->exists($path) &&
                !$disk->delete($path)
            ) {
                throw new \RuntimeException(
                    'Suppression du fichier impossible.'
                );
            }

            $document->delete();

            return true;
        });
    }
}