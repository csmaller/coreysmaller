<?php

namespace App\Http\Controllers;

use App\Mail\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SubmitContactForm extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $name = trim(str_replace(["\r", "\n"], ' ', $payload['name']));
        $email = $payload['email'];
        $message = trim($payload['message']);
        $recipient = (string) config('mail.contact_to');

        try {
            Mail::to($recipient)->send(new ContactMessage($name, $email, $message));
        } catch (\Throwable $e) {
            Log::error('Contact form mail failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'statusCode' => 500,
                'message' => 'Sorry, your message could not be sent. Please try again.',
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'statusCode' => 201,
            'message' => 'Message sent.',
            'timestamp' => now()->toIso8601String(),
        ], 201);
    }
}
