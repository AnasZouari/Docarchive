<?php

namespace App\GraphQL\Mutations;

use App\Models\Document;
use App\Support\DocumentAccess;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CreateDocument
{
    public function resolve($root, array $args)
    {
        $args = DocumentAccess::uploadService($args);
        $args['title'] = trim($args['title'] ?? '');

        $validated = Validator::make($args, [
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:50'],
            'file' => ['required', 'file', 'max:10240'],

            'service_id' => [
                'required',
                'integer',
                'exists:services,id',
            ],

            'category_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
            ],

            'folder_id' => [
                'nullable',
                'integer',
                Rule::exists('folders', 'id')
                    ->where('service_id', $args['service_id']),
            ],

            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'document_date' => [
                'nullable',
                'date_format:Y-m-d',
            ],

            'product' => [
                'nullable',
                Rule::in(['Riz', 'Sucre', 'Café', 'Thé', 'Autre']),
            ],
        ])->validate();

        $file = $validated['file'];
        unset($validated['file']);

        $fileName = Str::uuid()
            . '.'
            . $file->getClientOriginalExtension();

        $path = $file->storeAs(
            'documents',
            $fileName,
            'documents'
        );

        if (!$path) {
            throw new \RuntimeException(
                'Impossible de stocker le fichier.'
            );
        }

        try {
            return DB::transaction(function () use (
                $validated,
                $file,
                $path
            ) {
                // L'observateur enregistre aussi l'événement
                // à l'intérieur de cette transaction.
                return Document::create(array_merge($validated, [
                    'reference' => Document::generateReference(),
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType()
                        ?: 'application/octet-stream',
                    'status' => 'active',
                ]));
            });
        } catch (\Throwable $error) {
            Storage::disk('documents')->delete($path);

            throw $error;
        }
    }
}