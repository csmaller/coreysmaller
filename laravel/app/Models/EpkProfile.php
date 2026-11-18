<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EpkProfile extends Model
{
    protected $table = 'epk_profiles';

    const CREATED_AT = 'createdAt';

    const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'bio',
        'contactEmail',
        'contactPhone',
        'location',
        'contactNote',
    ];
}
