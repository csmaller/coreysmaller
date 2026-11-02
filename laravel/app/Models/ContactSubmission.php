<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactSubmission extends Model
{
    const CREATED_AT = 'createdAt';

    const UPDATED_AT = null;

    protected $fillable = [
        'name',
        'email',
        'message',
    ];

    protected $casts = [
        'createdAt' => 'datetime',
    ];
}
