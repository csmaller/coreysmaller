<?php

namespace App\Http\Requests\Video;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVideoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:200', 'min:1'],
            'description' => ['nullable', 'string'],
            'youtubeUrl' => ['sometimes', 'url', 'regex:/^https:\/\/(www\.youtube\.com|youtu\.be)\/.+$/'],
            'thumbnail' => ['nullable', 'url', 'max:255'],
            'duration' => ['nullable', 'integer', 'min:1'],
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
            'title.max' => 'The title may not be greater than 200 characters.',
            'title.min' => 'The title must be at least 1 character.',
            'youtubeUrl.url' => 'The YouTube URL must be a valid URL.',
            'youtubeUrl.regex' => 'The YouTube URL must be a valid YouTube URL (youtube.com or youtu.be).',
            'thumbnail.url' => 'The thumbnail must be a valid URL.',
            'duration.integer' => 'The duration must be an integer.',
            'duration.min' => 'The duration must be at least 1.',
        ];
    }
}
