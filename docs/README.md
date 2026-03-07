# Modifier le site vitrine (guide débutant)

Ce guide est fait pour les personnes qui ne codent pas au quotidien, mais qui doivent faire des modifications sur le site vitrine.

## Regle la plus importante

Ne jamais travailler directement dans `main` ou `develop`.

Tu dois toujours creer une branche `feature`.

## 1) Cloner le projet

```bash
git clone https://github.com/bail-plus/bailplus.git
cd bailplus
```

## 2) Initialiser Git Flow (une seule fois)

```bash
git flow init -d
```

L'option `-d` applique la configuration par defaut.

## 3) Creer une branche de travail

Avant chaque modification:

```bash
git checkout develop
git pull origin develop
git flow feature start nom-de-la-feature
```

Exemple:

```bash
git flow feature start update-texte-homepage
```

## 4) Lancer le frontend en local

Depuis la racine du projet:

```bash
cd frontend
npm install
npm run dev
```

Le site est disponible sur:

```text
http://localhost:8080
```

Laisse ce terminal ouvert pendant que tu fais tes modifications.

Conseil simple:
- Terminal 1: `npm run dev` (frontend)
- Terminal 2: commandes Git (`git add`, `git commit`, `git push`)

## 5) Faire les modifications

Tu peux modifier les fichiers:
- soit avec VS Code (interface visuelle),
- soit en ligne de commande.

## 6) Commit des changements

### Option A: via VS Code (visuel)
- Ouvrir l'onglet Source Control.
- Verifier les fichiers modifies.
- Ecrire un message de commit clair.
- Cliquer sur Commit.

### Option B: en ligne de commande

```bash
git add .
git commit -m "Texte: mise a jour de la section hero"
```

## 7) Push de la branche feature

```bash
git push -u origin feature/nom-de-la-feature
```

## 8) Creer une Pull Request dans VS Code

1. Faire une premiere Pull Request de `feature/...` vers `develop`.
2. Une fois valide et merge dans `develop`, faire une Pull Request vers `main` si tu veux rendre la modification visible en production.

## Rappel rapide

- Toujours partir d'une branche `feature`.
- Jamais de travail direct sur `main` ou `develop`.
- PR vers `develop` d'abord.
- PR vers `main` ensuite pour publication.
