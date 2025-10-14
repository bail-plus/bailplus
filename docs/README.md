# Documentation BailoGenius

Bienvenue dans la documentation technique de BailoGenius, une plateforme de gestion locative complète.

## Table des matières

### 📚 Documentation disponible

#### 🎯 Features (Fonctionnalités)

1. **[Système d'Invitation](./features/invitations.md)**
   - Architecture et flux de travail
   - Gestion des invitations de locataires et prestataires
   - Configuration et déploiement
   - Guide de dépannage

#### 📝 Changelogs (Historique des versions)

1. **[Invitations v1.0.0](./changelogs/invitations.md)**
   - Système d'invitation complet
   - Fonctionnalités ajoutées, corrections de bugs
   - Roadmap des prochaines versions

## À propos du projet

BailoGenius est une plateforme SaaS de gestion locative qui permet aux propriétaires de:
- Gérer leurs biens immobiliers
- Suivre les loyers et les paiements
- Gérer les tickets de maintenance
- Inviter et gérer locataires et prestataires de services
- Gérer les documents et contrats

## Technologies utilisées

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Supabase Auth
- **Email**: Resend
- **Paiements**: Stripe (à venir)

## Contribuer à la documentation

Pour ajouter une nouvelle page de documentation:

1. Créer un fichier `.md` dans le sous-dossier approprié (`features/` ou `changelogs/`)
2. Suivre le template existant (voir `features/invitations.md`)
3. Ajouter un lien dans ce README
4. Utiliser une structure claire avec:
   - Vue d'ensemble
   - Architecture
   - Flux de travail
   - Configuration
   - Dépannage
   - Références

## Structure des fichiers

```
docs/
├── README.md                    # Index principal
├── features/                    # Documentation des fonctionnalités
│   └── invitations.md          # Système d'invitation
└── changelogs/                  # Historique des versions
    └── invitations.md          # Changelog des invitations
```

## Contact

Pour toute question ou suggestion concernant la documentation, veuillez créer une issue dans le repository.

---

**Dernière mise à jour**: Octobre 2025
