<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Archive extends Model
{
    protected $fillable = [
        'document_id',
        'archive_date',
        'storage_location',
        'status',
        'reason',
    ];

    protected $casts = [
        'archive_date' => 'datetime',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}
