# CheyClean

Site vitrine et parcours de devis de CheyClean, société de nettoyage en Belgique. Next.js (App Router), TypeScript, Tailwind CSS 4, GSAP, Lenis, Framer Motion.

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables
npm run dev                  # http://localhost:3000
```

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Tests unitaires (Vitest) ; un seul fichier : `npx vitest run tests/lib.test.ts` |

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `ANTHROPIC_API_KEY` | Assistant IA (serveur uniquement). Sans clé, l'assistant affiche « indisponible » |
| `ANTHROPIC_MODEL` | Modèle rapide et économique (défaut `claude-haiku-5-5`) |
| `CONTACT_EMAIL` | Adresse qui reçoit les devis |
| `RESEND_API_KEY`, `RESEND_FROM` | Envoi des emails via Resend. Sans eux, en production l'envoi échoue (message d'erreur affiché) |
| `DELAI_REPONSE` | Délai affiché dans la confirmation, à confirmer par CheyClean |
| `NEXT_PUBLIC_SITE_URL` | URL publique (SEO, sitemap, Open Graph) |
| `NEXT_PUBLIC_WHATSAPP` | Numéro WhatsApp au format international sans `+` |

## Structure

- `content/fr.ts` : tous les textes (prêt pour l'ajout du néerlandais), formules, FAQ, pages légales.
- `components/Intro.tsx` : intro pilotée par le scroll, séquence d'images dessinée sur un `<canvas>` (GSAP ScrollTrigger, chargé à la demande). Compatible iOS Safari, contrairement au pilotage de `<video>.currentTime`.
- `components/QuoteFlow.tsx`, `components/Advisor.tsx` : parcours de devis et assistant IA.
- `app/api/quote`, `app/api/advisor` : routes serveur (validation zod, honeypot, limitation par IP).
- `public/frames/{desktop,mobile}/` : images WebP de l'intro (24 i/s ordinateur, 12 i/s mobile), générées par `scripts/make-frames.sh` depuis `assets/intro-source.mp4`.
- `public/images/logo*.png` : logo à fond transparent (`scripts/make-logo.py` le régénère depuis la capture).

## Déploiement Vercel

1. Importer le dépôt sur Vercel (framework Next.js détecté).
2. Renseigner les variables ci-dessus (Production).
3. Déployer, puis configurer le domaine.

## À compléter avant la mise en ligne

- Mentions légales : raison sociale, adresse, numéro BCE et TVA.
- Durée de conservation des demandes (politique de confidentialité).
- Email de réception (`CONTACT_EMAIL`) et expéditeur vérifié sur Resend.
- Chiffres clés et avis clients : volontairement absents tant que CheyClean ne fournit pas de données réelles.
- Version SVG du logo (seul le PNG transparent est fourni).

## Limites connues

- La limitation de requêtes est en mémoire (par instance serverless) ; pour un contrôle global, utiliser un stockage partagé (Upstash Redis).
- La CSP autorise `'unsafe-inline'` pour les scripts (pages statiques Next.js sans nonce).

## Checklist finale

- [ ] Lighthouse 95+ (mobile et ordinateur), LCP < 2,5 s, CLS < 0,1
- [ ] En-têtes de sécurité vérifiés
- [ ] Un seul H1, titles et descriptions uniques, sitemap et robots
- [ ] Navigation clavier complète, contrastes AA, assistant utilisable au lecteur d'écran
- [ ] Parcours de devis testé de bout en bout (mobile et ordinateur), email reçu
- [ ] Assistant IA testé avec une vraie clé (recommandation, hors sujet, indisponible)
