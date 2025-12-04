import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dashboard } from '@/components/Dashboard';
import { Header } from '@/components/Header';
import { ColumnSchema, ParsedData } from '@/lib/dataParser';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ViewDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user && id) {
      fetchDashboard();
    }
  }, [user, authLoading, id, navigate]);

  const fetchDashboard = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('saved_dashboards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .maybeSingle();

    if (error || !data) {
      toast.error('Dashboard not found');
      navigate('/my-dashboards');
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
    setLoading(false);
  };

  const handleReset = () => {
    navigate('/my-dashboards');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!parsedData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <Dashboard
          data={parsedData}
          columns={columns}
          onReset={handleReset}
        />
      </main>
    </div>
  );
}
