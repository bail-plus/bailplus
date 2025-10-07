# 📄 Génération de Quittances - Documentation

## ✅ Fonctionnalités implémentées

### 1. Interface de sélection
- **Sélection du bien** : Liste déroulante de tous vos biens
- **Sélection du logement** : Charge automatiquement les logements du bien choisi
- **Affichage du bail actif** : Montre automatiquement les infos du locataire et les montants
- **Sélection de la période** : Mois et année avec valeurs par défaut

### 2. Génération PDF automatique
- **Design professionnel** : Template moderne avec couleurs bleues
- **Données automatiques** : Toutes les infos sont remplies depuis la BDD
- **Téléchargement direct** : Le PDF se télécharge automatiquement
- **Nommage intelligent** : `quittance_2025_01_Dupont.pdf`

### 3. Informations incluses
- ✅ Données du propriétaire (depuis votre profil)
- ✅ Données du locataire (depuis contacts)
- ✅ Adresse du bien et du logement
- ✅ Montants : Loyer, Charges, Total
- ✅ Période exacte (1er au dernier jour du mois)
- ✅ Date d'émission
- ✅ Espaces pour signatures

### 4. Sécurités
- ✅ Détection des doublons (empêche de créer 2x la même quittance)
- ✅ Gestion des valeurs nulles (charges, adresses, etc.)
- ✅ Validation des données avant génération
- ✅ Enregistrement dans la BDD (`rent_invoices`)

## 🎨 Personnalisation du PDF

Le template est dans : `src/components/receipt-pdf-template.tsx`

### Modifier les couleurs
```typescript
// En-tête
borderBottom: '2pt solid #2563eb', // Ligne bleue

// Titre
color: '#1e40af', // Bleu foncé

// Tableau
backgroundColor: '#2563eb', // En-tête bleu
backgroundColor: '#dbeafe', // Total bleu clair
```

### Modifier les sections
Tu peux ajouter/supprimer des sections facilement :
```typescript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Nouveau Titre</Text>
  <View style={styles.row}>
    <Text style={styles.label}>Label :</Text>
    <Text style={styles.value}>Valeur</Text>
  </View>
</View>
```

### Ajouter un logo
```typescript
import { Image } from '@react-pdf/renderer'

// Dans le header
<Image
  src="/path/to/logo.png"
  style={{ width: 100, height: 50, marginBottom: 10 }}
/>
```

## 🔧 Configuration

### Informations du propriétaire
Les infos sont automatiquement chargées depuis ta table `profiles` :
- Prénom et nom
- Adresse complète (rue, code postal, ville)

**Pour mettre à jour** : Modifie ton profil dans l'interface (à créer) ou directement dans Supabase.

### Informations manquantes
Si des infos sont manquantes dans ton profil :
- Le PDF affichera "Propriétaire non renseigné"
- Pense à compléter ton profil dans la BDD

## 📁 Structure des fichiers

```
src/components/
├── receipt-generator-modal.tsx  # Modal de sélection
├── receipt-pdf-template.tsx     # Template du PDF
└── ...

src/pages/
└── Documents.tsx                # Page qui utilise le modal
```

## 🚀 Comment utiliser

1. **Aller dans "Documents"**
2. **Cliquer sur "Générer"**
3. **Sélectionner "Quittance de loyer"**
4. **Choisir un bien** dans la liste
5. **Choisir un logement** (les infos du bail s'affichent)
6. **Choisir la période** (mois/année)
7. **Cliquer sur "Générer la quittance"**
8. Le PDF se télécharge automatiquement ! 🎉

## 📊 Base de données

### Tables utilisées
- `properties` : Liste des biens
- `units` : Logements par bien
- `leases` : Baux actifs
- `contacts` : Informations des locataires
- `profiles` : Informations du propriétaire
- `rent_invoices` : Historique des quittances

### Requêtes effectuées
1. Charge tous les biens de l'utilisateur
2. Charge les logements du bien sélectionné
3. Récupère le bail actif du logement
4. Récupère les infos du locataire
5. Récupère le profil du propriétaire
6. Crée l'enregistrement de la quittance

## 🎯 Améliorations futures possibles

### Upload dans Supabase Storage
```typescript
// Après génération du PDF
const fileName = `quittances/${lease.id}_${selectedYear}_${selectedMonth}.pdf`
const { data, error } = await supabase.storage
  .from('documents')
  .upload(fileName, blob)

// Puis mettre à jour rent_invoices.pdf_url
```

### Envoi par email
- Utiliser Supabase Edge Functions
- Intégrer un service d'emailing (Resend, SendGrid, etc.)
- Attacher le PDF généré

### Génération en masse
- Bouton "Générer toutes les quittances du mois"
- Boucle sur tous les baux actifs
- Télécharge un ZIP avec tous les PDFs

### Aperçu avant téléchargement
```typescript
import { PDFViewer } from '@react-pdf/renderer'

// Dans un modal
<PDFViewer width="100%" height="600px">
  <ReceiptPDFTemplate data={receiptData} />
</PDFViewer>
```

## 🐛 Debugging

### Problème : "Aucun bail actif"
- Vérifier que le statut du bail est bien `'active'`
- Vérifier que `unit_id` correspond bien

### Problème : PDF ne se télécharge pas
- Vérifier la console pour les erreurs
- Vérifier que toutes les données sont présentes
- Tester avec des données simplifiées

### Problème : Informations manquantes
- Vérifier les données dans Supabase
- S'assurer que les relations entre tables sont correctes
- Vérifier les permissions RLS

## 📝 Notes importantes

- Les quittances sont enregistrées dans `rent_invoices` avec statut `'pending'`
- Le champ `pdf_url` n'est pas encore rempli (prévu pour upload Supabase Storage)
- Les doublons sont détectés par `lease_id + period_month + period_year`
- Format de date français : `DD/MM/YYYY`
- Montants en euros avec 2 décimales

## 💡 Tips

1. **Personnaliser les couleurs** selon ta charte graphique
2. **Ajouter des mentions légales** dans le footer
3. **Inclure un numéro de quittance** pour le suivi
4. **Ajouter un QR code** pour vérification
5. **Multilangue** si tu loues à l'international

---

Créé avec ❤️ et @react-pdf/renderer
