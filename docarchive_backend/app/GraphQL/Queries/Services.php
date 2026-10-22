<?php

namespace App\GraphQL\Queries;

use App\Support\DocumentAccess;

class Services
{
    public function resolve($root, array $args)
    {
        return DocumentAccess::services()
            ->orderBy('name')
            ->get();
    }
}