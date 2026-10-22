<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where(
            'email',
            $data['email']
        )->first();

        if (
            !$user ||
            !Hash::check($data['password'], $user->password)
        ) {
            throw ValidationException::withMessages([
                'email' => [
                    'Adresse e-mail ou mot de passe incorrect.',
                ],
            ]);
        }

        return response()->json(
            $this->session($user)
        );
    }

    public function logout(Request $request)
    {
        $request->user()
            ->currentAccessToken()
            ->delete();

        return response()->noContent();
    }

    private function session(User $user): array
    {
        return [
            'user' => $user->load('service'),

            'token' => $user->createToken(
                'docarchive',
                ['*'],
                now()->addHours(12)
            )->plainTextToken,
        ];
    }
}