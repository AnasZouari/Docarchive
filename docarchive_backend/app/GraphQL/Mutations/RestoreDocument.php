<?php

namespace App\GraphQL\Mutations;

use App\Models\Document;
use App\Models\Archive;
use Illuminate\Support\Facades\Storage;

class RestoreDocument
{
    public function resolve($root, array $args)
    {
        try {
            $document = Document::findOrFail($args['id']);
            
            if ($document->status !== 'archived') {
                throw new \Exception('Document is not archived');
            }

            $newPath = 'documents/' . basename($document->file_path);
            Storage::disk('public')->move($document->file_path, $newPath);

            $document->update([
                'status' => 'active',
                'file_path' => $newPath
            ]);

            Archive::where('document_id', $args['id'])->update(['status' => 'restored']);

            return $document;
        } catch (\Exception $e) {
            throw new \Exception('Failed to restore document: ' . $e->getMessage());
        }
    }
}