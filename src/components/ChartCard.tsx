import { useState } from 'react';
import { BarChart2, LineChart as LineIcon, PieChart as PieIcon, TrendingUp, Download, MoreVertical } from 'lucide-react';
import { ChartConfig, ChartDataPoint, AggregationType, ChartType } from '@/lib/chartGenerator';
import { BarChartComponent } from './charts/BarChartComponent';
import { LineChartComponent } from './charts/LineChartComponent';
import { PieChartComponent } from './charts/PieChartComponent';
import { AreaChartComponent } from './charts/AreaChartComponent';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  config: ChartConfig;
  data: ChartDataPoint[];
  onConfigChange: (config: ChartConfig) => void;
  className?: string;
}

const chartIcons: Record<ChartType, React.ReactNode> = {
  bar: <BarChart2 className="w-4 h-4" />,
  line: <LineIcon className="w-4 h-4" />,
  pie: <PieIcon className="w-4 h-4" />,
  area: <TrendingUp className="w-4 h-4" />,
};

export function ChartCard({ config, data, onConfigChange, className }: ChartCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleAggregationChange = (value: AggregationType) => {
    onConfigChange({ ...config, aggregation: value });
  };

  const handleTypeChange = (value: ChartType) => {
    onConfigChange({ ...config, type: value });
  };

  const handleExport = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Label,Value\n' +
      data.map(row => `${row.label},${row.value}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${config.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderChart = () => {
    const chartProps = { data, title: config.title };
    
    switch (config.type) {
      case 'bar':
        return <BarChartComponent {...chartProps} />;
      case 'line':
        return <LineChartComponent {...chartProps} />;
      case 'pie':
        return <PieChartComponent {...chartProps} />;
      case 'area':
        return <AreaChartComponent {...chartProps} />;
      default:
        return <BarChartComponent {...chartProps} />;
    }
  };

  return (
    <div
      className={cn(
        'glass-card rounded-2xl overflow-hidden transition-all duration-300',
        isHovered && 'ring-2 ring-primary/20',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-primary/10 text-primary">
            {chartIcons[config.type]}
          </span>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{config.title}</h3>
            <p className="text-xs text-muted-foreground">
              {data.length} data points • {config.aggregation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={config.aggregation} onValueChange={handleAggregationChange}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">Sum</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="count">Count</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleTypeChange('bar')}>
                <BarChart2 className="w-4 h-4 mr-2" /> Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange('line')}>
                <LineIcon className="w-4 h-4 mr-2" /> Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange('pie')}>
                <PieIcon className="w-4 h-4 mr-2" /> Pie Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange('area')}>
                <TrendingUp className="w-4 h-4 mr-2" /> Area Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 p-4">
        {data.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
