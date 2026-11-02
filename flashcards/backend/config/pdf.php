<?php

return [

    /*
    | Largest PDF accepted, in kilobytes. PHP's own upload_max_filesize and
    | post_max_size must be at least this big (see php/uploads.ini).
    */
    'max_kb' => (int) env('PDF_MAX_KB', 12 * 1024),

    // Only the first pages are read, which bounds the work for huge files.
    'max_pages' => (int) env('PDF_MAX_PAGES', 300),

    // Largest size one compressed stream may expand to, which stops
    // decompression bombs.
    'decode_memory_limit' => 32 * 1024 * 1024,

];
