# Link Flashcards

Paste a link to any public web page, or upload a PDF, and Link Flashcards reads it and
turns it into a multiple-choice quiz of 15, 30 or 50 fill-in-the-blank cards.

```
flashcards/
├── backend/    Laravel 12 JSON API (PHP 8.3): scraping, PDF reading, question generation, scoring
└── frontend/   React 18 + TypeScript + Vite + Tailwind CSS 3 single-page app
```

How a game works:

1. `POST /api/games` checks the URL against an SSRF guard, fetches the page, and keeps
   only its readable sentences (8–40 words each). Scrapes are cached for 24 hours.
   `POST /api/games/pdf` does the same for an uploaded PDF (see [PDF uploads](#pdf-uploads)).
2. A question generator blanks out a key term in a random sentence (a name, number,
   or noun) and adds three other terms from the same page as distractors.
3. Answers are graded on the server. The correct answer for a card reaches the browser
   only after that card has been answered.

## Requirements

| Tool     | Version | Notes |
|----------|---------|-------|
| PHP      | 8.3+ (8.2 minimum) | Extensions: `curl`, `dom`, `mbstring`, `pdo_sqlite` (or `pdo_mysql`), `xml` |
| Composer | 2.x     | |
| Node.js  | 20+     | Tested with Node 24 / npm 11 |

The backend runs on Laravel 12. The original brief asked for Laravel 11, but every
Laravel 11 release now has unpatched security advisories, and Composer refuses to
install them. Laravel 12 has the same structure and APIs. `composer.json` pins
`config.platform.php` to 8.3, so the lock file always resolves to packages that run
on PHP 8.3.

## Quick start

Open two terminals.

**Backend** (http://localhost:8000):

```bash
cd flashcards/backend
composer install            # also creates .env, an APP_KEY and database/database.sqlite
php artisan migrate --seed
composer serve              # serves http://localhost:8000
```

`composer serve` runs `php artisan serve` with `php/uploads.ini` loaded, which raises
PHP's upload limit from its 2 MB default so PDFs up to 12 MB can be uploaded. Plain
`php artisan serve` also works, but rejects PDFs over 2 MB.

**Frontend** (http://localhost:5173):

```bash
cd flashcards/frontend
cp .env.example .env        # optional; the default API URL is http://localhost:8000/api
npm install
npm run dev
```

Open http://localhost:5173, paste for example `https://en.wikipedia.org/wiki/Photosynthesis`,
and pick a length.

> **npm 11 note:** npm may warn that it skipped esbuild's install script. Vite still
> works, because esbuild's binary comes from an optional platform package.

## Environment variables

### `backend/.env`

`composer install` copies `.env.example` to `.env` if `.env` doesn't exist yet.

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_KEY` | generated | Laravel encryption key (`php artisan key:generate`) |
| `APP_DEBUG` | `true` | Set to `false` in production |
| `FRONTEND_URL` | `http://localhost:5173` | Origin allowed by CORS. Separate several origins with commas. |
| `DB_CONNECTION` | `sqlite` | `sqlite` for development, `mysql` for production (then set `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) |
| `CACHE_STORE` | `database` | Where scrape results are cached for 24h. `file` and `redis` also work. |
| `SESSION_DRIVER` | `array` | The API is stateless |
| `SCRAPER_TIMEOUT` | `10` | Seconds allowed for fetching a page |
| `SCRAPER_USER_AGENT` | `LinkFlashcardsBot/1.0 (+…)` | Sent with every fetch. Keep it descriptive with a contact URL, because Wikipedia and others block generic agents. |
| `PDF_MAX_KB` | `12288` | Largest PDF accepted. The frontend's `MAX_PDF_MB` in `src/utils.ts` should match. |
| `PDF_MAX_PAGES` | `300` | Only this many pages of a PDF are read. |

### `frontend/.env`

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:8000/api` | Base URL of the API, including `/api`. It is read at build time. |

### Production with MySQL

```bash
# backend/.env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=link_flashcards
DB_USERNAME=…
DB_PASSWORD=…
APP_ENV=production
APP_DEBUG=false
FRONTEND_URL=https://your-frontend.example
```

Then run `php artisan migrate --force`. For PDF uploads, set `upload_max_filesize = 13M`
and `post_max_size = 14M` (as in `backend/php/uploads.ini`) in the php-fpm or Apache
`php.ini`, and allow request bodies of that size in the web server (e.g. nginx
`client_max_body_size 14m;`). Build the frontend with
`VITE_API_URL=https://your-api.example/api npm run build` and serve `frontend/dist/`
as static files.

The API rate-limits `POST /api/games` to 10 requests per minute per client IP. Behind a
load balancer or reverse proxy, configure trusted proxies
(`$middleware->trustProxies(...)` in `bootstrap/app.php`) so Laravel sees the real
client IP.

## Running tests and linters

```bash
# Backend: PHPUnit (unit + feature) and Pint
cd flashcards/backend
php artisan test
./vendor/bin/pint --test        # run ./vendor/bin/pint to fix style

# Frontend: Vitest + React Testing Library, ESLint, type-check + build
cd flashcards/frontend
npm run test -- --run           # leave off --run for watch mode
npm run lint
npm run build
```

PDF tests build their PDFs in memory (`tests/Support/PdfFixture.php`), so the repo has
no binary fixtures. The backend tests make no network calls. `Http::fake()` serves the pages,
`Http::preventStrayRequests()` makes any unfaked request fail, and DNS answers come
from a fake resolver (see `tests/TestCase.php`).

## API

All responses are JSON. Errors always include a `message` field. Games carry
`source_type` (`url` or `pdf`), `url` (web pages), and `document_id` and `source_name`
(PDFs).

| Method & path | Success | Errors |
|---------------|---------|--------|
| `POST /api/games` `{ url, length: 15\|30\|50 }` or `{ document_id, length }` | `201` game with `questions: [{ id, position, prompt, options, answer: null }]`, never `correct_index` | `422` validation or blocked URL · `422` too little content (also returns `max_available`) · `415` not HTML · `502` unreachable, timeout or HTTP error · `429` rate limited |
| `POST /api/games/pdf` (multipart: `file`, `length`) | `201` game, as above, with `source_type: "pdf"` and a `document_id` | `422` validation, unreadable or password-protected PDF · `422` too little content (returns `max_available` and `document_id`) · `415` not a PDF · `413` larger than PHP allows · `429` rate limited |
| `GET /api/games/{id}` | `200` full state: score, streaks, `answered`, and for each answered question `answer: { choice_index, correct, correct_index, source_sentence }` | `404` |
| `POST /api/games/{id}/answers` `{ question_id, choice_index }` | `200 { correct, correct_index, source_sentence, points, score, current_streak, best_streak, answered, remaining, status }` | `404` question not in this game · `409` already answered · `422` validation |
| `GET /api/games/{id}/results` | `200 { score, correct_count, length, accuracy_pct, best_streak, review: [{ prompt, your_answer, correct_answer, correct, … }] }` | `409` game not completed · `404` |

### Scoring

A correct answer scores 10 points. From the 3rd correct answer in a row onward, each
correct answer earns a flat +5 bonus (10, 10, 15, 15, …). A wrong answer scores 0 and
resets the streak. For example, C C C W C scores 10 + 10 + 15 + 0 + 10 = 45. The
rules live in `app/Services/Scoring/ScoreCalculator.php`.

### PDF uploads

`app/Services/Pdf/PdfTextExtractor.php` reads PDFs with
[smalot/pdfparser](https://github.com/smalot/pdfparser), a pure-PHP parser, so no
system binaries are needed. It:

- checks the file starts like a PDF (`%PDF-`), whatever its name or MIME type says;
- reads at most `PDF_MAX_PAGES` pages, and caps how far any one compressed stream may
  expand (against decompression bombs);
- rejoins lines that the PDF wrapped mid-sentence, and words hyphenated across lines
  (keeping hyphens the document uses elsewhere, like "attention-based");
- drops running headers, footers, page numbers, the reference list (up to an appendix),
  citations, and sentences with equations glued into the text.

The sentences go through the same splitter and question generator as web pages.

Uploaded files are **not** stored. Their extracted sentences are saved in the
`documents` table, keyed by the file's SHA-256, so:

- "Play again" and "Play N cards instead" use `POST /api/games {document_id, length}`
  without uploading the file again;
- uploading the same file twice reuses the stored text. If `PdfTextExtractor::VERSION`
  has been bumped since, the text is extracted again.

Documents are kept until deleted. Deleting one leaves its games playable. Scanned PDFs
(images of text) contain no text to read; they get a `422` that says so. OCR is not
included.

`smalot/pdfparser` is licensed under LGPL-3.0. It is installed as an unmodified Composer
dependency.

### URL safety (SSRF)

`app/Services/Scraper/UrlGuard.php` only allows `http`/`https` on ports 80 and 443, and
rejects:

- URLs with embedded credentials
- obfuscated IP forms such as `2130706433` or `0x7f.1`
- any host that resolves (over IPv4 or IPv6) to a private, loopback, link-local, CGNAT,
  multicast, documentation, or other reserved address, including IPv4 addresses
  embedded in IPv6 (`::ffff:…`, NAT64, 6to4)

The scraper pins the connection to the IP the guard approved (`CURLOPT_RESOLVE`), so DNS
rebinding can't swap in a private address. It follows at most 3 redirects and re-checks
every hop before requesting it.

## Adding another QuestionGenerator

Question generation sits behind `App\Services\Questions\QuestionGenerator`:

```php
interface QuestionGenerator
{
    /**
     * @param  list<string>  $sentences
     * @return list<array{prompt: string, options: list<string>, correct_index: int,
     *                    answer: string, source_sentence: string}>
     * @throws InsufficientContentException  when fewer than $count questions can be built
     */
    public function generate(array $sentences, int $count): array;
}
```

To add a generator (for example, one backed by an LLM):

1. Create a class in `backend/app/Services/Questions/` that implements the interface.
   Return exactly `$count` questions with 4 options each. If you can't, throw
   `new InsufficientContentException($maxYouCouldMake, $count)`. The API turns that into
   a `422` with `max_available`, which lets the frontend offer a shorter game.
2. Bind it in `backend/app/Providers/AppServiceProvider.php`:

   ```php
   $this->app->bind(QuestionGenerator::class, LlmQuestionGenerator::class);
   ```

   To choose a generator through configuration, bind a closure instead, for example
   `fn ($app) => config('services.questions.driver') === 'llm' ? $app->make(LlmQuestionGenerator::class) : $app->make(ClozeQuestionGenerator::class)`.
3. Add a unit test next to `tests/Unit/ClozeQuestionGeneratorTest.php`. The same
   invariants apply: exactly N questions, 4 unique options each, `correct_index` points
   to the answer, and no sentence used twice. Fake any outbound HTTP calls with
   `Http::fake()`.

The built-in `ClozeQuestionGenerator` needs no external service. It finds key terms with
regular expressions, and it doesn't use a part-of-speech tagger, so now and then it
picks a verb or adjective as the answer. Common non-nouns are filtered out through
`backend/resources/stopwords.php` and suffix rules.

## Project layout

```
backend/
  app/Http/Controllers/Api/GameController.php   thin controller
  app/Http/Requests/                            CreateGameRequest, SubmitAnswerRequest
  app/Http/Resources/                           Game, Question, AnswerResult, Results resources
  app/Services/Scraper/                         UrlGuard, PageScraper, UrlNormalizer, DNS resolver
  app/Services/Pdf/PdfTextExtractor.php         PDF text → paragraphs → sentences
  app/Services/Text/SentenceExtractor.php       sentence splitting shared by pages and PDFs
  app/Services/Questions/                       QuestionGenerator + ClozeQuestionGenerator
  app/Services/Scoring/ScoreCalculator.php
  app/Services/Games/GameService.php            creates games, records answers in a transaction
  app/Exceptions/                               API exceptions that render { message, … }
  php/uploads.ini                               dev-server upload limits for `composer serve`
  resources/stopwords.php
  tests/{Unit,Feature}/
frontend/src/
  api/client.ts            typed fetch wrappers; ApiError carries message + max_available
  types.ts                 Game, Question, AnswerResult, Results
  hooks/useGame.ts         idle → loading → playing → revealing → finished | error
  components/              SourcePicker, UrlForm, PdfForm, LengthPicker, FlashCard,
                           ScoreBar, ResultsScreen, ErrorBanner
  App.tsx
  __tests__/
```

## Keyboard controls

- **Tab / Shift+Tab** moves between controls. Every control shows a focus ring.
- **← / →** on the Web page / PDF file switch picks the source. On the PDF form,
  **Enter** or **Space** on "Choose a PDF" opens the file picker; you can also drag a
  file onto the dashed box.
- **← / →** changes the card count while the length picker has focus.
- **1–4** answers the current card.
- **Enter** goes to the next card once the answer is revealed.

Refreshing the page resumes the game: the game id and the card being viewed are kept in
`localStorage`, and the state is reloaded from `GET /api/games/{id}`.
