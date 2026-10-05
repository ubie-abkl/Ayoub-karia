# Mariage Cheïma & Amine — 06.11.2026

Site d'invitation statique (HTML/CSS/JS, aucune dépendance).

- `index.html` — enveloppe d'accueil → ouverture animée → save the date, programme, compte à rebours
- `style.css`, `script.js`
- `images/fond-floral.jpg` — photo de fond · `images/lin-broderie.jpg` — texture de l'enveloppe
- `images/lace.svg` — motif dentelle du programme détaillé

Ouvrir `index.html` dans un navigateur, ou publier via GitHub Pages / Netlify.

## Formulaire de présence → Google Sheets

Les réponses arrivent dans un Google Sheets (Horodateur, Nom & Prénom,
Serez-vous présent(e) ?, Nombre de personnes, Petit mot).

1. Créez un Google Sheets vide, puis Extensions > Apps Script.
2. Collez le contenu de `google-apps-script.gs` et enregistrez.
3. Déployer > Nouveau déploiement > Application Web
   (Exécuter en tant que : Moi · Qui a accès : Tout le monde), puis autorisez.
4. Copiez l'URL qui se termine par `/exec` dans `FORM_ENDPOINT` en haut de la
   partie « Formulaire de présence » de `script.js`.

Le formulaire ne fonctionne que sur le site publié (GitHub Pages, Netlify…).
