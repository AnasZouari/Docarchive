<?php

namespace App\Support;

use App\Models\Service;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DocumentAccess
{
    public static function user(): ?User
    {
        return Auth::guard('sanctum')->user();
    }

    public static function services(): Builder
    {
        $user = self::user();

        $query = Service::query();

        if ($user?->role === 'super_admin') {
            return $query;
        }

        // Un compte sans centre n'a accès à aucun service.
        if (!$user || $user->center_id === null) {
            return $query->whereRaw('1 = 0');
        }

        if ($user->role === 'admin') {
            return $query->where(
                'center_id',
                $user->center_id
            );
        }

        if (
            $user->role === 'agent'
            && $user->service_id !== null
        ) {
            return $query
                ->whereKey($user->service_id)
                ->where('center_id', $user->center_id);
        }

        return $query->whereRaw('1 = 0');
    }

    public static function restrict(Builder $query): void
    {
        if (self::user()?->role === 'super_admin') {
            return;
        }

        $column = $query
            ->getModel()
            ->qualifyColumn('service_id');

        $query->whereIn(
            $column,
            self::services()->select('services.id')
        );
    }

    public static function admin(): void
    {
        $user = self::user();

        if ($user?->role === 'super_admin') {
            return;
        }

        if (
            $user?->role === 'admin'
            && $user->center_id !== null
        ) {
            return;
        }

        throw new AuthorizationException(
            'Action réservée à un administrateur affecté à un centre.'
        );
    }

    public static function requireService(mixed $id): Service
    {
        $data = Validator::make(
            ['service_id' => $id],
            [
                'service_id' => [
                    'required',
                    'integer',
                    'min:1',
                ],
            ]
        )->validate();

        $service = self::services()
            ->whereKey($data['service_id'])
            ->first();

        if (!$service) {
            throw new AuthorizationException(
                'Ce service est introuvable ou ne fait pas partie de votre périmètre.'
            );
        }

        return $service;
    }

    public static function uploadService(array $args): array
    {
        $user = self::user();

        if (!$user) {
            throw new AuthorizationException(
                'Connexion requise.'
            );
        }

        if ($user->role === 'agent') {
            if (
                $user->center_id === null
                || $user->service_id === null
            ) {
                throw new AuthorizationException(
                    'Votre compte doit être affecté à un centre et à un service.'
                );
            }

            if (
                isset($args['service_id'])
                && (string) $args['service_id']
                    !== (string) $user->service_id
            ) {
                throw new AuthorizationException(
                    'Vous pouvez déposer uniquement dans votre service.'
                );
            }

            $args['service_id'] = $user->service_id;
        } elseif (!in_array(
            $user->role,
            ['admin', 'super_admin'],
            true
        )) {
            throw new AuthorizationException(
                'Votre compte ne peut pas déposer de document.'
            );
        }

        // Tout nouveau document doit avoir un service.
        $service = self::requireService(
            $args['service_id'] ?? null
        );

        if ($service->center_id === null) {
            throw new AuthorizationException(
                'Ce service doit être rattaché à un centre avant le dépôt.'
            );
        }

        $args['service_id'] = $service->id;

        return $args;
    }
}