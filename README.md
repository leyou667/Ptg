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
| `npm test` | Tests (Vitest) : validation, stockage, PDF, API, facturation ; un fichier : `npx vitest run tests/requests.test.ts` |

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `DATA_DIR` | Dossier où les demandes sont enregistrées (défaut `./data`). Voir « Stockage » |
| `ANTHROPIC_API_KEY` | Assistant IA (serveur uniquement). Sans clé, l'assistant affiche « indisponible » |
| `ANTHROPIC_MODEL` | Modèle rapide et économique (défaut `claude-haiku-5-5`) |
| `CONTACT_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM` | Copie de chaque demande par email, PDF en pièce jointe (facultatif) |
| `DELAI_REPONSE` | Délai affiché dans la confirmation, à confirmer par CheyClean |
| `NEXT_PUBLIC_SITE_URL` | URL publique (SEO, sitemap, Open Graph) |
| `NEXT_PUBLIC_WHATSAPP` | Numéro WhatsApp au format international sans `+` |
| `COMPANY_*` | Identité du vendeur, pour devis et factures futurs (voir `docs/facturation.md`) |

## Parcours client

L'intro défilante (environ 3 écrans, bouton « Passer l'intro ») se termine sur deux grands choix, **PARTICULIER** et **SOCIÉTÉ**, qui ouvrent directement `/devis/particulier` et `/devis/societe`. Les mêmes choix reviennent en bas de la page d'accueil et sur `/devis`.

- **Particulier** : Vous, Lieu et besoin, Formule, Récapitulatif.
- **Société** : Société (nom, numéro d'entreprise contrôlé, adresse de facturation), Contact, Lieu et besoin, Formule, Récapitulatif.

Validation par étape (messages en français), retour en arrière sans perte, brouillon conservé dans le navigateur (session) y compris après rechargement, récapitulatif modifiable, consentement obligatoire. Les règles de validation sont dans `lib/requests/schema.ts` et servent à la fois au navigateur et au serveur.

## Stockage

`POST /api/requests` valide les données, les enregistre dans `DATA_DIR/requests/DEV-AAMM-XXXXXX.json` (écriture atomique, jamais d'écrasement), puis renvoie la référence. Le PDF récapitulatif est généré à la demande par `GET /api/requests/[id]/pdf?token=...` ; le jeton n'est remis qu'au client qui vient d'envoyer sa demande.

**Si aucun stockage durable n'est disponible** (hébergement serverless sans disque persistant et sans `DATA_DIR`) et qu'aucun email n'est configuré, l'envoi est refusé avec un message clair : rien n'est jamais simulé. Sur Vercel, utilisez un volume persistant ou remplacez `lib/storage.ts` par une base de données (l'interface `create / get / replace` reste la même). L'email (Resend) est un canal en plus, pas un remplacement du stockage.

Les demandes se lisent dans le dossier `data/requests/` (un fichier JSON par demande). Il n'y a pas encore d'écran d'administration.

## Structure

- `content/fr.ts` : tous les textes (prêt pour l'ajout du néerlandais), formules, FAQ, pages légales.
- `components/Intro.tsx` : intro pilotée par le scroll, séquence d'images dessinée sur un `<canvas>` (GSAP ScrollTrigger, chargé à la demande). Compatible iOS Safari, contrairement au pilotage de `<video>.currentTime`.
- `components/questionnaire/` : moteur des deux questionnaires ; `components/Advisor.tsx` : assistant IA.
- `app/api/requests`, `app/api/advisor` : routes serveur (validation zod, honeypot, limitation par IP).
- `lib/requests/`, `lib/pdf/`, `lib/storage.ts`, `lib/billing/`, `config/` : demandes, PDF, stockage, facturation.
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
- [ ] Questionnaires testés de bout en bout en ligne, demande retrouvée dans le stockage choisi, email reçu si configuré
- [ ] Assistant IA testé avec une vraie clé (recommandation, hors sujet, indisponible)
