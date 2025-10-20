import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Styles basiques pour la quittance
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 40,
    textAlign: 'center',
    borderBottom: '2pt solid #2563eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e40af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    width: '60%',
    color: '#1e293b',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
    border: '1pt solid #e2e8f0',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottom: '1pt solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  tableCol1: {
    width: '60%',
  },
  tableCol2: {
    width: '40%',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#dbeafe',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1e40af',
  },
  footer: {
    marginTop: 50,
    paddingTop: 20,
    borderTop: '1pt solid #e2e8f0',
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  signature: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '40%',
  },
  signatureLabel: {
    fontSize: 11,
    marginBottom: 50,
    fontWeight: 'bold',
    color: '#475569',
  },
  signatureLine: {
    borderTop: '1.5pt solid #94a3b8',
    marginTop: 5,
  },
  declaration: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderLeft: '3pt solid #f59e0b',
    marginBottom: 20,
    fontSize: 10.5,
    lineHeight: 1.5,
  },
})

interface ReceiptData {
  // Période
  month: string
  year: string

  // Propriétaire (vous)
  landlordName: string
  landlordAddress: string

  // Locataire
  tenantName: string
  tenantAddress: string

  // Bien
  propertyAddress: string
  unitNumber: string

  // Montants
  rentAmount: number
  chargesAmount: number
  totalAmount: number

  // Dates
  issueDate: string
  periodStart: string
  periodEnd: string
}

export const ReceiptPDFTemplate = ({ data }: { data: ReceiptData }) => {
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>QUITTANCE DE LOYER</Text>
          <Text style={styles.subtitle}>
            Période : {data.month} {data.year}
          </Text>
        </View>

        {/* Informations Propriétaire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propriétaire</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom :</Text>
            <Text style={styles.value}>{data.landlordName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adresse :</Text>
            <Text style={styles.value}>{data.landlordAddress}</Text>
          </View>
        </View>

        {/* Informations Locataire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locataire</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom :</Text>
            <Text style={styles.value}>{data.tenantName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adresse :</Text>
            <Text style={styles.value}>{data.tenantAddress}</Text>
          </View>
        </View>

        {/* Informations Logement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logement loué</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Adresse :</Text>
            <Text style={styles.value}>{data.propertyAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Logement :</Text>
            <Text style={styles.value}>{data.unitNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Période :</Text>
            <Text style={styles.value}>
              Du {data.periodStart} au {data.periodEnd}
            </Text>
          </View>
        </View>

        {/* Détail des montants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail du paiement</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>Désignation</Text>
              <Text style={styles.tableCol2}>Montant</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Loyer</Text>
              <Text style={styles.tableCol2}>{formatCurrency(data.rentAmount)}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Charges</Text>
              <Text style={styles.tableCol2}>{formatCurrency(data.chargesAmount)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.tableCol1}>TOTAL</Text>
              <Text style={styles.tableCol2}>{formatCurrency(data.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Déclaration */}
        <View style={styles.declaration}>
          <Text>
            Le propriétaire soussigné reconnaît avoir reçu du locataire la somme de{' '}
            <Text style={{ fontWeight: 'bold' }}>{formatCurrency(data.totalAmount)}</Text> au titre
            du loyer et des charges pour la période du {data.periodStart} au {data.periodEnd}.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le locataire</Text>
            <View style={styles.signatureLine} />
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le propriétaire</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>Fait à _____________, le {data.issueDate}</Text>
          <Text style={{ marginTop: 10, fontSize: 9 }}>
            Document généré automatiquement par BailoGenius
          </Text>
        </View>
      </Page>
    </Document>
  )
}
