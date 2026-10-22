<?php

namespace App\Http\Controllers;

use App\Models\Center;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserManagementController extends Controller
{
    private function manager(Request $request): User
    {
        $actor = $request->user();

        abort_unless(
            $actor && $actor->isAdmin(),
            403,
            'Accès réservé aux administrateurs.'
        );

        if (!$actor->isSuperAdmin()) {
            abort_unless(
                $actor->center_id !== null,
                403,
                'Aucun centre ne vous est affecté. Contactez le super administrateur.'
            );
        }

        return $actor;
    }

    private function checkTarget(User $actor, User $target): void
    {
        // Les comptes super administrateurs ne sont pas
        // modifiables depuis cette page.
        abort_if(
            $target->isSuperAdmin(),
            403,
            'Ce compte ne peut pas être modifié depuis cette page.'
        );

        if ($actor->isSuperAdmin()) {
            return;
        }

        abort_unless(
            $target->isAgent()
            && (int) $target->center_id === (int) $actor->center_id,
            403,
            'Vous pouvez gérer uniquement les agents de votre centre.'
        );
    }

    private function checkCenter(User $actor, int $centerId): void
    {
        abort_unless(
            $actor->isSuperAdmin()
            || (int) $actor->center_id === $centerId,
            403,
            'Vous ne pouvez pas affecter un utilisateur à un autre centre.'
        );
    }

    private function checkService(int $serviceId, int $centerId): void
    {
        $exists = Service::query()
            ->whereKey($serviceId)
            ->where('center_id', $centerId)
            ->exists();

        if (!$exists) {
            throw ValidationException::withMessages([
                'service_id' => [
                    'Le service sélectionné doit appartenir au centre choisi.',
                ],
            ]);
        }
    }

    public function index(Request $request)
    {
        $actor = $this->manager($request);

        $users = User::query()
            ->with(['center', 'service'])
            ->orderBy('name');

        $centers = Center::query()->orderBy('name');

        $services = Service::query()
            ->whereNotNull('center_id')
            ->orderBy('name');

        if (!$actor->isSuperAdmin()) {
            $users
                ->where('role', 'agent')
                ->where('center_id', $actor->center_id);

            $centers->whereKey($actor->center_id);

            $services->where('center_id', $actor->center_id);
        }

        return response()->json([
            'users' => $users->get(),
            'centers' => $centers->get(),
            'services' => $services->get(),
        ]);
    }

    public function store(Request $request)
    {
        $actor = $this->manager($request);

        $allowedRoles = $actor->isSuperAdmin()
            ? ['admin', 'agent']
            : ['agent'];

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],
            'password' => [
                'required',
                'confirmed',
                Password::min(8),
            ],
            'role' => [
                'required',
                Rule::in($allowedRoles),
            ],
            'center_id' => [
                'required',
                'integer',
                'exists:centers,id',
            ],
            'service_id' => [
                'nullable',
                'required_if:role,agent',
                'integer',
                'exists:services,id',
            ],
        ]);

        $centerId = (int) $data['center_id'];

        $this->checkCenter($actor, $centerId);

        $user = DB::transaction(function () use ($data, $centerId) {
            if ($data['role'] === 'agent') {
                // Verrouille le service durant la vérification
                // et la création du compte.
                Service::query()
                    ->whereKey($data['service_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->checkService(
                    (int) $data['service_id'],
                    $centerId
                );
            }

            $user = new User();
            $user->name = trim($data['name']);
            $user->email = trim($data['email']);
            $user->password = Hash::make($data['password']);
            $user->role = $data['role'];
            $user->center_id = $centerId;

            $user->service_id = $data['role'] === 'agent'
                ? (int) $data['service_id']
                : null;

            $user->save();

            return $user;
        });

        return response()->json(
            $user->load(['center', 'service']),
            201
        );
    }

    public function assignService(Request $request, User $user)
    {
        $actor = $this->manager($request);

        $updated = DB::transaction(function () use (
            $request,
            $actor,
            $user
        ) {
            $target = User::query()
                ->whereKey($user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->checkTarget($actor, $target);

            $data = $request->validate([
                // Cette route modifie l’affectation, pas le rôle.
                'role' => ['prohibited'],
                'center_id' => [
                    'required',
                    'integer',
                    'exists:centers,id',
                ],
                'service_id' => [
                    $target->isAgent() ? 'required' : 'nullable',
                    'integer',
                    'exists:services,id',
                ],
            ]);

            $centerId = (int) $data['center_id'];

            $this->checkCenter($actor, $centerId);

            if ($target->isAgent()) {
                Service::query()
                    ->whereKey($data['service_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->checkService(
                    (int) $data['service_id'],
                    $centerId
                );
            }

            $target->center_id = $centerId;

            $target->service_id = $target->isAgent()
                ? (int) $data['service_id']
                : null;

            $changed = $target->isDirty([
                'center_id',
                'service_id',
            ]);

            $target->save();

            // Une nouvelle connexion actualisera l’affectation
            // dans l’interface de l’utilisateur concerné.
            if ($changed) {
                $target->tokens()->delete();
            }

            return $target;
        });

        return response()->json(
            $updated->load(['center', 'service'])
        );
    }
}