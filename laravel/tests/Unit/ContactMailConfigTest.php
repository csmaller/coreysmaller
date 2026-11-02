<?php

namespace Tests\Unit;

use Illuminate\Support\Env;
use Tests\TestCase;

class ContactMailConfigTest extends TestCase
{
    public function test_contact_to_address_sets_the_mail_recipient(): void
    {
        $this->assertSame('configured@example.com', $this->contactToWithAddress('configured@example.com'));
    }

    public function test_contact_recipient_is_not_hardcoded_when_the_address_is_unset(): void
    {
        $this->assertNull($this->contactToWithAddress(null));
    }

    /**
     * Load the mail config with the given address in the environment. The Env repository
     * will not change a variable that is already set, so it is rebuilt around the change.
     */
    private function contactToWithAddress(?string $address): mixed
    {
        $name = 'CONTACT_TO_ADDRESS';
        $previous = [$_ENV[$name] ?? null, $_SERVER[$name] ?? null, getenv($name)];

        $this->writeEnvironment($name, $address, $address, $address ?? false);

        try {
            return (require config_path('mail.php'))['contact_to'];
        } finally {
            $this->writeEnvironment($name, ...$previous);
        }
    }

    private function writeEnvironment(string $name, ?string $env, ?string $server, string|false $process): void
    {
        unset($_ENV[$name], $_SERVER[$name]);

        if ($env !== null) {
            $_ENV[$name] = $env;
        }

        if ($server !== null) {
            $_SERVER[$name] = $server;
        }

        putenv($process === false ? $name : "{$name}={$process}");

        // Resets the cached repository, so the next env() call sees the change.
        Env::enablePutenv();
    }
}
