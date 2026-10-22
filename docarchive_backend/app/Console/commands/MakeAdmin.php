<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeAdmin extends Command
{
    protected $signature = 'archivio:make-admin {email}';

    protected $description =
        'Attribuer le rôle administrateur à un compte existant';

    public function handle(): int
    {
        $email = trim((string) $this->argument('email'));

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error(
                'Aucun utilisateur avec cette adresse e-mail.'
            );

            return self::FAILURE;
        }

        if ($user->isAdmin()) {
            $this->info(
                'Ce compte est déjà administrateur.'
            );

            return self::SUCCESS;
        }

        $user->role = 'admin';
        $user->save();

        $this->info(
            'Le compte '
            . $user->email
            . ' est maintenant administrateur.'
        );

        return self::SUCCESS;
    }
}