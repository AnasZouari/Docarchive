<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Folder extends Model
{
    protected $fillable = [
        'name',
        'service_id',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
    protected static function booted(): void
{
    static::addGlobalScope(
        'service_access',
        function (\Illuminate\Database\Eloquent\Builder $query) {
            \App\Support\DocumentAccess::restrict($query);
        }
    );
}

    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}