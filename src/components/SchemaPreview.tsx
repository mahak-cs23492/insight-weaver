import { ColumnSchema, ColumnType } from '@/lib/dataParser';
import { Calendar, Hash, Type, HelpCircle, Check, Edit2 } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SchemaPreviewProps {
  columns: ColumnSchema[];
  rowCount: number;
  fileName: string;
  onConfirm: (columns: ColumnSchema[]) => void;
}

const typeIcons: Record<ColumnType, React.ReactNode> = {
  categorical: <Type className="w-4 h-4" />,
  numerical: <Hash className="w-4 h-4" />,
  temporal: <Calendar className="w-4 h-4" />,
  unknown: <HelpCircle className="w-4 h-4" />,
};

const typeLabels: Record<ColumnType, string> = {
  categorical: 'Category',
  numerical: 'Number',
  temporal: 'Date',
  unknown: 'Unknown',
};

const typeColors: Record<ColumnType, string> = {
  categorical: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  numerical: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  temporal: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  unknown: 'bg-muted text-muted-foreground border-border',
};

export function SchemaPreview({ columns, rowCount, fileName, onConfirm }: SchemaPreviewProps) {
  const [editedColumns, setEditedColumns] = useState<ColumnSchema[]>(columns);
  const [isEditing, setIsEditing] = useState(false);

  const handleTypeChange = (columnName: string, newType: ColumnType) => {
    setEditedColumns(prev =>
      prev.map(col =>
        col.name === columnName ? { ...col, type: newType } : col
      )
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Data Schema</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {fileName} • {rowCount.toLocaleString()} rows • {columns.length} columns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Types'}
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(editedColumns)}
            className="bg-primary hover:bg-primary/90"
          >
            <Check className="w-4 h-4 mr-2" />
            Generate Dashboard
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {editedColumns.map((column, idx) => (
          <div
            key={column.name}
            className={cn(
              'flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50',
              'animate-slide-up opacity-0'
            )}
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-foreground font-medium">{column.name}</span>
              {column.type === 'numerical' && column.min !== undefined && (
                <span className="text-xs text-muted-foreground">
                  Range: {column.min.toLocaleString()} - {column.max?.toLocaleString()}
                </span>
              )}
              {column.type === 'categorical' && column.uniqueValues && (
                <span className="text-xs text-muted-foreground">
                  {column.uniqueValues.length} unique values
                </span>
              )}
            </div>

            {isEditing ? (
              <Select
                value={column.type}
                onValueChange={(value) => handleTypeChange(column.name, value as ColumnType)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="categorical">Category</SelectItem>
                  <SelectItem value="numerical">Number</SelectItem>
                  <SelectItem value="temporal">Date</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border',
                  typeColors[column.type]
                )}
              >
                {typeIcons[column.type]}
                {typeLabels[column.type]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
