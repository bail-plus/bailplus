import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Styles pour la lettre de relance
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 40,
  },
  landlordInfo: {
    marginBottom: 30,
    fontSize: 10,
    lineHeight: 1.5,
  },
  tenantInfo: {
    marginTop: 40,
    marginBottom: 40,
    fontSize: 10,
    lineHeight: 1.5,
    marginLeft: 'auto',
    width: '50%',
  },
  dateLocation: {
    marginBottom: 30,
    fontSize: 10,
    textAlign: 'right',
  },
  subject: {
    marginBottom: 30,
    fontWeight: 'bold',
    fontSize: 11,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#dc2626',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paragraph: {
    marginBottom: 15,
    lineHeight: 1.8,
    textAlign: 'justify',
  },
  highlight: {
    backgroundColor: '#fef2f2',
    padding: 15,
    marginVertical: 20,
    borderLeft: '3pt solid #dc2626',
  },
  table: {
    marginVertical: 20,
    border: '1pt solid #e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 10,
    fontWeight: 'bold',
    borderBottom: '1pt solid #e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1pt solid #e5e7eb',
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '50%',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fee2e2',
    fontWeight: 'bold',
  },
  signature: {
    marginTop: 40,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#6b7280',
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
})

interface UnpaidPeriod {
  month: string
  year: number
  amount: number
}

interface LetterData {
  // Type de relance
  letterType: '1' | '2' | '3' // 1ère relance, 2ème relance, Mise en demeure

  // Propriétaire
  landlordName: string
  landlordAddress: string

  // Locataire
  tenantName: string
  tenantAddress: string

  // Bien
  propertyAddress: string
  unitNumber: string

  // Impayés
  unpaidPeriods: UnpaidPeriod[]
  totalAmount: number

  // Dates
  issueDate: string
  dueDate: string // Date limite de paiement
}

export function LetterPDFTemplate({ data }: { data: LetterData }) {
  const getTitle = () => {
    switch (data.letterType) {
      case '1':
        return 'PREMIÈRE RELANCE - IMPAYÉ DE LOYER'
      case '2':
        return 'DEUXIÈME RELANCE - IMPAYÉ DE LOYER'
      case '3':
        return 'MISE EN DEMEURE - DERNIER AVERTISSEMENT'
      default:
        return 'RELANCE - IMPAYÉ DE LOYER'
    }
  }

  const getGreeting = () => {
    switch (data.letterType) {
      case '1':
        return 'Madame, Monsieur,'
      case '2':
        return 'Madame, Monsieur,'
      case '3':
        return 'Madame, Monsieur,'
      default:
        return 'Madame, Monsieur,'
    }
  }

  const getIntroText = () => {
    switch (data.letterType) {
      case '1':
        return `Je me permets de vous contacter car je constate que le paiement du loyer concernant votre logement situé ${data.propertyAddress} (${data.unitNumber}) n'a pas été réceptionné à ce jour.`
      case '2':
        return `Suite à ma première relance restée sans réponse, je constate que le paiement du loyer concernant votre logement situé ${data.propertyAddress} (${data.unitNumber}) n'a toujours pas été effectué.`
      case '3':
        return `Malgré mes précédentes relances, je constate que le paiement du loyer concernant votre logement situé ${data.propertyAddress} (${data.unitNumber}) n'a toujours pas été réceptionné.`
    }
  }

  const getMainText = () => {
    switch (data.letterType) {
      case '1':
        return `Il s'agit peut-être d'un simple oubli de votre part. Je vous serais donc reconnaissant de bien vouloir régulariser cette situation dans les meilleurs délais, et au plus tard le ${data.dueDate}.`
      case '2':
        return `Cette situation devient préoccupante et je vous demande de régulariser votre situation de toute urgence, et au plus tard le ${data.dueDate}. À défaut, je me verrai contraint d'engager des poursuites.`
      case '3':
        return `Par la présente, je vous mets formellement en demeure de procéder au règlement immédiat de la somme totale due, et ce au plus tard le ${data.dueDate}. À défaut de paiement dans ce délai, je me verrai contraint d'engager une procédure judiciaire à votre encontre, sans autre préavis.`
    }
  }

  const getClosing = () => {
    switch (data.letterType) {
      case '1':
        return `Je reste à votre disposition pour toute question ou difficulté que vous pourriez rencontrer. N'hésitez pas à me contacter pour trouver ensemble une solution amiable.`
      case '2':
        return `Je vous invite vivement à me contacter dans les plus brefs délais afin de régulariser cette situation et d'éviter des procédures plus contraignantes.`
      case '3':
        return `Cette mise en demeure vaut dernier avertissement avant l'engagement de poursuites judiciaires. Je vous rappelle que les frais de justice viendront s'ajouter aux sommes déjà dues.`
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête - Coordonnées du bailleur */}
        <View style={styles.landlordInfo}>
          <Text style={styles.bold}>{data.landlordName}</Text>
          <Text>{data.landlordAddress}</Text>
        </View>

        {/* Coordonnées du locataire */}
        <View style={styles.tenantInfo}>
          <Text style={styles.bold}>{data.tenantName}</Text>
          <Text>{data.tenantAddress}</Text>
        </View>

        {/* Date et lieu */}
        <View style={styles.dateLocation}>
          <Text>Le {data.issueDate}</Text>
        </View>

        {/* Objet */}
        <View style={styles.subject}>
          <Text>Objet : {data.letterType === '3' ? 'Mise en demeure - ' : ''}Impayé de loyer</Text>
          {data.letterType === '3' && (
            <Text style={{ marginTop: 5, color: '#dc2626' }}>Lettre recommandée avec accusé de réception</Text>
          )}
        </View>

        {/* Titre */}
        <View>
          <Text style={styles.title}>{getTitle()}</Text>
        </View>

        {/* Corps de la lettre */}
        <View>
          <Text style={styles.paragraph}>{getGreeting()}</Text>

          <Text style={styles.paragraph}>{getIntroText()}</Text>

          {/* Tableau des impayés */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>Période</Text>
              <Text style={styles.tableCol2}>Montant dû</Text>
            </View>
            {data.unpaidPeriods.map((period, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCol1}>
                  {period.month} {period.year}
                </Text>
                <Text style={styles.tableCol2}>{period.amount.toFixed(2)} €</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.tableCol1}>TOTAL DÛ</Text>
              <Text style={styles.tableCol2}>{data.totalAmount.toFixed(2)} €</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>{getMainText()}</Text>

          {data.letterType === '3' && (
            <View style={styles.highlight}>
              <Text style={styles.bold}>MISE EN DEMEURE</Text>
              <Text style={{ marginTop: 10 }}>
                Vous disposez d'un délai jusqu'au {data.dueDate} pour régler la totalité des sommes dues.
                Passé ce délai, une procédure judiciaire sera engagée sans autre préavis, conformément
                aux dispositions légales en vigueur.
              </Text>
            </View>
          )}

          <Text style={styles.paragraph}>{getClosing()}</Text>

          <Text style={styles.paragraph}>
            Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text>{data.landlordName}</Text>
          <Text style={{ marginTop: 40 }}>Signature : _____________________</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Document généré le {data.issueDate}</Text>
          {data.letterType === '3' && (
            <Text style={{ marginTop: 3, color: '#dc2626' }}>
              ⚠ Cette mise en demeure doit être envoyée en recommandé avec accusé de réception
            </Text>
          )}
        </View>
      </Page>
    </Document>
  )
}
