<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePdfGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The file's type is checked from its contents by PdfTextExtractor
     * (415 if it isn't a PDF), not from its name or the browser's claim.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:'.config('pdf.max_kb')],
            'length' => ['required', 'integer', Rule::in(CreateGameRequest::LENGTHS)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $mb = round(config('pdf.max_kb') / 1024);

        return [
            'file.required' => 'Choose a PDF file to upload.',
            'file.uploaded' => "The PDF could not be uploaded. It may be larger than {$mb} MB.",
            'file.max' => "PDFs can be at most {$mb} MB.",
            'length.in' => 'Choose 15, 30 or 50 cards.',
        ];
    }
}
