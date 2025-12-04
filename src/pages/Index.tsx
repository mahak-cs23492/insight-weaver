import { useState } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { SchemaPreview } from '@/components/SchemaPreview';
import { Dashboard } from '@/components/Dashboard';
import { parseDataFile, ParsedData, ColumnSchema } from '@/lib/dataParser';
import { toast } from 'sonner';
import { BarChart3, Zap, Filter, Download } from 'lucide-react';

type AppState = 'upload' | 'preview' | 'dashboard';

const Index = () => {
  const [state, setState] = useState<AppState>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const data = await parseDataFile(file);
      setParsedData(data);
      setColumns(data.columns);
      setState('preview');
      toast.success(`Successfully parsed ${data.rowCount.toLocaleString()} rows`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSchema = (updatedColumns: ColumnSchema[]) => {
    setColumns(updatedColumns);
    setState('dashboard');
  };

  const handleReset = () => {
    setState('upload');
    setParsedData(null);
    setColumns([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {state === 'upload' && (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-5xl font-bold mb-4">
                <span className="gradient-text">Transform Data</span>
                <br />
                <span className="text-foreground">Into Insights</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload your spreadsheet and watch as AI automatically generates
                beautiful, interactive visualizations in seconds.
              </p>
            </div>

            {/* Upload Section */}
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Auto Detection"
                description="Smart algorithms identify data types and suggest the best visualizations"
                delay={1}
              />
              <FeatureCard
                icon={<Filter className="w-6 h-6" />}
                title="Dynamic Filtering"
                description="Slice and dice your data with interactive filters that update in real-time"
                delay={2}
              />
              <FeatureCard
                icon={<Download className="w-6 h-6" />}
                title="Export Ready"
                description="Download charts and filtered data for presentations and reports"
                delay={3}
              />
            </div>
          </div>
        )}

        {state === 'preview' && parsedData && (
          <div className="max-w-4xl mx-auto">
            <SchemaPreview
              columns={columns}
              rowCount={parsedData.rowCount}
              fileName={parsedData.fileName}
              onConfirm={handleConfirmSchema}
            />
          </div>
        )}

        {state === 'dashboard' && parsedData && (
          <Dashboard
            data={parsedData}
            columns={columns}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-6 animate-slide-up opacity-0 stagger-${delay}`}
      style={{ animationFillMode: 'forwards' }}
    >
      <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export default Index;
