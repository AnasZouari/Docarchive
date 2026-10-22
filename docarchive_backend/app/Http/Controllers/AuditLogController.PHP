<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless(
            $user
            && in_array(
                $user->role,
                ['super_admin', 'admin'],
                true
            ),
            403,
            'Accès réservé aux administrateurs.'
        );

        if ($user->role === 'admin') {
            abort_unless(
                $user->center_id !== null,
                403,
                'Aucun centre ne vous est affecté.'
            );
        }

        $data = $request->validate([
            'action' => [
                'nullable',
                Rule::in([
                    'created',
                    'archived',
                    'restored',
                    'deleted',
                    'download_requested',
                ]),
            ],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        if (
            !empty($data['from'])
            && !empty($data['to'])
            && $data['from'] > $data['to']
        ) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'to' => [
                    'La date de fin doit être postérieure ou égale à la date de début.',
                ],
            ]);
        }

        $query = DB::table('audit_logs');

        // Ce filtre ne dépend d'aucun paramètre fourni
        // par le navigateur.
        if ($user->role === 'admin') {
            $query->where('center_id', $user->center_id);
        }

        if (!empty($data['action'])) {
            $query->where('action', $data['action']);
        }

        if (!empty($data['from'])) {
            $query->where(
                'created_at',
                '>=',
                CarbonImmutable::parse(
                    $data['from'],
                    'UTC'
                )->startOfDay()
            );
        }

        if (!empty($data['to'])) {
            $query->where(
                'created_at',
                '<',
                CarbonImmutable::parse(
                    $data['to'],
                    'UTC'
                )->startOfDay()->addDay()
            );
        }

        return response()
            ->json(
                $query
                    ->orderByDesc('id')
                    ->paginate(25)
            )
            ->header('Cache-Control', 'private, no-store');
    }
}