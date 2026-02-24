<?php

namespace App\Http\Requests\Music;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMusicRequest extends FormRequest
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
            'audioUrl' => ['nullable', 'url', 'max:255'],
            'coverArt' => ['nullable', 'url', 'max:255'],
            'genre' => ['nullable', 'string', 'max:255'],
            'duration' => ['nullable', 'integer', 'min:1'],
            'releaseDate' => ['nullable', 'date'],
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
            'audioUrl.url' => 'The audio URL must be a valid URL.',
            'coverArt.url' => 'The cover art must be a valid URL.',
            'duration.integer' => 'The duration must be an integer.',
            'duration.min' => 'The duration must be at least 1.',
            'releaseDate.date' => 'The release date must be a valid date.',
        ];
    }
}
