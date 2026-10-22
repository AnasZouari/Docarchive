<?php

namespace App\GraphQL\Mutations;

use App\Models\Category;
use App\Models\Folder;
use App\Models\Service;
use App\Support\DocumentAccess;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CreateClassification
{
    public function service($root, array $args)
    {
        DocumentAccess::admin();

        $user = DocumentAccess::user();

        // Le responsable utilise obligatoirement son centre.
        // Le super administrateur doit choisir le centre.
        $centerId = $user->role === 'super_admin'
            ? ($args['center_id'] ?? null)
            : $user->center_id;

        if (
            $user->role === 'admin'
            && isset($args['center_id'])
            && (string) $args['center_id']
                !== (string) $user->center_id
        ) {
            throw new AuthorizationException(
                'Vous pouvez créer des services uniquement dans votre centre.'
            );
        }

        $data = Validator::make(
            [
                'name' => trim($args['name'] ?? ''),
                'center_id' => $centerId,
            ],
            [
                'name' => [
                    'required',
                    'string',
                    'max:150',
                    Rule::unique('services', 'name'),
                ],
                'center_id' => [
                    'required',
                    'integer',
                    'exists:centers,id',
                ],
            ]
        )->validate();

        $service = new Service();
        $service->name = $data['name'];
        $service->center_id = $data['center_id'];
        $service->save();

        return $service;
    }

    public function category($root, array $args)
    {
        if (
            DocumentAccess::user()?->role
            !== 'super_admin'
        ) {
            throw new AuthorizationException(
                'La création des catégories communes est réservée au super administrateur.'
            );
        }

        $data = Validator::make(
            ['name' => trim($args['name'] ?? '')],
            [
                'name' => [
                    'required',
                    'string',
                    'max:150',
                    Rule::unique('categories', 'name'),
                ],
            ]
        )->validate();

        return Category::create($data);
    }

    public function folder($root, array $args)
    {
        DocumentAccess::admin();

        $service = DocumentAccess::requireService(
            $args['service_id'] ?? null
        );

        if ($service->center_id === null) {
            throw new AuthorizationException(
                'Affectez ce service à un centre avant de créer un dossier.'
            );
        }

        $data = Validator::make(
            [
                'name' => trim($args['name'] ?? ''),
                'service_id' => $service->id,
            ],
            [
                'name' => [
                    'required',
                    'string',
                    'max:150',
                    Rule::unique('folders', 'name')
                        ->where('service_id', $service->id),
                ],
                'service_id' => [
                    'required',
                    'integer',
                ],
            ]
        )->validate();

        return Folder::create($data);
    }
}