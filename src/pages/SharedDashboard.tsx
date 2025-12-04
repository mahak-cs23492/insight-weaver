import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dashboard } from '@/components/Dashboard';
import { Header } from '@/components/Header';
import { ColumnSchema, ParsedData } from '@/lib/dataParser';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SharedDashboard() {
  const { shareId } = useParams<{ shareId: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);
  const [dashboardName, setDashboardName] = useState('');

  useEffect(() => {
    if (shareId) {
      fetchDashboard();
    }
  }, [shareId]);

  const fetchDashboard = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('saved_dashboards')
      .select('*')
      .eq('share_id', shareId)
      .eq('is_public', true)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const columnsData = data.columns as unknown as ColumnSchema[];
    const rowData = data.data as unknown as Record<string, unknown>[];

    setParsedData({
      rows: rowData,
      columns: columnsData,
      rowCount: data.row_count,
      fileName: data.file_name,
    });
    setColumns(columnsData);
    setDashboardName(data.name);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-8 flex items-center justify-center min-h-[60vh]">
          <Card className="glass-card border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 px-12">
              <div className="p-4 rounded-full bg-destructive/10 mb-4">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Dashboard Not Found</h3>
              <p className="text-muted-foreground text-center">
                This dashboard doesn't exist or is no longer public.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{dashboardName}</h1>
          <p className="text-muted-foreground">Shared dashboard</p>
        </div>
        {parsedData && (
          <Dashboard
            data={parsedData}
            columns={columns}
            onReset={() => {}}
            readOnly
          />
        )}
      </main>
    </div>
  );
}
