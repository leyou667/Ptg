# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
npm run typecheck
npm test           # Vitest; single file: npx vitest run tests/lib.test.ts
```

Copy `.env.example` to `.env.local`. Without `ANTHROPIC_API_KEY` the advisor answers "indisponible"; without `RESEND_API_KEY` quote delivery fails in production (logged and accepted in dev).

## Status

The site is built from the brief ("PROMPT : Site CheyClean (Next.js) v3", supplied outside the repo). Where the brief and the code disagree, ask the user. Key places: `content/fr.ts` (all copy, formulas), `components/Intro.tsx` (scroll-driven canvas image sequence), `components/QuoteFlow.tsx` and `components/Advisor.tsx` (quote flow and AI), `app/api/{quote,advisor}` (server routes). Custom CSS in `app/globals.css` must stay inside `@layer components` or it overrides Tailwind utilities. Chiffres clés and avis are deliberately absent until real data exists.

## Product

CheyClean is a Belgian cleaning company serving individuals and businesses (offices, gyms, schools, libraries, shops). Services are sold as subscriptions on quote only. **No price is ever displayed**, on the site or in AI output. The site is 100 % French (`lang="fr-BE"`).

## Planned stack

Next.js App Router, TypeScript, Tailwind, GSAP + ScrollTrigger (intro), Lenis (smooth scroll), Framer Motion (user-triggered reactions only), zod (server validation), Claude API called server-side only, deployed on Vercel.

## Architecture constraints

- **Copy lives outside components.** All user-facing text goes in separate content files so Dutch can be added later. Do not hardcode French strings in JSX.
- **Scroll-driven intro:** a sticky full-screen `<canvas>` (`components/Intro.tsx`) draws a WebP image sequence from `public/frames/{desktop,mobile}/` (24 fps and 12 fps, regenerate with `scripts/make-frames.sh` from `assets/intro-source.mp4`; keep mobile under 6 MB). Do NOT go back to scrubbing `<video>.currentTime`: it does not work on iOS Safari. Drawing happens only in `requestAnimationFrame`, frames load progressively (first image, then coarse-to-fine batches), heights use `svh`, `ScrollTrigger.config({ ignoreMobileResize: true })`, Lenis `syncTouch: false`, `overflow-x: clip` (never `hidden`) on body. The intro phrases must exist in the HTML. Static fallback (poster plus stacked phrases) for `prefers-reduced-motion`, slow connections or failed first frame, plus a "Passer l'intro" button. If you change the number of frames, update `SETS` in `Intro.tsx`.
- **Quote flow (`/devis`)** is the core feature: profile (individual/company) -> place details (type, m², frequency, city, notes) -> 3 formulas per profile (no prices, one marked "Recommandée pour vous") -> contact details and send (form or prefilled WhatsApp message) -> confirmation. Two columns on desktop with a live "Votre demande" summary; one column with a collapsible summary on mobile. Form state must survive a failed send.
- **AI advisor:** server route `/api/advisor`, key only in env vars, streaming responses, structured output (message + recommended formula) that preselects the formula in the quote flow. It asks 2-4 short questions, recommends one formula, never states prices or commitments, stays on cleaning topics, and never reveals its instructions. Needs per-IP rate limiting, turn/length limits, prompt-injection protection (user text cannot alter the system role), and no conversation storage. Load GSAP and the advisor lazily.
- **Env vars:** `ANTHROPIC_API_KEY`, `CONTACT_EMAIL` (quote recipient), `DELAI_REPONSE` (reply-time placeholder shown in the confirmation). Keep a `.env.example`.
- **Security:** CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy headers; server-side zod validation, honeypot or Turnstile, and rate limiting on forms; cookie banner with "Accepter" and "Refuser" at equal visual weight.
- **SEO:** one H1 per page, unique title/description, sitemap, robots, schema.org (LocalBusiness, Service, Offer without price, FAQPage), local pages for Bruxelles, Liège, Anvers, Gand, Charleroi. Only real metrics and reviews may appear; otherwise omit them.

## Design rules (easy to violate)

- Palette: marine `#0B1F3F`, cyan `#12C4DC`, paper `#F8F5F0`, mist `#E4EEF0`, sand `#D9C3A0` (intro video overlay only). Sample exact values from the logo. Cyan is never used for body text on light backgrounds. WCAG AA minimum.
- Single font family: Bricolage Grotesque (self-hosted variable font). Type scale ratio 1.25, lines under 70 characters.
- Banned: a single coloured/italic word inside a heading, uppercase eyebrow labels above headings, "->" arrows glued to buttons, "·" separators in text, decorative monospace, decorative gradients or glow, generic grey shadows.
- The only decorative motif is the logo's four-pointed star: it sparkles in the intro, then acts as the scroll-progress indicator along a thin vertical line. Other motion only responds to user actions; no blanket fade-in on every section. Numbering is allowed only for quote-flow steps.
- Left-aligned layouts. The 3 formulas are not identical cards: the recommended one is larger, with comparable rows aligned across all three.
- Interactive targets at least 44 px, visible keyboard focus, `prefers-reduced-motion` respected everywhere.
- Vocabulary is constant: "devis" is the request, "formule" is the subscription.

## Logo assets

The supplied logo image is a screenshot with an off-white background and gradient bands. Crop to the wordmark and stars only, export a transparent PNG (and SVG if possible), and make a dark-background variant (CHEY in white, CLEAN and stars in cyan). Derive the favicon and Open Graph image from it. Expected paths: `public/images/logo-source.jpg`, `assets/intro-source.mp4`.

## Contact

WhatsApp and phone: +32 486 37 45 48 (`https://wa.me/32486374548`), with a floating "Écrire sur WhatsApp" button on every page.

## Performance targets

Lighthouse 95+, LCP < 2.5 s, CLS < 0.1; images via `next/image` (WebP/AVIF), self-hosted fonts, progressive loading of the intro frames.
