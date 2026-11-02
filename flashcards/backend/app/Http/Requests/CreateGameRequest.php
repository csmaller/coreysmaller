<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Start a game from a web page (`url`) or from a PDF uploaded earlier
 * (`document_id`). Exactly one of the two must be given.
 */
class CreateGameRequest extends FormRequest
{
    public const LENGTHS = [15, 30, 50];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'url' => ['required_without:document_id', 'prohibits:document_id', 'string', 'max:2048', 'url:http,https'],
            'document_id' => ['required_without:url', 'string', 'uuid', Rule::exists('documents', 'id')],
            'length' => ['required', 'integer', Rule::in(self::LENGTHS)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'url.required_without' => 'Enter the web address of a page.',
            'url.url' => 'Enter a full web address starting with http:// or https://.',
            'url.prohibits' => 'Send either a URL or a document, not both.',
            'document_id.exists' => 'That PDF is no longer available. Please upload it again.',
            'length.in' => 'Choose 15, 30 or 50 cards.',
        ];
    }
}
