<?php

namespace App\Providers;

use App\Models\Document;
use App\Observers\DocumentObserver;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Document::observe(DocumentObserver::class);

        ResetPassword::createUrlUsing(
            function (object $user, string $token) {
                $query = http_build_query(
                    [
                        'token' => $token,
                        'email' => $user->getEmailForPasswordReset(),
                    ],
                    '',
                    '&',
                    PHP_QUERY_RFC3986
                );

                return rtrim(config('frontend.url'), '/')
                    . '/reset-password?'
                    . $query;
            }
        );
    }
}