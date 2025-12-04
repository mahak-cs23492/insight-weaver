import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  Share2, 
  Eye, 
  Loader2, 
  Calendar,
  FileSpreadsheet,
  Globe,
  Lock,
  Copy
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SavedDashboard {
  id: string;
  name: string;
  file_name: string;
  row_count: number;
  is_public: boolean;
  share_id: string | null;
  created_at: string;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [dashboards, setDashboards] = useState<SavedDashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboards();
    }
  }, [user]);

  const fetchDashboards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_dashboards')
      .select('id, name, file_name, row_count, is_public, share_id, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load dashboards');
    } else {
      setDashboards(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('saved_dashboards')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete dashboard');
    } else {
      toast.success('Dashboard deleted');
      setDashboards(dashboards.filter(d => d.id !== id));
    }
  };

  const togglePublic = async (dashboard: SavedDashboard) => {
    const newIsPublic = !dashboard.is_public;
    const newShareId = newIsPublic && !dashboard.share_id 
      ? crypto.randomUUID().slice(0, 8) 
      : dashboard.share_id;

    const { error } = await supabase
      .from('saved_dashboards')
      .update({ 
        is_public: newIsPublic,
        share_id: newShareId
      })
      .eq('id', dashboard.id);

    if (error) {
      toast.error('Failed to update sharing settings');
    } else {
      toast.success(newIsPublic ? 'Dashboard is now public' : 'Dashboard is now private');
      fetchDashboards();
    }
  };

  const copyShareLink = (shareId: string) => {
    const url = `${window.location.origin}/shared/${shareId}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Dashboards</h1>
            <p className="text-muted-foreground mt-1">
              Manage your saved visualizations
            </p>
          </div>
          <Button onClick={() => navigate('/')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create New
          </Button>
        </div>

        {dashboards.length === 0 ? (
          <Card className="glass-card border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No dashboards yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload a spreadsheet to create your first visualization
              </p>
              <Button onClick={() => navigate('/')}>
                Create Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <Card key={dashboard.id} className="glass-card border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {dashboard.file_name}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={dashboard.is_public ? "default" : "secondary"}>
                      {dashboard.is_public ? (
                        <Globe className="w-3 h-3 mr-1" />
                      ) : (
                        <Lock className="w-3 h-3 mr-1" />
                      )}
                      {dashboard.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-4 h-4" />
                      {dashboard.row_count.toLocaleString()} rows
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(dashboard.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/view/${dashboard.id}`)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublic(dashboard)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>

                    {dashboard.is_public && dashboard.share_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyShareLink(dashboard.share_id!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Dashboard?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your dashboard.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(dashboard.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
