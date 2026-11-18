<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomeFeature extends Model
{
    protected $table = 'home_features';

    const CREATED_AT = 'createdAt';

    const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'kind',
        'subject',
        'sortOrder',
    ];

    protected $casts = [
        'sortOrder' => 'integer',
    ];
}
