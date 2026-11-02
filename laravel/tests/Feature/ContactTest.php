<?php

namespace Tests\Feature;

use App\Mail\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use RuntimeException;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\TransportInterface;
use Symfony\Component\Mime\RawMessage;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('contact:127.0.0.1');
    }

    public function test_submit_sends_mail_to_the_site_address(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/contact', [
            'name' => "Ada\nLovelace",
            'email' => 'ada@example.com',
            'message' => 'Hello from the form.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Message sent.');

        Mail::assertSent(ContactMessage::class, function (ContactMessage $mail) {
            $replyTo = $mail->envelope()->replyTo[0];
            $rendered = $mail->render();

            return $mail->hasTo(config('mail.contact_to'))
                && $replyTo->address === 'ada@example.com'
                && $replyTo->name === 'Ada Lovelace'
                && $mail->senderName === 'Ada Lovelace'
                && $mail->senderEmail === 'ada@example.com'
                && $mail->messageBody === 'Hello from the form.'
                && $mail->envelope()->subject === 'Note from Ada Lovelace'
                && str_contains($rendered, 'Name: Ada Lovelace')
                && str_contains($rendered, 'Email: ada@example.com')
                && str_contains($rendered, 'Hello from the form.');
        });
    }

    public function test_submit_sends_mail_to_the_configured_contact_address(): void
    {
        Mail::fake();
        config(['mail.contact_to' => 'notes@example.com']);

        $this->postJson('/api/contact', [
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'message' => 'Hello from the form.',
        ])->assertCreated();

        Mail::assertSent(ContactMessage::class, function (ContactMessage $mail) {
            return $mail->hasTo('notes@example.com');
        });
    }

    public function test_submit_reports_a_failure_when_mail_cannot_be_sent(): void
    {
        config(['mail.contact_to' => 'notes@example.com']);
        Mail::extend('failing', function () {
            return new class implements TransportInterface
            {
                public function send(RawMessage $message, ?Envelope $envelope = null): ?SentMessage
                {
                    throw new RuntimeException('smtp down');
                }

                public function __toString(): string
                {
                    return 'failing://null';
                }
            };
        });
        config([
            'mail.default' => 'failing',
            'mail.mailers.failing' => ['transport' => 'failing'],
        ]);
        Mail::purge('failing');

        $this->postJson('/api/contact', [
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'message' => 'Hello from the form.',
        ])->assertStatus(500)
            ->assertJsonPath('message', 'Sorry, your message could not be sent. Please try again.');
    }

    public function test_contact_form_is_rate_limited(): void
    {
        Mail::fake();

        $payload = [
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'message' => 'Hello from the form.',
        ];

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/contact', $payload)->assertCreated();
        }

        $this->postJson('/api/contact', $payload)
            ->assertStatus(429)
            ->assertJsonPath('message', 'Too many requests. Please try again later.');

        Mail::assertSentCount(5);
    }

    public function test_submit_rejects_an_invalid_message(): void
    {
        Mail::fake();

        $this->postJson('/api/contact', [
            'name' => 'Ada',
            'email' => 'not-an-email',
            'message' => '',
        ])->assertStatus(400)
            ->assertJsonPath('message', 'Validation failed');

        Mail::assertNothingSent();
    }
}
