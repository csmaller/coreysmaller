<?php

namespace Tests\Feature;

use App\Mail\ContactMessage;
use App\Models\ContactSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
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

            return $mail->hasTo(config('mail.contact_to'))
                && $replyTo->address === 'ada@example.com'
                && $replyTo->name === 'Ada Lovelace'
                && $mail->senderName === 'Ada Lovelace'
                && $mail->senderEmail === 'ada@example.com'
                && $mail->messageBody === 'Hello from the form.'
                && $mail->envelope()->subject === 'Note from Ada Lovelace';
        });
    }

    public function test_submit_saves_the_submission_with_its_timestamp(): void
    {
        Mail::fake();
        Carbon::setTestNow('2026-11-02 15:04:00');

        $this->postJson('/api/contact', [
            'name' => '  Ada Lovelace  ',
            'email' => 'ada@example.com',
            'message' => "  First line\r\nSecond line  ",
        ])->assertCreated();

        $submission = ContactSubmission::sole();

        $this->assertSame('Ada Lovelace', $submission->name);
        $this->assertSame('ada@example.com', $submission->email);
        $this->assertSame("First line\nSecond line", $submission->message);
        $this->assertTrue($submission->createdAt->equalTo(Carbon::parse('2026-11-02 15:04:00')));
    }

    public function test_mail_includes_all_four_fields_in_html_and_text(): void
    {
        $mail = new ContactMessage(
            "Ada O'Brien",
            'ada@example.com',
            "First line\nSecond line",
            Carbon::parse('2026-11-02 15:04:00', 'UTC'),
        );

        $mail->assertSeeInHtml('Ada O&#039;Brien', false);
        $mail->assertSeeInHtml('ada@example.com');
        $mail->assertSeeInHtml('November 2, 2026 at 3:04 PM UTC');
        $mail->assertSeeInHtml('First line<br />', false);

        $mail->assertSeeInText("Name: Ada O'Brien");
        $mail->assertSeeInText('Email: ada@example.com');
        $mail->assertSeeInText('Submitted: November 2, 2026 at 3:04 PM UTC');
        $mail->assertSeeInText("First line\nSecond line");
    }

    public function test_mail_escapes_markup_from_the_sender(): void
    {
        $mail = new ContactMessage(
            'Ada',
            'ada@example.com',
            '<script>alert("hi")</script>',
            Carbon::parse('2026-11-02 15:04:00', 'UTC'),
        );

        $mail->assertDontSeeInHtml('<script>', false);
        $mail->assertSeeInHtml('&lt;script&gt;', false);
    }

    public function test_submit_keeps_the_submission_when_no_recipient_is_configured(): void
    {
        config(['mail.contact_to' => null]);
        Mail::fake();

        $this->postJson('/api/contact', [
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'message' => 'Hello from the form.',
        ])->assertStatus(500)
            ->assertJsonPath('message', 'Sorry, your message could not be sent. Please try again.');

        Mail::assertNothingSent();
        $this->assertDatabaseCount('contact_submissions', 1);
    }

    public function test_submit_reports_a_failure_without_details_when_saving_fails(): void
    {
        Mail::fake();
        Schema::drop('contact_submissions');

        $response = $this->postJson('/api/contact', [
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'message' => 'Hello from the form.',
        ]);

        $response->assertStatus(500)
            ->assertJsonPath('message', 'Sorry, your message could not be sent. Please try again.');
        $this->assertStringNotContainsString('contact_submissions', $response->getContent());

        Mail::assertNothingSent();
    }

    #[DataProvider('invalidSubmissions')]
    public function test_submit_rejects_invalid_input_with_a_specific_error(array $overrides, string $error): void
    {
        Mail::fake();

        $this->postJson('/api/contact', array_merge([
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'message' => 'Hello from the form.',
        ], $overrides))->assertStatus(400)
            ->assertJsonPath('message', 'Validation failed')
            ->assertJsonPath('errors', [$error]);

        Mail::assertNothingSent();
        $this->assertDatabaseCount('contact_submissions', 0);
    }

    public static function invalidSubmissions(): array
    {
        return [
            'missing name' => [['name' => ''], 'Please enter your name.'],
            'blank name' => [['name' => "  \r\n "], 'Please enter your name.'],
            'array name' => [['name' => ['Ada']], 'Please enter your name as plain text.'],
            'long name' => [['name' => str_repeat('a', 121)], 'Your name may not be greater than 120 characters.'],
            'markup in name' => [['name' => '<b>Ada</b>'], 'Your name may not contain < or > characters.'],
            'missing email' => [['email' => ''], 'Please enter your email address.'],
            'malformed email' => [['email' => 'not-an-email'], 'Please enter a valid email address, like name@example.com.'],
            'email without a dotted domain' => [['email' => 'ada@localhost'], 'Please enter a valid email address, like name@example.com.'],
            'header injection in email' => [['email' => "ada@example.com\r\nBcc: spam@example.com"], 'Please enter a valid email address, like name@example.com.'],
            'array email' => [['email' => ['ada@example.com']], 'Please enter a valid email address, like name@example.com.'],
            'long email' => [['email' => str_repeat('a', 250).'@example.com'], 'Your email address may not be greater than 255 characters.'],
            'missing message' => [['message' => ''], 'Please enter a message.'],
            'control characters only message' => [['message' => "\x00\x07"], 'Please enter a message.'],
            'array message' => [['message' => ['Hello']], 'Please enter your message as plain text.'],
            'long message' => [['message' => str_repeat('a', 5001)], 'Your message may not be greater than 5000 characters.'],
            'filled honeypot' => [['website' => 'https://spam.example.com'], 'Your message could not be accepted.'],
        ];
    }

    public function test_submit_strips_control_characters_and_ignores_unexpected_fields(): void
    {
        Mail::fake();

        $this->postJson('/api/contact', [
            'id' => 999,
            'createdAt' => '2000-01-01 00:00:00',
            'name' => "Ada\r\nBcc: spam@example.com",
            'email' => 'ada@example.com',
            'message' => "Line one\x00\nLine\ttwo",
            'website' => '',
        ])->assertCreated();

        $submission = ContactSubmission::sole();

        $this->assertNotSame(999, $submission->id);
        $this->assertSame(now()->year, $submission->createdAt->year);
        $this->assertSame('Ada Bcc: spam@example.com', $submission->name);
        $this->assertSame("Line one\nLine\ttwo", $submission->message);
    }

    public function test_submit_rejects_text_that_is_not_valid_utf8(): void
    {
        Mail::fake();

        $this->post('/api/contact', [
            'name' => "\xFF\xFE",
            'email' => "\xFF@example.com",
            'message' => "bad\xFFtext",
        ])->assertStatus(400)
            ->assertJsonPath('errors', [
                'Please enter your name.',
                'Please enter your email address.',
                'Please enter a message.',
            ]);

        Mail::assertNothingSent();
        $this->assertDatabaseCount('contact_submissions', 0);
    }

    public function test_submit_stores_markup_in_a_message_as_plain_text(): void
    {
        Mail::fake();
        $message = '<script>alert("hi")</script>';

        $this->postJson('/api/contact', [
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'message' => $message,
        ])->assertCreated();

        $this->assertSame($message, ContactSubmission::sole()->message);
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

        $this->assertDatabaseCount('contact_submissions', 1);
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
