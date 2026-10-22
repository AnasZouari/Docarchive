<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DocumentFileController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Routes publiques
Route::post('/login', [
    AuthController::class,
    'login',
])->middleware('throttle:10,1');

Route::post('/forgot-password', [
    PasswordResetController::class,
    'forgot',
])->middleware('throttle:5,1');

Route::post('/reset-password', [
    PasswordResetController::class,
    'reset',
])->middleware('throttle:5,1');

// Routes nécessitant une connexion
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load([
            'center',
            'service',
        ]);
    });

    Route::post('/logout', [
        AuthController::class,
        'logout',
    ]);

    Route::get('/documents/{id}/download', [
        DocumentFileController::class,
        'download',
    ])->whereNumber('id');

    Route::get('/documents/{id}/preview', [
        DocumentFileController::class,
        'preview',
    ])->whereNumber('id');

    Route::get('/admin/users', [
        UserManagementController::class,
        'index',
    ]);

    Route::post('/admin/users', [
        UserManagementController::class,
        'store',
    ])->middleware('throttle:20,1');

    Route::post('/admin/users/{user}/service', [
        UserManagementController::class,
        'assignService',
    ])->whereNumber('user');

    Route::get('/admin/audit-logs', [
        AuditLogController::class,
        'index',
    ]);
});