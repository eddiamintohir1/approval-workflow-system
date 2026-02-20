import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  workflowId: string;
  onUploadComplete?: () => void;
}

export function FileUpload({ workflowId, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const utils = trpc.useUtils();

  const { data: files, isLoading: filesLoading } = trpc.workflows.getFiles.useQuery(
    { workflowId },
    { enabled: !!workflowId }
  );

  const uploadFile = trpc.workflows.uploadFile.useMutation({
    onSuccess: () => {
      toast.success("File uploaded successfully");
      utils.workflows.getFiles.invalidate({ workflowId });
      onUploadComplete?.();
      setUploading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload file");
      setUploading(false);
    },
  });

  const deleteFile = trpc.workflows.deleteFile.useMutation({
    onSuccess: () => {
      toast.success("File deleted successfully");
      utils.workflows.getFiles.invalidate({ workflowId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete file");
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      await handleFiles(droppedFiles);
    },
    [workflowId]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    await handleFiles(Array.from(selectedFiles));
    e.target.value = ""; // Reset input
  };

  const handleFiles = async (filesToUpload: File[]) => {
    setUploading(true);

    for (const file of filesToUpload) {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1]; // Remove data:image/png;base64, prefix

        uploadFile.mutate({
          workflowId,
          filename: file.name,
          fileData: base64Data,
          mimeType: file.type,
          fileSize: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteFile.mutate({ fileId });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or click to browse
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="fileInput"
            disabled={uploading}
          />
          <label htmlFor="fileInput">
            <Button variant="outline" disabled={uploading} asChild>
              <span>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Files
                  </>
                )}
              </span>
            </Button>
          </label>
        </CardContent>
      </Card>

      {/* Files List */}
      {filesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : files && files.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploaded Files ({files.length})</h3>
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)} • Uploaded{" "}
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.s3Url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                    disabled={deleteFile.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No files uploaded yet
        </p>
      )}
    </div>
  );
}
