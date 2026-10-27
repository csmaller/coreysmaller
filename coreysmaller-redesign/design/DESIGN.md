# Corey Smaller — Dark / Edgy Musician Redesign

Handoff for Cursor. `index.html` + `styles.css` are the **visual source of truth**:
plain HTML/CSS, no framework, no build step. Open `index.html` in a browser to see it.
Port them into the repo's existing stack and **replace the old design**.

## Direction
Basement-show gig poster. Near-black ground, bone-white type, ONE hot accent
(`#ff4a1c`), huge condensed uppercase display type, monospace labels, hard edges,
no rounded corners, no gradients, no shadows, no emoji.

## Tokens (all in `:root` of `styles.css`)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0b` | page ground |
| `--surface` / `--surface-2` | `#101011` / `#151516` | cards, hover rows |
| `--line` | `#2a2a2c` | borders, dividers |
| `--text` / `--text-soft` / `--text-muted` | `#ebe7df` / `#cfcac1` / `#a29d94` | body / lead / captions |
| `--accent` | `#ff4a1c` | the only accent. Alts: `#e6e02a`, `#38f2b0`, `#ff2d7a` |
| `--on-accent` | `#0a0a0b` | text on accent fills |
| `--font-display` | Anton | headings, titles, logo (always uppercase) |
| `--font-mono` | Space Mono | labels, nav, buttons, dates (uppercase, wide tracking) |
| `--font-body` | Archivo | paragraphs |

Fonts come from one Google Fonts `<link>` in `index.html` (or self-host / use `next/font` etc.).
Contrast is verified: muted text 7:1 on bg, accent text ~6:1, black on accent ~6:1. Don't lighten/darken without rechecking.

## Page structure → suggested components
1. `Header` — logo + nav (Audio, Video, Blog, About, Contact)
2. `Hero` — eyebrow, giant name, tagline, 2 buttons
3. `Strip` — tilted accent marquee (decorative, `aria-hidden`, respects reduced motion)
4. `Section` (head: giant title + `01 / All … →` link) used by:
   - Audio → grid of `ReleaseCard`
   - Video → list of `VideoRow`
   - Blog → grid of `PostCard`
5. `About`
6. `Footer` — accent-filled: giant "Book it. Say hi.", email, socials, ©, Admin link

## Routes (already on the live site)
- `/audio`, `/video`, `/blog`, `/login` (footer "Admin" link)
Nav and cards already point at these. Keep the repo's router; use its `<Link>` where applicable.

## Placeholders — REPLACE WITH REAL DATA
Everything in `[BRACKETS]` is a placeholder (bio, city, tagline, email, socials, release/video/post titles and dates).
The Audio/Video/Blog repeated cards are demo markup: **render them from the repo's existing data/API**, don't hardcode.
Release art tiles show a big index number as a stand-in: use real cover/thumbnail images if the data has them
(keep the square aspect ratio, 1px `--line` border).

## Rules when porting
- Keep all existing logic, data fetching, auth, routing and API calls. Only replace markup + styling.
- Remove/override the old design's styles (old theme blue `#2563eb`, old components) rather than layering on top.
- Keep tokens as CSS variables (or map 1:1 into Tailwind `theme.extend` / theme object). Don't hardcode hex values in components.
- Layout is fluid: container max 1280px, 32px gutter (20px under 600px); grids use `repeat(auto-fit, minmax(min(340px,100%),1fr))`.
- Touch targets ≥ 44px. Real `<a>`/`<button>` elements; keep visible focus ring (`--accent`).
- Update `theme-color` meta to `#0a0a0b`.
