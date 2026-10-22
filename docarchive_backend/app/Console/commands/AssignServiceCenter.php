<?php

namespace App\Console\Commands;

use App\Models\Center;
use App\Models\Service;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AssignServiceCenter extends Command
{
    protected $signature =
        'archivio:assign-service-center {service?} {center?}';

    protected $description =
        'Affecter un service existant à son premier centre';

    public function handle(): int
    {
        $serviceId = $this->argument('service');
        $centerCode = $this->argument('center');

        if (!$serviceId && !$centerCode) {
            $this->table(
                ['Code', 'Centre'],
                Center::query()
                    ->orderBy('name')
                    ->get()
                    ->map(fn ($center) => [
                        $center->code,
                        $center->name,
                    ])
                    ->all()
            );

            $this->table(
                ['ID', 'Service', 'Centre actuel'],
                Service::query()
                    ->with('center')
                    ->orderBy('id')
                    ->get()
                    ->map(fn ($service) => [
                        $service->id,
                        $service->name,
                        $service->center?->name ?? 'Non affecté',
                    ])
                    ->all()
            );

            $this->line(
                'Exemple : php artisan archivio:assign-service-center 3 SOUSSE'
            );

            return self::SUCCESS;
        }

        if (
            !$serviceId
            || !$centerCode
            || !ctype_digit((string) $serviceId)
            || (int) $serviceId < 1
        ) {
            $this->error(
                'Indiquez un ID de service valide et un code de centre.'
            );

            return self::FAILURE;
        }

        $center = Center::query()
            ->where('code', strtoupper(trim($centerCode)))
            ->first();

        if (!$center) {
            $this->error(
                'Centre introuvable. Codes : SIEGE, RADES, SOUSSE, SFAX.'
            );

            return self::FAILURE;
        }

        try {
            $serviceName = DB::transaction(function () use (
                $serviceId,
                $center
            ) {
                $service = Service::query()
                    ->whereKey($serviceId)
                    ->lockForUpdate()
                    ->first();

                if (!$service) {
                    throw new RuntimeException(
                        'Service introuvable.'
                    );
                }

                if (
                    $service->center_id !== null
                    && (int) $service->center_id
                        !== (int) $center->id
                ) {
                    throw new RuntimeException(
                        'Ce service appartient déjà à un autre centre. Aucun changement effectué.'
                    );
                }

                $agents = User::query()
                    ->where('role', 'agent')
                    ->where('service_id', $service->id)
                    ->lockForUpdate()
                    ->get();

                foreach ($agents as $agent) {
                    if (
                        $agent->center_id !== null
                        && (int) $agent->center_id
                            !== (int) $center->id
                    ) {
                        throw new RuntimeException(
                            "L’agent {$agent->email} appartient à un autre centre. Corrigez son affectation avant de continuer."
                        );
                    }
                }

                $service->center_id = $center->id;
                $service->save();

                foreach ($agents as $agent) {
                    if (
                        (int) $agent->center_id
                        !== (int) $center->id
                    ) {
                        $agent->center_id = $center->id;
                        $agent->save();
                        $agent->tokens()->delete();
                    }
                }

                return $service->name;
            });

            $this->info(
                "{$serviceName} est rattaché au centre {$center->name}."
            );

            return self::SUCCESS;
        } catch (RuntimeException $error) {
            $this->error($error->getMessage());

            return self::FAILURE;
        }
    }
}