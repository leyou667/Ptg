# Facturation : architecture et mise en service

Aucun prix, aucun taux de TVA et aucune identité de vendeur n'est défini dans ce dépôt. Tout est prévu pour les ajouter plus tard sans reconstruire l'application.

## Trois documents distincts

| Document | Contenu | Où | État aujourd'hui |
| --- | --- | --- | --- |
| **Demande de devis** | Ce que le client déclare : coordonnées, lieu, besoin. Aucun prix. | `lib/requests/`, dossier `data/requests/` | Opérationnel : enregistrée, PDF récapitulatif, email facultatif |
| **Devis** | Offre chiffrée par CheyClean : lignes, prix, TVA, validité. Statuts `draft`, `sent`, `accepted`, `declined`, `expired`. | `lib/billing/workflow.ts`, `data/quotes/` | Logique écrite et testée ; refuse de fonctionner tant que le catalogue est vide. Pas d'écran ni de PDF de devis. |
| **Facture définitive** | Émise seulement depuis un devis accepté, numérotation continue sans trou (`2026-0001`). | `lib/billing/workflow.ts`, `data/invoices/` | Logique écrite et testée ; bloquée tant que les conditions ci-dessous ne sont pas réunies. Pas d'écran ni de PDF de facture. |

Les trois collections sont des dossiers séparés, et un devis n'est jamais une demande modifiée : c'est un nouveau document qui référence la demande (`requestId`).

## Ce qu'il faut renseigner pour activer devis et factures

1. **Prestations et prix** : `config/pricing.ts`. Chaque entrée : identifiant, libellé, unité, prix unitaire HORS TVA en centimes, identifiant de taux de TVA. Les prix d'un devis sont copiés au moment de sa création : modifier le catalogue plus tard ne change pas un devis établi.
2. **Règles de TVA** : `config/vat.ts`. Liste de taux (identifiant, libellé, pourcentage). Le choix du taux par prestation, les exonérations et l'autoliquidation sont une décision comptable à prendre avec votre comptable ; le code ne devine rien.
3. **Identité du vendeur** : variables `COMPANY_*` dans `.env.local` (nom légal, forme, adresse, numéro de TVA valide, IBAN). Lue par `config/company.ts`.

## Conditions qui bloquent une facture (`invoiceBlockers`)

La facture est refusée, avec la liste complète des raisons, si : le devis n'est pas accepté ; une facture existe déjà pour ce devis ; l'identité du vendeur est incomplète ou son numéro de TVA invalide ; les informations de facturation du client sont incomplètes (société : numéro d'entreprise obligatoire) ; aucune règle de TVA ; aucun prix ; une ligne a un prix, une quantité ou un taux invalide.

## Calcul

Montants en centimes entiers. La TVA est calculée par taux sur la somme des bases, arrondie au centime, afin que le total TVA soit la somme des TVA par taux, comme sur une facture.

## Ce qui reste à construire (volontairement)

- Un écran interne pour créer et envoyer un devis à partir d'une demande, puis marquer son acceptation.
- Les PDF de devis et de facture (le PDF de récapitulatif de demande existe et sert de modèle : `lib/pdf/request-summary.ts`).
- L'envoi des documents au client, les paiements, les relances, la comptabilité : ils demandent des décisions et des informations que vous n'avez pas encore données.
- Un accès réservé (authentification) pour consulter les demandes. Pour l'instant, elles se lisent dans `data/requests/` et dans l'email de notification.
- Une base de données si l'hébergement n'a pas de disque persistant (voir README, « Stockage »).

## Tests

`npm test` : `tests/billing.test.ts` couvre les totaux, les transitions de devis, les bloqueurs, la numérotation sans trou et l'unicité de la facture par devis, avec des valeurs de test qui ne sont ni des prix ni des taux réels.
