<?php

namespace Tests\Unit;

use App\Models\BlogPost;
use PHPUnit\Framework\TestCase;

class BlogPostFormattingTest extends TestCase
{
    public function test_plain_word_count_strips_markup_and_counts_words(): void
    {
        $this->assertSame(3, BlogPost::plainWordCount('<p>one two&nbsp;three</p>'));
        $this->assertSame(2, BlogPost::plainWordCount('<p>one<br>two</p>'));
        $this->assertSame(0, BlogPost::plainWordCount('<p>   </p>'));
        $this->assertSame(0, BlogPost::plainWordCount(null));
    }

    public function test_parse_tags_splits_commas_and_drops_hash_prefixes(): void
    {
        $this->assertSame(['php', 'laravel'], BlogPost::parseTags('#php, laravel'));
        $this->assertSame(['php', 'laravel'], BlogPost::parseTags('["php","laravel"]'));
        $this->assertSame(['php', 'laravel'], BlogPost::parseTags(['#php', 'php, laravel']));
        $this->assertSame([], BlogPost::parseTags(null));
        $this->assertSame([], BlogPost::parseTags('   '));
    }
}
