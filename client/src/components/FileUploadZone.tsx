import { useCallback, useState } from "react";
import { Upload, FileJson, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUploadZone({ 
  onFileUpload, 
  accept = ".json",
  maxSizeMB = 5 
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [fileName, setFileName] = useState<string>("");

  const handleFile = useCallback((file: File) => {
    const maxSize = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSize) {
      setUploadStatus("error");
      setFileName(`File too large (max ${maxSizeMB}MB)`);
      return;
    }

    setFileName(file.name);
    setUploadStatus("success");
    onFileUpload(file);

    setTimeout(() => {
      setUploadStatus("idle");
      setFileName("");
    }, 3000);
  }, [maxSizeMB, onFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        min-h-48 rounded-none border-2 border-dashed transition-all duration-200
        flex flex-col items-center justify-center p-8 text-center
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
        ${uploadStatus === "success" ? 'border-chart-3 bg-chart-3/5' : ''}
        ${uploadStatus === "error" ? 'border-destructive bg-destructive/5' : ''}
      `}
      data-testid="zone-file-upload"
    >
      {uploadStatus === "idle" && (
        <>
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Upload Quiz Results</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop your JSON file here, or click to browse
          </p>
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            id="file-upload-input"
            data-testid="input-file-upload"
          />
          <label htmlFor="file-upload-input">
            <Button asChild variant="outline" data-testid="button-browse-file">
              <span>Browse Files</span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-4">
            Accepts {accept} files up to {maxSizeMB}MB
          </p>
        </>
      )}

      {uploadStatus === "success" && (
        <>
          <CheckCircle className="h-12 w-12 text-chart-3 mb-4" />
          <h3 className="font-semibold text-chart-3 mb-2">Upload Successful!</h3>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </>
      )}

      {uploadStatus === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="font-semibold text-destructive mb-2">Upload Failed</h3>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </>
      )}
    </div>
  );
}
