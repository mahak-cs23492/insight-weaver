import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (validTypes.includes(file.type) || hasValidExtension) {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert('Please upload a CSV or Excel file');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          'upload-zone relative rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer',
          isDragActive && 'upload-zone-active scale-[1.02]',
          isLoading && 'pointer-events-none opacity-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <p className="text-lg text-muted-foreground">Processing your data...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <FileSpreadsheet className="w-16 h-16 text-primary" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="w-12 h-12 text-primary" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground mb-2">
                Drop your data file here
              </p>
              <p className="text-muted-foreground">
                or click to browse
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                CSV
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                XLSX
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                XLS
              </span>
            </div>
          </div>
        )}

        {/* Glow effect */}
        {isDragActive && (
          <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse pointer-events-none" />
        )}
      </div>
    </div>
  );
}
