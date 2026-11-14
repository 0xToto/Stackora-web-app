# Validation du 14 novembre 2026 (STACKORA 0.2)

| Contrôle | Résultat | Fichier |
|---|---|---|
| Tests serveur (`npm test`) | 53 / 53 réussis (45 de la 0.1 + 8 économie) | `tests.txt` |
| TypeScript strict serveur + mobile (`npm run typecheck`) | OK | `typecheck.txt` |
| Export web Expo (`expo export --platform web`) | OK | `build-web.txt` |
| Parcours réel Chrome headless 393×852 (iPhone 15) | 39 captures, aucune erreur JS | `../screenshots/iphone-15` |
| Parcours réel Chrome headless 375×667 (iPhone SE) | duel complet jusqu'aux résultats | `../screenshots/iphone-se` |

Parcours automatisé : inscription → accueil → onglets → achat et équipement d'un cosmétique → règles (chapitre, comparateur, variante 7/2) → quiz des positions → entraîneur de décisions → profil → paramètres → notifications → création de tournoi → 7 bots → table 8 joueurs (mise, raccourcis, préactions, historique) → duel à tapis jusqu'à la victoire → récompense serveur et mission réclamable.

Non vérifié ici : build natif iOS (EAS/Xcode), iPhone physique, haptique, audio natif, VoiceOver, achats StoreKit réels.

## Complément 0.2.1

| Contrôle | Résultat | Fichier |
|---|---|---|
| Tests serveur | 55 / 55 (dont 2 paiement web) | `tests-0.2.1.txt` |
| Typecheck | OK | `typecheck-0.2.1.txt` |
| Export web | OK | `build-web-0.2.1.txt` |
| Parcours navigateur achat web + entraîneur | Achat d'un pack via un faux Stripe local, crédit vérifié par le serveur ; fréquences et tableau Nash affichés | `../screenshots/v0.2.1` |
| Pack GTO | 29 scénarios, 19 calculés, 0 erreur de validation | — |
