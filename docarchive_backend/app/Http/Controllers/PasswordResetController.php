<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        // Même réponse pour une adresse inconnue,
        // un lien envoyé ou une demande trop rapprochée.
        Password::broker('users')->sendResetLink([
            'email' => trim($data['email']),
        ]);

        return response()->json([
            'message' =>
                'Si cette adresse correspond à un compte, un lien de réinitialisation sera envoyé.',
        ]);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8),
            ],
        ]);

        $data['email'] = trim($data['email']);

        $status = DB::transaction(function () use ($data) {
            // Sérialise les réinitialisations concurrentes
            // concernant le même compte.
            User::query()
                ->where('email', $data['email'])
                ->lockForUpdate()
                ->first();

            return Password::broker('users')->reset(
                $data,
                function (User $user, string $password) {
                    $user->password = Hash::make($password);
                    $user->setRememberToken(Str::random(60));
                    $user->save();

                    // Révoque les jetons Sanctum existants.
                    $user->tokens()->delete();

                    event(new PasswordReset($user));
                }
            );
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => [
                    'Ce lien est invalide ou expiré. Demandez un nouveau lien.',
                ],
            ]);
        }

        return response()->json([
            'message' =>
                'Votre mot de passe a été modifié. Connectez-vous avec le nouveau mot de passe.',
        ]);
    }
}