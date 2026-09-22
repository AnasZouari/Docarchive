<?php

namespace App\GraphQL\Queries;

use App\Models\Document;

class DocumentStats
{
    public function resolve($root, array $args)
    {
        try {
            $total = Document::count();
            $active = Document::where('status', 'active')->count();
            $archived = Document::where('status', 'archived')->count();
            $totalSize = Document::sum('file_size');

            return [
                'total' => $total,
                'active' => $active,
                'archived' => $archived,
                'totalSize' => $this->formatSize($totalSize)
            ];
        } catch (\Exception $e) {
            return [
                'total' => 0,
                'active' => 0,
                'archived' => 0,
                'totalSize' => '0 B'
            ];
        }
    }

    private function formatSize($bytes)
    {
        if ($bytes >= 1073741824) return round($bytes / 1073741824, 2) . ' GB';
        if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024, 2) . ' KB';
        return $bytes . ' B';
    }
}