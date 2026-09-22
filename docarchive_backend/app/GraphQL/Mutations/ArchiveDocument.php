<?php

namespace App\GraphQL\Mutations;

use App\Models\Document;
use App\Models\Archive;
use Illuminate\Support\Facades\Storage;

class ArchiveDocument
{
    public function resolve($root, array $args)
    {
        try {
            $document = Document::findOrFail($args['id']);
            
            if ($document->status === 'archived') {
                throw new \Exception('Document is already archived');
            }

            $newPath = 'archives/' . basename($document->file_path);
            Storage::disk('public')->move($document->file_path, $newPath);

            Archive::create([
                'document_id' => $document->id,
                'archive_date' => now(),
                'storage_location' => $newPath,
                'reason' => $args['reason'] ?? null
            ]);

            $document->update([
                'status' => 'archived',
                'file_path' => $newPath
            ]);

            return $document;
        } catch (\Exception $e) {
            throw new \Exception('Failed to archive document: ' . $e->getMessage());
        }
    }
}