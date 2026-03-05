# 📚 Guide Gitflow - BailloGenius

Ce document décrit la stratégie de branchement gitflow utilisée pour le projet BailloGenius.

---

## 🎯 Vue d'ensemble du Gitflow

Gitflow est une stratégie de branchement qui organise le développement en utilisant plusieurs branches avec des rôles spécifiques :

```
main (production)
  ↑
  ├── hotfix/* (corrections urgentes)
  └── release/* (préparation des versions)
        ↑
        develop (intégration du développement)
          ↑
          ├── feature/* (nouvelles fonctionnalités)
          ├── bugfix/* (corrections de bugs)
          └── enhancement/* (améliorations)
```

---

## 🌿 Structure des branches

### 1. **main** (Production)
- **Rôle** : Branche de production stable
- **Contient** : Code testé et prêt pour la production
- **Accès** : Protégée, modifications via PR seulement
- **Tags** : Versionning (v1.0.0, v1.1.0, etc.)
- **À faire** : Ne jamais committer directement

---

### 2. **develop** (Intégration)
- **Rôle** : Branche de développement principal
- **Contient** : Toutes les features complétées et testées
- **Créée à partir de** : main
- **Point de départ** : Pour les nouvelles features
- **Fusionnée vers** : main (via release branches)
- **Accès** : Protégée, modifications via PR seulement

---

### 3. **feature/** (Nouvelles fonctionnalités)
- **Pattern** : `feature/nom-de-la-fonctionnalite`
- **Créée à partir de** : develop
- **Fusionnée vers** : develop
- **Nomage** : `feature/dossier-role-page-action`

#### Exemples de nommage :

```
feature/components-layout-sidebar-responsive
feature/pages-app-properties-filters
feature/pages-app-leases-modal-creation
feature/hooks-auth-useAuth-tokens
feature/utils-validation-email-regex
feature/contexts-entity-providers
```

#### Structure : `dossier/role/page/action`

| Partie | Description | Exemples |
|--------|-------------|----------|
| **dossier** | Répertoire principal du code | `components`, `pages`, `hooks`, `utils`, `contexts` |
| **role** | Sous-catégorie ou domaine | `layout`, `auth`, `app`, `ui`, `forms` |
| **page** | Page ou fonctionnalité spécifique | `sidebar`, `properties`, `leases`, `calendar` |
| **action** | Ce que vous faites | `responsive`, `filters`, `modal`, `validation` |

**Cycle de vie d'une feature :**
```
1. git checkout -b feature/components-layout-sidebar-responsive develop
2. Développement & commits
3. Tests locaux
4. Push : git push origin feature/...
5. Créer une Pull Request (PR) vers develop
6. Code review
7. Merge et suppression de la branche
```

---

### 4. **bugfix/** (Corrections de bugs)
- **Pattern** : `bugfix/nom-du-bug`
- **Créée à partir de** : develop
- **Fusionnée vers** : develop
- **Nomage** : `bugfix/dossier-role-page-bug`

#### Exemples :

```
bugfix/components-forms-validation-email-regex
bugfix/pages-app-properties-filters-crash
bugfix/hooks-auth-token-expiration
```

**À utiliser pour** : Corrections de bugs trouvés en développement (pas en production)

---

### 5. **enhancement/** (Améliorations)
- **Pattern** : `enhancement/nom-de-lamelioration`
- **Créée à partir de** : develop
- **Fusionnée vers** : develop
- **Nomage** : `enhancement/dossier-role-page-improvement`

#### Exemples :

```
enhancement/components-ui-buttons-animation
enhancement/pages-app-dashboard-performance
enhancement/utils-calculations-optimization
```

**À utiliser pour** : Refactoring, optimisations, améliorations d'expérience utilisateur

---

### 6. **release/** (Préparation des versions)
- **Pattern** : `release/vX.Y.Z`
- **Créée à partir de** : develop
- **Fusionnée vers** : main et develop
- **Durée** : Courte (quelques jours)
- **Purpose** : Préparation de la production

#### À faire sur une release branch :
- Bumper la version (package.json)
- Finaliser les release notes
- Corriger les bugs critiques uniquement
- Tests finaux

**Cycle de vie :**
```
1. git checkout -b release/v1.2.0 develop
2. Bumper la version : npm version minor
3. Finaliser la documentation
4. Créer une PR vers main
5. Créer une PR vers develop
6. Merger dans main → git tag v1.2.0
7. Merger dans develop
8. Supprimer la branche release
```

---

### 7. **hotfix/** (Corrections urgentes)
- **Pattern** : `hotfix/nom-du-hotfix`
- **Créée à partir de** : main
- **Fusionnée vers** : main ET develop
- **Raison** : Bug critique en production qui ne peut pas attendre

#### Exemples :

```
hotfix/pages-app-leases-crash-null-pointer
hotfix/components-forms-xss-vulnerability
hotfix/utils-calculations-wrong-formula
```

**Cycle de vie :**
```
1. git checkout -b hotfix/pages-app-leases-crash main
2. Correction du bug
3. Bumper la version patch : npm version patch
4. Créer une PR vers main → Merger → git tag
5. Créer une PR vers develop → Merger
6. Supprimer la branche hotfix
```

---

## 📋 Structure du projet et nommage détaillé

### Arborescence du projet

```
bailogenius-gestion-locative/
├── frontend/
│   ├── src/
│   │   ├── components/           # Composants réutilisables
│   │   │   ├── accounting/      # Comptabilité
│   │   │   ├── communications/  # Communications
│   │   │   ├── dashboard/       # Tableaux de bord
│   │   │   ├── documents/       # Documents
│   │   │   ├── email/           # Emails
│   │   │   ├── inspections/     # États des lieux
│   │   │   ├── layout/          # Layout & navigation
│   │   │   ├── leases/          # Baux
│   │   │   ├── letters/         # Courriers
│   │   │   ├── maintenance/     # Maintenance
│   │   │   ├── marketing/       # Marketing
│   │   │   ├── modals/          # Modales
│   │   │   ├── notifications/   # Notifications
│   │   │   ├── offers/          # Offres
│   │   │   ├── people/          # Contacts/personnes
│   │   │   ├── properties/      # Propriétés
│   │   │   ├── provider/        # Prestataire individuel
│   │   │   ├── providers/       # Liste prestataires
│   │   │   ├── receipts/        # Quittances
│   │   │   ├── reports/         # Rapports
│   │   │   ├── routing/         # Routage
│   │   │   ├── settings/        # Paramètres (composants)
│   │   │   ├── settings-page/   # Page paramètres
│   │   │   ├── tri-simulator/   # Simulateur tri
│   │   │   └── ui/              # UI components (buttons, modals, etc.)
│   │   ├── pages/               # Pages applicatives
│   │   │   ├── account/         # Compte utilisateur
│   │   │   ├── app/             # Application principale
│   │   │   ├── auth/            # Authentification
│   │   │   ├── dashboards/      # Dashboards
│   │   │   ├── marketing/       # Pages marketing
│   │   │   ├── settings/        # Pages paramètres
│   │   │   ├── NotFound.tsx     # Page 404
│   │   │   └── NotFoundPublic.tsx
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── account/         # Hooks compte
│   │   │   ├── accounting/      # Hooks comptabilité
│   │   │   ├── analytics/       # Hooks analytics
│   │   │   ├── auth/            # Hooks authentification
│   │   │   ├── communications/  # Hooks communications
│   │   │   ├── documents/       # Hooks documents
│   │   │   ├── leasing/         # Hooks baux
│   │   │   ├── maintenance/     # Hooks maintenance
│   │   │   ├── marketing/       # Hooks marketing
│   │   │   ├── notifications/   # Hooks notifications
│   │   │   ├── properties/      # Hooks propriétés
│   │   │   ├── providers/       # Hooks prestataires
│   │   │   ├── receipts/        # Hooks quittances
│   │   │   ├── tri/             # Hooks TRI
│   │   │   └── ui/              # Hooks UI
│   │   ├── contexts/            # Context API
│   │   ├── guards/              # Guards de navigation
│   │   ├── services/            # Services (API calls)
│   │   ├── lib/                 # Bibliothèques
│   │   ├── utils/               # Fonctions utilitaires
│   │   ├── config/              # Configuration
│   │   └── integrations/        # Intégrations externes
│   ├── supabase/                # Supabase functions
│   └── package.json
├── docs/                        # Documentation
│   ├── setup/
│   │   └── GITFLOW.md          # Ce fichier
│   └── ...
└── .github/                     # GitHub workflows
```

---

## 📝 Exemples de nommage par domaine

### **Components** (composants)

#### Layout & Navigation
```
feature/components-layout-sidebar-responsive
feature/components-layout-header-notifications
feature/components-routing-breadcrumb-navigation
```

#### Propriétés & Baux
```
feature/components-properties-card-display
feature/components-properties-filters-advanced
feature/components-leases-creation-wizard
feature/components-leases-rent-calculator
```

#### Comptabilité & Finances
```
feature/components-accounting-chart-performance
feature/components-accounting-export-pdf
feature/components-receipts-generator-template
feature/components-receipts-list-filters
```

#### Prestataires & Maintenance
```
feature/components-providers-search-filters
feature/components-providers-rating-system
feature/components-maintenance-ticket-form
feature/components-maintenance-status-tracker
```

#### Communications & Documents
```
feature/components-communications-email-template
feature/components-letters-generator-pdf
feature/components-documents-upload-manager
feature/components-notifications-toast-system
```

#### Marketing & TRI
```
feature/components-marketing-landing-hero
feature/components-tri-simulator-calculator
feature/components-offers-comparison-table
```

#### UI & Modales
```
feature/components-ui-buttons-styling
feature/components-ui-datepicker-range
feature/components-modals-confirmation-dialog
```

### **Pages** (pages applicatives)

#### Pages App
```
feature/pages-app-properties-list-view
feature/pages-app-properties-detail-tabs
feature/pages-app-leases-management-dashboard
feature/pages-app-accounting-overview
```

#### Pages Auth & Account
```
feature/pages-auth-login-oauth-integration
feature/pages-auth-register-validation
feature/pages-account-profile-settings
feature/pages-account-billing-subscription
```

#### Pages Dashboards
```
feature/pages-dashboards-owner-analytics
feature/pages-dashboards-financial-summary
```

#### Pages Settings
```
feature/pages-settings-preferences-notifications
feature/pages-settings-integrations-api-keys
```

#### Pages Marketing
```
feature/pages-marketing-landing-homepage
feature/pages-marketing-pricing-plans
```

### **Hooks** (hooks personnalisés)

#### Hooks Auth & Account
```
feature/hooks-auth-useAuth-token-refresh
feature/hooks-auth-useSession-persistence
feature/hooks-account-useProfile-update
```

#### Hooks Properties & Leasing
```
feature/hooks-properties-usePropertyCrud-operations
feature/hooks-properties-usePropertyProfitability-calculations
feature/hooks-leasing-useLeaseCalculations-rent
feature/hooks-leasing-useLeaseDocuments-generation
```

#### Hooks Accounting & Receipts
```
feature/hooks-accounting-useTransactions-filtering
feature/hooks-accounting-useCharts-data
feature/hooks-receipts-useReceiptGenerator-pdf
```

#### Hooks Providers & Maintenance
```
feature/hooks-providers-useProviderSearch-filters
feature/hooks-maintenance-useTicketStatus-tracker
```

#### Hooks Communications & Notifications
```
feature/hooks-communications-useEmailSender-smtp
feature/hooks-notifications-useToast-manager
```

#### Hooks UI & Analytics
```
feature/hooks-ui-useModal-state
feature/hooks-analytics-usePageTracking-events
```

### **Services** (services API)

```
feature/services-api-properties-endpoint
feature/services-bridge-bank-sync
feature/services-supabase-storage-upload
feature/services-stripe-payment-intent
```

### **Utils** (utilitaires)

```
feature/utils-validation-email-regex
feature/utils-validation-phone-format
feature/utils-calculations-profit-margin
feature/utils-formatting-currency-display
feature/utils-date-helpers-lease-periods
feature/utils-pdf-generator-receipts
```

### **Contexts** (contextes)

```
feature/contexts-entity-provider-multi-select
feature/contexts-auth-permissions-roles
feature/contexts-filters-advanced-search
feature/contexts-theme-dark-mode
```

### **Guards** (guards de navigation)

```
feature/guards-auth-protected-route
feature/guards-role-admin-access
feature/guards-subscription-premium-features
```

---

## 🔄 Processus de développement étape par étape

### **Pour une nouvelle feature :**

```bash
# 1. Mettre à jour develop
git checkout develop
git pull origin develop

# 2. Créer une nouvelle branche feature
git checkout -b feature/components-layout-sidebar-responsive

# 3. Développer et committer
git add .
git commit -m "Add responsive sidebar to layout"

# 4. Pousser la branche
git push origin feature/components-layout-sidebar-responsive

# 5. Créer une Pull Request sur GitHub
# → Vers : develop
# → Titre : "Add responsive sidebar to layout"
# → Description : Détails de la fonctionnalité

# 6. Après approval, merger dans develop
git checkout develop
git pull origin develop
git merge --no-ff feature/components-layout-sidebar-responsive
git push origin develop

# 7. Supprimer la branche locale et distante
git branch -d feature/components-layout-sidebar-responsive
git push origin --delete feature/components-layout-sidebar-responsive
```

---

### **Pour une correction de bug :**

```bash
# Processus similaire à une feature
git checkout develop
git checkout -b bugfix/components-forms-validation-crash
# ... corriger le bug ...
git push origin bugfix/components-forms-validation-crash
# Créer une PR vers develop
```

---

### **Pour une release :**

```bash
# 1. Créer la branche release
git checkout -b release/v1.2.0 develop

# 2. Bumper la version
npm version minor  # ou patch/major selon les changements

# 3. Finaliser la documentation

# 4. Pousser et créer les PRs
git push origin release/v1.2.0

# 5. PR 1 : vers main
# Après merge :
git checkout main
git pull origin main
git tag v1.2.0
git push origin v1.2.0

# 6. PR 2 : vers develop
# Après merge, nettoyer :
git push origin --delete release/v1.2.0
git branch -d release/v1.2.0
```

---

### **Pour un hotfix (urgence) :**

```bash
# 1. Créer à partir de main
git checkout -b hotfix/pages-app-leases-crash main

# 2. Corriger le bug
# ...

# 3. Bumper la version patch
npm version patch

# 4. Merger dans main avec tag
git checkout main
git merge hotfix/pages-app-leases-crash
git tag v1.2.1
git push origin main --tags

# 5. Merger dans develop
git checkout develop
git merge hotfix/pages-app-leases-crash
git push origin develop

# 6. Nettoyer
git branch -d hotfix/pages-app-leases-crash
git push origin --delete hotfix/pages-app-leases-crash
```

---

## 🛡️ Règles de protection des branches

Ces branches doivent être protégées sur GitHub :

### **main**
- ✅ Require pull request reviews (1+ reviewer)
- ✅ Require status checks to pass (tests, linting)
- ✅ Require branches to be up to date
- ✅ Include administrators (même les admins ne peuvent pas merger directement)
- ✅ Require linear history (no merge commits)

### **develop**
- ✅ Require pull request reviews (1+ reviewer)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ❌ Les merge commits sont acceptés (pour consolider les features)

---

## 📊 Versionning avec Semantic Versioning

Format : `MAJOR.MINOR.PATCH` (ex: v1.2.3)

- **MAJOR** : Changements incompatibles (breaking changes)
- **MINOR** : Nouvelles fonctionnalités compatibles
- **PATCH** : Corrections de bugs

**Exemples :**
```
v1.0.0 → v1.1.0 (feature)        # MINOR bump
v1.1.0 → v1.1.1 (hotfix)         # PATCH bump
v1.1.1 → v2.0.0 (breaking change) # MAJOR bump
```

---

## 📌 Checklist avant un merge

### **Avant de merger une feature/bugfix dans develop :**

- [ ] Code revu et approuvé
- [ ] Tests locaux passés
- [ ] Pas de conflits
- [ ] Commits bien nommés et atomiques
- [ ] Pas de `console.log` ou code dead
- [ ] Variables/imports inutilisés supprimés
- [ ] Respect de la convention de nommage des branches

### **Avant de créer une release :**

- [ ] Tous les tests passent
- [ ] La documentation est à jour
- [ ] Les release notes sont préparées
- [ ] La version est bumpée correctement

### **Avant un hotfix :**

- [ ] Le bug est confirmé en production
- [ ] La correction est minimale et isolée
- [ ] Tests de régression effectués

---

## 🚀 Déploiement et CI/CD

- **main** → Déployé en PRODUCTION automatiquement
- **develop** → Déployé en STAGING automatiquement
- **feature/* → Tests uniquement (ne pas déployer)

---

## ❓ FAQ

**Q : Je dois ajouter une feature urgente, par où commencer ?**
A : Partez de `develop`, créez une branche `feature/...` et suivez le processus normal.

**Q : J'ai trouvé un bug en production, que faire ?**
A : Créez une branche `hotfix/...` à partir de `main`, corrigez-le, puis mergez dans les deux (`main` ET `develop`).

**Q : Puis-je travailler directement sur develop ?**
A : Non, toujours créer une branche feature/bugfix/enhancement.

**Q : Comment gérer les conflits lors d'un merge ?**
A :
```bash
# Résoudre les conflits dans les fichiers
git add .
git commit -m "Resolve merge conflicts"
git push origin [branch-name]
```

**Q : À quelle fréquence faire des releases ?**
A : Selon votre cycle de déploiement (hebdomadaire, mensuel, etc.)

---

## 🔗 Commandes utiles

```bash
# Voir toutes les branches
git branch -a

# Voir les branches fusionnées
git branch --merged develop

# Voir les branches non fusionnées
git branch --no-merged develop

# Renommer une branche locale
git branch -m old-name new-name

# Supprimer une branche locale
git branch -d branch-name

# Supprimer une branche distante
git push origin --delete branch-name

# Voir les tags
git tag -l

# Voir les différences entre deux branches
git diff develop..feature/branch-name
```

---

## 📚 Ressources

- [Gitflow original (Vincent Driessen)](https://nvie.com/posts/a-successful-git-branching-model/)
- [Semantic Versioning](https://semver.org/fr/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Dernière mise à jour** : 11 décembre 2024
