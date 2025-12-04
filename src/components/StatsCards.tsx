import { useMemo } from 'react';
import { ParsedData, ColumnSchema, getNumericValue } from '@/lib/dataParser';
import { TrendingUp, Hash, Layers, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  data: ParsedData;
  filteredRows: Record<string, unknown>[];
  columns: ColumnSchema[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass: string;
  delay: number;
}

function StatCard({ icon, label, value, subValue, colorClass, delay }: StatCardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl p-5 animate-slide-up opacity-0',
        `stagger-${delay}`
      )}
      style={{ animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>
        <span className={cn('p-2.5 rounded-lg', colorClass)}>
          {icon}
        </span>
      </div>
    </div>
  );
}

export function StatsCards({ data, filteredRows, columns }: StatsCardsProps) {
  const stats = useMemo(() => {
    const numericalCols = columns.filter(c => c.type === 'numerical');
    const categoricalCols = columns.filter(c => c.type === 'categorical');
    
    // Calculate sum of first numerical column
    let totalSum = 0;
    let avgValue = 0;
    let sumLabel = 'Total Value';
    
    if (numericalCols.length > 0) {
      const col = numericalCols[0];
      sumLabel = `Total ${col.name}`;
      totalSum = filteredRows.reduce((sum, row) => sum + getNumericValue(row[col.name]), 0);
      avgValue = filteredRows.length > 0 ? totalSum / filteredRows.length : 0;
    }

    // Count unique categories
    let uniqueCategories = 0;
    let categoryLabel = 'Unique Categories';
    
    if (categoricalCols.length > 0) {
      const col = categoricalCols[0];
      categoryLabel = `Unique ${col.name}`;
      const unique = new Set(filteredRows.map(row => String(row[col.name])));
      uniqueCategories = unique.size;
    }

    return {
      totalRows: filteredRows.length,
      totalSum,
      avgValue,
      uniqueCategories,
      sumLabel,
      categoryLabel,
      columnCount: columns.length,
    };
  }, [filteredRows, columns]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Layers className="w-5 h-5 text-chart-1" />}
        label="Total Rows"
        value={formatNumber(stats.totalRows)}
        subValue={`of ${data.rowCount.toLocaleString()}`}
        colorClass="bg-chart-1/10"
        delay={1}
      />
      <StatCard
        icon={<TrendingUp className="w-5 h-5 text-chart-2" />}
        label={stats.sumLabel}
        value={formatNumber(stats.totalSum)}
        subValue={`Avg: ${formatNumber(stats.avgValue)}`}
        colorClass="bg-chart-2/10"
        delay={2}
      />
      <StatCard
        icon={<Hash className="w-5 h-5 text-chart-3" />}
        label={stats.categoryLabel}
        value={stats.uniqueCategories}
        colorClass="bg-chart-3/10"
        delay={3}
      />
      <StatCard
        icon={<Calendar className="w-5 h-5 text-chart-4" />}
        label="Columns"
        value={stats.columnCount}
        subValue={`${columns.filter(c => c.type === 'numerical').length} numerical`}
        colorClass="bg-chart-4/10"
        delay={4}
      />
    </div>
  );
}
