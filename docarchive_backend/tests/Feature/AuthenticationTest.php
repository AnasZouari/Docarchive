<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function beforeRefreshingDatabase(): void
    {
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);
    }

    public function test_registration_hashes_password_and_returns_valid_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                ],
            ]);

        $this->assertTrue(
            Hash::check(
                'password123',
                User::first()->password
            )
        );

        $this->assertArrayNotHasKey(
            'password',
            $response->json('user')
        );

        $this->withToken($response->json('token'))
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath(
                'email',
                'test@example.com'
            );
    }

    public function test_incorrect_password_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'incorrect',
        ])->assertUnprocessable();

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    public function test_login_and_logout_revoke_current_token(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ])->assertOk();

        $this->withToken($response->json('token'))
            ->postJson('/api/logout')
            ->assertNoContent();

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );
    }

    public function test_graphql_documents_require_authentication(): void
    {
        $response = $this->postJson('/graphql', [
            'query' => '{ documents { id } }',
        ]);

        $this->assertNotEmpty(
            $response->json('errors')
        );

        $this->assertNull(
            $response->json('data.documents')
        );
    }

    public function test_authenticated_user_can_query_documents(): void
    {
        $user = User::factory()->create();

        $token = $user
            ->createToken('test')
            ->plainTextToken;

        $this->withToken($token)
            ->postJson('/graphql', [
                'query' => '{ documents { id } }',
            ])
            ->assertOk()
            ->assertJsonPath('data.documents', [])
            ->assertJsonMissingPath('errors');
    }
}