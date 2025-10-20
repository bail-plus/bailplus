export const useMetrics = (reportData: any, months: number) => {
  const hasMonthlyData = reportData && reportData.monthlyData.length > 0;
  const hasExpensesData = reportData && reportData.expensesByCategory.length > 0;

  const averageYield = reportData && reportData.totalRent > 0
    ? ((reportData.totalRent / months) / (reportData.totalRent / 12 * 12) * 100).toFixed(1)
    : "0.0";

  const monthlyTrend = reportData && hasMonthlyData
    ? reportData.monthlyData[reportData.monthlyData.length - 1].income - reportData.monthlyData[Math.max(0, reportData.monthlyData.length - 2)].income
    : 0;

  const trendPercentage = reportData && hasMonthlyData && reportData.monthlyData[Math.max(0, reportData.monthlyData.length - 2)].income > 0
    ? ((monthlyTrend / reportData.monthlyData[Math.max(0, reportData.monthlyData.length - 2)].income) * 100).toFixed(1)
    : "0";

  return {
    hasMonthlyData,
    hasExpensesData,
    averageYield,
    monthlyTrend,
    trendPercentage
  }
}