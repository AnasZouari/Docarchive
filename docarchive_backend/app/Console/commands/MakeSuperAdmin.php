<?php

namespace App\Console\Commands;

use App\Models\Center;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MakeSuperAdmin extends Command
{
    protected $signature = 'archivio:make-super-admin {email}';

    protected $description =
        'Attribuer le rôle de super administrateur à un compte existant';

    public function handle(): int
    {
        $email = trim((string) $this->argument('email'));

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error(
                "Aucun utilisateur trouvé avec l’adresse : {$email}"
            );

            return self::FAILURE;
        }

        $headquarters = Center::where('code', 'SIEGE')->first();

        if (!$headquarters) {
            $this->error(
                'Le centre Siège est introuvable. Exécutez la migration des centres.'
            );

            return self::FAILURE;
        }

        DB::transaction(function () use ($user, $headquarters) {
            $user->role = 'super_admin';
            $user->center_id = $headquarters->id;
            $user->service_id = null;
            $user->save();

            // Oblige le compte à se reconnecter après le changement.
            $user->tokens()->delete();
        });

        $this->info(
            "Le compte {$user->email} est maintenant super administrateur."
        );

        $this->line(
            'Déconnectez-vous puis reconnectez-vous dans Archivio.'
        );

        return self::SUCCESS;
    }
}