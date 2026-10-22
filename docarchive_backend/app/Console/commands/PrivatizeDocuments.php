<?php

namespace App\Console\Commands;

use App\Models\Document;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PrivatizeDocuments extends Command
{
    protected $signature = 'archivio:privatize-documents';

    protected $description =
        'Déplacer les documents publics vers le stockage privé';

    private function checksum($disk, string $path): string
    {
        $stream = $disk->readStream($path);

        if (!is_resource($stream)) {
            throw new \RuntimeException(
                'Lecture impossible : ' . $path
            );
        }

        try {
            $hash = hash_init('sha256');
            hash_update_stream($hash, $stream);

            return hash_final($hash);
        } finally {
            fclose($stream);
        }
    }

    public function handle(): int
    {
        $public = Storage::disk('public');
        $private = Storage::disk('documents');

        try {
            $paths = array_unique(array_merge(
                $public->allFiles('documents'),
                $public->allFiles('archives'),
                Document::withoutGlobalScope('service_access')
                    ->pluck('file_path')
                    ->all()
            ));

            foreach ($paths as $path) {
                if (
                    !preg_match(
                        '#^(documents|archives)/[^/\\\\]+$#',
                        $path
                    )
                ) {
                    throw new \RuntimeException(
                        'Chemin inattendu : ' . $path
                    );
                }

                if (
                    !$public->exists($path) &&
                    !$private->exists($path)
                ) {
                    throw new \RuntimeException(
                        'Fichier introuvable : ' . $path
                    );
                }

                if (
                    $public->exists($path) &&
                    $private->exists($path) &&
                    $this->checksum($public, $path) !==
                        $this->checksum($private, $path)
                ) {
                    throw new \RuntimeException(
                        'Deux fichiers différents existent pour : '
                        . $path
                    );
                }
            }

            foreach ($paths as $path) {
                if (!$public->exists($path)) {
                    continue;
                }

                if (!$private->exists($path)) {
                    $stream = $public->readStream($path);

                    if (!is_resource($stream)) {
                        throw new \RuntimeException(
                            'Lecture impossible : ' . $path
                        );
                    }

                    try {
                        if (!$private->put($path, $stream)) {
                            throw new \RuntimeException(
                                'Copie impossible : ' . $path
                            );
                        }
                    } finally {
                        fclose($stream);
                    }
                }

                if (
                    $this->checksum($public, $path) !==
                    $this->checksum($private, $path)
                ) {
                    throw new \RuntimeException(
                        'Vérification échouée ; copie publique conservée : '
                        . $path
                    );
                }

                if (!$public->delete($path)) {
                    throw new \RuntimeException(
                        'Retrait de la copie publique impossible : '
                        . $path
                    );
                }

                $this->line('Transféré : ' . $path);
            }

            $this->info(
                'Transfert terminé. Les documents sont dans storage/app/private.'
            );

            return self::SUCCESS;
        } catch (\Throwable $error) {
            $this->error($error->getMessage());

            $this->warn(
                'Ne redémarrez pas le serveur avant correction. '
                . 'La commande peut être relancée.'
            );

            return self::FAILURE;
        }
    }
}