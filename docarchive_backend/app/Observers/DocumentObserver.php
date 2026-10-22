<?php

namespace App\Observers;

use App\Models\Document;
use App\Support\AuditLogger;

class DocumentObserver
{
    public function created(Document $document): void
    {
        AuditLogger::document($document, 'created');
    }

    public function updated(Document $document): void
    {
        if (!$document->wasChanged('status')) {
            return;
        }

        $previousStatus = $document->getOriginal('status');

        if ($document->status === 'archived') {
            AuditLogger::document($document, 'archived');
        } elseif (
            $document->status === 'active'
            && $previousStatus === 'archived'
        ) {
            AuditLogger::document($document, 'restored');
        }
    }

    public function deleted(Document $document): void
    {
        AuditLogger::document($document, 'deleted');
    }
}