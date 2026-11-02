<?php

namespace App\Http\Controllers;

use App\Http\Requests\Contact\CreateContactSubmissionRequest;
use App\Mail\ContactMessage;
use App\Models\ContactSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class ContactController extends Controller
{
    public function store(CreateContactSubmissionRequest $request): JsonResponse
    {
        try {
            $submission = ContactSubmission::create($request->safe()->only(['name', 'email', 'message']));
        } catch (\Throwable $e) {
            // Query exception messages embed their bindings, so keep the sender's details out of the log.
            Log::error('Contact form submission could not be saved', [
                'exception' => get_class($e),
                'code' => $e->getCode(),
            ]);

            return $this->failureResponse();
        }

        try {
            $recipient = config('mail.contact_to');

            if (blank($recipient)) {
                throw new RuntimeException('CONTACT_TO_ADDRESS is not configured.');
            }

            Mail::to($recipient)->send(new ContactMessage(
                $submission->name,
                $submission->email,
                $submission->message,
                $submission->createdAt,
            ));
        } catch (\Throwable $e) {
            Log::error('Contact form mail failed', [
                'submissionId' => $submission->id,
                'error' => $e->getMessage(),
            ]);

            return $this->failureResponse();
        }

        return response()->json([
            'success' => true,
            'statusCode' => 201,
            'message' => 'Message sent.',
            'timestamp' => now()->toIso8601String(),
        ], 201);
    }

    private function failureResponse(): JsonResponse
    {
        return response()->json([
            'statusCode' => 500,
            'message' => 'Sorry, your message could not be sent. Please try again.',
            'timestamp' => now()->toIso8601String(),
        ], 500);
    }
}
