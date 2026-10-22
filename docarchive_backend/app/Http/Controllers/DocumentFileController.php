<?php

namespace App\Http\Controllers;

use App\Support\AuditLogger;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;

class DocumentFileController extends Controller
{
    public function download(string $id)
    {
    $document = Document::findOrFail($id);
    $disk = Storage::disk('documents');

    abort_unless(
        $disk->exists($document->file_path),
        404,
        'Fichier privé introuvable.'
    );

    $response = $disk->download(
        $document->file_path,
        $document->file_name,
        [
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]
    );

    AuditLogger::document(
        $document,
        'download_requested'
    );

    return $response;
    }

    public function preview(string $id)
    {
        $document = Document::findOrFail($id);

        abort_unless(
            $document->status === 'archived',
            422,
            'Le document doit être archivé.'
        );

        abort_unless(
            strtolower(
                pathinfo(
                    $document->file_name,
                    PATHINFO_EXTENSION
                )
            ) === 'json',
            422,
            'Fichier JSON requis.'
        );

        $disk = Storage::disk('documents');

        abort_unless(
            $disk->exists($document->file_path),
            404,
            'Fichier privé introuvable.'
        );

        abort_if(
            $disk->size($document->file_path) >
                2 * 1024 * 1024,
            413,
            'Aperçu limité à 2 Mo.'
        );

        $content = $disk->get($document->file_path);

        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }

        try {
            $data = json_decode(
                $content,
                false,
                64,
                JSON_THROW_ON_ERROR
            );
        } catch (\JsonException $error) {
            abort(
                422,
                'JSON invalide ou trop profondément imbriqué.'
            );
        }

        return response()
            ->json(['data' => $data])
            ->header('Cache-Control', 'private, no-store');
    }
}