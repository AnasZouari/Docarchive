<?php

namespace App\GraphQL\Mutations;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;

class DeleteDocument
{
    public function resolve($root, array $args)
    {
        try {
            $document = Document::findOrFail($args['id']);
            Storage::disk('public')->delete($document->file_path);
            $document->delete();
            return true;
        } catch (\Exception $e) {
            throw new \Exception('Failed to delete document: ' . $e->getMessage());
        }
    }
}