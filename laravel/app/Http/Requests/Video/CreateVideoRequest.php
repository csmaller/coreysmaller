<?php

namespace App\Http\Requests\Video;

use Illuminate\Foundation\Http\FormRequest;

class CreateVideoRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:200', 'min:1'],
            'description' => ['nullable', 'string'],
            'youtubeUrl' => ['required', 'url', 'regex:/^https:\/\/(www\.youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/|(www\.)?instagram\.com\/(p|reel|reels|tv)\/).+$/'],
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
            'title.required' => 'The title field is required.',
            'title.max' => 'The title may not be greater than 200 characters.',
            'title.min' => 'The title must be at least 1 character.',
            'youtubeUrl.required' => 'A video URL is required.',
            'youtubeUrl.url' => 'The video URL must be a valid URL.',
            'youtubeUrl.regex' => 'Use a YouTube link, a YouTube Short, or an Instagram post or reel.',
            'thumbnail.url' => 'The thumbnail must be a valid URL.',
            'duration.integer' => 'The duration must be an integer.',
            'duration.min' => 'The duration must be at least 1.',
        ];
    }
}
