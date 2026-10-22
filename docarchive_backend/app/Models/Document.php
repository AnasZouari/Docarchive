<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'reference',
        'type',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'metadata',
        'service_id',
        'category_id',
        'folder_id',
        'description',
        'document_date',
        'product',
        'status',
    ];

    protected $casts = [
        'metadata' => 'array',
        'file_size' => 'integer',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function folder()
    {
        return $this->belongsTo(Folder::class);
    }

    public function archives()
    {
        return $this->hasMany(Archive::class);
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

    public static function generateReference()
    {
        return 'DOC-'
            . date('Ymd')
            . '-'
            . strtoupper(Str::random(6));
    }

    public function getFileUrlAttribute()
{
    return url(
        'api/documents/' . $this->id . '/download'
    );
}
    public function getFormattedSizeAttribute()
    {
        $bytes = $this->file_size;

        if ($bytes >= 1073741824) {
            return round($bytes / 1073741824, 2) . ' GB';
        }

        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        }

        if ($bytes >= 1024) {
            return round($bytes / 1024, 2) . ' KB';
        }

        return $bytes . ' B';
    }
}