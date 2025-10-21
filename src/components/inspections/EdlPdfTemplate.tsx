import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Styles pour l'état des lieux
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottom: '2pt solid #2563eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 4,
    border: '1pt solid #e2e8f0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '35%',
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    width: '65%',
    color: '#1e293b',
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
    border: '1pt solid #e2e8f0',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1pt solid #e2e8f0',
    minHeight: 40,
  },
  tableCol1: {
    width: '40%',
  },
  tableCol2: {
    width: '30%',
  },
  tableCol3: {
    width: '30%',
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 10,
    marginBottom: 50,
    fontWeight: 'bold',
    color: '#475569',
  },
  signatureLine: {
    borderTop: '1.5pt solid #94a3b8',
    marginTop: 5,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1pt solid #e2e8f0',
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
  highlight: {
    backgroundColor: '#fef3c7',
    padding: 10,
    marginBottom: 15,
    borderLeft: '3pt solid #f59e0b',
    fontSize: 10,
  },
})

interface EDLData {
  // Type
  type: 'ENTREE' | 'SORTIE'

  // Propriétaire
  landlordName: string
  landlordAddress: string

  // Locataire
  tenantName: string
  tenantAddress: string

  // Bien
  propertyAddress: string
  unitNumber: string
  unitType: string
  surface: number

  // Dates
  inspectionDate: string
  issueDate: string
}

interface Room {
  name: string
  items: string[]
}

const ROOMS: Room[] = [
  {
    name: 'Entrée / Couloir',
    items: ['Murs', 'Plafond', 'Sol', 'Porte d\'entrée', 'Interphone', 'Éclairage']
  },
  {
    name: 'Séjour',
    items: ['Murs', 'Plafond', 'Sol', 'Fenêtres', 'Volets/Stores', 'Prises électriques', 'Éclairage']
  },
  {
    name: 'Cuisine',
    items: ['Murs', 'Plafond', 'Sol', 'Fenêtre', 'Évier', 'Robinetterie', 'Plaques de cuisson', 'Four', 'Hotte', 'Placards', 'Prises électriques']
  },
  {
    name: 'Chambre 1',
    items: ['Murs', 'Plafond', 'Sol', 'Fenêtre', 'Volets/Stores', 'Placards', 'Prises électriques', 'Éclairage']
  },
  {
    name: 'Salle de bain',
    items: ['Murs', 'Plafond', 'Sol', 'Fenêtre', 'Lavabo', 'Baignoire/Douche', 'Robinetterie', 'WC', 'Miroir', 'Prises électriques']
  },
]

export function EDLPDFTemplate({ data }: { data: EDLData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ÉTAT DES LIEUX</Text>
          <Text style={styles.subtitle}>{data.type === 'ENTREE' ? 'Entrée dans les lieux' : 'Sortie des lieux'}</Text>
        </View>

        {/* Type */}
        <View style={styles.highlight}>
          <Text style={{ fontWeight: 'bold' }}>
            {data.type === 'ENTREE'
              ? '✓ État des lieux d\'ENTRÉE - Établi lors de la remise des clés au locataire'
              : '✓ État des lieux de SORTIE - Établi lors de la restitution des clés par le locataire'}
          </Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties Concernées</Text>

          <View style={styles.infoBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#1e40af' }}>Le Bailleur</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nom :</Text>
              <Text style={styles.value}>{data.landlordName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Adresse :</Text>
              <Text style={styles.value}>{data.landlordAddress}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#1e40af' }}>Le Locataire</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nom :</Text>
              <Text style={styles.value}>{data.tenantName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Adresse :</Text>
              <Text style={styles.value}>{data.tenantAddress}</Text>
            </View>
          </View>
        </View>

        {/* Désignation du bien */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Désignation du Logement</Text>

          <View style={styles.infoBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Adresse :</Text>
              <Text style={styles.value}>{data.propertyAddress}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Logement :</Text>
              <Text style={styles.value}>{data.unitNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Type :</Text>
              <Text style={styles.value}>{data.unitType}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Surface :</Text>
              <Text style={styles.value}>{data.surface} m²</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date de visite :</Text>
              <Text style={styles.value}>{data.inspectionDate}</Text>
            </View>
          </View>
        </View>

        {/* Description pièce par pièce */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description Détaillée</Text>

          {ROOMS.map((room, index) => (
            <View key={index} style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#1e40af' }}>
                {room.name}
              </Text>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableCol1}>Élément</Text>
                  <Text style={styles.tableCol2}>État</Text>
                  <Text style={styles.tableCol3}>Observations</Text>
                </View>

                {room.items.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCol1}>{item}</Text>
                    <Text style={styles.tableCol2}>_____________</Text>
                    <Text style={styles.tableCol3}>_____________</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </Page>

      {/* Page 2 - Suite et signatures */}
      <Page size="A4" style={styles.page}>
        {/* Équipements et clés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Équipements et Clés</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>Élément</Text>
              <Text style={styles.tableCol2}>Quantité</Text>
              <Text style={styles.tableCol3}>Observations</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Clés du logement</Text>
              <Text style={styles.tableCol2}>_____________</Text>
              <Text style={styles.tableCol3}>_____________</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Clés de boîte aux lettres</Text>
              <Text style={styles.tableCol2}>_____________</Text>
              <Text style={styles.tableCol3}>_____________</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Badge d'accès</Text>
              <Text style={styles.tableCol2}>_____________</Text>
              <Text style={styles.tableCol3}>_____________</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Télécommande portail</Text>
              <Text style={styles.tableCol2}>_____________</Text>
              <Text style={styles.tableCol3}>_____________</Text>
            </View>
          </View>
        </View>

        {/* Relevés compteurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relevés des Compteurs</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>Type</Text>
              <Text style={styles.tableCol2}>Index</Text>
              <Text style={styles.tableCol3}>Observations</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Électricité</Text>
              <Text style={styles.tableCol2}>_____________</Text>
              <Text style={styles.tableCol3}>_____________</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Gaz</Text>
              <Text style={styles.tableCol2}>_____________</Text>
              <Text style={styles.tableCol3}>_____________</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Eau froide</Text>
              <Text style={styles.tableCol2}>_____________</Text>
              <Text style={styles.tableCol3}>_____________</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Eau chaude</Text>
              <Text style={styles.tableCol2}>_____________</Text>
              <Text style={styles.tableCol3}>_____________</Text>
            </View>
          </View>
        </View>

        {/* Observations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observations Générales</Text>
          <View style={{ border: '1pt solid #e2e8f0', padding: 10, minHeight: 80 }}>
            <Text style={{ fontSize: 9, color: '#64748b' }}>
              Espace pour noter toute observation particulière...
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Bailleur</Text>
            <Text>Fait à ________________</Text>
            <Text>Le {data.issueDate}</Text>
            <View style={styles.signatureLine} />
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Locataire</Text>
            <Text>Fait à ________________</Text>
            <Text>Le {data.issueDate}</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Document généré le {data.issueDate}</Text>
          <Text>État des lieux établi contradictoirement entre les parties</Text>
        </View>
      </Page>
    </Document>
  )
}
