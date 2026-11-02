<?php

namespace Tests\Unit;

use Illuminate\Support\Env;
use Tests\TestCase;

class ContactMailConfigTest extends TestCase
{
    public function test_contact_to_address_sets_the_mail_recipient(): void
    {
        $repository = Env::getRepository();
        $previous = $repository->get('CONTACT_TO_ADDRESS');
        $repository->set('CONTACT_TO_ADDRESS', 'configured@example.com');

        try {
            $config = require config_path('mail.php');
            $this->assertSame('configured@example.com', $config['contact_to']);
        } finally {
            if ($previous === null) {
                $repository->clear('CONTACT_TO_ADDRESS');
            } else {
                $repository->set('CONTACT_TO_ADDRESS', $previous);
            }
        }
    }

    public function test_contact_recipient_falls_back_when_the_address_is_unset(): void
    {
        $repository = Env::getRepository();
        $previous = $repository->get('CONTACT_TO_ADDRESS');
        $repository->clear('CONTACT_TO_ADDRESS');

        try {
            $config = require config_path('mail.php');
            $this->assertSame('coreysmaller@gmail.com', $config['contact_to']);
        } finally {
            if ($previous !== null) {
                $repository->set('CONTACT_TO_ADDRESS', $previous);
            }
        }
    }
}
