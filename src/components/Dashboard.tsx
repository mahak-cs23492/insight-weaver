import { useState, useMemo } from 'react';
import { ParsedData, ColumnSchema } from '@/lib/dataParser';
import {
  ChartConfig,
  generateChartConfigs,
  aggregateChartData,
  filterData,
} from '@/lib/chartGenerator';
import { ChartCard } from './ChartCard';
import { FilterSidebar } from './FilterSidebar';
import { StatsCards } from './StatsCards';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DashboardProps {
  data: ParsedData;
  columns: ColumnSchema[];
  onReset: () => void;
}

export function Dashboard({ data, columns, onReset }: DashboardProps) {
  const [filters, setFilters] = useState<Record<string, (string | number)[]>>({});
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>(() =>
    generateChartConfigs({ ...data, columns })
  );

  const filteredRows = useMemo(
    () => filterData(data.rows, filters),
    [data.rows, filters]
  );

  const chartData = useMemo(() => {
    const result: Record<string, ReturnType<typeof aggregateChartData>> = {};
    chartConfigs.forEach(config => {
      result[config.id] = aggregateChartData(
        filteredRows,
        config.labelColumn,
        config.valueColumn,
        config.aggregation
      );
    });
    return result;
  }, [filteredRows, chartConfigs]);

  const handleFilterChange = (column: string, values: (string | number)[]) => {
    setFilters(prev => ({ ...prev, [column]: values }));
  };

  const handleClearFilters = () => {
    setFilters({});
    toast.success('All filters cleared');
  };

  const handleConfigChange = (updatedConfig: ChartConfig) => {
    setChartConfigs(prev =>
      prev.map(c => (c.id === updatedConfig.id ? updatedConfig : c))
    );
  };

  const handleExportAll = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      columns.map(c => c.name).join(',') + '\n' +
      filteredRows.map(row => 
        columns.map(c => String(row[c.name] ?? '')).join(',')
      ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${data.fileName.replace(/\.[^.]+$/, '')}_filtered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data exported successfully');
  };

  return (
    <div className="flex gap-6 animate-fade-in">
      {/* Filter Sidebar */}
      <FilterSidebar
        columns={columns}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{data.fileName}</h1>
            <p className="text-muted-foreground mt-1">
              Showing {filteredRows.length.toLocaleString()} of {data.rowCount.toLocaleString()} rows
              {Object.keys(filters).length > 0 && ' (filtered)'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportAll}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              New File
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards data={data} filteredRows={filteredRows} columns={columns} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartConfigs.map((config, idx) => (
            <ChartCard
              key={config.id}
              config={config}
              data={chartData[config.id] || []}
              onConfigChange={handleConfigChange}
              className={`animate-slide-up opacity-0 stagger-${(idx % 4) + 1}`}
            />
          ))}
        </div>

        {chartConfigs.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">
              No suitable columns found for visualization.
              Please ensure your data has at least one categorical and one numerical column.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
