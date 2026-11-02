<?php

return [

    /*
    | Sent with every page request. Some sites (Wikipedia among them) reject
    | generic user agents, so describe the bot and give a contact URL.
    */
    'user_agent' => env(
        'SCRAPER_USER_AGENT',
        'LinkFlashcardsBot/1.0 (+https://github.com/csmaller/coreysmaller; educational quiz generator)'
    ),

    'timeout' => (int) env('SCRAPER_TIMEOUT', 10),

    'max_bytes' => 5 * 1024 * 1024,

    'max_redirects' => 3,

    'cache_ttl' => 60 * 60 * 24,

    'min_sentence_words' => 8,

    'max_sentence_words' => 40,

];
