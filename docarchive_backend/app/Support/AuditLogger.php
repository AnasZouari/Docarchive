<?php

namespace App\Support;

use App\Models\Document;
use App\Models\Service;
use Illuminate\Support\Facades\DB;

class AuditLogger
{
    public static function document(
        Document $document,
        string $action
    ): void {
        $actor = DocumentAccess::user();

        $service = $document->service_id
            ? Service::with('center')->find($document->service_id)
            : null;

        // Le centre est celui du document,
        // pas celui de l'administrateur qui effectue l'action.
        $center = $service?->center;

        DB::table('audit_logs')->insert([
            'user_id' => $actor?->id,
            'user_name' => $actor?->name ?? 'Système',
            'user_role' => $actor?->role,

            'center_id' => $center?->id,
            'center_name' => $center?->name,

            'document_id' => $document->id,
            'document_title' => $document->title,
            'document_reference' => $document->reference,

            'action' => $action,
            'created_at' => now('UTC'),
        ]);
    }
}