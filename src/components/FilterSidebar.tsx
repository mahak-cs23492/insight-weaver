import { useState } from 'react';
import { ColumnSchema } from '@/lib/dataParser';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  columns: ColumnSchema[];
  filters: Record<string, (string | number)[]>;
  onFilterChange: (column: string, values: (string | number)[]) => void;
  onClearFilters: () => void;
}

export function FilterSidebar({
  columns,
  filters,
  onFilterChange,
  onClearFilters,
}: FilterSidebarProps) {
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());

  const categoricalColumns = columns.filter(c => c.type === 'categorical' && c.uniqueValues);
  const activeFilterCount = Object.values(filters).flat().length;

  const toggleExpanded = (columnName: string) => {
    setExpandedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnName)) {
        next.delete(columnName);
      } else {
        next.add(columnName);
      }
      return next;
    });
  };

  const toggleValue = (columnName: string, value: string | number) => {
    const currentValues = filters[columnName] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFilterChange(columnName, newValues);
  };

  if (categoricalColumns.length === 0) {
    return null;
  }

  return (
    <aside className="w-72 glass-card rounded-2xl p-4 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {categoricalColumns.map(column => {
          const isExpanded = expandedColumns.has(column.name);
          const selectedCount = (filters[column.name] || []).length;
          const values = column.uniqueValues || [];

          return (
            <div
              key={column.name}
              className="border border-border/50 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleExpanded(column.name)}
                className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">{column.name}</span>
                  {selectedCount > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                      {selectedCount}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 max-h-48 overflow-y-auto space-y-1">
                  {values.slice(0, 20).map(value => {
                    const isChecked = (filters[column.name] || []).includes(value);
                    return (
                      <label
                        key={String(value)}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                          'hover:bg-secondary/50',
                          isChecked && 'bg-primary/10'
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleValue(column.name, value)}
                          className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="text-sm text-foreground truncate">{String(value)}</span>
                      </label>
                    );
                  })}
                  {values.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{values.length - 20} more values
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
