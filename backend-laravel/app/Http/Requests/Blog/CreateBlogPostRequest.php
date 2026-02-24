<?php

namespace App\Http\Requests\Blog;

use Illuminate\Foundation\Http\FormRequest;

class CreateBlogPostRequest extends FormRequest
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
            'content' => ['required', 'string', 'min:1'],
            'excerpt' => ['nullable', 'string', 'max:255'],
            'featuredImage' => ['nullable', 'url', 'max:255'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:255'],
            'status' => ['required', 'in:draft,published,archived'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:blog,slug'],
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
            'content.required' => 'The content field is required.',
            'content.min' => 'The content must be at least 1 character.',
            'excerpt.max' => 'The excerpt may not be greater than 255 characters.',
            'featuredImage.url' => 'The featured image must be a valid URL.',
            'status.required' => 'The status field is required.',
            'status.in' => 'The status must be one of: draft, published, archived.',
            'slug.unique' => 'The slug has already been taken.',
        ];
    }
}
