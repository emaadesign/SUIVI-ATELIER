# Ateliers Crochet — guide de mise en route

Cette application est une **PWA** (installable sur ton téléphone) connectée à une base de données **Supabase**. Ce guide t'explique comment la mettre en ligne, étape par étape, sans connaissances techniques préalables. Compte environ 45-60 minutes la première fois — ensuite tu n'y reviens plus.

⚠️ **Important sur ta clé Billetweb** : tu m'as transmis ta clé API dans notre conversation. Je ne l'ai **pas** intégrée dans le code (ce serait dangereux si le code est un jour partagé). Tu devras la saisir toi-même, une seule fois, dans l'interface Supabase à l'étape 4 — c'est un espace privé que seule toi contrôle.

---

## 1. Créer ton compte Supabase (gratuit)

1. Va sur [supabase.com](https://supabase.com) → "Start your project" → crée un compte.
2. Crée un nouveau projet (choisis un mot de passe de base de données, garde-le de côté).
3. Une fois le projet créé, va dans **Project Settings → API** : note ton **Project URL** et ta **clé "anon public"**. Tu en auras besoin à l'étape 3.

## 2. Créer les tables de la base de données

1. Dans Supabase, ouvre **SQL Editor**.
2. Ouvre le fichier `supabase/schema.sql` de ce projet, copie tout son contenu, colle-le dans l'éditeur, et clique sur **Run**.
3. Tes tables sont créées (participantes, ateliers, stocks, messages...).

## 3. Créer ton compte utilisatrice (pour te connecter à l'app)

1. Dans Supabase, va dans **Authentication → Users → Add user**.
2. Renseigne ton email et un mot de passe : ce sera tes identifiants de connexion dans l'app.

## 4. Configurer la synchronisation Billetweb (sécurisée)

1. Toujours dans Supabase, va dans **Edge Functions**.
2. Déploie les deux fonctions fournies dans `supabase/functions/` (`sync-billetweb` et `send-message`) — si tu n'es pas à l'aise avec la ligne de commande, je peux te guider en direct, ou tu peux demander à quelqu'un de technique de faire juste ce déploiement (2 commandes).
3. Va dans **Edge Functions → Secrets** et ajoute :
   - `BILLETWEB_USER` = `290271`
   - `BILLETWEB_KEY` = *(ta clé, celle que tu m'as donnée)*
   - `RESEND_API_KEY` = *(voir étape 6 pour l'obtenir)*
   - `EMAIL_EXPEDITEUR` = l'adresse email depuis laquelle tes messages seront envoyés

Ces secrets ne sont **jamais** visibles depuis le téléphone ou le code de l'application.

## 5. Connecter l'application à ta base

1. Copie le fichier `.env.example` en `.env.local`.
2. Renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec les valeurs notées à l'étape 1.

## 6. Créer un compte Resend (pour les emails de rappel)

1. Va sur [resend.com](https://resend.com), crée un compte gratuit (3000 emails/mois offerts).
2. Récupère ta clé API et ajoute-la comme secret `RESEND_API_KEY` (étape 4).
3. Configure l'adresse d'expédition (idéalement une adresse liée à un nom de domaine que tu possèdes, sinon Resend fournit une adresse de test).

## 7. Mettre l'application en ligne

La façon la plus simple : héberger sur **Vercel** (gratuit).

1. Crée un compte sur [vercel.com](https://vercel.com).
2. Importe ce projet (depuis GitHub, ou en glissant le dossier si tu utilises leur interface).
3. Dans les réglages du projet Vercel, ajoute les mêmes variables que ton `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. Clique sur **Deploy**. Tu obtiens un lien du type `https://tes-ateliers.vercel.app`.

## 8. Installer l'app sur ton téléphone

1. Ouvre le lien Vercel dans Safari (iPhone) ou Chrome (Android).
2. Appuie sur "Partager" (iPhone) ou le menu ⋮ (Android) → **"Ajouter à l'écran d'accueil"**.
3. L'icône apparaît sur ton téléphone comme une vraie application.

## 9. (Optionnel) Automatiser la synchronisation Billetweb

Par défaut, tu synchronises en appuyant sur le bouton "Synchroniser maintenant" dans l'app. Si tu veux que ce soit automatique toutes les 20 minutes :
1. Dans Supabase, va dans **Database → Cron Jobs**.
2. Crée une tâche qui appelle la fonction `sync-billetweb` toutes les 20 minutes.

---

## Mises à jour futures

Chaque fois que je fais évoluer le code (nouvelle fonctionnalité, correction), il suffit de redéployer sur Vercel (automatique si le projet est connecté à GitHub). Tu n'as jamais besoin de réinstaller quoi que ce soit sur ton téléphone : la mise à jour se fait automatiquement à la prochaine ouverture de l'app.

## Ce qui est déjà fonctionnel dans cette première version

- Authentification, dashboard, ateliers, fiches participantes, recherche/filtres
- Suivi des pelotes (achetée / à acheter) avec vue globale
- Stocks avec réservation/distribution automatique et alertes bas/critique
- Import Billetweb (API + CSV de secours) sans doublons
- Envoi manuel des rappels, messages post-atelier et invitations WhatsApp (par email)
- Export CSV des participantes et des listes de préparation
- Calendrier mensuel
- Paramètres : types d'ateliers, produits, packs, messages, infos générales

## Prochaine itération possible

- Envoi automatique des rappels 48h avant (actuellement manuel, comme demandé)
- Gestion fine des rôles/droits si tu ajoutes une assistante
- Génération automatique d'un rendu "livret à préparer" en PDF
