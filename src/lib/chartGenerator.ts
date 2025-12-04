import { ColumnSchema, ParsedData, getNumericValue } from './dataParser';

export type ChartType = 'bar' | 'line' | 'pie' | 'area';
export type AggregationType = 'sum' | 'average' | 'count';

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  labelColumn: string;
  valueColumn: string;
  aggregation: AggregationType;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

// Generate chart configurations based on data schema
export function generateChartConfigs(data: ParsedData): ChartConfig[] {
  const configs: ChartConfig[] = [];
  
  const categoricalCols = data.columns.filter(c => c.type === 'categorical');
  const numericalCols = data.columns.filter(c => c.type === 'numerical');
  const temporalCols = data.columns.filter(c => c.type === 'temporal');
  
  // Bar charts for categorical + numerical
  categoricalCols.slice(0, 2).forEach((catCol, idx) => {
    numericalCols.slice(0, 2).forEach((numCol, numIdx) => {
      configs.push({
        id: `bar-${idx}-${numIdx}`,
        type: 'bar',
        title: `${numCol.name} by ${catCol.name}`,
        labelColumn: catCol.name,
        valueColumn: numCol.name,
        aggregation: 'sum',
      });
    });
  });
  
  // Line charts for temporal + numerical
  if (temporalCols.length > 0) {
    const tempCol = temporalCols[0];
    numericalCols.slice(0, 2).forEach((numCol, idx) => {
      configs.push({
        id: `line-${idx}`,
        type: 'line',
        title: `${numCol.name} over Time`,
        labelColumn: tempCol.name,
        valueColumn: numCol.name,
        aggregation: 'sum',
      });
    });
  }
  
  // Pie chart for top categorical
  if (categoricalCols.length > 0 && numericalCols.length > 0) {
    configs.push({
      id: 'pie-0',
      type: 'pie',
      title: `${numericalCols[0].name} Distribution`,
      labelColumn: categoricalCols[0].name,
      valueColumn: numericalCols[0].name,
      aggregation: 'sum',
    });
  }
  
  // Area chart if we have temporal data
  if (temporalCols.length > 0 && numericalCols.length > 1) {
    configs.push({
      id: 'area-0',
      type: 'area',
      title: `${numericalCols[1].name} Trend`,
      labelColumn: temporalCols[0].name,
      valueColumn: numericalCols[1].name,
      aggregation: 'sum',
    });
  }
  
  // If no temporal data, use categorical for line/area
  if (temporalCols.length === 0 && categoricalCols.length > 0 && numericalCols.length > 0) {
    configs.push({
      id: 'line-cat-0',
      type: 'line',
      title: `${numericalCols[0].name} Comparison`,
      labelColumn: categoricalCols[0].name,
      valueColumn: numericalCols[0].name,
      aggregation: 'average',
    });
  }
  
  return configs.slice(0, 6); // Max 6 charts
}

// Aggregate data for a chart
export function aggregateChartData(
  rows: Record<string, unknown>[],
  labelColumn: string,
  valueColumn: string,
  aggregation: AggregationType
): ChartDataPoint[] {
  const grouped = new Map<string, number[]>();
  
  rows.forEach(row => {
    const label = String(row[labelColumn] ?? 'Unknown');
    const value = getNumericValue(row[valueColumn]);
    
    if (!grouped.has(label)) {
      grouped.set(label, []);
    }
    grouped.get(label)!.push(value);
  });
  
  const result: ChartDataPoint[] = [];
  
  grouped.forEach((values, label) => {
    let aggregatedValue: number;
    
    switch (aggregation) {
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0);
        break;
      case 'average':
        aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
    }
    
    result.push({ label, value: aggregatedValue });
  });
  
  // Sort by label for temporal data, by value for others
  return result.sort((a, b) => {
    // Try to parse as date
    const dateA = Date.parse(a.label);
    const dateB = Date.parse(b.label);
    
    if (!isNaN(dateA) && !isNaN(dateB)) {
      return dateA - dateB;
    }
    
    return b.value - a.value;
  }).slice(0, 20); // Limit to top 20 for readability
}

// Apply filters to data
export function filterData(
  rows: Record<string, unknown>[],
  filters: Record<string, (string | number)[]>
): Record<string, unknown>[] {
  if (Object.keys(filters).length === 0) return rows;
  
  return rows.filter(row => {
    return Object.entries(filters).every(([column, values]) => {
      if (values.length === 0) return true;
      const rowValue = String(row[column] ?? '');
      return values.map(String).includes(rowValue);
    });
  });
}

// Get color for chart
export function getChartColor(index: number): string {
  const colors = [
    'hsl(173, 80%, 40%)', // teal
    'hsl(38, 92%, 50%)',  // amber
    'hsl(350, 89%, 60%)', // rose
    'hsl(262, 83%, 58%)', // purple
    'hsl(142, 71%, 45%)', // green
    'hsl(199, 89%, 48%)', // sky
  ];
  return colors[index % colors.length];
}

// Get all chart colors
export function getChartColors(): string[] {
  return [
    'hsl(173, 80%, 40%)',
    'hsl(38, 92%, 50%)',
    'hsl(350, 89%, 60%)',
    'hsl(262, 83%, 58%)',
    'hsl(142, 71%, 45%)',
    'hsl(199, 89%, 48%)',
  ];
}
