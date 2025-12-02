import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { TriResult } from '@/lib/tri-calculator';
import type { TriFormData } from '@/lib/tri-schemas';

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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1e40af',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  resultCard: {
    width: '48%',
    padding: 10,
    backgroundColor: '#ffffff',
    border: '1pt solid #e2e8f0',
    borderRadius: 4,
  },
  resultLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  resultBadge: {
    fontSize: 8,
    marginTop: 4,
    padding: 3,
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: 2,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '50%',
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 9,
  },
  value: {
    width: '50%',
    color: '#1e293b',
    fontSize: 9,
  },
  table: {
    marginTop: 10,
    border: '1pt solid #e2e8f0',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #e2e8f0',
    backgroundColor: '#ffffff',
    fontSize: 8,
  },
  tableColYear: {
    width: '8%',
  },
  tableColSmall: {
    width: '10.2%',
    textAlign: 'right',
  },
  interpretation: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderLeft: '3pt solid #f59e0b',
    marginBottom: 15,
    fontSize: 9,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTop: '1pt solid #e2e8f0',
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fef2f2',
    borderLeft: '3pt solid #dc2626',
    fontSize: 8,
    lineHeight: 1.3,
  },
});

interface TRIPDFData {
  simulationName: string;
  generatedAt: string;
  inputs: TriFormData;
  results: TriResult;
}

const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)} %`;
};

export const TRIPDFTemplate = ({ data }: { data: TRIPDFData }) => {
  const { simulationName, generatedAt, inputs, results } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>ANALYSE TRI - INVESTISSEMENT IMMOBILIER</Text>
          <Text style={styles.subtitle}>{simulationName}</Text>
          <Text style={styles.subtitle}>Généré le {generatedAt}</Text>
        </View>

        {/* Résultats principaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs clés</Text>
          <View style={styles.resultGrid}>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>TRI Annuel</Text>
              <Text style={styles.resultValue}>
                {isNaN(results.irrAnnual) ? 'N/A' : formatPercentage(results.irrAnnual)}
              </Text>
              <Text style={styles.resultBadge}>
                {isNaN(results.irrAnnual)
                  ? 'Non calculable'
                  : results.irrAnnual > inputs.discountRate
                  ? 'Projet viable'
                  : 'À reconsidérer'}
              </Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>VAN / NPV</Text>
              <Text style={styles.resultValue}>{formatCurrency(results.npv)}</Text>
              <Text style={styles.resultBadge}>
                Actualisation: {formatPercentage(inputs.discountRate)}
              </Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Cash-flow Année 1</Text>
              <Text style={styles.resultValue}>
                {formatCurrency(results.cashflowYear1Annual)}
              </Text>
              <Text style={styles.resultBadge}>
                {formatCurrency(results.cashflowYear1Monthly)}/mois
              </Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Payback</Text>
              <Text style={styles.resultValue}>
                {results.paybackYear ? `${results.paybackYear} ans` : 'Non atteint'}
              </Text>
              <Text style={styles.resultBadge}>Récupération investissement</Text>
            </View>
          </View>
        </View>

        {/* Interprétation */}
        <View style={styles.interpretation}>
          <Text>{results.interpretation}</Text>
        </View>

        {/* Hypothèses d'investissement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hypothèses d'investissement</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Prix d'acquisition :</Text>
            <Text style={styles.value}>{formatCurrency(inputs.acquisitionPrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Frais de notaire :</Text>
            <Text style={styles.value}>{formatCurrency(inputs.notaryFees)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Apport personnel :</Text>
            <Text style={styles.value}>{formatCurrency(inputs.downPayment)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Loyer mensuel :</Text>
            <Text style={styles.value}>
              {formatCurrency(inputs.rentsFrequency === 'monthly' ? inputs.rents : inputs.rents / 12)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Charges mensuelles :</Text>
            <Text style={styles.value}>
              {formatCurrency(inputs.chargesFrequency === 'monthly' ? inputs.charges : inputs.charges / 12)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Durée de détention :</Text>
            <Text style={styles.value}>{inputs.holdingPeriodYears} ans</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Valeur de revente :</Text>
            <Text style={styles.value}>{formatCurrency(inputs.resaleValue)}</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>
            ⚠️ Simulation indicative – non constitutive d'un conseil fiscal
          </Text>
          <Text>
            Les calculs sont basés sur les données saisies et les hypothèses retenues. Les résultats
            ne constituent pas un conseil en investissement. Consultez un conseiller fiscal pour
            votre situation personnelle.
          </Text>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>Document généré automatiquement par BailoGenius</Text>
        </View>
      </Page>

      {/* Page 2: Tableau détaillé */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PROJECTION ANNUELLE DÉTAILLÉE</Text>
          <Text style={styles.subtitle}>{simulationName}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableColYear}>An</Text>
            <Text style={styles.tableColSmall}>Loyers</Text>
            <Text style={styles.tableColSmall}>Charges</Text>
            <Text style={styles.tableColSmall}>Intérêts</Text>
            <Text style={styles.tableColSmall}>Travaux</Text>
            <Text style={styles.tableColSmall}>Amortis.</Text>
            <Text style={styles.tableColSmall}>IR</Text>
            <Text style={styles.tableColSmall}>PS</Text>
            <Text style={styles.tableColSmall}>Cash-flow</Text>
          </View>

          {results.rows.slice(0, 25).map((row) => (
            <View key={row.year} style={styles.tableRow}>
              <Text style={styles.tableColYear}>{row.year}</Text>
              <Text style={styles.tableColSmall}>{formatCurrency(row.rents)}</Text>
              <Text style={styles.tableColSmall}>{formatCurrency(row.charges)}</Text>
              <Text style={styles.tableColSmall}>{formatCurrency(row.interests)}</Text>
              <Text style={styles.tableColSmall}>{formatCurrency(row.works)}</Text>
              <Text style={styles.tableColSmall}>{formatCurrency(row.amortizations)}</Text>
              <Text style={styles.tableColSmall}>{formatCurrency(row.incomeTax)}</Text>
              <Text style={styles.tableColSmall}>{formatCurrency(row.socialTax)}</Text>
              <Text style={[styles.tableColSmall, { fontWeight: 'bold', color: row.cashflow >= 0 ? '#16a34a' : '#dc2626' }]}>
                {formatCurrency(row.cashflow)}
              </Text>
            </View>
          ))}
        </View>

        {results.rows.length > 25 && (
          <Text style={{ fontSize: 8, marginTop: 10, color: '#64748b', textAlign: 'center' }}>
            {results.rows.length - 25} années supplémentaires non affichées
          </Text>
        )}

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>Document généré automatiquement par BailoGenius</Text>
        </View>
      </Page>
    </Document>
  );
};
