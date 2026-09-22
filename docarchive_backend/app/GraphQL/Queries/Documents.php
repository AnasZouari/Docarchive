<?php

namespace App\GraphQL\Queries;

use App\Models\Document;

class Documents
{
    public function resolve($root, array $args)
    {
        return Document::with('archives')->latest()->get();
    }
}