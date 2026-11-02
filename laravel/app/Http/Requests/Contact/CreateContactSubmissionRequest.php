<?php

namespace App\Http\Requests\Contact;

use Illuminate\Foundation\Http\FormRequest;

class CreateContactSubmissionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalize the text fields before they are validated.
     *
     * Names end up in mail headers, so they must stay on one line. Markup is left
     * in messages and escaped when rendered, since it can be legitimate text.
     */
    protected function prepareForValidation(): void
    {
        $normalized = [];

        foreach (['name', 'email', 'message'] as $field) {
            $value = $this->input($field);

            if (is_string($value)) {
                // Malformed text counts as missing, rather than being repaired into something valid.
                $normalized[$field] = mb_check_encoding($value, 'UTF-8') ? $value : null;
            }
        }

        if (isset($normalized['name'])) {
            $normalized['name'] = trim(preg_replace('/[\p{Cc}\p{Zl}\p{Zp}]+/u', ' ', $normalized['name']));
        }

        if (isset($normalized['message'])) {
            $message = preg_replace('/\r\n?/', "\n", $normalized['message']);
            $normalized['message'] = trim(preg_replace('/[^\P{Cc}\n\t]/u', '', $message));
        }

        $this->merge($normalized);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['bail', 'required', 'string', 'max:120', 'not_regex:/[<>]/'],
            'email' => ['bail', 'required', 'string', 'max:255', 'email:rfc,strict'],
            'message' => ['bail', 'required', 'string', 'max:5000'],
            // Honeypot: hidden from people, so only bots fill it in.
            'website' => ['prohibited'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter your name.',
            'name.string' => 'Please enter your name as plain text.',
            'name.max' => 'Your name may not be greater than 120 characters.',
            'name.not_regex' => 'Your name may not contain < or > characters.',
            'email.required' => 'Please enter your email address.',
            'email.string' => 'Please enter a valid email address, like name@example.com.',
            'email.max' => 'Your email address may not be greater than 255 characters.',
            'email.email' => 'Please enter a valid email address, like name@example.com.',
            'message.required' => 'Please enter a message.',
            'message.string' => 'Please enter your message as plain text.',
            'message.max' => 'Your message may not be greater than 5000 characters.',
            'website.prohibited' => 'Your message could not be accepted.',
        ];
    }
}
