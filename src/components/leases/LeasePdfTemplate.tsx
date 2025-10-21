import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Styles pour le bail
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
  article: {
    marginBottom: 15,
  },
  articleTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#475569',
  },
  articleText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#1e293b',
    textAlign: 'justify',
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
  },
  tableCol1: {
    width: '60%',
  },
  tableCol2: {
    width: '40%',
    textAlign: 'right',
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
    backgroundColor: '#dbeafe',
    padding: 10,
    marginBottom: 15,
    borderLeft: '3pt solid #2563eb',
    fontSize: 10,
  },
})

interface LeaseData {
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

  // Bail
  startDate: string
  duration: string // ex: "3 ans"
  rentAmount: number
  chargesAmount: number
  depositAmount: number

  // Dates
  issueDate: string
}

export function LeasePDFTemplate({ data }: { data: LeaseData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CONTRAT DE BAIL</Text>
          <Text style={styles.subtitle}>Location à usage d'habitation</Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 1 - Les Parties</Text>

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
              <Text style={styles.label}>Adresse actuelle :</Text>
              <Text style={styles.value}>{data.tenantAddress}</Text>
            </View>
          </View>
        </View>

        {/* Désignation du bien */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 2 - Désignation du bien loué</Text>

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
          </View>
        </View>

        {/* Durée */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 3 - Durée du bail</Text>
          <Text style={styles.articleText}>
            Le présent bail est conclu pour une durée de {data.duration}, prenant effet le {data.startDate}.
            Conformément à la loi, le bail se renouvellera automatiquement par tacite reconduction,
            sauf dénonciation par l'une des parties dans les conditions prévues par la loi.
          </Text>
        </View>

        {/* Loyer et charges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 4 - Loyer et charges</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>Désignation</Text>
              <Text style={styles.tableCol2}>Montant</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Loyer mensuel hors charges</Text>
              <Text style={styles.tableCol2}>{data.rentAmount.toFixed(2)} €</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Provision pour charges</Text>
              <Text style={styles.tableCol2}>{data.chargesAmount.toFixed(2)} €</Text>
            </View>
            <View style={{ ...styles.tableRow, backgroundColor: '#dbeafe', fontWeight: 'bold' }}>
              <Text style={styles.tableCol1}>Loyer charges comprises</Text>
              <Text style={styles.tableCol2}>{(data.rentAmount + data.chargesAmount).toFixed(2)} €</Text>
            </View>
          </View>

          <Text style={styles.articleText}>
            Le loyer est payable mensuellement à terme échu, le premier jour de chaque mois,
            par virement bancaire ou tout autre moyen de paiement convenu entre les parties.
          </Text>
        </View>

        {/* Dépôt de garantie */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 5 - Dépôt de garantie</Text>
          <View style={styles.highlight}>
            <Text>
              Le locataire verse au bailleur un dépôt de garantie d'un montant de {data.depositAmount.toFixed(2)} €
              lors de la remise des clés. Ce dépôt ne porte pas intérêt et sera restitué dans un délai
              maximum de deux mois après la restitution des clés, déduction faite des éventuelles
              sommes restant dues au bailleur.
            </Text>
          </View>
        </View>

        {/* Obligations */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 6 - Obligations du locataire</Text>
          <Text style={styles.articleText}>
            Le locataire s'engage à : (1) Payer le loyer et les charges aux échéances convenues ;
            (2) Jouir paisiblement des lieux loués et en prendre soin ; (3) Assurer le logement
            contre les risques locatifs ; (4) Ne pas transformer les lieux sans l'accord écrit du bailleur ;
            (5) Restituer les lieux en bon état à la fin du bail.
          </Text>
        </View>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 7 - Obligations du bailleur</Text>
          <Text style={styles.articleText}>
            Le bailleur s'engage à : (1) Délivrer au locataire un logement décent ;
            (2) Assurer au locataire la jouissance paisible du logement ;
            (3) Entretenir les locaux en état de servir à l'usage prévu par le contrat ;
            (4) Effectuer les réparations nécessaires autres que locatives.
          </Text>
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
          <Text>Ce contrat est soumis à la loi n° 89-462 du 6 juillet 1989</Text>
        </View>
      </Page>
    </Document>
  )
}
