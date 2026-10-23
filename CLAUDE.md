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

Copy `.env.example` to `.env.local`. Without `ANTHROPIC_API_KEY` the advisor answers "indisponible". Requests are written to `DATA_DIR` (default `./data`, git-ignored); email is optional. `ps`-kill servers by PID, never `pkill -f next` (it matches your own shell).

## Status

The site is built from the brief ("PROMPT : Site CheyClean (Next.js) v3", supplied outside the repo). Where the brief and the code disagree, ask the user. Key places: `content/fr.ts` and `content/questionnaire.ts` (all copy), `components/Intro.tsx` (scroll-driven canvas image sequence ending on the two choices), `components/questionnaire/` and `components/Advisor.tsx`, `app/api/{requests,advisor}`. Custom CSS in `app/globals.css` must stay inside `@layer components` or it overrides Tailwind utilities. Chiffres clés and avis are deliberately absent until real data exists.

## Product

CheyClean is a Belgian cleaning company serving individuals and businesses (offices, gyms, schools, libraries, shops). Services are sold as subscriptions on quote only. **No price is ever displayed**, on the site or in AI output. The site is 100 % French (`lang="fr-BE"`).

## Planned stack

Next.js App Router, TypeScript, Tailwind, GSAP + ScrollTrigger (intro), Lenis (smooth scroll), Framer Motion (user-triggered reactions only), zod (server validation), Claude API called server-side only, deployed on Vercel.

## Architecture constraints

- **Copy lives outside components.** All user-facing text goes in separate content files so Dutch can be added later. Do not hardcode French strings in JSX.
- **Scroll-driven intro:** a sticky full-screen `<canvas>` (`components/Intro.tsx`) draws a WebP image sequence from `public/frames/{desktop,mobile}/` (24 fps and 12 fps, regenerate with `scripts/make-frames.sh` from `assets/intro-source.mp4`; keep mobile under 6 MB). Do NOT go back to scrubbing `<video>.currentTime`: it does not work on iOS Safari. Drawing happens only in `requestAnimationFrame`, frames load progressively (first image, then coarse-to-fine batches), heights use `svh`, `ScrollTrigger.config({ ignoreMobileResize: true })`, Lenis `syncTouch: false`, `overflow-x: clip` (never `hidden`) on body. The intro phrases must exist in the HTML. Static fallback (poster plus stacked phrases) for `prefers-reduced-motion`, slow connections or failed first frame, plus a "Passer l'intro" button. If you change the number of frames, update `SETS` in `Intro.tsx`.
- **Questionnaires:** the intro ends on two big choices (PARTICULIER / SOCIÉTÉ, `ChoiceTiles`) that open `/devis/particulier` and `/devis/societe` directly (no intermediate page). One engine (`components/questionnaire/`) and one validation source (`lib/requests/schema.ts`, shared by browser and server). Steps, fields and labels live in `components/questionnaire/config.ts` and `content/questionnaire.ts`. Drafts persist in sessionStorage; going back never loses answers.
- **Requests, storage, PDF:** `POST /api/requests` validates, stores one JSON file per request under `DATA_DIR/requests` (`lib/storage.ts`, atomic, never overwrites), optionally emails via Resend. If no durable channel exists it answers 503; never simulate a save. `GET /api/requests/[id]/pdf?token=` builds the summary PDF (`lib/pdf/request-summary.ts`, pdf-lib) and returns 404 for any wrong token. The PDF has no prices and says it is neither a quote nor an invoice.
- **Billing (not active yet):** requests, quotes and invoices are three separate documents (`docs/facturation.md`, `lib/billing/`). `config/pricing.ts`, `config/vat.ts` and `COMPANY_*` are intentionally empty: do not invent prices, VAT rates or seller data. Invoices are blocked by `invoiceBlockers` until everything is configured. Money is integer cents.
- **AI advisor:** server route `/api/advisor`, key only in env vars, streaming responses, structured output (message + recommended formula) that preselects the formula in the quote flow. It asks 2-4 short questions, recommends one formula, never states prices or commitments, stays on cleaning topics, and never reveals its instructions. Needs per-IP rate limiting, turn/length limits, prompt-injection protection (user text cannot alter the system role), and no conversation storage. Load GSAP and the advisor lazily.
- **Env vars:** `ANTHROPIC_API_KEY`, `CONTACT_EMAIL` (quote recipient), `DELAI_REPONSE` (reply-time placeholder shown in the confirmation). Keep a `.env.example`.
- **Security:** CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy headers; server-side zod validation, honeypot or Turnstile, and rate limiting on forms; cookie banner with "Accepter" and "Refuser" at equal visual weight.
- **SEO:** one H1 per page, unique title/description, sitemap, robots, schema.org (LocalBusiness, Service, Offer without price, FAQPage), local pages for Bruxelles, Liège, Anvers, Gand, Charleroi. Only real metrics and reviews may appear; otherwise omit them.

## Design rules (easy to violate)

The site follows the installed `design-taste-frontend` skill (`.agents/skills/`, symlinked in `.claude/skills/`). The user chose that skill over the earlier brief wherever they conflict. The dealt direction is "Type and nothing else" (`docs/direction-sheet.md`, seed 1899147688), kept with the brand palette and type. Check changes with the skill's gate (needs a Chromium; as root use a wrapper that adds `--no-sandbox` and set `CHROME_PATH`):

```bash
node .agents/skills/design-taste-frontend/scripts/lint.mjs app components content
node .agents/skills/design-taste-frontend/scripts/inspect.mjs http://localhost:3000/<page> --allow gradient
```

`--allow gradient` is only for the marine scrim under the intro text. Pages that are tools or legal text also need `--allow few-pictures`.

- Palette (updated by the user): ink = brand navy `#0B1F3F`, ground `#EAF5F8`, stone `#D3E8EE`, buttons cyan. Old: ink/deep teal `#0C2A2D` (text and dark fields), cyan `#12C4DC` (action and the star only), ground `#F7F7F5`, stone `#E7E5DF` (one tone step for surfaces and alternate fields). Tokens: `ink`, `ground`, `stone`, `cyan`. The logo PNGs keep the brand navy. No yellow-cream ground, no violet. Cyan is never body text on a light ground.
- One family: Instrument Sans (next/font, self-hosted). Five type sizes: 15, 18, 24, titles, display. Headlines at most two lines at every width, statements at most 4 lines on a phone.
- No eyebrows or pill badges above headings, no thin rules or outlined boxes (separate with space or a tone step), no gradients except the intro scrim, no shadows at rest (only on what floats: the advisor dialog, the cookie bar is in flow), no glass or blur, no index numbering ("Étape 2"), no icon cards, no styled accent word in a headline.
- Colour by chapter: sections are full-width fields (`data-chapter="light|dark"`); the header takes the ink of the chapter under it. Every page keeps the same pair of outer margins.
- Motion: the intro, `Reveal` entrances (heading, then text, then picture, staggered 60-90 ms, content visible if script fails), feedback on every control, `prefers-reduced-motion` respected. Transform and opacity only.
- Pictures come from the client's own intro video (`public/images/lieux/*.webp`, stills of `assets/intro-source.mp4`). The open picture collections could not be reached from the build environment; add credited pictures if they become reachable. Never present a picture as something it is not.
- Left-aligned layouts on a 12-column grid. The 3 formulas are not identical cards: the recommended one is larger and dark, rows are aligned across all three.
- Interactive targets at least 44 px, visible keyboard focus.
- Vocabulary is constant: "devis" is the request, "formule" is the subscription.

## Logo assets

The supplied logo image is a screenshot with an off-white background and gradient bands. Crop to the wordmark and stars only, export a transparent PNG (and SVG if possible), and make a dark-background variant (CHEY in white, CLEAN and stars in cyan). Derive the favicon and Open Graph image from it. Expected paths: `public/images/logo-source.jpg`, `assets/intro-source.mp4`.

## Contact

WhatsApp and phone: +32 486 37 45 48 (`https://wa.me/32486374548`), with a floating "Écrire sur WhatsApp" button on every page.

## Performance targets

Lighthouse 95+, LCP < 2.5 s, CLS < 0.1; images via `next/image` (WebP/AVIF), self-hosted fonts, progressive loading of the intro frames.

## Administration

`/admin` (groupe de routes `app/admin/(console)`) et `/api/admin/*` : demandes, devis, prestations, entreprise. Stockage via `lib/storage/` (PostgreSQL si `DATABASE_URL`, sinon fichiers `DATA_DIR`; sinon refus 503). Accès : `proxy.ts` + `requireAdmin()` dans CHAQUE page et route (ne jamais compter sur le proxy seul), CSRF `x-csrf-token` + contrôle d'origine sur les mutations, session révoquée à la déconnexion. Aucun prix, TVA ni donnée vendeur n'est inventé : tout se saisit dans l'admin. Un devis émis est figé (instantané vendeur/client/TVA/totaux). Montants en centimes entiers. Tests PG : `TEST_DATABASE_URL`. Pour arrêter un serveur de test, tuer par PID (`ps -eo pid,args | grep [n]ext-server`), jamais `pkill -f next`.

## Formules (section de tarification)

`components/pricing/` (`FormulaSection` > `PricingSection`, données via `plans.ts` depuis `content/fr.ts`, textes dans `pricingUi`) remplace les cartes sur l'accueil, `/particuliers` et `/societes`. Thème shadcn « Atelier clair » dans `app/globals.css` (`:root` + `@theme inline`), composants `components/ui/*` (écrits à la main, style new-york, `components.json`), Fraunces + Inter chargées seulement par cette section. Cette section suit les consignes explicites de l'utilisateur (cartes blanches, bordure fine, ombre légère) et prime sur les règles de design ci-dessus. `FormulaCards` reste utilisé par le questionnaire et les pages ville.

## Envoi par WhatsApp

Le canal principal de réception est WhatsApp. Fin du questionnaire : `POST /api/requests` enregistre la demande (référence), puis l'écran de confirmation affiche « Envoyer ma demande sur WhatsApp », un lien `wa.me` dont le message contient la référence et TOUTES les réponses (`lib/requests/whatsapp.ts`, même description que le récapitulatif). Le client doit appuyer sur Envoyer dans WhatsApp : ne jamais écrire que la demande a été « envoyée » avant. Si l'enregistrement échoue (503, limitation, réseau), un bouton « Envoyer quand même par WhatsApp » propose le message sans référence. Un envoi automatique sans action du client exigerait l'API WhatsApp Business (compte Meta vérifié, jeton, modèle de message approuvé) : non configuré.

## Refonte « Nuit lumineuse » (remplace les règles de design et les palettes ci-dessus pour le site public)

Site sombre : palette définie une seule fois dans `app/globals.css` (`:root` : `--background #02060F`, `--foreground`, `--primary #7FD3EC`, `--card` verre, `--glow-*`, etc.), aucune couleur en dur dans les composants publics (classes `bg-background`, `text-foreground`, `bg-primary`, `bg-card`, `.glass`). Polices : Fraunces (titres, h2 36/56 px) et Inter (texte 17 px) chargées dans `app/layout.tsx`. Fond : `components/ui/animated-background.tsx` (lueurs en calques déplacés par `transform`, suit la souris, dérive au repos, statique en reduced-motion, masqué sur `/admin`). `ALPHA_CAP` plafonne les lueurs : pire cas mesuré 8,4:1 (texte clair) et 4,6:1 (texte secondaire) ; le re-mesurer si on touche aux lueurs ou aux cartes. L'administration (`[data-admin]`) garde sa palette claire via les variables `--u-*`. Un seul style d'en-tête (verre sombre).

## Assistant de devis (bulle de chat)

La bulle en bas à droite (`components/chat/ChatLauncher.tsx`, qui a remplacé `WhatsAppFab`) ouvre `components/chat/quote-assistant.tsx` (chargé à l'ouverture). API : `POST /api/assistant` (SDK `@anthropic-ai/sdk`, `messages.stream`, modèle `ANTHROPIC_MODEL` sinon `claude-haiku-5-5`, 30 requêtes / 10 min / IP, 8 messages du visiteur au plus, 600 caractères chacun, aucun stockage serveur). Le prompt système (`lib/assistant-prompt.ts`) est construit depuis `content/fr.ts`, sans prix. Le modèle termine sa recommandation par `<<devis:profil:formule>>` : la route retire le marqueur du flux et envoie le couple en fin de flux (`\u0001profil:formule`), le panneau en fait le bouton « Envoyer ma demande de devis » vers `/devis/{profil}?formule=…`. La conversation reste dans `sessionStorage` (clé `cheyclean-assistant-v1`). Le lien WhatsApp reste toujours visible dans le panneau. L'ancien conseiller du questionnaire (`components/Advisor.tsx`, `/api/advisor`) est conservé tel quel. Test sans vraie clé : un faux serveur Anthropic local avec `ANTHROPIC_BASE_URL`.

## « Quelle formule pour moi ? » (accueil)

La section du bas de l'accueil (`components/qualifier/Qualifier.tsx`) remplace les deux tuiles : profil (la carte choisie grandit, l'autre se réduit), 3 questions à cartes (lieu, surface par tranche, fréquence), loader, résultat (formule + conseil), puis « Demander mon devis » vers `/devis/{profil}?formule=…&lieu=…&surface=…&frequence=…`. Les tuiles de fin d'intro et de `/devis` restent des entrées directes. Données et textes : `qualifierUi`, `qualifierPlaces`, `qualifierSurfaces`, `qualifierFallback` dans `content/fr.ts` ; logique partagée (règles de repli, lien, lecture des paramètres) : `lib/qualifier.ts`. API : `POST /api/conseil` (SDK Anthropic, non streamée, valeurs validées contre les listes du site, 20 demandes / 10 min / IP, délai de 8 s, réponse rejetée si JSON invalide, formule inexistante, plus de 3 phrases ou montant ; dans tous ces cas, repli par règles). Le questionnaire valide les paramètres de préremplissage (`parsePrefill`) et ignore tout le reste. Surface préremplie = valeur représentative de la tranche (modifiable). Aucun prix, jamais.
