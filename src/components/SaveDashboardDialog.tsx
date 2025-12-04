import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { ParsedData, ColumnSchema } from '@/lib/dataParser';
import { Json } from '@/integrations/supabase/types';

interface SaveDashboardDialogProps {
  data: ParsedData;
  columns: ColumnSchema[];
}

export function SaveDashboardDialog({ data, columns }: SaveDashboardDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(data.fileName.replace(/\.[^/.]+$/, ''));
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save dashboards');
      navigate('/auth');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a name for your dashboard');
      return;
    }

    setSaving(true);
    
    const shareId = isPublic ? crypto.randomUUID().slice(0, 8) : null;

    const { error } = await supabase
      .from('saved_dashboards')
      .insert({
        user_id: user.id,
        name: name.trim(),
        file_name: data.fileName,
        columns: columns as unknown as Json,
        data: data.rows as unknown as Json,
        row_count: data.rowCount,
        is_public: isPublic,
        share_id: shareId,
      });

    setSaving(false);

    if (error) {
      toast.error('Failed to save dashboard');
    } else {
      toast.success('Dashboard saved successfully!');
      setOpen(false);
      navigate('/my-dashboards');
    }
  };

  if (!user) {
    return (
      <Button onClick={() => navigate('/auth')} variant="outline" className="gap-2">
        <Save className="w-4 h-4" />
        Sign in to Save
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Save className="w-4 h-4" />
          Save Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Dashboard</DialogTitle>
          <DialogDescription>
            Save this visualization to access it later or share it with others.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dashboard Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Dashboard"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public">Make Public</Label>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
