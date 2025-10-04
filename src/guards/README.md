# Guards (Protection de routes)

Ce dossier contient les composants "guards" qui protègent les routes de l'application en fonction de l'état d'authentification et d'abonnement de l'utilisateur.

## Guards disponibles

### 1. `RequireAuth`

Vérifie que l'utilisateur est authentifié.

**Comportement :**
- Si l'utilisateur n'est **pas connecté** → redirige vers `/auth`
- Si l'utilisateur est **connecté** → autorise l'accès aux routes enfants

**Utilisation :**
```tsx
<Route element={<RequireAuth />}>
  <Route path="/app/dashboard" element={<Dashboard />} />
  {/* Toutes ces routes nécessitent d'être connecté */}
</Route>
```

---

### 2. `RequireSubscription`

Vérifie que l'utilisateur a un accès valide (abonnement actif OU période d'essai valide).

**Comportement :**
- Vérifie si l'utilisateur a :
  - Un **abonnement actif** (`subscription.subscribed = true` ou `status = "active"/"trialing"/"past_due"`)
  - OU une **période d'essai valide** (`trial_end_date` > aujourd'hui)
- Si **aucun accès valide** → redirige vers `/app/paywall`
- Si **accès valide** → autorise l'accès aux routes enfants

**Utilisation :**
```tsx
<Route element={<RequireAuth />}>
  <Route path="/app/paywall" element={<Paywall />} /> {/* Accessible même sans abonnement */}

  <Route element={<RequireSubscription />}>
    <Route path="/app/dashboard" element={<Dashboard />} />
    <Route path="/app/properties" element={<Properties />} />
    {/* Toutes ces routes nécessitent un abonnement ou trial valide */}
  </Route>
</Route>
```

---

## Hiérarchie des guards

Les guards peuvent être imbriqués pour créer une hiérarchie de protection :

```tsx
// Niveau 1 : Authentification requise
<Route element={<RequireAuth />}>

  // Niveau 2 : Routes accessibles même sans abonnement
  <Route path="/app/paywall" element={<Paywall />} />
  <Route path="/app/settings/billing" element={<Billing />} />

  // Niveau 3 : Abonnement requis
  <Route element={<RequireSubscription />}>
    <Route path="/app/dashboard" element={<Dashboard />} />
    <Route path="/app/properties" element={<Properties />} />
  </Route>

</Route>
```

---

## Validation de la période d'essai

La période d'essai est considérée comme **valide** si :
1. `profile.trial_end_date` existe
2. `trial_end_date` > date du jour (comparaison à minuit)

**Format de date accepté :**
- `YYYY-MM-DD` (ex: "2025-12-31")
- Timestamp ISO (ex: "2025-12-31T23:59:59Z")

---

## États de chargement

Les guards affichent un spinner pendant le chargement initial :
- Pendant que `initialized = false`
- Pendant que les données `profile` et `subscription` sont en cours de chargement

Cela évite les redirections prématurées avant que les données soient disponibles.

---

## Debugging

Pour déboguer les guards, vous pouvez :

1. Vérifier l'état d'authentification :
```tsx
const { user, profile, subscription, initialized } = useAuth();
console.log({ user, profile, subscription, initialized });
```

2. Vérifier les dates de trial :
```tsx
console.log('Trial end date:', profile?.trial_end_date);
console.log('Is trial valid:', trialEndMs > startOfDay(new Date()));
```

3. Vérifier l'état de l'abonnement :
```tsx
console.log('Subscription status:', subscription?.subscription_status);
console.log('Is subscribed:', subscription?.subscribed);
```

---

## Modification des guards

Si vous devez modifier la logique de validation, éditez directement les fichiers :
- `/src/guards/RequireAuth.tsx` - Pour la logique d'authentification
- `/src/guards/RequireSubscription.tsx` - Pour la logique d'abonnement

**Important :** Gardez les guards simples et dédiés à une seule responsabilité.
