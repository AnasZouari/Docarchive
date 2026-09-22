<?php

namespace App\GraphQL\Mutations;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CreateDocument
{
    public function resolve($root, array $args)
    {
        try {
            $file = $args['file'];
            
            if (!$file || !$file->isValid()) {
                throw new \Exception('Invalid file upload');
            }

            $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents', $fileName, 'public');

            $document = Document::create([
                'title' => $args['title'],
                'reference' => Document::generateReference(),
                'type' => $args['type'],
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'status' => 'active'
            ]);

            return $document;
        } catch (\Exception $e) {
            throw new \Exception('Failed to create document: ' . $e->getMessage());
        }
    }
}